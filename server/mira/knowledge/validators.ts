import {
  MIRA_CLINICAL_DISCLAIMER,
  MIRA_CLINICAL_INTENTS,
  MIRA_CLINICAL_TOPICS,
  MIRA_CLINICAL_URGENCIES,
  MIRA_CONTEXT_FRESHNESS_VALUES,
  MIRA_CONTEXT_PROVENANCES,
  MIRA_CONTEXT_STORAGE_STATES,
  MIRA_KNOWLEDGE_RISKS,
  type MiraClinicalIntent,
  type MiraClinicalResult,
  type MiraClinicalTopic,
  type MiraClinicalUrgency,
  type MiraContextFreshness,
  type MiraContextProvenance,
  type MiraContextReference,
  type MiraContextStorageState,
  type MiraContextValue,
  type MiraKnowledgeModule,
  type MiraKnowledgeRisk,
  type MiraKnowledgeRetrievalInput,
  type MiraKnowledgeSourceReference,
} from '../../../services/miraClinicalContracts';
import { isMiraLanguageCode, type MiraLanguageCode } from '../../../services/miraConfig';

export const MIRA_CLINICAL_LIMITS = Object.freeze({
  replyChars: 2_000,
  guidanceItems: 6,
  guidanceItemChars: 500,
  followUpQuestions: 2,
  followUpQuestionChars: 300,
  patientContextUsed: 12,
  contextKeyChars: 120,
  knowledgeModuleIds: 5,
  knowledgeModuleRegistryItems: 25,
  escalationReasonChars: 600,
  modelChars: 120,
  moduleIdChars: 80,
  moduleVersionChars: 32,
  moduleTitleChars: 160,
  moduleTopics: MIRA_CLINICAL_TOPICS.length,
  moduleLanguages: 5,
  moduleSourceRefs: 12,
  sourceTitleChars: 300,
  sourceOrganizationChars: 200,
  sourceJurisdictionChars: 120,
  sourceUrlChars: 2_048,
  reviewerChars: 200,
  moduleEducationalPoints: 20,
  moduleSelfCareGuidanceItems: 12,
  moduleProhibitedClaims: 20,
  moduleEscalationCategories: 20,
  moduleTextItemChars: 1_000,
} as const);

export type MiraClinicalValidationCode =
  | 'invalid_type'
  | 'invalid_enum'
  | 'invalid_format'
  | 'missing_field'
  | 'empty_string'
  | 'string_too_long'
  | 'array_too_large'
  | 'duplicate_value'
  | 'unknown_reference'
  | 'invalid_state';

export class MiraClinicalValidationError extends Error {
  readonly name = 'MiraClinicalValidationError';

  constructor(
    readonly code: MiraClinicalValidationCode,
    readonly path: string,
    message: string,
  ) {
    super(message);
  }
}

const SAFE_MODULE_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SAFE_MODULE_VERSION = /^\d+\.\d+\.\d+$/;
const SAFE_CONTEXT_KEY = /^[a-z][A-Za-z0-9_.-]*$/;
const ISO_DATE_OR_TIMESTAMP = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/;

function fail(code: MiraClinicalValidationCode, path: string, message: string): never {
  throw new MiraClinicalValidationError(code, path, message);
}

function readObject(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail('invalid_type', path, `${path} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown, path: string, maxLength: number, allowEmpty = false): string {
  if (typeof value !== 'string') fail('invalid_type', path, `${path} must be a string.`);
  if (!allowEmpty && value.length === 0) fail('empty_string', path, `${path} cannot be empty.`);
  if (value.length > maxLength) {
    fail('string_too_long', path, `${path} cannot exceed ${maxLength} characters.`);
  }
  return value;
}

function readEnum<T extends string>(
  value: unknown,
  path: string,
  allowed: readonly T[],
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    fail('invalid_enum', path, `${path} must be one of: ${allowed.join(', ')}.`);
  }
  return value as T;
}

function readArray(value: unknown, path: string, maxItems: number): unknown[] {
  if (!Array.isArray(value)) fail('invalid_type', path, `${path} must be an array.`);
  if (value.length > maxItems) {
    fail('array_too_large', path, `${path} cannot contain more than ${maxItems} items.`);
  }
  return value;
}

function ensureNoDuplicates(values: readonly string[], path: string): void {
  if (new Set(values).size !== values.length) {
    fail('duplicate_value', path, `${path} cannot contain duplicate values.`);
  }
}

function readStringArray(
  value: unknown,
  path: string,
  maxItems: number,
  maxItemLength: number,
): string[] {
  const result = readArray(value, path, maxItems).map((item, index) => (
    readString(item, `${path}[${index}]`, maxItemLength)
  ));
  ensureNoDuplicates(result, path);
  return result;
}

function readIsoDate(value: unknown, path: string): string {
  const result = readString(value, path, 40);
  if (!ISO_DATE_OR_TIMESTAMP.test(result) || Number.isNaN(Date.parse(result))) {
    fail('invalid_format', path, `${path} must be an ISO date or UTC timestamp.`);
  }
  return result;
}

function readOptionalIsoDate(value: unknown, path: string): string | undefined {
  return value === undefined ? undefined : readIsoDate(value, path);
}

function readModuleId(value: unknown, path: string): string {
  const result = readString(value, path, MIRA_CLINICAL_LIMITS.moduleIdChars);
  if (!SAFE_MODULE_ID.test(result)) {
    fail('invalid_format', path, `${path} must be a lowercase kebab-case identifier.`);
  }
  return result;
}

function validateSourceReference(value: unknown, path: string): MiraKnowledgeSourceReference {
  const source = readObject(value, path);
  const url = readString(source.url, `${path}.url`, MIRA_CLINICAL_LIMITS.sourceUrlChars);
  try {
    if (new URL(url).protocol !== 'https:') throw new Error('HTTPS required');
  } catch {
    fail('invalid_format', `${path}.url`, `${path}.url must be a valid HTTPS URL.`);
  }

  return {
    title: readString(source.title, `${path}.title`, MIRA_CLINICAL_LIMITS.sourceTitleChars),
    organization: readString(
      source.organization,
      `${path}.organization`,
      MIRA_CLINICAL_LIMITS.sourceOrganizationChars,
    ),
    publicationDate: readOptionalIsoDate(source.publicationDate, `${path}.publicationDate`),
    jurisdiction: source.jurisdiction === undefined
      ? undefined
      : readString(source.jurisdiction, `${path}.jurisdiction`, MIRA_CLINICAL_LIMITS.sourceJurisdictionChars),
    url,
  };
}

export function validateMiraContextValue<T = unknown>(value: unknown): MiraContextValue<T> {
  const context = readObject(value, 'context');
  const storageState = readEnum<MiraContextStorageState>(
    context.storageState,
    'context.storageState',
    MIRA_CONTEXT_STORAGE_STATES,
  );
  if (!Object.prototype.hasOwnProperty.call(context, 'value')) {
    fail('missing_field', 'context.value', 'context.value is required and may be null.');
  }
  if ((storageState === 'missing' || storageState === 'unavailable') && context.value !== null) {
    fail('invalid_state', 'context.value', `${storageState} context must keep its value null.`);
  }

  return {
    value: context.value as T | null,
    provenance: readEnum<MiraContextProvenance>(
      context.provenance,
      'context.provenance',
      MIRA_CONTEXT_PROVENANCES,
    ),
    storageState,
    recordedAt: readOptionalIsoDate(context.recordedAt, 'context.recordedAt'),
    freshness: readEnum<MiraContextFreshness>(
      context.freshness,
      'context.freshness',
      MIRA_CONTEXT_FRESHNESS_VALUES,
    ),
  };
}

export function validateMiraKnowledgeModule(value: unknown): MiraKnowledgeModule {
  const module = readObject(value, 'knowledgeModule');
  const version = readString(
    module.version,
    'knowledgeModule.version',
    MIRA_CLINICAL_LIMITS.moduleVersionChars,
  );
  if (!SAFE_MODULE_VERSION.test(version)) {
    fail('invalid_format', 'knowledgeModule.version', 'knowledgeModule.version must use numeric x.y.z format.');
  }

  const topics = readArray(
    module.topics,
    'knowledgeModule.topics',
    MIRA_CLINICAL_LIMITS.moduleTopics,
  ).map((topic, index) => readEnum<MiraClinicalTopic>(
    topic,
    `knowledgeModule.topics[${index}]`,
    MIRA_CLINICAL_TOPICS,
  ));
  ensureNoDuplicates(topics, 'knowledgeModule.topics');

  const languages = readArray(
    module.languages,
    'knowledgeModule.languages',
    MIRA_CLINICAL_LIMITS.moduleLanguages,
  ).map((language, index) => {
    if (!isMiraLanguageCode(language)) {
      fail('invalid_enum', `knowledgeModule.languages[${index}]`, 'Knowledge-module language is not supported.');
    }
    return language as MiraLanguageCode;
  });
  ensureNoDuplicates(languages, 'knowledgeModule.languages');

  const sourceRefs = readArray(
    module.sourceRefs,
    'knowledgeModule.sourceRefs',
    MIRA_CLINICAL_LIMITS.moduleSourceRefs,
  ).map((source, index) => validateSourceReference(source, `knowledgeModule.sourceRefs[${index}]`));

  return {
    id: readModuleId(module.id, 'knowledgeModule.id'),
    version,
    title: readString(module.title, 'knowledgeModule.title', MIRA_CLINICAL_LIMITS.moduleTitleChars),
    topics,
    languages,
    risk: readEnum<MiraKnowledgeRisk>(module.risk, 'knowledgeModule.risk', MIRA_KNOWLEDGE_RISKS),
    reviewedAt: readIsoDate(module.reviewedAt, 'knowledgeModule.reviewedAt'),
    reviewedBy: readString(module.reviewedBy, 'knowledgeModule.reviewedBy', MIRA_CLINICAL_LIMITS.reviewerChars),
    sourceRefs,
    educationalPoints: readStringArray(
      module.educationalPoints,
      'knowledgeModule.educationalPoints',
      MIRA_CLINICAL_LIMITS.moduleEducationalPoints,
      MIRA_CLINICAL_LIMITS.moduleTextItemChars,
    ),
    allowedSelfCareGuidance: readStringArray(
      module.allowedSelfCareGuidance,
      'knowledgeModule.allowedSelfCareGuidance',
      MIRA_CLINICAL_LIMITS.moduleSelfCareGuidanceItems,
      MIRA_CLINICAL_LIMITS.moduleTextItemChars,
    ),
    prohibitedClaims: readStringArray(
      module.prohibitedClaims,
      'knowledgeModule.prohibitedClaims',
      MIRA_CLINICAL_LIMITS.moduleProhibitedClaims,
      MIRA_CLINICAL_LIMITS.moduleTextItemChars,
    ),
    escalationCategories: readStringArray(
      module.escalationCategories,
      'knowledgeModule.escalationCategories',
      MIRA_CLINICAL_LIMITS.moduleEscalationCategories,
      MIRA_CLINICAL_LIMITS.moduleTextItemChars,
    ),
  };
}

export function validateMiraKnowledgeModules(value: unknown): MiraKnowledgeModule[] {
  const modules = readArray(value, 'knowledgeModules', MIRA_CLINICAL_LIMITS.knowledgeModuleRegistryItems)
    .map(validateMiraKnowledgeModule);
  ensureNoDuplicates(modules.map((module) => module.id), 'knowledgeModules.id');
  return modules;
}

export function validateMiraKnowledgeRetrievalInput(value: unknown): MiraKnowledgeRetrievalInput {
  const input = readObject(value, 'knowledgeRetrievalInput');
  if (!isMiraLanguageCode(input.language)) {
    fail('invalid_enum', 'knowledgeRetrievalInput.language', 'Knowledge retrieval language is not supported.');
  }
  if (
    typeof input.maxModules !== 'number'
    || !Number.isInteger(input.maxModules)
    || input.maxModules < 1
    || input.maxModules > MIRA_CLINICAL_LIMITS.knowledgeModuleIds
  ) {
    fail(
      'invalid_format',
      'knowledgeRetrievalInput.maxModules',
      `knowledgeRetrievalInput.maxModules must be an integer from 1 to ${MIRA_CLINICAL_LIMITS.knowledgeModuleIds}.`,
    );
  }
  return {
    topic: readEnum<MiraClinicalTopic>(
      input.topic,
      'knowledgeRetrievalInput.topic',
      MIRA_CLINICAL_TOPICS,
    ),
    language: input.language,
    maxModules: input.maxModules,
  };
}

function validateContextReference(value: unknown, path: string): MiraContextReference {
  const reference = readObject(value, path);
  const key = readString(reference.key, `${path}.key`, MIRA_CLINICAL_LIMITS.contextKeyChars);
  if (!SAFE_CONTEXT_KEY.test(key)) {
    fail('invalid_format', `${path}.key`, `${path}.key contains unsupported characters.`);
  }
  return {
    key,
    provenance: readEnum<MiraContextProvenance>(
      reference.provenance,
      `${path}.provenance`,
      MIRA_CONTEXT_PROVENANCES,
    ),
    recordedAt: readOptionalIsoDate(reference.recordedAt, `${path}.recordedAt`),
    freshness: readEnum<MiraContextFreshness>(
      reference.freshness,
      `${path}.freshness`,
      MIRA_CONTEXT_FRESHNESS_VALUES,
    ),
  };
}

export interface MiraClinicalResultValidationOptions {
  allowedKnowledgeModuleIds?: ReadonlySet<string>;
}

export function validateMiraClinicalResult(
  value: unknown,
  options: MiraClinicalResultValidationOptions = {},
): MiraClinicalResult {
  const result = readObject(value, 'clinicalResult');
  const contextReferences = readArray(
    result.patientContextUsed,
    'clinicalResult.patientContextUsed',
    MIRA_CLINICAL_LIMITS.patientContextUsed,
  ).map((reference, index) => validateContextReference(
    reference,
    `clinicalResult.patientContextUsed[${index}]`,
  ));
  ensureNoDuplicates(contextReferences.map((reference) => reference.key), 'clinicalResult.patientContextUsed.key');

  const knowledgeModuleIds = readArray(
    result.knowledgeModuleIds,
    'clinicalResult.knowledgeModuleIds',
    MIRA_CLINICAL_LIMITS.knowledgeModuleIds,
  ).map((id, index) => readModuleId(id, `clinicalResult.knowledgeModuleIds[${index}]`));
  ensureNoDuplicates(knowledgeModuleIds, 'clinicalResult.knowledgeModuleIds');
  if (options.allowedKnowledgeModuleIds) {
    knowledgeModuleIds.forEach((id, index) => {
      if (!options.allowedKnowledgeModuleIds?.has(id)) {
        fail(
          'unknown_reference',
          `clinicalResult.knowledgeModuleIds[${index}]`,
          `Clinical result references an unknown knowledge module: ${id}.`,
        );
      }
    });
  }

  if (result.disclaimer !== MIRA_CLINICAL_DISCLAIMER) {
    fail(
      'invalid_enum',
      'clinicalResult.disclaimer',
      `clinicalResult.disclaimer must equal ${MIRA_CLINICAL_DISCLAIMER}.`,
    );
  }
  if (typeof result.escalationRecommended !== 'boolean') {
    fail('invalid_type', 'clinicalResult.escalationRecommended', 'clinicalResult.escalationRecommended must be boolean.');
  }

  return {
    reply: readString(result.reply, 'clinicalResult.reply', MIRA_CLINICAL_LIMITS.replyChars),
    intent: readEnum<MiraClinicalIntent>(result.intent, 'clinicalResult.intent', MIRA_CLINICAL_INTENTS),
    topic: readEnum<MiraClinicalTopic>(result.topic, 'clinicalResult.topic', MIRA_CLINICAL_TOPICS),
    urgency: readEnum<MiraClinicalUrgency>(result.urgency, 'clinicalResult.urgency', MIRA_CLINICAL_URGENCIES),
    guidance: readStringArray(
      result.guidance,
      'clinicalResult.guidance',
      MIRA_CLINICAL_LIMITS.guidanceItems,
      MIRA_CLINICAL_LIMITS.guidanceItemChars,
    ),
    followUpQuestions: readStringArray(
      result.followUpQuestions,
      'clinicalResult.followUpQuestions',
      MIRA_CLINICAL_LIMITS.followUpQuestions,
      MIRA_CLINICAL_LIMITS.followUpQuestionChars,
    ),
    patientContextUsed: contextReferences,
    escalationRecommended: result.escalationRecommended,
    escalationReason: readString(
      result.escalationReason,
      'clinicalResult.escalationReason',
      MIRA_CLINICAL_LIMITS.escalationReasonChars,
      true,
    ),
    knowledgeModuleIds,
    disclaimer: MIRA_CLINICAL_DISCLAIMER,
    model: readString(result.model, 'clinicalResult.model', MIRA_CLINICAL_LIMITS.modelChars),
  };
}
