import type { MiraLanguageCode } from '../../services/miraConfig';
import type {
  MiraClinicalUrgency,
  MiraSafetyCategory,
  MiraSafetyDetectionLevel,
} from '../../services/miraClinicalContracts';

export interface MiraSafetyCategoryDefinition {
  category: MiraSafetyCategory;
  level: MiraSafetyDetectionLevel;
  urgency: Exclude<MiraClinicalUrgency, 'none'>;
  reason: string;
  legacyLabel: string;
  cues: Partial<Record<MiraLanguageCode, readonly RegExp[]>>;
}

export const MIRA_SAFETY_LANGUAGE_REVIEW_STATUS: Record<
  MiraLanguageCode,
  'code-reviewed' | 'native-human-review-required'
> = {
  en: 'code-reviewed',
  pcm: 'native-human-review-required',
  yo: 'native-human-review-required',
  ig: 'native-human-review-required',
  ha: 'native-human-review-required',
};

// Non-English cues are deliberately small. They retain phrases already used in
// this project plus high-value common expressions. Automated tests verify code
// behavior only; they are not clinical or native-language approval.
export const MIRA_SAFETY_CATEGORY_DEFINITIONS: readonly MiraSafetyCategoryDefinition[] = [
  {
    category: 'chest_pain',
    level: 'DETERMINISTIC',
    urgency: 'urgent',
    reason: 'current chest pain',
    legacyLabel: 'chest pain',
    cues: {
      en: [/\bchest pain\b/i, /\bpain (?:in|inside) (?:my|the) chest\b/i],
      pcm: [/\bchest dey pain me\b/i, /\bpain (?:for|inside) my chest\b/i],
      ha: [/ciwon kirji/iu],
    },
  },
  {
    category: 'breathing_difficulty',
    level: 'DETERMINISTIC',
    urgency: 'urgent',
    reason: 'difficulty breathing',
    legacyLabel: 'difficulty breathing',
    cues: {
      en: [
        /\bcan(?:no|')?t breathe\b/i,
        /\bdifficulty breathing\b/i,
        /\bshort(?:ness)? of breath\b/i,
        /\bbreathless\b/i,
        /\bstruggling to breathe\b/i,
      ],
      pcm: [/\bi no fit breathe\b/i, /\bbreath no dey\b/i, /\bhard (?:for me )?to breathe\b/i],
      yo: [/ìṣòro mímí/iu, /mi ò lè mí/iu, /isoro mimi/iu],
      ig: [/nsogbu iku ume/iu, /enweghị m ike iku ume/iu, /enweghi m ike iku ume/iu],
      ha: [/wahalar numfashi/iu, /ba zan iya numfashi ba/iu],
    },
  },
  {
    category: 'neurological_warning',
    level: 'DETERMINISTIC',
    urgency: 'urgent',
    reason: 'new stroke-like or one-sided neurological warning signs',
    legacyLabel: 'possible stroke signs',
    cues: {
      en: [
        /\bface droop(?:ing)?\b/i,
        /\bnew slurred speech\b/i,
        /\bnew (?:speech|speaking) difficulty\b/i,
        /\bweak(?:ness)? on one side\b/i,
        /\bone[- ]sided weakness\b/i,
        /\bcan(?:no|')?t move my (?:arm|leg|hand)\b/i,
        /\bstroke signs?\b/i,
      ],
      pcm: [/\bone side (?:of )?my body weak\b/i, /\bmy mouth bend suddenly\b/i],
      ha: [/rashin karfi a gefen jiki/iu, /karkatar baki/iu],
    },
  },
  {
    category: 'seizure_or_unconsciousness',
    level: 'DETERMINISTIC',
    urgency: 'urgent',
    reason: 'seizure or loss of consciousness',
    legacyLabel: 'seizure or loss of consciousness',
    cues: {
      en: [
        /\bseizure\b/i,
        /\bconvulsion\b/i,
        /\bpassed out\b/i,
        /\bunconscious\b/i,
        /\blost consciousness\b/i,
      ],
      pcm: [/\bi pass out\b/i, /\bi no conscious\b/i],
    },
  },
  {
    category: 'fever_or_infection',
    level: 'DETERMINISTIC',
    urgency: 'urgent',
    reason: 'current fever or infection concern',
    legacyLabel: 'fever or signs of infection',
    cues: {
      en: [/\bfever\b/i, /\bhigh temperature\b/i, /\b38\.5\b/i, /\b39(?:\.\d)?\s*(?:°|degrees)?\b/i],
      pcm: [/\bi get fever\b/i, /\bmy body dey hot\b/i, /\bbody dey hot\b/i],
      yo: [/mo ní ibà/iu, /\bmo ni iba\b/iu, /ibà/iu],
      ig: [/ahụ ọkụ/iu, /ahu oku/iu],
      ha: [/\bzazzabi\b/iu],
    },
  },
  {
    category: 'severe_or_worsening_pain',
    level: 'DETERMINISTIC',
    urgency: 'urgent',
    reason: 'severe or worsening pain',
    legacyLabel: 'severe or worsening pain',
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
        /\bhaving a crisis\b/i,
      ],
      pcm: [/\bpain dey too much\b/i, /\bserious pain\b/i, /\bbad pain\b/i, /\bpain no gree\b/i],
      yo: [/ìrora gíga/iu, /irora giga/iu, /ìrora púpọ̀/iu, /agbákò/iu, /agbako/iu, /fitila/iu],
      ig: [/oké mgbu/iu, /oke mgbu/iu, /nsogbu ike/iu],
      ha: [/matsanancin ciwo/iu],
    },
  },
  {
    category: 'unable_to_drink_or_retain_fluids',
    level: 'DETERMINISTIC',
    urgency: 'urgent',
    reason: 'unable to drink or keep fluids down',
    legacyLabel: 'unable to keep fluids down',
    cues: {
      en: [
        /\bcan(?:no|')?t keep (?:any )?(?:water|fluids?) down\b/i,
        /\bunable to (?:drink|keep fluids? down)\b/i,
        /\bvomiting (?:everything|non[- ]?stop)\b/i,
      ],
      pcm: [/\bi no fit keep (?:water|fluid) down\b/i, /\bi dey vomit everything\b/i],
    },
  },
  {
    category: 'priapism',
    level: 'DETERMINISTIC',
    urgency: 'urgent',
    reason: 'painful or prolonged erection',
    legacyLabel: 'priapism',
    cues: {
      en: [/\bpriapism\b/i, /\bpainful erection\b/i, /\berection.{0,24}(?:hours?|over two hours)\b/i],
      ha: [/taurin gaba mai zafi/iu],
    },
  },
  {
    category: 'confusion_or_severe_weakness',
    level: 'HYBRID',
    urgency: 'specialist',
    reason: 'new confusion or severe weakness that needs clarification',
    legacyLabel: 'confusion or severe weakness',
    cues: {
      en: [/\bnew confusion\b/i, /\bvery confused\b/i, /\bsevere weakness\b/i, /\bsuddenly very weak\b/i],
      pcm: [/\bi confuse well well\b/i, /\bi weak well well\b/i],
    },
  },
  {
    category: 'sudden_pallor_or_splenic_concern',
    level: 'HYBRID',
    urgency: 'specialist',
    reason: 'sudden pallor or splenic concern that needs clarification',
    legacyLabel: 'possible splenic or blood-volume problem',
    cues: {
      en: [/\bsudden pallor\b/i, /\bsuddenly very pale\b/i, /\bspleen (?:pain|swelling|enlarged)\b/i, /\bsplenic concern\b/i],
      ha: [/rashin jini kwatsam/iu],
    },
  },
  {
    category: 'pregnancy_emergency',
    level: 'HYBRID',
    urgency: 'specialist',
    reason: 'pregnancy-related warning language that needs urgent clarification',
    legacyLabel: 'pregnancy-related warning signs',
    cues: {
      en: [
        /\b(?:pregnant|pregnancy).{0,50}\b(?:heavy bleeding|severe pain|can(?:no|')?t breathe|fainted|unconscious)\b/i,
        /\b(?:heavy bleeding|severe pain).{0,50}\b(?:pregnant|pregnancy)\b/i,
      ],
      pcm: [/\bi get belle.{0,40}(?:blood dey come plenty|serious pain|i no fit breathe)\b/i],
    },
  },
  {
    category: 'mental_health_crisis',
    level: 'DETERMINISTIC',
    urgency: 'urgent',
    reason: 'current self-harm or suicide language',
    legacyLabel: 'mental-health crisis',
    cues: {
      en: [
        /\bi (?:want|plan) to kill myself\b/i,
        /\bi (?:want|plan) to end my life\b/i,
        /\bi am going to hurt myself\b/i,
        /\bi do not want to live\b/i,
        /\bsuicidal\b/i,
      ],
      pcm: [/\bi wan kill myself\b/i, /\bi no wan live again\b/i],
    },
  },
] as const;
