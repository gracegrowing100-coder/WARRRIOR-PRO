# Mira Clinical Knowledge Research

**Status:** Research and curation draft; not approved for runtime use
**Research review date:** 2026-10-08
**Baseline:** `6adb7fd5b30a04c28cdcdb82e1e394004a732803`
**Scope:** Patient V1 sickle-cell and hematology education for Mira

## 1. Scope and safety boundary

This document curates candidate knowledge for later clinical review. It is not a
clinical protocol, prescribing reference, production prompt, or authorization to
change Mira's deterministic safety behavior. No content below should enter the
runtime until a qualified sickle-cell clinician has approved the exact wording,
source set, jurisdiction, review date, escalation mapping, and translation plan.

Content labels used throughout:

- **A — Educational:** stable background information suitable for direct patient
  education after editorial and clinical review.
- **B — Safety / escalation:** warning signs and directions to seek human care.
  These must remain consistent with deterministic safety rules and must not be
  weakened, delayed, or generated solely by an LLM.
- **C — Clinician-dependent:** diagnosis, dosing, treatment selection, monitoring,
  transfusion, pregnancy management, or other individualized decisions. Mira may
  explain these concepts but must not decide them autonomously.

The source material assumes different health systems. US emergency-department
language, UK NHS pathways, and Nigerian referral pathways are not interchangeable.
Production copy must use locally reviewed, configurable care-access language and
must never imply that Warrior AI contacted a clinician or emergency service.

## 2. Source-quality rules and reviewed source catalogue

Only Tier 1 and Tier 2 sources were needed for this pass. No Tier 3 source was used.
Dates below are publication, update, review, or edition dates displayed by the
source. All sources were accessed on 2026-10-08.

| Ref | Source | Tier | Date | Jurisdiction / scope | Use and limitations |
| --- | --- | --- | --- | --- | --- |
| S01 | [WHO: Sickle-cell disease fact sheet](https://www.who.int/news-room/fact-sheets/detail/sickle-cell-disease) | 1 | 2025-08-06 | Global | Current overview, prevention, complications, hydroxyurea, pregnancy and global burden. |
| S02 | [WHO recommendations on management of sickle-cell disease during pregnancy, childbirth and the interpregnancy period](https://www.who.int/publications/i/item/9789240109124) | 1 | 2025-06-19 | Global, with LMIC emphasis | First global pregnancy guideline; individualized multidisciplinary care. Clinical management detail requires a specialist. |
| S03 | [WHO Africa: SICKLE package](https://www.afro.who.int/news/who-africa-releases-groundbreaking-guidance-boost-fight-against-sickle-cell-disease) | 1 | 2024-06-19 | WHO African Region | Africa-specific implementation context, including screening, care access and hydroxyurea barriers. |
| S04 | [Nigeria Federal Ministry of Health: National Guideline for the Control and Management of Sickle Cell Disease, 2nd edition](https://health.gov.ng/wp-content/uploads/2025/06/SCD-Guideline-Final-2nd-Edition.pdf) | 1 | 2022 edition; official file hosted 2025 | Nigeria | Main Nigeria-specific clinical source. Contains detailed clinical instructions and some content requiring reconciliation with newer sources. |
| S05 | [CDC: Prevention and treatment of sickle cell disease](https://www.cdc.gov/sickle-cell/about/prevention-and-treatment.html) | 1 | Reviewed 2026-08-07 | United States | Current prevention, hydration, temperature/oxygen exposure, hydroxyurea and transfusion overview. |
| S06 | [CDC: Fever](https://www.cdc.gov/sickle-cell/complications/fever.html) | 1 | Reviewed 2024-05-15 | United States | Specifies an emergency threshold of 101.3°F/38.5°C. |
| S07 | [CDC: Infection](https://www.cdc.gov/sickle-cell/complications/complications-of-scd-infection.html) | 1 | Reviewed 2026-08-07 | United States | Infection risk, urgent assessment, vaccination and child penicillin context. |
| S08 | [CDC: Acute chest syndrome](https://www.cdc.gov/sickle-cell/complications/acute-chest-syndrome.html) | 1 | Reviewed 2026-08-07 | United States | Current warning signs and need for hospital treatment. |
| S09 | [CDC: Splenic sequestration](https://www.cdc.gov/sickle-cell/complications/splenic-sequestration.html) | 1 | Reviewed 2026-08-07 | United States | Warning signs, childhood emphasis and clinician-taught spleen checks. |
| S10 | [CDC: Preventing Parvovirus B19](https://www.cdc.gov/parvovirus-b19/prevention-treatment/) | 1 | 2025-12-17 | United States / general public health | States that no vaccine prevents parvovirus B19; used to identify an error in S04. |
| S11 | [NHLBI: Evidence-Based Management of Sickle Cell Disease](https://www.nhlbi.nih.gov/health-topics/evidence-based-management-sickle-cell-disease) | 1 | 2014 | United States | Comprehensive expert report, but old enough that all clinical recommendations need currency review. |
| S12 | [ASH: Management of acute and chronic pain](https://www.hematology.org/education/clinicians/guidelines-and-quality-care/clinical-practice-guidelines/sickle-cell-disease-guidelines/scd-guidelines-management-of-acute-and-chronic-pain) | 1 | 2020; reviewed 2023 | United States / professional | Shared decision-making and multidisciplinary pain care. Evidence for some non-drug approaches is low certainty. |
| S13 | [ASH: Cerebrovascular disease guidelines](https://www.hematology.org/education/clinicians/guidelines-and-quality-care/clinical-practice-guidelines/sickle-cell-disease-guidelines/scd-guidelines-cerebrovascular-disease) | 1 | 2020; reviewed 2023 | United States / professional | Stroke screening, prevention and acute management; clinical decisions only. |
| S14 | [ASH: Transfusion support guidelines](https://www.hematology.org/education/clinicians/guidelines-and-quality-care/clinical-practice-guidelines/sickle-cell-disease-guidelines/scd-guidelines-transfusion-support) | 1 | 2020 | United States / professional | Matching, indications and complications; decisions require a transfusion/hematology team. |
| S15 | [ASH: Hydroxyurea for sickle cell disease patient booklet](https://www.hematology.org/-/media/hematology/files/patients/hydroxyurea-booklet.pdf) | 2 | Date not displayed in booklet; linked from current ASH resources | United States | Patient education on benefits, monitoring and adherence; must be reconciled with local prescribing instructions. |
| S16 | [NHS: Sickle cell disease](https://www.nhs.uk/conditions/sickle-cell-disease/) | 2 | Current page; date not displayed in retrieved page | United Kingdom | Recognized patient guidance on symptoms, prevention and urgent signs. UK service numbers cannot be copied into Nigerian content. |
| S17 | [NHS: Priapism](https://www.nhs.uk/symptoms/priapism-painful-erections/) | 2 | Current page; date not displayed in retrieved page | United Kingdom | Uses a sickle-cell-specific urgent threshold that differs from other sources. |
| S18 | [Guy's and St Thomas': Taking hydroxycarbamide](https://www.guysandstthomas.nhs.uk/health-information/hydroxycarbamide-sickle-cell-disease/taking-hydroxycarbamide) | 2 | Reviewed 2025-11 | United Kingdom | Current academic-center patient instructions, including missed-dose advice for its patients. |
| S19 | [MedlinePlus: Hydroxyurea](https://medlineplus.gov/druginfo/meds/a682004.html) | 2 | Current page; date varies with drug monograph | United States | Government patient drug information; missed-dose wording differs from S18. |
| S20 | [UCLH: Medications, vaccinations and travel with sickle cell disease](https://www.uclh.nhs.uk/patients-and-visitors/patient-information-pages/medications-vaccinations-and-travel-sickle-cell-disease) | 2 | Current page; date not displayed in retrieved page | United Kingdom | Academic-center travel guidance; illustrates need for individual assessment. |
| S21 | [CDC Yellow Book: Air travel](https://www.cdc.gov/yellow-book/hcp/travel-air-sea/air-travel.html) and [CDC: Travel to high altitudes](https://wwwnc.cdc.gov/travel/page/travel-to-high-altitudes) | 1 | Yellow Book 2026 edition / current travel page | United States / travel medicine | Conservative altitude and oxygen-risk guidance; requires reconciliation with S20. |

Source-quality decisions:

- S01–S14 and S21 are Tier 1 because they are government, public-health, national,
  international, or professional-society guidance.
- S15–S20 are Tier 2 patient materials from a professional society, government
  health information service, or major academic health system.
- S04 is authoritative for Nigerian context but is not assumed correct on every
  point. Its 2022 evidence base and internal inconsistencies require specialist
  review against newer guidance.
- A source being current does not make its health-system pathway portable. Service
  numbers, drug access, monitoring frequency and referral assumptions require
  Nigerian implementation review.

## 3. Module-by-module research

### 3.1 `scd-basics` — Sickle-cell basics

- **Purpose:** Explain the inherited blood disorder, common consequences and the
  role of ongoing care without diagnosing a subtype.
- **Risk / audience:** Low; patients, caregivers and families.
- **Reviewed sources:** S01 (2025, global), S03 (2024, Africa), S04 (2022, Nigeria),
  S05 (2026, US).
- **Key points:** **[A]** SCD is an inherited disorder involving abnormal
  haemoglobin; red cells can become rigid or sickle-shaped, break down early and
  obstruct blood flow, contributing to anaemia, pain and organ complications
  [S01, S04]. **[A]** Disease burden is especially high in sub-Saharan Africa, where
  access to screening and comprehensive care remains uneven [S01, S03].
- **Allowed self-care:** **[A]** Encourage regular care, recommended vaccinations,
  adequate hydration and avoidance of known extremes/triggers, while following the
  patient's own clinical plan [S01, S04, S05].
- **Prohibited claims:** Do not diagnose SCD or genotype, promise a cure, predict an
  individual's course, or state that every complication is preventable.
- **Escalation / deterministic links:** Background module only; symptom mentions
  must hand off to the relevant H3 category rather than reassure.
- **Unanswered / review:** Reading level, genotype-specific scope and Nigeria-facing
  screening language need clinician and patient review. Human review required
  before production: **yes**. Translation risk: inherited/genetic, haemoglobin,
  anaemia and “sickling” may become stigmatizing or misleading if translated
  literally. Outdated-guidance risk: low to moderate.

### 3.2 `vaso-occlusive-pain` — Vaso-occlusive pain

- **Purpose:** Explain pain crises, use of an existing personal pain plan and when
  pain needs urgent human assessment.
- **Risk / audience:** High; patients and caregivers.
- **Reviewed sources:** S04 (Nigeria), S11 (US; dated), S12 (professional), S16 (UK).
- **Key points:** **[A]** Vaso-occlusive pain is caused by impaired blood flow and
  may vary greatly between people and episodes [S04, S12]. **[C]** Drug choice,
  dose, opioid use and changes to a home pain plan are individualized clinical
  decisions [S11, S12]. Non-drug approaches such as cognitive or behavioural
  strategies may be adjuncts, but ASH rates parts of this evidence as low or very
  low certainty [S12].
- **Allowed self-care:** **[A/C]** Follow the clinician-approved home pain plan; rest,
  warmth and oral fluids may be supportive when the patient has not been told to
  restrict fluids [S04, S16]. Contact the care team when the plan is not working.
- **Prohibited claims:** Do not label all pain a crisis, recommend a new medicine or
  dose, tell a patient to endure severe pain at home, or imply pain intensity rules
  out a dangerous complication.
- **Escalation / deterministic links:** **[B]** Severe, unusual, worsening or
  persistent pain, or pain with fever, chest symptoms, breathing difficulty,
  neurological symptoms, pregnancy concern, inability to drink or marked weakness
  must route to `severe_or_worsening_pain` plus any more specific H3 category
  [S04, S08, S16].
- **Unanswered / review:** Exact “home plan failed” duration and local access route
  vary. Human review required: **yes**. Translation risk: distinguish ordinary
  pain, severe pain and pain crisis without downplaying any red flag.
  Outdated-guidance risk: moderate because S11 is from 2014.

### 3.3 `fever-infection` — Fever / infection concern

- **Purpose:** Explain infection risk and require prompt assessment without hiding
  the threshold conflict.
- **Risk / audience:** Critical; all patients and caregivers, especially caregivers
  of children.
- **Reviewed sources:** S04 (Nigeria), S06 and S07 (US), S16 (UK).
- **Key points:** **[A/B]** Infection can become serious rapidly in SCD and fever
  warrants urgent assessment [S04, S06, S07]. **[B]** CDC specifies 101.3°F/38.5°C
  for immediate emergency assessment; S04 describes fever above 38°C as an early
  sign of sepsis. These thresholds must remain attributed and unreconciled pending
  clinical approval [S04, S06]. **[C]** Tests, antibiotics, malaria assessment and
  prophylactic penicillin are clinician decisions; S04 includes malaria-specific
  evaluation and S07 describes US paediatric prophylaxis [S04, S07].
- **Allowed self-care:** **[B]** Measure temperature if possible, seek urgent care,
  and follow the existing sick-day plan. Home treatment must not delay assessment
  [S04, S06, S07].
- **Prohibited claims:** Do not diagnose malaria/sepsis, recommend antibiotics or
  antimalarials, declare a fever safe below a single unapproved number, or promise
  vaccination eliminates infection risk.
- **Escalation / deterministic links:** `fever_or_infection`; add other categories
  for chest, breathing, neurological, hydration, pregnancy or consciousness signs.
- **Unanswered / review:** Production threshold and Nigeria care-access wording are
  unresolved. Human review required: **yes, mandatory before production**.
  Translation risk: fever versus feeling hot, chills and temperature units.
  Outdated-guidance risk: moderate for S04; current CDC threshold differs.

### 3.4 `hydration` — Hydration

- **Purpose:** Explain why avoiding dehydration may reduce triggers while avoiding
  universal fluid prescriptions.
- **Risk / audience:** Medium; patients and caregivers.
- **Reviewed sources:** S01, S04, S05, S16.
- **Key points:** **[A]** Dehydration is a recognized trigger and adequate fluid
  intake is commonly advised [S01, S04, S05, S16]. **[C]** A fixed volume is not
  appropriate for every patient; kidney, heart, pregnancy and acute illness factors
  may change advice.
- **Allowed self-care:** **[A]** Drink regularly according to the personal care plan,
  take extra care in heat, exercise or illness, and seek advice if intake is
  restricted [S04, S05, S16].
- **Prohibited claims:** Do not prescribe litres/glasses per day, claim water treats
  a crisis, or urge fluids when the patient cannot swallow, is vomiting repeatedly,
  has breathing difficulty or has a fluid restriction.
- **Escalation / deterministic links:** **[B]** Inability to drink or keep fluids
  down routes to `unable_to_drink_or_retain_fluids`; confusion or severe weakness
  routes to `confusion_or_severe_weakness` [S04, S16].
- **Unanswered / review:** No universal production quantity should be encoded.
  Human review required: **yes**. Translation risk: “hydration” should become a
  concrete but non-quantified instruction. Outdated-guidance risk: low if fixed
  quantities from older patient materials are excluded.

### 3.5 `fatigue-anemia` — Fatigue / anaemia

- **Purpose:** Explain chronic anaemia and separate ordinary tiredness from sudden
  deterioration.
- **Risk / audience:** High; patients and caregivers.
- **Reviewed sources:** S01, S04, S09, S16.
- **Key points:** **[A]** Early red-cell breakdown can cause chronic anaemia and
  fatigue in SCD [S01, S04]. **[B]** Sudden pallor, marked weakness, fast breathing
  or heartbeat, or abdominal swelling/pain can indicate an acute complication and
  need urgent assessment [S04, S09]. **[C]** The cause of fatigue cannot be inferred
  from conversation alone and may require examination and laboratory testing.
- **Allowed self-care:** **[A]** Pace activity, keep routine follow-up, and discuss a
  persistent change from baseline with the care team [S04, S16].
- **Prohibited claims:** Do not diagnose anaemia severity, infer haemoglobin/PCV,
  recommend iron or folate, or reassure solely because fatigue is common.
- **Escalation / deterministic links:** `confusion_or_severe_weakness` and
  `sudden_pallor_or_splenic_concern`; add breathing/chest/neurological categories
  when present.
- **Unanswered / review:** Wording must account for individual baseline and age.
  Human review required: **yes**. Translation risk: fatigue, weakness, dizziness
  and fainting must remain distinct. Outdated-guidance risk: moderate for
  supplement language in older/local guidance.

### 3.6 `acute-chest-warning` — Acute chest warning signs

- **Purpose:** Recognize a life-threatening syndrome without attempting diagnosis.
- **Risk / audience:** Critical; all patients and caregivers.
- **Reviewed sources:** S04, S08, S16.
- **Key points:** **[A/B]** Acute chest syndrome is a serious SCD complication;
  warning features include chest pain, cough, fever, wheeze or breathing difficulty
  [S04, S08]. **[C]** Confirmation and treatment require hospital assessment and may
  include imaging, oxygen, antibiotics or transfusion under clinical direction
  [S04, S08].
- **Allowed self-care:** **[B]** Seek emergency assessment immediately; use the
  patient's emergency plan while arranging care [S04, S08].
- **Prohibited claims:** Do not diagnose or exclude acute chest syndrome, tell the
  patient to wait for an appointment, or suggest hydration/inhalers alone make
  emergency assessment unnecessary.
- **Escalation / deterministic links:** `chest_pain`, `breathing_difficulty`, and
  `fever_or_infection` as applicable.
- **Unanswered / review:** Nigeria-facing emergency destination and transport
  wording need local approval. Human review required: **yes, mandatory**.
  Translation risk: chest pain/tightness, cough, wheeze and breathlessness need
  symptom-level human review. Outdated-guidance risk: low.

### 3.7 `breathing-difficulty` — Breathing difficulty

- **Purpose:** Treat breathing difficulty as an urgent symptom regardless of the
  assumed cause.
- **Risk / audience:** Critical; all patients and caregivers.
- **Reviewed sources:** S04, S08, S16.
- **Key points:** **[B]** Difficulty breathing in SCD can accompany acute chest
  syndrome or another serious condition and needs urgent medical assessment
  [S04, S08, S16]. **[C]** Mira cannot distinguish infection, asthma, anaemia,
  pulmonary embolism or other causes in chat.
- **Allowed self-care:** **[B]** Stop exertion and seek emergency care; follow an
  existing clinician-issued emergency plan without delaying care.
- **Prohibited claims:** Do not infer oxygen level, recommend oxygen or medication,
  diagnose the cause, or downgrade urgency because chest pain is absent.
- **Escalation / deterministic links:** `breathing_difficulty`; also `chest_pain`,
  `fever_or_infection`, `confusion_or_severe_weakness` or pregnancy category when
  relevant.
- **Unanswered / review:** Exact local escalation route. Human review required:
  **yes, mandatory**. Translation risk: shortness of breath, fast breathing,
  choking and chest tightness must not collapse into an ambiguous phrase.
  Outdated-guidance risk: low.

### 3.8 `neurological-stroke-warning` — Neurological / stroke warning signs

- **Purpose:** Prompt immediate care for possible stroke or other neurological
  emergency without diagnosis.
- **Risk / audience:** Critical; patients and caregivers.
- **Reviewed sources:** S04, S13, S16.
- **Key points:** **[B]** Sudden weakness or numbness, facial asymmetry, speech or
  vision change, severe unusual headache, seizure, confusion, loss of balance or
  loss of consciousness require emergency assessment [S04, S13, S16]. **[C]**
  Stroke screening, imaging and transfusion decisions belong to specialist teams
  [S13].
- **Allowed self-care:** **[B]** Seek emergency care immediately, record symptom
  onset time if known, and keep the person safe while help is arranged. Do not give
  food or drink to someone with impaired consciousness or swallowing.
- **Prohibited claims:** Do not perform a chat-based stroke exclusion, wait for
  symptoms to resolve, or recommend aspirin, transfusion or another treatment.
- **Escalation / deterministic links:** `neurological_warning` and, when applicable,
  `seizure_or_unconsciousness` or `confusion_or_severe_weakness`.
- **Unanswered / review:** Local emergency pathway and age-appropriate caregiver
  language. Human review required: **yes, mandatory**. Translation risk: one-sided
  weakness, slurred speech, confusion, seizure and fainting require separate review.
  Outdated-guidance risk: low to moderate as ASH is 2020/reviewed 2023.

### 3.9 `medication-adherence` — Medication adherence

- **Purpose:** Support safe use of an existing prescription without changing it.
- **Risk / audience:** High; patients and caregivers taking prescribed medicines.
- **Reviewed sources:** S04, S15, S18, S19.
- **Key points:** **[A]** Regular use and monitoring can be important for prescribed
  SCD medicines [S04, S15]. **[C]** Missed-dose action depends on the medicine and
  the patient's instructions. Hydroxyurea sources agree not to double a dose but
  differ on whether to take it when remembered or resume the next scheduled dose
  [S18, S19].
- **Allowed self-care:** **[A/C]** Use reminders, keep the written prescription and
  monitoring appointments, and ask the pharmacist/clinician what to do after a
  missed dose [S15, S18, S19].
- **Prohibited claims:** Do not prescribe, calculate a dose, advise doubling,
  recommend starting/stopping, or generalize instructions from one drug to another.
- **Escalation / deterministic links:** No standalone H3 category. Possible overdose,
  serious reaction, pregnancy exposure, or acute symptoms require an immediate
  human-care route appropriate to the symptom; medication decisions remain a
  specialist boundary.
- **Unanswered / review:** Medicine-specific content needs a verified drug,
  formulation and local prescription context. Human review required: **yes**.
  Translation risk: dose, missed dose, next scheduled dose and side effect.
  Outdated-guidance risk: moderate where a source date is absent.

### 3.10 `hydroxyurea-education` — Hydroxyurea education

- **Purpose:** Explain the medicine's general role, monitoring and question prompts.
- **Risk / audience:** High; patients/caregivers considering or using hydroxyurea.
- **Reviewed sources:** S01, S04, S05, S15, S18, S19.
- **Key points:** **[A]** Hydroxyurea can increase fetal haemoglobin and reduce pain
  crises and some complications for suitable patients [S01, S05, S15]. **[C]**
  Eligibility, dose, laboratory monitoring, side effects, fertility and pregnancy
  decisions are individualized [S04, S15, S18]. **[C]** Missed-dose instructions
  vary: S18 tells its patients to take the normal dose the next day; S19 says take
  it when remembered unless close to the next dose, then skip. Both say not to
  double [S18, S19].
- **Allowed self-care:** **[A/C]** Take it exactly as prescribed, attend monitoring,
  do not double a missed dose, and ask the clinician/pharmacist for regimen-specific
  instructions [S15, S18, S19].
- **Prohibited claims:** Do not start, stop, select or change a dose; promise it will
  prevent every crisis; interpret blood results; or give autonomous pregnancy or
  contraception instructions.
- **Escalation / deterministic links:** No direct H3 category. Route acute symptoms
  to their symptom category; treatment questions remain clinician-dependent.
- **Unanswered / review:** Nigeria access/monitoring capacity and pregnancy advice
  require reconciliation. Human review required: **yes, mandatory**. Translation
  risk: chemotherapy association, fetal haemoglobin, monitoring, fertility and
  reproductive-risk wording. Outdated-guidance risk: high for relying on S04 alone.

### 3.11 `transfusion-basics` — Transfusion basics

- **Purpose:** Explain why transfusions may be used and why they need specialist
  oversight.
- **Risk / audience:** High; patients and caregivers.
- **Reviewed sources:** S04, S05, S14.
- **Key points:** **[A]** Transfusion may be used for selected acute complications,
  prevention strategies or severe anaemia; it is not routine treatment for every
  pain episode or every low steady-state haemoglobin [S04, S05, S14]. **[A/C]**
  Matching and records matter because repeated transfusion can cause antibodies,
  reactions and iron overload [S14]. **[C]** Indication, product, method, target and
  monitoring are specialist decisions [S04, S14].
- **Allowed self-care:** **[A]** Keep transfusion/antibody history when available,
  attend follow-up and ask why a transfusion is recommended and how reactions and
  iron are monitored [S14].
- **Prohibited claims:** Do not recommend or refuse a transfusion, calculate a
  threshold, interpret compatibility, or describe transfusion as risk-free.
- **Escalation / deterministic links:** Suspected reaction during or after transfusion
  requires immediate contact with the treating service/emergency assessment; route
  the presenting symptom through the corresponding deterministic category.
- **Unanswered / review:** Nigerian product availability, matching capacity and
  referral pathways. Human review required: **yes, mandatory**. Translation risk:
  antibodies, matching, reaction and iron overload. Outdated-guidance risk: moderate.

### 3.12 `routine-follow-up` — Routine follow-up

- **Purpose:** Explain the value of ongoing comprehensive care and monitoring.
- **Risk / audience:** Medium; patients and caregivers.
- **Reviewed sources:** S01, S03, S04, S05.
- **Key points:** **[A]** Regular care supports vaccination, medication monitoring,
  complication screening, education and individualized planning [S01, S04, S05].
  **[A]** Access to these services is uneven in the African Region [S03]. **[C]**
  Visit frequency, tests and screening schedules depend on age, genotype, treatment
  and local standards [S04].
- **Allowed self-care:** **[A]** Keep appointments, maintain an up-to-date medicines
  list, bring questions and report meaningful changes from baseline.
- **Prohibited claims:** Do not invent a universal schedule, claim a missed visit is
  harmless, or treat routine follow-up as suitable for an urgent symptom.
- **Escalation / deterministic links:** Urgent symptoms bypass routine scheduling and
  route to their H3 category.
- **Unanswered / review:** Patient V1 should support local care plans without assuming
  specialist availability. Human review required: **yes**. Translation risk:
  screening versus diagnosis and routine versus urgent. Outdated-guidance risk:
  moderate for schedule details.

### 3.13 `emergency-warning-signs` — Emergency warning signs

- **Purpose:** Provide a short index of symptoms that should trigger deterministic
  escalation, not an exhaustive diagnostic checklist.
- **Risk / audience:** Critical; all patients and caregivers.
- **Reviewed sources:** S02, S04, S06, S08, S09, S13, S16, S17.
- **Key points:** **[B]** Urgent warning signs supported across these sources include
  breathing difficulty, chest pain, fever/infection concern, sudden neurological
  change, seizure/loss of consciousness, severe or worsening pain, inability to
  retain fluids, painful/prolonged erection, sudden pallor/severe weakness or
  splenic/abdominal swelling [S04, S06, S08, S09, S13, S16, S17]. Pregnancy adds a
  lower threshold for specialist assessment [S02, S04].
- **Allowed self-care:** **[B]** Use the documented emergency plan and seek human
  assessment. Mira may help summarize symptoms but must not delay the route.
- **Prohibited claims:** Do not call the list complete, rank one emergency as safe,
  provide autonomous triage clearance, or claim help has been contacted.
- **Escalation / deterministic links:** Index to all H3 urgent categories:
  `chest_pain`, `breathing_difficulty`, `neurological_warning`,
  `seizure_or_unconsciousness`, `fever_or_infection`,
  `severe_or_worsening_pain`, `unable_to_drink_or_retain_fluids`, `priapism`,
  `confusion_or_severe_weakness`, `sudden_pallor_or_splenic_concern`,
  `pregnancy_emergency`, and `mental_health_crisis`.
- **Unanswered / review:** Threshold conflicts must be resolved outside the LLM and
  care-access copy must be locally configured. Human review required: **yes,
  mandatory**. Translation risk: highest of all modules; each symptom and action
  needs comprehension testing. Outdated-guidance risk: moderate.

### 3.14 `pregnancy-considerations` — Pregnancy considerations

- **Purpose:** Explain higher-risk pregnancy, early planning and the need for
  multidisciplinary care without giving treatment advice.
- **Risk / audience:** Critical; people who are pregnant, planning pregnancy or in
  the postpartum/interpregnancy period, plus caregivers.
- **Reviewed sources:** S01, S02, S04.
- **Key points:** **[A]** SCD increases risks for the pregnant person and baby, so
  preconception/early specialist review and coordinated obstetric-haematology care
  are recommended [S01, S02, S04]. **[C]** Medication, folate/iron, infection and
  thrombosis prevention, pain treatment, transfusion and monitoring must be
  individualized; WHO specifically considers malaria-endemic settings [S02].
- **Allowed self-care:** **[A/C]** Contact the care team early when planning or
  learning of pregnancy, keep an emergency plan and do not change medicines without
  clinician advice [S01, S02].
- **Prohibited claims:** Do not declare a medicine safe/unsafe for an individual,
  recommend supplements or doses, advise home management of a crisis, or predict
  pregnancy outcome.
- **Escalation / deterministic links:** `pregnancy_emergency` plus symptom-specific
  categories for pain, fever, breathing, chest, neurological, dehydration,
  bleeding or marked weakness. Production must not wait for a numeric threshold to
  escalate a concerning pregnancy symptom.
- **Unanswered / review:** S04's categorical hydroxyurea language must be reconciled
  with S02's current individualized approach. Nigerian referral and maternity access
  need local validation. Human review required: **yes, mandatory, including an
  obstetric specialist**. Translation risk: pregnancy loss, fetal risk, medicines,
  consent and urgent warning language. Outdated-guidance risk: high if S04 is used
  without S02.

### 3.15 `travel-temperature-dehydration` — Travel, heat, cold and dehydration triggers

- **Purpose:** Support advance planning while avoiding blanket travel clearance.
- **Risk / audience:** Medium; patients and caregivers planning travel or exposure.
- **Reviewed sources:** S01, S04, S05, S20, S21.
- **Key points:** **[A]** Dehydration, temperature extremes and low-oxygen/high-
  altitude exposure are recognized concerns [S01, S04, S05, S21]. **[C]** Fitness
  to fly, supplemental oxygen, malaria prevention, vaccination and medicine plans
  depend on destination and individual status [S04, S20, S21]. S20 says many stable
  patients can use pressurized cabins with planning, while CDC material is more
  broadly conservative about flying/high altitude [S20, S21].
- **Allowed self-care:** **[A/C]** Plan early with the care team, carry medicines and
  records, identify care at the destination, hydrate according to the care plan,
  move during long journeys when safe, and reduce extreme temperature exposure
  [S04, S20].
- **Prohibited claims:** Do not clear someone to fly, prescribe oxygen/antimalarials,
  guarantee safety, or apply UK/US destination advice directly to Nigeria.
- **Escalation / deterministic links:** Route symptoms during travel to the same H3
  categories; do not treat travel as an explanation that lowers urgency.
- **Unanswered / review:** Altitude/flight conflict, destination disease risks and
  Nigerian medicine/vaccine availability. Human review required: **yes**.
  Translation risk: altitude, cabin pressure, dehydration and travel clearance.
  Outdated-guidance risk: moderate because travel recommendations evolve.

### 3.16 `mental-wellbeing-coping` — Mental wellbeing / coping

- **Purpose:** Validate psychosocial burden and support connection to human help
  without treating or diagnosing mental illness.
- **Risk / audience:** High; patients and caregivers.
- **Reviewed sources:** S04, S12.
- **Key points:** **[A]** Recurrent pain and chronic illness can affect emotional,
  family, school/work and social wellbeing; psychosocial assessment and support are
  part of comprehensive care [S04]. **[A/C]** Cognitive and behavioural strategies
  may complement pain care, but ASH describes low or very low certainty for some
  evidence and they do not replace medical treatment [S12].
- **Allowed self-care:** **[A]** Encourage trusted-person, peer and professional
  support, rest and coping practices already found helpful; suggest discussing
  persistent distress with the care team [S04, S12].
- **Prohibited claims:** Do not diagnose depression/anxiety, imply pain is “all in the
  mind,” promise a technique will control crises, or conduct autonomous crisis care.
- **Escalation / deterministic links:** Self-harm, suicide, inability to remain safe,
  severe hopelessness or threat to others routes to `mental_health_crisis` and
  immediate human help.
- **Unanswered / review:** A current SCD-specific Tier 1 mental-health patient source
  and Nigeria crisis/referral pathways remain gaps. Human review required: **yes,
  including mental-health review before production**. Translation risk: stigma,
  idioms of distress, self-harm and confidentiality. Outdated-guidance risk: moderate.

### 3.17 `priapism` — Priapism

- **Purpose:** Explain the complication sensitively and prompt urgent care without
  waiting for a disputed threshold.
- **Risk / audience:** Critical; patients who can experience erections and their
  caregivers, with age-appropriate wording.
- **Reviewed sources:** S04, S16, S17.
- **Key points:** **[A/B]** A painful or prolonged erection can be an SCD emergency
  because delay can cause permanent harm [S04, S17]. Thresholds conflict: S17 says
  people with SCD should seek emergency help for a painful erection lasting more
  than one hour; S04 uses two hours for unresolved priapism; other general guidance
  often uses three to four hours [S04, S17].
- **Allowed self-care:** **[B]** Seek urgent medical advice/assessment for a painful
  or prolonged erection and do not let home measures delay care [S04, S17].
- **Prohibited claims:** Do not advise waiting for four hours, recommend sexual
  activity, ice, medicines or aspiration, diagnose stuttering versus ischemic
  priapism, or use shaming language.
- **Escalation / deterministic links:** `priapism`; the present conservative H3
  symptom trigger must not be weakened by selecting a longer time threshold.
- **Unanswered / review:** Exact threshold, age-appropriate copy and local urology
  access require clinician approval. Human review required: **yes, mandatory**.
  Translation risk: very high because direct, respectful anatomical wording and
  privacy are essential. Outdated-guidance risk: high if a single older threshold
  is encoded.

### 3.18 `sudden-pallor-splenic-concern` — Sudden pallor / splenic concern

- **Purpose:** Help caregivers recognize possible acute anaemia or splenic
  sequestration without teaching an unverified examination technique.
- **Risk / audience:** Critical; especially caregivers of infants and children, and
  any patient with retained splenic function.
- **Reviewed sources:** S04, S09.
- **Key points:** **[A/B]** Splenic sequestration is trapping of blood in the spleen
  and can cause a rapidly enlarging spleen, left-sided abdominal swelling/pain,
  sudden pallor, weakness, fast breathing or fast heartbeat [S04, S09]. It is most
  common in children but is not suitable for app-based exclusion [S09]. **[C]** A
  caregiver may be taught spleen palpation by the clinical team; Mira should not
  substitute text instructions for that training [S09].
- **Allowed self-care:** **[B]** Seek urgent assessment for sudden pallor, severe
  weakness, new abdominal/splenic swelling or associated breathing/mental-status
  change [S04, S09]. Follow only a clinician-taught spleen-check plan.
- **Prohibited claims:** Do not diagnose sequestration, estimate haemoglobin/PCV,
  coach an untrained examination, or recommend waiting for routine follow-up.
- **Escalation / deterministic links:** `sudden_pallor_or_splenic_concern`; add
  `confusion_or_severe_weakness` or `breathing_difficulty` as applicable.
- **Unanswered / review:** Age/genotype scope and caregiver education pathway.
  Human review required: **yes, mandatory**. Translation risk: pallor may be hard to
  recognize across skin tones; lips, palms and baseline change need careful, tested
  wording. Outdated-guidance risk: low to moderate.

## 4. Conflicts, uncertainties and exclusions

These differences must not be resolved by an LLM or hidden during production:

| Topic | Source-backed difference | Curation decision |
| --- | --- | --- |
| Fever threshold | CDC uses 38.5°C/101.3°F [S06]; Nigeria guideline uses >38°C as an early sepsis sign [S04]. | Preserve both with jurisdiction. Keep the current broad deterministic fever/infection trigger until clinicians approve one production policy. |
| Priapism timing | NHS SCD advice uses >1 hour [S17]; Nigeria uses unresolved after 2 hours [S04]; some general sources use 3–4 hours. | Do not make the patient wait for the longest threshold. Keep the conservative symptom-level H3 escalation and obtain urology/haematology approval. |
| Hydroxyurea missed dose | S18 says resume the normal dose the next day; S19 says take when remembered unless close to the next dose. Both prohibit doubling. | Only “do not double” is sufficiently aligned. All other missed-dose action must refer to the prescription, pharmacist or clinician. |
| Hydroxyurea and pregnancy | S04 uses categorical contraindication language; S02 provides newer individualized pregnancy guidance. | No autonomous recommendation to start, stop or continue. Require obstetric-haematology review and use the current WHO framework. |
| Flight/high altitude | CDC material is broadly conservative [S21]; UCLH says many stable patients can fly in pressurized cabins with individualized planning [S20]. | No blanket clearance or ban. Require pre-travel clinical assessment. |
| Hydration amount | Some older patient materials give fixed glass counts; current high-level sources use “adequate” or “plenty” [S01, S05]. | Exclude a universal quantity and account for fluid restrictions and acute illness. |
| Parvovirus B19 vaccination | S04 states parvovirus B19 can be prevented by vaccine; CDC states no vaccine is available [S10]. | Treat the S04 statement as incorrect/outdated. It must never enter a production module. |
| Supplements | General sources mention folate, while WHO pregnancy guidance individualizes folate/iron and considers malaria-endemic settings [S01, S02]. | Do not recommend folate or iron autonomously; keep supplement selection and dose clinician-dependent. |
| Transfusion thresholds | Guidelines contain indication- and context-specific targets [S04, S14]. | Do not extract a universal patient-facing threshold. Explain purpose/risks only. |
| Pain strategies | ASH supports multidisciplinary/shared decisions, while evidence for some cognitive/behavioural approaches is low certainty [S12]. | Present these only as optional adjuncts, never replacements for medical evaluation or a prescribed pain plan. |

Additional evidence gaps:

- No reviewed source supplies a single Nigeria-wide emergency number or guarantees
  access to a nearby SCD center. The app must use verified user/local resources.
- Mental-health and adolescent-transition content needs stronger current Nigeria-
  specific patient guidance.
- Local availability of hydroxyurea monitoring, phenotype/genotype-matched blood,
  stroke screening, high-risk obstetric care and urology cannot be assumed [S03,
  S04].
- The 2014 NHLBI report remains useful background but needs current-topic
  cross-checking before any recommendation is extracted [S11].

## 5. Nigeria applicability notes

- S04 is the primary Nigeria-specific source and addresses malaria, local clinical
  assessment, hydroxyurea, transfusion, pregnancy, psychosocial care and referral.
  Its clinical detail must not be converted into autonomous app instructions.
- WHO Africa documents structural constraints in screening, comprehensive care and
  hydroxyurea access [S03]. Mira should not imply that recommended services are
  universally available.
- US vaccine schedules and child penicillin pathways [S07], UK service numbers
  [S16, S17], and US/UK travel advice [S20, S21] need Nigeria-specific review.
- Infection content should acknowledge malaria assessment as a local clinical issue
  without diagnosing malaria or suggesting antimalarial treatment [S04].
- Emergency copy should say to seek urgent local medical care and use verified
  contacts recorded in the app. It must not claim transport, clinician contact or
  facility availability.
- Production review should include a Nigerian haematologist, emergency/acute-care
  clinician, pharmacist, obstetric specialist for pregnancy content, transfusion
  specialist for transfusion content, and representative patients/caregivers.

## 6. Clinical-review-required items

All 18 modules require clinical sign-off. The following require specialty review
before any production use:

1. Fever threshold and infection pathway: haematology, paediatrics and Nigerian
   infectious-disease/emergency review.
2. Chest, breathing and neurological wording: haematology and emergency review.
3. Hydroxyurea/adherence: haematology and pharmacy review; pregnancy statements
   additionally require obstetric review.
4. Transfusion: haematology/transfusion-medicine review.
5. Pregnancy: high-risk obstetric and haematology review.
6. Priapism: haematology/urology review, including an age-appropriate threshold.
7. Splenic concern: paediatric haematology review and decision on whether the app
   may reinforce a previously clinician-taught spleen check.
8. Mental wellbeing: mental-health review plus a verified Nigeria crisis pathway.
9. Travel: haematology/travel-medicine review for destination and altitude advice.
10. Every numeric threshold, medicine instruction, screening interval, laboratory
    concept and emergency destination.

Statements that must never be delivered autonomously include diagnoses; medication
or supplement selection/dosing; starting or stopping treatment; interpretation of
laboratory results; transfusion decisions; pregnancy management; procedural advice;
and any assurance that urgent care is unnecessary.

## 7. Translation-review-required items

Do not translate clinical modules through an unreviewed model workflow. Nigerian
Pidgin, Yoruba, Hausa and Igbo versions need independent human review and patient
comprehension testing. Reviewers should preserve:

- urgency without panic and without softening “seek emergency care”;
- distinctions among fever/feeling hot, chest pain/tightness, shortness of breath,
  fast breathing, fainting, seizure and loss of consciousness;
- sudden versus chronic weakness and one-sided neurological changes;
- precise medication concepts: dose, missed dose, monitoring, side effect, do not
  double, and clinician/pharmacist;
- pregnancy, bleeding, fetal risk, consent and medicine language;
- direct, non-shaming terminology for erections and priapism;
- pallor wording that works across skin tones and focuses on change from baseline;
- the difference between “Mira recommends human review” and “a clinician has been
  contacted”; and
- dialect, literacy, code-switching and text-to-speech pronunciation.

Emergency translations should be back-translated, clinically reviewed, usability
tested with speakers from the intended region, and versioned with the approved
English source. A language must not be marked supported merely because an LLM can
generate it.

## 8. Proposed first H4 production pack

The smallest useful first pack is eight modules. The acute-chest and breathing
research records may be represented as one tightly scoped production module if the
approved contract allows both topics without weakening their distinct deterministic
categories.

| Priority | Proposed module | Why it belongs in Patient V1 |
| --- | --- | --- |
| 1 | Sickle-cell basics | Establishes a bounded, non-diagnostic explanation and vocabulary for later answers. |
| 2 | Vaso-occlusive pain | Addresses a frequent patient need while reinforcing the personal pain plan and escalation boundary. |
| 3 | Fever / infection concern | Covers a high-risk, time-sensitive SCD concern and makes threshold conflict explicit for review. |
| 4 | Hydration | Provides common low-risk prevention education while preventing fixed-volume advice. |
| 5 | Acute chest and breathing warnings | Handles closely related life-threatening symptoms and routes them deterministically without diagnosis. |
| 6 | Neurological / stroke warnings | Protects a high-consequence pathway where delay and conversational reassurance are unsafe. |
| 7 | Hydroxyurea education | Answers common purpose, adherence and monitoring questions while preserving the prescribing boundary. |
| 8 | Emergency warning signs | Supplies a short, consistent index into existing H3 categories and makes clear that no contact occurs automatically. |

Pregnancy, priapism and splenic concern remain high priority but should follow the
first pack because their exact wording needs additional obstetric, urology and
paediatric specialist review. Transfusion, routine follow-up, travel, fatigue and
mental-wellbeing content should follow once local pathways and review ownership are
defined.

## 9. H4A knowledge-pack artifact status

Eight versioned `1.0.0` production-candidate fixtures now exist in the static H4A
registry: `scd_basics`, `vaso_occlusive_pain`, `fever_infection`, `hydration`,
`acute_chest_breathing`, `neurological_warning`, `hydroxyurea_education`, and
`emergency_warning_signs`.

These artifacts have the governance status
`research-curated-pending-clinical-review`. This status records research curation;
it does not claim clinician approval. The fixtures are English-only because no
Nigerian Pidgin, Yoruba, Hausa or Igbo clinical translation has completed human
review. Fever and other threshold conflicts remain unresolved and are not encoded
as universal numeric rules.

The registry is not imported by Mira routes, prompts, providers, patient-context
construction, Firestore, UI code or runtime retrieval. Creating the artifacts does
not authorize runtime use.

## Recommended next coding task after clinical approval

Create an **H4B bounded runtime retrieval plan and implementation** only after the
candidate fixtures and safety mappings have clinical approval:

1. Record the approved reviewer identity/role, approval date and exact approved
   module versions without overwriting historical versions.
2. Implement deterministic lookup limits using the existing H1 retrieval seam.
3. Preserve H3 no-downgrade behavior and keep emergency handling independent of
   generated knowledge text.
4. Add source-attribution, version-selection, language fail-closed and runtime
   isolation tests before connecting any module to a prompt or provider.

H4B must not add Firestore/vector storage, embeddings, autonomous clinical
recommendations or unreviewed multilingual generation.
