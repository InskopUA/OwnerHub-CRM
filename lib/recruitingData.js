export const statuses = [
  ["new", "New Lead"],
  ["contact_attempted", "Contact Attempted"],
  ["initial_contact", "Initial Contact"],
  ["qualified", "Qualified"],
  ["docs_requested", "Documents Requested"],
  ["docs_received", "Documents Received"],
  ["quote_pending", "Insurance Quote Pending"],
  ["insurance_approved", "Insurance Approved"],
  ["insurance_rejected", "Insurance Rejected"],
  ["offer_presented", "Offer Presented"],
  ["agreement_sent", "Lease Agreement Sent"],
  ["agreement_signed", "Agreement Signed"],
  ["equipment_shipped", "Equipment Shipped"],
  ["inspection_pending", "Inspection Pending"],
  ["safety_onboarding", "Safety Onboarding"],
  ["dispatch_onboarding", "Dispatch Onboarding"],
  ["ready_first_load", "Ready for First Load"],
  ["first_load", "First Load Booked"],
  ["active", "Active Driver"],
  ["lost", "Not Interested / Lost"]
];

export const pipelineStatuses = [
  "new",
  "contact_attempted",
  "initial_contact",
  "qualified",
  "docs_requested",
  "docs_received",
  "quote_pending",
  "insurance_approved",
  "agreement_sent",
  "safety_onboarding",
  "dispatch_onboarding",
  "ready_first_load",
  "active",
  "lost"
];

export const statusMap = Object.fromEntries(statuses);

export const docLabels = {
  license: "Driver License",
  truckRegistration: "Truck Registration",
  trailerRegistration: "Trailer Registration",
  medicalCard: "Medical Card",
  truckInspection: "Truck Inspection",
  trailerInspection: "Trailer Inspection",
  w9: "W-9",
  voidedCheck: "Voided Check",
  leaseAgreement: "Owner Lease Agreement"
};

export const docStatuses = [
  ["not_requested", "Not Requested"],
  ["requested", "Requested"],
  ["received", "Received"],
  ["review", "Under Review"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["expired", "Expired"]
];

export const states = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
  "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY"
];

export const callSteps = {
  start: {
    say: {
      ru: "Здравствуйте! Меня зовут [HR NAME], я представляю [COMPANY]. Мы подключаем Owner-Operators с открытыми трейлерами на две машины. Вам сейчас удобно разговаривать?",
      en: "Hello! My name is [HR NAME], and I represent [COMPANY]. We work with Owner-Operators using open two-car trailers. Is now a good time to talk?"
    },
    help: "Выберите реальный ответ кандидата - система откроет нужную ветку разговора.",
    type: "options",
    key: "availability",
    options: [
      { v: "yes", ru: "Да, удобно", en: "Yes, now is good", next: "location" },
      { v: "later", ru: "Сейчас неудобно", en: "Not a good time", next: "schedule_later" },
      { v: "message", ru: "Сначала отправьте информацию", en: "Send information first", next: "send_info" },
      { v: "not_interested", ru: "Неинтересно", en: "Not interested", next: "lost_reason" }
    ]
  },
  schedule_later: {
    say: { ru: "Конечно. В какое время вам будет удобно, чтобы я перезвонила?", en: "Of course. What time would be convenient for me to call you back?" },
    type: "fields",
    fields: [["followDate", "date", "Дата"], ["followTime", "time", "Время"], ["followNote", "text", "Комментарий"]],
    next: "finish_followup"
  },
  send_info: {
    say: { ru: "Хорошо, я отправлю краткую информацию об условиях. Какой способ связи вам удобнее?", en: "Sure, I will send you a short overview of the terms. Which contact method works best for you?" },
    type: "options",
    key: "preferredContact",
    options: [
      { v: "WhatsApp", ru: "WhatsApp", en: "WhatsApp", next: "collect_contact" },
      { v: "SMS", ru: "SMS", en: "SMS", next: "collect_contact" },
      { v: "Email", ru: "Email", en: "Email", next: "collect_contact" }
    ]
  },
  collect_contact: {
    say: { ru: "Подскажите, пожалуйста, актуальный номер телефона или email.", en: "Please provide the best phone number or email address." },
    type: "fields",
    fields: [["phone", "tel", "Телефон"], ["email", "email", "Email"]],
    next: "finish_message"
  },
  lost_reason: {
    say: { ru: "Понимаю. Чтобы мы больше не беспокоили вас без необходимости, подскажите основную причину?", en: "Understood. To avoid unnecessary follow-ups, may I ask the main reason?" },
    type: "options",
    key: "lostReason",
    options: [
      { v: "Already contracted", ru: "Уже работает с другой компанией", en: "Already working with another company", next: "finish_lost" },
      { v: "Terms", ru: "Не подходят условия", en: "Terms do not work", next: "finish_lost" },
      { v: "No equipment", ru: "Нет подходящей техники", en: "No suitable equipment", next: "finish_lost" },
      { v: "Other", ru: "Другая причина", en: "Other reason", next: "finish_lost" }
    ]
  },
  location: {
    say: { ru: "Отлично. Подскажите, пожалуйста, в каком городе и штате вы сейчас находитесь?", en: "Great. What city and state are you currently based in?" },
    help: "Локация определяет доступность Local-маршрутов и ориентир по gross.",
    type: "fields",
    fields: [["city", "text", "City"], ["state", "state", "State"], ["zip", "text", "ZIP Code"]],
    next: "work_type"
  },
  work_type: {
    say: { ru: "Вы рассматриваете локальную работу с регулярным возвращением домой или OTR?", en: "Are you looking for local work with regular home time, or OTR?" },
    type: "options",
    key: "workPreference",
    options: [
      { v: "Local", ru: "Local", en: "Local", next: "local_pitch" },
      { v: "OTR", ru: "OTR", en: "OTR", next: "otr_pitch" },
      { v: "Both", ru: "Оба варианта", en: "Both options", next: "both_pitch" },
      { v: "Not sure", ru: "Пока не определился", en: "Not sure yet", next: "difference_pitch" }
    ]
  },
  local_pitch: {
    say: { ru: "На локальной работе мы обычно строим round trips в радиусе 200-300 миль. В подходящих локациях водитель возвращается домой практически каждый день или минимум четыре раза в неделю. Ориентировочный gross - $5,000-$7,000, rate per mile - около $2-$3.", en: "For local work, we usually build round trips within a 200-300 mile radius. In suitable markets, the driver can return home nearly every day or at least four times per week. Typical gross is $5,000-$7,000, with rates around $2-$3 per mile." },
    type: "options",
    key: "localReaction",
    options: [
      { v: "Interested", ru: "Подходит / интересно", en: "Interested", next: "home_time" },
      { v: "Need OTR", ru: "Хочет больше gross - обсудить OTR", en: "Wants higher gross - discuss OTR", next: "otr_pitch" },
      { v: "Questions", ru: "Есть вопросы", en: "Has questions", next: "custom_question" }
    ]
  },
  otr_pitch: {
    say: { ru: "На OTR ориентировочный gross составляет $6,000-$8,000 в неделю. Средний rate per mile - около $1.80. Ставка ниже локальной, но водитель проезжает больше миль и может сделать больший общий gross.", en: "For OTR, typical gross is $6,000-$8,000 per week. Average rate per mile is around $1.80. The rate is lower than local, but the driver runs more miles and can produce a higher overall gross." },
    type: "options",
    key: "otrReaction",
    options: [
      { v: "Interested", ru: "Подходит / интересно", en: "Interested", next: "home_time" },
      { v: "Need Local", ru: "Хочет чаще дома - обсудить Local", en: "Wants more home time - discuss Local", next: "local_pitch" },
      { v: "Questions", ru: "Есть вопросы", en: "Has questions", next: "custom_question" }
    ]
  },
  both_pitch: {
    say: { ru: "Мы можем проверить оба варианта под вашу локацию. Local обычно даёт более высокий rate per mile и больше home time, а OTR позволяет сделать больше gross за счёт большего пробега.", en: "We can evaluate both options for your location. Local usually offers a higher rate per mile and more home time, while OTR can produce more gross through higher mileage." },
    type: "options",
    key: "preferredAfterPitch",
    options: [
      { v: "Local", ru: "Больше интересует Local", en: "More interested in Local", next: "home_time" },
      { v: "OTR", ru: "Больше интересует OTR", en: "More interested in OTR", next: "home_time" },
      { v: "Both", ru: "Рассматривать оба", en: "Consider both", next: "home_time" }
    ]
  },
  difference_pitch: {
    say: { ru: "Коротко объясню разницу: Local - меньше миль, выше rate и больше времени дома. OTR - больше миль, ниже rate, но потенциально выше общий gross. Какой вариант вам ближе?", en: "Here is the difference: Local means fewer miles, a higher rate, and more home time. OTR means more miles, a lower rate, but potentially higher total gross. Which option fits you better?" },
    type: "options",
    key: "workPreference",
    options: [
      { v: "Local", ru: "Local", en: "Local", next: "home_time" },
      { v: "OTR", ru: "OTR", en: "OTR", next: "home_time" },
      { v: "Both", ru: "Оба", en: "Both", next: "home_time" }
    ]
  },
  custom_question: {
    say: { ru: "Запишите вопрос кандидата и ответьте своими словами. После этого продолжите квалификацию.", en: "Record the candidate's question and answer it in your own words. Then continue qualification." },
    type: "fields",
    fields: [["candidateQuestion", "textarea", "Вопрос / комментарий"]],
    next: "home_time"
  },
  home_time: {
    say: { ru: "Насколько часто для вас важно возвращаться домой?", en: "How often do you need to return home?" },
    type: "options",
    key: "homeTime",
    options: [
      { v: "Daily", ru: "Каждый день", en: "Daily", next: "equipment_check" },
      { v: "4x weekly", ru: "Минимум 4 раза в неделю", en: "At least 4 times weekly", next: "equipment_check" },
      { v: "Weekly", ru: "Раз в неделю", en: "Weekly", next: "equipment_check" },
      { v: "2-3 weeks out", ru: "Готов быть 2-3 недели в дороге", en: "Can stay out 2-3 weeks", next: "equipment_check" },
      { v: "Flexible", ru: "Не принципиально", en: "Flexible", next: "equipment_check" }
    ]
  },
  equipment_check: {
    say: { ru: "У вас уже есть собственный truck и открытый trailer на две машины?", en: "Do you already own a truck and an open two-car trailer?" },
    type: "options",
    key: "hasEquipment",
    options: [
      { v: "Yes", ru: "Да, truck и trailer есть", en: "Yes, I have both", next: "truck_details" },
      { v: "Truck only", ru: "Есть только truck", en: "Truck only", next: "equipment_gap" },
      { v: "Trailer only", ru: "Есть только trailer", en: "Trailer only", next: "equipment_gap" },
      { v: "No", ru: "Нет своей техники", en: "No equipment", next: "equipment_gap" }
    ]
  },
  equipment_gap: {
    say: { ru: "Для подключения как Owner-Operator требуется собственный truck и подходящий открытый trailer на две машины. Запишем вашу ситуацию и можем сделать follow-up, когда техника будет готова.", en: "To onboard as an Owner-Operator, you need your own truck and a suitable open two-car trailer. We can record your situation and follow up when the equipment is ready." },
    type: "fields",
    fields: [["equipmentPlan", "textarea", "План / когда будет техника"], ["followDate", "date", "Follow-up date"]],
    next: "finish_nurture"
  },
  truck_details: {
    say: { ru: "Расскажите, пожалуйста, о вашем truck: марка, модель, год и техническое состояние.", en: "Please tell me about your truck: make, model, year, and condition." },
    type: "fields",
    fields: [["truck.make", "text", "Make"], ["truck.model", "text", "Model"], ["truck.year", "number", "Year"], ["truck.gvwr", "text", "GVWR"], ["truck.condition", "select:Good|Fair|Poor", "Condition"]],
    next: "trailer_details"
  },
  trailer_details: {
    say: { ru: "Теперь уточним trailer: марка, модель, год, длина и GVWR.", en: "Now let's confirm the trailer: make, model, year, length, and GVWR." },
    type: "fields",
    fields: [["trailer.make", "text", "Make"], ["trailer.model", "text", "Model"], ["trailer.year", "number", "Year"], ["trailer.length", "text", "Length"], ["trailer.gvwr", "text", "GVWR"], ["trailer.condition", "select:Good|Fair|Poor", "Condition"]],
    next: "experience"
  },
  experience: {
    say: { ru: "Какой у вас общий опыт вождения и сколько времени вы работаете в car hauling?", en: "How many years of driving experience do you have, and how long have you worked in car hauling?" },
    type: "fields",
    fields: [["experienceYears", "number", "Общий опыт, лет"], ["carHaulingYears", "number", "Car hauling, лет"], ["twoCarExperience", "select:Yes|No|Some", "Опыт two-car trailer"], ["cdl", "select:Yes|No", "CDL"]],
    next: "safety_record"
  },
  safety_record: {
    say: { ru: "Были ли у вас аварии, серьёзные нарушения или отказ страховой компании за последние годы?", en: "Have you had any accidents, serious violations, or prior insurance rejection in recent years?" },
    help: "Не обещайте одобрение. Финальное решение и стоимость даёт страховая компания после проверки.",
    type: "fields",
    fields: [["accidents", "text", "Аварии"], ["violations", "text", "Нарушения"], ["previousInsuranceRejection", "select:No|Yes", "Отказ страховой ранее"], ["medicalCard", "select:Yes|No|Not required", "Medical Card"]],
    next: "start_readiness"
  },
  start_readiness: {
    say: { ru: "Когда вы готовы начать работу и сколько дней в неделю планируете работать?", en: "When are you ready to start, and how many days per week do you plan to work?" },
    type: "fields",
    fields: [["startDate", "date", "Дата старта"], ["daysPerWeek", "number", "Дней в неделю"], ["restrictions", "textarea", "Ограничения по штатам / маршрутам"]],
    next: "terms"
  },
  terms: {
    say: { ru: "Наши условия: компания удерживает 10% от gross за dispatch. Выплаты каждую пятницу с задержкой в одну рабочую неделю. Страховка обычно $300-$400 в неделю, но точная цена зависит от driving record и quote страховой. При необходимости предоставляем fuel card.", en: "Our terms: the company charges 10% of gross for dispatch. Payments are made every Friday with a one-week hold. Insurance is typically $300-$400 per week, but the exact amount depends on the driving record and insurance quote. Fuel cards are available if needed." },
    type: "options",
    key: "termsReaction",
    options: [
      { v: "Accepted", ru: "Условия подходят", en: "Terms work for me", next: "documents" },
      { v: "Need details", ru: "Нужны дополнительные разъяснения", en: "Needs more details", next: "terms_question" },
      { v: "Declined", ru: "Условия не подходят", en: "Terms do not work", next: "finish_lost" }
    ]
  },
  terms_question: {
    say: { ru: "Запишите, что именно кандидат хочет уточнить, и объясните условия без обещания фиксированного gross или точной страховки.", en: "Record what the candidate wants clarified and explain the terms without promising a fixed gross or exact insurance cost." },
    type: "fields",
    fields: [["termsQuestion", "textarea", "Вопрос и результат обсуждения"]],
    next: "documents"
  },
  documents: {
    say: { ru: "Для начала insurance quote нам понадобятся Driver License, truck registration и trailer registration. Вы сможете отправить эти документы сегодня?", en: "To request an insurance quote, we need your Driver License, truck registration, and trailer registration. Can you send these documents today?" },
    type: "options",
    key: "documentsReady",
    options: [
      { v: "Today", ru: "Да, отправит сегодня", en: "Yes, today", next: "final_interest" },
      { v: "Later", ru: "Отправит позже", en: "Will send later", next: "doc_followup" },
      { v: "Missing", ru: "Некоторых документов нет", en: "Some documents are missing", next: "doc_followup" }
    ]
  },
  doc_followup: {
    say: { ru: "Когда лучше напомнить вам о документах?", en: "When should I remind you about the documents?" },
    type: "fields",
    fields: [["followDate", "date", "Дата follow-up"], ["followTime", "time", "Время"], ["followNote", "text", "Какие документы ожидаем"]],
    next: "final_interest"
  },
  final_interest: {
    say: { ru: "Отлично. После получения документов мы запросим insurance quote. Если страховая одобрит и стоимость подойдёт, отправим Owner Lease Agreement, logbook и signs, подключим safety и dispatch. Полный процесс обычно занимает 5-7 дней. Готовы начать онбординг?", en: "Great. After receiving the documents, we will request an insurance quote. If approved and the cost works for you, we will send the Owner Lease Agreement, logbook, and signs, then connect you with safety and dispatch. The full process usually takes 5-7 days. Are you ready to begin onboarding?" },
    type: "options",
    key: "finalInterest",
    options: [
      { v: "Ready", ru: "Да, готов", en: "Yes, ready", next: "finish_qualified" },
      { v: "Thinking", ru: "Нужно подумать", en: "Needs time to think", next: "thinking_followup" },
      { v: "No", ru: "Нет", en: "No", next: "finish_lost" }
    ]
  },
  thinking_followup: {
    say: { ru: "Хорошо. Когда лучше связаться с вами повторно?", en: "Understood. When should we follow up with you?" },
    type: "fields",
    fields: [["followDate", "date", "Дата"], ["followTime", "time", "Время"], ["followNote", "text", "Что нужно уточнить"]],
    next: "finish_thinking"
  },
  finish_followup: { finish: true, outcome: "followup", say: { ru: "Звонок завершён. Follow-up сохранён, кандидат останется на этапе Contact Attempted.", en: "Call completed. The follow-up is saved and the candidate remains at Contact Attempted." } },
  finish_message: { finish: true, outcome: "message", say: { ru: "Контакт сохранён. Отправьте информацию и поставьте follow-up после сообщения.", en: "Contact saved. Send the information and schedule a follow-up." } },
  finish_lost: { finish: true, outcome: "lost", say: { ru: "Кандидат отмечен как Not Interested / Lost. Причина сохранена в карточке.", en: "Candidate marked as Not Interested / Lost. The reason is saved in the profile." } },
  finish_nurture: { finish: true, outcome: "nurture", say: { ru: "Кандидат пока не готов по технике. Follow-up сохранён для повторного контакта.", en: "Candidate is not equipment-ready yet. A follow-up has been saved." } },
  finish_qualified: { finish: true, outcome: "qualified", say: { ru: "Кандидат квалифицирован. Следующий шаг - получить документы и отправить их на insurance quote.", en: "Candidate qualified. The next step is to collect documents and request an insurance quote." } },
  finish_thinking: { finish: true, outcome: "thinking", say: { ru: "Кандидату нужно время. Follow-up сохранён, чтобы продолжить разговор.", en: "Candidate needs time. A follow-up has been saved." } }
};
