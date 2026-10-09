# WARRIOR AI Patient Demo

**Release candidate date:** 2026-10-09
**Branch:** `redesign/warrior-ui`
**Clinical status:** Product demonstration; not a production-healthcare
certification or clinical approval

## Working

| Capability | Verification status |
| --- | --- |
| Authentication | Email/password, Google flow, cancellation handling and session continuity are covered by focused automated tests. An existing authenticated Firebase session loaded successfully in the current browser smoke test. |
| Patient profile continuity | UID-scoped existing-profile preservation is covered by focused automated tests; the existing Alex profile loaded in the current smoke test. |
| Home | Manually verified locally: renders recorded-state and empty-state content without fabricated recent values. |
| Health History | Manually verified locally with recorded pain/symptom and hydration entries; missing days are not estimated. |
| Medical Records | Manually verified locally; content is identified as patient-maintained and not clinician-verified. |
| Appointment requests | Manually verified locally and covered by focused tests. The UI says requests are not confirmed appointments. |
| Mira text | Manually verified locally in English, Nigerian Pidgin and Yoruba during this release check. Hausa and Igbo routing remain covered by provider/configuration contracts. |
| Mira voice | English microphone recording, transcription review, sending, Mira response and spoken playback were manually completed during this release check. Pidgin and Yoruba were previously manually verified; current provider and interaction contracts passed. |
| Multilingual support | English, Nigerian Pidgin and Yoruba live text responses passed in the current smoke test. Hausa and Igbo remain supported where the configured provider succeeds. |
| Emergency safety | Manually verified locally: severe pain plus fever produced immediate deterministic emergency guidance that truthfully stated no one was contacted. A new chat then returned a normal greeting without sticky emergency context. |
| Firestore persistence | Existing UID-scoped health data loaded successfully. The latest Mira text/voice conversation remained after a browser reload. Focused Firebase fallback and isolation contracts passed. |

## Demo languages

- **English:** Live text and voice round trip verified in the current release check.
- **Nigerian Pidgin:** Live text verified in the current release check; voice
  previously manually verified and provider contracts passed.
- **Yoruba:** Live text verified in the current release check; voice previously
  manually verified and provider contracts passed.
- **Hausa:** Text/voice provider routing is supported and contract-tested; live
  provider success remains availability-dependent.
- **Igbo:** Text/voice provider routing is supported and contract-tested; live
  provider success remains availability-dependent.

## Clinical boundary

- Mira is clearly labelled as an AI assistant and is not a doctor.
- Mira does not diagnose, prescribe, autonomously alter treatment, contact emergency
  services, submit appointment requests, or write AI output into Health History or
  Medical Records.
- H4 clinical knowledge modules remain
  `research-curated-pending-clinical-review` and are not imported by live Mira routes,
  providers, prompts, retrieval, patient context or UI.
- The clinical review packet requires human haematologist approval before any H4B
  integration is eligible to begin.

## Future / not part of this demo

- Clinically reviewed H4B knowledge retrieval and source presentation.
- Production clinician and caregiver experiences.
- Full production compliance, privacy, consent and clinical-governance gates.
- Remaining offline architecture and release hardening.
- Native-language clinical review and patient comprehension testing.
