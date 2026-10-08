import { describe, expect, it } from 'vitest';
import {
  MIRA_CLINICAL_LIMITS,
  MiraClinicalValidationError,
  validateMiraClinicalResult,
  validateMiraContextValue,
  validateMiraKnowledgeModule,
  validateMiraKnowledgeModules,
  validateMiraKnowledgeRetrievalInput,
} from '../../server/mira/knowledge';

const syntheticKnowledgeModule = {
  id: 'synthetic-education',
  version: '1.0.0',
  title: 'Synthetic education fixture',
  topics: ['scd_basics'],
  languages: ['en'],
  risk: 'low',
  reviewedAt: '2026-01-01',
  reviewedBy: 'Synthetic reviewer',
  sourceRefs: [{
    title: 'Synthetic test reference',
    organization: 'Example test organization',
    publicationDate: '2025-12-01',
    jurisdiction: 'Test only',
    url: 'https://example.test/synthetic-reference',
  }],
  educationalPoints: ['Synthetic educational point for contract testing.'],
  allowedSelfCareGuidance: ['Synthetic self-care boundary for contract testing.'],
  prohibitedClaims: ['Synthetic prohibited claim for contract testing.'],
  escalationCategories: ['synthetic-escalation-category'],
};

const syntheticClinicalResult = {
  reply: 'Synthetic reply used only to validate the contract.',
  intent: 'education',
  topic: 'scd_basics',
  urgency: 'none',
  guidance: ['Synthetic guidance item.'],
  followUpQuestions: ['Synthetic follow-up question?'],
  patientContextUsed: [{
    key: 'profile.syntheticField',
    provenance: 'patient-entered',
    recordedAt: '2026-01-01T10:00:00Z',
    freshness: 'current',
  }],
  escalationRecommended: false,
  escalationReason: '',
  knowledgeModuleIds: ['synthetic-education'],
  disclaimer: 'mira-ai-not-clinician',
  model: 'synthetic-model',
};

function expectValidationError(run: () => unknown, code?: string) {
  try {
    run();
    throw new Error('Expected validation to fail.');
  } catch (error) {
    expect(error).toBeInstanceOf(MiraClinicalValidationError);
    if (code) expect(error).toMatchObject({ code });
  }
}

describe('Mira hematology foundation contracts', () => {
  it('accepts a valid synthetic knowledge module', () => {
    expect(validateMiraKnowledgeModule(syntheticKnowledgeModule)).toMatchObject({
      id: 'synthetic-education',
      version: '1.0.0',
      topics: ['scd_basics'],
      languages: ['en'],
    });
  });

  it('rejects an unknown clinical topic', () => {
    expectValidationError(() => validateMiraKnowledgeModule({
      ...syntheticKnowledgeModule,
      topics: ['unknown_topic'],
    }), 'invalid_enum');
  });

  it('rejects an invalid language', () => {
    expectValidationError(() => validateMiraKnowledgeModule({
      ...syntheticKnowledgeModule,
      languages: ['zz'],
    }), 'invalid_enum');
    expectValidationError(() => validateMiraKnowledgeRetrievalInput({
      topic: 'scd_basics',
      language: 'zz',
      maxModules: 1,
    }), 'invalid_enum');
  });

  it('rejects malformed module IDs and versions', () => {
    expectValidationError(() => validateMiraKnowledgeModule({
      ...syntheticKnowledgeModule,
      id: '../unsafe',
    }), 'invalid_format');
    expectValidationError(() => validateMiraKnowledgeModule({
      ...syntheticKnowledgeModule,
      version: 'latest',
    }), 'invalid_format');
  });

  it('rejects malformed source references', () => {
    expectValidationError(() => validateMiraKnowledgeModule({
      ...syntheticKnowledgeModule,
      sourceRefs: [{
        title: 'Synthetic test reference',
        organization: 'Example test organization',
        url: 'http://example.test/not-https',
      }],
    }), 'invalid_format');
  });

  it('requires the fixed disclaimer exactly', () => {
    expectValidationError(() => validateMiraClinicalResult({
      ...syntheticClinicalResult,
      disclaimer: 'different-disclaimer',
    }), 'invalid_enum');
  });

  it('rejects unknown module IDs against an allowed set', () => {
    expectValidationError(() => validateMiraClinicalResult(syntheticClinicalResult, {
      allowedKnowledgeModuleIds: new Set(['some-other-module']),
    }), 'unknown_reference');
  });

  it('rejects duplicate module IDs in registries and structured results', () => {
    expectValidationError(() => validateMiraKnowledgeModules([
      syntheticKnowledgeModule,
      { ...syntheticKnowledgeModule },
    ]), 'duplicate_value');
    expectValidationError(() => validateMiraClinicalResult({
      ...syntheticClinicalResult,
      knowledgeModuleIds: ['synthetic-education', 'synthetic-education'],
    }), 'duplicate_value');
  });

  it('rejects missing provenance for non-null patient context', () => {
    expectValidationError(() => validateMiraContextValue({
      value: 'synthetic patient value',
      storageState: 'recorded',
      freshness: 'current',
    }), 'invalid_enum');
  });

  it('preserves stale context as stale', () => {
    expect(validateMiraContextValue({
      value: 'synthetic patient value',
      provenance: 'patient-maintained',
      storageState: 'cached',
      freshness: 'stale',
    })).toMatchObject({ value: 'synthetic patient value', freshness: 'stale' });
  });

  it('keeps missing context null and missing', () => {
    expect(validateMiraContextValue({
      value: null,
      provenance: 'patient-entered',
      storageState: 'missing',
      freshness: 'unknown',
    })).toEqual({
      value: null,
      provenance: 'patient-entered',
      storageState: 'missing',
      recordedAt: undefined,
      freshness: 'unknown',
    });
  });

  it('rejects a malformed structured result', () => {
    expectValidationError(() => validateMiraClinicalResult({
      ...syntheticClinicalResult,
      escalationRecommended: 'no',
    }), 'invalid_type');
    expectValidationError(() => validateMiraClinicalResult({
      ...syntheticClinicalResult,
      intent: 'unknown_intent',
    }), 'invalid_enum');
    expectValidationError(() => validateMiraClinicalResult({
      ...syntheticClinicalResult,
      urgency: 'unknown_urgency',
    }), 'invalid_enum');
  });

  it('rejects more than two follow-up questions', () => {
    expectValidationError(() => validateMiraClinicalResult({
      ...syntheticClinicalResult,
      followUpQuestions: ['One?', 'Two?', 'Three?'],
    }), 'array_too_large');
  });

  it('rejects oversized arrays and strings', () => {
    expectValidationError(() => validateMiraClinicalResult({
      ...syntheticClinicalResult,
      guidance: Array.from({ length: MIRA_CLINICAL_LIMITS.guidanceItems + 1 }, (_, index) => `Item ${index}`),
    }), 'array_too_large');
    expectValidationError(() => validateMiraClinicalResult({
      ...syntheticClinicalResult,
      reply: 'x'.repeat(MIRA_CLINICAL_LIMITS.replyChars + 1),
    }), 'string_too_long');
  });

  it('accepts a valid synthetic structured result against the allowed module set', () => {
    expect(validateMiraClinicalResult(syntheticClinicalResult, {
      allowedKnowledgeModuleIds: new Set(['synthetic-education']),
    })).toEqual(syntheticClinicalResult);
  });
});
