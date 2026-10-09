# Mira H4A Clinical Review Packet

**Packet date:** 2026-10-09
**Candidate pack:** H4A version `1.0.0`
**Current governance status:** `research-curated-pending-clinical-review`
**Required reviewer:** Qualified haematologist, with additional specialty review
where identified

## Review boundary

This packet presents the exact H4A candidate content for human review. It does not
constitute clinical approval. The modules are not connected to Mira prompts,
providers, retrieval, patient context, Firestore or UI. Approval of this packet
does not by itself authorize runtime integration.

The reviewer should assess the exact wording, source selection, safety boundaries,
and escalation mappings. Requested wording changes must create a new candidate
revision; they must not be applied silently to an approved version.

## Resolved research-to-registry source inconsistency

The `emergency_warning_signs` candidate says, “Pregnancy adds a lower threshold for
specialist assessment.” The research text supports that sentence with the WHO
pregnancy guideline (S02) and the Nigerian national guideline (S04). The reviewed-
source list and registry initially omitted S02; the WHO pregnancy source has now
been added to the candidate metadata without changing the module's clinical wording.

Some registry source dates are absent where the research document supplies only a
year, month, or “current page” status rather than a complete ISO date. No date was
invented to fill those fields.

## Module reviews

### 1. `scd_basics`

| Field | Candidate value |
| --- | --- |
| Version | `1.0.0` |
| Title | Sickle-cell basics |
| Risk | Low |
| Intended use | Explain the inherited blood disorder, common consequences and the role of ongoing care without diagnosing a subtype. |
| Source organizations | World Health Organization; WHO Regional Office for Africa; Federal Ministry of Health, Nigeria; Centers for Disease Control and Prevention |
| Safety categories | None |
| Numeric thresholds omitted | No numeric threshold is needed or included. |
| Jurisdiction limitations | Sources span global, African, Nigerian and US guidance. US care pathways are not implied; screening and comprehensive-care access vary across Africa. |
| Multilingual status | English-only; no Nigerian Pidgin, Yoruba, Hausa or Igbo clinical review. |

**Exact educational points**

1. Sickle-cell disease is an inherited disorder involving abnormal haemoglobin.
2. Red blood cells can become rigid or sickle-shaped, break down early, and obstruct blood flow, contributing to anaemia, pain, and organ complications.
3. The burden of sickle-cell disease is especially high in sub-Saharan Africa, where access to screening and comprehensive care remains uneven.

**Exact allowed self-care guidance**

1. Keep regular care appointments and follow the patient-specific clinical plan.
2. Maintain adequate hydration, avoid known extremes or triggers, and receive clinician-recommended vaccinations.

**Exact prohibited claims**

1. Do not diagnose sickle-cell disease or genotype.
2. Do not promise a cure, predict an individual disease course, or claim every complication is preventable.

**Unresolved conflicts or review questions**

- Confirm that “clinician-recommended vaccinations” is sufficiently clear without
  implying a universal schedule.
- Confirm reading level, genotype-neutral scope and Nigeria-facing screening wording.

| Review area | Approve | Approve with changes | Reject |
| --- | --- | --- | --- |
| Clinical accuracy | [ ] | [ ] | [ ] |
| Safety boundary | [ ] | [ ] | [ ] |
| Escalation mapping | [ ] | [ ] | [ ] |
| Source selection | [ ] | [ ] | [ ] |

**Reviewer comments:**

**Reviewer name:**
**Professional role:**
**Date:**

### 2. `vaso_occlusive_pain`

| Field | Candidate value |
| --- | --- |
| Version | `1.0.0` |
| Title | Vaso-occlusive pain |
| Risk | High |
| Intended use | Explain pain crises, use of an existing personal pain plan and when pain needs urgent human assessment. |
| Source organizations | Federal Ministry of Health, Nigeria; National Heart, Lung, and Blood Institute; American Society of Hematology; National Health Service |
| Safety categories | `severe_or_worsening_pain` |
| Numeric thresholds omitted | No universal pain score or duration for home-plan failure is encoded. |
| Jurisdiction limitations | Nigerian, US and UK sources assume different medicines, home plans and urgent-care access. |
| Multilingual status | English-only; no Nigerian Pidgin, Yoruba, Hausa or Igbo clinical review. |

**Exact educational points**

1. Vaso-occlusive pain is associated with impaired blood flow and may vary greatly between people and episodes.
2. Medicine choice, dose, opioid use, and changes to a home pain plan are individualized clinical decisions.
3. Cognitive or behavioural strategies may be adjuncts to care, but the evidence for some approaches is low certainty and they do not replace medical treatment.

**Exact allowed self-care guidance**

1. Follow the clinician-approved home pain plan.
2. Rest, warmth, and oral fluids may be supportive when the patient has not been told to restrict fluids.
3. Contact the care team when the approved home plan is not working.

**Exact prohibited claims**

1. Do not label all pain as a vaso-occlusive crisis.
2. Do not recommend a new medicine or dose.
3. Do not tell a patient to endure severe pain at home or imply pain intensity rules out a dangerous complication.

**Unresolved conflicts or review questions**

- Define whether “home plan is not working” needs clinically approved wording while
  avoiding an unsafe universal duration.
- Confirm whether additional symptom-specific category links are needed without
  duplicating H3 detection.

| Review area | Approve | Approve with changes | Reject |
| --- | --- | --- | --- |
| Clinical accuracy | [ ] | [ ] | [ ] |
| Safety boundary | [ ] | [ ] | [ ] |
| Escalation mapping | [ ] | [ ] | [ ] |
| Source selection | [ ] | [ ] | [ ] |

**Reviewer comments:**

**Reviewer name:**
**Professional role:**
**Date:**

### 3. `fever_infection`

| Field | Candidate value |
| --- | --- |
| Version | `1.0.0` |
| Title | Fever and infection concern |
| Risk | Critical |
| Intended use | Explain infection risk and require prompt assessment without hiding the threshold conflict. |
| Source organizations | Federal Ministry of Health, Nigeria; Centers for Disease Control and Prevention; National Health Service |
| Safety categories | `fever_or_infection` |
| Numeric thresholds omitted | Nigeria's greater-than-38°C threshold and CDC's 38.5°C threshold are intentionally not collapsed into one rule. |
| Jurisdiction limitations | Nigeria includes malaria-specific clinical assessment; US vaccination and paediatric prophylaxis pathways and UK service routes are not automatically portable. |
| Multilingual status | English-only; no Nigerian Pidgin, Yoruba, Hausa or Igbo clinical review. |

**Exact educational points**

1. Infection can become serious rapidly in sickle-cell disease, and fever or infection concern warrants urgent human assessment.
2. Published fever thresholds differ between the reviewed Nigerian and United States guidance and remain unresolved pending clinical approval.
3. Tests, antibiotics, malaria assessment, and preventive medicines are clinician decisions.

**Exact allowed self-care guidance**

1. Measure temperature if possible, seek urgent care, and follow the existing sick-day plan.
2. Do not let home treatment delay urgent assessment.

**Exact prohibited claims**

1. Do not diagnose malaria or sepsis.
2. Do not recommend antibiotics or antimalarials.
3. Do not declare a fever safe below one universal temperature threshold.
4. Do not claim vaccination eliminates infection risk.

**Unresolved conflicts or review questions**

- **Threshold conflict:** Nigerian guidance uses greater than 38°C as an early
  sepsis sign; CDC specifies 38.5°C/101.3°F for emergency assessment. Do not choose
  between them in this review packet.
- Approve locally appropriate urgent-care wording and malaria context before use.

| Review area | Approve | Approve with changes | Reject |
| --- | --- | --- | --- |
| Clinical accuracy | [ ] | [ ] | [ ] |
| Safety boundary | [ ] | [ ] | [ ] |
| Escalation mapping | [ ] | [ ] | [ ] |
| Source selection | [ ] | [ ] | [ ] |

**Reviewer comments:**

**Reviewer name:**
**Professional role:**
**Date:**

### 4. `hydration`

| Field | Candidate value |
| --- | --- |
| Version | `1.0.0` |
| Title | Hydration |
| Risk | Medium |
| Intended use | Explain why avoiding dehydration may reduce triggers while avoiding universal fluid prescriptions. |
| Source organizations | World Health Organization; Federal Ministry of Health, Nigeria; Centers for Disease Control and Prevention; National Health Service |
| Safety categories | `unable_to_drink_or_retain_fluids`; `confusion_or_severe_weakness` |
| Numeric thresholds omitted | No universal litres, millilitres, cups or glasses per day are included. |
| Jurisdiction limitations | Fluid advice must account for the patient's own restrictions, health conditions, climate and acute illness. |
| Multilingual status | English-only; no Nigerian Pidgin, Yoruba, Hausa or Igbo clinical review. |

**Exact educational points**

1. Dehydration is a recognized sickle-cell trigger, and adequate fluid intake is commonly advised.
2. A fixed fluid volume is not appropriate for every patient because health conditions and acute illness may change the advice.

**Exact allowed self-care guidance**

1. Drink regularly according to the personal care plan and take extra care during heat, exercise, or illness.
2. Seek clinical advice when fluid intake is restricted.

**Exact prohibited claims**

1. Do not prescribe a universal number of litres, glasses, cups, or millilitres per day.
2. Do not claim water treats a crisis.
3. Do not urge oral fluids when the patient cannot swallow, is repeatedly vomiting, has breathing difficulty, or has a fluid restriction.

**Unresolved conflicts or review questions**

- Confirm that “drink regularly” and “adequate” are understandable without becoming
  a universal quantity.
- Confirm category mapping for severe weakness when dehydration is only suspected.

| Review area | Approve | Approve with changes | Reject |
| --- | --- | --- | --- |
| Clinical accuracy | [ ] | [ ] | [ ] |
| Safety boundary | [ ] | [ ] | [ ] |
| Escalation mapping | [ ] | [ ] | [ ] |
| Source selection | [ ] | [ ] | [ ] |

**Reviewer comments:**

**Reviewer name:**
**Professional role:**
**Date:**

### 5. `acute_chest_breathing`

| Field | Candidate value |
| --- | --- |
| Version | `1.0.0` |
| Title | Acute chest and breathing warning signs |
| Risk | Critical |
| Intended use | Recognize serious chest or breathing warning signs without attempting diagnosis. |
| Source organizations | Federal Ministry of Health, Nigeria; Centers for Disease Control and Prevention; National Health Service |
| Safety categories | `chest_pain`; `breathing_difficulty`; `fever_or_infection` |
| Numeric thresholds omitted | No symptom-duration, respiratory-rate or oxygen-saturation threshold is included. |
| Jurisdiction limitations | Emergency destinations, transport and hospital access require Nigerian/local validation. |
| Multilingual status | English-only; no Nigerian Pidgin, Yoruba, Hausa or Igbo clinical review. |

**Exact educational points**

1. Acute chest syndrome is a serious sickle-cell complication, and warning features include chest pain, cough, fever, wheeze, or breathing difficulty.
2. Breathing difficulty can accompany acute chest syndrome or another serious condition and needs urgent medical assessment.
3. Confirmation and treatment require hospital assessment and clinical direction.

**Exact allowed self-care guidance**

1. Stop exertion, seek emergency assessment immediately, and use the patient-specific emergency plan while arranging care.

**Exact prohibited claims**

1. Do not diagnose or exclude acute chest syndrome or another cause of breathing difficulty.
2. Do not advise waiting for an appointment.
3. Do not recommend oxygen or medicine, or suggest hydration or inhalers make emergency assessment unnecessary.
4. Do not downgrade breathing difficulty because chest pain is absent.

**Unresolved conflicts or review questions**

- Mira must not diagnose acute chest syndrome. Confirm that all chest and breathing
  wording preserves emergency escalation without implying a diagnosis.
- Approve local emergency-access wording and whether fever remains a direct category
  mapping in the combined module.

| Review area | Approve | Approve with changes | Reject |
| --- | --- | --- | --- |
| Clinical accuracy | [ ] | [ ] | [ ] |
| Safety boundary | [ ] | [ ] | [ ] |
| Escalation mapping | [ ] | [ ] | [ ] |
| Source selection | [ ] | [ ] | [ ] |

**Reviewer comments:**

**Reviewer name:**
**Professional role:**
**Date:**

### 6. `neurological_warning`

| Field | Candidate value |
| --- | --- |
| Version | `1.0.0` |
| Title | Neurological and stroke warning signs |
| Risk | Critical |
| Intended use | Prompt immediate care for possible stroke or another neurological emergency without diagnosis. |
| Source organizations | Federal Ministry of Health, Nigeria; American Society of Hematology; National Health Service |
| Safety categories | `neurological_warning`; `seizure_or_unconsciousness`; `confusion_or_severe_weakness` |
| Numeric thresholds omitted | No symptom-duration, imaging, laboratory or screening threshold is included. |
| Jurisdiction limitations | Emergency access, stroke screening and transfusion capacity differ across health systems. |
| Multilingual status | English-only; no Nigerian Pidgin, Yoruba, Hausa or Igbo clinical review. |

**Exact educational points**

1. Sudden weakness or numbness, facial asymmetry, speech or vision change, severe unusual headache, seizure, confusion, loss of balance, or loss of consciousness require emergency assessment.
2. Stroke screening, imaging, and transfusion decisions belong to specialist teams.

**Exact allowed self-care guidance**

1. Seek emergency care immediately and record the symptom onset time if known.
2. Keep the person safe while help is arranged, and do not give food or drink to someone with impaired consciousness or swallowing.

**Exact prohibited claims**

1. Do not perform a chat-based stroke exclusion or advise waiting for symptoms to resolve.
2. Do not recommend aspirin, transfusion, or another treatment.

**Unresolved conflicts or review questions**

- Mira must not diagnose stroke. Confirm that the symptom list is clinically suitable
  and does not imply chat-based confirmation or exclusion.
- Confirm mappings for obvious stroke-like signs, seizure/loss of consciousness and
  confusion/severe weakness.

| Review area | Approve | Approve with changes | Reject |
| --- | --- | --- | --- |
| Clinical accuracy | [ ] | [ ] | [ ] |
| Safety boundary | [ ] | [ ] | [ ] |
| Escalation mapping | [ ] | [ ] | [ ] |
| Source selection | [ ] | [ ] | [ ] |

**Reviewer comments:**

**Reviewer name:**
**Professional role:**
**Date:**

### 7. `hydroxyurea_education`

| Field | Candidate value |
| --- | --- |
| Version | `1.0.0` |
| Title | Hydroxyurea education |
| Risk | High |
| Intended use | Explain hydroxyurea's general role, monitoring and question prompts without prescribing or changing treatment. |
| Source organizations | World Health Organization; Federal Ministry of Health, Nigeria; Centers for Disease Control and Prevention; American Society of Hematology; Guy's and St Thomas' NHS Foundation Trust; MedlinePlus/U.S. National Library of Medicine |
| Safety categories | None |
| Numeric thresholds omitted | No dose, laboratory target, monitoring interval or missed-dose timing is included. |
| Jurisdiction limitations | Access, prescribing, laboratory monitoring and reproductive guidance differ across Nigeria, US and UK contexts. |
| Multilingual status | English-only; no Nigerian Pidgin, Yoruba, Hausa or Igbo clinical review. |

**Exact educational points**

1. Hydroxyurea can increase fetal haemoglobin and reduce pain crises and some complications for suitable patients.
2. Eligibility, dose, laboratory monitoring, side effects, fertility, and pregnancy decisions are individualized clinical matters.
3. Reviewed missed-dose instructions differ, but the sources agree that a missed dose must not be doubled.

**Exact allowed self-care guidance**

1. Take hydroxyurea exactly as prescribed and attend required monitoring.
2. Do not double a missed dose; ask the clinician or pharmacist for regimen-specific missed-dose instructions.

**Exact prohibited claims**

1. Do not start, stop, select, or change a hydroxyurea dose.
2. Do not promise hydroxyurea prevents every crisis.
3. Do not interpret blood results or give autonomous pregnancy, fertility, or contraception instructions.

**Unresolved conflicts or review questions**

- No dose selection, start/stop instruction or treatment change is permitted.
- Confirm the “do not double” instruction and approve exact missed-dose wording.
  Guy's and St Thomas' advises its patients to resume the normal dose the next day;
  MedlinePlus advises taking it when remembered unless close to the next dose.
- Reconcile pregnancy/reproductive wording using current specialist guidance before
  runtime use.

| Review area | Approve | Approve with changes | Reject |
| --- | --- | --- | --- |
| Clinical accuracy | [ ] | [ ] | [ ] |
| Safety boundary | [ ] | [ ] | [ ] |
| Escalation mapping | [ ] | [ ] | [ ] |
| Source selection | [ ] | [ ] | [ ] |

**Reviewer comments:**

**Reviewer name:**
**Professional role:**
**Date:**

### 8. `emergency_warning_signs`

| Field | Candidate value |
| --- | --- |
| Version | `1.0.0` |
| Title | Emergency warning signs |
| Risk | Critical |
| Intended use | Provide a short index of symptoms that should trigger deterministic escalation, not an exhaustive diagnostic checklist. |
| Source organizations | World Health Organization; Federal Ministry of Health, Nigeria; Centers for Disease Control and Prevention; American Society of Hematology; National Health Service |
| Safety categories | All 12 existing H3 categories; listed below |
| Numeric thresholds omitted | No universal fever threshold or priapism duration is included. No other numeric clearance threshold is supplied. |
| Jurisdiction limitations | Emergency numbers, destinations, transport, specialist access and service availability are not portable across Nigerian, US and UK systems. |
| Multilingual status | English-only; no Nigerian Pidgin, Yoruba, Hausa or Igbo clinical review. |

**Exact educational points**

1. Urgent warning signs include breathing difficulty, chest pain, fever or infection concern, sudden neurological change, seizure or loss of consciousness, severe or worsening pain, inability to retain fluids, painful or prolonged erection, sudden pallor, severe weakness, or splenic or abdominal swelling.
2. Pregnancy adds a lower threshold for specialist assessment.
3. This warning-sign list is not exhaustive and does not diagnose the underlying cause.

**Exact allowed self-care guidance**

1. Use the documented emergency plan and seek human assessment without delay.
2. Mira may help summarize symptoms but cannot contact a clinician or emergency service on the patient’s behalf.

**Exact prohibited claims**

1. Do not call the warning-sign list complete or rank an emergency symptom as safe.
2. Do not provide autonomous triage clearance or claim that help has been contacted.

**Exact mapped H3 categories requiring individual review**

1. `chest_pain`
2. `breathing_difficulty`
3. `neurological_warning`
4. `seizure_or_unconsciousness`
5. `fever_or_infection`
6. `severe_or_worsening_pain`
7. `unable_to_drink_or_retain_fluids`
8. `priapism`
9. `confusion_or_severe_weakness`
10. `sudden_pallor_or_splenic_concern`
11. `pregnancy_emergency`
12. `mental_health_crisis`

**Unresolved conflicts or review questions**

- Review every H3 category above; approval must not be inferred from approval of the
  list as a whole.
- Confirm the WHO pregnancy guideline and Nigerian guideline appropriately support
  the pregnancy statement.
- Fever and priapism threshold conflicts remain unresolved; the module deliberately
  uses symptom-level escalation without a number.
- Confirm that the module remains an index rather than an exhaustive clearance tool.

| Review area | Approve | Approve with changes | Reject |
| --- | --- | --- | --- |
| Clinical accuracy | [ ] | [ ] | [ ] |
| Safety boundary | [ ] | [ ] | [ ] |
| Escalation mapping | [ ] | [ ] | [ ] |
| Source selection | [ ] | [ ] | [ ] |

**Reviewer comments:**

**Reviewer name:**
**Professional role:**
**Date:**

## High-risk review

The reviewer must complete the module-specific table and explicitly address each
item below.

### A. Fever / infection

- Nigerian guidance uses greater than 38°C; CDC guidance uses 38.5°C.
- Do not choose or imply one universal threshold in this packet.
- Confirm that generic urgent fever/infection escalation is clinically safe.
- Confirm Nigeria-specific infection and malaria wording without diagnosing or
  recommending antimicrobial treatment.

**High-risk reviewer decision/comments:**

### B. Acute chest / breathing

- Mira must not diagnose or exclude acute chest syndrome.
- Chest pain and breathing difficulty remain emergency escalation pathways.
- Confirm that the combined module does not weaken either H3 category.

**High-risk reviewer decision/comments:**

### C. Neurological warning

- Mira must not diagnose or exclude stroke.
- Obvious stroke-like symptoms, seizure and loss of consciousness remain urgent.
- Confirm whether confusion/severe weakness is mapped at the appropriate H3 level.

**High-risk reviewer decision/comments:**

### D. Hydroxyurea

- No dose selection is permitted.
- No start, stop or treatment-change instruction is permitted.
- The candidate says not to double a missed dose.
- Exact missed-dose wording requires review because the reviewed patient sources
  differ.
- Monitoring, laboratory interpretation, fertility and pregnancy decisions remain
  clinician-dependent.

**High-risk reviewer decision/comments:**

### E. Emergency warning signs

- Review each of the 12 mapped H3 categories individually.
- Confirm that the list cannot be read as exhaustive or as autonomous triage
  clearance.
- Confirm that the wording never implies that Warrior AI contacted help.
- Confirm the corrected WHO pregnancy source association before approval.

**High-risk reviewer decision/comments:**

## Applicability to Nigerian Patient V1

The reviewer should assess each item without automatically changing module text.

| Review question | Acceptable | Changes required | Reviewer notes |
| --- | --- | --- | --- |
| Is the emergency-care wording usable without assuming a universal emergency number, transport or nearby specialist center? | [ ] | [ ] | |
| Are referral assumptions realistic for intended Nigerian deployment settings? | [ ] | [ ] | |
| Does hydroxyurea wording reflect access and monitoring realities without weakening safe prescribing boundaries? | [ ] | [ ] | |
| Is infection wording appropriate for malaria considerations without implying diagnosis or treatment? | [ ] | [ ] | |
| Does any wording assume transfusion products, matching or specialist services are universally available? | [ ] | [ ] | |
| Is vaccination wording accurate and free of imported US/UK schedule assumptions? | [ ] | [ ] | |
| Does the pack avoid assuming haematology, obstetric, urology, mental-health or emergency specialists are immediately available? | [ ] | [ ] | |
| Is the wording understandable to Nigerian patients and caregivers at the intended literacy level? | [ ] | [ ] | |

**Nigeria applicability reviewer name:**
**Professional role and practice setting:**
**Date:**
**Additional comments:**

## Language-review boundary

Current clinical modules are English-only. Nigerian Pidgin, Yoruba, Hausa and Igbo
must not be marked clinically reviewed merely because Mira can translate or respond
in those languages. Translation begins only after an English candidate revision is
clinically approved and frozen for language review.

Each language requires a qualified language reviewer, clinical review of the
translated wording, back-translation where appropriate, and patient comprehension
testing.

| Language | Terminology accuracy | Emergency meaning preserved | Medication wording | Cultural/naturalness review | Comprehension testing | Reviewer/date |
| --- | --- | --- | --- | --- | --- | --- |
| Nigerian Pidgin | [ ] | [ ] | [ ] | [ ] | [ ] | |
| Yoruba | [ ] | [ ] | [ ] | [ ] | [ ] | |
| Hausa | [ ] | [ ] | [ ] | [ ] | [ ] | |
| Igbo | [ ] | [ ] | [ ] | [ ] | [ ] | |

No language should be added to a module's `languages` field until all applicable
review fields are complete for the exact translated version.

## Change control and approval workflow

1. The current state remains `research-curated-pending-clinical-review`.
2. A qualified clinician reviews the exact `1.0.0` wording, sources, boundaries and
   escalation mappings presented in this packet.
3. Any requested edit creates a new candidate revision. The prior candidate remains
   traceable and is not overwritten.
4. The reviewer approves or rejects the exact new revision after checking the
   changes. Approval of one version does not transfer automatically to another.
5. Only after approval are truthful reviewer identity/role, approval date, and the
   approved semantic version recorded.
6. Multilingual versions follow their own versioned clinical and language review.
7. Only the exact approved module version becomes eligible for a separately
   reviewed H4B runtime-retrieval integration.
8. Later content changes always require a version change and renewed review before
   runtime eligibility.

## Pack-level disposition

| Decision | Select one |
| --- | --- |
| Approve all eligible modules exactly as reviewed | [ ] |
| Approve only the modules identified in comments | [ ] |
| Return pack for candidate revisions | [ ] |
| Reject pack | [ ] |

**Modules approved, if fewer than eight:**

**Required candidate revisions:**

**Reviewer name:**
**Professional role:**
**Registration or institutional identifier, if the reviewer chooses to provide it:**
**Date:**
**Signature or documented approval reference:**

Completion of this section records a review decision for the stated module versions.
It does not connect the modules to Mira runtime.
