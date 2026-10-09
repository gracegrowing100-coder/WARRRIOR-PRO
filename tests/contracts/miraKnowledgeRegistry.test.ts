import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createMiraKnowledgeRegistry,
  getMiraKnowledgeModuleById,
  getMiraKnowledgeModulesByLanguage,
  getMiraKnowledgeModulesByTopic,
  MIRA_KNOWLEDGE_MODULES,
  MIRA_KNOWLEDGE_REVIEW_STATUS,
  MIRA_SAFETY_CATEGORIES,
  MiraClinicalValidationError,
  validateMiraKnowledgeModule,
} from '../../server/mira/knowledge';

const EXPECTED_MODULES = [
  'scd_basics',
  'vaso_occlusive_pain',
  'fever_infection',
  'hydration',
  'acute_chest_breathing',
  'neurological_warning',
  'hydroxyurea_education',
  'emergency_warning_signs',
] as const;

function patientFacingContent(moduleId: string): string {
  const module = getMiraKnowledgeModuleById(moduleId);
  if (!module) throw new Error(`Missing test module: ${moduleId}`);
  return [...module.educationalPoints, ...module.allowedSelfCareGuidance].join(' ');
}

describe('Mira H4A clinical knowledge registry', () => {
  it('contains exactly the eight approved versioned modules', () => {
    expect(MIRA_KNOWLEDGE_MODULES.map((module) => module.id)).toEqual(EXPECTED_MODULES);
    expect(MIRA_KNOWLEDGE_MODULES).toHaveLength(8);
    expect(MIRA_KNOWLEDGE_MODULES.every((module) => module.version === '1.0.0')).toBe(true);
  });

  it('validates every module against the H1 contract', () => {
    for (const module of MIRA_KNOWLEDGE_MODULES) {
      expect(validateMiraKnowledgeModule(module)).toEqual(module);
    }
  });

  it('rejects duplicate module IDs while constructing a registry', () => {
    expect(() => createMiraKnowledgeRegistry([
      MIRA_KNOWLEDGE_MODULES[0],
      MIRA_KNOWLEDGE_MODULES[0],
    ])).toThrowError(MiraClinicalValidationError);
  });

  it('uses at least one traceable HTTPS source per module', () => {
    for (const module of MIRA_KNOWLEDGE_MODULES) {
      expect(module.sourceRefs.length).toBeGreaterThan(0);
      for (const source of module.sourceRefs) {
        expect(source.url).toMatch(/^https:\/\//);
        expect(source.title).not.toBe('');
        expect(source.organization).not.toBe('');
      }
    }
  });

  it('keeps all candidate content English-only pending human language review', () => {
    expect(MIRA_KNOWLEDGE_MODULES.every((module) => (
      module.languages.length === 1 && module.languages[0] === 'en'
    ))).toBe(true);
    expect(getMiraKnowledgeModulesByLanguage('en')).toHaveLength(8);
    expect(getMiraKnowledgeModulesByLanguage('pcm')).toEqual([]);
  });

  it('uses truthful pending-review governance metadata without clinician approval claims', () => {
    for (const module of MIRA_KNOWLEDGE_MODULES) {
      expect(module.reviewedBy).toBe(MIRA_KNOWLEDGE_REVIEW_STATUS);
      expect(module.reviewedBy).toBe('research-curated-pending-clinical-review');
      expect(module.reviewedAt).toBe('2026-10-08');
    }
  });

  it('does not introduce a universal hydration quantity', () => {
    const content = patientFacingContent('hydration');
    expect(content).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:litres?|liters?|ml|millilitres?|glasses?|cups?)\b/i);
  });

  it('preserves the unresolved fever-threshold conflict without choosing a number', () => {
    const content = patientFacingContent('fever_infection');
    expect(content).toContain('thresholds differ');
    expect(content).not.toMatch(/\b(?:38(?:\.0|\.5)?|101\.3)\b/);
  });

  it('keeps hydroxyurea content educational and does not prescribe treatment changes', () => {
    const content = patientFacingContent('hydroxyurea_education');
    expect(content).toContain('must not be doubled');
    expect(content).not.toMatch(/\b(?:start|stop|select|change) (?:your |the )?(?:hydroxyurea |medicine )?dose\b/i);
    expect(getMiraKnowledgeModuleById('hydroxyurea_education')?.prohibitedClaims).toContain(
      'Do not start, stop, select, or change a hydroxyurea dose.',
    );
  });

  it('links modules only to existing H3 safety categories', () => {
    const validCategories = new Set<string>(MIRA_SAFETY_CATEGORIES);
    for (const module of MIRA_KNOWLEDGE_MODULES) {
      for (const category of module.escalationCategories) {
        expect(validCategories.has(category)).toBe(true);
      }
    }
  });

  it('supports topic lookup and fails closed for unknown module IDs', () => {
    expect(getMiraKnowledgeModulesByTopic('scd_basics').map((module) => module.id)).toEqual([
      'scd_basics',
    ]);
    expect(getMiraKnowledgeModulesByTopic('acute_chest').map((module) => module.id)).toEqual([
      'acute_chest_breathing',
      'emergency_warning_signs',
    ]);
    expect(getMiraKnowledgeModuleById('unknown_module')).toBeUndefined();
  });

  it('is not imported by Mira runtime routes or providers', () => {
    const runtimeFiles = [
      '../../server/mira/miraRoutes.ts',
      '../../server/mira/miraProvider.ts',
      '../../server/mira/miraGeminiProvider.ts',
      '../../server/mira/miraVoiceProvider.ts',
      '../../server/mira/miraYarnGptProvider.ts',
    ];

    for (const file of runtimeFiles) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      expect(source).not.toContain('knowledge/registry');
      expect(source).not.toContain('MIRA_KNOWLEDGE_MODULES');
    }
  });
});
