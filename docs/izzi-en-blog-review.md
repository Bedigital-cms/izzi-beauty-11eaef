# IZZI Beauty — EN blog/knowledge-base content: review flags

These claims were **translated faithfully** from the current Dutch source — nothing was changed, recomputed, resolved, or verified by the agent. Date context: **September 2026**. The customer must confirm the underlying facts before English indexation; the same claims already exist in the NL source. Scope: `content/en/blog.json` (Batch 5, 50 knowledge-base articles).

Status: **PRE-LAUNCH CUSTOMER REVIEW** (not a merge blocker; English remains production-inactive).

## Summary

| Category | flags | affected posts |
|---|---|---|
| CUSTOMER_DURATION_CLAIM_REVIEW_REQUIRED | 48 | 23 |
| CUSTOMER_AFTERCARE_REVIEW_REQUIRED | 114 | 27 |
| CUSTOMER_PRICE_REVIEW_REQUIRED | 16 | 13 |
| CUSTOMER_GGD_DATA_REVIEW_REQUIRED | 42 | 16 |
| CUSTOMER_CREDENTIAL_REVIEW_REQUIRED | 10 | 4 |
| CUSTOMER_PREGNANCY_REVIEW_REQUIRED | 27 | 5 |
| CUSTOMER_PROMO_REVIEW_REQUIRED | 8 | 2 |
| CUSTOMER_PAIN_CLAIM_REVIEW_REQUIRED | 24 | 13 |
| CUSTOMER_REGULATORY_REVIEW_REQUIRED | 6 | 1 |
| CUSTOMER_REMOVAL_CLAIM_REVIEW_REQUIRED | 29 | 3 |

Five source posts were already English in `content/nl/blog.json` and were copied with only British-spelling normalisation (`everything-about-ombre-powder-brows`, `failed-permanent-make-up`, `microblading-cons`, `how-to-get-a-permanent-natural-eyelash-curl`, `tips-to-improve-skills-for-eyelash-extensions`). Category keys remain Dutch so `/kennisbank/<categorie>` slugs stay language-switcher-stable.

## CUSTOMER_DURATION_CLAIM_REVIEW_REQUIRED (48 flags across 23 posts)

Affected posts: `5-dingen-die-je-moet-weten-voordat-je-pmu-laat-zetten`, `airbrush-brows`, `alles-over-ombre-powder-brows`, `faux-freckles-permanente-make-up`, `faux-freckles-sproetjes-tattoo`, `het-helingsproces-van-pmu`, `hoe-herken-je-een-goede-permanente-make-up-salon`, `hoe-worden-powder-brows-geplaatst-stap-voor-stap-uitleg`, `lip-blush-het-nieuwe-alternatief-voor-lip-fillers`, `lip-blush-pmu`, `lip-blushing-behandeling-nederland`, `make-up-na-powder-brows-behandeling`, `micro-scalp-pigmentatie`, `microblading-nadelen`, `ombre-powder-brows-genezing-dag-per-dag`, `ombre-powder-brows-genezingsproces`, `permanente-make-up-na-een-week`, `permanente-make-up-onderschat`, `permanente-make-up-tijdens-zwanger`, `permanente-make-up-verwijderen`, `permanente-make-up-voor-en-nadelen`, `vervagen-powder-brows-en-waarom`, `wat-zijn-powder-brows`

Representative examples:

- **lip-blushing-behandeling-nederland** _body[1].paragraphs[1]_
  - NL: Pigmentatie beter verdelen — bij donkerere huidtypes kunnen pigmentatieverschillen gemakkelijk worden geharmoniseerd. Verwacht dat de kleur 40-60% vervaagt; een touch-up na 6-8 weken wordt aanbevolen.
  - EN: Distributing pigmentation more evenly — on darker skin types, pigmentation differences can easily be harmonised. Expect the colour to fade 40-60%; a touch-up after 6-8 weeks is recommended.
- **faux-freckles-permanente-make-up** _body[2].paragraphs[2]_
  - NL: 8. Ieder sproetje wordt een aantal keer aangezet met een naaldje. 9. Tussendoor verdoving voor een open huid. 10. Huid reinigen. 11. Het resultaat bekijken en eventueel aanpassen. 12. Na 6-8 weken behandeling herhalen om pigment op te bouwen in laagjes op elkaar.
  - EN: 8. Each freckle is worked over several times with a needle. 9. Anaesthetic in between for open skin. 10. Cleansing the skin. 11. Reviewing the result and adjusting if needed. 12. After 6-8 weeks repeat the treatment to build up pigment in layers on top of each other.
- **hoe-herken-je-een-goede-permanente-make-up-salon** _body[6].paragraphs[0]_
  - NL: Op social media en websites staan vaak alleen foto's van werk wat net geplaatst is. Dit is dus direct na de behandeling. En met permanente make up moet je wel begrijpen dat na de eerste behandeling zo'n 40-60% verdwijnt. Het resultaat wat je dus hebt net nadat het is geplaatst, e
  - EN: On social media and websites there are often only photos of work that has just been placed. This is therefore immediately after the treatment. And with permanent makeup you do have to understand that after the first treatment around 40-60% disappears. The result you have just aft
- **hoe-worden-powder-brows-geplaatst-stap-voor-stap-uitleg** _body[6].paragraphs[0]_
  - NL: De nazorg van powder brows is ontzettend belangrijk. Als je de nazorgregels niet naleeft kan het pigment grotendeels oplossen. Zo wordt er bijvoorbeeld afgeraden om binnen 7-14 dagen te zonnen, in zout water te zwemmen en peelings te ondergaan. Al deze factoren zorgen er namelijk
  - EN: The aftercare of powder brows is extremely important. If you do not follow the aftercare rules the pigment can largely dissolve. For example, it is advised not to sunbathe, swim in salt water or undergo peels within 7-14 days. All these factors cause the pigment to dissolve more 
- **alles-over-ombre-powder-brows** _excerpt_
  - NL: Ombré Powder Brows is een semi-permanente wenkbrauwbehandeling waarbij pixels worden geplaatst voor een natuurlijk poedereffect. De behandeling houdt ongeveer 2-3 jaar en vereist een vervolgafspraak na 6-8 weken.
  - EN: Ombré Powder Brows is a semi-permanent eyebrow treatment in which pixels are placed for a natural powder effect. The treatment lasts about 2-3 years and requires a follow-up appointment after 6-8 weeks.
- **permanente-make-up-verwijderen** _body[5].paragraphs[1]_
  - NL: Daarnaast moet het gelaserde gebied volledig kunnen helen totdat er een nieuwe behandeling kan worden uitgevoerd. Gemiddeld tussen de 6 à 8 weken moet er tussen iedere behandeling zitten. Er zijn ongeveer 3 à 4 behandelingen nodig voordat je überhaupt het gewenste resultaat behaa
  - EN: In addition the lasered area must be able to heal fully before a new treatment can be carried out. On average between 6 and 8 weeks must elapse between each treatment. Approximately 3 to 4 treatments are needed before you achieve the desired result at all.
- **ombre-powder-brows-genezing-dag-per-dag** _body[2].paragraphs[1]_
  - NL: Je kunt lichte zwelling, wat roodheid en een strak gevoel ervaren. Dit is normaal en trekt vaak binnen 24-48 uur weg. Volg de nazorginstructies van je specialist nauwkeurig op.
  - EN: You may experience slight swelling, some redness and a tight feeling. This is normal and often subsides within 24-48 hours. Follow your specialist's aftercare instructions carefully.
- **permanente-make-up-voor-en-nadelen** _body[4].paragraphs[0]_
  - NL: Voordelen: het scheelt tijd in de ochtend; altijd mooie wenkbrauwen, eyeliner of lippen; zwemmen, sauna en sporten met mooie wenkbrauwen; milde behandeling qua pijn; het ziet er verzorgd uit; het blijft vaak 3-4 jaar of zelfs langer zitten; littekentjes verhullen; lippen voller l
  - EN: Advantages: it saves time in the morning; always beautiful eyebrows, eyeliner or lips; swimming, sauna and exercising with beautiful eyebrows; mild treatment in terms of pain; it looks well-groomed; it often stays for 3-4 years or even longer; concealing small scars; making lips 

## CUSTOMER_AFTERCARE_REVIEW_REQUIRED (114 flags across 27 posts)

Affected posts: `5-dingen-die-je-moet-weten-voordat-je-pmu-laat-zetten`, `5-redenen-om-te-kiezen-voor-permanente-make-up`, `airbrush-brows`, `alles-over-ombre-powder-brows`, `allround-pmu-opleiding-blog`, `faux-freckles-sproetjes-tattoo`, `het-helingsproces-van-pmu`, `hoe-word-je-ggd-erkent-voor-permanente-make-up`, `hoe-worden-powder-brows-geplaatst-stap-voor-stap-uitleg`, `lip-blush-het-nieuwe-alternatief-voor-lip-fillers`, `lip-blushing-behandeling-nederland`, `make-up-na-powder-brows-behandeling`, `micro-scalp-pigmentatie`, `ombre-powder-brows-genezing-dag-per-dag`, `ombre-powder-brows-genezingsproces`, `permanente-make-up-blijft-niet-zitten`, `permanente-make-up-na-een-week`, `permanente-make-up-onderschat`, `permanente-make-up-tijdens-zwanger`, `permanente-make-up-vereist-nazorg`, `permanente-make-up-verwijderen`, `permanente-make-up-voor-en-nadelen`, `permanente-make-up-zwangerschap`, `pmu-reach-regelement-2022`, `pmu-wenkbrauwen-nazorg`, `vervagen-powder-brows-en-waarom`, `wat-zijn-powder-brows`

Representative examples:

- **lip-blushing-behandeling-nederland** _body[1].paragraphs[4]_
  - NL: Permanente lipstickvervanging — geniet 2-3 jaar lang van jouw favoriete kleur zonder dagelijks make-up aan te brengen.
  - EN: Permanent lipstick replacement — enjoy your favourite colour for 2-3 years without applying makeup daily.
- **5-redenen-om-te-kiezen-voor-permanente-make-up** _body[5].paragraphs[1]_
  - NL: Permanente make-up blijft echter zitten, zelfs na het zwemmen of zweten. Dit betekent dat je de hele dag door kunt genieten van een perfecte look zonder dat je je zorgen hoeft te maken over het bijwerken van je make-up.
  - EN: Permanent makeup, however, stays put, even after swimming or sweating. This means you can enjoy a perfect look all day long without having to worry about touching up your makeup.
- **hoe-word-je-ggd-erkent-voor-permanente-make-up** _body[0].paragraphs[0]_
  - NL: De GGD is er in Nederland voor alle hygiëne- en veiligheidsmaatregelen. Zij hebben voor heel Nederland bepaald wat wel en wat niet kan tijdens en voor het plaatsen van permanente make up. Vandaar dat je persoonlijk, en met jouw ruimte, door een keuring heen moet voordat je offici
  - EN: The GGD is there in the Netherlands for all hygiene and safety measures. They have determined for the whole of the Netherlands what is and is not allowed during and before placing permanent makeup. That is why you personally, and with your space, have to go through an inspection 
- **hoe-worden-powder-brows-geplaatst-stap-voor-stap-uitleg** _body[0].paragraphs[1]_
  - NL: De stappen op een rij: 1. Nadenken en voorbeelden zoeken van wat je mooi vindt. 2. Intakegesprek plannen. 3. Vorm tekenen. 4. Pigmentkeuze. 5. De behandeling. 6. Nazorg.
  - EN: The steps in a row: 1. Think and look for examples of what you find beautiful. 2. Schedule an intake consultation. 3. Draw the shape. 4. Pigment choice. 5. The treatment. 6. Aftercare.
- **alles-over-ombre-powder-brows** _body[3].paragraphs[1]_
  - NL: Het helingsproces start vrijwel gelijk. Net als bij een tatoeage zul je korstjes krijgen. Deze korstjes mag je er absoluut niet vanaf peuteren of trekken. Wanneer je dat wel doet kun je een gedeelte pigment meetrekken of het helingsproces in de weg zitten. Zo creëer je namelijk h
  - EN: The healing process starts almost immediately. Just as with a tattoo you will get scabs. You absolutely must not pick or pull these scabs off. When you do that you can pull a portion of pigment with them or get in the way of the healing process. This is how you create the zebra e
- **permanente-make-up-verwijderen** _body[4].paragraphs[1]_
  - NL: Je mag tussen de behandelingen door niet onder de zonnebank of in de zon zitten. Dit omdat er toch een bepaalde wond ontstaat, en wanneer je in de zon gaat kan de wond gaan infecteren of pigmenteren. Ook kun je beter even niet pittig eten direct na de behandeling, sporten, of in 
  - EN: Between treatments you may not use a tanning bed or sit in the sun. This is because a certain wound does form, and when you go in the sun the wound can become infected or pigment. It is also better not to eat spicy food immediately after the treatment, exercise, or sit in the sau
- **pmu-wenkbrauwen-nazorg** _title_
  - NL: PMU Wenkbrauwen Nazorg — wat werkt het beste?
  - EN: PMU Eyebrow Aftercare — what works best?
- **ombre-powder-brows-genezing-dag-per-dag** _category_
  - NL: Nazorg
  - EN: Nazorg

## CUSTOMER_PRICE_REVIEW_REQUIRED (16 flags across 13 posts)

Affected posts: `5-dingen-die-je-moet-weten-voordat-je-pmu-laat-zetten`, `faux-freckles-pmu-online-training`, `hoe-herken-je-een-goede-permanente-make-up-salon`, `hoe-word-je-ggd-erkent-voor-permanente-make-up`, `hoe-worden-powder-brows-geplaatst-stap-voor-stap-uitleg`, `how-to-get-a-permanent-natural-eyelash-curl`, `lip-blushing-behandeling-nederland`, `lucky-8-800-korting-op-een-beginnersopleiding`, `microblading-cons`, `microblading-nadelen`, `ombre-powder-brows-opleiding-cursus`, `permanente-make-up-verwijderen`, `sproetjes-tattoo-permanent-make-up-online-cursus`

Representative examples:

- **lip-blushing-behandeling-nederland** _body[6].paragraphs[0]_
  - NL: Weinig salons bieden Lip Pigmentatie onder €300-€350 aan. Lagere prijzen kunnen duiden op onervaren practitioners. Dit betekent niet automatisch slechte kwaliteit, maar vraag naar ervaring en portfolio. Het gemiddelde in Nederland bedraagt €350-€600 per behandeling, gebaseerd op 
  - EN: Few salons offer Lip Pigmentation under €300-€350. Lower prices can indicate inexperienced practitioners. This does not automatically mean poor quality, but ask about experience and portfolio. The average in the Netherlands is €350-€600 per treatment, based on a comparison of sev
- **hoe-herken-je-een-goede-permanente-make-up-salon** _body[7].paragraphs[0]_
  - NL: Permanente make up prijzen lopen echt geheel uit elkaar. Zo kun je terecht voor powder brows voor rond de €200,- tot wel €750,-. Dit is puur in Nederland, want de beste professionals in Amerika vragen gemakkelijk zo'n $1500,- dollar. En ja, je hebt er normaliter mega veel plezier
  - EN: Permanent makeup prices really vary widely. You can go for powder brows for around €200 up to as much as €750. This is purely in the Netherlands, because the best professionals in America easily charge around $1,500. And yes, you normally get a huge amount of enjoyment from it, b
- **hoe-word-je-ggd-erkent-voor-permanente-make-up** _body[1].paragraphs[0]_
  - NL: Het is belangrijk om precies de juiste producten te gebruiken tijdens je GGD-keuring. Gebruik je de verkeerde producten, dan heb je de kans dat de GGD weggaat en een nieuwe afspraak met je maakt. Dit kost je uiteindelijk naast de €324,67 ook nog eens €108,22 per uur extra tijdens
  - EN: It is important to use exactly the right products during your GGD inspection. If you use the wrong products, you have the chance that the GGD leaves and makes a new appointment with you. This ultimately costs you, in addition to the €324.67, another €108.22 per hour extra during 
- **hoe-worden-powder-brows-geplaatst-stap-voor-stap-uitleg** _body[2].paragraphs[0]_
  - NL: Een intakegesprek kun je meestal online plannen bij de salon. Vaak wordt hier een vergoeding van €50,- voor in rekening gebracht. Als jij en de salon besluiten de wenkbrauwen te behandelen zal deze 50 euro gereduceerd worden van de behandelprijs.
  - EN: You can usually schedule an intake consultation online at the salon. Often a fee of €50 is charged for this. If you and the salon decide to treat the eyebrows, this 50 euros will be deducted from the treatment price.
- **permanente-make-up-verwijderen** _body[6].paragraphs[0]_
  - NL: Uiteraard is dat bij iedere kliniek weer verschillend. Wij hebben 10 verschillende plekken vergeleken die gecertificeerd zijn in het verwijderen van permanente make up. Gemiddeld liggen de kosten van die 10 klinieken tussen de €75,- en €150,- per behandeling. Dit is een prijs geb
  - EN: Of course this differs at every clinic. We compared 10 different places that are certified in removing permanent makeup. On average the costs at those 10 clinics lie between €75 and €150 per treatment. This is a price based only on removing permanent makeup on the eyebrows.
- **microblading-nadelen** _body[3].paragraphs[0]_
  - NL: Hier hebben we een heel simpel antwoord op: om microblading te kunnen doen, vergt geen grote investering. Het mesje kost amper iets, en de cursus ook. Vandaar dat er overal microblading wordt aangeboden. Soms zelfs nog voor een vrij hoge prijs ook — denk maar aan dat sommige salo
  - EN: We have a very simple answer to this: being able to do microblading does not require a large investment. The blade costs barely anything, and the course neither. That is why microblading is offered everywhere. Sometimes even still at a fairly high price as well — just think of th
- **sproetjes-tattoo-permanent-make-up-online-cursus** _body[1].paragraphs[3]_
  - NL: Ons advies: kies een bedrag rond de €150 à €250. Als je straks alleen maar klanten hebt die hun halve gezicht vol willen hebben, en daarbij ook nog een touch-up na 6 weken, dan ben je toch dik 2 uur kwijt aan die klant en heb je amper omzet.
  - EN: Our advice: choose an amount around €150 to €250. If you end up only having clients who want half their face filled, plus a touch-up after 6 weeks as well, then you will still spend well over 2 hours on that client and barely make any turnover.
- **faux-freckles-pmu-online-training** _body[1].paragraphs[3]_
  - NL: Our advice: choose an amount around €150 to €250. If you only have customers who want to have half of their face done, and also a touch-up after 6 weeks, then you will need more than 2 hours and hardly have any turnover.
  - EN: Our advice: choose an amount around €150 to €250. If you only have customers who want to have half of their face done, and also a touch-up after 6 weeks, then you will need more than 2 hours and hardly have any turnover.

## CUSTOMER_GGD_DATA_REVIEW_REQUIRED (42 flags across 16 posts)

Affected posts: `allround-pmu-opleiding-blog`, `failed-permanent-make-up`, `het-helingsproces-van-pmu`, `hoe-herken-je-een-goede-permanente-make-up-salon`, `hoe-word-je-ggd-erkent-voor-permanente-make-up`, `hoe-worden-powder-brows-geplaatst-stap-voor-stap-uitleg`, `lip-blushing-behandeling-nederland`, `make-up-na-powder-brows-behandeling`, `ombre-powder-brows-genezingsproces`, `permanente-make-up-mislukt`, `permanente-make-up-tijdens-zwanger`, `permanente-make-up-vereist-nazorg`, `permanente-make-up-voor-en-nadelen`, `pmu-reach-regelement-2022`, `vervagen-powder-brows-en-waarom`, `wat-zijn-powder-brows`

Representative examples:

- **lip-blushing-behandeling-nederland** _body[5].paragraphs[0]_
  - NL: Bij het kiezen van een salon voor pigmentatie is vertrouwen essentieel. IZZI Beauty adviseert: Google-reviews en website-testimonials lezen, je goed inlezen over de behandeling, social media-portfolio's bekijken, GGD-certificering controleren en navragen wat er gebeurt bij compli
  - EN: When choosing a salon for pigmentation, trust is essential. IZZI Beauty advises: read Google reviews and website testimonials, research the treatment thoroughly, look at social media portfolios, check GGD certification and ask what happens in the event of complications.
- **hoe-herken-je-een-goede-permanente-make-up-salon** _body[1].heading_
  - NL: 1. Check of de salon GGD goedgekeurd is
  - EN: 1. Check whether the salon is GGD approved
- **hoe-word-je-ggd-erkent-voor-permanente-make-up** _title_
  - NL: Hoe word je GGD erkend voor permanente make up
  - EN: How do you become GGD recognised for permanent makeup
- **hoe-worden-powder-brows-geplaatst-stap-voor-stap-uitleg** _body[6].paragraphs[1]_
  - NL: Op de website van de GGD is te vinden wat een juiste nazorg is. Daarnaast hoort een salon dit standaard mee te geven na een behandeling zodat je het thuis nogmaals kunt doornemen. Hoe beter je nazorg, hoe langer je plezier hebt van de behandeling.
  - EN: On the GGD website you can find what proper aftercare is. In addition a salon should give you this as standard after a treatment so you can go through it again at home. The better your aftercare, the longer you enjoy the treatment.
- **permanente-make-up-mislukt** _body[3].paragraphs[1]_
  - NL: Enkele tips: check of de salon GGD-goedgekeurd is, bekijk de social media van de salon, lees reviews, bezoek de website, stel vragen, bekijk geheeld werk van de salon, vergelijk prijzen, luister naar ervaringen van anderen en ga op je gevoel af.
  - EN: A few tips: check whether the salon is GGD-approved, look at the salon's social media, read reviews, visit the website, ask questions, look at healed work from the salon, compare prices, listen to other people's experiences and go with your feeling.
- **permanente-make-up-voor-en-nadelen** _body[3].paragraphs[0]_
  - NL: Alle GGD-goedgekeurde specialisten die permanente make up plaatsen weten dat alle inkt- en pigmentstoffen aan strenge eisen moeten voldoen. Dat wordt namelijk ook gecontroleerd door de Voedsel en Waren Autoriteit.
  - EN: All GGD-approved specialists who place permanent makeup know that all ink and pigment substances must meet strict requirements. That is also checked by the Voedsel en Waren Autoriteit.
- **failed-permanent-make-up** _body[3].paragraphs[0]_
  - NL: Key prevention steps include: checking GGD approval, reviewing salon social media and reviews, visiting the website, asking questions, examining overall work quality, comparing prices, considering recommendations, and trusting your instincts.
  - EN: Key prevention steps include: checking GGD approval, reviewing salon social media and reviews, visiting the website, asking questions, examining overall work quality, comparing prices, considering recommendations, and trusting your instincts.
- **pmu-reach-regelement-2022** _body[2].heading_
  - NL: Wat voor regels komen er volgens de GGD en het RIVM?
  - EN: What kind of rules are coming according to the GGD and the RIVM?

## CUSTOMER_CREDENTIAL_REVIEW_REQUIRED (10 flags across 4 posts)

Affected posts: `alles-over-ombre-powder-brows`, `allround-pmu-opleiding-blog`, `jouw-perfecte-wenkbrauw-vorm-bepalen-in-4-stappen`, `lucky-8-800-korting-op-een-beginnersopleiding`

Representative examples:

- **alles-over-ombre-powder-brows** _body[0].paragraphs[0]_
  - NL: De techniek voor het maken van ombre powder brows bestaat simpelweg uit het plaatsen van de zogeheten 'dots' in de gewenste wenkbrauwvorm. Door deze dots te plaatsen — ook wel pixels genoemd — creëer je een natuurlijke shading in een bepaalde pigmentkleur. Deze natuurlijke shadin
  - EN: The technique for creating ombre powder brows simply consists of placing the so-called 'dots' in the desired eyebrow shape. By placing these dots — also called pixels — you create a natural shading in a certain pigment colour. This natural shading is also called a powder effect. 
- **lucky-8-800-korting-op-een-beginnersopleiding** _body[3].paragraphs[1]_
  - NL: Onze opleidingen zijn CRKBO-geregistreerd, waardoor ze van hoge kwaliteit en btw-vrij zijn. Je wordt intensief begeleid door IZZI Beauty-eigenaresse en master trainster Isabella Levels. Je doet examen op een echt model en kunt dus direct aan je portfolio werken.
  - EN: Our courses are CRKBO-registered, which means they are of high quality and VAT-free. You are intensively guided by IZZI Beauty owner and master trainer Isabella Levels. You take your exam on a real model and can therefore start working on your portfolio immediately.
- **allround-pmu-opleiding-blog** _body[4].paragraphs[0]_
  - NL: Powder Brows, Lip Blush, Faux Freckles en Infralash. CRKBO-erkende opleiding. Max. 2 studenten per opleiding. Inclusief startpakket. Kleurenleer, naaldenleer, brow- en lip mapping en oefenen op latex.
  - EN: Powder Brows, Lip Blush, Faux Freckles and Infralash. CRKBO-recognised course. Max. 2 students per course. Includes starter kit. Colour theory, needle theory, brow and lip mapping, and practising on latex.
- **jouw-perfecte-wenkbrauw-vorm-bepalen-in-4-stappen** _title_
  - NL: Jouw perfecte wenkbrauwvorm bepalen in 4 stappen
  - EN: Determine your perfect eyebrow shape in 4 steps

## CUSTOMER_PREGNANCY_REVIEW_REQUIRED (27 flags across 5 posts)

Affected posts: `hoe-worden-powder-brows-geplaatst-stap-voor-stap-uitleg`, `micro-scalp-pigmentatie`, `permanente-make-up-tijdens-zwanger`, `permanente-make-up-voor-en-nadelen`, `permanente-make-up-zwangerschap`

Representative examples:

- **hoe-worden-powder-brows-geplaatst-stap-voor-stap-uitleg** _body[2].paragraphs[1]_
  - NL: Soms besluit een salon niet te behandelen. Waarom? Je hebt te zichtbare oude permanente make up op; de vorm van de oude pmu is te zichtbaar; een klant twijfelt te veel; of er is een contra-indicatie. Contra-indicaties worden altijd doorgenomen met je wanneer je een intakegesprek 
  - EN: Sometimes a salon decides not to treat. Why? You have old permanent makeup that is too visible; the shape of the old PMU is too visible; a client doubts too much; or there is a contraindication. Contraindications are always gone through with you when you have an intake consultati
- **permanente-make-up-voor-en-nadelen** _body[1].paragraphs[3]_
  - NL: Er mag geen permanente make up geplaatst worden indien er sprake is van: verfallergie, hemofilie, chronische huidziekte, contactallergie, diabetes, immuunziekte of hart- en vaatafwijkingen. En uiteraard niet indien je jonger dan 16 bent of zwanger bent.
  - EN: Permanent makeup may not be placed if there is: dye allergy, haemophilia, chronic skin disease, contact allergy, diabetes, immune disease or cardiovascular abnormalities. And of course not if you are younger than 16 or are pregnant.
- **permanente-make-up-tijdens-zwanger** _title_
  - NL: Permanente make up tijdens zwangerschap
  - EN: Permanent makeup during pregnancy
- **micro-scalp-pigmentatie** _body[3].paragraphs[0]_
  - NL: Niet iedereen kan een scalp pigmentatie behandeling ondergaan. Scalp pigmentatie kan niet worden toegepast wanneer je lijdt aan diabetes, momenteel chemobehandelingen ondergaat, lijdt aan een immuunziekte, bloedverdunnende medicijnen gebruikt, zwanger bent, actieve huidziektes he
  - EN: Not everyone can undergo a scalp pigmentation treatment. Scalp pigmentation cannot be applied if you suffer from diabetes, are currently undergoing chemotherapy, suffer from an immune disease, use blood-thinning medication, are pregnant, have active skin diseases, have active pso
- **permanente-make-up-zwangerschap** _title_
  - NL: Permanente make up als je zwanger bent
  - EN: Permanent makeup if you are pregnant

## CUSTOMER_PROMO_REVIEW_REQUIRED (8 flags across 2 posts)

Affected posts: `5-dingen-die-je-moet-weten-voordat-je-pmu-laat-zetten`, `lucky-8-800-korting-op-een-beginnersopleiding`

Representative examples:

- **lucky-8-800-korting-op-een-beginnersopleiding** _title_
  - NL: Lucky 8: ontvang € 800 korting op een beginnersopleiding
  - EN: Lucky 8: receive € 800 off a beginners' course
- **5-dingen-die-je-moet-weten-voordat-je-pmu-laat-zetten** _body[3].paragraphs[1]_
  - NL: Daarnaast is het een misverstand dat het duurder is op jaarbasis dan andere wenkbrauwbehandelingen. Je bent voor een brow lift of shaping met verven al gauw €50 per 2 à 3 weken kwijt. Dit is op jaarbasis al een minimumuitgave van €800. Powder Brows plaatsen is dan veel goedkoper,
  - EN: In addition it is a misconception that it is more expensive on an annual basis than other eyebrow treatments. For a brow lift or shaping with tinting you are quickly spending €50 every 2 to 3 weeks. On an annual basis this is already a minimum expenditure of €800. Having Powder B

## CUSTOMER_PAIN_CLAIM_REVIEW_REQUIRED (24 flags across 13 posts)

Affected posts: `5-dingen-die-je-moet-weten-voordat-je-pmu-laat-zetten`, `alles-over-ombre-powder-brows`, `faux-freckles-permanente-make-up`, `faux-freckles-sproetjes-tattoo`, `hoe-kan-je-pmu-corrigeren`, `hoe-kun-je-het-best-wenkbrauwen-epileren-izzi-brows`, `hoe-worden-powder-brows-geplaatst-stap-voor-stap-uitleg`, `lip-blush-het-nieuwe-alternatief-voor-lip-fillers`, `lip-blush-pmu`, `lip-blushing-behandeling-nederland`, `permanente-make-up-verwijderen`, `permanente-make-up-voor-en-nadelen`, `verschil-microblading-en-powder-brows`

Representative examples:

- **lip-blushing-behandeling-nederland** _body[2].paragraphs[0]_
  - NL: De behandeling wordt over het algemeen als pijnlijker ervaren dan Powder Brows, omdat de lippenhuid (lippenrood) dunner is. IZZI Beauty gebruikt verdoving voorafgaand en tijdens de behandeling. Hoewel het een gevoeliger gebied is, duurt de behandeling korter door het kleinere opp
  - EN: The treatment is generally experienced as more painful than Powder Brows, because the lip skin (the vermilion) is thinner. IZZI Beauty uses anaesthetic beforehand and during the treatment. Although it is a more sensitive area, the treatment is shorter because of the smaller surfa
- **faux-freckles-permanente-make-up** _body[1].paragraphs[0]_
  - NL: Faux Freckles worden geplaatst door middel van een naaldje waar gewone permanente make up ook mee geplaatst kan worden; denk aan eyeliner, powder brows en lip blushing. Door de huid aan te stippen middels de naald en deze ongeveer 1 seconde in de huid te laten trillen, worden er 
  - EN: Faux Freckles are placed using a needle that can also be used for regular permanent makeup; think of eyeliner, powder brows and lip blushing. By dabbing the skin with the needle and letting it vibrate in the skin for about 1 second, small freckles are created. When the needle tou
- **hoe-worden-powder-brows-geplaatst-stap-voor-stap-uitleg** _body[5].paragraphs[0]_
  - NL: De behandeling wordt pas uitgevoerd wanneer er akkoord is gegeven op de getekende vorm en het gekozen pigment. Wanneer we starten met een behandeling wordt er standaard uitgelegd hoe we te werk gaan. Ook leggen we je uit wat een verdoving doet en wanneer we dit gebruiken. De beha
  - EN: The treatment is only carried out when approval has been given on the drawn shape and the chosen pigment. When we start a treatment it is explained as standard how we work. We also explain to you what an anaesthetic does and when we use it. The treatment is often experienced as v
- **alles-over-ombre-powder-brows** _seoDescription_
  - NL: Een Ombré Powder Brows is vrijwel pijnloos en het is dé techniek om je wenkbrauwen te transformeren tot strakke & natuurlijke brows!
  - EN: An Ombré Powder Brows is virtually painless and it is the technique to transform your eyebrows into tight & natural brows!
- **hoe-kun-je-het-best-wenkbrauwen-epileren-izzi-brows** _body[3].paragraphs[2]_
  - NL: Is epileren met touw pijnlijk? Ja vaak wel. Maar het hangt af van een aantal dingen: heb je een lage of hoge pijngrens, heb je dunne of dikke haren en heb je veel haartjes in de wenkbrauw. Er is voor deze methode helaas ook geen manier van verdovingscrème.
  - EN: Is epilating with thread painful? Yes, often it is. But it depends on a number of things: do you have a low or high pain threshold, do you have thin or thick hairs and do you have a lot of hairs in the eyebrow. Unfortunately there is also no way of using anaesthetic cream for thi
- **permanente-make-up-verwijderen** _body[1].paragraphs[1]_
  - NL: De behandeling wordt niet volledig als pijnloos ervaren. Er worden namelijk met een laser energiepulsen in de huid aangebracht. De energie dringt dus wat dieper de huid binnen om de inkt uit de huid te halen.
  - EN: The treatment is not experienced as completely painless. Energy pulses are applied into the skin with a laser. The energy therefore penetrates somewhat deeper into the skin to extract the ink from the skin.
- **permanente-make-up-voor-en-nadelen** _body[4].paragraphs[2]_
  - NL: Permanente make up behandelingen zouden vrijwel pijnloos uitgevoerd moeten worden. Heb je een pijnlijke behandeling ondergaan? Dan kan dit inhouden dat de specialist niet op een juiste manier heeft behandeld. Te diep behandelen zorgt voor een grijze en grauwe ondertoon die pas na
  - EN: Permanent makeup treatments should be carried out virtually painlessly. Have you undergone a painful treatment? Then this can mean that the specialist has not treated in the correct way. Treating too deep causes a grey and dull undertone that only comes to the surface after a whi
- **faux-freckles-sproetjes-tattoo** _body[4].paragraphs[0]_
  - NL: Het tatoeëren van je wangen en neus klinkt inderdaad erg pijnlijk, maar veel PMU-stylistes gebruiken een verdovende crème om de pijn te voorkomen. Ons gezicht is rijk aan zenuwuiteinden en daarom kan de behandeling een beetje onaangenaam zijn wanneer je dit doet zonder verdoving.
  - EN: Tattooing your cheeks and nose does indeed sound very painful, but many PMU stylists use an anaesthetic cream to prevent the pain. Our face is rich in nerve endings and therefore the treatment can be a little unpleasant when you do this without anaesthetic. After anaesthetic has 

## CUSTOMER_REGULATORY_REVIEW_REQUIRED (6 flags across 1 posts)

Affected posts: `pmu-reach-regelement-2022`

Representative examples:

- **pmu-reach-regelement-2022** _title_
  - NL: Permanente make up REACH-reglement 2022
  - EN: Permanent makeup REACH regulation 2022

## CUSTOMER_REMOVAL_CLAIM_REVIEW_REQUIRED (29 flags across 3 posts)

Affected posts: `hoe-kan-je-pmu-corrigeren`, `permanente-make-up-verwijderen`, `wat-als-permanente-make-up-is-mislukt`

Representative examples:

- **permanente-make-up-verwijderen** _title_
  - NL: Permanente Make Up Verwijderen
  - EN: Removing Permanent Makeup
- **hoe-kan-je-pmu-corrigeren** _image_
  - NL: /media/izzi-beauty-20251110-da4c7e-laser3.jpg
  - EN: /media/izzi-beauty-20251110-da4c7e-laser3.jpg
- **wat-als-permanente-make-up-is-mislukt** _excerpt_
  - NL: Permanente make-up kan soms mislukken. Dit artikel behandelt zes mogelijke oplossingen, van het raadplegen van specialisten tot laserbehandelingen.
  - EN: Permanent makeup can sometimes go wrong. This article covers six possible solutions, from consulting specialists to laser treatments.

