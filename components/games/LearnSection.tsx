import React, { useState } from 'react';
import { 
  Heart, HelpCircle, Activity, ShieldAlert, Sparkles, Plus, 
  RefreshCw, GraduationCap, ArrowRight, Eye, BookOpen, HeartPulse 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Hotspot {
  id: string;
  name: string;
  coords: { x: number; y: number };
  consequence: string;
  shield: string;
  reputableSource: string;
}

const getLocalizedLearnData = (lang: string) => {
  switch (lang) {
    case 'pidgin':
      return {
        tabs: {
          map: "🫁 Body Map",
          simulator: "🧬 Jeni Checker",
          treatments: "💊 Medicine Levels"
        },
        clinicalHotspotsTitle: "Anatomy Hotspots & Levels (SCD Impact)",
        impactFileLabel: "Case File",
        howItHappensLabel: "How e dey happen",
        shieldLabel: "Preventive Cover",
        sourceLabel: "Verified Source",
        emptyMarkerPrompt: "Tap any coordinate for the body to see medical data guidelines.",
        genomicsIntroTitle: "Offspring Genomic Cross Simulator",
        genomicsIntroDesc: "Family inheritance of Sickle Cell is autosomal recessive. Check how traits move from mama and papa to children. Carrier (AS) get one sickle gene but generally well well. When crossed with another carrier, there is a 25% chance of children getting SS disease.",
        configureGametes: "Configure Parenting Parents",
        motherGenotypeLabel: "Mother Genotype",
        fatherGenotypeLabel: "Father Genotype",
        carrierLabel: "Carrier",
        warriorLabel: "Warrior",
        normalLabel: "Normal",
        runCrossBtn: "RUN SAMPLE TESTING (100 FAMILY SAMPLES)",
        distributionLabel: "Children Case Distribution",
        statsNotice: "*Statistics correspond with clinical ratios (AA:AS:SS) under standard genetics theory.",
        simulatorReadyLabel: "Simulator Ready",
        simulatorReadyDesc: "Choose genotypes and run cross to check family levels.",
        verifiedSourceLabel: "Authoritative Verified Source",
        hotspots: [
          { id: 'brain', name: '🧠 Brain (Stroke Risk)', coords: { x: 50, y: 8 }, consequence: "Sickle cells dey block cerebral lanes, cutting oxygen flow to the brain head. At-risk kids need annual TCD ultrasound tests.", shield: "Avoid dryness by taking plenty water to dilute bloodstream density & do Yearly Doppler checks.", reputableSource: "CDC / NIH Stroke Prevention Study" },
          { id: 'eyes', name: '👁️ Eyes (Retinopathy)', coords: { x: 50, y: 18 }, consequence: "Tini-tini blood vessels inside eye dey get blocked, causing low oxygen and fragile new vessels wey fit burst easily to cause bleeding.", shield: "Do proper eye check annually with doctors to monitor eye vessels.", reputableSource: "SCD Association of America Guidelines" },
          { id: 'lungs', name: '🫁 Lungs (Acute Chest Syndrome)', coords: { x: 50, y: 35 }, consequence: "Severe chest emergency wey fit occur due to chest infection or blockages in lung vessels, causing chest pain, difficult breathing, and low oxygen.", shield: "Use incentive spirometry daily & run go clinic quick if body gets fever.", reputableSource: "WHO Consensus Protocol" },
          { id: 'spleen', name: '🩸 Spleen (Sequestration Crisis)', coords: { x: 38, y: 48 }, consequence: "When plenty sickle cells get trapped inside spleen, causing spleen to swell up, severe blood loss, and low blood pressure crisis.", shield: "Check spleen size by hands & take intravenous clinic fluids for crisis care.", reputableSource: "ASH Guidelines" },
          { id: 'joints', name: '🦴 Joints (Pain Crisis/VOC)', coords: { x: 35, y: 72 }, consequence: "Capillary blockages block blood supply to bone marrow, causing severe pains inside joints. Too much blockage can damage bones.", shield: "Stay warm, wrap joints inside warm blankets, and drink plenty fluids.", reputableSource: "NIH Clinical Guidelines" }
        ],
        treatments: [
          { title: "Hydroxyurea", type: "Daily Medication", mechanic: "Improves HbF (fetal hemoglobin) to keep round cells flexible in deoxygenated environments, reducing crisis by more than 50%.", source: "CDC SCD Care Guideline" },
          { title: "CRISPR-Cas9 Gene Therapy", type: "Permanent FDA Cure Pathway", mechanic: "Edits bone marrow cells using CRISPR gene tool to turn on fetal hemoglobin permanently, making round blood cells perfectly flexible and healthy.", source: "Vertex & CRISPR Therapeutics FDA approval" },
          { title: "Exchange Transfusions", type: "Therapeutic Support", mechanic: "Regularly adds healthy HbA red blood cells into the bloodstream, lowering the ratio of sickle cells to protect from strokes.", source: "Global SCD Alliance Standards" },
          { title: "Voxelotor", type: "Vessel Support", mechanic: "Binds with Hemoglobin S to help it hold oxygen, stopping sickle cells from sticking and clumping together in vessels.", source: "ASH Studies" }
        ]
      };
    case 'yoruba':
      return {
        tabs: {
          map: "🫁 Àtẹ Ara Alágbára",
          simulator: "🧬 Atọ́ka Apilẹ̀ṣe",
          treatments: "💊 Medicine & Atúnṣe"
        },
        clinicalHotspotsTitle: "Àwọn Kòbògì Ara Tó Lélá (SCD)",
        impactFileLabel: "Ìran Kankan",
        howItHappensLabel: "Bí Ó Ṣe Ń Ṣẹlẹ̀",
        shieldLabel: "Aṣààbò Láti Ìṣègùn",
        sourceLabel: "Atọ́ka Eléré nìkàn",
        emptyMarkerPrompt: "Tẹ eyikeyi marker lori ara lati wo clinical guidelines.",
        genomicsIntroTitle: "Ofingbon Offspring Genomic Cross Simulator",
        genomicsIntroDesc: "Ìní gidi apilẹ̀ṣe sẹ́ẹ̀lì rírẹ́ jẹ́ ti recessive. Dán àwọn àbùdá wò nípa ṣíṣe asáàbò fun baba àti ìyá. Carrier (AS) ní sẹ́ẹ̀lì rírẹ́ kan ṣùgbọ́n ohun yóò da ifẹ́. Pẹ̀lú carrier mìíràn, ewu wà ní 25% fún ọmọ láti jẹ́ SS.",
        configureGametes: "Ṣe Àpẹẹrẹ Àbùdá Òbí",
        motherGenotypeLabel: "Àbùdá Ìyá",
        fatherGenotypeLabel: "Àbùdá Baba",
        carrierLabel: "Asàbò (Carrier)",
        warriorLabel: "Akọni (Warrior)",
        normalLabel: "Sámá (Normal)",
        runCrossBtn: "DÁN ERÉ WÒ FÚN ÌDÍLÉ 100",
        distributionLabel: "Ìpín Sẹ́ẹ̀lì Àwọn Ọmọ",
        statsNotice: "*Àwọn ìṣirò wà ní ìpinnu fún ìlànà apilẹ̀ṣe sẹ́ẹ̀lì dunjú.",
        simulatorReadyLabel: "Atọ́ka Wa Ní Ìpinnu",
        simulatorReadyDesc: "Yan àbùdá láti sọ fún eré.",
        verifiedSourceLabel: "Orísun Eléré To Dájú",
        hotspots: [
          { id: 'brain', name: '🧠 Ọpọlọ (Ewu rọpọlọ)', coords: { x: 50, y: 8 }, consequence: "Sẹ́ẹ̀lì dí kòbògì ọpọlọ lẹ́nu, tí ó ń dín Atẹ́gùn kù. Àwọn ọmọ tó ní ewu yí ní láti gba Doppler (TCD) dunjú mọ́ràn.", shield: "Mu omi kọ́ kún fún mímu atẹ́gùn fẹ́rẹ́ fẹ́rẹ́ & ṣe àyẹ̀wò Doppler ni ọdọọdun.", reputableSource: "CDC / NIH Stroke Prevention Study" },
          { id: 'eyes', name: '👁️ Ojú (Retinopathy)', coords: { x: 50, y: 18 }, consequence: "Àwọn kòbògì ojú tinrín dí mọ́ra, tí ó ń dín oxygen kù fún retina eyi to le fa dídà tàbí fífọ́ ojú.", shield: "Gba àyẹ̀wò ojú dunjú lọ́dọọdún pẹ̀lú dókítà ojú dárádárá.", reputableSource: "SCD Association of America Guidelines" },
          { id: 'lungs', name: '🫁 Ẹ̀dọ̀fóró (Acute Chest Syndrome)', coords: { x: 50, y: 35 }, consequence: "Ìṣòro èémí abulẹ̀-ara tó le gan-an. Ó ń ṣẹlẹ̀ nítorí àkóràn ẹ̀dọ̀fóró tàbí sẹ́ẹ̀lì rírẹ́ dídí mọ́ra nínú kòbògì, tí ó ń fa ìrora àyà.", shield: "Ṣe adaṣe èémí spirometry lójoojúmọ́ & sáré lọ sí ilé ìwòsàn ní kánkán fún ibà.", reputableSource: "WHO Consensus Protocol" },
          { id: 'spleen', name: '🩸 Ọlọ́ (Sequestration Crisis)', coords: { x: 38, y: 48 }, consequence: "Àwọn sẹ́ẹ̀lì rírẹ́ milíọ̀nù pọ̀ mọ́lẹ̀ nínú ọlọ́, tí ó ń fa fífú organ yí, sẹ́ẹ̀lì dídì kù, àti dídín ìtújáde ẹ̀jẹ̀ kù.", shield: "Ṣe àyẹ̀wò títọ́ ọlọ́ fún títóbi rẹ̀ & gba omi intravenous fún ìtọ́jú kọ́ kún.", reputableSource: "ASH Guidelines" },
          { id: 'joints', name: '🦴 Oríkèé Ara (Pain Crisis/VOC)', coords: { x: 35, y: 72 }, consequence: "Kòbògì dí mọ́ra tí ó ń dí ẹ̀jẹ̀ lẹ́nu lọ sí oríkèé eegun, eyi to n fa ìrora gidi gan-an ninu ara.", shield: "Dúró nínú ọ̀yàyà òtútù kúrò, lo ibora gbigbona fún oríkèé, kí o sì mu omi pọ̀.", reputableSource: "NIH Clinical Guidelines" }
        ],
        treatments: [
          { title: "Hydroxyurea", type: "Egbògi Lójoojúmọ́", mechanic: "Ó ń pọ̀ Fetal Hemoglobin (HbF) sílẹ̀ láti dènà dídí sẹ́ẹ̀lì pupa, tí ó ń dín ìrora kù ju 50% lọ.", source: "CDC SCD Care Guideline" },
          { title: "Atúnṣe Apilẹ̀ṣe CRISPR-Cas9", type: "Atúnṣe Ayérayé Kánkán", mechanic: "Ó ń tún sẹ́ẹ̀lì marrow ṣe nípasẹ̀ kọ̀m̀pútà CRISPR lati fún àbùdá fetal hemoglobin ní agbára títí lọ.", source: "Vertex & CRISPR Therapeutics FDA approval" },
          { title: "Mímu Ẹ̀jẹ̀ Tuntun (Transfusions)", type: "Ìrànlọ́wọ́ Ìṣègùn", mechanic: "Gbígbé sẹ́ẹ̀lì pupa rere lọ sínú ẹ̀jẹ̀ láti dín ewu rọpọlọ kù fún àwọn akọni.", source: "Global SCD Alliance Standards" },
          { title: "Voxelotor", type: "Ìrànlọ́wọ́ Kòbògì", mechanic: "Ó ń sọ́ mọ́ Hemoglobin S láti ràn lọ́wọ́ láti gba atẹ́gùn oxygen dárádárá láìsí dídí kankan.", source: "American Society of Hematology" }
        ]
      };
    case 'hausa':
      return {
        tabs: {
          map: "🫁 Rigakafin Jiki",
          simulator: "🧬 Na'urar Gwajin Halitta",
          treatments: "💊 Magunguna na Musamman"
        },
        clinicalHotspotsTitle: "Taurarin Cututtuka a Jiki (VOC Impacts)",
        impactFileLabel: "Fayil na Cutar",
        howItHappensLabel: "Yadda Yake Faruwa",
        shieldLabel: "Garkuwar Rigakafi",
        sourceLabel: "Majiyar Lafiya",
        emptyMarkerPrompt: "Danna kowane alama a jikin mutum don duba bayanan asibiti.",
        genomicsIntroTitle: "Gwajin Haduwar Jini na 'Ya'ya",
        genomicsIntroDesc: "Gadon kwayoyin halitta na Sickle Cell autosomal recessive ne. Gwada yadda kwayoyin halitta ke canzawa daga iyaye. Carrier (AS) na da kwayar sickle guda daya amma yana da koshin lafiya gaba daya. Idan AS ta hadu da wani AS, akwai yiwuwar 25% na samun yaro mai dauke da cutar SS.",
        configureGametes: "Sanya Kwayoyin Halitta Na Iyaye",
        motherGenotypeLabel: "Kwayar Halitta Ta Uwa",
        fatherGenotypeLabel: "Kwayar Halitta Ta Uba",
        carrierLabel: "Mai Dauke da Shara (Carrier)",
        warriorLabel: "Jarumi (Warrior)",
        normalLabel: "Lafiyayye (Normal)",
        runCrossBtn: "FARA GWAJIN JINI SAMPLES 100",
        distributionLabel: "Rarraba Halittu ga 'Ya'ya",
        statsNotice: "*Alkaluma sun yi daidai da ka'idodin kwayoyin halittar jini na kimiyya standard.",
        simulatorReadyLabel: "Na'urar Gwajin a Shirye Take",
        simulatorReadyDesc: "Zabi kwayoyin halittun iyaye don fara gwaji.",
        verifiedSourceLabel: "Amintacciyar Majiyar Asibiti",
        hotspots: [
          { id: 'brain', name: '🧠 Kwakwalwa (Barazanar Shanyewar Jiki)', coords: { x: 50, y: 8 }, consequence: "Kwayoyin sickle cell suna toshe manyan hanyoyin jini na kwakwalwa, wanda ke hana iskar oxygen isa ga kashi. Yara masu hadari na bukatar gwajin Doppler (TCD) a kowace shekara.", shield: "Tabbatar da shan ruwa akai-akai don rage kaurin jini & yin gwajin Doppler duk shekara.", reputableSource: "CDC / NIH Stroke Prevention Study" },
          { id: 'eyes', name: '👁️ Idanu (Retinopathy)', coords: { x: 50, y: 18 }, consequence: "Hanyoyin jini na idanu suna toshewa, wanda ke haifar da rashin iskar oxygen da zubar jini a idanun.", shield: "Yin gwajin idanu duk shekara tare da kwararren likitan idanu.", reputableSource: "SCD Association of America Guidelines" },
          { id: 'lungs', name: '🫁 Huhu (Acute Chest Syndrome)', coords: { x: 50, y: 35 }, consequence: "Wani babban kalubale ga rayuwa sakamakon toshewar hanyoyin huhu ko kamuwa da mura mai tsanani da ke haifar da ciwon kirji.", shield: "Yin motsa jiki na numfashi (spirometry) a kowace rana & neman lafiya cikin sauri idan zazzabi ya tashi.", reputableSource: "WHO Consensus Protocol" },
          { id: 'spleen', name: '🩸 Spleen (Sequestration Crisis)', coords: { x: 38, y: 48 }, consequence: "Miliyoyin kwayoyin jini suna makale a cikin spleen, suna haifar da kumburin spleen mai tsanani da faduwar hawan jini.", shield: "Duba girman spleen ta hanyar taba jiki duk rana & amfani da ruwan jini nan take.", reputableSource: "ASH Guidelines" },
          { id: 'joints', name: '🦴 Jiki & Gwiwa (Zafin VOC)', coords: { x: 35, y: 72 }, consequence: "Toshewar hanyoyin jini tana hana isar abinci ga kashin gwiwa, tana haifar da ciwo mai tsanani a jiki.", shield: "Tabbatar da sanya sutura masu dumi, amfani da bargon dumi a gwiwar jiki, da shan ruwa sosai.", reputableSource: "NIH Clinical Guidelines" }
        ],
        treatments: [
          { title: "Hydroxyurea", type: "Magani na Kullum", mechanic: "Yana motsa fetal hemoglobin (HbF) production wanda ke hana kwayoyin sickle haduwa tare, yana rage ciwo da kashi 50%.", source: "CDC SCD Care Guideline" },
          { title: "Gyaran CRISPR-Cas9", type: "Babban Maganin Jini na Permanent", mechanic: "Yana amfani da CRISPR kwayoyin halitta don kunna fetal hemoglobin din jiki gaba daya domin warkar da mutum.", source: "Vertex & CRISPR Therapeutics FDA approval" },
          { title: "Karin Jini (Blood Transfusion)", type: "Taimako na Asibiti", mechanic: "Sanya kwayoyin jini masu lafiya (HbA) zuwa jiki domin rage yawan kwayoyin sickle cell.", source: "Global SCD Alliance Standards" },
          { title: "Voxelotor", type: "Garkuwar Hanyar Jini", mechanic: "Yana haduwa da Hemoglobin S domin taimaka masa ya rike iskar oxygen da kyau don hana daskarewa.", source: "American Society of Hematology" }
        ]
      };
    case 'igbo':
      return {
        tabs: {
          map: "🫁 Maapụ Ahụ",
          simulator: "🧬 Simulator Genetics",
          treatments: "💊 Ọgwụ Ahụike"
        },
        clinicalHotspotsTitle: "Ọnọdụ Ahụike Na-adịghị Mma (SCD)",
        impactFileLabel: "Faịlụ Ọrịa gị",
        howItHappensLabel: "Gịnị Na-eme ya?",
        shieldLabel: "Garkuwa nchebe",
        sourceLabel: "Ebe Ndị Ziri Ezi",
        emptyMarkerPrompt: "Pịa akara ọ bụla n'ahụ mmadụ ka ị hụ ozi asibiti.",
        genomicsIntroTitle: "Simulator Ndị Jeni mụ nwa",
        genomicsIntroDesc: "Ihe nketa nke Sickle Cell bụ autosomal recessive. Nwàla site na ejikọta mkpụrụ ndụ nne na nna. Onye nwere AS na-enwe koshị ahụike. Ọ bụrụ na AS abụọ ejikọọ, ọ bụ 25% kpatara nwa ị nwere SS.",
        configureGametes: "Nhazi Mkpụrụ Ndụ Nne na Nna",
        motherGenotypeLabel: "Genotype Nne",
        fatherGenotypeLabel: "Genotype Nna",
        carrierLabel: "Onye bu Ya (AS)",
        warriorLabel: "Dike (SS)",
        normalLabel: "Ahụike (AA)",
        runCrossBtn: "GBAGHARỊA NJIKỌ SITE NA SAMPLES 100",
        distributionLabel: "Nkesa Mkpụrụ Ndụ n'Ezinụlọ",
        statsNotice: "*Akwụsịrị statistics ziri ezi na genetics theory doro anya.",
        simulatorReadyLabel: "Simulator A dịla Mma",
        simulatorReadyDesc: "Họrọ mkpụrụ ndụ nne na nna ka ịmalite.",
        verifiedSourceLabel: "Ebe Nkwado Ziri Ezi n'Asibiti",
        hotspots: [
          { id: 'brain', name: '🧠 Ụbụrụ (Egosipụta Stroke)', coords: { x: 50, y: 8 }, consequence: "Mkpụrụ sél sickle pụrụ mechie ụgbọ ụbụrụ, nke na-akwụsị oxygen. Ụmụaka chọrọ Doppler (TCD) scans mgbe niile.", shield: "Nọgide na-aụ mmiri oge niile ka ọbara ghara ịgbachigala, na scans Doppler oge kwesịrị.", reputableSource: "CDC / NIH Stroke Prevention Study" },
          { id: 'eyes', name: '👁️ Anya (Retinopathy)', coords: { x: 50, y: 18 }, consequence: "Obere arịa anya na-emechidoro, nke na-akpata hypoxia. Anya nwere ike sụọ mbe ziri ezi.", shield: "Nyocha anya gị kwa afọ n'aka dọkịta ziri ezi maka nchedo.", reputableSource: "SCD Association of America Guidelines" },
          { id: 'lungs', name: '🫁 Ufere Ahụ (Acute Chest Syndrome)', coords: { x: 50, y: 35 }, consequence: "Ihe mberede ahụike dị egwu nke ọrịa anya ma ọ bụ capillary mechiri n'arịa ume, na-ebute oké mgbu n'obi.", shield: "Mee mmega ume spirometry kwa ụbọchị & mela ọsọ gaa ụlọ ọgwụ ma ahụ ọkụ pụta.", reputableSource: "WHO Consensus Protocol" },
          { id: 'spleen', name: '🩸 Spleen (Sequestration Crisis)', coords: { x: 38, y: 48 }, consequence: "Sél gbagọrọ agbagọ na-amachi na spleen, na-ebute mgbasasị spleen na ezigbo anemia ngwa ngwa.", shield: "Mee nyocha spleen n'aka kwa ụbọchị & buru mmiri intravenous ga asibiti oge mberede.", reputableSource: "ASH Guidelines" },
          { id: 'joints', name: '🦴 Joints (Pain Crisis/VOC)', coords: { x: 35, y: 72 }, consequence: "Capillary na-egbochi ọbara ịga na bone marrow, na-akpata oké mgbu na nkwonkwo anyị.", shield: "Mee ka ahụ gị kpoo ọkụ n'oge oyi, jiri blanket ọkụ mee ka ahụ dị mma, ma aụọ mmiri.", reputableSource: "NIH Clinical Guidelines" }
        ],
        treatments: [
          { title: "Hydroxyurea", type: "Ọgwụ nke Kwa Ụbọchị", mechanic: "Na-akpali mmepụta Fetal Hemoglobin (HbF) nke na-egbochi sél anyị ịrapara ọnụ, na-ebelata VOC site n'ihe karịrị 50%.", source: "CDC SCD Care Guideline" },
          { title: "CRISPR-Cas9 Gene Therapy", type: "Cure Na-adịgide Adịgide site FDA", mechanic: "Na-eji CRISPR mmezi jeni rụọ ọrụ ka fetal hemoglobin gaa n'ihu oge niile, na-agbazi sél gbagọrọ agbagọ nke ọma.", source: "Vertex & CRISPR Therapeutics FDA approval" },
          { title: "Blood Transfusions", type: "Ego Ahụike Nkwado", mechanic: "Na-enye ọbara ọhụrụ sitere na onye ọzọ nwere HbA iji belata concentration sél sickle mgbachigala.", source: "Global SCD Alliance Standards" },
          { title: "Voxelotor", type: "Nkwado Arịa", mechanic: "Na-ejikọ na Hemoglobin S iji mee ka o jide oxygen ọhụrụ, na-egbochi sél ịrapara ọnụ n'arịa ọbara.", source: "American Society of Hematology" }
        ]
      };
    default:
      return {
        tabs: {
          map: "🫁 Interactive Body Map",
          simulator: "🧬 Genetics Simulator",
          treatments: "💊 Treatments & Cures"
        },
        clinicalHotspotsTitle: "Vascular Clinical Hotspots (SCD Impacts)",
        impactFileLabel: "Impact File",
        howItHappensLabel: "How it Happens",
        shieldLabel: "Clinical Preventative Shield",
        sourceLabel: "Source Verified Guidelines",
        emptyMarkerPrompt: "Tap any anatomical marker on the human map to view clinical data guidelines.",
        genomicsIntroTitle: "Offspring Genomic Cross Simulator",
        genomicsIntroDesc: "Genetic inheritance of Sickle Cell is autosomal recessive. Test outcomes by crossing different parents. A carrier (AS) possesses one sickle gene but generally lives symptom-free. Crossed with another carrier, they present a 25% chance of birth with SS disease.",
        configureGametes: "Configure Parenting Gametes",
        motherGenotypeLabel: "Mother Genotype",
        fatherGenotypeLabel: "Father Genotype",
        carrierLabel: "Carrier",
        warriorLabel: "Warrior",
        normalLabel: "Normal",
        runCrossBtn: "RUN CROSS (100 FAMILY SAMPLES)",
        distributionLabel: "Offspring Distribution Profiles",
        statsNotice: "*Statistics correspond with clinical ratios (AA:AS:SS) under standard genetics theory.",
        simulatorReadyLabel: "Simulator Ready",
        simulatorReadyDesc: "Select genotypes & cross parents to map family outcomes dynamically.",
        verifiedSourceLabel: "Authoritative Verified Source",
        hotspots: [
          {
            id: 'brain',
            name: '🧠 Brain (Stroke Risk)',
            coords: { x: 50, y: 8 },
            consequence: "Rigid sickle blood cells clog larger cerebral vessels, shutting down oxygen to neurological tissues. High-risk kids require routine Transcranial Doppler (TCD) ultrasound screenings.",
            shield: "Ensure consistent fluid intakes to thin bloodstream density & attend yearly Doppler checks.",
            reputableSource: "CDC / NIH Stroke Prevention Study"
          },
          {
            id: 'eyes',
            name: '👁️ Eyes (Retinopathy)',
            coords: { x: 50, y: 18 },
            consequence: "Microscopic retinal blood vessels become blocked, triggering local hypoxia. The body grows unstable, fragile new vessels that break easily, causing bleeding and progressive vision impairment.",
            shield: "Get annual comprehensive eye examinations with dilation to monitor vessels.",
            reputableSource: "SCD Association of America Guidelines"
          },
          {
            id: 'lungs',
            name: '🫁 Lungs (Acute Chest Syndrome)',
            coords: { x: 50, y: 35 },
            consequence: "A life-threatening medical emergency. It is caused by lung infection or sickle cell blockages in pulmonary vessels, triggering server chest pain, rapid breathing, and hypoxia.",
            shield: "Perform daily incentive spirometry breathing exercises & seek fast clinical care for fever.",
            reputableSource: "World Health Organization (WHO) Consensus Protocol"
          },
          {
            id: 'spleen',
            name: '🩸 Spleen (Sequestration Crisis)',
            coords: { x: 38, y: 48 },
            consequence: "The spleen filters blood. In sickling states, millions of cells pool and get trapped inside the spleen, causing severe organ enlargement, extreme anemia, and rapid drops in blood pressure.",
            shield: "Daily touch palpation checks for spleen size & prompt intravenous fluids for crisis care.",
            reputableSource: "American Society of Hematology Guidelines"
          },
          {
            id: 'joints',
            name: '🦴 Joints (Pain Crisis/VOC)',
            coords: { x: 35, y: 72 },
            consequence: "Capillary traffic jams block supply to bone marrow nerves, initiating intense bone/joint agony. Prolonged blockages can damage joints (avascular necrosis).",
            shield: "Maintain warmth, wrap joint systems in cozy electric blankets, and hydrate continuously.",
            reputableSource: "National Institutes of Health (NIH) Clinical Guidelines"
          }
        ],
        treatments: [
          {
            title: "Hydroxyurea",
            type: "Daily Medication",
            mechanic: "Stimulates Fetal Hemoglobin (HbF) production. HbF prevents abnormal Hemoglobin S molecules from clumping together in deoxygenated environments, dramatically reducing pain crises by over 50%.",
            source: "CDC SCD Care Guideline"
          },
          {
            title: "CRISPR-Cas9 Gene Therapy",
            type: "Permanent FDA Cure Pathway",
            mechanic: "Removes bone marrow stem cells, applies CRISPR-Cas9 genome editing to turn on Fetal Hemoglobin, and replaces them. This creates clean, highly flexible red blood cells, curing VOCs completely.",
            source: "Vertex & CRISPR Therapeutics FDA approval"
          },
          {
            title: "Simple & Exchange Transfusions",
            type: "Therapeutic Support",
            mechanic: "Regularly injects fresh donor red blood cells into the bloodstream, bringing normal HbA. This dilutes the concentration of circulating sickle cells, lowering stroke risk.",
            source: "Global SCD Alliance Standards"
          },
          {
            title: "Novel Inhibitors (Voxelotor)",
            type: "Vessel Support",
            mechanic: "Binds directly to Hemoglobin S to boost its affinity for oxygen. In oxygenated states, hemoglobin molecules are chemically restricted from aggregating, keeping cells circular.",
            source: "American Society of Hematology"
          }
        ]
      };
  }
};

interface LearnSectionProps {
  language: string;
  textScale: 'normal' | 'large' | 'xl';
  colorBlindMode: string;
}

const LearnSection: React.FC<LearnSectionProps> = ({ language, textScale, colorBlindMode }) => {
  const [activeSubTab, setActiveSubTab] = useState<'map' | 'simulator' | 'treatment'>('map');
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>('brain');
  
  // Genetics state settings
  const [mGenotype, setMGenotype] = useState<'AA' | 'AS' | 'SS'>('AS');
  const [fGenotype, setFGenotype] = useState<'AA' | 'AS' | 'SS'>('AS');
  const [simulationResult, setSimulationResult] = useState<{ AA: number; AS: number; SS: number } | null>(null);

  const locD = getLocalizedLearnData(language);
  const selectedHotspot = locD.hotspots.find(h => h.id === selectedHotspotId) || locD.hotspots[0];

  const textScaleClasses = {
    normal: 'text-xs md:text-sm',
    large: 'text-sm md:text-base',
    xl: 'text-base md:text-lg'
  };

  // Run a real randomized genetics simulation crossing (Monte Carlo 100 kids)
  const runGeneticsSimulation = () => {
    let aa = 0;
    let as = 0;
    let ss = 0;

    const mAlleles = mGenotype.split(''); // 'A', 'S'
    const fAlleles = fGenotype.split('');

    // Cross alleles 100 times to map clinical statistical probabilities
    for (let i = 0; i < 100; i++) {
      const mPick = mAlleles[Math.floor(Math.random() * mAlleles.length)];
      const fPick = fAlleles[Math.floor(Math.random() * fAlleles.length)];

      const combined = [mPick, fPick].sort().join(''); // Sort, e.g. 'AS' or 'AA'
      if (combined === 'AA') aa++;
      else if (combined === 'AS') as++;
      else if (combined === 'SS') ss++;
    }

    setSimulationResult({ AA: aa, AS: as, SS: ss });
  };

  return (
    <div className="space-y-6">
      
      {/* Interactive Hub navigation tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-lg border border-gray-250">
        <button
          onClick={() => setActiveSubTab('map')}
          className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'map' ? 'bg-white text-red-650 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {locD.tabs.map}
        </button>
        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'simulator' ? 'bg-white text-red-650 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {locD.tabs.simulator}
        </button>
        <button
          onClick={() => setActiveSubTab('treatment')}
          className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'treatment' ? 'bg-white text-red-650 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {locD.tabs.treatments}
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* INTERACTIVE BODY MAP TAB */}
        {activeSubTab === 'map' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start"
          >
            {/* Real human layout drawing outline map on LHS */}
            <div className="md:col-span-2 bg-slate-900 border-4 border-slate-950 rounded-[2.5rem] p-6 flex items-center justify-center relative shadow-inner aspect-[3/4]">
              {/* Center Human dummy structure outline */}
              <div className="w-full h-full flex flex-col justify-between items-center relative py-12">
                
                {/* Silhouette SVG line mapping */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <Activity size={180} className="text-red-500 animate-pulse" />
                </div>

                <div className="w-1.5 h-full bg-slate-800 rounded-full absolute left-1/2 -translate-x-1/2 z-0" />

                {locD.hotspots.map((spot) => {
                  const isActive = selectedHotspotId === spot.id;
                  return (
                    <button
                      key={spot.id}
                      onClick={() => setSelectedHotspotId(spot.id)}
                      style={{ top: `${spot.coords.y}%`, left: `${spot.coords.x}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10 cursor-pointer ${
                        isActive 
                          ? 'bg-red-500 border-white text-white scale-125 animate-pulse shadow-lg shadow-red-500/50' 
                          : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-red-400 hover:text-red-400'
                      }`}
                    >
                      🕹️
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Organ consequences and solutions on RHS */}
            <div className="md:col-span-3 space-y-4">
              <div className="bg-red-50/50 border border-red-150 p-4 rounded-3xl flex gap-2">
                <GraduationCap className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-950 font-bold uppercase leading-none">
                  {locD.clinicalHotspotsTitle}
                </p>
              </div>

              {selectedHotspot ? (
                <div className="bg-white rounded-[2rem] border border-gray-150 p-6 space-y-4 shadow-sm animate-in zoom-in-95 leading-relaxed">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-805">{selectedHotspot.name}</h3>
                    <span className="text-[10px] bg-red-50 text-red-700 font-black uppercase tracking-wider px-2.5 py-0.5 rounded border border-red-100">
                      {locD.impactFileLabel}
                    </span>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-gray-50">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{locD.howItHappensLabel}</span>
                      <p className={`text-gray-650 font-semibold ${textScaleClasses[textScale]}`}>
                        {selectedHotspot.consequence}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{locD.shieldLabel}</span>
                      <p className={`text-green-700 font-bold ${textScaleClasses[textScale]}`}>
                        🛡️ {selectedHotspot.shield}
                      </p>
                    </div>

                    <div className="pt-2 flex justify-between text-[10px] text-gray-400 font-bold uppercase">
                      <span>{locD.sourceLabel}</span>
                      <span>{selectedHotspot.reputableSource}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-2xl text-gray-450 italic font-semibold">
                  {locD.emptyMarkerPrompt}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* OFFSPRING GENETICS MULTI-CROSSING SIMULATOR */}
        {activeSubTab === 'simulator' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl flex gap-3 text-indigo-900">
              <BookOpen size={18} className="shrink-0 text-indigo-600 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase">{locD.genomicsIntroTitle}</h4>
                <p className="text-xs text-indigo-700 font-semibold leading-relaxed">
                  {locD.genomicsIntroDesc}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Conf selectors */}
              <div className="bg-white rounded-3xl border border-gray-150 p-6 space-y-4 shadow-sm">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 block">{locD.configureGametes}</span>

                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border">
                    <span className="text-xs font-bold text-gray-700 block">{locD.motherGenotypeLabel}</span>
                    <div className="flex gap-2.5 flex-wrap">
                      {['AA', 'AS', 'SS'].map((val) => (
                        <button
                          key={val}
                          onClick={() => { setMGenotype(val as any); setSimulationResult(null); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            mGenotype === val ? 'bg-indigo-600 text-white font-black shadow-sm' : 'bg-white border text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {val} {val === 'AS' ? `(${locD.carrierLabel})` : val === 'SS' ? `(${locD.warriorLabel})` : `(${locD.normalLabel})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border">
                    <span className="text-xs font-bold text-gray-700 block">{locD.fatherGenotypeLabel}</span>
                    <div className="flex gap-2.5 flex-wrap">
                      {['AA', 'AS', 'SS'].map((val) => (
                        <button
                          key={val}
                          onClick={() => { setFGenotype(val as any); setSimulationResult(null); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            fGenotype === val ? 'bg-indigo-600 text-white font-black shadow-sm' : 'bg-white border text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {val} {val === 'AS' ? `(${locD.carrierLabel})` : val === 'SS' ? `(${locD.warriorLabel})` : `(${locD.normalLabel})`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={runGeneticsSimulation}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <RefreshCw className="animate-spin" size={14} style={{ animationDuration: '4s' }} />
                  {locD.runCrossBtn}
                </button>
              </div>

              {/* Simulation visual results */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col justify-center min-h-[220px]">
                {simulationResult ? (
                  <div className="space-y-4 animate-in zoom-in-95 duration-200">
                    <header className="text-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-green-400 block">{locD.distributionLabel}</span>
                    </header>

                    {/* Progress distribution bars representing probability outcomes */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>AA ({locD.normalLabel})</span>
                          <span className="text-indigo-300">{simulationResult.AA}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border">
                          <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${simulationResult.AA}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>AS ({locD.carrierLabel})</span>
                          <span className="text-indigo-300">{simulationResult.AS}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border">
                          <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${simulationResult.AS}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>SS ({locD.warriorLabel})</span>
                          <span className="text-indigo-300">{simulationResult.SS}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border">
                          <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${simulationResult.SS}%` }} />
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-400 font-semibold uppercase text-center mt-3">
                      {locD.statsNotice}
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-500 space-y-2">
                    <span className="text-4xl block opacity-40">🧬</span>
                    <span className="text-xs font-black uppercase tracking-wider block">{locD.simulatorReadyLabel}</span>
                    <span className="text-[10px] text-gray-500 leading-normal block">{locD.simulatorReadyDesc}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VERIFIED TREATMENT CARD DECK */}
        {activeSubTab === 'treatment' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {locD.treatments.map((treat, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-3xl border border-gray-150 p-6 flex flex-col justify-between hover:border-red-300 transition-all shadow-sm"
              >
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] bg-red-50 text-red-600 font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded border border-red-100">
                      {treat.type}
                    </span>
                    <Heart className="text-red-500" size={20} />
                  </div>
                  <h3 className="text-lg font-black text-gray-850 tracking-tight leading-none pt-1">
                    {treat.title}
                  </h3>
                  <p className={`text-gray-500 leading-relaxed font-semibold pt-1 ${textScaleClasses[textScale]}`}>
                    {treat.mechanic}
                  </p>
                </div>
                
                <div className="border-t border-gray-50 pt-3 flex justify-between text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                  <span>{locD.verifiedSourceLabel}</span>
                  <span>{treat.source}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default LearnSection;
