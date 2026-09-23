import React, { useState } from 'react';
import { 
  BookOpen, Volume2, VolumeX, ArrowLeft, ArrowRight, Sparkles, 
  Heart, Sparkle, Speech, HelpCircle, CheckCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const getLocalizedStoriesData = (lang: string) => {
  switch (lang) {
    case 'pidgin':
      return {
        sectionTag: "🛡️ Warriors Around The World",
        sectionTitle: "Empathy & Warrior Stories",
        sectionDesc: "Hear real testimonies and listen to their vocal stories",
        storyLabel: "Story",
        takeawayLabel: "Empathetic Takeaway",
        biographyLabel: "Biographical Entry File",
        prevBtn: "Previous Warrior",
        nextBtn: "Next Warrior",
        audioTitle: "Voice-Acted Audio Speaker",
        audioDesc: "Listen to",
        btnSpeak: "Speak narrative",
        btnStop: "Stop Voice",
        stories: [
          {
            id: 1,
            name: "Aisha Yusuf",
            location: "Mombasa, Kenya 🇰🇪",
            age: 12,
            quote: "Water inside body dey keep my dreams alive under the sun.",
            narrative: "During dry seasons in Mombasa, the hot coastal breeze dey dry human skin fast. Aisha dey trace her water intake, drinking 3 liters of fresh water without fail. This dey prevent her flexible red blood cells from drying up, anchoring, or clamping. Water is Aisha's shield, helping her score goals inside her school soccer pitch!",
            takeaway: "High water intake dey make blood thin, preventing sticky blockages in vessels during heat.",
            colorClass: "from-blue-600 to-indigo-700",
            avatar: "🧑‍🌾"
          },
          {
            id: 2,
            name: "Sam Miller",
            location: "Chicago, USA 🇺🇸",
            age: 16,
            quote: "Folic fuel and daily medicine dey make me basketball champion.",
            narrative: "Sam dey take daily Hydroxyurea as doctors guide am. It dey stimulate his bone marrow to produce Fetal Hemoglobin (HbF). Sam fit play basketball well without pain!",
            takeaway: "Hydroxyurea dey trigger fetal hemoglobin to stop cell blocking.",
            colorClass: "from-red-500 to-amber-600",
            avatar: "🧑‍🚀"
          },
          {
            id: 3,
            name: "Fatoumata Traoré",
            location: "Bamako, Mali 🇲🇱",
            age: 10,
            quote: "My warm colorful sweata dey protect me from night cold.",
            narrative: "Night breeze dey bring freezing cold inside Bamako highlands. Cold temperatures dey tighten blood vessels and trap rigid sickle shapes immediately. Fatoumata dey wear fine wool blankets and layered clothing to protect her body and sleep fine without pains.",
            takeaway: "Keeping warm dey prevent cold-induced vessel squeezing and trap issues.",
            colorClass: "from-teal-600 to-emerald-700",
            avatar: "🧑‍🎨"
          },
          {
            id: 4,
            name: "Tarik Mansour",
            location: "Cairo, Egypt 🇪🇬",
            age: 14,
            quote: "Regular brain checks dey protect my head.",
            narrative: "Tarik dey go clinic every year for Doppler scan. Doctors dey check blood speeds inside his brain to match standard flow. This scan dey keep Tarik safe and proud.",
            takeaway: "Doppler checks dey identify narrow lanes before blockages cause strokes.",
            colorClass: "from-purple-600 to-pink-600",
            avatar: "🧑‍🔬"
          },
          {
            id: 5,
            name: "Kwame Mensah",
            location: "Accra, Ghana 🇬🇭",
            age: 11,
            quote: "Genes dey come from parents - disease no fit touch and transmit by hand!",
            narrative: "Kwame classmates learn how sickle cell dey transfer from family genes. They understand say Kwame condition is just biological code and is not contagious. They dey support am together to stay hydrated and strong.",
            takeaway: "Sickle Cell is strictly genetically inherited. Education dey destroy bad stigma.",
            colorClass: "from-amber-500 to-red-650",
            avatar: "🧑‍🎤"
          },
          {
            id: 6,
            name: "Sarah Jenkins",
            location: "London, UK 🇬🇧",
            age: 15,
            quote: "CRISPR molecule scissors don open my body healing.",
            narrative: "Sarah do gene therapy test trial. Doctors edit her stem cells to restart fetal hemoglobin. Today, Sarah is free from crisis.",
            takeaway: "CRISPR gene therapy edits DNA to keep cells flexible and circular.",
            colorClass: "from-indigo-650 to-indigo-950",
            avatar: "👩‍🚀"
          },
          {
            id: 7,
            name: "Priya Sharma",
            location: "Mumbai, India 🇮🇳",
            age: 13,
            quote: "Breathing exercises dey keep my lungs happy with air.",
            narrative: "Priya dey use spirometer apparatus twice daily for breathing drills. Keeping her lungs fully expanded avoids Acute Chest Syndrome crisis.",
            takeaway: "Spirometry keeps lungs fully inflated to block chest crises.",
            colorClass: "from-orange-550 to-pink-650",
            avatar: "👶"
          },
          {
            id: 8,
            name: "Isabella Silva",
            location: "Rio de Janeiro, Brazil 🇧🇷",
            age: 9,
            quote: "Warrior blood na special thing - e dey make me strong!",
            narrative: "Isabella family dey celebrate her as warrior hero. They educate clinics on early testing to raise awareness.",
            takeaway: "Family love and empathy dey build strong warrior energy.",
            colorClass: "from-rose-500 to-indigo-800",
            avatar: "👩‍🎨"
          }
        ]
      };
    case 'yoruba':
      return {
        sectionTag: "🛡️ Àwọn Akọni Agbaye",
        sectionTitle: "Ìyọ́nú & Ìtàn Àwọn Akọni",
        sectionDesc: "Gbọ́ àwọn ìríjú gidi kankan láti ọwọ́ àwọn ọlọ́rà",
        storyLabel: "Ìtàn",
        takeawayLabel: "Ìyọ́nú Atọ́ka",
        biographyLabel: "Fáìlì Ìtàn Ara",
        prevBtn: "Akọni Tókàn Sẹ́yìn",
        nextBtn: "Akọni Tókàn Nwájú",
        audioTitle: "Ẹ̀rọ Agbọ̀rọ̀ Ohùn Ara",
        audioDesc: "Gbọ́ ohùn kún fún",
        btnSpeak: "Sọ ìtàn yí",
        btnStop: "Dádúró ohùn",
        stories: [
          {
            id: 1,
            name: "Aisha Yusuf",
            location: "Mombasa, Kenya 🇰🇪",
            age: 12,
            quote: "Mímu omi dunjú ń mú àlá mi láàyè lábẹ́ oòrùn.",
            narrative: "Ní àkókò ọ̀gbẹ̀n ní Mombasa, atẹ́gùn gbóná eti òkun ń jẹ́ kí ara gbẹ kánkán. Aisha ń rí i pé òun mu omi tó pọ̀ tó iwọ̀n lítà mẹ́ta lójúmọ́ láìkùn. Èyí ń dènà mímú sẹ́ẹ̀lì rẹ̀ gbẹ tàbí dídí papọ̀ mọ́lẹ̀. Omi jẹ́ garkuwa fun Aisha láti gba ifẹ́ bọọlu lórí pápá rẹ̀!",
            takeaway: "Mímu omi tí ó pọ̀ ń jẹ́ kí ẹ̀jẹ̀ fẹ́rẹ́, tí ó sì ń dènà dídí mọ́ra sẹ́ẹ̀lì nínú oòrùn.",
            colorClass: "from-blue-600 to-indigo-700",
            avatar: "🧑‍🌾"
          },
          {
            id: 2,
            name: "Sam Miller",
            location: "Chicago, USA 🇺🇸",
            age: 16,
            quote: "Mímu egbògi ojoojúmọ́ ń sọ mí di aṣíwájú nínú bọ́ọlu agbọ̀.",
            narrative: "Sam ń gba egbògi Hydroxyurea lójoojúmọ́ láti tọ́ka sí sẹ́ẹ̀lì marrow rẹ̀ láti pèsè Fetal Hemoglobin (HbF). Eyi gba Sam láàyè láti gbá bọ́ọlu dunjú láìsí ìrora.",
            takeaway: "Hydroxyurea ń fún embryonic fetal hemoglobin ní agbára láti dènà dídí kòbògì.",
            colorClass: "from-red-500 to-amber-600",
            avatar: "🧑‍🚀"
          },
          {
            id: 3,
            name: "Fatoumata Traoré",
            location: "Bamako, Mali 🇲🇱",
            age: 10,
            quote: "Awọn sweaters onírúurú àwọ̀ mi ń dáàbò bò mí lọ́wọ́ òtútù òru.",
            narrative: "Òtútù gidi ń jà ní Bamako ní alẹ́. Òtútù ń mú kòbògì sẹ́ẹ̀lì há, tí ó sì ń dá sẹ́ẹ̀lì rẹ́ lẹ́nu kánkán. Fatoumata ń lo ibora onírun dídáradára láti gba oorun oorun dunjú.",
            takeaway: "Dídúró nínú ọ̀yàyà ń dènà dídí kòbògì nítorí òtútù.",
            colorClass: "from-teal-605 to-emerald-705",
            avatar: "🧑‍🎨"
          },
          {
            id: 4,
            name: "Tarik Mansour",
            location: "Cairo, Egypt 🇪🇬",
            age: 14,
            quote: "Àyẹ̀wò Doppler démejì lọ́dọọdún ń dáàbò bò ọpọlọ mi.",
            narrative: "Tarik ń gba Doppler ultrasound lójoojúmọ́ láti fọ́ kòbògì ọpọlọ rẹ̀ mọ́ dunjú. Èyí ń jẹ́ kí ó dáàbò bò ara rẹ̀ kúrò lọ́wọ́ ewu stroke.",
            takeaway: "Doppler scans ń tọ́ka sí kòbògì fífú kí stroke tó wáyé.",
            colorClass: "from-purple-600 to-pink-600",
            avatar: "🧑‍🔬"
          },
          {
            id: 5,
            name: "Kwame Mensah",
            location: "Accra, Ghana 🇬🇭",
            age: 11,
            quote: "Apilẹ̀ṣe jẹ́ ti jogún-bí-jogún — kò ní ràn, aṣààbò pọ̀ mọ́ra!",
            narrative: "Àwọn ọmọ kíláàsì Kwame kọ́ pé àrùn sẹ́ẹ̀lì rírẹ́ kò dákú ràn fún ènìyàn mọ́. Wọ́n yẹra fún ìṣọtẹ̀, dípò bẹ́ẹ̀ wọ́n ń ràn Kwame lọ́wọ́ dáadáa.",
            takeaway: "SCD jẹ́ apilẹ̀ṣe jogún-bí-jogún, kò ní ràn nípa ọwọ́ kan ra.",
            colorClass: "from-amber-500 to-red-650",
            avatar: "🧑‍🎤"
          },
          {
            id: 6,
            name: "Sarah Jenkins",
            location: "London, UK 🇬🇧",
            age: 15,
            quote: "CRISPR molecular scissors don tún ayé mi ṣe sí rere.",
            narrative: "Sarah kópa nínú atúnṣe jeni CRISPR clinical trial ní London. Wọ́n tún stem cells rẹ̀ ṣe, lónìí ó dẹmọ́ràn kúrò nínú ìrora.",
            takeaway: "Atúnṣe CRISPR jẹ́ iṣẹ́ ìṣègùn apilẹ̀ṣe ayérayé títí ayé.",
            colorClass: "from-indigo-650 to-indigo-950",
            avatar: "👩‍🚀"
          },
          {
            id: 7,
            name: "Priya Sharma",
            location: "Mumbai, India 🇮🇳",
            age: 13,
            quote: "Adaṣe èémí jẹ́ kí ẹ̀dọ̀fóró mi kún fún atẹ́gùn rere.",
            narrative: "Priya ń lo spirometer fún adaṣe èémí lẹ́mejì lójúmọ́ láti dènà Acute Chest Syndrome. Èyí fún un ní agbára láti gba orin fèrè rẹ̀.",
            takeaway: "Adaṣe spirometry ń jẹ́ kí ẹ̀dọ̀fóró tún pọ̀ kún, dín ewu èémí há kù.",
            colorClass: "from-orange-550 to-pink-650",
            avatar: "👶"
          },
          {
            id: 8,
            name: "Isabella Silva",
            location: "Rio de Janeiro, Brazil 🇧🇷",
            age: 9,
            quote: "Ẹ̀jẹ̀ Akọni jẹ́ àkànṣe — ó ń sọ mí di ọ̀tọ̀ títí láé!",
            narrative: "Mọ̀lẹ́bí Isabella ń ràn án lọ́wọ́ láti gba ìtọ́jú gidi. Wọ́n ń pèsè ìṣàlàyé oníwọ̀ fún àwọn clinics rẹ̀ dáadáa.",
            takeaway: "Ìfẹ́ mọ̀lẹ́bí pẹ̀lú ìyọ́nú ń fún akọni sẹ́ẹ̀lì ní agbára nla lójúmọ́.",
            colorClass: "from-rose-500 to-indigo-800",
            avatar: "👩‍🎨"
          }
        ]
      };
    case 'hausa':
      return {
        sectionTag: "🛡️ Jaruman Duniya Baki Daya",
        sectionTitle: "Tausayi & Labaran Jarumai",
        sectionDesc: "Saurari ainihin shaidu da muryoyin jarumanmu",
        storyLabel: "Labari",
        takeawayLabel: "Darasi na Tausayi",
        biographyLabel: "Tarihin Rayuwa",
        prevBtn: "Bayan Jarumi",
        nextBtn: "Gaba Jarumi",
        audioTitle: "Na'urar Karatun Murya",
        audioDesc: "Saurari labarin",
        btnSpeak: "Karanta labarin",
        btnStop: "Tsayar da murya",
        stories: [
          {
            id: 1,
            name: "Aisha Yusuf",
            location: "Mombasa, Kenya 🇰🇪",
            age: 12,
            quote: "Shan ruwa yana kiyaye mafarkina a karkashin rana.",
            narrative: "Yayin lokacin rani a Mombasa, iska mai zafi tana sanya fatar jiki bushewa da sauri. Aisha tana kokarin shan lita 3 na ruwa a kowace rana domin hana kwayoyin jininta bushewa ko daskarewa.",
            takeaway: "Yawan shan ruwa yana siranta jini don kiyaye toshewa lokacin zafi.",
            colorClass: "from-blue-600 to-indigo-700",
            avatar: "🧑‍🌾"
          },
          {
            id: 2,
            name: "Sam Miller",
            location: "Chicago, USA 🇺🇸",
            age: 16,
            quote: "Maganin bitamin da magunguna suna sanya ni jarumin kwando.",
            narrative: "Sam yana amfani da maganin Hydroxyurea a kowace rana don karfafa kashin jikinsa wajen samar da fetal hemoglobin (HbF) domin kiyaye shi daga zafin jiki.",
            takeaway: "Hydroxyurea na motsa fetal hemoglobin don dakatar da daskarewar jini.",
            colorClass: "from-red-500 to-amber-600",
            avatar: "🧑‍🚀"
          },
          {
            id: 3,
            name: "Fatoumata Traoré",
            location: "Bamako, Mali 🇲🇱",
            age: 10,
            quote: "Masu kyawun suttura ta dumi suna kare ni daga sanyin dare.",
            narrative: "Sanyin dare a Bamako yana toshe hanyoyin jini cikin sauri. Fatoumata tana sanya bargon dumi don kare jikinta baki daya daga sanyi.",
            takeaway: "Kiyaye dumin jiki yana hana matsalar toshewar jini ta dare.",
            colorClass: "from-teal-605 to-emerald-705",
            avatar: "🧑‍🎨"
          },
          {
            id: 4,
            name: "Tarik Mansour",
            location: "Cairo, Egypt 🇪🇬",
            age: 14,
            quote: "Gwajin Doppler akai-akai yana kiyaye kwakwalwata.",
            narrative: "Tarik yana zuwa asibiti don gwajin Doppler (TCD) duk shekara domin duba gudu da koshin hanyoyin jinin kwakwalwarsa.",
            takeaway: "Gwajin Doppler yana taimakawa wajen gano matsaloli tun kafin su haifar da shanyewar tsoka.",
            colorClass: "from-purple-600 to-pink-600",
            avatar: "🧑‍🔬"
          },
          {
            id: 5,
            name: "Kwame Mensah",
            location: "Accra, Ghana 🇬🇭",
            age: 11,
            quote: "Kwayoyin halitta gadonsu ake yi - babu yaduwa socially!",
            narrative: "Abokanan karatun Kwame sun koyi cewa sickling trait na kwayoyin halitta ne, ba cuta ce mai yaduwa ba. Suna bashi ruwa da kulawa.",
            takeaway: "Sickle Cell gado ne daga iyaye, ba ya yaduwa ta hanyar mu'amala.",
            colorClass: "from-amber-500 to-red-650",
            avatar: "🧑‍🎤"
          },
          {
            id: 6,
            name: "Sarah Jenkins",
            location: "London, UK 🇬🇧",
            age: 15,
            quote: "Maganin jini na CRISPR ya canza rayuwata da hikima.",
            narrative: "Sarah ta shiga tsarin gwajin CRISPR na DNA a London, kuma yau tana da koshin lafiya sosai ba tare da kowace kasala ba.",
            takeaway: "Babban maganin jini na CRISPR yana gyara lambobin jini permanent.",
            colorClass: "from-indigo-650 to-indigo-950",
            avatar: "👩‍🚀"
          },
          {
            id: 7,
            name: "Priya Sharma",
            location: "Mumbai, India 🇮🇳",
            age: 13,
            quote: "Motsa jiki na numfashi yana sanya huhuna koshin lafiya gaba daya.",
            narrative: "Priya tana amfani da spirometer sau biyu a kullum don motsa numfashi domin raba kanta da ciwon Acute Chest Syndrome.",
            takeaway: "Numfashi dake kwarara yana rage barazanar ciwon kirji.",
            colorClass: "from-orange-550 to-pink-650",
            avatar: "👶"
          },
          {
            id: 8,
            name: "Isabella Silva",
            location: "Rio de Janeiro, Brazil 🇧🇷",
            age: 9,
            quote: "Jinin Jarumi na daban ne - yana bani karfin asali!",
            narrative: "Ezinuren Isabella suna taimaka mata kwarewa kullum wajen karbar darussan rigakafin sickle cell cikin farin ciki.",
            takeaway: "Tausayi and goyon baya na iyali suna raba tsoro ga yara.",
            colorClass: "from-rose-500 to-indigo-800",
            avatar: "👩‍🎨"
          }
        ]
      };
    case 'igbo':
      return {
        sectionTag: "🛡️ Ndị Dike n'Ụwa Niile",
        sectionTitle: "Obi-ọmụmụ & Ìtàn Ndị Dike",
        sectionDesc: "Nụrụ ozizi anyị site n'ike na olu ndị ọrịa dike",
        storyLabel: "Akụkọ",
        takeawayLabel: "Isi Okwu Obi-ọmụmụ",
        biographyLabel: "Akwụkwọ Ndụ nke Onye Ọrịa",
        prevBtn: "Dike Gara Aga",
        nextBtn: "Dike Na-abịa",
        audioTitle: "Igwe Nkwado Olu",
        audioDesc: "Geere olu",
        btnSpeak: "Gbaa akụkọ",
        btnStop: "Kwụsị olu",
        stories: [
          {
            id: 1,
            name: "Aisha Yusuf",
            location: "Mombasa, Kenya 🇰🇪",
            age: 12,
            quote: "Mmiri zuru ezu na-eme ka nrọ m dị ndụ n'okpuru anwụ.",
            narrative: "N'oge ọkọchị na Mombasa, ifufe anwụ na-eme ka mmiri gwụ ahụ ngwa ngwa. Aisha na-aụ lita 3 mmiri kwa ụbọchị ka sél ọbara ya ghara ịdị gbagọrọ agbagọ tupu ya agbaa bọọlu n'ụlọ akwụkwọ ya.",
            takeaway: "Ịụ mmiri oge niile na-ebelata concentration sél ọbara mgbachigala.",
            colorClass: "from-blue-600 to-indigo-700",
            avatar: "🧑‍🌾"
          },
          {
            id: 2,
            name: "Sam Miller",
            location: "Chicago, USA 🇺🇸",
            age: 16,
            quote: "Mpempe vitamin na ọgwụ m na-eme m onye mmeri basketball.",
            narrative: "Sam na-aụ Hydroxyurea kwa ụbọchị iji kwado sél marrow ya imepụta fetal hemoglobin HbF nke na-ebute ahụike dị mma la play bọọlu.",
            takeaway: "Hydroxyurea na-ebelata pain crisis site na fetal hemoglobin.",
            colorClass: "from-red-500 to-amber-600",
            avatar: "🧑‍🚀"
          },
          {
            id: 3,
            name: "Fatoumata Traoré",
            location: "Bamako, Mali 🇲🇱",
            age: 10,
            quote: "Uwe ọkụ m kpara mma na-echebe m n'oge oyi pụta.",
            narrative: "Oyi alẹ na-eme gị capillary entrapment na Bamako. Fatoumata na-eyi blanket ọkụ na uwe layered ka o hie ụra nke ọma.",
            takeaway: "Idebe ahụ ọkụ na-egbochi nkuchi capillary site n'iyi oyi.",
            colorClass: "from-teal-605 to-emerald-705",
            avatar: "🧑‍🎨"
          },
          {
            id: 4,
            name: "Tarik Mansour",
            location: "Cairo, Egypt 🇪🇬",
            age: 14,
            quote: "Nyocha Doppler anyị kwa afọ na-echebe ụbụrụ m.",
            narrative: "Tarik na-aga Doppler ultrasound (TCD) kwa afọ ka dọkịta nyochaa ụzọ ume ọbara ụbụrụ ya maka stroke prevention.",
            takeaway: "Ultrasound TCD na-achọpụta narrow lanes tupu stroke mberede emee.",
            colorClass: "from-purple-600 to-pink-600",
            avatar: "🧑‍🔬"
          },
          {
            id: 5,
            name: "Kwame Mensah",
            location: "Accra, Ghana 🇬🇭",
            age: 11,
            quote: "Jeni na-esi n'aka nne na nna pụta, ọ dake efe efe!",
            narrative: "Ndị enyi Kwame n'ụlọ akwụkwọ ghọtara na sickle cell dake efe efe na mmekọrịta sọshal. Ha na-enye ya nkwado oge niile.",
            takeaway: "SCD bụ ihe nketa nke jeni, ọ naghị efe efe.",
            colorClass: "from-amber-500 to-red-650",
            avatar: "🧑‍🎤"
          },
          {
            id: 6,
            name: "Sarah Jenkins",
            location: "London, UK 🇬🇧",
            age: 15,
            quote: "Mma molecular CRISPR meghere mgbasa ahụike n'ahụ m.",
            narrative: "Sarah banyere gene trial na London ebe ejiri CRISPR-Cas9 gbanwee stem cells ya, ugbua ọ dị mma nke ọma.",
            takeaway: "Mmezi CRISPR na-agbanwe jeni ka ọbara na-asọ nke ọma.",
            colorClass: "from-indigo-650 to-indigo-950",
            avatar: "👩‍🚀"
          },
          {
            id: 7,
            name: "Priya Sharma",
            location: "Mumbai, India 🇮🇳",
            age: 13,
            quote: "Mmega ume spirometer na-eme ume m obi ụtọ.",
            narrative: "Priya na-eji spirometer gbaa ume ugboro abụọ n'ụbọchị iji pụọ n'ihe egwu Acute Chest Syndrome.",
            takeaway: "Mmega ume spirometry na-ebelata mgbu obi site na expansion huhu.",
            colorClass: "from-orange-550 to-pink-650",
            avatar: "👶"
          },
          {
            id: 8,
            name: "Isabella Silva",
            location: "Rio de Janeiro, Brazil 🇧🇷",
            age: 9,
            quote: "Ọbara dike pụrụ iche - ọ na-eme m pụrụ iche n'ezie!",
            narrative: "Ndị ezinụlọ Isabella na-akwado ya, ha na-enye obodo akwụkwọ asibiti gbasara nlekọta.",
            takeaway: "Ịhụnanya nke ezinụlọ na-enye ụmụaka ike nchebe.",
            colorClass: "from-rose-500 to-indigo-800",
            avatar: "👩‍🎨"
          }
        ]
      };
    default:
      return {
        sectionTag: "🛡️ Warriors Around The World",
        sectionTitle: "Empathy & Warrior Stories",
        sectionDesc: "Hear real testimonies and listen to their vocal stories",
        storyLabel: "Story",
        takeawayLabel: "Empathetic Takeaway",
        biographyLabel: "Biographical Entry File",
        prevBtn: "Previous Warrior",
        nextBtn: "Next Warrior",
        audioTitle: "Voice-Acted Audio Speaker",
        audioDesc: "Listen to",
        btnSpeak: "Speak narrative",
        btnStop: "Stop Voice",
        stories: [
          {
            id: 1,
            name: "Aisha Yusuf",
            location: "Mombasa, Kenya 🇰🇪",
            age: 12,
            quote: "Hydration keeps my dreams alive under the sun.",
            narrative: "During dry seasons in Mombasa, the hot coastal breeze speeds skin perspiration. Aisha tracks her daily water intake, drinking 3 liters of fresh water without fail. This prevents her flexible red blood cells from drying up, anchoring, and clamping. Water is Aisha's shield, helping her score goals on her school’s soccer pitch!",
            takeaway: "High water intake thins blood cell density, preventing sticky blockages in vessels during heat.",
            colorClass: "from-blue-600 to-indigo-700",
            avatar: "🧑‍🌾"
          },
          {
            id: 2,
            name: "Sam Miller",
            location: "Chicago, USA 🇺🇸",
            age: 16,
            quote: "Folic fuel and daily meds make me a basketball champion.",
            narrative: "Sam takes daily Hydroxyurea as suggested by his hematologist. It works behind the scenes, stimulating his bone marrow to produce Fetal Hemoglobin (HbF). Sam has fewer bone crises now, and is free to sink jumpshots with his high school basketball teammates!",
            takeaway: "Hydroxyurea stimulates healthy Fetal Hemoglobin, preventing rigid stacking of crescent elements.",
            colorClass: "from-red-500 to-amber-600",
            avatar: "🧑‍🚀"
          },
          {
            id: 3,
            name: "Fatoumata Traoré",
            location: "Bamako, Mali 🇲🇱",
            age: 10,
            quote: "My cozy colorful sweaters protect me from chilly night drafts.",
            narrative: "Night breezes drop freezing cold in the Bamako highlands. Cold temperatures constrict arteries, tightening vascular paths and trapping rigid sickle shapes immediately. Fatoumata wears gorgeous wool blankets and layered clothing to defend her vascular network and sleep pain-free.",
            takeaway: "Keeping warm prevents cold-induced vascular constriction and microcapillary entrapments.",
            colorClass: "from-teal-600 to-emerald-700",
            avatar: "🧑‍🎨"
          },
          {
            id: 4,
            name: "Tarik Mansour",
            location: "Cairo, Egypt 🇪🇬",
            age: 14,
            quote: "Regular Doppler screenings protect my brain.",
            narrative: "Tarik goes to his university clinic every winter for a brief Transcranial Doppler (TCD) ultrasound. Doctors scan brain vessel speeds, ensuring no blockages form. This screening keeps Tarik safe from pediatric stroke, free to pursue his passion for engineering and archaeology.",
            takeaway: "Routine Doppler ultrasound screenings identify silent narrow vessels before blockages create stroke risk.",
            colorClass: "from-purple-600 to-pink-600",
            avatar: "🧑‍🔬"
          },
          {
            id: 5,
            name: "Kwame Mensah",
            location: "Accra, Ghana 🇬🇭",
            age: 11,
            quote: "Genes are hereditary—no transmission, plenty of solidarity!",
            narrative: "Kwame's classmates learned about autosomal recessive inheritance. They realized Kwame's trait is just biological code and is not contagious. Instead of isolation, Kwame’s team supports him during sports, bringing water coolers to keep him hydrated.",
            takeaway: "Sickle Cell is strictly inherited—it cannot transmit socially. Knowledge destroys stigmas.",
            colorClass: "from-amber-500 to-red-600",
            avatar: "🧑‍🎤"
          },
          {
            id: 6,
            name: "Sarah Jenkins",
            location: "London, UK 🇬🇧",
            age: 15,
            quote: "CRISPR molecular scissors unlocked my body's healing.",
            narrative: "Sarah joined a gene therapy clinical trial at King’s College London. Scientists edited her stem cells with CRISPR-Cas9, restarting the production of circular Fetal Hemoglobin. Today, Sarah is free from crises, studying painting, and feeling like a cosmic warrior.",
            takeaway: "CRISPR gene therapy targets DNA codes to safely restore flexible, non-stick cell structures.",
            colorClass: "from-indigo-650 to-indigo-950",
            avatar: "👩‍🚀"
          },
          {
            id: 7,
            name: "Priya Sharma",
            location: "Mumbai, India 🇮🇳",
            age: 13,
            quote: "Breathing exercises keep my lungs happy and fully oxygenated.",
            narrative: "Priya uses an incentive spirometer twice daily to perform breathing exercise sets. Keeping her lungs expanding avoids Acute Chest Syndrome, a severe SCD trap. Exercising daily keeps her performing on Indian classical ragas with her flute.",
            takeaway: "Spirometry keeps lung tissue fully inflated, reducing oxygen deficits and chest crises.",
            colorClass: "from-orange-550 to-pink-650",
            avatar: "👶"
          },
          {
            id: 8,
            name: "Isabella Silva",
            location: "Rio de Janeiro, Brazil 🇧🇷",
            age: 9,
            quote: "Warrior blood is special — it makes me strong and unique!",
            narrative: "Isabella’s family celebrates her as a warrior hero. Her sickle trait is merely DNA code inherited from ancestors. Instead of fearing, they educate pediatric clinics in Rio, distributing colorful guides on early screening.",
            takeaway: "Empathy and familial support systems eliminate pediatric fear, boosting resilience outcomes.",
            colorClass: "from-rose-500 to-indigo-800",
            avatar: "👩‍🎨"
          }
        ]
      };
  }
};

interface Story {
  id: number;
  name: string;
  location: string;
  age: number;
  quote: string;
  narrative: string;
  takeaway: string;
  colorClass: string;
  avatar: string;
}

interface EmpathyStoriesProps {
  language: string;
  textScale: 'normal' | 'large' | 'xl';
}

const EmpathyStories: React.FC<EmpathyStoriesProps> = ({ language, textScale }) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const locD = getLocalizedStoriesData(language);
  const activeStory = locD.stories[activeIdx] || locD.stories[0];

  const textScaleClasses = {
    normal: 'text-xs md:text-sm',
    large: 'text-sm md:text-base',
    xl: 'text-base md:text-lg'
  };

  // Web Speech API text-to-speech voice generator
  const speakNarrative = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      } else {
        alert("Text-to-Speech synthesizer not supported in this browser version.");
      }
    } catch (e) {
      console.warn("Speech API failed:", e);
    }
  };

  const handleNext = () => {
    try { window.speechSynthesis.cancel(); } catch(e){}
    setIsSpeaking(false);
    setActiveIdx((prev) => (prev + 1) % locD.stories.length);
  };

  const handlePrev = () => {
    try { window.speechSynthesis.cancel(); } catch(e){}
    setIsSpeaking(false);
    setActiveIdx((prev) => (prev - 1 + locD.stories.length) % locD.stories.length);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-md relative overflow-hidden">
      
      <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4 flex-wrap gap-2">
        <div>
          <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">
            {locD.sectionTag}
          </span>
          <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">{locD.sectionTitle}</h3>
          <p className="text-xs text-gray-500 font-medium">{locD.sectionDesc}</p>
        </div>
        <div className="flex bg-gray-50 border p-1 rounded-xl items-center text-xs text-gray-600 font-medium px-2.5 gap-1 shadow-sm font-sans">
          <BookOpen size={14} className="text-red-500" />
          <span>{locD.storyLabel} {activeStory.id} / {locD.stories.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        
        {/* Story Illustration Card LHS */}
        <div className={`md:col-span-2 bg-gradient-to-tr ${activeStory.colorClass} text-white rounded-[2.5rem] p-6 relative flex flex-col justify-between shadow-lg overflow-hidden h-[340px] md:h-[380px]`}>
          <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl">❤️</div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="text-4xl bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center font-emoji shadow-sm">
                {activeStory.avatar}
              </span>
              <div>
                <h4 className="text-lg font-black tracking-tight leading-none">{activeStory.name}</h4>
                <div className="text-[9px] font-black text-indigo-150 uppercase tracking-widest mt-1 font-mono">
                  {activeStory.location} &bull; Age {activeStory.age}
                </div>
              </div>
            </div>

            <p className="text-sm md:text-base font-black italic tracking-wide leading-relaxed text-indigo-50/90 py-2">
              "{activeStory.quote}"
            </p>
          </div>

          <div className="border-t border-white/15 pt-3 leading-relaxed">
            <span className="text-[8px] opacity-60 uppercase font-black tracking-widest block mb-1 font-mono">{locD.takeawayLabel}</span>
            <p className="text-[10px] md:text-xs text-white/90 font-semibold italic">
              {activeStory.takeaway}
            </p>
          </div>
        </div>

        {/* Written Narrative RHS & Voice-acts controls */}
        <div className="md:col-span-3 space-y-4">
          
          {/* Web Voice acted interface */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg">
                <Speech className="animate-pulse" size={18} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider font-mono">{locD.audioTitle}</span>
                <h5 className="text-xs font-black uppercase mt-0.5 tracking-wide">{locD.audioDesc} {activeStory.name}</h5>
              </div>
            </div>

            <button
              onClick={() => speakNarrative(activeStory.narrative)}
              className={`px-4 py-2 text-xs font-black rounded-xl uppercase tracking-wider flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                isSpeaking 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'bg-white text-slate-900 border hover:bg-slate-100'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={14} />
                  {locD.btnStop}
                </>
              ) : (
                <>
                  <Volume2 size={14} />
                  {locD.btnSpeak}
                </>
              )}
            </button>
          </div>

          {/* Full Narrative Text */}
          <div className="bg-gray-50 border border-gray-150 rounded-[2rem] p-6 space-y-4">
            <div className="flex gap-1.5 items-center text-slate-500 border-b border-gray-200 pb-2">
              <Sparkles size={14} className="text-yellow-500 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider font-mono">{locD.biographyLabel}</span>
            </div>

            <p className={`text-slate-750 font-semibold leading-relaxed ${textScaleClasses[textScale]}`}>
              {activeStory.narrative}
            </p>
          </div>

          {/* Toggle buttons between books */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={handlePrev}
              className="px-5 py-3 border border-gray-200 sm:hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-black uppercase flex items-center gap-1 cursor-pointer select-none"
            >
              <ArrowLeft size={14} />
              {locD.prevBtn}
            </button>
            <button
              onClick={handleNext}
              className="px-5 py-3 bg-red-650 sm:hover:bg-red-750 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1 cursor-pointer select-none"
            >
              {locD.nextBtn}
              <ArrowRight size={14} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default EmpathyStories;
