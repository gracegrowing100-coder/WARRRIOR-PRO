// Generated from server/mira/miraVercelHandler.ts. Do not edit directly.

// server/mira/miraApiApp.ts
import { GoogleGenAI } from "@google/genai";
import express from "express";

// services/miraConfig.ts
var MIRA_LANGUAGES = [
  {
    code: "en",
    label: "English",
    speechHint: "en-GB",
    speechToText: "verified",
    textToSpeech: "verified"
  },
  {
    code: "ha",
    label: "Hausa",
    speechHint: "ha-NG",
    speechToText: "verified",
    textToSpeech: "verified"
  },
  {
    code: "ig",
    label: "Igbo",
    speechHint: null,
    speechToText: "verified",
    textToSpeech: "verified"
  },
  {
    code: "yo",
    label: "Yor\xF9b\xE1",
    speechHint: null,
    speechToText: "verified",
    textToSpeech: "verified"
  },
  {
    code: "pcm",
    label: "Nigerian Pidgin",
    speechHint: null,
    speechToText: "verified",
    textToSpeech: "verified"
  }
];
function isMiraLanguageCode(value) {
  return typeof value === "string" && MIRA_LANGUAGES.some((entry) => entry.code === value);
}
function miraLanguageDefinition(code) {
  return MIRA_LANGUAGES.find((entry) => entry.code === code) ?? MIRA_LANGUAGES[0];
}
function miraVoiceCapability(code, mode) {
  return miraLanguageDefinition(code)[mode];
}
function resolveMiraVoiceCapability(override) {
  return override !== "false";
}

// server/mira/miraSafetyCategories.ts
var MIRA_SAFETY_CATEGORY_DEFINITIONS = [
  {
    category: "chest_pain",
    level: "DETERMINISTIC",
    urgency: "urgent",
    reason: "current chest pain",
    legacyLabel: "chest pain",
    cues: {
      en: [/\bchest pain\b/i, /\bpain (?:in|inside) (?:my|the) chest\b/i],
      pcm: [/\bchest dey pain me\b/i, /\bpain (?:for|inside) my chest\b/i],
      ha: [/ciwon kirji/iu]
    }
  },
  {
    category: "breathing_difficulty",
    level: "DETERMINISTIC",
    urgency: "urgent",
    reason: "difficulty breathing",
    legacyLabel: "difficulty breathing",
    cues: {
      en: [
        /\bcan(?:no|')?t breathe\b/i,
        /\bdifficulty breathing\b/i,
        /\bshort(?:ness)? of breath\b/i,
        /\bbreathless\b/i,
        /\bstruggling to breathe\b/i
      ],
      pcm: [/\bi no fit breathe\b/i, /\bbreath no dey\b/i, /\bhard (?:for me )?to breathe\b/i],
      yo: [/ìṣòro mímí/iu, /mi ò lè mí/iu, /isoro mimi/iu],
      ig: [/nsogbu iku ume/iu, /enweghị m ike iku ume/iu, /enweghi m ike iku ume/iu],
      ha: [/wahalar numfashi/iu, /ba zan iya numfashi ba/iu]
    }
  },
  {
    category: "neurological_warning",
    level: "DETERMINISTIC",
    urgency: "urgent",
    reason: "new stroke-like or one-sided neurological warning signs",
    legacyLabel: "possible stroke signs",
    cues: {
      en: [
        /\bface droop(?:ing)?\b/i,
        /\bnew slurred speech\b/i,
        /\bnew (?:speech|speaking) difficulty\b/i,
        /\bweak(?:ness)? on one side\b/i,
        /\bone[- ]sided weakness\b/i,
        /\bcan(?:no|')?t move my (?:arm|leg|hand)\b/i,
        /\bstroke signs?\b/i
      ],
      pcm: [/\bone side (?:of )?my body weak\b/i, /\bmy mouth bend suddenly\b/i],
      ha: [/rashin karfi a gefen jiki/iu, /karkatar baki/iu]
    }
  },
  {
    category: "seizure_or_unconsciousness",
    level: "DETERMINISTIC",
    urgency: "urgent",
    reason: "seizure or loss of consciousness",
    legacyLabel: "seizure or loss of consciousness",
    cues: {
      en: [
        /\bseizure\b/i,
        /\bconvulsion\b/i,
        /\bpassed out\b/i,
        /\bunconscious\b/i,
        /\blost consciousness\b/i
      ],
      pcm: [/\bi pass out\b/i, /\bi no conscious\b/i]
    }
  },
  {
    category: "fever_or_infection",
    level: "DETERMINISTIC",
    urgency: "urgent",
    reason: "current fever or infection concern",
    legacyLabel: "fever or signs of infection",
    cues: {
      en: [/\bfever\b/i, /\bhigh temperature\b/i, /\b38\.5\b/i, /\b39(?:\.\d)?\s*(?:°|degrees)?\b/i],
      pcm: [/\bi get fever\b/i, /\bmy body dey hot\b/i, /\bbody dey hot\b/i],
      yo: [/mo ní ibà/iu, /\bmo ni iba\b/iu, /ibà/iu],
      ig: [/ahụ ọkụ/iu, /ahu oku/iu],
      ha: [/\bzazzabi\b/iu]
    }
  },
  {
    category: "severe_or_worsening_pain",
    level: "DETERMINISTIC",
    urgency: "urgent",
    reason: "severe or worsening pain",
    legacyLabel: "severe or worsening pain",
    cues: {
      en: [
        /\bsevere pain\b/i,
        /\bworst pain\b/i,
        /\bunbearable pain\b/i,
        /\bexcruciating pain\b/i,
        /\b10\s*\/\s*10 pain\b/i,
        /\bpain (?:is )?(?:getting|got) worse\b/i,
        /\bpain is still severe\b/i,
        /\bin (?:a |the )?crisis\b/i,
        /\bhaving a crisis\b/i
      ],
      pcm: [/\bpain dey too much\b/i, /\bserious pain\b/i, /\bbad pain\b/i, /\bpain no gree\b/i],
      yo: [/ìrora gíga/iu, /irora giga/iu, /ìrora púpọ̀/iu, /agbákò/iu, /agbako/iu, /fitila/iu],
      ig: [/oké mgbu/iu, /oke mgbu/iu, /nsogbu ike/iu],
      ha: [/matsanancin ciwo/iu]
    }
  },
  {
    category: "unable_to_drink_or_retain_fluids",
    level: "DETERMINISTIC",
    urgency: "urgent",
    reason: "unable to drink or keep fluids down",
    legacyLabel: "unable to keep fluids down",
    cues: {
      en: [
        /\bcan(?:no|')?t keep (?:any )?(?:water|fluids?) down\b/i,
        /\bunable to (?:drink|keep fluids? down)\b/i,
        /\bvomiting (?:everything|non[- ]?stop)\b/i
      ],
      pcm: [/\bi no fit keep (?:water|fluid) down\b/i, /\bi dey vomit everything\b/i]
    }
  },
  {
    category: "priapism",
    level: "DETERMINISTIC",
    urgency: "urgent",
    reason: "painful or prolonged erection",
    legacyLabel: "priapism",
    cues: {
      en: [/\bpriapism\b/i, /\bpainful erection\b/i, /\berection.{0,24}(?:hours?|over two hours)\b/i],
      ha: [/taurin gaba mai zafi/iu]
    }
  },
  {
    category: "confusion_or_severe_weakness",
    level: "HYBRID",
    urgency: "specialist",
    reason: "new confusion or severe weakness that needs clarification",
    legacyLabel: "confusion or severe weakness",
    cues: {
      en: [/\bnew confusion\b/i, /\bvery confused\b/i, /\bsevere weakness\b/i, /\bsuddenly very weak\b/i],
      pcm: [/\bi confuse well well\b/i, /\bi weak well well\b/i]
    }
  },
  {
    category: "sudden_pallor_or_splenic_concern",
    level: "HYBRID",
    urgency: "specialist",
    reason: "sudden pallor or splenic concern that needs clarification",
    legacyLabel: "possible splenic or blood-volume problem",
    cues: {
      en: [/\bsudden pallor\b/i, /\bsuddenly very pale\b/i, /\bspleen (?:pain|swelling|enlarged)\b/i, /\bsplenic concern\b/i],
      ha: [/rashin jini kwatsam/iu]
    }
  },
  {
    category: "pregnancy_emergency",
    level: "HYBRID",
    urgency: "specialist",
    reason: "pregnancy-related warning language that needs urgent clarification",
    legacyLabel: "pregnancy-related warning signs",
    cues: {
      en: [
        /\b(?:pregnant|pregnancy).{0,50}\b(?:heavy bleeding|severe pain|can(?:no|')?t breathe|fainted|unconscious)\b/i,
        /\b(?:heavy bleeding|severe pain).{0,50}\b(?:pregnant|pregnancy)\b/i
      ],
      pcm: [/\bi get belle.{0,40}(?:blood dey come plenty|serious pain|i no fit breathe)\b/i]
    }
  },
  {
    category: "mental_health_crisis",
    level: "DETERMINISTIC",
    urgency: "urgent",
    reason: "current self-harm or suicide language",
    legacyLabel: "mental-health crisis",
    cues: {
      en: [
        /\bi (?:want|plan) to kill myself\b/i,
        /\bi (?:want|plan) to end my life\b/i,
        /\bi am going to hurt myself\b/i,
        /\bi do not want to live\b/i,
        /\bsuicidal\b/i
      ],
      pcm: [/\bi wan kill myself\b/i, /\bi no wan live again\b/i]
    }
  }
];

// server/mira/miraSafety.ts
var MIRA_AI_IDENTITY_LINE = "Mira is an AI assistant, not a doctor, and no clinician has verified this message.";
var MIRA_EMERGENCY_GUIDANCE = "Your messages mention signs that can need emergency care. Mira cannot assess this and has not contacted anyone on your behalf. Please contact emergency services or go to the nearest emergency department now, or use the Emergency action in this app to reach the contacts you recorded. Do not wait for an appointment request.";
var MIRA_URGENT_REPLY = "Please use the urgent safety guidance shown below.";
var CURRENT_MARKER = /\b(?:now|right now|today|currently|still|continues?|continuing|ongoing|at the moment|dey now|still dey|har yanzu)\b|ṣì|ka dị/iu;
var CONTINUATION_MARKER = /\b(?:still|continues?|continuing|ongoing|has not stopped|not getting better|still dey|har yanzu)\b|ṣì|ka dị/iu;
var PREVENTIVE_OR_EDUCATIONAL = [
  /\bwhat (?:should|do|can) i do if\b/i,
  /\bwhat if i (?:ever )?(?:get|have|develop)\b/i,
  /\bif i (?:ever )?(?:get|have|develop)\b/i,
  /\bhow (?:do|can) i (?:prevent|avoid|recognize|recognise)\b/i,
  /\bwatch (?:out )?for\b/i,
  /\bsigns (?:of|to watch)\b/i
];
var HISTORICAL_MARKER = /\b(?:last year|last month|years? ago|when i was (?:younger|a child)|in (?:19|20)\d{2})\b/i;
var NEGATION_BEFORE_CUE = /(?:\bno\b|\bnot\b|\bnever\b|\bwithout\b|\bdo not\b|\bdon't\b|\bdoes not\b|\bdoesn't\b|\bhave not\b|\bhaven't\b|\bno get\b)[^.!?]{0,36}$/i;
var UNSAFE_MEDICATION_REQUEST = /\b(?:what|which) (?:drug|medicine|medication) should i take(?: right now)?\b|\b(?:should|can) i (?:double|increase|reduce|change|stop) (?:my |the )?(?:dose|dosage|medicine|medication)\b|\bdouble my dose\b/i;
function normalizeSafetyText(text) {
  return text.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
}
function cueMatch(definition, text, language) {
  const languages = language ? Array.from(/* @__PURE__ */ new Set(["en", language])) : Object.keys(definition.cues);
  for (const code of languages) {
    for (const pattern of definition.cues[code] ?? []) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) return match;
    }
  }
  return null;
}
function isNonCurrentUse(text, cueIndex) {
  const hasCurrentMarker = CURRENT_MARKER.test(text);
  if (!hasCurrentMarker && PREVENTIVE_OR_EDUCATIONAL.some((pattern) => pattern.test(text))) return true;
  if (!hasCurrentMarker && HISTORICAL_MARKER.test(text)) return true;
  const beforeCue = text.slice(Math.max(0, cueIndex - 64), cueIndex);
  return NEGATION_BEFORE_CUE.test(beforeCue);
}
function detectCurrentCategories(text, language) {
  const normalized2 = normalizeSafetyText(text);
  return MIRA_SAFETY_CATEGORY_DEFINITIONS.filter((definition) => {
    const match = cueMatch(definition, normalized2, language);
    return Boolean(match && !isNonCurrentUse(normalized2, match.index));
  });
}
function assessMiraSafety(input) {
  const currentText = normalizeSafetyText(input.currentText);
  const currentDefinitions = detectCurrentCategories(currentText, input.language);
  const categories = currentDefinitions.map((definition) => definition.category);
  const currentCategorySet = new Set(categories);
  const priorCategories = /* @__PURE__ */ new Set();
  for (const turn of input.recentPatientTurns ?? []) {
    detectCurrentCategories(turn, input.language).forEach((definition) => priorCategories.add(definition.category));
  }
  const continuationOfRecentConcern = CONTINUATION_MARKER.test(currentText) && Array.from(currentCategorySet).some((category) => priorCategories.has(category));
  const medicationBoundary = !isNonCurrentUse(currentText, 0) && UNSAFE_MEDICATION_REQUEST.test(currentText);
  const urgent = currentDefinitions.some((definition) => definition.urgency === "urgent");
  const specialist = currentDefinitions.some((definition) => definition.urgency === "specialist") || medicationBoundary;
  const urgency = urgent ? "urgent" : specialist ? "specialist" : "none";
  const reasons = currentDefinitions.map((definition) => definition.reason);
  if (medicationBoundary) reasons.push("medication selection or dose changes require human clinical review");
  return {
    urgency,
    categories,
    deterministic: medicationBoundary || currentDefinitions.some((definition) => definition.level === "DETERMINISTIC"),
    matchedCurrentTurn: categories.length > 0 || medicationBoundary,
    continuationOfRecentConcern,
    reasons
  };
}
var CLINICIAN_CLAIM_PATTERNS = [
  /\bi('| a)?m (a|an|your) (doctor|physician|haematologist|hematologist|nurse|consultant|clinician|specialist)\b/i,
  /\bas (your|a) (doctor|physician|haematologist|hematologist|nurse|clinician|specialist)\b/i,
  /\bi (have )?(reviewed|verified|examined|assessed) your (results|records|notes|chart|scans)\b/i,
  /\b(medically|clinically) (verified|approved|confirmed) by (a|your) (doctor|clinician|haematologist|hematologist)\b/i,
  /\bi have (scheduled|booked|confirmed) (your|an) appointment\b/i,
  /\byour (blood )?results (are|show)\b/i
];
function applyMiraIdentityGuard(reply) {
  const sentences = reply.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.trim().length > 0);
  if (sentences.length === 0) return MIRA_AI_IDENTITY_LINE;
  const kept = sentences.filter((sentence) => !CLINICIAN_CLAIM_PATTERNS.some((pattern) => pattern.test(sentence)));
  if (kept.length === sentences.length) return sentences.join(" ").trim();
  if (kept.length === 0) return MIRA_AI_IDENTITY_LINE;
  return `${kept.join(" ").trim()}

${MIRA_AI_IDENTITY_LINE}`;
}
function classifyMiraEscalation(input) {
  const safety = assessMiraSafety({
    currentText: input.userText,
    recentPatientTurns: input.recentPatientTurns,
    language: input.language
  });
  const modelUrgency = input.modelUrgency === "urgent" || input.modelUrgency === "specialist" ? input.modelUrgency : "none";
  const modelReason = typeof input.modelReason === "string" ? input.modelReason.trim() : "";
  if (safety.urgency === "urgent") {
    return {
      needed: true,
      urgency: "urgent",
      reason: `Your message mentions ${safety.reasons.join(", ")}. Mira cannot assess this, and a human should review it now.`,
      matchedRedFlags: safety.reasons
    };
  }
  if (modelUrgency === "urgent") {
    return {
      needed: true,
      urgency: "urgent",
      reason: modelReason || "Mira flagged this conversation as needing urgent human review.",
      matchedRedFlags: []
    };
  }
  if (safety.urgency === "specialist") {
    return {
      needed: true,
      urgency: "specialist",
      reason: `Your message mentions ${safety.reasons.join(", ")}. A human clinician should review this before medication or care decisions are made.`,
      matchedRedFlags: safety.reasons
    };
  }
  if (modelUrgency === "specialist") {
    return {
      needed: true,
      urgency: "specialist",
      reason: modelReason || "Mira flagged this conversation as needing hematology review.",
      matchedRedFlags: []
    };
  }
  return { needed: false, urgency: "none", reason: "", matchedRedFlags: [] };
}
var MIRA_HANDOFF_LABEL = "AI-generated draft from your Mira conversation \u2014 not clinician-authored. Review and edit before sharing.";
var SYMPTOM_TERMS = [
  "bone pain",
  "joint pain",
  "back pain",
  "chest pain",
  "abdominal pain",
  "stomach pain",
  "leg pain",
  "arm pain",
  "pain",
  "headache",
  "fever",
  "fatigue",
  "tiredness",
  "breathlessness",
  "shortness of breath",
  "cough",
  "vomiting",
  "nausea",
  "diarrhoea",
  "diarrhea",
  "jaundice",
  "yellow eyes",
  "swelling",
  "dizziness",
  "rash",
  "infection",
  "priapism",
  "weakness"
];
var MEDICATION_TERMS = [
  "hydroxyurea",
  "hydroxycarbamide",
  "folic acid",
  "folate",
  "penicillin",
  "paracetamol",
  "acetaminophen",
  "ibuprofen",
  "diclofenac",
  "morphine",
  "tramadol",
  "codeine",
  "omeprazole",
  "deferasirox",
  "deferiprone",
  "crizanlizumab",
  "voxelotor",
  "l-glutamine",
  "vitamin d",
  "calcium",
  "iron tablets"
];
var DURATION_PATTERN = new RegExp(
  [
    "\\b(?:for|since|over|about)\\s+(?:\\d+\\s*(?:hours?|days?|weeks?|months?)|this (?:morning|week|month)|yesterday|today|last night|a (?:day|week|month))\\b",
    "\\b\\d+\\s*(?:hours?|days?|weeks?|months?)\\b",
    "\\b(?:today|yesterday|this morning|last night|this week|last week)\\b"
  ].join("|"),
  "i"
);
var HYDRATION_PATTERN = /\b(water|hydration|hydrated|fluids?|drinking|litres?|liters?|millilitres?|ml)\b/i;
function matchTerms(text, terms) {
  const normalized2 = ` ${text.toLowerCase().replace(/\s+/g, " ")} `;
  const matched = [];
  terms.forEach((term) => {
    if (new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(normalized2) && !matched.includes(term)) {
      matched.push(term);
    }
  });
  return matched;
}
function firstSentence(value, maxLength = 160) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return "Not stated in the conversation.";
  const sentence = trimmed.split(/(?<=[.!?])\s/)[0] ?? trimmed;
  const clipped = sentence.length > maxLength ? `${sentence.slice(0, maxLength).trim()}\u2026` : sentence;
  return clipped;
}
function buildMiraHandoffDraft(input) {
  const patientText = input.patientMessages.join("\n");
  const concern = firstSentence(input.patientMessages[0] ?? "");
  const durationMatch = patientText.match(DURATION_PATTERN);
  const duration = durationMatch?.[0]?.trim() ?? "Not stated in the conversation.";
  const symptoms = matchTerms(patientText, SYMPTOM_TERMS);
  const medications = matchTerms(patientText, MEDICATION_TERMS);
  const hydration = HYDRATION_PATTERN.test(patientText) ? "Mentioned by the patient in this conversation." : "Not mentioned in the conversation.";
  const summaryText = [
    "MIRA HANDOFF DRAFT",
    "",
    `Reported concern: ${concern}`,
    `How long: ${duration}`,
    `Symptoms stated by the patient: ${symptoms.length > 0 ? symptoms.join(", ") : "None stated in the conversation."}`,
    `Medications mentioned by the patient: ${medications.length > 0 ? medications.join(", ") : "None stated in the conversation."}`,
    `Hydration: ${hydration}`,
    `AI-generated reason for suggesting human review: ${input.escalation.reason || "No AI rationale available."}`,
    "",
    MIRA_HANDOFF_LABEL
  ].join("\n");
  return { concern, duration, symptoms, medications, hydration, reason: input.escalation.reason, summaryText };
}

// server/mira/miraProvider.ts
var MiraProviderError = class extends Error {
  constructor(message) {
    super(message);
    this.code = "provider_unavailable";
    this.name = "MiraProviderError";
  }
};

// server/mira/miraGeminiProvider.ts
var MIRA_CHAT_MODEL_CANDIDATES = [
  { model: "gemini-3.5-flash-lite", timeoutMs: 12e3 },
  { model: "gemini-3.8-flash", timeoutMs: 8e3 },
  { model: "gemini-flash-latest", timeoutMs: 7e3 }
];
var MIRA_TRANSCRIBE_MODEL = "gemini-3.5-transcribe";
var MIRA_TTS_MODEL_CANDIDATES = ["gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts"];
var MIRA_TTS_VOICE = "Kore";
var MIRA_SYSTEM_PROMPT = `You are Mira, the AI assistant built into WARRIOR AI for people living with sickle cell disease.

Hard rules:
- You are an AI assistant. You are not a doctor, nurse, or haematologist. Never claim or imply that you are a human clinician, that a clinician wrote your answer, that you examined the patient, or that a clinician has verified anything.
- Never claim that an appointment is booked or confirmed, that a clinic has been contacted, or that emergency services have been alerted.
- Never invent patient facts, test results, medication names or doses, confidence scores, or a diagnosis. If something was not stated in the conversation, say it is not known.
- Never instruct the patient to start, stop, or change a prescription medicine or its dose. Point them to their own care plan or a clinician instead.
- Do not state what is causing the symptoms as a settled fact. Explain possibilities and limits honestly.
- If a person would reasonably benefit from haematology review (symptoms that keep returning, questions about a treatment plan, asking for clinical advice, hydration or medication concerns), set escalation.urgency to "specialist" and give one short reason.
- If the conversation suggests a possible emergency (chest pain, difficulty breathing, high fever, stroke signs, priapism lasting hours, unable to keep fluids down, severe or worsening pain), set escalation.urgency to "urgent" and tell the patient clearly to seek emergency care now, without waiting.
- Use "none" for ordinary educational or supportive conversation.

Style: reply in the requested language, calm and plain, under about 150 words, at most one follow-up question.

Return JSON only, matching exactly:
{"reply": string, "escalation": {"needed": boolean, "urgency": "none" | "specialist" | "urgent", "reason": string}}`;
function buildContents(history, message) {
  return [
    ...history.map((turn) => ({
      role: turn.role === "user" ? "user" : "model",
      parts: [{ text: turn.text }]
    })),
    { role: "user", parts: [{ text: message }] }
  ];
}
function isTransientProviderError(error) {
  const candidate = error;
  const message = String(candidate?.message ?? "");
  const status = typeof candidate?.status === "number" ? candidate.status : null;
  const code = String(candidate?.cause?.code ?? candidate?.code ?? "").toUpperCase();
  return candidate?.name === "AbortError" || candidate?.cause?.name === "AbortError" || status === 408 || status === 429 || status !== null && status >= 500 || ["ENOTFOUND", "EAI_AGAIN", "ECONNRESET", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT"].includes(code) || message.includes("503") || message.includes("429") || message.toLowerCase().includes("demand");
}
function safeProviderErrorMetadata(error) {
  const candidate = error;
  return {
    name: typeof candidate?.name === "string" ? candidate.name : "UnknownError",
    status: typeof candidate?.status === "number" ? candidate.status : null,
    code: ["string", "number"].includes(typeof candidate?.cause?.code) ? candidate.cause?.code : ["string", "number"].includes(typeof candidate?.code) ? candidate.code : null
  };
}
async function runMiraChat(ai, input) {
  const languageLabel = miraLanguageDefinition(input.language).label;
  const systemInstruction = `${MIRA_SYSTEM_PROMPT}

Reply language: ${languageLabel}.`;
  let lastError = null;
  for (const { model, timeoutMs } of MIRA_CHAT_MODEL_CANDIDATES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await ai.models.generateContent({
        model,
        contents: buildContents(input.history, input.message),
        config: {
          systemInstruction,
          temperature: 0.4,
          responseMimeType: "application/json",
          abortSignal: controller.signal
        }
      });
      const text = (response.text ?? "").trim();
      if (!text) throw new MiraProviderError("Mira returned an empty response.");
      const parsed = JSON.parse(text);
      const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
      if (!reply) throw new MiraProviderError("Mira returned a response without text.");
      return {
        reply: applyMiraIdentityGuard(reply),
        modelUrgency: parsed.escalation?.urgency,
        modelReason: parsed.escalation?.reason,
        model
      };
    } catch (error) {
      lastError = error;
      if (error instanceof MiraProviderError) throw error;
      console.warn("[Mira] Gemini chat attempt failed", {
        model,
        language: input.language,
        ...safeProviderErrorMetadata(error)
      });
      if (!isTransientProviderError(error)) {
        throw new MiraProviderError("Mira could not generate a reply right now.");
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw new MiraProviderError("Mira could not generate a reply right now.");
}
function extractAudioTranscription(response) {
  const candidates = response?.candidates;
  const parts = candidates?.[0]?.content?.parts ?? [];
  return parts.flatMap((part) => [part.audioTranscription?.text, part.text]).filter((value) => typeof value === "string" && Boolean(value.trim())).join(" ").replace(/\s+/g, " ").trim();
}
async function transcribeWithProvider(ai, input) {
  let uploadedUri = "";
  let uploadedName = "";
  let uploadedMimeType = input.mimeType;
  try {
    const audioBytes = Buffer.from(input.audioBase64, "base64");
    const uploaded = await ai.files.upload({
      file: new Blob([audioBytes], { type: input.mimeType }),
      config: { mimeType: input.mimeType }
    });
    uploadedUri = uploaded.uri ?? "";
    uploadedName = uploaded.name ?? "";
    uploadedMimeType = uploaded.mimeType ?? input.mimeType;
    if (!uploadedUri) throw new MiraProviderError("Audio upload did not return a file reference.");
    const response = await ai.models.generateContent({
      model: MIRA_TRANSCRIBE_MODEL,
      contents: [{
        role: "user",
        parts: [{ fileData: { fileUri: uploadedUri, mimeType: uploadedMimeType } }]
      }]
    });
    const transcript = extractAudioTranscription(response);
    if (!transcript) throw new MiraProviderError("Transcription returned no text.");
    return { transcript, model: MIRA_TRANSCRIBE_MODEL };
  } catch (error) {
    if (error instanceof MiraProviderError) throw error;
    throw new MiraProviderError("Voice transcription is unavailable right now.");
  } finally {
    if (uploadedName) {
      try {
        await ai.files.delete({ name: uploadedName });
      } catch (error) {
        console.warn("[Mira] provider audio cleanup failed", {
          fileName: uploadedName,
          error: error instanceof Error ? error.message : "unknown error"
        });
      }
    } else if (uploadedUri) {
      console.warn("[Mira] provider audio cleanup skipped because upload returned no file name");
    }
  }
}
async function synthesizeWithProvider(ai, input) {
  const definition = miraLanguageDefinition(input.language);
  let lastError = null;
  for (const model of MIRA_TTS_MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: input.text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: MIRA_TTS_VOICE } },
            languageCode: definition.code
          }
        }
      });
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const audioPart = parts.find((part) => part.inlineData?.data);
      const audioBase64 = audioPart?.inlineData?.data ?? "";
      if (!audioBase64) throw new MiraProviderError("Speech synthesis returned no audio.");
      return { audioBase64, mimeType: "audio/wav", model };
    } catch (error) {
      lastError = error;
      if (error instanceof MiraProviderError) throw error;
      if (!isTransientProviderError(error)) {
        throw new MiraProviderError("Spoken replies are unavailable right now.");
      }
    }
  }
  throw new MiraProviderError("Spoken replies are unavailable right now.");
}
function createGeminiMiraProvider(ai) {
  return {
    chat: (input) => runMiraChat(ai, input),
    transcribe: (input) => transcribeWithProvider(ai, input),
    synthesize: (input) => synthesizeWithProvider(ai, input)
  };
}

// server/mira/miraAuth.ts
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
var MiraAuthError = class extends Error {
  constructor(code, message) {
    super(message);
    this.name = "MiraAuthError";
    this.code = code;
  }
};
var ADMIN_APP_NAME = "warrior-mira-admin";
var adminApp = null;
function resolveAdminApp(projectId) {
  if (adminApp) return adminApp;
  const existing = getApps().find((app2) => app2.name === ADMIN_APP_NAME);
  adminApp = existing ?? initializeApp({ projectId }, ADMIN_APP_NAME);
  return adminApp;
}
function officialVerifier(projectId) {
  return (idToken) => getAuth(resolveAdminApp(projectId)).verifyIdToken(idToken);
}
function boundedString(value) {
  return typeof value === "string" && value.length <= 200 ? value : void 0;
}
function readSafeFirebaseTokenMetadata(idToken) {
  const segments = idToken.split(".");
  const metadata = {
    format: segments.length === 3 ? "jwt" : "opaque",
    segmentCount: segments.length
  };
  if (segments.length !== 3) return metadata;
  try {
    const payload = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
    const firebase = payload.firebase;
    return {
      ...metadata,
      issuer: boundedString(payload.iss),
      audience: boundedString(payload.aud),
      uid: boundedString(payload.sub),
      signInProvider: boundedString(firebase?.sign_in_provider),
      issuedAt: typeof payload.iat === "number" ? payload.iat : void 0,
      authTime: typeof payload.auth_time === "number" ? payload.auth_time : void 0
    };
  } catch {
    return metadata;
  }
}
function verificationFailureStage(error) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Decoding Firebase ID token failed")) return "decode";
  if (message.includes("Error fetching public keys for Google certs")) return "public-key-fetch";
  if (message.includes("invalid signature")) return "signature";
  if (message.includes("does not correspond to a known public key")) return "public-key-id";
  if (message.includes('incorrect "aud"')) return "audience";
  if (message.includes('incorrect "iss"')) return "issuer";
  if (message.includes('no "kid"')) return "key-id";
  if (message.includes("incorrect algorithm")) return "algorithm";
  if (message.includes("subject")) return "subject";
  return "verifyIdToken";
}
function readBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== "string") return null;
  const token = authorizationHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return token || null;
}
async function verifyFirebaseIdToken(idToken, options) {
  if (!idToken) throw new MiraAuthError("unauthenticated", "Missing authentication token.");
  try {
    const decoded = await (options.verifyToken ?? officialVerifier(options.projectId))(idToken);
    if (!decoded.uid) throw new MiraAuthError("unauthenticated", "Authentication token has no subject.");
    return { uid: decoded.uid };
  } catch (error) {
    if (error instanceof MiraAuthError) throw error;
    const code = String(error?.code ?? "");
    const stage = verificationFailureStage(error);
    const rejectedTokenCodes = /* @__PURE__ */ new Set([
      "auth/argument-error",
      "auth/id-token-expired",
      "auth/id-token-revoked",
      "auth/invalid-id-token",
      "auth/user-disabled"
    ]);
    if (rejectedTokenCodes.has(code) && stage !== "public-key-fetch") {
      if (!options.verifyToken) {
        console.warn("[Mira auth] Firebase rejected an ID token.", {
          code,
          stage,
          expectedProjectId: options.projectId,
          token: readSafeFirebaseTokenMetadata(idToken)
        });
      }
      throw new MiraAuthError("unauthenticated", "Authentication token is invalid or expired.");
    }
    if (!options.verifyToken) {
      console.warn("[Mira auth] Firebase token verification is unavailable.", {
        code: code || "unknown",
        stage,
        expectedProjectId: options.projectId
      });
    }
    throw new MiraAuthError("auth_unavailable", "Sign-in verification service is unavailable.");
  }
}
async function authenticateMiraRequest(request, options) {
  const header = typeof request.headers.authorization === "string" ? request.headers.authorization : null;
  const token = readBearerToken(header);
  if (!token) return { ok: false, status: 401, code: "unauthenticated" };
  try {
    const { uid } = await verifyFirebaseIdToken(token, options);
    return { ok: true, uid };
  } catch (error) {
    const code = error instanceof MiraAuthError ? error.code : "auth_unavailable";
    return { ok: false, status: code === "auth_unavailable" ? 503 : 401, code };
  }
}

// server/mira/miraRoutes.ts
var MIRA_MAX_MESSAGE_CHARS = 2e3;
var MIRA_MAX_HISTORY_TURNS = 8;
var MIRA_MAX_HISTORY_TURN_CHARS = 1200;
var MIRA_MAX_SPEAK_CHARS = 900;
var MIRA_MAX_AUDIO_BASE64_CHARS = 4e6;
var MIRA_PROVIDER_TIMEOUT_MS = 3e4;
var CONVERSATION_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
var ALLOWED_AUDIO_MIME_TYPES = /* @__PURE__ */ new Set([
  "audio/webm",
  "audio/ogg",
  "audio/opus",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/aac",
  "audio/flac",
  "audio/aiff",
  "audio/l16",
  "audio/alaw",
  "audio/mulaw"
]);
var RATE_LIMITS = {
  chat: { max: 30, windowMs: 5 * 6e4 },
  voice: { max: 15, windowMs: 5 * 6e4 }
};
var rateLimitBuckets = /* @__PURE__ */ new Map();
function checkMiraRateLimit(uid, kind, now = Date.now()) {
  const { max, windowMs } = RATE_LIMITS[kind];
  const recent = (rateLimitBuckets.get(uid) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1e3));
    rateLimitBuckets.set(uid, recent);
    return { allowed: false, retryAfterSeconds };
  }
  recent.push(now);
  rateLimitBuckets.set(uid, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}
function isMiraVoiceEnabledOnServer(envValue = process.env.MIRA_VOICE_ENABLED) {
  return resolveMiraVoiceCapability(envValue ?? null);
}
function sendError(res, status, code, message) {
  res.status(status).json({ error: { code, message } });
}
async function withAuthenticatedUser(req, res, projectId) {
  const result = await authenticateMiraRequest(req, { projectId });
  if (result.ok === false) {
    sendError(
      res,
      result.status,
      result.code,
      result.code === "auth_unavailable" ? "Sign-in verification is temporarily unavailable. Please try again." : "Sign in again to use Mira."
    );
    return null;
  }
  return { uid: result.uid };
}
function readString(value, maxLength) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}
function readMiraHistory(value) {
  if (value === void 0 || value === null) return [];
  if (!Array.isArray(value) || value.length > MIRA_MAX_HISTORY_TURNS) return null;
  const turns = [];
  for (const entry of value) {
    if (entry === null || typeof entry !== "object") return null;
    const record = entry;
    const role = record.role === "user" || record.role === "assistant" ? record.role : null;
    const text = readString(record.text, MIRA_MAX_HISTORY_TURN_CHARS);
    if (!role || !text) return null;
    turns.push({ role, text });
  }
  return turns;
}
function normalizeAudioMimeType(value) {
  if (typeof value !== "string") return null;
  const base = value.split(";")[0].trim().toLowerCase();
  return ALLOWED_AUDIO_MIME_TYPES.has(base) ? base : null;
}
async function withProviderTimeout(operation, timeoutMs) {
  let timeoutId;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Mira provider timed out.")), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId !== void 0) clearTimeout(timeoutId);
  }
}
function registerMiraRoutes(app2, options) {
  const providerTimeoutMs = options.providerTimeoutMs ?? MIRA_PROVIDER_TIMEOUT_MS;
  app2.post("/api/mira/chat", async (req, res) => {
    const context = await withAuthenticatedUser(req, res, options.projectId);
    if (!context) return;
    const limit = checkMiraRateLimit(context.uid, "chat");
    if (!limit.allowed) {
      res.setHeader("Retry-After", String(limit.retryAfterSeconds));
      sendError(res, 429, "rate_limited", "Too many Mira messages in a short time. Please wait a moment and try again.");
      return;
    }
    const body = req.body ?? {};
    const language = body.language;
    if (!isMiraLanguageCode(language)) {
      sendError(res, 400, "invalid_language", "Choose one of the supported Mira languages.");
      return;
    }
    const message = readString(body.message, MIRA_MAX_MESSAGE_CHARS);
    if (!message) {
      sendError(res, 400, "invalid_message", `Send a message between 1 and ${MIRA_MAX_MESSAGE_CHARS} characters.`);
      return;
    }
    const source = body.source === "voice" ? "voice" : "text";
    const conversationId = body.conversationId;
    if (conversationId !== void 0 && (typeof conversationId !== "string" || !CONVERSATION_ID_PATTERN.test(conversationId))) {
      sendError(res, 400, "invalid_conversation", "The conversation reference is not valid.");
      return;
    }
    const history = readMiraHistory(body.history);
    if (history === null) {
      sendError(res, 400, "invalid_history", "The recent conversation could not be read.");
      return;
    }
    const recentPatientTurns = history.filter((turn) => turn.role === "user").slice(-3).map((turn) => turn.text);
    const recentPatientMessages = [...recentPatientTurns, message];
    const deterministicEscalation = classifyMiraEscalation({
      userText: message,
      recentPatientTurns,
      language
    });
    if (deterministicEscalation.urgency === "urgent") {
      res.json({
        reply: MIRA_URGENT_REPLY,
        language,
        escalation: deterministicEscalation,
        handoff: null,
        handoffLabel: "",
        emergencyGuidance: MIRA_EMERGENCY_GUIDANCE,
        provider: { model: "deterministic-safety" }
      });
      return;
    }
    const provider = options.getProvider();
    if (!provider) {
      sendError(
        res,
        503,
        "mira_unavailable",
        "Mira response service is not configured."
      );
      return;
    }
    try {
      const result = await withProviderTimeout(
        provider.chat({ language, history, message }),
        providerTimeoutMs
      );
      const escalation = classifyMiraEscalation({
        userText: message,
        recentPatientTurns,
        language,
        modelUrgency: result.modelUrgency,
        modelReason: result.modelReason
      });
      const handoff = escalation.urgency === "specialist" ? buildMiraHandoffDraft({ patientMessages: recentPatientMessages, escalation }) : null;
      console.info("[Mira] chat completed", { language, source, urgency: escalation.urgency });
      res.json({
        reply: result.reply,
        language,
        escalation,
        handoff,
        handoffLabel: MIRA_HANDOFF_LABEL,
        emergencyGuidance: escalation.urgency === "urgent" ? MIRA_EMERGENCY_GUIDANCE : null,
        provider: { model: result.model }
      });
    } catch {
      sendError(res, 503, "mira_unavailable", "Mira response service is temporarily unavailable. Please try again.");
    }
  });
  app2.post("/api/mira/transcribe", async (req, res) => {
    const context = await withAuthenticatedUser(req, res, options.projectId);
    if (!context) return;
    const limit = checkMiraRateLimit(context.uid, "voice");
    if (!limit.allowed) {
      res.setHeader("Retry-After", String(limit.retryAfterSeconds));
      sendError(res, 429, "rate_limited", "Too many voice requests in a short time. Please wait a moment and try again.");
      return;
    }
    if (!isMiraVoiceEnabledOnServer()) {
      sendError(res, 403, "voice_disabled", "Voice is not enabled on this server.");
      return;
    }
    const body = req.body ?? {};
    const language = body.language;
    if (!isMiraLanguageCode(language)) {
      sendError(res, 400, "invalid_language", "Choose one of the supported Mira languages.");
      return;
    }
    const definition = miraLanguageDefinition(language);
    if (miraVoiceCapability(language, "speechToText") !== "verified") {
      sendError(res, 422, "voice_language_unsupported", `Voice input is not available in ${definition.label} right now.`);
      return;
    }
    const mimeType = normalizeAudioMimeType(body.mimeType);
    if (!mimeType) {
      sendError(res, 400, "invalid_audio_type", "That audio format is not supported for transcription.");
      return;
    }
    const audioBase64 = typeof body.audioBase64 === "string" ? body.audioBase64.trim() : "";
    if (!audioBase64 || audioBase64.length > MIRA_MAX_AUDIO_BASE64_CHARS) {
      sendError(res, 400, "invalid_audio", "Send a short voice clip (about one minute or less).");
      return;
    }
    const provider = options.getProvider();
    if (!provider) {
      sendError(res, 503, "mira_unavailable", "Voice service is not configured.");
      return;
    }
    try {
      const result = await withProviderTimeout(
        provider.transcribe({ audioBase64, mimeType, language }),
        providerTimeoutMs
      );
      console.info("[Mira] transcription completed", { language, model: result.model });
      res.json({ transcript: result.transcript, language, provider: { model: result.model } });
    } catch {
      sendError(res, 503, "mira_unavailable", "Mira could not transcribe that recording. Please try again.");
    }
  });
  app2.post("/api/mira/speak", async (req, res) => {
    const context = await withAuthenticatedUser(req, res, options.projectId);
    if (!context) return;
    const limit = checkMiraRateLimit(context.uid, "voice");
    if (!limit.allowed) {
      res.setHeader("Retry-After", String(limit.retryAfterSeconds));
      sendError(res, 429, "rate_limited", "Too many voice requests in a short time. Please wait a moment and try again.");
      return;
    }
    if (!isMiraVoiceEnabledOnServer()) {
      sendError(res, 403, "voice_disabled", "Voice is not enabled on this server.");
      return;
    }
    const body = req.body ?? {};
    const language = body.language;
    if (!isMiraLanguageCode(language)) {
      sendError(res, 400, "invalid_language", "Choose one of the supported Mira languages.");
      return;
    }
    const definition = miraLanguageDefinition(language);
    if (miraVoiceCapability(language, "textToSpeech") !== "verified") {
      sendError(res, 422, "voice_language_unsupported", `Spoken replies are not available in ${definition.label} right now.`);
      return;
    }
    const text = readString(body.text, MIRA_MAX_SPEAK_CHARS);
    if (!text) {
      sendError(res, 400, "invalid_text", `Send text between 1 and ${MIRA_MAX_SPEAK_CHARS} characters to be spoken.`);
      return;
    }
    const provider = options.getProvider();
    if (!provider) {
      sendError(res, 503, "mira_unavailable", "Voice service is not configured.");
      return;
    }
    try {
      const result = await withProviderTimeout(
        provider.synthesize({ text, language }),
        providerTimeoutMs
      );
      console.info("[Mira] speech synthesized", { language, model: result.model });
      res.json({
        audioBase64: result.audioBase64,
        mimeType: result.mimeType,
        language,
        provider: { model: result.model }
      });
    } catch {
      sendError(res, 503, "mira_unavailable", "Mira could not create spoken audio. Please try again.");
    }
  });
}

// server/mira/miraVoiceProvider.ts
var MIRA_VOICE_PROVIDER_PREFERENCES = {
  en: { speechToText: ["gemini", "yarngpt"], textToSpeech: ["yarngpt", "gemini"] },
  ha: { speechToText: ["gemini"], textToSpeech: ["yarngpt", "gemini"] },
  ig: { speechToText: ["gemini", "yarngpt"], textToSpeech: ["yarngpt", "gemini"] },
  yo: { speechToText: ["gemini", "yarngpt"], textToSpeech: ["yarngpt"] },
  pcm: { speechToText: ["gemini", "yarngpt"], textToSpeech: ["yarngpt"] }
};
async function usePreferredProvider(ids, providers, call) {
  for (const id of ids) {
    const provider = providers[id];
    if (!provider) continue;
    try {
      return await call(provider);
    } catch (error) {
      if (!(error instanceof MiraProviderError)) throw error;
    }
  }
  throw new MiraProviderError("Voice is unavailable for this language right now.");
}
function createMiraProviderWithVoiceSelection(chatProvider, providers) {
  return {
    chat: async (input) => {
      if (!chatProvider) {
        throw new MiraProviderError("Mira response service is not configured.");
      }
      return chatProvider.chat(input);
    },
    transcribe: (input) => usePreferredProvider(
      MIRA_VOICE_PROVIDER_PREFERENCES[input.language].speechToText,
      providers,
      (provider) => provider.transcribe(input)
    ),
    synthesize: (input) => usePreferredProvider(
      MIRA_VOICE_PROVIDER_PREFERENCES[input.language].textToSpeech,
      providers,
      (provider) => provider.synthesize(input)
    )
  };
}

// server/mira/miraYarnGptProvider.ts
import { randomUUID } from "node:crypto";
var YARNGPT_BASE_URL = "https://api.yarngpt.ai";
var YARNGPT_ASR_MODEL = "yarngpt-asr-v1";
var YARNGPT_TTS_MODEL = "yarngpt-streaming-conversation-v1";
var LANGUAGE_ALIASES = {
  en: ["en", "english"],
  ha: ["ha", "hausa"],
  ig: ["ig", "igbo"],
  yo: ["yo", "yoruba", "yor\xF9b\xE1"],
  pcm: ["pcm", "pidgin", "nigerian pidgin", "naija pidgin"]
};
var TRANSIENT_HTTP_STATUSES = /* @__PURE__ */ new Set([500, 502, 503, 504]);
var ASR_UPLOAD_RETRY_DELAYS_MS = [1e3];
var TRANSIENT_ERROR_CODES = /* @__PURE__ */ new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ENETDOWN",
  "ENETUNREACH",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_SOCKET"
]);
function normalized(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("en");
}
function supportsLanguage(values, language) {
  const aliases = LANGUAGE_ALIASES[language];
  const labels = values.flatMap((value) => {
    if (!value || typeof value !== "object") return [value];
    const record = value;
    return [record.code, record.name, record.language, record.language_code];
  });
  return labels.some((value) => {
    const candidate = normalized(value);
    return aliases.some((alias) => {
      const expected = normalized(alias);
      return candidate === expected || candidate.startsWith(`${expected} `) || candidate.includes(`(${expected})`);
    });
  });
}
function extensionForMime(mimeType) {
  const base = mimeType.split(";")[0].toLowerCase();
  if (base.includes("wav")) return "wav";
  if (base.includes("mpeg") || base.includes("mp3")) return "mp3";
  if (base.includes("ogg") || base.includes("opus")) return "ogg";
  if (base.includes("mp4") || base.includes("m4a")) return "m4a";
  if (base.includes("flac")) return "flac";
  if (base.includes("aiff")) return "aiff";
  return "webm";
}
function errorMessage(payload, fallback) {
  const error = payload?.error;
  if (typeof error?.user_message === "string" && error.user_message.trim()) return error.user_message;
  if (typeof error?.message === "string" && error.message.trim()) return error.message;
  return typeof error?.code === "string" ? `${fallback} (${error.code})` : fallback;
}
function apiErrorCode(payload) {
  const code = payload?.error?.code;
  return typeof code === "string" ? code : null;
}
function logYarnGptFailure(operation, response, payload) {
  const error = payload?.error;
  console.warn("[Mira] YarnGPT request failed", {
    operation,
    status: response.status,
    code: typeof error?.code === "string" ? error.code : null,
    service: typeof error?.service === "string" ? error.service : null,
    traceId: typeof error?.trace_id === "string" ? error.trace_id : null
  });
}
async function readJson(response) {
  return response.json().catch(() => null);
}
function isTransientTransportError(error) {
  if (!error || typeof error !== "object") return false;
  const candidate = error;
  if (candidate.name === "AbortError" || candidate.name === "TimeoutError") return true;
  if (typeof candidate.code === "string" && TRANSIENT_ERROR_CODES.has(candidate.code)) return true;
  if (candidate.cause && typeof candidate.cause === "object") {
    const causeCode = candidate.cause.code;
    if (typeof causeCode === "string" && TRANSIENT_ERROR_CODES.has(causeCode)) return true;
  }
  return error instanceof TypeError;
}
async function requestWithOneTransientRetry(request, unavailableMessage) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await request();
      if (attempt === 0 && TRANSIENT_HTTP_STATUSES.has(response.status)) continue;
      return response;
    } catch (error) {
      if (attempt === 0 && isTransientTransportError(error)) continue;
      if (isTransientTransportError(error)) throw new MiraProviderError(unavailableMessage);
      throw error;
    }
  }
  throw new MiraProviderError(unavailableMessage);
}
function createYarnGptVoiceProvider(options) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const pollIntervalMs = options.pollIntervalMs ?? 1e3;
  const maxPolls = options.maxPolls ?? 90;
  const authorization = `Bearer ${options.apiKey}`;
  let asrLanguages = null;
  let voices = null;
  const authenticatedFetch = (path, init = {}) => fetchImpl(`${YARNGPT_BASE_URL}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: authorization }
  });
  const loadAsrLanguages = async () => {
    if (asrLanguages) return asrLanguages;
    const response = await requestWithOneTransientRetry(
      () => authenticatedFetch("/api/v1/asr/languages"),
      "YarnGPT language availability is temporarily unavailable."
    );
    const payload = await readJson(response);
    if (!response.ok) throw new MiraProviderError(errorMessage(payload, "YarnGPT language availability could not be checked."));
    const record = payload;
    asrLanguages = Array.isArray(record?.languages) ? record.languages : [];
    return asrLanguages;
  };
  const loadVoices = async () => {
    if (voices) return voices;
    const response = await requestWithOneTransientRetry(
      () => authenticatedFetch("/api/v1/voices"),
      "YarnGPT voices are temporarily unavailable."
    );
    const payload = await readJson(response);
    if (!response.ok) throw new MiraProviderError(errorMessage(payload, "YarnGPT voices could not be loaded."));
    const candidates = Array.isArray(payload) ? payload : payload?.voices;
    voices = Array.isArray(candidates) ? candidates.filter((entry) => Boolean(entry) && typeof entry === "object") : [];
    return voices;
  };
  const voiceForLanguage = async (language) => {
    const catalogue = await loadVoices();
    const matching = catalogue.filter((voice) => {
      const listed = Array.isArray(voice.languages) ? voice.languages : [voice.language, voice.language_code];
      return supportsLanguage(listed, language);
    });
    const selected = matching.find((voice) => voice.default === true) ?? matching[0];
    const name = selected?.name;
    if (typeof name !== "string" || !name) {
      throw new MiraProviderError("YarnGPT has no listed voice for this language.");
    }
    return name;
  };
  return {
    async transcribe(input) {
      const supported = await loadAsrLanguages();
      if (!supportsLanguage(supported, input.language)) {
        throw new MiraProviderError("YarnGPT does not list speech recognition for this language.");
      }
      const bytes = Buffer.from(input.audioBase64, "base64");
      const idempotencyKey = randomUUID();
      let upload = null;
      let uploadPayload = null;
      for (let attempt = 0; attempt <= ASR_UPLOAD_RETRY_DELAYS_MS.length; attempt += 1) {
        try {
          const body = new FormData();
          body.append("file", new Blob([bytes], { type: input.mimeType }), `mira.${extensionForMime(input.mimeType)}`);
          upload = await authenticatedFetch("/api/v1/asr", {
            method: "POST",
            headers: { "Idempotency-Key": idempotencyKey },
            body
          });
          uploadPayload = await readJson(upload);
        } catch (error) {
          if (!isTransientTransportError(error) || attempt === ASR_UPLOAD_RETRY_DELAYS_MS.length) {
            if (isTransientTransportError(error)) {
              throw new MiraProviderError("YarnGPT transcription upload is temporarily unavailable.");
            }
            throw error;
          }
          await sleep(ASR_UPLOAD_RETRY_DELAYS_MS[attempt]);
          continue;
        }
        if (upload.ok) break;
        const retryableInProgress = upload.status === 409 && apiErrorCode(uploadPayload) === "ALREADY_EXISTS";
        const retryableFailure = TRANSIENT_HTTP_STATUSES.has(upload.status) || retryableInProgress;
        if (!retryableFailure || attempt === ASR_UPLOAD_RETRY_DELAYS_MS.length) break;
        await sleep(ASR_UPLOAD_RETRY_DELAYS_MS[attempt]);
      }
      if (!upload || !upload.ok) {
        if (upload) logYarnGptFailure("asr_upload", upload, uploadPayload);
        throw new MiraProviderError(errorMessage(uploadPayload, "YarnGPT transcription upload failed."));
      }
      const jobId = uploadPayload?.job_id;
      if (typeof jobId !== "string" || !jobId) throw new MiraProviderError("YarnGPT returned no transcription job.");
      for (let attempt = 0; attempt < maxPolls; attempt += 1) {
        if (attempt > 0) await sleep(pollIntervalMs);
        const poll = await requestWithOneTransientRetry(
          () => authenticatedFetch(`/api/v1/asr/${encodeURIComponent(jobId)}`),
          "YarnGPT transcription status is temporarily unavailable."
        );
        const payload = await readJson(poll);
        if (!poll.ok) {
          logYarnGptFailure("asr_status", poll, payload);
          throw new MiraProviderError(errorMessage(payload, "YarnGPT transcription status failed."));
        }
        const result = payload;
        if (result.status === "completed") {
          const transcript = typeof result.transcript === "string" ? result.transcript.trim() : "";
          if (!transcript) throw new MiraProviderError("YarnGPT transcription returned no speech.");
          return { transcript, model: YARNGPT_ASR_MODEL };
        }
        if (result.status === "failed") {
          console.warn("[Mira] YarnGPT transcription job failed", {
            code: typeof payload.error_code === "string" ? payload.error_code : null,
            audioAvailable: payload.audio_available === true
          });
          throw new MiraProviderError(
            typeof result.error_message === "string" ? result.error_message : "YarnGPT transcription failed."
          );
        }
      }
      throw new MiraProviderError("YarnGPT transcription timed out.");
    },
    async synthesize(input) {
      const voice = await voiceForLanguage(input.language);
      const idempotencyKey = randomUUID();
      const body = JSON.stringify({ text: input.text, voice, output_format: "wav" });
      for (let attempt = 0; attempt < 2; attempt += 1) {
        let response;
        try {
          response = await authenticatedFetch("/api/v1/streaming/conversation", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
            body
          });
        } catch (error) {
          if (attempt === 0 && isTransientTransportError(error)) continue;
          if (isTransientTransportError(error)) {
            throw new MiraProviderError("YarnGPT speech synthesis is temporarily unavailable.");
          }
          throw error;
        }
        if (attempt === 0 && TRANSIENT_HTTP_STATUSES.has(response.status)) continue;
        if (!response.ok) {
          const payload = await readJson(response);
          throw new MiraProviderError(errorMessage(payload, "YarnGPT speech synthesis failed."));
        }
        const audio = Buffer.from(await response.arrayBuffer());
        if (audio.length === 0) {
          if (attempt === 0) continue;
          throw new MiraProviderError("YarnGPT returned empty speech audio.");
        }
        const mimeType = response.headers.get("content-type")?.split(";")[0] || "audio/wav";
        return { audioBase64: audio.toString("base64"), mimeType, model: YARNGPT_TTS_MODEL };
      }
      throw new MiraProviderError("YarnGPT speech synthesis is temporarily unavailable.");
    }
  };
}

// server/mira/miraApiApp.ts
var DEFAULT_FIREBASE_PROJECT_ID = "gen-lang-client-0440960552";
function initializeStage(stage, operation) {
  try {
    return operation();
  } catch (cause) {
    const error = new Error(`Mira API initialization failed at ${stage}.`, { cause });
    error.name = "MiraApiInitializationError";
    error.code = `MIRA_INIT_${stage.toUpperCase()}`;
    throw error;
  }
}
function createMiraApiApp(options = {}) {
  const app2 = initializeStage("express", () => express());
  let geminiInstance = null;
  let provider = null;
  const getGemini = options.getGemini ?? (() => {
    if (geminiInstance) return geminiInstance;
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey?.trim()) return null;
    geminiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });
    return geminiInstance;
  });
  const getProvider = () => {
    if (provider) return provider;
    const ai = getGemini();
    const gemini = ai ? createGeminiMiraProvider(ai) : null;
    const yarnGptKey = process.env.YARNGPT_API_KEY?.trim();
    if (!gemini && !yarnGptKey) return null;
    provider = createMiraProviderWithVoiceSelection(gemini, {
      ...gemini ? { gemini } : {},
      ...yarnGptKey ? { yarngpt: createYarnGptVoiceProvider({ apiKey: yarnGptKey }) } : {}
    });
    return provider;
  };
  initializeStage("middleware", () => {
    app2.use("/api/mira/transcribe", express.json({ limit: "8mb" }));
    app2.use("/api/mira", express.json());
  });
  initializeStage("routes", () => {
    registerMiraRoutes(app2, {
      getProvider,
      projectId: options.projectId || process.env.MIRA_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID
    });
    app2.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  });
  return app2;
}

// server/mira/miraVercelHandler.ts
var app = null;
var allowedRoutes = /* @__PURE__ */ new Set([
  "mira/chat",
  "mira/transcribe",
  "mira/speak"
]);
function handler(request, response) {
  const requestUrl = new URL(request.url || "/api", "http://warrior.internal");
  const routedPath = requestUrl.searchParams.get("path")?.replace(/^\/+|\/+$/g, "") || "";
  if (!allowedRoutes.has(routedPath)) {
    response.statusCode = 404;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ error: { code: "not_found", message: "API route not found." } }));
    return;
  }
  request.url = `/api/${routedPath}`;
  app ??= createMiraApiApp();
  app(request, response);
}
export {
  handler as default
};
