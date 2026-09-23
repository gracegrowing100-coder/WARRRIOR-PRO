// Offline Knowledge Engine & Multilingual SCD AI Model
// Operates 100% locally with zero network calls for instant offline responses in English, Yoruba, Hausa, and Igbo.

export type SupportedLanguage = 'en' | 'yo' | 'ha' | 'ig';

export interface SCDTopic {
  keywords: string[];
  category: 'crisis' | 'hydration' | 'pain' | 'nutrition' | 'medication' | 'genotype' | 'emergency' | 'general';
  dangerLevel: 'emergency' | 'warning' | 'info';
  en: {
    title: string;
    summary: string;
    actionableAdvice: string[];
    redFlags?: string[];
    suggestedTools?: string[];
    localFoods?: string[];
  };
  yo: {
    title: string;
    summary: string;
    actionableAdvice: string[];
    redFlags?: string[];
    suggestedTools?: string[];
    localFoods?: string[];
  };
  ha: {
    title: string;
    summary: string;
    actionableAdvice: string[];
    redFlags?: string[];
    suggestedTools?: string[];
    localFoods?: string[];
  };
  ig: {
    title: string;
    summary: string;
    actionableAdvice: string[];
    redFlags?: string[];
    suggestedTools?: string[];
    localFoods?: string[];
  };
}

export const OFFLINE_SCD_TOPICS: SCDTopic[] = [
  {
    keywords: ['crisis', 'emergency', 'pain crisis', 'severe pain', 'chest pain', 'hospital', 'fever', 'sos', 'in crisis', 'agbako', 'fitila', 'matsanancin ciwo', 'nsogbu', 'oké mgbu'],
    category: 'crisis',
    dangerLevel: 'emergency',
    en: {
      title: "Acute Vaso-Occlusive Crisis & Emergency Management",
      summary: "A sickle cell crisis occurs when stiff, sickle-shaped red blood cells block small blood vessels, depriving tissues of oxygen and causing intense pain.",
      actionableAdvice: [
        "1. Start Immediate Hydration: Drink 500ml - 1L of warm water or electrolyte fluids immediately.",
        "2. Apply Gentle Warmth: Use warm blankets or a warm towel on the painful area. NEVER apply ice or cold packs as cold triggers further vessel constriction.",
        "3. Take Prescribed Pain Relievers: Follow your doctor's analgesia protocol (e.g. Paracetamol, NSAIDs if prescribed, or prescribed oral opioids).",
        "4. Rest and Deep Breathing: Sit in a comfortable position, take slow diaphragmatic breaths to maximize blood oxygenation."
      ],
      redFlags: [
        "🚨 High Fever (>38.5°C / 101.3°F) - danger of rapid bacterial infection / sepsis",
        "🚨 Acute Chest Syndrome: Chest pain, shortness of breath, rapid cough",
        "🚨 Severe, unremitting abdominal pain or sudden pallor/dizziness (Splenic Sequestration)",
        "🚨 Sudden weakness, facial droop, or difficulty speaking (Stroke warning)",
        "🚨 Painful erection lasting > 2 hours (Priapism in males)"
      ],
      suggestedTools: ["Emergency SOS Dispatcher", "Pain Tracker (VAS 0-10)", "Water Intake Tracker", "Designated Caregiver Ping"]
    },
    yo: {
      title: "Ìtọ́jú Ìṣòro Ìrora Gíga (Agbákò Ẹ̀jẹ̀ Dídì / Vaso-occlusive Crisis)",
      summary: "Ìṣòro ìrora ẹ̀jẹ̀ dídì máa ń wáyé nígbà tí àwọn sẹ́ẹ̀lì ẹ̀jẹ̀ pupa tí ó tẹ̀ bí dòjé bá dín àwọn iṣan ẹ̀jẹ̀ kéékèèké kù, tí kò sì jẹ́ kí afẹ́fẹ́ ọ́ksíjìn dé ibi tí ó yẹ.",
      actionableAdvice: [
        "1. Mu Omi Gbígbóná Lẹ́sẹ̀kẹsẹ̀: Mu omi tó móoru tàbí omi pẹ̀lú iyọ̀ amúralókun (electrolytes) bíi lita kan.",
        "2. Fi Nnkan Gbígbóná Bo Ara: Lo aṣọ tútù gbígbóná tàbí ibora gbígbóná. MÁ ṢE fi yinyin tàbí omi tútù sí ibi tó ń dun ọ́ rárá nítorí òtútù ń jẹ́ kí ẹ̀jẹ̀ dì síi.",
        "3. Lo Oògùn Dídín Ìrora: Lo oògùn tí dọ́kítà kọ fún ọ ní àkókò tó tọ́.",
        "4. Sinmi pẹ̀lú Mí Afẹ́fẹ́ Jinlẹ̀: Jókoó jẹ́ẹ́, fa afẹ́fẹ́ wọlé kí ẹ̀jẹ̀ lè rí afẹ́fẹ́ ọ́ksíjìn dáadáa."
      ],
      redFlags: [
        "🚨 Ibà Gbígbóná (>38.5°C) - ewu àkóràn kòkòrò àrùn",
        "🚨 Ìrora Àyà àti Ìṣòro Mímí (Acute Chest Syndrome)",
        "🚨 Ìrora Ikùn tó le gan-an tàbí Ọpọlọ dídàgbà (Splenic sequestration)",
        "🚨 Àìlera lójijì tàbí Ìṣòro Ọ̀rọ̀ sísọ (Ewu Rọ́párọ́sẹ̀)",
        "🚨 Ìdúró Okó tí kò dánu ju wákàtí méjì lọ fún ọkùnrin (Priapism)"
      ],
      suggestedTools: ["Bọ́tìnì Pàjáwìrì (SOS)", "Àkọsílẹ̀ Ìrora", "Olùtọpinpin Omi Mumu"]
    },
    ha: {
      title: "Gaggawar Magance Matsanancin Ciwon Kanjamau (SCD Crisis)",
      summary: "Ciwon jijiya yana faruwa ne lokacin da kwayoyin jini masu siffar lauje suka toshe hanyoyin jini, wanda hakan ke hana iskar oxygen isa ga sassan jiki tare da haddasa tsananin zafi.",
      actionableAdvice: [
        "1. Fara Shan Ruwan Dumi Nan Take: Sha ruwan dumi kusan lita 1 ko romon gida mai dumi nan take.",
        "2. Rufe Jiki da Dumi: Yi amfani da bargo mai dumi ko tawul mai dumi a wurin da ke ciwo. KADA a sanya kankara ko ruwan sanyi, domin sanyi na kara toshe jijiyoyin jini.",
        "3. Sha Maganin Rage Zafi: Sha maganin rage ciwo da likita ya rubuta maka.",
        "4. Hutu da Numfashi Mai Zurfi: Zauna cikin natsuwa ka rika jan numfashi a hankali don samun iskar oxygen."
      ],
      redFlags: [
        "🚨 Zazzabi mai zafi sosai (>38.5°C) - alamar kwayar cuta",
        "🚨 Ciwon kirji da wahalar numfashi",
        "🚨 Ciwon ciki mai tsanani ko jiri da rashin jini kwatsam",
        "🚨 Rashin karfi a gefen jiki ko karkatar baki (Alamar shanyewar barin jiki)",
        "🚨 Taurin gaba mai zafi sama da awanni 2 ga maza (Priapism)"
      ],
      suggestedTools: ["Maballin Agajin Gaggawa (SOS)", "Awo Zafin Ciwo", "Kula da Shan Ruwa"]
    },
    ig: {
      title: "Nlekọta Mberede Mgbe Oké Mgbu Ọrịa Sickle Cell Dapụtara",
      summary: "Oké mgbu a na-eme mgbe mkpụrụ ndụ ọbara na-enweghị ezi ọdịdị (sickle shape) mechiri obere akwara ọbara, na-egbochi ikuku oxygen iru n'akụkụ ahụ.",
      actionableAdvice: [
        "1. Ṅụọ Mmiri Ọkụ Ozugbo: Ṅụọ mmiri dị nwayọọ n'ọkụ ma ọ bụ mmiri nwere nnu ahụike (electrolyte) lita 1 ngwa ngwa.",
        "2. Kpuchie Ebe Na-egbu Mgbu na Ihe Ọkụ: Jiri akwa ọkụ ma ọ bụ blanket kpuchie ahụ gị. EJILA mmiri oyi ma ọ bụ ice mee ihe, n'ihi na oyi na-akpata mmechi ọbara karịa.",
        "3. Ṅụọ Ọgwụ Mgbu Dọkịta Gị Nyere: Soro usoro ọgwụ dọkịta nyere gị.",
        "4. Zuo Ike nke Ọma: Nọdụ n'udo, na-eku ume miri emi iji nye ọbara ikuku zuru oke."
      ],
      redFlags: [
        "🚨 Oké Ọkụ Ahụ (>38.5°C) - ihe mgbaàmà nje dị ize ndụ",
        "🚨 Mgbu n'obi na iku ume ike (Acute Chest Syndrome)",
        "🚨 Oké mgbu n'afọ ma ọ bụ anya ntụgharị na akpụkpọ ahụ icha ọcha",
        "🚨 Aka ma ọ bụ ụkwụ nwụrụ anwụ na nsogbu ikwu okwu (Ihe mgbaàmà Ọrịa Stroke)",
        "🚨 Ọtụmọkpọ nwa amadị na-egbu mgbu karịa awa abụọ (Priapism)"
      ],
      suggestedTools: ["Bọtịnụ Enyemaka Mberede (SOS)", "Ihe Nlele Mgbu", "Ihe Nleba Mmiri Ọṅụṅụ"]
    }
  },
  {
    keywords: ['water', 'hydration', 'fluid', 'drink', 'thirsty', 'dehydration', 'liters', 'omi', 'ruwa', 'mmiri', 'hydration tracker'],
    category: 'hydration',
    dangerLevel: 'info',
    en: {
      title: "Hydration Science for Sickle Cell Warriors",
      summary: "High fluid intake is the #1 preventive barrier against vaso-occlusive pain crises. Drinking 3.0 to 4.0 Liters daily dilutes blood, prevents sickling, and flushes damaged red cell fragments from kidneys.",
      actionableAdvice: [
        "Drink at least 3.0 to 3.5 Liters of fluids daily (10-14 cups).",
        "Start your morning with 500ml of warm water before any food or tea.",
        "Carry a reusable, insulated water bottle at all times in tropical or humid climates.",
        "Drink extra water during exercise, hot weather, fever, or times of stress.",
        "Include hydrating warm teas like unsweetened hibiscus (Zobo), lemongrass, or warm clear bone broth."
      ],
      localFoods: [
        "Fresh Coconut Water (natural potassium & electrolytes)",
        "Unsweetened Zobo Drink (warm or room temperature)",
        "Watermelon & Cucumber slices",
        "Pap (Ogi/Akamu) with warm water",
        "Clear Pepper Soup with herbs (warming & hydrating)"
      ],
      suggestedTools: ["Daily Water Intake Tracker (3.0L Target)", "Hydration Reminders Timer"]
    },
    yo: {
      title: "Àbájáde Omi Mumu fún Àwọn Jagunjagun Sickle Cell",
      summary: "Mumu omi púpọ̀ ni ààbò àkọ́kọ́ tí ó ń dènà ìrora gbígbóná. Mumu lita 3 sí 4 lójoojúmọ́ ń jẹ́ kí ẹ̀jẹ̀ rọ̀ dáadáa kí ó sì lè sàn nínú iṣan láìdúró.",
      actionableAdvice: [
        "Mu o kere ju lita 3.0 sí 3.5 ti omi lojoojumọ (ago 10 sí 14).",
        "Bẹrẹ owurọ kọọkan pẹlu ago omi gbígbóná méjì kí o tó jẹun.",
        "Máa gbe kọọpu omi dáni nibi gbogbo ti o ba ń lọ.",
        "Mu omi sii nigba ti ooru bá pọ̀ tabi nigbati o ba ń ṣe ere idaraya pẹlẹbẹ.",
        "Gba omi Zobo ti ko ni suga tabi omi agbọn tutu/gbígbóná pẹlu."
      ],
      localFoods: [
        "Omi Àgbọn tútù (Coconut water)",
        "Zobo gbígbóná tí kò ní ṣúgà (Hibiscus tea)",
        "Ẹ̀fọ́ Tẹ̀tẹ̀ àti Ẹ̀fọ́ Ṣọkọ pẹ̀lú omi ọbẹ̀",
        "Ògì gbígbóná (Pap/Akamu)",
        "Ọbẹ̀ Ata tutu pẹ̀lú ewébẹ̀ tútù"
      ],
      suggestedTools: ["Olùṣírò Omi Mumu (3.0L)", "Ìránnilétí Omi"]
    },
    ha: {
      title: "Muhimmancin Shan Ruwa ga Masu Ciwon Kanjamau na Sickle Cell",
      summary: "Shan ruwa mai yawa shine babban kariya daga shanyewar jini da zafin ciwo. Shan lita 3 zuwa 4 kowace rana na taimaka wa jini gudu cikin sauki a jijiyoyi.",
      actionableAdvice: [
        "Sha a kalla lita 3 zuwa 3.5 na ruwa a kowace rana.",
        "Fara kowace safiya da shan kofin ruwan dumi biyu kafin cin abinci.",
        "Koyaushe rike kwalbar ruwa a kusa da kai a duk inda zaka je.",
        "Kara yawan ruwan da kake sha a lokacin zafi, aiki, ko lokacin zazzabi.",
        "Yi amfani da ruwan Zobo maras siga ko romon kaza mai dumi."
      ],
      localFoods: [
        "Ruwan Kwakwa mai dadi",
        "Shayin Zobo maras siga",
        "Kunu mai dumi",
        "Kankana da kankana mai sanyi kadan",
        "Romon nama ko kaji mai dumi"
      ],
      suggestedTools: ["Kula da Shan Ruwa (Lita 3.0)", "Tsayar da Lokacin Shan Ruwa"]
    },
    ig: {
      title: "Mkpa Mmiri Dị n'Ahụ Maka Ndị Na-alụ Ọgụ Ọrịa Sickle Cell",
      summary: "Ịṅụ mmiri zuru oke bụ nchebe kachasị elu megide mgbu siri ike. Ịṅụ lita 3 ruo 4 kwa ụbọchị na-eme ka ọbara na-aga nke ọma n'akwara n'enweghị nkwụsị.",
      actionableAdvice: [
        "Ṅụọ opekata mpe lita 3.0 ruo 3.5 nke mmiri kwa ụbọchị.",
        "Bido ụtụtụ ọ bụla site n'ịṅụ iko mmiri ọkụ abụọ tupu i rie ihe.",
        "Jide karama mmiri gị n'aka ebe ọ bụla ị na-aga.",
        "Ṅụkwuo mmiri n'oge anwụ na-acha ma ọ bụ mgbe ị na-eche nchegbu.",
        "Ṅụọ mmiri Zobo na-enweghị shuga ma ọ bụ ofe ọkụ na-enye ahụike."
      ],
      localFoods: [
        "Mmiri Aki-Oyibo (Coconut water)",
        "Zobo dị ṅụrụ ṅụrụ na-enweghị shuga",
        "Akamụ ọkụ (Pap)",
        "Ofe Nsala ma ọ bụ Ofe Ọkụ nke akwụkwọ nri",
        "Ugu na Mkpụrụ osisi mmiri mmiri"
      ],
      suggestedTools: ["Ihe Nleba Mmiri Kwa Ụbọchị", "Ncheta Oge Ọṅụṅụ Mmiri"]
    }
  },
  {
    keywords: ['nutrition', 'food', 'diet', 'vegetables', 'iron', 'ugwu', 'folic acid', 'eat', 'meals', 'onje', 'abinci', 'nri', 'blood booster', 'anemia'],
    category: 'nutrition',
    dangerLevel: 'info',
    en: {
      title: "Nutrition & Red Blood Cell Fortification",
      summary: "Sickle cell red blood cells have a shortened lifespan of only 10-20 days (compared to 120 days for normal red cells). A nutrient-dense diet rich in folate, zinc, vitamin D, magnesium, and proteins supports continuous marrow production.",
      actionableAdvice: [
        "Take 5mg Folic Acid daily to support the rapid synthesis of replacement red blood cells.",
        "Eat dark green leafy vegetables daily (Ugwu, Bitter leaf, Spinach, Waterleaf) rich in micronutrients.",
        "Caution with Iron Supplements: Never take high-dose iron unless proven iron deficient by a ferritin test, as repeated transfusions or hemolysis can lead to dangerous iron overload.",
        "Incorporate healthy fats: Avocado, cold-pressed olive oil, and groundnuts support cellular membrane elasticity.",
        "Avoid alcohol and tobacco completely, as both trigger profound vasoconstriction and cellular dehydration."
      ],
      localFoods: [
        "Ugwu (Fluted Pumpkin leaves) soup with fish",
        "Moi Moi & Akara (high plant protein)",
        "Tiger Nut milk (Kunun Aya) - rich in zinc, magnesium, and vitamin E",
        "Moringa leaf tea or soup (packed with antioxidants)",
        "Millet & Sorghum porridge (Ogi Baba / Kunu Zaki)"
      ],
      suggestedTools: ["Medication Log (Folic Acid / Hydroxyurea)", "Daily Health Tip Wisdom"]
    },
    yo: {
      title: "Oúnjẹ Aṣaralóore àti Fífi Agbára kún Ẹ̀jẹ̀",
      summary: "Sẹ́ẹ̀lì ẹ̀jẹ̀ Sickle Cell máa ń kú ní ọjọ́ 10 sí 20 péré (nígbà tí ẹ̀jẹ̀ déédéé máa ń wà fún ọjọ́ 120). Oúnjẹ tó ní Folic Acid, Zinc, àti Protein ló lè ran ọ̀rá egungun lọ́wọ́ láti tètè pèsè ẹ̀jẹ̀ tuntun.",
      actionableAdvice: [
        "Máa lo oògùn Folic Acid 5mg lójoojúmọ́ láti kọ́ ẹ̀jẹ̀ tuntun.",
        "Jẹ ewébẹ̀ tútù bíi Ewuro, Ugwu, Tẹ̀tẹ̀, Gbọ̀rọ̀, àti Ṣọkọ.",
        "Ṣọ́ra fún Oògùn Iron: Má ṣe lo oògùn Iron láìjẹ́ pé dọ́kítà yẹ ẹ̀jẹ̀ rẹ wò, nítorí àjùlọ Iron lè ba ẹ̀dọ̀ jẹ́.",
        "Jẹ èso bíi Èso Pàpà (Avocado), Ẹ̀pà, àti Ọ̀gẹ̀dẹ̀.",
        "Yẹra pátápátá fún Ọtí líle àti Sìgá."
      ],
      localFoods: [
        "Ọbẹ̀ Ẹ̀fọ́ Ugwu àti Ẹja tútù",
        "Mọ́í-mọ́í tàbí Àkàrà (Protein gíga)",
        "Omi Ọ̀mu (Tiger nut / Ẹ̀bà Aya)",
        "Ewé Mọríńgà nínú ọbẹ̀",
        "Ògì Ọkà Bàbà (Sorghum pap)"
      ],
      suggestedTools: ["Àkọsílẹ̀ Oògùn", "Ìmọ̀ràn Ìlera Lójoojúmọ́"]
    },
    ha: {
      title: "Ingantaccen Abinci don Kara Lafiyar Jini",
      summary: "Kwayoyin jinin sickle cell na mutuwa a cikin kwanaki 10 zuwa 20 kacal. Cin abinci mai gina jiki mai dauke da Folic Acid, Zinc, da sunadarai na taimakawa kashi wajen samar da sabon jini.",
      actionableAdvice: [
        "Sha maganin Folic Acid 5mg a kowace rana don kera sabon jini.",
        "Ci ganyayyaki masu yawa kamar Zogale (Moringa), Alayyahu, da ganyen Ugwu.",
        "Kada ka sha kwayoyin karin Iron ba tare da binciken likita ba, domin yawan Iron na iya lalata hanta.",
        "Ci 'ya'yan itatuwa da gyada don samun sinadaran kariya.",
        "Guji shan giya da taba sigari gaba daya."
      ],
      localFoods: [
        "Miyar Zogale da kifi",
        "Kunun Aya (Tiger nut milk) mai zinc da magnesium",
        "Kosai da Moin-moin",
        "Kunun Dawa ko Gero mai dumi",
        "Ganyen Alayyahu da wake"
      ],
      suggestedTools: ["Kula da Shan Magani", "Shawarwarin Lafiya"]
    },
    ig: {
      title: "Nri Na-edozi Ahụ Maka Ịkwado Ọbara Ọhụrụ",
      summary: "Mkpụrụ ndụ ọbara sickle cell na-ebi naanị ụbọchị 10 ruo 20. Nri nwere Folic Acid, protein, na akwụkwọ nri na-enyere ahụ aka ịmepụta ọbara ọhụrụ ngwa ngwa.",
      actionableAdvice: [
        "Ṅụọ Folic Acid 5mg kwa ụbọchị maka imepụta ọbara ọhụrụ.",
        "Rie akwụkwọ nri ndụ dịka Ugu, Olubu (Bitter leaf), Ofe Akwụkwọ kwa ụbọchị.",
        "Kpachara Anya na Ọgwụ Iron: Ejila ọgwụ iron mee ihe ọ gwụla ma dọkịta nyere gị iwu.",
        "Rie nri nwere protein dị elu dịka Mọị-mọị, Akara, na Azụ.",
        "Zenarị mmanya na-egbu egbu na anwụrụ ọkụ kpamkpam."
      ],
      localFoods: [
        "Ofe Ugu na Azụ ọhụrụ",
        "Mọị-mọị na Akara",
        "Mmiri Aki-Awusa (Tiger nut milk)",
        "Akwụkwọ Moringa n'ofe",
        "Akamụ ọkụ ji ọka ojii mere"
      ],
      suggestedTools: ["Ihe Ncheta Ọgwụ", "Ndụmọdụ Ahụike Ụbọchị Ọ bụla"]
    }
  },
  {
    keywords: ['hydroxyurea', 'medication', 'folic acid', 'drugs', 'painkillers', 'paracetamol', 'tramadol', 'ibuprofen', 'oogun', 'magani', 'ogwu', 'dose'],
    category: 'medication',
    dangerLevel: 'info',
    en: {
      title: "Medication Adherence & Hydroxyurea Safety",
      summary: "Hydroxyurea is the gold-standard disease-modifying therapy for SCD. It increases Fetal Hemoglobin (HbF), prevents red cells from sickling, reduces pain crises by up to 50%, and lowers hospital admissions.",
      actionableAdvice: [
        "Take Hydroxyurea consistently at the exact same time every day as prescribed by your hematologist.",
        "Never skip or abruptly stop Hydroxyurea without consulting your specialist.",
        "Routine Blood Counts: Undergo Full Blood Count (FBC) and reticulocyte monitoring every 4-12 weeks.",
        "Hydration Pair: Always drink a full glass of water when swallowing your daily medications.",
        "Store medicines in a cool, dry place away from direct sunlight and out of reach of children."
      ],
      redFlags: [
        "🚨 Severe nausea, mouth sores, or unexplained bruises (report to hematologist)",
        "🚨 Suspected pregnancy while on Hydroxyurea (requires immediate doctor consultation)"
      ],
      suggestedTools: ["Medication Reminder & Adherence Log", "Doctor Consultation Report Generator"]
    },
    yo: {
      title: "Lílo Oògùn Dáadáa àti Àbájáde Hydroxyurea",
      summary: "Hydroxyurea jẹ́ oògùn pàtàkì tó ń dáàbò bo ara lẹ́nu àrùn ẹ̀jẹ̀ dídì. Ó ń sọ ẹ̀jẹ̀ di Fetal Hemoglobin (HbF) kí ẹ̀jẹ̀ má baà dì, ó sì ń dín ìrora kù ní ìdajì.",
      actionableAdvice: [
        "Lo oògùn Hydroxyurea rẹ ní àkókò kan náà lójoojúmọ́ gẹ́gẹ́ bí dọ́kítà ṣe kọ ọ́.",
        "Má ṣe dáwọ́ lílo oògùn rẹ dúró láìgbọ́ láti ọ̀dọ̀ dọ́kítà rẹ.",
        "Ṣe àyẹ̀wò ẹ̀jẹ̀ déédéé (Full Blood Count) ní gbogbo oṣù kan sí mẹ́ta.",
        "Máa mu omi kíkún pẹ̀lú oògùn rẹ nígbà gbogbo.",
        "Tọ́jú oògùn sí ibi tí ó tútù, tí oòrùn kò ti lè bà á jẹ́."
      ],
      redFlags: [
        "🚨 Èébì líle, ọgbẹ́ ẹnu, tàbí àpá ẹ̀jẹ̀ lára tí a kò mọ orísun rẹ̀",
        "🚨 Bí oyún bá wọlé nígbà tí a ń lo Hydroxyurea (rì dọ́kítà lẹ́sẹ̀kẹsẹ̀)"
      ],
      suggestedTools: ["Ìránnilétí Oògùn", "Àkọsílẹ̀ Àyẹ̀wò Dọ́kítà"]
    },
    ha: {
      title: "Shan Magunguna da Kula da Hydroxyurea",
      summary: "Hydroxyurea shine babban magani mai inganta lafiyar masu sickle cell. Yana kara Fetal Hemoglobin (HbF) don hana jini toshewa da rage yawan ciwo da kashi 50%.",
      actionableAdvice: [
        "Sha maganin Hydroxyurea a lokaci guda a kowace rana kamar yadda likita ya tsara.",
        "Kada ka daina shan magani ba tare da shawartar likita ba.",
        "Yi gwajin jini (FBC) a kowane wata 1 zuwa 3 don duba lafiyar jini.",
        "Sha babban kofin ruwa a duk lokacin da zaka sha magani.",
        "Ajiye magunguna a wuri mai sanyi da bushewa nesa da yara."
      ],
      redFlags: [
        "🚨 Amai mai tsanani, gyabon baki, ko kurajen jini ba gaira ba dalili",
        "🚨 Zargin juna biyu yayin shan Hydroxyurea (nemi likita nan take)"
      ],
      suggestedTools: ["Tsayar da Lokacin Magani", "Rahoton Likita"]
    },
    ig: {
      title: "Iṅụ Ọgwụ nke Ọma na Nchedo Hydroxyurea",
      summary: "Hydroxyurea bụ ọgwụ kachasị mkpa na-enyere ndị nwere sickle cell aka. Ọ na-eme ka ọbara nwee HbF nke na-egbochi ọbara ịrapara n'akwara, na-ebelata mgbu ruo 50%.",
      actionableAdvice: [
        "Ṅụọ Hydroxyurea n'otu oge ahụ kwa ụbọchị dịka dọkịta siri gwa gị.",
        "Akwụsịla ịṅụ ọgwụ n'onwe gị na-ajụghị dọkịta gị.",
        "Na-eme nyocha ọbara (Full Blood Count) kwa ọnwa 1 ruo 3.",
        "Ṅụọ otu iko mmiri zuru ezu mgbe ọ bụla ị na-aṅụ ọgwụ gị.",
        "Dobe ọgwụ gị n'ebe dị mma, nke kpọrọ nkụ ma zere anwụ."
      ],
      redFlags: [
        "🚨 Ọgbụgbọ siri ike, ọnya n'ọnụ, ma ọ bụ ọnya ọbara n'ahụ",
        "🚨 Ịtụrụ ime mgbe a na-aṅụ Hydroxyurea (kpọtụrụ dọkịta ozugbo)"
      ],
      suggestedTools: ["Ihe Ncheta Ọgwụ", "Akwụkwọ Akụkọ Nyocha Dọkịta"]
    }
  },
  {
    keywords: ['genotype', 'aa', 'as', 'ss', 'sc', 'marriage', 'carrier', 'trait', 'genetic counseling', 'premarital', 'gene', 'iran', 'jinsi', 'mkpuru ndu'],
    category: 'genotype',
    dangerLevel: 'info',
    en: {
      title: "Genotypes & Genetic Inheritance Science",
      summary: "Sickle Cell Disease is an autosomal recessive genetic condition. Knowing your accurate hemoglobin genotype via High-Performance Liquid Chromatography (HPLC) is essential for health planning and partner compatibility.",
      actionableAdvice: [
        "Genotype Combinations:\n- AA + AA = 100% AA (Zero SCD risk)\n- AA + AS = 50% AA, 50% AS (Healthy carriers, no disease)\n- AS + AS = 25% AA, 50% AS, 25% SS (1 in 4 chance of SCD in EVERY pregnancy)\n- AS + SS = 50% AS, 50% SS (1 in 2 chance of SCD)\n- SS + SS = 100% SS",
        "Always confirm your genotype in an accredited medical laboratory using HPLC or Hemoglobin Electrophoresis.",
        "Debunk Cultural Myths: SCD is NOT a spiritual curse, 'Ogbanje', or 'Abiku'. It is purely an inherited genetic trait governed by Mendelian genetics."
      ],
      suggestedTools: ["Premarital Genotype Education & Punnett Square Simulator", "SCD Academy"]
    },
    yo: {
      title: "Ìmọ̀ Ẹ̀jẹ̀ Ìran (Genotype) àti Àyẹ̀wò Ìgbéyàwó",
      summary: "Àrùn ẹ̀jẹ̀ dídì (Sickle Cell) jẹ́ àbùdá tí a jogún láti ọ̀dọ̀ àwọn òbí méjèèjì. Mímọ Genotype rẹ nipasẹ àyẹ̀wò HPLC jẹ́ kókó fún ìpinnu ìgbéyàwó àti ìlera.",
      actionableAdvice: [
        "Àpapọ̀ Genotype:\n- AA + AA = 100% AA (Kò sí ewu rárá)\n- AA + AS = 50% AA, 50% AS (Ọmọ alágbára, kò sí àrùn)\n- AS + AS = 25% AA, 50% AS, 25% SS (Ìpín kan nínú mẹ́rin fún SS ní gbogbo oyún)\n- AS + SS = 50% AS, 50% SS\n- SS + SS = 100% SS",
        "Ṣe àyẹ̀wò Genotype rẹ ní ilé-ìwòsàn tí a fọwọ́ sí pẹ̀lú ẹ̀rọ HPLC.",
        "Mú Àwọn Àṣìṣe Ìgbàgbọ́ Kúrò: Sickle Cell KÌ Í ṢE àbíkú tàbí ẹ̀ṣẹ̀ àwọn baba ńlá. Ó jẹ́ àbùdá ẹ̀jẹ̀ lásán tí a lè ṣàkóso rẹ̀ pẹ̀lú ìmọ̀ sáyẹ́ǹsì."
      ],
      suggestedTools: ["Ẹ̀kọ́ Genotype Ṣáájú Ìgbéyàwó", "Ilé-Ẹ̀kọ́ SCD Academy"]
    },
    ha: {
      title: "Ilimin Kwayoyin Halitta (Genotype) da Shirin Aure",
      summary: "Ciwon sickle cell cuta ce da ake gada daga iyaye biyu. Sanin ainihin nau'in jininka (Genotype) ta hanyar gwajin asibiti yana da matukar muhimmanci kafin aure.",
      actionableAdvice: [
        "Hadin Genotype:\n- AA + AA = 100% AA (Babu hadari ko kadan)\n- AA + AS = 50% AA, 50% AS (Masu kwayar halitta lafiya lau)\n- AS + AS = 25% AA, 50% AS, 25% SS (Akwai damar samun SS a kowane ciki)\n- AS + SS = 50% AS, 50% SS\n- SS + SS = 100% SS",
        "Koyaushe a tabbatar da yin gwajin genotype a asibiti mai inganci.",
        "Karyata Tatsuniyoyi: Sickle cell BA la'ana bace ko asiri. Cuta ce ta gado ta kwayoyin halitta wacce ilimin likitanci ke bayyanawa."
      ],
      suggestedTools: ["Ilimin Genotype Kafin Aure", "Kwalejin SCD Academy"]
    },
    ig: {
      title: "Ihe Ọmụma Banyere Genotype na Atụmatụ Alụmdi na Nwunye",
      summary: "Ọrịa sickle cell bụ ọrịa a na-eketa site n'aka nne na nna abụọ. Ịmara ezigbo genotype gị site na nyocha ahụike dị ezigbo mkpa tupu alụmdi na nwunye.",
      actionableAdvice: [
        "Nchikota Genotype:\n- AA + AA = 100% AA (Enweghị nsogbu ọ bụla)\n- AA + AS = 50% AA, 50% AS (Ahụike zuru oke)\n- AS + AS = 25% AA, 50% AS, 25% SS (Ohere ịmụ nwa nwere SS n'afọ ọ bụla)\n- AS + SS = 50% AS, 50% SS\n- SS + SS = 100% SS",
        "Mee nyocha genotype n'ụlọ ọgwụ a ma ama nke nwere ezi ngwa ọrụ.",
        "Kwụsị Nkwenkwe Ụgha: Sickle cell abụghị 'Ọgbanje' ma ọ bụ ọbụbụ ọnụ. Ọ bụ naanị ọdịdị ọbara e ketara site na mkpụrụ ndụ ndụ."
      ],
      suggestedTools: ["Nkụzi Genotype Maka Alụmdi na Nwunye", "Ụlọ Akwụkwọ SCD Academy"]
    }
  }
];

// Offline Natural Language Query Intent Matcher
export function processOfflineQuery(
  rawQuery: string,
  userLanguage: SupportedLanguage = 'en',
  userContext?: { genotype?: string; age?: number; recentPain?: number; waterIntake?: number }
): {
  response: string;
  detectedLang: SupportedLanguage;
  topicTitle: string;
  dangerLevel: 'emergency' | 'warning' | 'info';
  suggestedTools: string[];
  actionableSteps: string[];
  localFoods?: string[];
  isRedFlagAlert: boolean;
} {
  const query = rawQuery.toLowerCase().trim();

  // Automatic Language Detection based on distinctive lexical tokens
  let detectedLang = userLanguage;
  const yorubaTokens = ['bawo', 'eko', 'lori', 'se', 'omi', 'arun', 'rora', 'eje', 'didi', 'oogun', 'dokita', 'agbako', 'onje', 'abiku', 'iran', 'jowo'];
  const hausaTokens = ['sannu', 'yaya', 'jini', 'ruwa', 'ciwo', 'magani', 'likita', 'abinci', 'zazzabi', 'kanjamau', 'don', 'ina', 'sosai'];
  const igboTokens = ['kedu', 'otu', 'obara', 'mmiri', 'mgbu', 'ogwu', 'dokita', 'nri', 'ahu', 'onodu', 'biko', 'orịa', 'ogbanje', 'maka'];

  const containsToken = (tokens: string[]) => tokens.some(t => query.includes(t));

  if (containsToken(yorubaTokens)) {
    detectedLang = 'yo';
  } else if (containsToken(hausaTokens)) {
    detectedLang = 'ha';
  } else if (containsToken(igboTokens)) {
    detectedLang = 'ig';
  }

  // Find best matching topic
  let bestTopic = OFFLINE_SCD_TOPICS[0];
  let maxScore = -1;

  for (const topic of OFFLINE_SCD_TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      if (query.includes(kw.toLowerCase())) {
        score += 3;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestTopic = topic;
    }
  }

  // If no specific match, provide comprehensive general SCD guidance
  const localizedContent = bestTopic[detectedLang] || bestTopic.en;

  // Build Personalized, High-Quality Response
  let responseText = "";
  const greetings: Record<SupportedLanguage, string> = {
    en: "Warrior AI (Offline Companion):",
    yo: "Jagunjagun AI (Olùrànlọ́wọ́ Ìtọ́jú Lójoojúmọ́):",
    ha: "Jarumi AI (Mataimakin Kanjamau ba tare da Yanar Gizo ba):",
    ig: "Onye Nkwado Ọgụ Ọrịa (Warrior AI):"
  };

  const safetyDisclaimer: Record<SupportedLanguage, string> = {
    en: "\n\n⚠️ *Clinical Safety Note: This offline tool provides clinical education and emergency self-care guidance. It does not replace immediate in-person hospital evaluation during severe crises.*",
    yo: "\n\n⚠️ *Àkíyèsí Ààbò Ìlera: Èyí jẹ́ fún ìmọ̀ àti ìtọ́sọ́nà pàjáwìrì. Kò rọ́pò dọ́kítà ní ilé-ìwòsàn nígbà tí ìṣòro bá le púpọ̀.*",
    ha: "\n\n⚠️ *Gargadin Lafiya: Wannan bayani ne don ilimantarwa da agajin gaggawa. Ba zai maye gurbin ganin likita a asibiti ba yayin babban ciwo.*",
    ig: "\n\n⚠️ *Ihe Ịdọ Aka ná Ntị Ahụike: Nke a bụ maka nkụzi na enyemaka mberede. Ọ naghị anọchi anya ịhụ dọkịta n'ụlọ ọgwụ mgbe nsogbu siri ike.*"
  };

  // Build structured response
  responseText += `${greetings[detectedLang]} ${localizedContent.summary}\n\n`;

  if (localizedContent.actionableAdvice && localizedContent.actionableAdvice.length > 0) {
    responseText += `📌 **${detectedLang === 'yo' ? 'Àwọn Ìgbésẹ̀ Pàtàkì' : detectedLang === 'ha' ? 'Matakan Dauka' : detectedLang === 'ig' ? 'Ihe I Kwesịrị Ime' : 'Key Actionable Steps'}:**\n`;
    localizedContent.actionableAdvice.forEach(adv => {
      responseText += `• ${adv}\n`;
    });
  }

  if (userContext?.genotype) {
    const genotypeMsg: Record<SupportedLanguage, string> = {
      en: `\n🧬 *Personalized for Genotype ${userContext.genotype}: Consistent fluid hydration and daily folic acid are vital to maintain healthy red blood cell volume.*`,
      yo: `\n🧬 *Fún Genotype ${userContext.genotype} rẹ: Mumu omi púpọ̀ àti lílo Folic Acid lójoojúmọ́ ṣe kókó fún ẹ̀jẹ̀ rẹ.*`,
      ha: `\n🧬 *Don Nau'in Jininka ${userContext.genotype}: Shan ruwa akai-akai da Folic Acid na da muhimmanci sosai.*`,
      ig: `\n🧬 *Maka Genotype ${userContext.genotype} gị: Ịṅụ mmiri mgbe niile na Folic acid dị ezigbo mkpa maka ọbara gị.*`
    };
    responseText += genotypeMsg[detectedLang];
  }

  if (localizedContent.redFlags && localizedContent.redFlags.length > 0) {
    responseText += `\n\n🚨 **${detectedLang === 'yo' ? 'Àwọn Àmì Pàjáwìrì Tí Ó Nílò Ilé-Ìwòsàn Lẹ́sẹ̀kẹsẹ̀' : detectedLang === 'ha' ? 'Alamomin Hatsari na Gaggawa' : detectedLang === 'ig' ? 'Ihe Mgbaàmà Ndị Chọrọ Ụlọ Ọgwụ Ozugbo' : 'Emergency Red Flags (Seek Immediate Hospital Care)'}:**\n`;
    localizedContent.redFlags.forEach(rf => {
      responseText += `${rf}\n`;
    });
  }

  if (localizedContent.localFoods && localizedContent.localFoods.length > 0) {
    responseText += `\n🍲 **${detectedLang === 'yo' ? 'Oúnjẹ Àbínibí Tó Dáa Fún Ẹ̀jẹ̀' : detectedLang === 'ha' ? 'Abincin Gargajiya Mai Amfani' : detectedLang === 'ig' ? 'Nri Ọdịnala Na-enye Ọbara Ike' : 'Recommended Local Hydration & Blood Foods'}:**\n`;
    localizedContent.localFoods.forEach(food => {
      responseText += `• ${food}\n`;
    });
  }

  responseText += safetyDisclaimer[detectedLang];

  return {
    response: responseText,
    detectedLang,
    topicTitle: localizedContent.title,
    dangerLevel: bestTopic.dangerLevel,
    suggestedTools: localizedContent.suggestedTools || ["Emergency SOS Button", "Water Intake Tracker", "Medication Reminder"],
    actionableSteps: localizedContent.actionableAdvice,
    localFoods: localizedContent.localFoods,
    isRedFlagAlert: bestTopic.dangerLevel === 'emergency' || query.includes('fever') || query.includes('chest')
  };
}

// Full Offline UI Translations for Multi-Page Adaptation
export const APP_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    appName: "Warrior Cell",
    home: "Home",
    play: "Play",
    chat: "Chat",
    care: "Care",
    group: "Group",
    act: "Act",
    profile: "Profile",
    offlineModeActive: "Offline Mode Active (100% Local)",
    emergencySos: "EMERGENCY SOS",
    waterTarget: "Daily Hydration Target",
    painLog: "Pain & Crisis Log",
    medReminders: "Medication Reminders",
    healthWisdom: "Health Wisdom & Tips",
    doctorReport: "Doctor Consultation Report",
    peerSupport: "Peer Support Option",
    askWarriorAi: "Ask Warrior AI (Offline Ready)",
    selectLang: "Language",
    crisisWarning: "In Crisis? Tap Emergency SOS for instant rapid response.",
    streakDays: "Day Streak",
    speakPrompt: "Tap to Speak (Offline Voice)"
  },
  yo: {
    appName: "Jagunjagun Ẹ̀jẹ̀",
    home: "Ilé",
    play: "Eré",
    chat: "Ọ̀rọ̀",
    care: "Ìtọ́jú",
    group: "Ẹgbẹ́",
    act: "Ìgbésẹ̀",
    profile: "Àkọsílẹ̀ Mi",
    offlineModeActive: "Ìpo Àìsí Íńtánẹ́ẹ̀tì Ti Wà Lójú (100% Ìtọ́jú Àbínibí)",
    emergencySos: "PÀJÁWÌRÌ SOS",
    waterTarget: "Omi Mumu Lójoojúmọ́",
    painLog: "Àkọsílẹ̀ Ìrora àti Ìṣòro",
    medReminders: "Ìránnilétí Oògùn",
    healthWisdom: "Ìmọ̀ràn Ìlera àti Ọgbọ́n",
    doctorReport: "Àkọsílẹ̀ fún Dọ́kítà",
    peerSupport: "Àjọṣe Àwọn Ọ̀rẹ́ (Peer Support)",
    askWarriorAi: "Béèrè lọ́wọ́ Warrior AI (Láìsí Íńtánẹ́ẹ̀tì)",
    selectLang: "Èdè",
    crisisWarning: "Ṣé ìrora ń bẹ? Tẹ Pàjáwìrì SOS fún ìrànwọ́ lẹ́sẹ̀kẹsẹ̀.",
    streakDays: "Ọjọ́ Ìtẹ̀lé",
    speakPrompt: "Tẹ́ẹ láti sọ̀rọ̀"
  },
  ha: {
    appName: "Kwayar Halittar Jarumi",
    home: "Gida",
    play: "Wasa",
    chat: "Hira",
    care: "Kula",
    group: "Rukuni",
    act: "Aiki",
    profile: "Bayanina",
    offlineModeActive: "Yanayin Ba Yanar Gizo na Aiki (100% Cikin Na'ura)",
    emergencySos: "AGAJIN GAGGAWA (SOS)",
    waterTarget: "Manufar Shan Ruwa ta Rana",
    painLog: "Rijistar Zafin Ciwo",
    medReminders: "Tsayar da Lokacin Magani",
    healthWisdom: "Hikimar Lafiya da Shawarwari",
    doctorReport: "Rahoton Ganin Likita",
    peerSupport: "Taimakon Abokan Zama",
    askWarriorAi: "Tambayi Jarumi AI (Ba Tare da Yanar Gizo ba)",
    selectLang: "Harshe",
    crisisWarning: "Kuna cikin ciwo? Latsa Agajin Gaggawa don taimako nan take.",
    streakDays: "Kwanakin Ci Gaba",
    speakPrompt: "Danna don Magana"
  },
  ig: {
    appName: "Mkpụrụ Ndụ Onye Dike",
    home: "Ụlọ",
    play: "Gwuo",
    chat: "Kparịta",
    care: "Nlekọta",
    group: "Otu",
    act: "Mee Ihe",
    profile: "Profaịlụ",
    offlineModeActive: "Ụdị Enweghị Ịntanetị Na-arụ Ọrụ (100% N'ime Ebe A)",
    emergencySos: "ENYEMAKA MBEREDE (SOS)",
    waterTarget: "Ekwentị Mmiri Kwa Ụbọchị",
    painLog: "Akwụkwọ Ndekọ Mgbu",
    medReminders: "Ihe Ncheta Ọgwụ",
    healthWisdom: "Amamihe Ahụike na Ndụmọdụ",
    doctorReport: "Akwụkwọ Akụkọ Dọkịta",
    peerSupport: "Nkwado Ndị Enyi",
    askWarriorAi: "Jụọ Warrior AI (Nwere Ike Ịrụ Ọrụ Na-enweghị Ịntanetị)",
    selectLang: "Asụsụ",
    crisisWarning: "Ọ dị gị njọ? Pịa Enyemaka Mberede maka enyemaka ozugbo.",
    streakDays: "Ụbọchị Na-aga n'ihu",
    speakPrompt: "Pịa ka ị kwuo okwu"
  }
};
