export interface FirstAidStep {
  titleEn: string;
  titleNe: string;
  descriptionEn: string;
  descriptionNe: string;
  critical?: boolean;
}

export interface FirstAidGuide {
  id: string;
  titleEn: string;
  titleNe: string;
  descriptionEn: string;
  descriptionNe: string;
  icon: string;
  hasCPRTimer?: boolean;
  steps: FirstAidStep[];
}

export const FIRST_AID_GUIDES: FirstAidGuide[] = [
  {
    id: 'cpr',
    titleEn: 'CPR',
    titleNe: 'सिपिआर',
    descriptionEn: 'Cardiopulmonary resuscitation for unconscious / not breathing',
    descriptionNe: 'बेहोश / सास नफेर्ने व्यक्तिको लागि',
    icon: '❤️',
    hasCPRTimer: true,
    steps: [
      {
        titleEn: 'Check for safety',
        titleNe: 'सुरक्षा जाँच गर्नुहोस्',
        descriptionEn: 'Make sure the scene is safe for you and the victim.',
        descriptionNe: 'घटनास्थल तपाईं र पीडित दुवैका लागि सुरक्षित छ भनी सुनिश्चित गर्नुहोस्।',
        critical: true,
      },
      {
        titleEn: 'Check responsiveness',
        titleNe: 'प्रतिक्रिया जाँच गर्नुहोस्',
        descriptionEn: 'Tap shoulders firmly and shout "Are you okay?"',
        descriptionNe: 'कंधामा जोरसँग थिच्नुहोस् र "ठीक हुनुहुन्छ?" भनी चिच्याउनुहोस्।',
      },
      {
        titleEn: 'Call for help',
        titleNe: 'सहायता बोलाउनुहोस्',
        descriptionEn: 'Call 102 (ambulance). Have someone call while you do CPR.',
        descriptionNe: '१०२ (एम्बुलेन्स) मा फोन गर्नुहोस्। कसैलाई फोन गर्न लगाउनुहोस् र तपाईं सिपिआर गर्नुहोस्।',
        critical: true,
      },
      {
        titleEn: 'Open the airway',
        titleNe: 'श्वासनली खोल्नुहोस्',
        descriptionEn: 'Tilt head back gently and lift chin to open airway.',
        descriptionNe: 'टाउको बिस्तारै पछाडि झुकाउनुहोस् र चिउँडो माथि उठाउनुहोस्।',
      },
      {
        titleEn: 'Check for breathing',
        titleNe: 'सास जाँच गर्नुहोस्',
        descriptionEn: 'Look, listen, and feel for breathing for no more than 10 seconds.',
        descriptionNe: '१० सेकेन्डभन्दा बढी नगरी सास छ कि छैन हेर्नुहोस्, सुन्नुहोस्, महसुस गर्नुहोस्।',
      },
      {
        titleEn: 'Start chest compressions',
        titleNe: 'छाती दबाउन सुरु गर्नुहोस्',
        descriptionEn: 'Place heel of hand on center of chest. Push down 2 inches (5cm) at 100-120 per minute. Use the CPR timer below.',
        descriptionNe: 'हत्केलाको पछिल्लो भाग छातीको बीचमा राख्नुहोस्। ५ सेन्टिमिटर थिच्नुहोस् प्रति मिनेट १००-१२० पटक। तलको सिपिआर टाइमर प्रयोग गर्नुहोस्।',
        critical: true,
      },
      {
        titleEn: 'Give rescue breaths (if trained)',
        titleNe: 'सास दिनुहोस् (तालिम छ भने)',
        descriptionEn: 'After 30 compressions, give 2 rescue breaths. If untrained, do compression-only CPR.',
        descriptionNe: '३० पटक थिचेपछि २ पटक सास दिनुहोस्। तालिम छैन भने केवल छाती दबाउनुहोस्।',
      },
      {
        titleEn: 'Continue until help arrives',
        titleNe: 'सहायता नआउँदासम्म जारी राख्नुहोस्',
        descriptionEn: 'Keep going 30 compressions : 2 breaths until the ambulance arrives or the person starts breathing.',
        descriptionNe: 'एम्बुलेन्स नआउँदासम्म वा व्यक्तिले सास फेर्न नसुरु गर्दासम्म ३० थिचाइ : २ सास जारी राख्नुहोस्।',
        critical: true,
      },
    ],
  },
  {
    id: 'choking',
    titleEn: 'Choking',
    titleNe: 'घाँटीमा अड्किएको',
    descriptionEn: 'For adult and child choking emergencies',
    descriptionNe: 'वयस्क र बालकको घाँटीमा अड्किएकोमा',
    icon: '🤤',
    steps: [
      {
        titleEn: 'Encourage coughing',
        titleNe: 'खोकाउन प्रोत्साहित गर्नुहोस्',
        descriptionEn: 'If the person can cough, encourage them to keep coughing.',
        descriptionNe: 'व्यक्ति खोक्न सक्छन् भने खोकाइरहन प्रोत्साहित गर्नुहोस्।',
      },
      {
        titleEn: 'Give back blows',
        titleNe: 'पिठ्युँमा हिर्काउनुहोस्',
        descriptionEn: 'Lean them forward and give 5 sharp blows between shoulder blades with the heel of your hand.',
        descriptionNe: 'अगाडि झुकाउनुहोस् र हत्केलाको पछिल्लो भागले काँधको बिचमा ५ पटक जोरसँग हिर्काउनुहोस्।',
        critical: true,
      },
      {
        titleEn: 'Give abdominal thrusts (Heimlich)',
        titleNe: 'पेटमा धक्का दिनुहोस् (हेम्लिच)',
        descriptionEn: 'Stand behind them, make a fist above the navel, cover with other hand, and pull sharply inward and upward 5 times.',
        descriptionNe: 'पछाडि उभिनुहोस्, नाभि माथि मुठ्ठी बनाउनुहोस्, अर्को हातले ढाक्नुहोस् र भित्र र माथितर्फ ५ पटक जोरसँग तान्नुहोस्।',
        critical: true,
      },
      {
        titleEn: 'Alternate back blows and thrusts',
        titleNe: 'पिठ्युँ र पेट एकान्तरण गर्नुहोस्',
        descriptionEn: 'Continue alternating 5 back blows and 5 abdominal thrusts until object is dislodged or person loses consciousness.',
        descriptionNe: 'वस्तु नबाहिर निस्कदासम्म वा व्यक्ति बेहोश नहुँदासम्म ५ पिठ्युँ र ५ पेट एकान्तरण गर्नुहोस्।',
      },
      {
        titleEn: 'If unconscious — start CPR',
        titleNe: 'बेहोश भए — सिपिआर सुरु गर्नुहोस्',
        descriptionEn: 'If the person loses consciousness, lay them down and start CPR. Each time you open airway for rescue breaths, look for and remove any visible object.',
        descriptionNe: 'बेहोश भए सुताउनुहोस् र सिपिआर सुरु गर्नुहोस्। हरेक पटक सास दिनका लागि श्वासनली खोल्दा देखिने वस्तु हटाउनुहोस्।',
        critical: true,
      },
    ],
  },
  {
    id: 'bleeding',
    titleEn: 'Bleeding Control',
    titleNe: 'रगत रोक्ने',
    descriptionEn: 'Control severe bleeding from wounds',
    descriptionNe: 'घाउबाट गम्भीर रगत रोक्ने',
    icon: '🩸',
    steps: [
      {
        titleEn: 'Apply direct pressure',
        titleNe: 'सिधा दबाब दिनुहोस्',
        descriptionEn: 'Use a clean cloth or bandage. Press firmly on the wound and do not lift — keep constant pressure.',
        descriptionNe: 'सफा कपडा वा पट्टी प्रयोग गर्नुहोस्। घाउमा जोरसँग थिच्नुहोस् र नउठाउनुहोस् — निरन्तर दबाब राख्नुहोस्।',
        critical: true,
      },
      {
        titleEn: 'Elevate the limb',
        titleNe: 'अंग माथि उठाउनुहोस्',
        descriptionEn: 'If possible, raise the bleeding limb above the level of the heart.',
        descriptionNe: 'सम्भव भएमा रगत बग्ने अंगलाई मुटुको तहभन्दा माथि उठाउनुहोस्।',
      },
      {
        titleEn: 'Add more dressing if soaked',
        titleNe: 'भिज्यो भने थप पट्टी थप्नुहोस्',
        descriptionEn: 'Do not remove soaked dressings — add more on top to maintain pressure.',
        descriptionNe: 'भिजेको पट्टी नहटाउनुहोस् — दबाब राख्न माथिबाट थप थप्नुहोस्।',
      },
      {
        titleEn: 'Call for help',
        titleNe: 'सहायता बोलाउनुहोस्',
        descriptionEn: 'Call 102 for severe bleeding. Keep pressure until ambulance arrives.',
        descriptionNe: 'गम्भीर रगतका लागि १०२ मा फोन गर्नुहोस्। एम्बुलेन्स नआउँदासम्म दबाब राख्नुहोस्।',
        critical: true,
      },
    ],
  },
  {
    id: 'burns',
    titleEn: 'Burns',
    titleNe: 'पोलेको',
    descriptionEn: 'Treatment for burns and scalds',
    descriptionNe: 'आगोले पोलेको उपचार',
    icon: '🔥',
    steps: [
      {
        titleEn: 'Cool the burn',
        titleNe: 'पोलेको ठण्डा गर्नुहोस्',
        descriptionEn: 'Hold under cool (not cold/icy) running water for 20 minutes. Do not use ice.',
        descriptionNe: '२० मिनेटसम्म चिसो (बरफ नभएको) बग्ने पानीमा राख्नुहोस्। बरफ नप्रयोग गर्नुहोस्।',
        critical: true,
      },
      {
        titleEn: 'Remove jewelry/clothing',
        titleNe: 'गहना/लुगा हटाउनुहोस्',
        descriptionEn: 'Gently remove rings, watches, and clothing near the burn — not if stuck to skin.',
        descriptionNe: 'पोलेको नजिकका औंठी, घडी र लुगा बिस्तारै हटाउनुहोस् — छालामा टाँसिएको भए नहटाउनुहोस्।',
      },
      {
        titleEn: 'Cover loosely',
        titleNe: 'कम्मरीसँग ढाक्नुहोस्',
        descriptionEn: 'Cover with a clean non-fluffy material like cling film or a clean plastic bag. Do not wrap tightly.',
        descriptionNe: 'क्लिंग फिल्म वा सफा प्लास्टिक झोलाले ढाक्नुहोस्। कसेर नबाँध्नुहोस्।',
      },
      {
        titleEn: 'Do NOT do these',
        titleNe: 'यी नगर्नुहोस्',
        descriptionEn: 'Do not burst blisters, apply butter/toothpaste/oil, or use fluffy cotton.',
        descriptionNe: 'फोकाहरू नफोड्नुहोस्, मक्खन/टुथपेस्ट/तेल नलगाउनुहोस्, र रुइँदो कपास नप्रयोग गर्नुहोस्।',
        critical: true,
      },
      {
        titleEn: 'Seek medical help',
        titleNe: 'चिकित्सा सहायता लिनुहोस्',
        descriptionEn: 'Go to hospital for burns larger than palm size, on face/hands/genitals, or deep burns.',
        descriptionNe: 'हत्केलाभन्दा ठूलो, अनुहार/हात/जननांगमा, वा गहिरो पोलेकोमा अस्पताल जानुहोस्।',
      },
    ],
  },
  {
    id: 'fractures',
    titleEn: 'Fractures',
    titleNe: 'हड्डी भाँचिएको',
    descriptionEn: 'Managing broken bones until help arrives',
    descriptionNe: 'सहायता नआउँदासम्म भाँचिएको हड्डी व्यवस्थापन',
    icon: '🦴',
    steps: [
      {
        titleEn: 'Do not move the person',
        titleNe: 'व्यक्तिलाई नसार्नुहोस्',
        descriptionEn: 'Unless in immediate danger, do not move the injured person especially if spine/neck injury suspected.',
        descriptionNe: 'तत्काल खतरा नभएमा घाइते व्यक्तिलाई नसार्नुहोस् विशेषगरी मेरुदण्ड/घाँटीको चोट संदेहास्पद छ भने।',
        critical: true,
      },
      {
        titleEn: 'Immobilize the fracture',
        titleNe: 'भाँचिएको स्थिर बनाउनुहोस्',
        descriptionEn: 'Support the limb in the position found. Use a splint (sticks, boards) padded with cloth if available.',
        descriptionNe: 'अंगलाई भेटिएको स्थितिमा सहायता दिनुहोस्। उपलब्ध भए कपडाले भरेको स्प्लिन्ट (लाठी, तख्ता) प्रयोग गर्नुहोस्।',
      },
      {
        titleEn: 'Control bleeding if present',
        titleNe: 'रगत छ भने रोक्नुहोस्',
        descriptionEn: 'For open fractures, apply gentle pressure around (not on) the wound with a clean cloth.',
        descriptionNe: 'खुला भाँचाइमा सफा कपडाले घाउको वरिपरि (घाउमा नभई) बिस्तारै दबाब दिनुहोस्।',
      },
      {
        titleEn: 'Call 102',
        titleNe: '१०२ मा फोन गर्नुहोस्',
        descriptionEn: 'Call ambulance for all suspected fractures especially spine, hip, femur.',
        descriptionNe: 'सबै संदिग्ध भाँचाइमा विशेषगरी मेरुदण्ड, कम्मर, जाँघको हड्डीमा एम्बुलेन्स बोलाउनुहोस्।',
        critical: true,
      },
    ],
  },
  {
    id: 'seizure',
    titleEn: 'Seizure',
    titleNe: 'झट्का / मिर्गौला',
    descriptionEn: 'Helping someone during a seizure',
    descriptionNe: 'झट्कामा सहायता',
    icon: '⚡',
    steps: [
      {
        titleEn: 'Stay calm, time the seizure',
        titleNe: 'शान्त रहनुहोस्, समय नोट गर्नुहोस्',
        descriptionEn: 'Note the start time. Most seizures stop on their own within 1-2 minutes.',
        descriptionNe: 'सुरु समय नोट गर्नुहोस्। धेरैजसो झट्का १-२ मिनेटमा आफैं रोकिन्छ।',
      },
      {
        titleEn: 'Protect from injury',
        titleNe: 'चोटपटकबाट जोगाउनुहोस्',
        descriptionEn: 'Clear away hard/sharp objects. Cushion the head with something soft.',
        descriptionNe: 'कडा/तीखा वस्तुहरू हटाउनुहोस्। टाउकोमुनि नरम केही राख्नुहोस्।',
        critical: true,
      },
      {
        titleEn: 'Do NOT restrain or put anything in mouth',
        titleNe: 'नरोक्नुहोस् र मुखमा केही नहाल्नुहोस्',
        descriptionEn: 'Never hold the person down or put anything in their mouth. They cannot swallow their tongue.',
        descriptionNe: 'कहिल्यै नरोक्नुहोस् वा मुखमा केही नहाल्नुहोस्। उनीहरूले आफ्नो जिब्रो निल्न सक्दैनन्।',
        critical: true,
      },
      {
        titleEn: 'Recovery position after seizure',
        titleNe: 'झट्का पछि रिकभरी अवस्था',
        descriptionEn: 'Once jerking stops, roll them onto their side (recovery position) to keep airway clear.',
        descriptionNe: 'काम्पन रोकिएपछि, श्वासनली खुला राख्न ठीकपट्टि गुड्काउनुहोस् (रिकभरी अवस्था)।',
      },
      {
        titleEn: 'Call 102 if:',
        titleNe: 'यी अवस्थामा १०२ मा फोन गर्नुहोस्:',
        descriptionEn: 'Seizure lasts > 5 minutes, person does not regain consciousness, second seizure occurs, or person is injured.',
        descriptionNe: 'झट्का ५ मिनेटभन्दा बढी, होश नफर्किएमा, दोस्रो झट्का आएमा, वा चोट लागेमा।',
        critical: true,
      },
    ],
  },
  {
    id: 'heartAttack',
    titleEn: 'Heart Attack Signs',
    titleNe: 'मुटुको दौराका संकेत',
    descriptionEn: 'Recognize and respond to a heart attack',
    descriptionNe: 'मुटुको दौरा पहिचान र प्रतिक्रिया',
    icon: '💔',
    steps: [
      {
        titleEn: 'Recognize the signs',
        titleNe: 'संकेतहरू पहिचान गर्नुहोस्',
        descriptionEn: 'Chest pain/pressure/squeezing, pain spreading to arm/jaw/neck, shortness of breath, nausea, sweating, lightheadedness.',
        descriptionNe: 'छातीमा दुखाइ/दबाब/निचोरिएको अनुभव, बाहुला/जबडा/घाँटीमा दुखाइ फैलिएको, सास फुल्ने, वाकवाकी, पसिना, टाउको घुम्ने।',
        critical: true,
      },
      {
        titleEn: 'Call 102 immediately',
        titleNe: 'तुरुन्त १०२ मा फोन गर्नुहोस्',
        descriptionEn: 'Do not drive to hospital yourself. Call 102 for an ambulance. Every minute counts.',
        descriptionNe: 'आफैं अस्पताल नजानुहोस्। एम्बुलेन्सका लागि १०२ मा फोन गर्नुहोस्। हरेक मिनेट महत्वपूर्ण छ।',
        critical: true,
      },
      {
        titleEn: 'Have them sit or lie down',
        titleNe: 'बस्न वा सुत्न दिनुहोस्',
        descriptionEn: 'Help them into a comfortable position — usually sitting up leaning forward or lying down. Loosen tight clothing.',
        descriptionNe: 'आरामदायी अवस्थामा राख्नुहोस् — सामान्यतः अगाडि झुकेर बस्दा वा सुत्दा। कसेको लुगा खुकुलो बनाउनुहोस्।',
      },
      {
        titleEn: 'Aspirin if available and not allergic',
        titleNe: 'एस्पिरिन — उपलब्ध र एलर्जी नभएमा',
        descriptionEn: 'Give a 325mg aspirin to chew (not swallow whole) if not allergic and there are no contraindications.',
        descriptionNe: 'एलर्जी नभएमा ३२५ मिलिग्राम एस्पिरिन चपाउन दिनुहोस् (पूरा नगिल्नुहोस्)।',
      },
      {
        titleEn: 'Be ready to do CPR',
        titleNe: 'सिपिआरका लागि तयार रहनुहोस्',
        descriptionEn: 'If they become unresponsive and stop breathing, begin CPR immediately and continue until help arrives.',
        descriptionNe: 'उनीहरूले होश गुमाएमा र सास फेर्न बन्द गरेमा तुरुन्त सिपिआर सुरु गर्नुहोस् र सहायता नआउँदासम्म जारी राख्नुहोस्।',
        critical: true,
      },
    ],
  },
  {
    id: 'earthquake',
    titleEn: 'Earthquake Survival',
    titleNe: 'भूकम्पमा बाँच्ने उपाय',
    descriptionEn: 'What to do during and after an earthquake in Nepal',
    descriptionNe: 'नेपालमा भूकम्पको समयमा र पछि के गर्ने',
    icon: '🏚️',
    steps: [
      {
        titleEn: 'DROP, COVER, HOLD ON',
        titleNe: 'झर्नुहोस्, ओढ्नुहोस्, समात्नुहोस्',
        descriptionEn: 'Drop to hands and knees. Take cover under a sturdy table or against an interior wall. Hold on until shaking stops.',
        descriptionNe: 'हात र घुँडामा झर्नुहोस्। बलियो टेबुलमुनि वा भित्री भित्तामा लुक्नुहोस्। हल्लाइ नरोकेसम्म समात्नुहोस्।',
        critical: true,
      },
      {
        titleEn: 'Stay away from windows',
        titleNe: 'झ्यालबाट टाढा रहनुहोस्',
        descriptionEn: 'Move away from windows, glass, and exterior walls. Cover head and neck with arms.',
        descriptionNe: 'झ्याल, गिलास र बाहिरी भित्ताबाट टाढा जानुहोस्। हात र बाहुलाले टाउको र घाँटी ढाक्नुहोस्।',
      },
      {
        titleEn: 'Do NOT run outside during shaking',
        titleNe: 'हल्लाइरहँदा बाहिर नदौड्नुहोस्',
        descriptionEn: 'Most injuries happen when people run outside and are hit by falling debris.',
        descriptionNe: 'धेरैजसो चोट बाहिर दौडिँदा खस्ने मलबाले लाग्छ।',
        critical: true,
      },
      {
        titleEn: 'After shaking stops — evacuate carefully',
        titleNe: 'हल्लाइ रोकिएपछि — सावधानीसाथ निस्कनुहोस्',
        descriptionEn: 'Check for gas leaks. Watch for falling debris as you exit. Use stairs not lifts.',
        descriptionNe: 'ग्यास चुहावट जाँच गर्नुहोस्। निस्कँदा खस्ने मलबाको ध्यान दिनुहोस्। लिफ्ट नचढी भर्‍याङ प्रयोग गर्नुहोस्।',
      },
      {
        titleEn: 'Expect aftershocks',
        titleNe: 'परकम्पको अपेक्षा राख्नुहोस्',
        descriptionEn: 'Drop, cover, hold on again for each aftershock. Move to open ground away from buildings.',
        descriptionNe: 'प्रत्येक परकम्पमा फेरि झर्नुहोस्, ओढ्नुहोस्, समात्नुहोस्। भवनबाट टाढा खुला ठाउँमा जानुहोस्।',
      },
      {
        titleEn: 'Help the injured',
        titleNe: 'घाइतेलाई सहायता गर्नुहोस्',
        descriptionEn: 'Check yourself for injuries first. Then help others. Call 102 for serious injuries. Do not move people with suspected spine injuries.',
        descriptionNe: 'पहिले आफ्नो चोट जाँच गर्नुहोस्। त्यसपछि अरूलाई सहायता गर्नुहोस्। गम्भीर चोटमा १०२ मा फोन गर्नुहोस्। मेरुदण्डमा चोट लागेको संदेहास्पद व्यक्तिलाई नसार्नुहोस्।',
        critical: true,
      },
    ],
  },
  {
    id: 'roadAccident',
    titleEn: 'Road Accident Response',
    titleNe: 'सडक दुर्घटना प्रतिक्रिया',
    descriptionEn: 'What to do at a road accident scene',
    descriptionNe: 'सडक दुर्घटनाको घटनास्थलमा के गर्ने',
    icon: '🚗',
    steps: [
      {
        titleEn: 'Make the scene safe',
        titleNe: 'घटनास्थल सुरक्षित बनाउनुहोस्',
        descriptionEn: 'Turn on hazard lights. Keep bystanders back. Call 100 if needed.',
        descriptionNe: 'हजार्ड लाइट बाल्नुहोस्। दर्शकहरूलाई टाढा राख्नुहोस्। आवश्यक भए १०० मा फोन गर्नुहोस्।',
        critical: true,
      },
      {
        titleEn: 'Call 102 immediately',
        titleNe: 'तुरुन्त १०२ मा फोन गर्नुहोस्',
        descriptionEn: 'Describe: number of casualties, location, type of accident. Stay on the line.',
        descriptionNe: 'वर्णन गर्नुहोस्: हताहतको संख्या, स्थान, दुर्घटनाको प्रकार। लाइनमा रहनुहोस्।',
        critical: true,
      },
      {
        titleEn: 'Do NOT move injured unless in danger',
        titleNe: 'खतरा नभएमा घाइतेलाई नसार्नुहोस्',
        descriptionEn: 'Moving can worsen spine injuries. Only move if there is fire/drowning risk.',
        descriptionNe: 'सार्दा मेरुदण्डको चोट बिग्रन सक्छ। आगो/डुब्ने खतरा भएमा मात्र सार्नुहोस्।',
        critical: true,
      },
      {
        titleEn: 'Control bleeding',
        titleNe: 'रगत रोक्नुहोस्',
        descriptionEn: 'Apply firm pressure to wounds using cloth. Do not remove embedded objects.',
        descriptionNe: 'कपडाले घाउमा जोरसँग दबाब दिनुहोस्। गाडिएको वस्तु नहटाउनुहोस्।',
      },
      {
        titleEn: 'Keep them warm and calm',
        titleNe: 'न्यानो र शान्त राख्नुहोस्',
        descriptionEn: 'Cover with a blanket if available. Talk to them reassuringly until ambulance arrives.',
        descriptionNe: 'उपलब्ध भए कम्बलले ढाक्नुहोस्। एम्बुलेन्स नआउँदासम्म आश्वासन दिँदै कुरा गर्नुहोस्।',
      },
    ],
  },
];
