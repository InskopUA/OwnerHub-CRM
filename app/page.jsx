"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { hasSupabaseEnv, supabase } from "../lib/supabaseClient";
import {
  callSteps,
  docLabels,
  pipelineStatuses,
  normalizeCandidateStatus,
  states,
  statusMap,
  statuses
} from "../lib/recruitingData";

const defaultSettings = {
  companyName: "Sofia Logistics LLC",
  hubName: "OwnerHub HRM",
  hrName: "HR Manager",
  interfaceLanguage: "ru",
  defaultScriptLanguage: "ru",
  quoApiKey: "",
  quoSmsFrom: "",
  welcomeSmsEnabled: false,
  welcomeSmsTemplate: "Hello {{firstName}}, thank you for your application. We received your request, and our HR manager will contact you shortly.",
  offerProfile: {
    targetRole: "Owner-Operator with open 2-car trailer",
    equipment: "Own truck and open two-car trailer",
    geography: "US markets where Local or OTR lanes are available",
    localGross: "$5,000-$7,000 weekly gross",
    otrGross: "$6,000-$8,000 weekly gross",
    dispatchFee: "10% of gross",
    insuranceRange: "$300-$400 weekly estimate, final quote depends on driving record",
    paySchedule: "Every Friday with one business week hold",
    onboardingTimeline: "Usually 5-7 days after documents and insurance approval",
    requiredDocs: "Driver License, truck registration, trailer registration, inspections, W-9, voided check",
    disqualifiers: "No suitable equipment, unacceptable driving record, insurance rejection, not ready for owner-operator terms",
    doNotPromise: "Do not promise fixed gross, fixed insurance price, insurance approval, or guaranteed lanes",
    localPitch: "Local usually means fewer miles, higher rate per mile, and more home time when the location supports it.",
    otrPitch: "OTR usually means more miles and potentially higher total gross, with more time on the road."
  }
};

const interfaceCopy = {
  ru: {
    dashboard: "Dashboard",
    candidates: "Кандидаты",
    calls: "Скрипт звонка",
    pipeline: "Воронка",
    followups: "Follow-ups",
    analytics: "Аналитика",
    settings: "Настройки",
    logout: "Выйти",
    connected: "Supabase подключён",
    newCandidate: "Новый кандидат",
    addFollowup: "Follow-up",
    loadingData: "Загружаем данные...",
    checkingSession: "Проверяем сессию...",
    pageCandidateTitle: "Карточка кандидата",
    pageCandidateSubtitle: "Полный профиль, документы и путь онбординга",
    pageDashboardSubtitle: "",
    pageCandidatesSubtitle: "Единая база лидов и водителей",
    pageCallsSubtitle: "База знаний и интерактивный помощник HR",
    pagePipelineSubtitle: "Перемещайте кандидатов между этапами",
    pageFollowupsSubtitle: "План контактов и напоминаний",
    pageAnalyticsSubtitle: "Ежедневная продуктивность HR и звонков",
    pageSettingsSubtitle: "Supabase, Vercel и параметры системы",
    totalCandidates: "Всего кандидатов",
    fullLeadBase: "Полная база лидов",
    inProgress: "В работе",
    qualifiedAndStages: "Квалифицированы и проходят этапы",
    followupsToday: "Follow-ups сегодня",
    requireContactToday: "Требуют контакта сегодня",
    activeDrivers: "Активные водители",
    startedWork: "Успешно начали работу",
    pipelineByStatus: "Воронка по статусам",
    pipelineByStatusNote: "Быстрый обзор всей базы по этапам",
    allLeads: "Все лиды",
    percentBase: "{{percent}}% базы",
    recentCandidates: "Последние кандидаты",
    recentCandidatesNote: "Недавно добавленные и обновлённые лиды",
    noCandidatesYet: "Кандидатов пока нет",
    addFirstLead: "Добавьте первый лид, чтобы начать работу.",
    upcomingTasks: "Ближайшие задачи HR",
    noOpenFollowups: "Нет открытых follow-ups",
    contactsDone: "Все контакты обработаны.",
    candidatesByState: "Кандидаты по штатам",
    currentGeography: "География текущей базы",
    workFormatDistribution: "Распределение по формату",
    workFormatNote: "Local, OTR и универсальные кандидаты",
    candidate: "Кандидат",
    location: "Локация",
    format: "Формат",
    status: "Статус",
    score: "Score",
    candidateBase: "База кандидатов",
    foundCount: "Найдено: {{shown}} из {{total}}",
    searchCandidates: "Имя, телефон, город, техника...",
    allStates: "Все штаты",
    allStatuses: "Все статусы",
    reset: "Сбросить",
    importCsv: "Import CSV",
    work: "Работа",
    equipment: "Техника",
    nextContact: "Следующий контакт",
    quickActions: "Quick actions",
    script: "Скрипт",
    noResults: "Ничего не найдено",
    changeFilters: "Измените фильтры или добавьте нового кандидата.",
    contactPreferences: "Контакт и предпочтения",
    phone: "Телефон",
    email: "Email",
    language: "Язык",
    source: "Источник",
    homeTime: "Home time",
    readyToStart: "Готов начать",
    daysPerWeek: "Дней в неделю",
    expectedGross: "Ожидаемый gross",
    driver: "Водитель",
    experience: "Общий опыт",
    accidents: "Аварии",
    violations: "Нарушения",
    insuranceRejection: "Отказ страховой ранее",
    comments: "Комментарии",
    noComments: "Комментариев пока нет.",
    quoCallSummaries: "Quo call summaries",
    noQuoSummaries: "Quo summary пока нет.",
    receivedFiles: "Полученные файлы",
    noReceivedFiles: "Пока нет файлов из Quo messages.",
    openFile: "Открыть файл",
    documentType: "Тип документа",
    unassignedDocument: "Не назначено",
    receivedFromQuo: "Получено из Quo message",
    addDocument: "Добавить",
    documentLinkPrompt: "Вставьте ссылку на документ",
    deleteDocumentConfirm: "Удалить этот документ из карточки?",
    deleteFile: "Удалить файл",
    deleteFileConfirm: "Удалить этот файл из карточки?",
    summary: "Summary",
    nextSteps: "Next steps",
    callRecording: "Call recording",
    openRecording: "Open recording",
    restrictions: "Ограничения",
    onboardingProgress: "Прогресс онбординга",
    changeStage: "Изменить этап",
    documents: "Документы",
    activityHistory: "История активности",
    emptyHistory: "История пока пуста.",
    edit: "Редактировать",
    delete: "Удалить",
    deleteCandidate: "Удалить кандидата?",
    callScript: "Скрипт звонка",
    settingsTitle: "Настройки",
    company: "Компания",
    companyNote: "Используется в скрипте звонка.",
    hrName: "HR name",
    hrNameNote: "Подставляется в начало звонка.",
    interfaceLanguage: "Язык интерфейса",
    interfaceLanguageNote: "Меняет язык меню, таблиц, карточек и настроек.",
    russian: "Русский",
    english: "English",
    sync: "Синхронизация",
    syncNote: "Перезагрузить данные.",
    refreshData: "Обновить данные",
    save: "Сохранить",
    saveNote: "Записать настройки.",
    instruction: "Инструкция",
    webhookUrlNote: "Этот URL вставляется в HTTP module в Make.",
    personalToken: "Personal token",
    personalTokenNote: "При генерации нового токена старые токены удаляются. В Make должен использоваться только текущий token.",
    creating: "Создаём...",
    generateToken: "Generate new token",
    currentToken: "Current token",
    currentTokenNote: "Этот token можно копировать в любое время. Хранится только внутри текущего workspace.",
    tokenMissing: "Token ещё не создан",
    copyToken: "Copy token",
    tokenStatus: "Token status",
    tokenStatusNote: "В системе должен быть только один активный token. Новый token автоматически заменяет старый.",
    noTokens: "Токены ещё не созданы.",
    quoIntegration: "Quo Integration",
    quoWebhookUrl: "Quo Webhook URL",
    quoWebhookUrlNote: "Этот URL вставляется в Quo Settings → Webhooks.",
    quoTokenNote: "Новый Quo token заменяет старый. Используйте только текущий URL в Quo.",
    generateQuoWebhook: "Generate Quo webhook",
    quoSigningSecret: "Quo signing secret",
    quoSigningSecretNote: "В Quo откройте webhook details → Reveal signing secret и вставьте base64 secret сюда.",
    saveQuoSecret: "Save signing secret",
    quoEvents: "Events to enable",
    quoEventsNote: "В Quo выберите call.ringing, call.completed, call.summary.completed, call.recording.completed и message.received. Система привяжет live-звонки, summary, запись и фото документов к кандидату.",
    copyWebhookUrl: "Copy webhook URL",
    welcomeSms: "Welcome SMS",
    welcomeSmsNote: "Автоматически отправлять SMS новым лидам, которые приходят через Make.",
    sendWelcomeSms: "Отправлять welcome SMS новым лидам",
    quoApiKey: "Quo API key",
    quoApiKeyNote: "Нужен для отправки SMS через Quo. Вставьте API key из Quo.",
    quoSmsFrom: "Quo sender",
    quoSmsFromNote: "Укажите Quo phone number ID вида PN... Его можно получить через Quo API phone-numbers или в настройках номера.",
    welcomeSmsTemplate: "Текст welcome SMS",
    welcomeSmsTemplateNote: "Можно использовать {{firstName}}, {{lastName}}, {{fullName}}, {{companyName}}, {{hrName}}.",
    welcomeSmsSetupGuide: "Как настроить Welcome SMS",
    welcomeSmsGuideApiKey: "В Quo откройте API key и вставьте его в поле Quo API key.",
    welcomeSmsGuideSender: "В Quo docs откройте Phone Numbers → List phone numbers, нажмите Send и скопируйте id нужного номера. ID начинается с PN.",
    welcomeSmsGuideSave: "Вставьте PN... в Quo sender, включите Send welcome SMS to new leads и нажмите Save.",
    welcomeSmsGuideTest: "Для теста создайте новый лид через Make. SMS отправляется только новым лидам, не обновлениям существующих.",
    callInProgress: "Входящий звонок",
    callInProgressWith: "Входящий звонок от {{name}}",
    unknownIncomingCall: "Входящий звонок с {{phone}}",
    openProfile: "Открыть профиль",
    openScript: "Открыть скрипт",
    addCandidateFromCall: "Добавить кандидата",
    close: "Закрыть",
    done: "Готово",
    cancel: "Отмена",
    add: "Добавить",
    firstName: "Имя",
    lastName: "Фамилия",
    notSelected: "Не выбран",
    notSpecified: "Не указан",
    startDate: "Дата старта",
    note: "Комментарий",
    newCandidateModal: "Новый кандидат",
    editCandidateModal: "Редактировать кандидата",
    newFollowup: "Новый follow-up",
    date: "Дата",
    time: "Время",
    type: "Тип",
    chooseCandidate: "Выберите кандидата",
    whatToDo: "Что нужно сделать или уточнить",
    noContact: "Нет контакта",
    deletedCandidate: "Кандидат удалён",
    noComment: "Без комментария"
    ,
    analyticsTitle: "Продуктивность HR",
    analyticsNote: "Звонки по лидам в системе, время разговора, follow-ups и реальные касания по дням.",
    periodToday: "Сегодня",
    period7Days: "7 дней",
    period30Days: "30 дней",
    callsMade: "Звонков",
    talkTime: "Время разговора",
    leadsTouched: "Лидов в работе",
    newLeadsReceived: "Новых лидов пришло",
    followupsDone: "Follow-ups выполнено",
    productiveCalls: "Результативные звонки",
    activeWorkWindow: "Рабочее окно",
    productiveCallsNote: "Разговор 2+ мин или есть summary/запись",
    dailyBreakdown: "Разбивка по дням",
    dailyBreakdownNote: "Реальная работа HR по дням без массового импорта",
    selectedDate: "Дата",
    day: "День",
    newLeadsMetric: "Новые лиды",
    touchedLeadsMetric: "Лиды в работе",
    outbound: "Исходящие",
    incoming: "Входящие",
    avgCall: "Средний звонок",
    summariesMetric: "Summary",
    recordingsMetric: "Записи",
    followupsCreated: "FU создано",
    noAnalyticsData: "Нет активности за выбранный период.",
    workWindowNote: "От первого до последнего события за день",
    status_new: "Новый лид",
    status_contact_attempted: "Контакт",
    status_qualified: "Квалифицирован",
    status_docs_requested: "Документы",
    status_quote_pending: "Страховка",
    status_agreement_sent: "Договор",
    status_safety_onboarding: "Онбординг",
    status_active: "Активный водитель",
    status_lost: "Потерян",
    loginTitle: "OwnerHub HRM",
    loginSubtitle: "Войдите в Supabase аккаунт, чтобы открыть базу кандидатов.",
    password: "Password",
    wait: "Подождите...",
    login: "Войти",
    signup: "Создать аккаунт",
    createUser: "Создать нового пользователя",
    alreadyHaveAccount: "Уже есть аккаунт",
    overdue: "Просрочено",
    today: "Сегодня",
    upcoming: "Предстоящие",
    openTasks: "Открытых задач: {{count}}",
    taskPlan: "План контактов",
    noTasks: "Нет задач",
    csvTitle: "Import Facebook CSV",
    csvFiles: "CSV файлы из Facebook Leads",
    csvHint: "Можно выбрать несколько файлов сразу. Система читает UTF-8 и Facebook UTF-16 TSV, создаёт новых лидов и обновляет существующих по телефону или email.",
    csvReady: "Готово",
    csvFileCount: "Файлов: {{count}}",
    csvRows: "Строк прочитано: {{count}}",
    csvCreated: "Создано: {{count}}",
    csvUpdated: "Обновлено: {{count}}",
    csvSkipped: "Пропущено: {{count}}",
    importing: "Импортируем...",
    importAction: "Импортировать"
    ,
    knowledgeBase: "База знаний для звонков",
    knowledgeBaseNote: "Скрипты, условия, ответы на возражения и процесс онбординга. Можно редактировать под компанию.",
    searchKnowledge: "Поиск по скриптам, terms, objections...",
    allCategories: "Все категории",
    noKnowledgeFound: "Материалов не найдено",
    adjustKnowledgeSearch: "Измените поиск или добавьте первый материал базы знаний.",
    startCall: "Начать звонок",
    noCallCandidates: "Нет кандидатов для звонка.",
    howToUse: "Как использовать",
    knowledgeTip: "Держите здесь живую базу ответов: rates, insurance, документы, objection handling, follow-up wording. HR может быстро найти ответ во время звонка и обновить материал после новых кейсов.",
    recommendedBlocks: "Рекомендуемые блоки скрипта",
    noRecommendations: "Нет рекомендаций для текущего шага.",
    qualificationCall: "Квалификационный звонок",
    step: "шаг",
    callResultReady: "Результат готов к сохранению.",
    checkSummaryFinish: "Проверьте live summary и завершите звонок.",
    saveContinue: "Сохранить и продолжить",
    finishSave: "Завершить и сохранить",
    chooseAnswer: "Выберите ответ кандидата",
    liveNotes: "Заметки во время звонка",
    liveNotesPlaceholder: "Свободные комментарии...",
    choose: "Выберите",
    liveSummaryLocation: "Локация",
    callLanguageUpdated: "Язык звонка обновлён"
    ,
    newKnowledge: "Новый материал базы знаний",
    editKnowledge: "Редактировать материал",
    title: "Название",
    category: "Категория",
    order: "Порядок",
    content: "Содержание",
    knowledgeTitlePlaceholder: "Например: Возражение по insurance",
    knowledgeContentPlaceholder: "Текст, который HR может использовать во время звонка..."
  },
  en: {
    dashboard: "Dashboard",
    candidates: "Candidates",
    calls: "Call Script",
    pipeline: "Pipeline",
    followups: "Follow-ups",
    analytics: "Analytics",
    settings: "Settings",
    logout: "Log out",
    connected: "Supabase connected",
    newCandidate: "New Candidate",
    addFollowup: "Follow-up",
    loadingData: "Loading data...",
    checkingSession: "Checking session...",
    pageCandidateTitle: "Candidate Profile",
    pageCandidateSubtitle: "Full profile, documents, and onboarding path",
    pageDashboardSubtitle: "",
    pageCandidatesSubtitle: "Unified lead and driver database",
    pageCallsSubtitle: "Knowledge base and interactive HR assistant",
    pagePipelineSubtitle: "Move candidates between stages",
    pageFollowupsSubtitle: "Contact plan and reminders",
    pageAnalyticsSubtitle: "Daily HR productivity and call performance",
    pageSettingsSubtitle: "Supabase, Vercel, and system settings",
    totalCandidates: "Total Candidates",
    fullLeadBase: "Complete lead database",
    inProgress: "In Progress",
    qualifiedAndStages: "Qualified and moving through stages",
    followupsToday: "Follow-ups Today",
    requireContactToday: "Need contact today",
    activeDrivers: "Active Drivers",
    startedWork: "Successfully started work",
    pipelineByStatus: "Pipeline by Status",
    pipelineByStatusNote: "Quick overview of the whole database by stage",
    allLeads: "All Leads",
    percentBase: "{{percent}}% of base",
    recentCandidates: "Recent Candidates",
    recentCandidatesNote: "Recently added and updated leads",
    noCandidatesYet: "No candidates yet",
    addFirstLead: "Add the first lead to start working.",
    upcomingTasks: "Upcoming HR tasks",
    noOpenFollowups: "No open follow-ups",
    contactsDone: "All contacts are handled.",
    candidatesByState: "Candidates by State",
    currentGeography: "Current database geography",
    workFormatDistribution: "Work Format Distribution",
    workFormatNote: "Local, OTR, and flexible candidates",
    candidate: "Candidate",
    location: "Location",
    format: "Format",
    status: "Status",
    score: "Score",
    candidateBase: "Candidate Database",
    foundCount: "Found: {{shown}} of {{total}}",
    searchCandidates: "Name, phone, city, equipment...",
    allStates: "All States",
    allStatuses: "All Statuses",
    reset: "Reset",
    importCsv: "Import CSV",
    work: "Work",
    equipment: "Equipment",
    nextContact: "Next Contact",
    quickActions: "Quick actions",
    script: "Script",
    noResults: "Nothing found",
    changeFilters: "Change filters or add a new candidate.",
    contactPreferences: "Contact and Preferences",
    phone: "Phone",
    email: "Email",
    language: "Language",
    source: "Source",
    homeTime: "Home time",
    readyToStart: "Ready to start",
    daysPerWeek: "Days per week",
    expectedGross: "Expected gross",
    driver: "Driver",
    experience: "Experience",
    accidents: "Accidents",
    violations: "Violations",
    insuranceRejection: "Previous insurance rejection",
    comments: "Comments",
    noComments: "No comments yet.",
    quoCallSummaries: "Quo Call Summaries",
    noQuoSummaries: "No Quo summaries yet.",
    receivedFiles: "Received Files",
    noReceivedFiles: "No files from Quo messages yet.",
    openFile: "Open file",
    documentType: "Document type",
    unassignedDocument: "Unassigned",
    receivedFromQuo: "Received from Quo message",
    addDocument: "Add",
    documentLinkPrompt: "Paste document link",
    deleteDocumentConfirm: "Delete this document from the profile?",
    deleteFile: "Delete file",
    deleteFileConfirm: "Delete this file from the profile?",
    summary: "Summary",
    nextSteps: "Next steps",
    callRecording: "Call recording",
    openRecording: "Open recording",
    restrictions: "Restrictions",
    onboardingProgress: "Onboarding Progress",
    changeStage: "Change stage",
    documents: "Documents",
    activityHistory: "Activity History",
    emptyHistory: "No activity yet.",
    edit: "Edit",
    delete: "Delete",
    deleteCandidate: "Delete candidate?",
    callScript: "Call Script",
    settingsTitle: "Settings",
    company: "Company",
    companyNote: "Used in the call script.",
    hrName: "HR name",
    hrNameNote: "Inserted at the beginning of the call.",
    interfaceLanguage: "Interface Language",
    interfaceLanguageNote: "Changes the language of menus, tables, cards, and settings.",
    russian: "Русский",
    english: "English",
    sync: "Sync",
    syncNote: "Reload data.",
    refreshData: "Refresh data",
    save: "Save",
    saveNote: "Save settings.",
    instruction: "Guide",
    webhookUrlNote: "Paste this URL into the HTTP module in Make.",
    personalToken: "Personal token",
    personalTokenNote: "Generating a new token deletes old tokens. Make should use only the current token.",
    creating: "Creating...",
    generateToken: "Generate new token",
    currentToken: "Current token",
    currentTokenNote: "You can copy this token anytime. It is stored only inside the current workspace.",
    tokenMissing: "Token has not been created yet",
    copyToken: "Copy token",
    tokenStatus: "Token status",
    tokenStatusNote: "There should be only one active token. A new token automatically replaces the old one.",
    noTokens: "No tokens created yet.",
    quoIntegration: "Quo Integration",
    quoWebhookUrl: "Quo Webhook URL",
    quoWebhookUrlNote: "Paste this URL into Quo Settings → Webhooks.",
    quoTokenNote: "A new Quo token replaces the old one. Use only the current URL in Quo.",
    generateQuoWebhook: "Generate Quo webhook",
    quoSigningSecret: "Quo signing secret",
    quoSigningSecretNote: "In Quo, open webhook details → Reveal signing secret and paste the base64 secret here.",
    saveQuoSecret: "Save signing secret",
    quoEvents: "Events to enable",
    quoEventsNote: "In Quo, select call.ringing, call.completed, call.summary.completed, call.recording.completed, and message.received. The system links live calls, summaries, recordings, and document photos to the candidate.",
    copyWebhookUrl: "Copy webhook URL",
    welcomeSms: "Welcome SMS",
    welcomeSmsNote: "Automatically send an SMS to new leads that arrive through Make.",
    sendWelcomeSms: "Send welcome SMS to new leads",
    quoApiKey: "Quo API key",
    quoApiKeyNote: "Required to send SMS through Quo. Paste your API key from Quo.",
    quoSmsFrom: "Quo sender",
    quoSmsFromNote: "Enter the Quo phone number ID in PN... format. You can get it from Quo API phone-numbers or number settings.",
    welcomeSmsTemplate: "Welcome SMS text",
    welcomeSmsTemplateNote: "You can use {{firstName}}, {{lastName}}, {{fullName}}, {{companyName}}, {{hrName}}.",
    welcomeSmsSetupGuide: "How to set up Welcome SMS",
    welcomeSmsGuideApiKey: "In Quo, open API key and paste it into Quo API key.",
    welcomeSmsGuideSender: "In Quo docs, open Phone Numbers → List phone numbers, click Send, and copy the id for the sending number. The id starts with PN.",
    welcomeSmsGuideSave: "Paste PN... into Quo sender, enable Send welcome SMS to new leads, and click Save.",
    welcomeSmsGuideTest: "To test, create a new lead through Make. SMS is sent only to new leads, not existing lead updates.",
    callInProgress: "Incoming call",
    callInProgressWith: "Incoming call from {{name}}",
    unknownIncomingCall: "Incoming call from {{phone}}",
    openProfile: "Open profile",
    openScript: "Open script",
    addCandidateFromCall: "Add candidate",
    close: "Close",
    done: "Done",
    cancel: "Cancel",
    add: "Add",
    firstName: "First name",
    lastName: "Last name",
    notSelected: "Not selected",
    notSpecified: "Not specified",
    startDate: "Start date",
    note: "Comment",
    newCandidateModal: "New Candidate",
    editCandidateModal: "Edit Candidate",
    newFollowup: "New follow-up",
    date: "Date",
    time: "Time",
    type: "Type",
    chooseCandidate: "Choose candidate",
    whatToDo: "What should be done or clarified",
    noContact: "No contact",
    deletedCandidate: "Candidate deleted",
    noComment: "No comment",
    analyticsTitle: "HR Productivity",
    analyticsNote: "Calls linked to system leads, talk time, follow-ups, and real touches by day.",
    periodToday: "Today",
    period7Days: "7 days",
    period30Days: "30 days",
    callsMade: "Calls",
    talkTime: "Talk time",
    leadsTouched: "Leads touched",
    newLeadsReceived: "New leads received",
    followupsDone: "Follow-ups done",
    productiveCalls: "Productive calls",
    activeWorkWindow: "Work window",
    productiveCallsNote: "Talk time 2+ min or has summary/recording",
    dailyBreakdown: "Daily breakdown",
    dailyBreakdownNote: "Real HR work by day without bulk imports",
    selectedDate: "Date",
    day: "Day",
    newLeadsMetric: "New leads",
    touchedLeadsMetric: "Touched leads",
    outbound: "Outbound",
    incoming: "Incoming",
    avgCall: "Avg call",
    summariesMetric: "Summaries",
    recordingsMetric: "Recordings",
    followupsCreated: "FU created",
    noAnalyticsData: "No activity in the selected period.",
    workWindowNote: "From first to last event of the day",
    status_new: "New Lead",
    status_contact_attempted: "Contacting",
    status_qualified: "Qualified",
    status_docs_requested: "Documents",
    status_quote_pending: "Insurance",
    status_agreement_sent: "Agreement",
    status_safety_onboarding: "Onboarding",
    status_active: "Active Driver",
    status_lost: "Lost",
    loginTitle: "OwnerHub HRM",
    loginSubtitle: "Sign in to your Supabase account to open the candidate database.",
    password: "Password",
    wait: "Please wait...",
    login: "Log in",
    signup: "Create account",
    createUser: "Create new user",
    alreadyHaveAccount: "Already have an account",
    overdue: "Overdue",
    today: "Today",
    upcoming: "Upcoming",
    openTasks: "Open tasks: {{count}}",
    taskPlan: "Contact Plan",
    noTasks: "No tasks",
    csvTitle: "Import Facebook CSV",
    csvFiles: "CSV files from Facebook Leads",
    csvHint: "You can choose multiple files at once. The system reads UTF-8 and Facebook UTF-16 TSV, creates new leads, and updates existing leads by phone or email.",
    csvReady: "Done",
    csvFileCount: "Files: {{count}}",
    csvRows: "Rows read: {{count}}",
    csvCreated: "Created: {{count}}",
    csvUpdated: "Updated: {{count}}",
    csvSkipped: "Skipped: {{count}}",
    importing: "Importing...",
    importAction: "Import"
    ,
    knowledgeBase: "Call Knowledge Base",
    knowledgeBaseNote: "Scripts, terms, objection handling, and onboarding process. Edit it for your company.",
    searchKnowledge: "Search scripts, terms, objections...",
    allCategories: "All categories",
    noKnowledgeFound: "No materials found",
    adjustKnowledgeSearch: "Change the search or add the first knowledge base item.",
    startCall: "Start Call",
    noCallCandidates: "No candidates available for a call.",
    howToUse: "How to use",
    knowledgeTip: "Keep a live answer base here: rates, insurance, documents, objection handling, and follow-up wording. HR can quickly find an answer during the call and update materials after new cases.",
    recommendedBlocks: "Recommended Script Blocks",
    noRecommendations: "No recommendations for the current step.",
    qualificationCall: "Qualification call",
    step: "step",
    callResultReady: "Result is ready to save.",
    checkSummaryFinish: "Check the live summary and finish the call.",
    saveContinue: "Save and continue",
    finishSave: "Finish and save",
    chooseAnswer: "Choose the candidate's answer",
    liveNotes: "Live Call Notes",
    liveNotesPlaceholder: "Free-form comments...",
    choose: "Choose",
    liveSummaryLocation: "Location",
    callLanguageUpdated: "Call language updated"
    ,
    newKnowledge: "New knowledge base item",
    editKnowledge: "Edit material",
    title: "Title",
    category: "Category",
    order: "Order",
    content: "Content",
    knowledgeTitlePlaceholder: "Example: Insurance objection",
    knowledgeContentPlaceholder: "Text HR can use during a call..."
  }
};

const I18nContext = createContext({ lang: "ru", t: (key) => key });

function translate(lang, key, params = {}) {
  const template = interfaceCopy[lang]?.[key] || interfaceCopy.ru[key] || key;
  return Object.entries(params).reduce((text, [param, value]) => text.replaceAll(`{{${param}}}`, String(value)), template);
}

function useI18n() {
  return useContext(I18nContext);
}

function readUiFromHash() {
  if (typeof window === "undefined") return {};
  const raw = window.location.hash.startsWith("#/") ? window.location.hash.slice(2) : "";
  const params = new globalThis.URLSearchParams(raw);
  const next = {};
  const view = params.get("view");
  if (view) next.view = view;
  const selectedCandidateId = params.get("selected");
  if (selectedCandidateId) next.selectedCandidateId = selectedCandidateId;
  const callCandidateId = params.get("call");
  if (callCandidateId) next.callCandidateId = callCandidateId;
  const pipelineSearch = params.get("pipelineSearch");
  if (pipelineSearch) next.pipelineSearch = pipelineSearch;
  const followFilter = params.get("followFilter");
  if (followFilter) next.followFilter = followFilter;
  const filters = {};
  ["search", "state", "status", "work"].forEach((key) => {
    const value = params.get(key);
    if (value) filters[key] = value;
  });
  if (Object.keys(filters).length) next.filters = filters;
  return next;
}

function writeUiToHash(ui) {
  if (typeof window === "undefined") return;
  const params = new globalThis.URLSearchParams();
  if (ui.view && ui.view !== "dashboard") params.set("view", ui.view);
  if (ui.selectedCandidateId) params.set("selected", ui.selectedCandidateId);
  if (ui.callCandidateId) params.set("call", ui.callCandidateId);
  if (ui.pipelineSearch) params.set("pipelineSearch", ui.pipelineSearch);
  if (ui.followFilter && ui.followFilter !== "open") params.set("followFilter", ui.followFilter);
  Object.entries(ui.filters || {}).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const nextHash = params.toString() ? `#/${params.toString()}` : "";
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
  }
}

function statusLabel(status, t) {
  return t(`status_${status}`) || statusMap[status] || status;
}

function localizedStatuses(t) {
  return statuses.map(([value]) => [value, statusLabel(value, t)]);
}

const knowledgeCategories = ["Opening", "Qualification", "Pay & Terms", "Insurance", "Documents", "Objections", "Process", "Custom"];

const defaultKnowledgeItems = [
  {
    category: "Opening",
    title: "Первое касание",
    content: "Здравствуйте! Меня зовут [HR NAME], я представляю [COMPANY]. Мы подключаем Owner-Operators с открытыми трейлерами на две машины. Вам сейчас удобно разговаривать?",
    tags: ["intro", "cold call"]
  },
  {
    category: "Qualification",
    title: "Базовая квалификация",
    content: "Уточнить: город/штат/ZIP, Local или OTR, есть ли свой truck и open 2-car trailer, CDL, общий опыт, опыт car hauling, аварии/violations, когда готов начать.",
    tags: ["checklist", "screening"]
  },
  {
    category: "Pay & Terms",
    title: "Условия работы",
    content: "Компания удерживает 10% от gross за dispatch. Выплаты каждую пятницу с задержкой в одну рабочую неделю. Local обычно $5,000-$7,000 gross, OTR обычно $6,000-$8,000 gross. Не обещать фиксированный gross.",
    tags: ["money", "terms"]
  },
  {
    category: "Insurance",
    title: "Insurance quote",
    content: "Ориентир insurance обычно $300-$400 в неделю, но точная цена зависит от driving record и quote страховой. Не обещать одобрение до проверки документов и driving record.",
    tags: ["insurance", "quote"]
  },
  {
    category: "Documents",
    title: "Документы для старта",
    content: "Для начала insurance quote нужны Driver License, truck registration и trailer registration. Позже понадобятся W-9, voided check, inspections, Owner Lease Agreement.",
    tags: ["docs", "onboarding"]
  },
  {
    category: "Objections",
    title: "Возражение: хочу больше gross",
    content: "Ответ: можем проверить OTR. Rate per mile ниже, чем Local, но больше miles и потенциально выше общий gross. Финальный вариант зависит от локации, техники и доступных lanes.",
    tags: ["objection", "gross"]
  },
  {
    category: "Process",
    title: "Процесс онбординга",
    content: "1. Квалификация кандидата. 2. Получаем документы. 3. Insurance quote. 4. Если approved и цена подходит - Owner Lease Agreement. 5. Logbook/signs. 6. Safety и dispatch onboarding. Обычно 5-7 дней.",
    tags: ["onboarding", "process"]
  }
];

const emptyTruck = () => ({
  make: "",
  model: "",
  year: "",
  vin: "",
  gvwr: "",
  fuel: "",
  condition: "",
  inspection: ""
});

const emptyTrailer = () => ({
  make: "",
  model: "",
  year: "",
  vin: "",
  length: "",
  gvwr: "",
  capacity: "2",
  type: "Open",
  condition: "",
  inspection: ""
});

const emptyDocs = () => Object.fromEntries(Object.keys(docLabels).map((key) => [key, "not_requested"]));

function blankCandidate() {
  const now = new Date().toISOString();
  return {
    id: `cand_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    language: "Russian",
    source: "",
    city: "",
    state: "",
    zip: "",
    workPreference: "",
    homeTime: "",
    startDate: "",
    daysPerWeek: "",
    restrictions: "",
    expectedGross: "",
    cdl: "",
    licenseType: "",
    experienceYears: "",
    carHaulingYears: "",
    twoCarExperience: "",
    accidents: "",
    violations: "",
    medicalCard: "",
    previousInsuranceRejection: "",
    truck: emptyTruck(),
    trailer: emptyTrailer(),
    docs: emptyDocs(),
    insurance: { status: "not_started", weeklyQuote: "", notes: "" },
    status: "new",
    score: 50,
    owner: "HR Manager",
    notes: "",
    lastContact: "",
    nextFollowUp: "",
    call: { stepId: "start", history: [], answers: {}, completed: false, language: "ru" },
    tags: [],
    demo: false
  };
}

const todayISO = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const fullName = (candidate) => `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Без имени";
const initials = (candidate) => ((candidate.firstName?.[0] || "") + (candidate.lastName?.[0] || "")).toUpperCase() || "?";
const valueOrDash = (value) => (value === undefined || value === null || value === "" ? "-" : value);
const mergeOfferProfile = (offer = {}) => ({ ...defaultSettings.offerProfile, ...(offer && typeof offer === "object" ? offer : {}) });

function fmtDate(value, withTime = false) {
  if (!value) return "-";
  const date = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU", withTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" });
}

function localDateKey(value) {
  if (!value) return "";
  const date = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function secondsBetween(start, end) {
  const startDate = new Date(start || "");
  const endDate = new Date(end || "");
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 1000));
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (!total) return "0m";
  const hours = Math.floor(total / 3600);
  const minutes = Math.round((total % 3600) / 60);
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes || 1}m`;
}

function buildDateRange(days, endDateValue = new Date().toISOString()) {
  const endDate = new Date(String(endDateValue).length === 10 ? `${endDateValue}T12:00:00` : endDateValue);
  if (Number.isNaN(endDate.getTime())) return buildDateRange(days);
  endDate.setHours(12, 0, 0, 0);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(endDate);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (days - index - 1));
    return localDateKey(date.toISOString());
  });
}

function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function setPath(obj, path, value) {
  const parts = path.split(".");
  let target = obj;
  parts.slice(0, -1).forEach((part) => {
    if (!target[part]) target[part] = {};
    target = target[part];
  });
  target[parts.at(-1)] = value;
}

function calculateScore(candidate) {
  let score = 35;
  if (candidate.city && candidate.state) score += 7;
  if (candidate.workPreference) score += 5;
  if (candidate.truck.make && candidate.trailer.make) score += 12;
  if (candidate.cdl) score += 4;
  if (Number(candidate.experienceYears) >= 2) score += 7;
  if (Number(candidate.carHaulingYears) >= 1) score += 8;
  if (candidate.accidents === "0" || candidate.accidents === "None") score += 7;
  if (candidate.violations === "0" || candidate.violations === "None") score += 6;
  if (candidate.startDate) score += 4;
  const received = Object.values(candidate.docs || {}).filter((status) => ["received", "review", "approved"].includes(status)).length;
  score += Math.min(5, received);
  if (candidate.previousInsuranceRejection === "Yes") score -= 15;
  if (candidate.truck.condition === "Poor" || candidate.trailer.condition === "Poor") score -= 12;
  return Math.max(0, Math.min(100, score));
}

function snakeCandidate(candidate, workspaceId) {
  return {
    id: candidate.id,
    workspace_id: workspaceId,
    first_name: candidate.firstName,
    last_name: candidate.lastName,
    phone: candidate.phone,
    email: candidate.email,
    language: candidate.language,
    source: candidate.source,
    city: candidate.city,
    state: candidate.state,
    zip: candidate.zip,
    work_preference: candidate.workPreference,
    home_time: candidate.homeTime,
    start_date: candidate.startDate || null,
    days_per_week: candidate.daysPerWeek ? Number(candidate.daysPerWeek) : null,
    restrictions: candidate.restrictions,
    expected_gross: candidate.expectedGross,
    cdl: candidate.cdl,
    license_type: candidate.licenseType,
    experience_years: candidate.experienceYears === "" ? null : Number(candidate.experienceYears),
    car_hauling_years: candidate.carHaulingYears === "" ? null : Number(candidate.carHaulingYears),
    two_car_experience: candidate.twoCarExperience,
    accidents: candidate.accidents,
    violations: candidate.violations,
    medical_card: candidate.medicalCard,
    previous_insurance_rejection: candidate.previousInsuranceRejection,
    status: candidate.status,
    score: calculateScore(candidate),
    owner_name: candidate.owner,
    notes: candidate.notes,
    last_contact: candidate.lastContact || null,
    next_follow_up: candidate.nextFollowUp || null,
    tags: candidate.tags || [],
    demo: candidate.demo || false
  };
}

function mapCandidate(row, equipment, docs, insurance, callState) {
  const truck = equipment.find((item) => item.candidate_id === row.id && item.equipment_type === "truck");
  const trailer = equipment.find((item) => item.candidate_id === row.id && item.equipment_type === "trailer");
  const candidateDocs = docs.filter((doc) => doc.candidate_id === row.id);
  const docsMap = emptyDocs();
  candidateDocs.forEach((doc) => {
    docsMap[doc.document_type] = doc.status;
  });
  const candidateInsurance = insurance.find((item) => item.candidate_id === row.id);
  const call = callState.find((item) => item.candidate_id === row.id);

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    phone: row.phone || "",
    email: row.email || "",
    language: row.language || "Russian",
    source: row.source || "",
    city: row.city || "",
    state: row.state || "",
    zip: row.zip || "",
    workPreference: row.work_preference || "",
    homeTime: row.home_time || "",
    startDate: row.start_date || "",
    daysPerWeek: row.days_per_week ?? "",
    restrictions: row.restrictions || "",
    expectedGross: row.expected_gross || "",
    cdl: row.cdl || "",
    licenseType: row.license_type || "",
    experienceYears: row.experience_years ?? "",
    carHaulingYears: row.car_hauling_years ?? "",
    twoCarExperience: row.two_car_experience || "",
    accidents: row.accidents || "",
    violations: row.violations || "",
    medicalCard: row.medical_card || "",
    previousInsuranceRejection: row.previous_insurance_rejection || "",
    truck: {
      ...emptyTruck(),
      make: truck?.make || "",
      model: truck?.model || "",
      year: truck?.year ?? "",
      vin: truck?.vin || "",
      gvwr: truck?.gvwr || "",
      fuel: truck?.fuel || "",
      condition: truck?.condition || "",
      inspection: truck?.inspection || ""
    },
    trailer: {
      ...emptyTrailer(),
      make: trailer?.make || "",
      model: trailer?.model || "",
      year: trailer?.year ?? "",
      vin: trailer?.vin || "",
      length: trailer?.length || "",
      gvwr: trailer?.gvwr || "",
      capacity: trailer?.capacity || "2",
      type: trailer?.body_type || "Open",
      condition: trailer?.condition || "",
      inspection: trailer?.inspection || ""
    },
    docs: docsMap,
    insurance: {
      status: candidateInsurance?.status || "not_started",
      weeklyQuote: candidateInsurance?.weekly_quote || "",
      notes: candidateInsurance?.notes || ""
    },
    status: normalizeCandidateStatus(row.status || "new"),
    score: row.score ?? 50,
    owner: row.owner_name || "HR Manager",
    notes: row.notes || "",
    lastContact: row.last_contact || "",
    nextFollowUp: row.next_follow_up || "",
    call: {
      stepId: call?.step_id || "start",
      history: Array.isArray(call?.history) ? call.history : [],
      answers: call?.answers && typeof call.answers === "object" ? call.answers : {},
      completed: call?.completed || false,
      language: call?.language || "ru"
    },
    tags: row.tags || [],
    demo: row.demo || false
  };
}

function mapFollowup(row) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    candidateId: row.candidate_id,
    date: row.followup_date,
    time: row.followup_time?.slice(0, 5) || "",
    type: row.type || "Call",
    note: row.note || "",
    status: row.status || "open",
    completedAt: row.completed_at || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapActivity(row) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    candidateId: row.candidate_id,
    type: row.type || "note",
    text: row.text || "",
    createdAt: row.created_at
  };
}

function mapKnowledgeItem(row) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    category: row.category || "Custom",
    title: row.title || "",
    content: row.content || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    sortOrder: row.sort_order ?? 0,
    active: row.active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapQuoCallEvent(row) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    candidateId: row.candidate_id,
    callId: row.call_id,
    eventType: row.event_type || "",
    fromNumber: row.from_number || "",
    toNumber: row.to_number || "",
    direction: row.direction || "",
    answeredAt: row.answered_at || "",
    completedAt: row.completed_at || "",
    summary: Array.isArray(row.summary) ? row.summary.filter(Boolean) : [],
    nextSteps: Array.isArray(row.next_steps) ? row.next_steps.filter(Boolean) : [],
    recordingUrl: row.recording_url || "",
    recordingType: row.recording_type || "",
    recordingDuration: row.recording_duration_seconds ?? "",
    recordingStoragePath: row.recording_storage_path || "",
    recordingImportedAt: row.recording_imported_at || "",
    importedAt: row.summary_imported_at || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapCandidateAttachment(row) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    candidateId: row.candidate_id,
    source: row.source || "quo_message",
    messageId: row.message_id || "",
    fromNumber: row.from_number || "",
    toNumber: row.to_number || "",
    direction: row.direction || "incoming",
    documentType: row.document_type || "",
    fileName: row.file_name || "",
    mimeType: row.mime_type || "",
    sizeBytes: row.size_bytes ?? "",
    externalUrl: row.external_url || "",
    storagePath: row.storage_path || "",
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapQuoLiveCall(row) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    candidateId: row.candidate_id,
    callId: row.call_id || "",
    eventType: row.event_type || "",
    fromNumber: row.from_number || "",
    toNumber: row.to_number || "",
    direction: row.direction || "",
    status: row.status || "ringing",
    conversationId: row.conversation_id || "",
    phoneNumberId: row.phone_number_id || "",
    startedAt: row.started_at || "",
    answeredAt: row.answered_at || "",
    completedAt: row.completed_at || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const normalizeQuoPhoneId = (value) => String(value || "").trim().toLowerCase();

function splitCandidateNotes(notes = "") {
  const text = String(notes || "");
  const marker = /(?:^|\n{2,})Quo call summary - /g;
  const matches = [...text.matchAll(marker)];
  if (!matches.length) return { comments: text.trim(), legacyQuoBlocks: [] };

  const firstStart = matches[0].index + (matches[0][0].startsWith("\n") ? matches[0][0].indexOf("Quo") : 0);
  const comments = text.slice(0, firstStart).trim();
  const legacyQuoBlocks = matches.map((match, index) => {
    const start = match.index + (match[0].startsWith("\n") ? match[0].indexOf("Quo") : 0);
    const nextMatch = matches[index + 1];
    const end = nextMatch ? nextMatch.index : text.length;
    return text.slice(start, end).trim();
  }).filter(Boolean);

  return { comments, legacyQuoBlocks };
}

function blankKnowledgeItem() {
  return {
    id: `kb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    category: "Custom",
    title: "",
    content: "",
    tags: [],
    sortOrder: 100,
    active: true
  };
}

function badgeClass(status) {
  const normalizedStatus = normalizeCandidateStatus(status);
  if (normalizedStatus === "active") return "badge-green";
  if (normalizedStatus === "lost") return "badge-red";
  if (["quote_pending", "docs_requested"].includes(normalizedStatus)) return "badge-orange";
  if (normalizedStatus === "qualified") return "badge-blue";
  if (normalizedStatus === "safety_onboarding") return "badge-purple";
  return "badge-gray";
}

function decodeLeadFile(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new globalThis.TextDecoder("utf-16le").decode(bytes.slice(2));
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new globalThis.TextDecoder("utf-16be").decode(bytes.slice(2));
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return new globalThis.TextDecoder("utf-8").decode(bytes.slice(3));
  const firstChunk = Array.from(bytes.slice(0, 120));
  const likelyUtf16Le = firstChunk.filter((byte, index) => index % 2 === 1 && byte === 0).length > 20;
  return new globalThis.TextDecoder(likelyUtf16Le ? "utf-16le" : "utf-8").decode(bytes);
}

function detectDelimiter(text) {
  const header = text.split(/\r?\n/)[0] || "";
  const tabCount = (header.match(/\t/g) || []).length;
  const commaCount = (header.match(/,/g) || []).length;
  const semicolonCount = (header.match(/;/g) || []).length;
  if (tabCount >= commaCount && tabCount >= semicolonCount && tabCount > 0) return "\t";
  if (semicolonCount > commaCount) return ";";
  return ",";
}

function parseDelimitedText(text, delimiter) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (quoted && next === "\"") {
        value += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && char === delimiter) {
      row.push(value);
      value = "";
      continue;
    }

    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

function normalizeLeadKey(key) {
  return String(key || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");
}

function cleanLeadValue(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^p:/i, "")
    .trim();
}

function normalizeImportedPhone(value) {
  return cleanLeadValue(value).replace(/[^\d+]/g, "");
}

function normalizeImportedEmail(value) {
  return cleanLeadValue(value).toLowerCase();
}

function importedPhoneKey(value) {
  return cleanLeadValue(value).replace(/\D/g, "");
}

function findImportedValue(row, aliases) {
  const aliasSet = new Set(aliases.map(normalizeLeadKey));
  const match = row.find((field) => aliasSet.has(field.key));
  return cleanLeadValue(match?.value);
}

function findImportedValueByPattern(row, patterns) {
  const match = row.find((field) => patterns.some((pattern) => field.key.includes(pattern)));
  return cleanLeadValue(match?.value);
}

function parseLeadName(name) {
  const cleaned = cleanLeadValue(name);
  if (!cleaned) return { firstName: "", lastName: "" };
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ")
  };
}

function detectLanguageFromRow(row) {
  const text = row.map((field) => `${field.rawKey} ${field.value}`).join(" ");
  if (/[а-яіїєґ]/i.test(text)) return "Russian";
  return "English";
}

function mapFacebookLeadRow(row, fileName) {
  const fullNameValue = findImportedValue(row, ["full_name", "full name", "name", "имя", "фио", "полное имя"]);
  const firstNameValue = findImportedValue(row, ["first_name", "first name", "first"]);
  const lastNameValue = findImportedValue(row, ["last_name", "last name", "last"]);
  const parsedName = parseLeadName(fullNameValue);
  const position = findImportedValueByPattern(row, ["position", "позицию", "подаетесь"]);
  const experience = findImportedValueByPattern(row, ["experience", "опыт"]);
  const equipment = findImportedValueByPattern(row, ["equipment", "оборудования"]);
  const leadId = findImportedValue(row, ["id", "lead_id", "lead id"]);
  const formName = findImportedValue(row, ["form_name", "form name"]);
  const campaignName = findImportedValue(row, ["campaign_name", "campaign name"]);
  const adsetName = findImportedValue(row, ["adset_name", "adset name"]);
  const adName = findImportedValue(row, ["ad_name", "ad name"]);
  const createdTime = findImportedValue(row, ["created_time", "created time"]);
  const usedKeys = new Set([
    "id", "lead_id", "created_time", "ad_id", "ad_name", "adset_id", "adset_name", "campaign_id", "campaign_name",
    "form_id", "form_name", "is_organic", "platform", "full_name", "first_name", "last_name", "phone_number",
    "phone", "email", "city", "state", "zip", "postal_code", "work_preference", "truck_make", "truck_model",
    "truck_year", "trailer_make", "trailer_model", "trailer_year"
  ]);

  const notes = [
    `Imported from Facebook CSV: ${fileName}`,
    leadId ? `Facebook lead ID: ${leadId}` : "",
    createdTime ? `Created time: ${createdTime}` : "",
    formName ? `Form: ${formName}` : "",
    campaignName ? `Campaign: ${campaignName}` : "",
    adsetName ? `Ad set: ${adsetName}` : "",
    adName ? `Ad: ${adName}` : "",
    position ? `Position answer: ${position}` : "",
    experience ? `Experience answer: ${experience}` : "",
    equipment ? `Equipment answer: ${equipment}` : ""
  ].filter(Boolean);

  const extraAnswers = row
    .filter((field) => field.value && !usedKeys.has(field.key) && !["position", "позицию", "подаетесь", "experience", "опыт", "equipment", "оборудования"].some((pattern) => field.key.includes(pattern)))
    .map((field) => `${field.rawKey}: ${cleanLeadValue(field.value)}`);
  if (extraAnswers.length) notes.push(`Form answers:\n${extraAnswers.join("\n")}`);

  const candidate = blankCandidate();
  const phone = normalizeImportedPhone(findImportedValue(row, ["phone_number", "phone number", "phone", "телефон", "номер телефона"]));
  const email = normalizeImportedEmail(findImportedValue(row, ["email", "e-mail", "почта"]));
  candidate.firstName = firstNameValue || parsedName.firstName;
  candidate.lastName = lastNameValue || parsedName.lastName;
  candidate.phone = phone;
  candidate.email = email;
  candidate.language = detectLanguageFromRow(row);
  candidate.source = formName ? `Facebook CSV - ${formName}` : "Facebook CSV";
  candidate.city = findImportedValue(row, ["city", "город"]);
  candidate.state = findImportedValue(row, ["state", "штат"]);
  candidate.zip = findImportedValue(row, ["zip", "postal_code", "postal code", "zipcode"]);
  candidate.workPreference = findImportedValue(row, ["work_preference", "work preference", "local_or_otr"]) || (/local/i.test(position) ? "Local" : "");
  candidate.truck.make = findImportedValue(row, ["truck_make", "truck make"]);
  candidate.truck.model = findImportedValue(row, ["truck_model", "truck model"]);
  candidate.truck.year = findImportedValue(row, ["truck_year", "truck year"]);
  candidate.trailer.make = findImportedValue(row, ["trailer_make", "trailer make"]);
  candidate.trailer.model = findImportedValue(row, ["trailer_model", "trailer model"]);
  candidate.trailer.year = findImportedValue(row, ["trailer_year", "trailer year"]);
  if (equipment && !candidate.truck.make && !candidate.truck.model) candidate.truck.model = equipment;
  candidate.twoCarExperience = experience;
  candidate.notes = notes.join("\n");
  candidate.tags = ["facebook", "csv-import"];
  candidate.createdAt = createdTime && !Number.isNaN(new Date(createdTime).getTime()) ? new Date(createdTime).toISOString() : candidate.createdAt;
  candidate.updatedAt = new Date().toISOString();

  return candidate.firstName || candidate.lastName || candidate.phone || candidate.email || candidate.notes ? candidate : null;
}

function parseFacebookLeadsText(text, fileName) {
  const delimiter = detectDelimiter(text);
  const rows = parseDelimitedText(text, delimiter);
  const headers = rows[0]?.map((header) => String(header || "").replace(/^\uFEFF/, "").trim()) || [];
  return rows.slice(1).map((cells) => {
    const row = headers.map((header, index) => ({
      rawKey: header,
      key: normalizeLeadKey(header),
      value: cells[index] || ""
    }));
    return mapFacebookLeadRow(row, fileName);
  }).filter(Boolean);
}

function mergeImportedCandidate(existing, imported) {
  const next = structuredClone(existing);
  const assign = (key) => {
    if (imported[key]) next[key] = imported[key];
  };
  ["firstName", "lastName", "phone", "email", "language", "source", "city", "state", "zip", "workPreference", "twoCarExperience"].forEach(assign);
  ["make", "model", "year"].forEach((key) => {
    if (imported.truck[key]) next.truck[key] = imported.truck[key];
    if (imported.trailer[key]) next.trailer[key] = imported.trailer[key];
  });
  const notes = [next.notes, imported.notes].filter(Boolean);
  next.notes = Array.from(new Set(notes)).join("\n\n");
  next.tags = Array.from(new Set([...(next.tags || []), ...(imported.tags || [])]));
  next.updatedAt = new Date().toISOString();
  return next;
}

function scoreClass(score) {
  if (score >= 80) return "green";
  if (score >= 55) return "yellow";
  return "red";
}

export default function RecruitingHub() {
  const [session, setSession] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const emptyDb = { settings: defaultSettings, candidates: [], followups: [], activities: [], knowledge: [], quoCalls: [], attachments: [] };
  const [db, setDb] = useState(emptyDb);
  const [liveCalls, setLiveCalls] = useState([]);
  const [ui, setUi] = useState(() => {
    const hashUi = readUiFromHash();
    return {
      view: "dashboard",
      selectedCandidateId: null,
      callCandidateId: null,
      pipelineSearch: "",
      followFilter: "open",
      ...hashUi,
      filters: { search: "", state: "", status: "", work: "", ...(hashUi.filters || {}) }
    };
  });
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3200);
  };

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadRemoteData();
    else {
      setWorkspace(null);
      setDb(emptyDb);
      setLiveCalls([]);
    }
  }, [session]);

  useEffect(() => {
    if (!workspace?.id || !session) return undefined;
    loadLiveCalls();
    const timer = globalThis.setInterval(loadLiveCalls, 5000);
    return () => globalThis.clearInterval(timer);
  }, [workspace?.id, session, db.settings.quoSmsFrom]);

  useEffect(() => {
    writeUiToHash(ui);
  }, [ui]);

  async function ensureWorkspace() {
    if (!session?.user?.id) throw new Error("Нет активной Supabase-сессии");

    const existing = await supabase
      .from("workspaces")
      .select("*")
      .eq("owner_user_id", session.user.id)
      .maybeSingle();

    if (existing.error) throw existing.error;
    if (existing.data) return existing.data;

    const created = await supabase
      .from("workspaces")
      .insert({
        owner_user_id: session.user.id,
        name: defaultSettings.hubName
      })
      .select("*")
      .single();

    if (created.error) throw created.error;
    return created.data;
  }

  async function loadRemoteData() {
    setLoading(true);
    try {
      const currentWorkspace = await ensureWorkspace();
      setWorkspace(currentWorkspace);

      const settingsResult = await supabase
        .from("app_settings")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .maybeSingle();

      if (settingsResult.error) throw settingsResult.error;

      if (!settingsResult.data) {
        const settingsPayload = {
          id: `settings_${currentWorkspace.id}`,
          workspace_id: currentWorkspace.id,
          company_name: defaultSettings.companyName,
          hub_name: defaultSettings.hubName,
          hr_name: defaultSettings.hrName,
          default_script_language: defaultSettings.defaultScriptLanguage,
          offer_profile: defaultSettings.offerProfile,
          quo_api_key: defaultSettings.quoApiKey,
          quo_sms_from: defaultSettings.quoSmsFrom,
          welcome_sms_enabled: defaultSettings.welcomeSmsEnabled,
          welcome_sms_template: defaultSettings.welcomeSmsTemplate
        };
        let insertedSettings = await supabase.from("app_settings").insert(settingsPayload);
        if (insertedSettings.error?.code === "42703") {
          delete settingsPayload.quo_api_key;
          delete settingsPayload.quo_sms_from;
          delete settingsPayload.welcome_sms_enabled;
          delete settingsPayload.welcome_sms_template;
          insertedSettings = await supabase.from("app_settings").insert(settingsPayload);
          if (insertedSettings.error?.code === "42703") {
            delete settingsPayload.offer_profile;
            insertedSettings = await supabase.from("app_settings").insert(settingsPayload);
          }
        }
        if (insertedSettings.error) throw insertedSettings.error;
      }

      const candidatesResult = await supabase
        .from("candidates")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("updated_at", { ascending: false });

      if (candidatesResult.error) throw candidatesResult.error;

      const [
        equipmentResult,
        docsResult,
        insuranceResult,
        callStateResult,
        followupsResult,
        activitiesResult,
        quoCallsResult,
        attachmentsResult
      ] = await Promise.all([
        supabase.from("candidate_equipment").select("*").eq("workspace_id", currentWorkspace.id),
        supabase.from("candidate_documents").select("*").eq("workspace_id", currentWorkspace.id),
        supabase.from("candidate_insurance").select("*").eq("workspace_id", currentWorkspace.id),
        supabase.from("candidate_call_state").select("*").eq("workspace_id", currentWorkspace.id),
        supabase.from("followups").select("*").eq("workspace_id", currentWorkspace.id).order("followup_date", { ascending: true }),
        supabase.from("activities").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }).limit(500),
        supabase.from("quo_call_events").select("*").eq("workspace_id", currentWorkspace.id).order("completed_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(500),
        supabase.from("candidate_attachments").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }).limit(500)
      ]);

      let knowledgeRows = [];
      const knowledgeResult = await supabase
        .from("call_knowledge_items")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false });

      if (knowledgeResult.error && knowledgeResult.error.code !== "42P01") throw knowledgeResult.error;
      if (!knowledgeResult.error) {
        knowledgeRows = knowledgeResult.data || [];
        if (!knowledgeRows.length) {
          const seedRows = defaultKnowledgeItems.map((item, index) => ({
            id: `kb_${Date.now().toString(36)}_${index}_${Math.random().toString(36).slice(2, 7)}`,
            workspace_id: currentWorkspace.id,
            category: item.category,
            title: item.title,
            content: item.content,
            tags: item.tags,
            sort_order: index,
            active: true
          }));
          const seeded = await supabase.from("call_knowledge_items").insert(seedRows).select("*");
          if (seeded.error) throw seeded.error;
          knowledgeRows = seeded.data || [];
        }
      }

      const errors = [
        equipmentResult.error,
        docsResult.error,
        insuranceResult.error,
        callStateResult.error,
        followupsResult.error,
        activitiesResult.error,
        quoCallsResult.error,
        attachmentsResult.error
      ].filter((error) => error && error.code !== "42P01");
      if (errors.length) throw errors[0];

      const settingsRow = settingsResult.data;
      setDb({
        settings: settingsRow
          ? {
              companyName: settingsRow.company_name,
              hubName: settingsRow.hub_name,
              hrName: settingsRow.hr_name,
              interfaceLanguage: settingsRow.offer_profile?.__interfaceLanguage || defaultSettings.interfaceLanguage,
              defaultScriptLanguage: settingsRow.default_script_language,
              quoApiKey: settingsRow.quo_api_key || "",
              quoSmsFrom: settingsRow.quo_sms_from || "",
              welcomeSmsEnabled: Boolean(settingsRow.welcome_sms_enabled),
              welcomeSmsTemplate: settingsRow.welcome_sms_template || defaultSettings.welcomeSmsTemplate,
              offerProfile: mergeOfferProfile(settingsRow.offer_profile)
            }
          : defaultSettings,
        candidates: (candidatesResult.data || []).map((row) =>
          mapCandidate(
            row,
            equipmentResult.data || [],
            docsResult.data || [],
            insuranceResult.data || [],
            callStateResult.data || []
          )
        ),
        followups: (followupsResult.data || []).map(mapFollowup),
        activities: (activitiesResult.data || []).map(mapActivity),
        knowledge: knowledgeRows.map(mapKnowledgeItem),
        quoCalls: quoCallsResult.error?.code === "42P01" ? [] : (quoCallsResult.data || []).map(mapQuoCallEvent),
        attachments: attachmentsResult.error?.code === "42P01" ? [] : (attachmentsResult.data || []).map(mapCandidateAttachment)
      });
    } catch (error) {
      notify(error.message || "Не удалось загрузить данные Supabase");
    } finally {
      setLoading(false);
    }
  }

  async function loadLiveCalls() {
    if (!workspace?.id) return;
    const configuredPhoneNumberId = normalizeQuoPhoneId(db.settings.quoSmsFrom);
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("quo_live_calls")
      .select("*")
      .eq("workspace_id", workspace.id)
      .in("status", ["ringing", "answered"])
      .gte("updated_at", fourHoursAgo)
      .order("updated_at", { ascending: false })
      .limit(5);
    if (error?.code === "42P01") {
      setLiveCalls([]);
      return;
    }
    if (error) return;
    const calls = (data || [])
      .map(mapQuoLiveCall)
      .filter((call) => !configuredPhoneNumberId || normalizeQuoPhoneId(call.phoneNumberId) === configuredPhoneNumberId);
    setLiveCalls(calls);
  }

  async function addActivity(candidateId, text, type = "note") {
    if (!workspace?.id) throw new Error("Workspace не инициализирован");
    const id = `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const row = { id, workspace_id: workspace.id, candidate_id: candidateId, text, type };
    const { error } = await supabase.from("activities").insert(row);
    if (error) throw error;
    setDb((current) => ({
      ...current,
      activities: [{ id, workspaceId: workspace.id, candidateId, text, type, createdAt: new Date().toISOString() }, ...current.activities]
    }));
  }

  async function saveCandidate(candidate, activityText = "Карточка кандидата обновлена", activityType = "edit") {
    if (!workspace?.id) throw new Error("Workspace не инициализирован");
    const next = { ...candidate, workspaceId: workspace.id, score: calculateScore(candidate) };
    const { error: candidateError } = await supabase.from("candidates").upsert(snakeCandidate(next, workspace.id));
    if (candidateError) throw candidateError;

    const equipmentRows = [
      {
        workspace_id: workspace.id,
        candidate_id: next.id,
        equipment_type: "truck",
        make: next.truck.make,
        model: next.truck.model,
        year: next.truck.year ? Number(next.truck.year) : null,
        vin: next.truck.vin,
        gvwr: next.truck.gvwr,
        fuel: next.truck.fuel,
        condition: next.truck.condition,
        inspection: next.truck.inspection,
        length: "",
        capacity: "",
        body_type: ""
      },
      {
        workspace_id: workspace.id,
        candidate_id: next.id,
        equipment_type: "trailer",
        make: next.trailer.make,
        model: next.trailer.model,
        year: next.trailer.year ? Number(next.trailer.year) : null,
        vin: next.trailer.vin,
        gvwr: next.trailer.gvwr,
        fuel: "",
        condition: next.trailer.condition,
        inspection: next.trailer.inspection,
        length: next.trailer.length,
        capacity: next.trailer.capacity,
        body_type: next.trailer.type
      }
    ];
    const { error: equipmentError } = await supabase
      .from("candidate_equipment")
      .upsert(equipmentRows, { onConflict: "candidate_id,equipment_type" });
    if (equipmentError) throw equipmentError;

    const docRows = Object.entries(next.docs || emptyDocs()).map(([documentType, status]) => ({
      workspace_id: workspace.id,
      candidate_id: next.id,
      document_type: documentType,
      status
    }));
    const { error: docsError } = await supabase
      .from("candidate_documents")
      .upsert(docRows, { onConflict: "candidate_id,document_type" });
    if (docsError) throw docsError;

    const { error: insuranceError } = await supabase.from("candidate_insurance").upsert({
      workspace_id: workspace.id,
      candidate_id: next.id,
      status: next.insurance.status,
      weekly_quote: next.insurance.weeklyQuote,
      notes: next.insurance.notes || ""
    });
    if (insuranceError) throw insuranceError;

    const { error: callError } = await supabase.from("candidate_call_state").upsert({
      workspace_id: workspace.id,
      candidate_id: next.id,
      step_id: next.call.stepId,
      history: next.call.history || [],
      answers: next.call.answers || {},
      completed: next.call.completed || false,
      language: next.call.language || "ru"
    });
    if (callError) throw callError;

    await addActivity(next.id, activityText, activityType);
    setDb((current) => {
      const exists = current.candidates.some((candidateItem) => candidateItem.id === next.id);
      return {
        ...current,
        candidates: exists
          ? current.candidates.map((candidateItem) => (candidateItem.id === next.id ? next : candidateItem))
          : [next, ...current.candidates]
      };
    });
    return next;
  }

  async function updateAttachmentDocumentType(attachment, documentType) {
    if (!workspace?.id) throw new Error("Workspace не инициализирован");
    const { data, error } = await supabase
      .from("candidate_attachments")
      .update({ document_type: documentType })
      .eq("workspace_id", workspace.id)
      .eq("id", attachment.id)
      .select("*")
      .single();
    if (error) throw error;

    let nextDocStatus = null;
    if (documentType) {
      const { error: docError } = await supabase
        .from("candidate_documents")
        .upsert({
          workspace_id: workspace.id,
          candidate_id: attachment.candidateId,
          document_type: documentType,
          status: "received"
        }, { onConflict: "candidate_id,document_type" });
      if (docError) throw docError;
      await addActivity(attachment.candidateId, `${docLabels[documentType] || documentType}: received from Quo message`, "document");
      nextDocStatus = "received";
    }

    setDb((current) => ({
      ...current,
      attachments: current.attachments.map((item) => (item.id === attachment.id ? mapCandidateAttachment(data) : item)),
      candidates: nextDocStatus
        ? current.candidates.map((candidate) => (
            candidate.id === attachment.candidateId
              ? { ...candidate, docs: { ...candidate.docs, [documentType]: nextDocStatus } }
              : candidate
          ))
        : current.candidates
    }));
  }

  async function deleteAttachment(attachment) {
    if (!workspace?.id) throw new Error("Workspace не инициализирован");
    const { error } = await supabase
      .from("candidate_attachments")
      .delete()
      .eq("workspace_id", workspace.id)
      .eq("id", attachment.id);
    if (error) throw error;

    await addActivity(attachment.candidateId, "Quo message attachment removed", "document");
    setDb((current) => ({
      ...current,
      attachments: current.attachments.filter((item) => item.id !== attachment.id)
    }));
  }

  async function addManualDocument(candidate, documentType, externalUrl) {
    if (!workspace?.id) throw new Error("Workspace не инициализирован");
    const id = `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const row = {
      id,
      workspace_id: workspace.id,
      candidate_id: candidate.id,
      source: "manual",
      message_id: `manual_${id}`,
      direction: "incoming",
      document_type: documentType,
      file_name: docLabels[documentType] || documentType,
      external_url: externalUrl,
      raw_payload: {}
    };

    const { data, error } = await supabase
      .from("candidate_attachments")
      .insert(row)
      .select("*")
      .single();
    if (error) throw error;

    const { error: docError } = await supabase
      .from("candidate_documents")
      .upsert({
        workspace_id: workspace.id,
        candidate_id: candidate.id,
        document_type: documentType,
        status: "received"
      }, { onConflict: "candidate_id,document_type" });
    if (docError) throw docError;

    await addActivity(candidate.id, `${docLabels[documentType] || documentType}: added manually`, "document");
    setDb((current) => ({
      ...current,
      attachments: [mapCandidateAttachment(data), ...current.attachments],
      candidates: current.candidates.map((item) => (
        item.id === candidate.id
          ? { ...item, docs: { ...item.docs, [documentType]: "received" } }
          : item
      ))
    }));
  }

  async function deleteCandidateDocument(candidate, documentType) {
    if (!workspace?.id) throw new Error("Workspace не инициализирован");
    const { error } = await supabase
      .from("candidate_attachments")
      .delete()
      .eq("workspace_id", workspace.id)
      .eq("candidate_id", candidate.id)
      .eq("document_type", documentType);
    if (error) throw error;

    const { error: docError } = await supabase
      .from("candidate_documents")
      .upsert({
        workspace_id: workspace.id,
        candidate_id: candidate.id,
        document_type: documentType,
        status: "not_requested"
      }, { onConflict: "candidate_id,document_type" });
    if (docError) throw docError;

    await addActivity(candidate.id, `${docLabels[documentType] || documentType}: document removed`, "document");
    setDb((current) => ({
      ...current,
      attachments: current.attachments.filter((item) => !(item.candidateId === candidate.id && item.documentType === documentType)),
      candidates: current.candidates.map((item) => (
        item.id === candidate.id
          ? { ...item, docs: { ...item.docs, [documentType]: "not_requested" } }
          : item
      ))
    }));
  }

  async function deleteCandidate(candidateId) {
    const { error } = await supabase.from("candidates").delete().eq("id", candidateId).eq("workspace_id", workspace.id);
    if (error) {
      notify(error.message);
      return;
    }
    setDb((current) => ({
      ...current,
      candidates: current.candidates.filter((candidate) => candidate.id !== candidateId),
      followups: current.followups.filter((followup) => followup.candidateId !== candidateId),
      activities: current.activities.filter((activity) => activity.candidateId !== candidateId)
    }));
    setUi((current) => ({ ...current, view: "candidates", selectedCandidateId: null, callCandidateId: null }));
    notify("Кандидат удалён");
  }

  async function createFollowup(candidateId, date, time, type, note) {
    if (!workspace?.id) throw new Error("Workspace не инициализирован");
    const id = `fu_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const row = {
      id,
      workspace_id: workspace.id,
      candidate_id: candidateId,
      followup_date: date,
      followup_time: time || null,
      type: type || "Call",
      note: note || "",
      status: "open"
    };
    const { error } = await supabase.from("followups").insert(row);
    if (error) throw error;
    await addActivity(candidateId, `Добавлен follow-up: ${fmtDate(date)} ${time || ""}`, "followup");
    setDb((current) => ({
      ...current,
      followups: [...current.followups, mapFollowup({ ...row, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })],
      candidates: current.candidates.map((candidate) =>
        candidate.id === candidateId ? { ...candidate, nextFollowUp: date, updatedAt: new Date().toISOString() } : candidate
      )
    }));
  }

  async function createNewLeadFollowup(candidateId) {
    const hasOpenFollowup = db.followups.some((item) => item.candidateId === candidateId && item.status === "open");
    if (hasOpenFollowup) return;
    await createFollowup(candidateId, todayISO(), "10:00", "Call", "Call new lead today");
  }

  async function createStatusFollowup(candidateId, status) {
    const openNotes = db.followups
      .filter((item) => item.candidateId === candidateId && item.status === "open")
      .map((item) => item.note);

    if (status === "docs_requested" && !openNotes.some((note) => note.includes("Check requested documents"))) {
      await createFollowup(candidateId, addDays(2), "10:00", "Documents", "Check requested documents");
    }

    if (status === "contact_attempted" && !openNotes.some((note) => note.includes("Second call attempt"))) {
      await createFollowup(candidateId, addDays(1), "10:00", "Call", "Second call attempt");
    }
  }

  async function completeFollowup(followupId) {
    const completedAt = new Date().toISOString();
    const { error } = await supabase
      .from("followups")
      .update({ status: "done", completed_at: completedAt })
      .eq("id", followupId)
      .eq("workspace_id", workspace.id);
    if (error) {
      notify(error.message);
      return;
    }
    const followup = db.followups.find((item) => item.id === followupId);
    if (followup) await addActivity(followup.candidateId, `Follow-up выполнен: ${followup.note}`, "followup");
    setDb((current) => ({
      ...current,
      followups: current.followups.map((item) =>
        item.id === followupId ? { ...item, status: "done", completedAt } : item
      )
    }));
  }

  async function snoozeFollowup(followupId) {
    const followup = db.followups.find((item) => item.id === followupId);
    if (!followup) return;
    const date = new Date(`${followup.date}T12:00:00`);
    date.setDate(date.getDate() + 1);
    const nextDate = date.toISOString().slice(0, 10);
    const { error } = await supabase
      .from("followups")
      .update({ followup_date: nextDate })
      .eq("id", followupId)
      .eq("workspace_id", workspace.id);
    if (error) {
      notify(error.message);
      return;
    }
    setDb((current) => ({
      ...current,
      followups: current.followups.map((item) => (item.id === followupId ? { ...item, date: nextDate } : item))
    }));
  }

  async function updateCandidateStatus(candidateId, status) {
    const candidate = db.candidates.find((item) => item.id === candidateId);
    if (!candidate) return;
    const oldStatus = candidate.status;
    const next = { ...candidate, status, updatedAt: new Date().toISOString() };
    try {
      await saveCandidate(next, `Статус: ${statusMap[oldStatus]} -> ${statusMap[status]}`, "status");
      await createStatusFollowup(candidateId, status);
      notify(`Кандидат перемещён: ${statusMap[status]}`);
    } catch (error) {
      notify(error.message);
    }
  }

  async function importCsvFiles(files) {
    if (!files.length) throw new Error("Выберите хотя бы один CSV файл");
    const phoneIndex = new Map();
    const emailIndex = new Map();
    db.candidates.forEach((candidate) => {
      const phoneKey = importedPhoneKey(candidate.phone);
      const emailKey = normalizeImportedEmail(candidate.email);
      if (phoneKey) phoneIndex.set(phoneKey, candidate);
      if (emailKey) emailIndex.set(emailKey, candidate);
    });

    const summary = { files: files.length, parsed: 0, created: 0, updated: 0, skipped: 0 };
    for (const file of files) {
      const text = decodeLeadFile(await file.arrayBuffer());
      const importedCandidates = parseFacebookLeadsText(text, file.name);
      summary.parsed += importedCandidates.length;

      for (const imported of importedCandidates) {
        const phoneKey = importedPhoneKey(imported.phone);
        const emailKey = normalizeImportedEmail(imported.email);
        const existing = (phoneKey && phoneIndex.get(phoneKey)) || (emailKey && emailIndex.get(emailKey));
        const next = existing ? mergeImportedCandidate(existing, imported) : imported;

        if (!next.phone && !next.email && !next.firstName && !next.lastName) {
          summary.skipped += 1;
          continue;
        }

        const saved = await saveCandidate(
          next,
          existing ? `CSV import обновил лида из ${file.name}` : `CSV import создал лида из ${file.name}`,
          existing ? "edit" : "create"
        );

        if (phoneKey) phoneIndex.set(phoneKey, saved);
        if (emailKey) emailIndex.set(emailKey, saved);

        if (existing) {
          summary.updated += 1;
        } else {
          summary.created += 1;
          await createNewLeadFollowup(saved.id);
        }
      }
    }
    return summary;
  }

  async function saveKnowledgeItem(item) {
    if (!workspace?.id) throw new Error("Workspace не инициализирован");
    const row = {
      id: item.id,
      workspace_id: workspace.id,
      category: item.category || "Custom",
      title: item.title || "Untitled",
      content: item.content || "",
      tags: Array.isArray(item.tags) ? item.tags : String(item.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
      sort_order: Number(item.sortOrder) || 100,
      active: item.active !== false
    };
    const { data, error } = await supabase.from("call_knowledge_items").upsert(row).select("*").single();
    if (error) throw error;
    const mapped = mapKnowledgeItem(data);
    setDb((current) => {
      const exists = current.knowledge.some((knowledgeItem) => knowledgeItem.id === mapped.id);
      return {
        ...current,
        knowledge: exists
          ? current.knowledge.map((knowledgeItem) => (knowledgeItem.id === mapped.id ? mapped : knowledgeItem))
          : [mapped, ...current.knowledge]
      };
    });
    notify("Материал базы знаний сохранён");
  }

  async function deleteKnowledgeItem(itemId) {
    if (!workspace?.id) throw new Error("Workspace не инициализирован");
    const { error } = await supabase
      .from("call_knowledge_items")
      .update({ active: false })
      .eq("id", itemId)
      .eq("workspace_id", workspace.id);
    if (error) throw error;
    setDb((current) => ({
      ...current,
      knowledge: current.knowledge.filter((item) => item.id !== itemId)
    }));
    notify("Материал удалён");
  }

  async function updateSettings(settings) {
    if (!workspace?.id) {
      notify("Workspace ещё не инициализирован");
      return false;
    }
    const settingsPayload = {
      id: `settings_${workspace.id}`,
      workspace_id: workspace.id,
      company_name: settings.companyName || defaultSettings.companyName,
      hub_name: settings.hubName || defaultSettings.hubName,
      hr_name: settings.hrName || defaultSettings.hrName,
      default_script_language: settings.defaultScriptLanguage || "ru",
      quo_api_key: settings.quoApiKey || "",
      quo_sms_from: settings.quoSmsFrom || "",
      welcome_sms_enabled: Boolean(settings.welcomeSmsEnabled),
      welcome_sms_template: settings.welcomeSmsTemplate || defaultSettings.welcomeSmsTemplate,
      offer_profile: {
        ...mergeOfferProfile(settings.offerProfile),
        __interfaceLanguage: settings.interfaceLanguage || defaultSettings.interfaceLanguage
      }
    };
    let { error } = await supabase.from("app_settings").upsert(settingsPayload);
    if (error?.code === "42703") {
      delete settingsPayload.quo_api_key;
      delete settingsPayload.quo_sms_from;
      delete settingsPayload.welcome_sms_enabled;
      delete settingsPayload.welcome_sms_template;
      ({ error } = await supabase.from("app_settings").upsert(settingsPayload));
      if (error?.code === "42703") {
        delete settingsPayload.offer_profile;
        ({ error } = await supabase.from("app_settings").upsert(settingsPayload));
      }
    }
    if (error) {
      notify(error.message);
      return false;
    }
    setDb((current) => ({ ...current, settings: { ...settings, interfaceLanguage: settings.interfaceLanguage || defaultSettings.interfaceLanguage } }));
    notify("Настройки сохранены");
    return true;
  }

  async function updateOfferProfile(offerProfile) {
    const nextSettings = { ...db.settings, offerProfile: mergeOfferProfile(offerProfile) };
    await updateSettings(nextSettings);
  }

  const selectedCandidate = useMemo(
    () => db.candidates.find((candidate) => candidate.id === ui.selectedCandidateId),
    [db.candidates, ui.selectedCandidateId]
  );
  const interfaceLanguage = db.settings.interfaceLanguage || defaultSettings.interfaceLanguage;
  const t = (key, params) => translate(interfaceLanguage, key, params);

  if (!hasSupabaseEnv) return <SetupScreen />;
  if (authLoading) return <ShellLoading label={t("checkingSession")} />;
  if (!session) return <AuthScreen />;

  const title = titleForView(ui.view, t);
  const activeLiveCall = liveCalls.find((call) => call.direction === "incoming" || !call.direction) || null;

  return (
    <I18nContext.Provider value={{ lang: interfaceLanguage, t }}>
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-copy">
            <strong>OwnerHub HRM</strong>
          </div>
        </div>
        <nav className="nav">
          {[
            ["dashboard", "⌂", t("dashboard")],
            ["candidates", "◎", t("candidates")],
            ["calls", "☎", t("calls")],
            ["pipeline", "▥", t("pipeline")],
            ["followups", "✓", t("followups")],
            ["analytics", "▤", t("analytics")],
            ["settings", "⚙", t("settings")]
          ].map(([view, icon, label]) => (
            <button
              key={view}
              className={`nav-btn ${ui.view === view ? "active" : ""}`}
              onClick={() => setUi((current) => ({ ...current, view, selectedCandidateId: view === "candidate" ? current.selectedCandidateId : null }))}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-chip"><span className="local-dot" /> {t("connected")}</div>
          <button className="btn btn-small sidebar-logout" onClick={() => supabase.auth.signOut()}>{t("logout")}</button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <div className="page-title">{title[0]}</div>
            <div className="page-subtitle">{title[1]}</div>
          </div>
          <div className="top-actions">
            <button className="btn desktop-only" onClick={() => setModal({ type: "followup" })}>＋ {t("addFollowup")}</button>
            <button className="btn btn-primary" onClick={() => setModal({ type: "candidate", candidate: blankCandidate() })}>＋ {t("newCandidate")}</button>
          </div>
        </header>
        <LiveCallBanner
          call={activeLiveCall}
          candidates={db.candidates}
          openCandidate={(candidateId) => setUi((current) => ({ ...current, view: "candidate", selectedCandidateId: candidateId }))}
          openScript={(candidateId) => setUi((current) => ({ ...current, view: "calls", callCandidateId: candidateId }))}
          addCandidate={(phone) => setModal({ type: "candidate", candidate: { ...blankCandidate(), phone, source: "Quo Incoming Call" }, startCallAfter: false })}
        />
        <section className="content">
          {loading ? <ShellLoading label={t("loadingData")} compact /> : null}
          {ui.view === "dashboard" && (
            <Dashboard
              db={db}
              openCandidate={(id) => setUi((current) => ({ ...current, view: "candidate", selectedCandidateId: id }))}
              openFollowup={() => setModal({ type: "followup" })}
              openStatus={(status) => setUi((current) => ({
                ...current,
                view: "candidates",
                selectedCandidateId: null,
                filters: { search: "", state: "", work: "", status }
              }))}
            />
          )}
          {ui.view === "candidates" && (
            <CandidatesView
              db={db}
              ui={ui}
              setUi={setUi}
              openCandidate={(id) => setUi((current) => ({ ...current, view: "candidate", selectedCandidateId: id }))}
              editCandidate={(candidate) => setModal({ type: "candidate", candidate })}
              startCall={(candidateId) => setUi((current) => ({ ...current, view: "calls", callCandidateId: candidateId }))}
              addFollowup={(candidateId) => setModal({ type: "followup", candidateId })}
              importCsv={() => setModal({ type: "csvImport" })}
              updateStatus={updateCandidateStatus}
            />
          )}
          {ui.view === "candidate" && selectedCandidate && (
            <CandidateProfile
              candidate={selectedCandidate}
              activities={db.activities.filter((activity) => activity.candidateId === selectedCandidate.id).slice(0, 12)}
              quoCalls={db.quoCalls.filter((call) => call.candidateId === selectedCandidate.id)}
              attachments={db.attachments.filter((attachment) => attachment.candidateId === selectedCandidate.id)}
              updateCandidate={async (candidate, activityText, activityType) => {
                try {
                  const previousStatus = selectedCandidate.status;
                  await saveCandidate(candidate, activityText, activityType);
                  if (candidate.status !== previousStatus) await createStatusFollowup(candidate.id, candidate.status);
                  notify("Сохранено");
                } catch (error) {
                  notify(error.message);
                }
              }}
              updateAttachmentDocumentType={async (attachment, documentType) => {
                try {
                  await updateAttachmentDocumentType(attachment, documentType);
                  notify("Сохранено");
                } catch (error) {
                  notify(error.message);
                }
              }}
              deleteAttachment={async (attachment) => {
                try {
                  await deleteAttachment(attachment);
                  notify("Удалено");
                } catch (error) {
                  notify(error.message);
                }
              }}
              addManualDocument={async (candidate, documentType, externalUrl) => {
                try {
                  await addManualDocument(candidate, documentType, externalUrl);
                  notify("Сохранено");
                } catch (error) {
                  notify(error.message);
                }
              }}
              deleteCandidateDocument={async (candidate, documentType) => {
                try {
                  await deleteCandidateDocument(candidate, documentType);
                  notify("Удалено");
                } catch (error) {
                  notify(error.message);
                }
              }}
              editCandidate={(candidate) => setModal({ type: "candidate", candidate })}
              addFollowup={(candidateId) => setModal({ type: "followup", candidateId })}
              deleteCandidate={deleteCandidate}
              startCall={(candidateId) => setUi((current) => ({ ...current, view: "calls", callCandidateId: candidateId }))}
            />
          )}
          {ui.view === "calls" && (
            <CallsView
              db={db}
              ui={ui}
              setUi={setUi}
              saveCandidate={saveCandidate}
              createFollowup={createFollowup}
              notify={notify}
              openNewCandidate={() => setModal({ type: "candidate", candidate: blankCandidate(), startCallAfter: true })}
              openKnowledgeEditor={(item) => setModal({ type: "knowledge", item: item || blankKnowledgeItem() })}
              deleteKnowledgeItem={deleteKnowledgeItem}
              updateOfferProfile={updateOfferProfile}
            />
          )}
          {ui.view === "pipeline" && (
            <PipelineView
              candidates={db.candidates}
              ui={ui}
              setUi={setUi}
              openCandidate={(id) => setUi((current) => ({ ...current, view: "candidate", selectedCandidateId: id }))}
              updateStatus={updateCandidateStatus}
            />
          )}
          {ui.view === "followups" && (
            <FollowupsView
              db={db}
              ui={ui}
              setUi={setUi}
              openCandidate={(id) => setUi((current) => ({ ...current, view: "candidate", selectedCandidateId: id }))}
              completeFollowup={completeFollowup}
              snoozeFollowup={snoozeFollowup}
              addFollowup={() => setModal({ type: "followup" })}
            />
          )}
          {ui.view === "analytics" && <AnalyticsView db={db} />}
          {ui.view === "settings" && <SettingsView db={db} workspace={workspace} updateSettings={updateSettings} reload={loadRemoteData} />}
        </section>
      </main>
      {modal?.type === "candidate" && (
        <CandidateModal
          candidate={modal.candidate}
          onClose={() => setModal(null)}
          onSave={async (candidate) => {
            try {
              const exists = db.candidates.some((item) => item.id === candidate.id);
              const saved = await saveCandidate(candidate, exists ? "Карточка кандидата обновлена" : "Кандидат создан", exists ? "edit" : "create");
              if (!exists) await createNewLeadFollowup(saved.id);
              setModal(null);
              setUi((current) => ({
                ...current,
                view: modal.startCallAfter ? "calls" : "candidate",
                callCandidateId: modal.startCallAfter ? saved.id : current.callCandidateId,
                selectedCandidateId: modal.startCallAfter ? current.selectedCandidateId : saved.id
              }));
              notify(exists ? "Кандидат обновлён" : "Кандидат добавлен");
            } catch (error) {
              notify(error.message);
            }
          }}
        />
      )}
      {modal?.type === "followup" && (
        <FollowupModal
          candidates={db.candidates}
          defaultCandidateId={modal.candidateId || ""}
          onClose={() => setModal(null)}
          onSave={async (payload) => {
            try {
              await createFollowup(payload.candidateId, payload.date, payload.time, payload.type, payload.note);
              setModal(null);
              notify("Follow-up добавлен");
            } catch (error) {
              notify(error.message);
            }
          }}
        />
      )}
      {modal?.type === "knowledge" && (
        <KnowledgeModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSave={async (item) => {
            try {
              await saveKnowledgeItem(item);
              setModal(null);
            } catch (error) {
              notify(error.message);
            }
          }}
        />
      )}
      {modal?.type === "csvImport" && (
        <CsvImportModal
          onClose={() => setModal(null)}
          onImport={async (files) => {
            const result = await importCsvFiles(files);
            notify(`CSV импорт: создано ${result.created}, обновлено ${result.updated}`);
            return result;
          }}
        />
      )}
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
    </I18nContext.Provider>
  );
}

function titleForView(view, t) {
  if (view === "candidate") return [t("pageCandidateTitle"), t("pageCandidateSubtitle")];
  return {
    dashboard: [t("dashboard"), t("pageDashboardSubtitle")],
    candidates: [t("candidates"), t("pageCandidatesSubtitle")],
    calls: [t("calls"), t("pageCallsSubtitle")],
    pipeline: [t("pipeline"), t("pagePipelineSubtitle")],
    followups: [t("followups"), t("pageFollowupsSubtitle")],
    analytics: [t("analytics"), t("pageAnalyticsSubtitle")],
    settings: [t("settings"), t("pageSettingsSubtitle")]
  }[view] || ["OwnerHub HRM", ""];
}

function LiveCallBanner({ call, candidates, openCandidate, openScript, addCandidate }) {
  const { t } = useI18n();
  if (!call) return null;

  const candidate = candidates.find((item) => item.id === call.candidateId);
  const phone = call.direction === "outgoing" ? call.toNumber : call.fromNumber;

  return (
    <div className="live-call-banner">
      <div className="live-call-pulse" />
      <div className="live-call-copy">
        <strong>{candidate ? t("callInProgressWith", { name: fullName(candidate) }) : t("unknownIncomingCall", { phone: phone || t("notSpecified") })}</strong>
        <span>{[phone, call.status].filter(Boolean).join(" · ")}</span>
      </div>
      <div className="live-call-actions">
        {candidate ? (
          <>
            <button className="btn btn-small" onClick={() => openCandidate(candidate.id)}>{t("openProfile")}</button>
            <button className="btn btn-small btn-primary" onClick={() => openScript(candidate.id)}>{t("openScript")}</button>
          </>
        ) : (
          <button className="btn btn-small btn-primary" onClick={() => addCandidate(phone)}>{t("addCandidateFromCall")}</button>
        )}
      </div>
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Нужно добавить Supabase env</h1>
        <p>В Vercel Project Settings / Environment Variables добавь переменные из `.env.example`.</p>
        <pre>NEXT_PUBLIC_SUPABASE_URL{"\n"}NEXT_PUBLIC_SUPABASE_ANON_KEY</pre>
      </div>
    </div>
  );
}

function ShellLoading({ label, compact = false }) {
  return <div className={compact ? "inline-loading" : "auth-page"}>{label}</div>;
}

function AuthScreen() {
  const { t } = useI18n();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup") setMessage("Проверь email для подтверждения аккаунта.");
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>{t("loginTitle")}</h1>
        <p>{t("loginSubtitle")}</p>
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>{t("password")}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} /></label>
        {message ? <div className="auth-message">{message}</div> : null}
        <button className="btn btn-primary" disabled={busy}>{busy ? t("wait") : mode === "login" ? t("login") : t("signup")}</button>
        <button type="button" className="link-btn" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? t("createUser") : t("alreadyHaveAccount")}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ db, openCandidate, openFollowup, openStatus }) {
  const { t } = useI18n();
  const total = db.candidates.length;
  const active = db.candidates.filter((candidate) => candidate.status === "active").length;
  const qualified = db.candidates.filter((candidate) => !["new", "contact_attempted", "lost"].includes(candidate.status)).length;
  const today = db.followups.filter((followup) => followup.status === "open" && followup.date === todayISO()).length;
  const openFollowups = [...db.followups].filter((followup) => followup.status === "open").sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 6);
  const recent = [...db.candidates].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 6);
  const statusCounts = Object.fromEntries(statuses.map(([status]) => [status, 0]));
  db.candidates.forEach((candidate) => {
    statusCounts[candidate.status] = (statusCounts[candidate.status] || 0) + 1;
  });
  const stateCounts = {};
  db.candidates.forEach((candidate) => {
    if (candidate.state) stateCounts[candidate.state] = (stateCounts[candidate.state] || 0) + 1;
  });
  const topStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);

  return (
    <>
      <div className="grid stats-grid">
        <StatCard label={t("totalCandidates")} value={total} icon="◎" note={t("fullLeadBase")} />
        <StatCard label={t("inProgress")} value={qualified} icon="↗" note={t("qualifiedAndStages")} />
        <StatCard label={t("followupsToday")} value={today} icon="✓" note={t("requireContactToday")} />
        <StatCard label={t("activeDrivers")} value={active} icon="★" note={t("startedWork")} />
      </div>
      <div className="card card-pad mt">
        <SectionTitle title={t("pipelineByStatus")} note={t("pipelineByStatusNote")} action={<button className="btn btn-small" onClick={() => openStatus("")}>{t("allLeads")}</button>} />
        <div className="status-overview-grid">
          {localizedStatuses(t).map(([status, label]) => {
            const count = statusCounts[status] || 0;
            const percent = total ? Math.round((count / total) * 100) : 0;
            return (
              <button className="status-overview-card" key={status} onClick={() => openStatus(status)}>
                <span className={`status-dot ${badgeClass(status)}`} />
                <span>{label}</span>
                <strong>{count}</strong>
                <small>{t("percentBase", { percent })}</small>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid two-col mt">
        <div className="card card-pad">
          <SectionTitle title={t("recentCandidates")} note={t("recentCandidatesNote")} />
          {recent.length ? <CandidateMiniTable candidates={recent} openCandidate={openCandidate} /> : <Empty title={t("noCandidatesYet")} note={t("addFirstLead")} />}
        </div>
        <div className="card card-pad">
          <SectionTitle title={t("followups")} note={t("upcomingTasks")} action={<button className="btn btn-small" onClick={openFollowup}>＋</button>} />
          {openFollowups.length ? <div className="follow-list">{openFollowups.map((followup) => <FollowItem key={followup.id} followup={followup} candidate={db.candidates.find((candidate) => candidate.id === followup.candidateId)} />)}</div> : <Empty title={t("noOpenFollowups")} note={t("contactsDone")} />}
        </div>
      </div>
      <div className="grid two-col mt">
        <div className="card card-pad">
          <SectionTitle title={t("candidatesByState")} note={t("currentGeography")} />
          <Bars items={topStates} />
        </div>
        <div className="card card-pad">
          <SectionTitle title={t("workFormatDistribution")} note={t("workFormatNote")} />
          <Bars items={["Local", "OTR", "Both"].map((label) => [label, db.candidates.filter((candidate) => candidate.workPreference === label).length])} />
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, icon, note }) {
  return <div className="card stat-card"><div className="stat-accent">{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}

function SectionTitle({ title, note, action }) {
  return <div className="section-header"><div><div className="section-title">{title}</div>{note ? <div className="section-note">{note}</div> : null}</div>{action}</div>;
}

function Bars({ items }) {
  const max = Math.max(1, ...items.map((item) => item[1]));
  if (!items.length) return <div className="section-note padded">Нет данных</div>;
  return <div className="bars">{items.map(([label, value]) => <div className="bar-row" key={label}><strong>{label}</strong><div className="bar-track"><div className="bar-fill" style={{ width: `${(value / max) * 100}%` }} /></div><b>{value}</b></div>)}</div>;
}

function CandidateMiniTable({ candidates, openCandidate }) {
  const { t } = useI18n();
  return (
    <div className="table-wrap">
      <table className="compact-table">
        <thead><tr><th>{t("candidate")}</th><th>{t("location")}</th><th>{t("format")}</th><th>{t("status")}</th><th>{t("score")}</th></tr></thead>
        <tbody>{candidates.map((candidate) => <tr key={candidate.id} onClick={() => openCandidate(candidate.id)}><td><Person candidate={candidate} /></td><td>{[candidate.city, candidate.state].filter(Boolean).join(", ") || "-"}</td><td>{candidate.workPreference || "-"}</td><td><StatusBadge status={candidate.status} /></td><td><Score value={candidate.score} /></td></tr>)}</tbody>
      </table>
    </div>
  );
}

function CandidatesView({ db, ui, setUi, openCandidate, editCandidate, startCall, addFollowup, importCsv, updateStatus }) {
  const { t } = useI18n();
  const query = ui.filters.search.toLowerCase().trim();
  const stateCounts = {};
  db.candidates.forEach((candidate) => {
    if (candidate.state) stateCounts[candidate.state] = (stateCounts[candidate.state] || 0) + 1;
  });
  const stateOptions = Object.entries(stateCounts).sort(([stateA], [stateB]) => stateA.localeCompare(stateB));
  const list = db.candidates
    .filter((candidate) => {
      const haystack = [fullName(candidate), candidate.phone, candidate.email, candidate.city, candidate.state, candidate.zip, candidate.truck.make, candidate.truck.model, candidate.trailer.make, candidate.trailer.model].join(" ").toLowerCase();
      return (!query || haystack.includes(query))
        && (!ui.filters.state || candidate.state === ui.filters.state)
        && (!ui.filters.status || candidate.status === ui.filters.status)
        && (!ui.filters.work || candidate.workPreference === ui.filters.work);
    })
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

  const setFilter = (key, value) => setUi((current) => ({ ...current, filters: { ...current.filters, [key]: value } }));

  return (
    <div className="card card-pad">
      <SectionTitle title={t("candidateBase")} note={t("foundCount", { shown: list.length, total: db.candidates.length })} />
      <div className="toolbar">
        <div className="searchbox"><span>⌕</span><input placeholder={t("searchCandidates")} value={ui.filters.search} onChange={(event) => setFilter("search", event.target.value)} /></div>
        <select value={ui.filters.state} onChange={(event) => setFilter("state", event.target.value)}><option value="">{t("allStates")}</option>{stateOptions.map(([state, count]) => <option key={state} value={state}>{state} ({count})</option>)}</select>
        <select value={ui.filters.work} onChange={(event) => setFilter("work", event.target.value)}><option value="">Local / OTR</option>{["Local", "OTR", "Both", "Not sure"].map((work) => <option key={work}>{work}</option>)}</select>
        <select value={ui.filters.status} onChange={(event) => setFilter("status", event.target.value)}><option value="">{t("allStatuses")}</option>{localizedStatuses(t).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button className="btn btn-small btn-primary" onClick={importCsv}>{t("importCsv")}</button>
        <button className="btn btn-small" onClick={() => setUi((current) => ({ ...current, filters: { search: "", state: "", status: "", work: "" } }))}>{t("reset")}</button>
      </div>
      {list.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("candidate")}</th><th>{t("location")}</th><th>{t("work")}</th><th>{t("equipment")}</th><th>{t("status")}</th><th>{t("nextContact")}</th><th>{t("score")}</th><th>{t("quickActions")}</th></tr></thead>
            <tbody>{list.map((candidate) => {
              const followup = db.followups.filter((item) => item.candidateId === candidate.id && item.status === "open").sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
              return (
                <tr key={candidate.id}>
                  <td onClick={() => openCandidate(candidate.id)} className="clickable"><Person candidate={candidate} /></td>
                  <td>{[candidate.city, candidate.state].filter(Boolean).join(", ") || "-"}<br /><small>{candidate.zip}</small></td>
                  <td>{candidate.workPreference || "-"}<br /><small>{candidate.homeTime}</small></td>
                  <td>{[candidate.truck.make, candidate.truck.model].filter(Boolean).join(" ") || "-"}<br /><small>{[candidate.trailer.make, candidate.trailer.model].filter(Boolean).join(" ")}</small></td>
                  <td><StatusBadge status={candidate.status} /></td>
                  <td>{followup ? `${fmtDate(followup.date)} · ${followup.time}` : "-"}</td>
                  <td><Score value={candidate.score} /></td>
                  <td>
                    <div className="quick-actions">
                      <button className="btn btn-small" onClick={() => startCall(candidate.id)}>☎ {t("script")}</button>
                      <button className="btn btn-small" onClick={() => addFollowup(candidate.id)}>＋ FU</button>
                      <button className="btn btn-small" onClick={() => editCandidate(candidate)}>✎</button>
                      <select value={candidate.status} onChange={(event) => updateStatus(candidate.id, event.target.value)} aria-label={`Change status for ${fullName(candidate)}`}>
                        {localizedStatuses(t).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      ) : <Empty title={t("noResults")} note={t("changeFilters")} />}
    </div>
  );
}

function CandidateProfile({ candidate, activities, quoCalls, attachments, updateCandidate, updateAttachmentDocumentType, deleteAttachment, addManualDocument, deleteCandidateDocument, editCandidate, addFollowup, deleteCandidate, startCall }) {
  const { t } = useI18n();
  const progressIndex = Math.max(0, pipelineStatuses.indexOf(candidate.status));
  const progress = Math.min(100, Math.round((progressIndex / (pipelineStatuses.length - 2)) * 100));
  const { comments, legacyQuoBlocks } = splitCandidateNotes(candidate.notes);
  const realQuoCalls = (quoCalls || []).filter((call) => call.summary.length || call.nextSteps.length || call.recordingUrl);
  const legacyQuoCalls = realQuoCalls.length ? [] : legacyQuoBlocks.map((block, index) => ({
    id: `legacy_quo_${index}`,
    legacyBlock: block,
    createdAt: candidate.updatedAt
  }));
  const visibleQuoCalls = [...realQuoCalls, ...legacyQuoCalls];

  return (
    <>
      <div className="candidate-head">
        <div className="candidate-head-inner">
          <div className="candidate-big-avatar">{initials(candidate)}</div>
          <div><div className="candidate-title">{fullName(candidate)}</div><div className="candidate-meta">{[candidate.city, candidate.state, candidate.zip].filter(Boolean).join(", ") || "Локация не указана"} · {candidate.workPreference || "Формат не выбран"} · Lead Score {candidate.score}</div></div>
          <div className="candidate-head-actions">
            <button className="btn" onClick={() => startCall(candidate.id)}>☎ {t("callScript")}</button>
            <button className="btn" onClick={() => editCandidate(candidate)}>✎ {t("edit")}</button>
            <button className="btn btn-danger" onClick={() => window.confirm(t("deleteCandidate")) && deleteCandidate(candidate.id)}>{t("delete")}</button>
          </div>
        </div>
      </div>
      <div className="profile-grid">
        <div className="card">
          <InfoSection title={<span>{t("contactPreferences")} <StatusBadge status={candidate.status} /></span>} items={[[t("phone"), candidate.phone], [t("email"), candidate.email], [t("language"), candidate.language], [t("source"), candidate.source], [t("format"), candidate.workPreference], [t("homeTime"), candidate.homeTime], [t("readyToStart"), fmtDate(candidate.startDate)], [t("daysPerWeek"), candidate.daysPerWeek], [t("expectedGross"), candidate.expectedGross]]} />
          <InfoSection title={t("driver")} items={[["CDL", candidate.cdl], ["License type", candidate.licenseType], [t("experience"), candidate.experienceYears ? `${candidate.experienceYears} years` : ""], ["Car hauling", candidate.carHaulingYears ? `${candidate.carHaulingYears} years` : ""], ["Two-car experience", candidate.twoCarExperience], ["Medical Card", candidate.medicalCard], [t("accidents"), candidate.accidents], [t("violations"), candidate.violations], [t("insuranceRejection"), candidate.previousInsuranceRejection]]} />
          <InfoSection title="Truck" items={[["Марка / модель", [candidate.truck.make, candidate.truck.model].filter(Boolean).join(" ")], ["Год", candidate.truck.year], ["VIN", candidate.truck.vin], ["GVWR", candidate.truck.gvwr], ["Топливо", candidate.truck.fuel], ["Состояние", candidate.truck.condition], ["Инспекция", candidate.truck.inspection]]} />
          <InfoSection title="Trailer" items={[["Марка / модель", [candidate.trailer.make, candidate.trailer.model].filter(Boolean).join(" ")], ["Год", candidate.trailer.year], ["VIN", candidate.trailer.vin], ["Длина", candidate.trailer.length], ["GVWR", candidate.trailer.gvwr], ["Тип", candidate.trailer.type], ["Вместимость", `${candidate.trailer.capacity || "2"} cars`], ["Состояние", candidate.trailer.condition], ["Инспекция", candidate.trailer.inspection]]} />
          <div className="info-section"><div className="info-title">{t("comments")}</div><div className="notes">{comments || t("noComments")}</div>{candidate.restrictions ? <div className="script-help"><b>{t("restrictions")}:</b> {candidate.restrictions}</div> : null}</div>
          <QuoSummarySection summaries={visibleQuoCalls} />
        </div>
        <div className="grid side-grid">
          <div className="card card-pad">
            <div className="info-title">{t("onboardingProgress")}</div>
            <div className="progress-label"><span>{statusLabel(candidate.status, t)}</span><strong>{progress}%</strong></div>
            <div className="progress"><div style={{ width: `${progress}%` }} /></div>
            <label className="mt-label">{t("changeStage")}<select value={candidate.status} onChange={(event) => updateCandidate({ ...candidate, status: event.target.value, updatedAt: new Date().toISOString() }, `Статус изменён на ${statusLabel(event.target.value, t)}`, "status")}>{localizedStatuses(t).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <button className="btn btn-primary full" onClick={() => addFollowup(candidate.id)}>＋ {t("addFollowup")}</button>
          </div>
          <CandidateDocuments candidate={candidate} attachments={attachments || []} addManualDocument={addManualDocument} deleteCandidateDocument={deleteCandidateDocument} />
          <CandidateAttachments attachments={attachments || []} onChangeType={updateAttachmentDocumentType} onDelete={deleteAttachment} />
          <div className="card card-pad">
            <div className="info-title">Insurance</div>
            <label>Status<select value={candidate.insurance.status} onChange={(event) => updateCandidate({ ...candidate, insurance: { ...candidate.insurance, status: event.target.value } }, `Insurance status: ${event.target.value}`, "insurance")}>{["not_started", "pending", "approved", "rejected"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="mt-label">Weekly quote<input value={candidate.insurance.weeklyQuote} onChange={(event) => updateCandidate({ ...candidate, insurance: { ...candidate.insurance, weeklyQuote: event.target.value } }, "Insurance quote обновлён", "insurance")} placeholder="$300-$400" /></label>
          </div>
          <div className="card card-pad">
            <div className="info-title">{t("activityHistory")}</div>
            {activities.length ? <div className="timeline">{activities.map((activity) => <div className="timeline-item" key={activity.id}><span className="timeline-dot" /><strong>{activity.text}</strong><time>{fmtDate(activity.createdAt, true)}</time></div>)}</div> : <div className="section-note">{t("emptyHistory")}</div>}
          </div>
        </div>
      </div>
    </>
  );
}

function CandidateDocuments({ candidate, attachments, addManualDocument, deleteCandidateDocument }) {
  const { t } = useI18n();
  const attachmentsByType = (attachments || []).reduce((acc, attachment) => {
    if (!attachment.documentType || !attachment.externalUrl) return acc;
    const existing = acc[attachment.documentType];
    if (!existing || new Date(attachment.createdAt || 0) > new Date(existing.createdAt || 0)) {
      acc[attachment.documentType] = attachment;
    }
    return acc;
  }, {});

  return (
    <div className="card card-pad">
      <div className="info-title">{t("documents")}</div>
      <div className="docs-grid">
        {Object.entries(docLabels).map(([key, label]) => {
          const attachment = attachmentsByType[key];
          return (
            <div className={`doc-row ${attachment ? "doc-row-received" : ""}`} key={key}>
              {attachment ? (
                <a className="doc-link" href={attachment.externalUrl} target="_blank" rel="noreferrer">{label}</a>
              ) : (
                <strong>{label}</strong>
              )}
              {attachment ? (
                <button className="btn btn-small btn-danger doc-action" onClick={() => window.confirm(t("deleteDocumentConfirm")) && deleteCandidateDocument(candidate, key)}>{t("delete")}</button>
              ) : (
                <button className="btn btn-small doc-action" onClick={() => {
                  const url = window.prompt(t("documentLinkPrompt"));
                  if (url?.trim()) addManualDocument(candidate, key, url.trim());
                }}>{t("addDocument")}</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CandidateAttachments({ attachments, onChangeType, onDelete }) {
  const { t } = useI18n();
  const inboxAttachments = (attachments || []).filter((attachment) => !attachment.documentType);

  return (
    <div className="card card-pad">
      <div className="info-title">{t("receivedFiles")}</div>
      {inboxAttachments.length ? (
        <div className="attachment-list">
          {inboxAttachments.map((attachment) => (
            <div className="attachment-item" key={attachment.id}>
              {attachment.mimeType?.startsWith("image/") && attachment.externalUrl ? (
                <a className="attachment-preview" href={attachment.externalUrl} target="_blank" rel="noreferrer">
                  <img src={attachment.externalUrl} alt={attachment.fileName || t("receivedFiles")} loading="lazy" />
                </a>
              ) : (
                <a className="attachment-file-icon" href={attachment.externalUrl} target="_blank" rel="noreferrer">↗</a>
              )}
              <div className="attachment-body">
                <div className="attachment-name">{attachment.fileName || t("receivedFromQuo")}</div>
                <div className="attachment-meta">{[attachment.mimeType, fmtDate(attachment.createdAt, true)].filter(Boolean).join(" · ")}</div>
                <label className="attachment-select-label">
                  {t("documentType")}
                  <select value={attachment.documentType || ""} onChange={(event) => onChangeType(attachment, event.target.value)}>
                    <option value="">{t("unassignedDocument")}</option>
                    {Object.entries(docLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
                {attachment.externalUrl ? <a className="attachment-open" href={attachment.externalUrl} target="_blank" rel="noreferrer">{t("openFile")}</a> : null}
                <button className="btn btn-small btn-danger attachment-delete" onClick={() => window.confirm(t("deleteFileConfirm")) && onDelete(attachment)}>{t("deleteFile")}</button>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="section-note">{t("noReceivedFiles")}</div>}
    </div>
  );
}

function QuoSummarySection({ summaries }) {
  const { t } = useI18n();

  return (
    <div className="info-section quo-summary-section">
      <div className="info-title">{t("quoCallSummaries")}</div>
      {summaries.length ? (
        <div className="quo-summary-list">
          {summaries.map((item) => item.legacyBlock ? (
            <div className="quo-summary-item" key={item.id}>
              <div className="quo-summary-meta"><span>Quo</span><time>{fmtDate(item.createdAt, true)}</time></div>
              <div className="notes">{item.legacyBlock}</div>
            </div>
          ) : (
            <div className="quo-summary-item" key={item.id}>
              <div className="quo-summary-meta">
                <span>{item.direction || "call"}</span>
                <time>{fmtDate(item.completedAt || item.answeredAt || item.createdAt, true)}</time>
              </div>
              <div className="quo-summary-phone">{[item.fromNumber, item.toNumber].filter(Boolean).join(" -> ") || item.callId}</div>
              {item.summary.length ? <QuoSummaryList title={t("summary")} items={item.summary} /> : null}
              {item.nextSteps.length ? <QuoSummaryList title={t("nextSteps")} items={item.nextSteps} /> : null}
              {item.recordingUrl ? <QuoRecordingPlayer item={item} /> : null}
            </div>
          ))}
        </div>
      ) : <div className="section-note">{t("noQuoSummaries")}</div>}
    </div>
  );
}

function QuoRecordingPlayer({ item }) {
  const { t } = useI18n();
  const duration = item.recordingDuration ? `${Math.round(Number(item.recordingDuration))} sec` : "";

  return (
    <div className="quo-recording">
      <div className="quo-recording-head">
        <strong>{t("callRecording")}</strong>
        <a href={item.recordingUrl} target="_blank" rel="noreferrer">{t("openRecording")}</a>
      </div>
      <audio controls preload="none" src={item.recordingUrl} />
      <div className="quo-recording-meta">{[item.recordingType, duration].filter(Boolean).join(" · ")}</div>
    </div>
  );
}

function QuoSummaryList({ title, items }) {
  return (
    <div className="quo-summary-block">
      <strong>{title}</strong>
      <ul>{items.map((item, index) => <li key={`${title}_${index}`}>{item}</li>)}</ul>
    </div>
  );
}

function InfoSection({ title, items }) {
  return <div className="info-section"><div className="info-title">{title}</div><div className="info-grid">{items.map(([label, value]) => <div className="info-item" key={label}><span>{label}</span><strong>{valueOrDash(value)}</strong></div>)}</div></div>;
}

function OfferBuilder({ offer, onSave }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(mergeOfferProfile(offer));
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    setDraft(mergeOfferProfile(offer));
  }, [offer]);

  const rows = [
    ["targetRole", "Кого ищем"],
    ["equipment", "Техника"],
    ["geography", "География"],
    ["localGross", "Local gross"],
    ["otrGross", "OTR gross"],
    ["dispatchFee", "Dispatch fee"],
    ["insuranceRange", "Insurance"],
    ["paySchedule", "Выплаты"],
    ["onboardingTimeline", "Онбординг"],
    ["requiredDocs", "Документы"],
    ["disqualifiers", "Disqualifiers"],
    ["doNotPromise", "Нельзя обещать"],
    ["localPitch", "Local pitch"],
    ["otrPitch", "OTR pitch"]
  ];

  return (
    <div className="card card-pad offer-builder">
      <SectionTitle title="Offer Builder" note={t("knowledgeBaseNote")} action={<button className="btn btn-small btn-primary" onClick={() => onSave(draft)}>{t("save")}</button>} />
      <div className="offer-grid">
        {rows.map(([key, label]) => (
          <label key={key}>{label}<textarea value={draft[key] || ""} onChange={(event) => update(key, event.target.value)} /></label>
        ))}
      </div>
    </div>
  );
}

function KnowledgeBaseView({ knowledge, candidates, offer, updateOfferProfile, startCall, openNewCandidate, openEditor, deleteItem }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const cleanQuery = query.trim().toLowerCase();
  const visibleItems = knowledge
    .filter((item) => !category || item.category === category)
    .filter((item) => {
      const haystack = [item.title, item.category, item.content, ...(item.tags || [])].join(" ").toLowerCase();
      return !cleanQuery || haystack.includes(cleanQuery);
    })
    .sort((a, b) => (a.sortOrder - b.sortOrder) || String(b.updatedAt).localeCompare(String(a.updatedAt)));

  return (
    <div className="knowledge-layout">
      <div className="card card-pad knowledge-main">
        <SectionTitle
          title={t("knowledgeBase")}
          note={t("knowledgeBaseNote")}
          action={<button className="btn btn-primary" onClick={() => openEditor()}>＋ {t("add")}</button>}
        />
        <div className="toolbar">
          <div className="searchbox"><span>⌕</span><input placeholder={t("searchKnowledge")} value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">{t("allCategories")}</option>
            {knowledgeCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        {visibleItems.length ? (
          <div className="knowledge-grid">
            {visibleItems.map((item) => (
              <article className="knowledge-card" key={item.id}>
                <div className="knowledge-card-head">
                  <span className="badge badge-yellow">{item.category}</span>
                  <div className="knowledge-card-actions">
                    <button className="btn btn-small" onClick={() => openEditor(item)}>✎</button>
                    <button className="btn btn-small btn-danger" onClick={() => window.confirm(t("deleteCandidate")) && deleteItem(item.id)}>×</button>
                  </div>
                </div>
                <h3>{item.title}</h3>
                <p>{item.content}</p>
                {item.tags?.length ? <div className="knowledge-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
              </article>
            ))}
          </div>
        ) : (
          <Empty title={t("noKnowledgeFound")} note={t("adjustKnowledgeSearch")} />
        )}
      </div>

      <aside className="grid side-grid">
        <OfferBuilder offer={offer} onSave={updateOfferProfile} />
        <div className="card card-pad">
          <SectionTitle title={t("startCall")} action={<button className="btn btn-small btn-primary" onClick={openNewCandidate}>＋ Lead</button>} />
          {candidates.length ? (
            <div className="call-start-list">
              {candidates.slice(0, 8).map((candidate) => (
                <button className="call-start-row" key={candidate.id} onClick={() => startCall(candidate.id)}>
                  <Person candidate={candidate} />
                  <StatusBadge status={candidate.status} />
                </button>
              ))}
            </div>
          ) : (
            <div className="section-note padded">{t("noCallCandidates")}</div>
          )}
        </div>
        <div className="card card-pad">
          <div className="info-title">{t("howToUse")}</div>
          <div className="knowledge-tip">{t("knowledgeTip")}</div>
        </div>
      </aside>
    </div>
  );
}

function knowledgeMatches(item, terms) {
  const haystack = [item.title, item.category, item.content, ...(item.tags || [])].join(" ").toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

function findKnowledge(knowledge, terms, limit = 2) {
  return knowledge
    .filter((item) => knowledgeMatches(item, terms))
    .sort((a, b) => (a.sortOrder - b.sortOrder) || String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, limit);
}

function getScriptRecommendations(candidate, step, knowledge, offerInput) {
  const offer = mergeOfferProfile(offerInput);
  const recommendations = [];
  const addOffer = (title, content) => {
    if (content) recommendations.push({ id: `offer-${title}`, source: "Offer", category: "Offer", title, content });
  };
  const addKnowledge = (items) => {
    items.forEach((item) => recommendations.push({ ...item, source: "Knowledge" }));
  };

  if (step?.key === "availability" || step === callSteps.start) {
    addKnowledge(findKnowledge(knowledge, ["opening", "intro", "первое", "касание"], 1));
    addOffer("Target", `${offer.targetRole}. ${offer.equipment}.`);
  }

  if (step?.fields?.some(([key]) => ["city", "state", "zip", "experienceYears", "cdl"].includes(key)) || step?.key === "hasEquipment") {
    addKnowledge(findKnowledge(knowledge, ["qualification", "checklist", "screening", "квалификация"], 2));
  }

  const wantsLocal = candidate.workPreference === "Local" || step?.key === "localReaction" || step === callSteps.local_pitch;
  const wantsOtr = candidate.workPreference === "OTR" || step?.key === "otrReaction" || step === callSteps.otr_pitch;
  const wantsBoth = candidate.workPreference === "Both" || step === callSteps.both_pitch || step === callSteps.difference_pitch;

  if (wantsLocal || wantsBoth) addOffer("Local pitch", `${offer.localPitch} ориентир: ${offer.localGross}.`);
  if (wantsOtr || wantsBoth) addOffer("OTR pitch", `${offer.otrPitch} ориентир: ${offer.otrGross}.`);

  if ([callSteps.terms, callSteps.terms_question].includes(step)) {
    addOffer("Terms", `Dispatch fee: ${offer.dispatchFee}. Pay schedule: ${offer.paySchedule}.`);
    addKnowledge(findKnowledge(knowledge, ["terms", "money", "dispatch", "условия"], 2));
  }

  if ([callSteps.documents, callSteps.doc_followup, callSteps.finish_qualified].includes(step) || candidate.status === "docs_requested") {
    addOffer("Documents", offer.requiredDocs);
    addKnowledge(findKnowledge(knowledge, ["documents", "docs", "документы"], 1));
  }

  if (step === callSteps.safety_record || candidate.insurance?.status === "pending") {
    addOffer("Insurance guardrail", `${offer.insuranceRange}. ${offer.doNotPromise}`);
    addKnowledge(findKnowledge(knowledge, ["insurance", "quote", "страх"], 2));
  }

  if (step === callSteps.custom_question || step === callSteps.terms_question || step?.key?.toLowerCase().includes("reaction")) {
    addKnowledge(findKnowledge(knowledge, ["objection", "возраж", "gross", "insurance"], 3));
  }

  if (step === callSteps.equipment_gap || !candidate.truck.make || !candidate.trailer.make) {
    addOffer("Equipment fit", `Need: ${offer.equipment}. Disqualifiers: ${offer.disqualifiers}.`);
  }

  if (recommendations.length < 3) {
    addOffer("Do not promise", offer.doNotPromise);
    addKnowledge(findKnowledge(knowledge, ["process", "onboarding", "процесс"], 1));
  }

  const seen = new Set();
  return recommendations.filter((item) => {
    const key = `${item.source}-${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

function ScriptRecommendations({ items }) {
  const { t } = useI18n();
  return (
    <div className="card card-pad recommendation-card">
      <div className="info-title">{t("recommendedBlocks")}</div>
      {items.length ? (
        <div className="recommendation-list">
          {items.map((item) => (
            <div className="recommendation-item" key={item.id}>
              <span>{item.source} · {item.category}</span>
              <strong>{item.title}</strong>
              <p>{item.content}</p>
            </div>
          ))}
        </div>
      ) : <div className="section-note">{t("noRecommendations")}</div>}
    </div>
  );
}

function CallsView({ db, ui, setUi, saveCandidate, createFollowup, notify, openNewCandidate, openKnowledgeEditor, deleteKnowledgeItem, updateOfferProfile }) {
  const { t } = useI18n();
  const candidate = db.candidates.find((item) => item.id === ui.callCandidateId);
  const available = db.candidates.filter((item) => item.status !== "active" && item.status !== "lost");

  if (!candidate) {
    return (
      <KnowledgeBaseView
        knowledge={db.knowledge}
        candidates={available}
        offer={db.settings.offerProfile}
        updateOfferProfile={updateOfferProfile}
        startCall={(candidateId) => setUi((current) => ({ ...current, callCandidateId: candidateId }))}
        openNewCandidate={openNewCandidate}
        openEditor={openKnowledgeEditor}
        deleteItem={deleteKnowledgeItem}
      />
    );
  }

  const step = callSteps[candidate.call.stepId] || callSteps.start;
  const lang = candidate.call.language || "ru";
  const historyLen = candidate.call.history.length;
  const pct = Math.min(100, Math.round((historyLen / 16) * 100));
  const scriptRecommendations = getScriptRecommendations(candidate, step, db.knowledge, db.settings.offerProfile);

  async function persist(nextCandidate, activity = "Звонок обновлён") {
    try {
      await saveCandidate({ ...nextCandidate, updatedAt: new Date().toISOString() }, activity, "call");
    } catch (error) {
      notify(error.message);
    }
  }

  async function advanceOption(key, value, nextStep) {
    const nextCandidate = structuredClone(candidate);
    nextCandidate.call.answers[key] = value;
    if (["workPreference", "homeTime"].includes(key)) nextCandidate[key] = value;
    if (key === "preferredAfterPitch") nextCandidate.workPreference = value;
    if (key === "documentsReady" && value === "Today") {
      nextCandidate.docs.license = "requested";
      nextCandidate.docs.truckRegistration = "requested";
      nextCandidate.docs.trailerRegistration = "requested";
    }
    nextCandidate.call.history.push(candidate.call.stepId);
    nextCandidate.call.stepId = nextStep;
    nextCandidate.lastContact = new Date().toISOString();
    nextCandidate.score = calculateScore(nextCandidate);
    await persist(nextCandidate);
  }

  async function advanceFields(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextCandidate = structuredClone(candidate);
    for (const [key, value] of data.entries()) {
      if (key.includes(".") || Object.prototype.hasOwnProperty.call(nextCandidate, key)) setPath(nextCandidate, key, value);
      else nextCandidate.call.answers[key] = value;
    }
    nextCandidate.call.history.push(candidate.call.stepId);
    nextCandidate.call.stepId = step.next;
    nextCandidate.lastContact = new Date().toISOString();
    nextCandidate.score = calculateScore(nextCandidate);
    await persist(nextCandidate);
  }

  async function completeCall() {
    const nextCandidate = structuredClone(candidate);
    const outcome = step.outcome;
    nextCandidate.call.completed = true;
    nextCandidate.lastContact = new Date().toISOString();
    if (outcome === "qualified") {
      nextCandidate.status = "qualified";
      ["license", "truckRegistration", "trailerRegistration"].forEach((key) => {
        if (nextCandidate.docs[key] === "not_requested") nextCandidate.docs[key] = "requested";
      });
    }
    if (outcome === "lost") nextCandidate.status = "lost";
    if (outcome === "followup" || outcome === "message") nextCandidate.status = "contact_attempted";
    if (outcome === "thinking" || outcome === "nurture") nextCandidate.status = "contact_attempted";
    if (nextCandidate.call.answers.liveNotes) nextCandidate.notes = [nextCandidate.notes, nextCandidate.call.answers.liveNotes].filter(Boolean).join("\n\n");
    nextCandidate.score = calculateScore(nextCandidate);
    try {
      await saveCandidate(nextCandidate, `Квалификационный звонок завершён: ${outcome}`, "call");
      const answers = nextCandidate.call.answers;
      if (answers.followDate) await createFollowup(nextCandidate.id, answers.followDate, answers.followTime || "10:00", answers.preferredContact || "Call", answers.followNote || "Follow-up после квалификационного звонка");
      if (outcome === "message" && !answers.followDate) await createFollowup(nextCandidate.id, addDays(1), "10:00", answers.preferredContact || "Message", "Проверить реакцию после отправки информации");
      setUi((current) => ({ ...current, view: "candidate", selectedCandidateId: nextCandidate.id, callCandidateId: null }));
      notify("Звонок сохранён в карточке кандидата");
    } catch (error) {
      notify(error.message);
    }
  }

  return (
    <div className="call-layout">
      <div className="card call-card">
        <div className="call-top">
          <div className="call-progress-label-wrap"><div className="call-progress-label">{t("qualificationCall")} · {historyLen + 1} {t("step")}</div><div className="progress"><div style={{ width: `${pct}%` }} /></div></div>
          <select value={lang} onChange={(event) => persist({ ...candidate, call: { ...candidate.call, language: event.target.value } }, t("callLanguageUpdated"))}><option value="ru">{t("russian")}</option><option value="en">English</option></select>
          <button className="btn icon-btn" onClick={() => setUi((current) => ({ ...current, callCandidateId: null }))}>×</button>
        </div>
        <div className="call-body">
          <span className="script-label">● HR говорит</span>
          <div className="script-text">{(step.say?.[lang] || step.say?.ru || "").replace("[HR NAME]", db.settings.hrName).replace("[COMPANY]", db.settings.companyName)}</div>
          {step.help ? <div className="script-help">{step.help}</div> : null}
          {step.finish ? <div className="script-help success"><strong>{t("callResultReady")}</strong><br />{t("checkSummaryFinish")}</div> : step.type === "options" ? <div className="answer-options">{step.options.map((option) => <button className="btn answer-btn" key={option.v} onClick={() => advanceOption(step.key, option.v, option.next)}>{option[lang] || option.ru}</button>)}</div> : <form onSubmit={advanceFields} className="call-fields"><CallFieldsGrid candidate={candidate} fields={step.fields} /><div className="call-footer"><BackButton candidate={candidate} persist={persist} /><button className="btn btn-primary">{t("saveContinue")} →</button></div></form>}
          {step.type !== "fields" ? <div className="call-footer"><BackButton candidate={candidate} persist={persist} />{step.finish ? <button className="btn btn-primary" onClick={completeCall}>{t("finishSave")}</button> : <span className="section-note">{t("chooseAnswer")}</span>}</div> : null}
        </div>
      </div>
      <div className="grid live-summary">
        <div className="card card-pad"><div className="info-title">{t("candidate")}</div><Person candidate={candidate} /><div className="mt-small"><StatusBadge status={candidate.status} /></div></div>
        <ScriptRecommendations items={scriptRecommendations} />
        <div className="card card-pad"><div className="info-title">Live summary</div><LiveSummary candidate={candidate} /></div>
        <div className="card card-pad"><div className="info-title">{t("liveNotes")}</div><textarea value={candidate.call.answers.liveNotes || ""} onChange={(event) => persist({ ...candidate, call: { ...candidate.call, answers: { ...candidate.call.answers, liveNotes: event.target.value } } }, "Live notes updated")} placeholder={t("liveNotesPlaceholder")} /></div>
      </div>
    </div>
  );
}

function BackButton({ candidate, persist }) {
  return <button type="button" className="btn" disabled={!candidate.call.history.length} onClick={() => {
    const next = structuredClone(candidate);
    next.call.stepId = next.call.history.pop();
    persist(next, "Шаг звонка изменён");
  }}>← Назад</button>;
}

function CallFieldsGrid({ candidate, fields }) {
  const [locationDraft, setLocationDraft] = useState({
    city: candidate.city || "",
    state: candidate.state || "",
    zip: candidate.zip || ""
  });
  const hasLocationFields = fields.some(([key]) => ["city", "state", "zip"].includes(key));
  const otherFields = hasLocationFields ? fields.filter(([key]) => !["city", "state", "zip"].includes(key)) : fields;

  return (
    <div className="field-grid">
      {hasLocationFields ? <LocationFields draft={locationDraft} setDraft={setLocationDraft} /> : null}
      {otherFields.map((field) => <CallField key={field[0]} candidate={candidate} field={field} />)}
    </div>
  );
}

function CallField({ candidate, field }) {
  const { t } = useI18n();
  const [key, type, label] = field;
  const existing = getPath(candidate, key) || candidate.call.answers[key] || "";
  if (type === "textarea") return <label className="field-span">{label}<textarea name={key} defaultValue={existing} /></label>;
  if (type === "state") return <label>{label}<select name={key} defaultValue={existing}><option value="">{t("choose")}</option>{states.map((state) => <option key={state}>{state}</option>)}</select></label>;
  if (type.startsWith("select:")) {
    const options = type.split(":")[1].split("|");
    return <label>{label}<select name={key} defaultValue={existing}><option value="">{t("choose")}</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
  }
  return <label>{label}<input name={key} type={type} defaultValue={existing} /></label>;
}

function LiveSummary({ candidate }) {
  const { t } = useI18n();
  const rows = [
    [t("location"), [candidate.city, candidate.state, candidate.zip].filter(Boolean).join(", ")],
    [t("format"), candidate.workPreference],
    ["Home time", candidate.homeTime],
    ["Truck", [candidate.truck.make, candidate.truck.model, candidate.truck.year].filter(Boolean).join(" ")],
    ["Trailer", [candidate.trailer.make, candidate.trailer.model, candidate.trailer.year].filter(Boolean).join(" ")],
    [t("experience"), candidate.carHaulingYears ? `${candidate.carHaulingYears} years car hauling` : ""],
    ["CDL", candidate.cdl],
    [t("startDate"), fmtDate(candidate.startDate)],
    ["Score", candidate.score]
  ];
  return <div className="summary-list">{rows.map(([label, value]) => <div className="summary-row" key={label}><span>{label}</span><strong>{valueOrDash(value)}</strong></div>)}</div>;
}

function PipelineView({ candidates, ui, setUi, openCandidate, updateStatus }) {
  const { t } = useI18n();
  const query = ui.pipelineSearch.toLowerCase();
  return (
    <>
      <div className="toolbar"><div className="searchbox"><span>⌕</span><input placeholder={t("searchCandidates")} value={ui.pipelineSearch} onChange={(event) => setUi((current) => ({ ...current, pipelineSearch: event.target.value }))} /></div></div>
      <div className="kanban">
        {pipelineStatuses.map((status) => {
          const list = candidates.filter((candidate) => candidate.status === status && (!query || [fullName(candidate), candidate.city, candidate.state, candidate.phone].join(" ").toLowerCase().includes(query)));
          return <div className="kanban-col" key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => updateStatus(event.dataTransfer.getData("text/plain"), status)}><div className="kanban-head"><strong>{statusLabel(status, t)}</strong><span className="kanban-count">{list.length}</span></div><div className="kanban-cards">{list.map((candidate) => <div className="kanban-card" draggable key={candidate.id} onDragStart={(event) => event.dataTransfer.setData("text/plain", candidate.id)} onClick={() => openCandidate(candidate.id)}><div className="name">{fullName(candidate)}</div><div className="meta">{[candidate.city, candidate.state].filter(Boolean).join(", ") || t("location")}</div><div className="meta">{candidate.workPreference || t("format")}</div><div className="foot"><span className="badge badge-yellow">{candidate.truck.make || "No truck"}</span><Score value={candidate.score} small /></div></div>)}</div></div>;
        })}
      </div>
    </>
  );
}

function FollowupsView({ db, ui, setUi, openCandidate, completeFollowup, snoozeFollowup, addFollowup }) {
  const { t } = useI18n();
  const all = db.followups.filter((followup) => ui.followFilter === "all" || followup.status === ui.followFilter).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const overdue = all.filter((followup) => followup.status === "open" && followup.date < todayISO());
  const today = all.filter((followup) => followup.status === "open" && followup.date === todayISO());
  const upcoming = all.filter((followup) => followup.status !== "open" || followup.date > todayISO());
  return (
    <>
      <SectionTitle title={t("taskPlan")} note={t("openTasks", { count: db.followups.filter((followup) => followup.status === "open").length })} action={<button className="btn btn-primary" onClick={addFollowup}>＋ {t("newFollowup")}</button>} />
      <div className="toolbar">{["open", "done", "all"].map((filter) => <button key={filter} className={`btn btn-small ${ui.followFilter === filter ? "btn-primary" : ""}`} onClick={() => setUi((current) => ({ ...current, followFilter: filter }))}>{filter}</button>)}</div>
      <div className="grid three-col">
        <FollowColumn title={t("overdue")} list={overdue} db={db} openCandidate={openCandidate} completeFollowup={completeFollowup} snoozeFollowup={snoozeFollowup} badge="badge-red" />
        <FollowColumn title={t("today")} list={today} db={db} openCandidate={openCandidate} completeFollowup={completeFollowup} snoozeFollowup={snoozeFollowup} badge="badge-yellow" />
        <FollowColumn title={t("upcoming")} list={upcoming} db={db} openCandidate={openCandidate} completeFollowup={completeFollowup} snoozeFollowup={snoozeFollowup} badge="badge-blue" />
      </div>
    </>
  );
}

function FollowColumn({ title, list, db, openCandidate, completeFollowup, snoozeFollowup, badge }) {
  const { t } = useI18n();
  return <div className="card card-pad"><SectionTitle title={title} action={<span className={`badge ${badge}`}>{list.length}</span>} />{list.length ? <div className="follow-list">{list.map((followup) => <FollowItem key={followup.id} followup={followup} candidate={db.candidates.find((candidate) => candidate.id === followup.candidateId)} openCandidate={openCandidate} completeFollowup={completeFollowup} snoozeFollowup={snoozeFollowup} />)}</div> : <div className="section-note padded">{t("noTasks")}</div>}</div>;
}

function AnalyticsView({ db }) {
  const { t } = useI18n();
  const [period, setPeriod] = useState(7);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const analytics = useMemo(() => buildAnalytics(db, period, selectedDate), [db, period, selectedDate]);

  return (
    <div className="grid">
      <div className="card card-pad">
        <SectionTitle
          title={t("analyticsTitle")}
          note={t("analyticsNote")}
          action={(
            <div className="analytics-controls">
              <label>{t("selectedDate")}<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value || todayISO())} /></label>
              <div className="segmented">
                {[
                  [1, t("periodToday")],
                  [7, t("period7Days")],
                  [30, t("period30Days")]
                ].map(([value, label]) => (
                  <button key={value} className={period === value ? "active" : ""} onClick={() => setPeriod(value)}>{label}</button>
                ))}
              </div>
            </div>
          )}
        />
        <div className="stats-grid analytics-kpis">
          <StatCard label={t("callsMade")} value={analytics.totals.calls} icon="☎" note={`${t("outbound")}: ${analytics.totals.outbound} · ${t("incoming")}: ${analytics.totals.incoming}`} />
          <StatCard label={t("talkTime")} value={formatDuration(analytics.totals.talkSeconds)} icon="◷" note={`${t("avgCall")}: ${formatDuration(analytics.totals.avgCallSeconds)}`} />
          <StatCard label={t("leadsTouched")} value={analytics.totals.touchedLeads} icon="◎" note={`${t("newLeadsReceived")}: ${analytics.totals.newLeads}`} />
          <StatCard label={t("followupsDone")} value={analytics.totals.followupsDone} icon="✓" note={`${t("followupsCreated")}: ${analytics.totals.followupsCreated}`} />
          <StatCard label={t("productiveCalls")} value={analytics.totals.productiveCalls} icon="↗" note={t("productiveCallsNote")} />
          <StatCard label={t("activeWorkWindow")} value={formatDuration(analytics.totals.workWindowSeconds)} icon="▥" note={t("workWindowNote")} />
        </div>
      </div>

      <div className="card card-pad">
        <SectionTitle title={t("dailyBreakdown")} note={t("dailyBreakdownNote")} />
        {analytics.days.some((day) => day.hasActivity) ? (
          <>
            <div className="analytics-chart">
              {analytics.days.map((day) => (
                <div className="analytics-day" key={day.date}>
                  <div className="analytics-bars">
                    <span className="bar-calls" style={{ height: `${analytics.max.calls ? Math.max(8, (day.calls / analytics.max.calls) * 100) : 0}%` }} title={`${t("callsMade")}: ${day.calls}`} />
                    <span className="bar-leads" style={{ height: `${analytics.max.touchedLeads ? Math.max(8, (day.touchedLeads / analytics.max.touchedLeads) * 100) : 0}%` }} title={`${t("leadsTouched")}: ${day.touchedLeads}`} />
                    <span className="bar-talk" style={{ height: `${analytics.max.talkSeconds ? Math.max(8, (day.talkSeconds / analytics.max.talkSeconds) * 100) : 0}%` }} title={`${t("talkTime")}: ${formatDuration(day.talkSeconds)}`} />
                  </div>
                  <div className="analytics-day-label">{day.shortLabel}</div>
                </div>
              ))}
            </div>
            <div className="analytics-legend">
              <span><i className="bar-calls" />{t("callsMade")}</span>
              <span><i className="bar-leads" />{t("leadsTouched")}</span>
              <span><i className="bar-talk" />{t("talkTime")}</span>
            </div>
            <div className="table-wrap mt-small">
              <table className="compact-table analytics-table">
                <thead><tr><th>{t("day")}</th><th>{t("callsMade")}</th><th>{t("talkTime")}</th><th>{t("touchedLeadsMetric")}</th><th>{t("newLeadsMetric")}</th><th>{t("summariesMetric")}</th><th>{t("recordingsMetric")}</th><th>{t("followupsDone")}</th><th>{t("activeWorkWindow")}</th></tr></thead>
                <tbody>{analytics.days.slice().reverse().map((day) => (
                  <tr key={day.date}>
                    <td><strong>{day.label}</strong></td>
                    <td>{day.calls}<br /><small>{t("outbound")}: {day.outbound} · {t("incoming")}: {day.incoming}</small></td>
                    <td>{formatDuration(day.talkSeconds)}<br /><small>{t("avgCall")}: {formatDuration(day.avgCallSeconds)}</small></td>
                    <td>{day.touchedLeads}</td>
                    <td>{day.newLeads}</td>
                    <td>{day.summaries}</td>
                    <td>{day.recordings}</td>
                    <td>{day.followupsDone}<br /><small>{t("followupsCreated")}: {day.followupsCreated}</small></td>
                    <td>{formatDuration(day.workWindowSeconds)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>
        ) : <Empty title={t("noAnalyticsData")} note={t("analyticsNote")} />}
      </div>
    </div>
  );
}

function buildAnalytics(db, period, selectedDate) {
  const dateKeys = buildDateRange(period, selectedDate);
  const days = dateKeys.map((date) => createAnalyticsDay(date));
  const dayMap = Object.fromEntries(days.map((day) => [day.date, day]));

  const addEventToDay = (date, timestamp) => {
    const key = localDateKey(date);
    const day = dayMap[key];
    if (!day) return null;
    if (timestamp) day.events.push(new Date(timestamp).getTime());
    return day;
  };

  const touchLead = (date, candidateId, timestamp) => {
    const day = addEventToDay(date, timestamp);
    if (day && candidateId) day.touchedCandidateIds.add(candidateId);
    return day;
  };

  db.candidates.forEach((candidate) => {
    const createdDay = dayMap[localDateKey(candidate.createdAt)];
    if (createdDay) createdDay.newLeads += 1;
  });

  db.activities.forEach((activity) => {
    if (!isProductiveActivity(activity)) return;
    const day = touchLead(activity.createdAt, activity.candidateId, activity.createdAt);
    if (day && activity.type === "status") day.statusChanges += 1;
  });

  db.followups.forEach((followup) => {
    const createdDay = dayMap[localDateKey(followup.createdAt)];
    if (createdDay) createdDay.followupsCreated += 1;
    const doneDay = followup.completedAt ? touchLead(followup.completedAt, followup.candidateId, followup.completedAt) : null;
    if (doneDay) doneDay.followupsDone += 1;
  });

  db.quoCalls.forEach((call) => {
    if (!call.candidateId) return;
    const callDate = call.completedAt || call.answeredAt || call.createdAt;
    const day = touchLead(callDate, call.candidateId, callDate);
    if (!day) return;
    day.calls += 1;
    if (call.direction === "outgoing") day.outbound += 1;
    if (call.direction === "incoming") day.incoming += 1;
    const duration = callDurationSeconds(call);
    day.talkSeconds += duration;
    if (call.summary.length || call.nextSteps.length) day.summaries += 1;
    if (call.recordingUrl) day.recordings += 1;
    if (call.answeredAt) day.answered += 1;
    if (duration >= 120 || call.summary.length || call.nextSteps.length || call.recordingUrl) day.productiveCalls += 1;
  });

  days.forEach((day) => {
    const times = day.events.filter(Number.isFinite).sort((a, b) => a - b);
    day.touchedLeads = day.touchedCandidateIds.size;
    day.avgCallSeconds = day.calls ? Math.round(day.talkSeconds / day.calls) : 0;
    day.workWindowSeconds = times.length > 1 ? Math.round((times.at(-1) - times[0]) / 1000) : 0;
    day.hasActivity = Boolean(day.calls || day.touchedLeads || day.followupsCreated || day.followupsDone || day.newLeads);
    delete day.touchedCandidateIds;
    delete day.events;
  });

  const totals = days.reduce((acc, day) => {
    ["calls", "outbound", "incoming", "answered", "talkSeconds", "newLeads", "touchedLeads", "followupsCreated", "followupsDone", "summaries", "recordings", "productiveCalls", "statusChanges", "workWindowSeconds"].forEach((key) => {
      acc[key] += day[key] || 0;
    });
    return acc;
  }, {
    calls: 0,
    outbound: 0,
    incoming: 0,
    answered: 0,
    talkSeconds: 0,
    newLeads: 0,
    touchedLeads: 0,
    followupsCreated: 0,
    followupsDone: 0,
    summaries: 0,
    recordings: 0,
    productiveCalls: 0,
    statusChanges: 0,
    workWindowSeconds: 0
  });
  totals.avgCallSeconds = totals.calls ? Math.round(totals.talkSeconds / totals.calls) : 0;

  return {
    days,
    totals,
    max: {
      calls: Math.max(...days.map((day) => day.calls), 0),
      touchedLeads: Math.max(...days.map((day) => day.touchedLeads), 0),
      talkSeconds: Math.max(...days.map((day) => day.talkSeconds), 0)
    }
  };
}

function createAnalyticsDay(date) {
  const dateObj = new Date(`${date}T12:00:00`);
  return {
    date,
    label: dateObj.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }),
    shortLabel: dateObj.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }).replace(".", ""),
    calls: 0,
    outbound: 0,
    incoming: 0,
    answered: 0,
    talkSeconds: 0,
    avgCallSeconds: 0,
    newLeads: 0,
    touchedLeads: 0,
    followupsCreated: 0,
    followupsDone: 0,
    summaries: 0,
    recordings: 0,
    productiveCalls: 0,
    statusChanges: 0,
    workWindowSeconds: 0,
    hasActivity: false,
    touchedCandidateIds: new Set(),
    events: []
  };
}

function isProductiveActivity(activity) {
  const type = String(activity.type || "").toLowerCase();
  const text = String(activity.text || "").toLowerCase();
  if (!activity.candidateId) return false;
  if (["create", "lead"].includes(type)) return false;
  if (text.includes("csv import") || text.includes("imported from facebook csv")) return false;
  if (text.includes("auto follow-up created")) return false;
  return ["edit", "status", "call", "note", "document", "insurance"].includes(type);
}

function callDurationSeconds(call) {
  const timed = secondsBetween(call.answeredAt, call.completedAt);
  if (timed) return timed;
  return Math.max(0, Math.round(Number(call.recordingDuration) || 0));
}

const settingsDraftKey = (workspaceId) => `ownerhub_settings_draft_${workspaceId}`;

function readSettingsDraft(workspaceId) {
  if (!workspaceId || typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(settingsDraftKey(workspaceId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSettingsDraft(workspaceId, settings) {
  if (!workspaceId || typeof window === "undefined") return;
  window.sessionStorage.setItem(settingsDraftKey(workspaceId), JSON.stringify(settings));
}

function clearSettingsDraft(workspaceId) {
  if (!workspaceId || typeof window === "undefined") return;
  window.sessionStorage.removeItem(settingsDraftKey(workspaceId));
}

function SettingsView({ db, workspace, updateSettings, reload }) {
  const { t } = useI18n();
  const [settings, setSettingsState] = useState(() => readSettingsDraft(workspace?.id) || db.settings);
  const [tokens, setTokens] = useState([]);
  const [quoWebhook, setQuoWebhook] = useState(null);
  const [quoSigningSecret, setQuoSigningSecret] = useState("");
  const [generatedQuoToken, setGeneratedQuoToken] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [busy, setBusy] = useState(false);
  const webhookUrl = typeof window === "undefined" ? "/api/make/leads" : `${window.location.origin}/api/make/leads`;
  const quoWebhookBaseUrl = typeof window === "undefined" ? "/api/quo/webhooks" : `${window.location.origin}/api/quo/webhooks`;
  const currentToken = tokens.find((token) => token.active) || tokens[0] || null;
  const visibleToken = currentToken?.token_value || generatedToken || "";
  const visibleQuoToken = quoWebhook?.token_value || generatedQuoToken || "";
  const quoWebhookUrl = visibleQuoToken ? `${quoWebhookBaseUrl}?token=${encodeURIComponent(visibleQuoToken)}` : quoWebhookBaseUrl;

  const setSettingsDraft = (next) => {
    setSettingsState(next);
    writeSettingsDraft(workspace?.id, next);
  };

  useEffect(() => {
    const draft = readSettingsDraft(workspace?.id);
    setSettingsState(draft || db.settings);
  }, [workspace?.id, db.settings]);

  useEffect(() => {
    if (!workspace?.id) return;
    loadTokens();
    loadQuoWebhook();
  }, [workspace?.id]);

  async function hashToken(token) {
    const data = new TextEncoder().encode(token);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function loadTokens() {
    let { data, error } = await supabase
      .from("workspace_webhook_tokens")
      .select("id, name, token_value, token_preview, active, created_at, last_used_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });

    if (error?.code === "42703") {
      const fallback = await supabase
        .from("workspace_webhook_tokens")
        .select("id, name, token_preview, active, created_at, last_used_at")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (!error) setTokens(data || []);
  }

  async function loadQuoWebhook() {
    const { data, error } = await supabase
      .from("workspace_quo_webhooks")
      .select("id, label, token_value, token_preview, signing_secret, active, created_at, last_used_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!error) {
      const current = data?.[0] || null;
      setQuoWebhook(current);
      setQuoSigningSecret(current?.signing_secret || "");
    }
  }

  async function copyToken(token) {
    if (!token) return;
    try {
      await globalThis.navigator?.clipboard?.writeText(token);
    } catch {
      // Selecting the field still gives a reliable manual copy fallback.
    }
  }

  async function generateToken() {
    if (!workspace?.id) return;
    setBusy(true);
    try {
      const raw = new Uint8Array(32);
      crypto.getRandomValues(raw);
      const token = `ohwh_${Array.from(raw).map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
      const tokenHash = await hashToken(token);
      const preview = `${token.slice(0, 10)}...${token.slice(-6)}`;

      const deleted = await supabase
        .from("workspace_webhook_tokens")
        .delete()
        .eq("workspace_id", workspace.id);
      if (deleted.error) throw deleted.error;

      const { error } = await supabase.from("workspace_webhook_tokens").insert({
        workspace_id: workspace.id,
        name: "Make",
        token_value: token,
        token_hash: tokenHash,
        token_preview: preview,
        active: true
      });
      if (error) throw error;
      setGeneratedToken(token);
      await loadTokens();
      setShowGuide(true);
    } finally {
      setBusy(false);
    }
  }

  async function generateQuoWebhook() {
    if (!workspace?.id) return;
    setBusy(true);
    try {
      const raw = new Uint8Array(32);
      crypto.getRandomValues(raw);
      const token = `ohquo_${Array.from(raw).map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
      const tokenHash = await hashToken(token);
      const preview = `${token.slice(0, 11)}...${token.slice(-6)}`;

      const deleted = await supabase
        .from("workspace_quo_webhooks")
        .delete()
        .eq("workspace_id", workspace.id);
      if (deleted.error) throw deleted.error;

      const { error } = await supabase.from("workspace_quo_webhooks").insert({
        workspace_id: workspace.id,
        label: "Quo",
        token_value: token,
        token_hash: tokenHash,
        token_preview: preview,
        signing_secret: quoSigningSecret.trim(),
        active: true
      });
      if (error) throw error;
      setGeneratedQuoToken(token);
      await loadQuoWebhook();
    } finally {
      setBusy(false);
    }
  }

  async function saveQuoSecret() {
    if (!workspace?.id || !quoWebhook?.id) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("workspace_quo_webhooks")
        .update({ signing_secret: quoSigningSecret.trim() })
        .eq("id", quoWebhook.id)
        .eq("workspace_id", workspace.id);
      if (error) throw error;
      await loadQuoWebhook();
    } finally {
      setBusy(false);
    }
  }

  async function revokeToken(id) {
    const { error } = await supabase
      .from("workspace_webhook_tokens")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspace.id);
    if (!error) {
      setGeneratedToken("");
      await loadTokens();
    }
  }

  async function saveSettingsDraft() {
    const saved = await updateSettings(settings);
    if (saved) clearSettingsDraft(workspace?.id);
  }

  return (
    <>
      <div className="card card-pad settings">
        <SectionTitle title={t("settingsTitle")} />
        <div className="settings-row"><div className="settings-copy"><strong>{t("company")}</strong><p>{t("companyNote")}</p></div><input value={settings.companyName} onChange={(event) => setSettingsDraft({ ...settings, companyName: event.target.value })} /></div>
        <div className="settings-row"><div className="settings-copy"><strong>{t("hrName")}</strong><p>{t("hrNameNote")}</p></div><input value={settings.hrName} onChange={(event) => setSettingsDraft({ ...settings, hrName: event.target.value })} /></div>
        <div className="settings-row"><div className="settings-copy"><strong>{t("interfaceLanguage")}</strong><p>{t("interfaceLanguageNote")}</p></div><select value={settings.interfaceLanguage || "ru"} onChange={(event) => setSettingsDraft({ ...settings, interfaceLanguage: event.target.value })}><option value="ru">{t("russian")}</option><option value="en">{t("english")}</option></select></div>
        <div className="settings-row"><div className="settings-copy"><strong>{t("sync")}</strong><p>{t("syncNote")}</p></div><button className="btn" onClick={reload}>{t("refreshData")}</button></div>
        <div className="settings-row"><div className="settings-copy"><strong>{t("save")}</strong><p>{t("saveNote")}</p></div><button className="btn btn-primary" onClick={saveSettingsDraft}>{t("save")}</button></div>
      </div>

      <div className="card card-pad settings mt">
        <SectionTitle title="Make Integration" action={<button className="btn btn-small" onClick={() => setShowGuide(true)}>{t("instruction")}</button>} />
        <div className="settings-row">
          <div className="settings-copy"><strong>Webhook URL</strong><p>{t("webhookUrlNote")}</p></div>
          <input readOnly value={webhookUrl} onFocus={(event) => event.target.select()} />
        </div>
        <div className="settings-row">
          <div className="settings-copy"><strong>{t("personalToken")}</strong><p>{t("personalTokenNote")}</p></div>
          <button className="btn btn-primary" disabled={busy || !workspace?.id} onClick={generateToken}>{busy ? t("creating") : t("generateToken")}</button>
        </div>
        <div className="settings-row">
          <div className="settings-copy"><strong>{t("currentToken")}</strong><p>{t("currentTokenNote")}</p></div>
          <div className="token-copy-box">
            <textarea readOnly value={visibleToken || t("tokenMissing")} onFocus={(event) => event.target.select()} />
            <button className="btn btn-small" disabled={!visibleToken} onClick={() => copyToken(visibleToken)}>{t("copyToken")}</button>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-copy"><strong>{t("tokenStatus")}</strong><p>{t("tokenStatusNote")}</p></div>
          <div className="token-list">
            {tokens.length ? tokens.map((token) => (
              <div className="token-row" key={token.id}>
                <div><strong>{token.name}</strong><span>{token.token_preview} · {token.active ? "active" : "inactive"}</span></div>
                <button className="btn btn-small btn-danger" onClick={() => revokeToken(token.id)}>{t("delete")}</button>
              </div>
            )) : <div className="section-note">{t("noTokens")}</div>}
          </div>
        </div>
      </div>

      <div className="card card-pad settings mt">
        <SectionTitle title={t("quoIntegration")} />
        <div className="settings-row">
          <div className="settings-copy"><strong>{t("quoWebhookUrl")}</strong><p>{t("quoWebhookUrlNote")}</p></div>
          <div className="token-copy-box">
            <textarea readOnly value={visibleQuoToken ? quoWebhookUrl : t("tokenMissing")} onFocus={(event) => event.target.select()} />
            <button className="btn btn-small" disabled={!visibleQuoToken} onClick={() => copyToken(quoWebhookUrl)}>{t("copyWebhookUrl")}</button>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-copy"><strong>{t("personalToken")}</strong><p>{t("quoTokenNote")}</p></div>
          <button className="btn btn-primary" disabled={busy || !workspace?.id} onClick={generateQuoWebhook}>{busy ? t("creating") : t("generateQuoWebhook")}</button>
        </div>
        <div className="settings-row">
          <div className="settings-copy"><strong>{t("quoSigningSecret")}</strong><p>{t("quoSigningSecretNote")}</p></div>
          <div className="token-copy-box">
            <input value={quoSigningSecret} placeholder="base64 signing secret" onChange={(event) => setQuoSigningSecret(event.target.value)} />
            <button className="btn btn-small" disabled={!quoWebhook?.id || busy} onClick={saveQuoSecret}>{t("saveQuoSecret")}</button>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-copy"><strong>{t("quoEvents")}</strong><p>{t("quoEventsNote")}</p></div>
          <div className="token-list">
            <div className="token-row"><div><strong>call.ringing</strong><span>Show live incoming call banner</span></div><span className="badge badge-green">required</span></div>
            <div className="token-row"><div><strong>call.completed</strong><span>Match phone number to candidate</span></div><span className="badge badge-green">required</span></div>
            <div className="token-row"><div><strong>call.summary.completed</strong><span>Import summary and next steps</span></div><span className="badge badge-green">required</span></div>
            <div className="token-row"><div><strong>call.recording.completed</strong><span>Link call recording URL</span></div><span className="badge badge-green">required</span></div>
            <div className="token-row"><div><strong>message.received</strong><span>Link incoming document photos</span></div><span className="badge badge-green">required</span></div>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-copy"><strong>{t("welcomeSms")}</strong><p>{t("welcomeSmsNote")}</p></div>
          <label className="toggle-row"><input type="checkbox" checked={Boolean(settings.welcomeSmsEnabled)} onChange={(event) => setSettingsDraft({ ...settings, welcomeSmsEnabled: event.target.checked })} /> <span>{t("sendWelcomeSms")}</span></label>
        </div>
        <div className="settings-row">
          <div className="settings-copy"><strong>{t("quoApiKey")}</strong><p>{t("quoApiKeyNote")}</p></div>
          <input type="password" value={settings.quoApiKey || ""} onChange={(event) => setSettingsDraft({ ...settings, quoApiKey: event.target.value })} placeholder="Quo API key" />
        </div>
        <div className="settings-row">
          <div className="settings-copy"><strong>{t("quoSmsFrom")}</strong><p>{t("quoSmsFromNote")}</p></div>
          <input value={settings.quoSmsFrom || ""} onChange={(event) => setSettingsDraft({ ...settings, quoSmsFrom: event.target.value })} placeholder="PN..." />
        </div>
        <div className="settings-row">
          <div className="settings-copy"><strong>{t("welcomeSmsTemplate")}</strong><p>{t("welcomeSmsTemplateNote")}</p></div>
          <textarea value={settings.welcomeSmsTemplate || ""} onChange={(event) => setSettingsDraft({ ...settings, welcomeSmsTemplate: event.target.value })} />
        </div>
        <div className="settings-row">
          <div className="settings-copy"><strong>{t("welcomeSmsSetupGuide")}</strong><p>{t("welcomeSmsGuideTest")}</p></div>
          <div className="mini-guide">
            <div><span>1</span><p>{t("welcomeSmsGuideApiKey")}</p></div>
            <div><span>2</span><p>{t("welcomeSmsGuideSender")}</p></div>
            <div><span>3</span><p>{t("welcomeSmsGuideSave")}</p></div>
          </div>
        </div>
      </div>

      {showGuide ? <MakeGuideModal webhookUrl={webhookUrl} token={visibleToken} onClose={() => setShowGuide(false)} /> : null}
    </>
  );
}

function MakeGuideModal({ webhookUrl, token, onClose }) {
  const { lang, t } = useI18n();
  const displayToken = token || "TOKEN_FROM_OWNERHUB_SETTINGS";

  if (lang === "en") {
    return (
      <div className="modal-backdrop">
        <div className="modal wide">
          <div className="modal-head"><strong>Make lead setup</strong><button className="btn icon-btn" onClick={onClose}>×</button></div>
          <div className="modal-body guide">
            <div className="guide-step guide-intro">
              <b>What we are building</b>
              <p>The final Make scenario should look like this. For each Facebook Lead Form, it is better to create a separate scenario.</p>
              <pre>{`Facebook Lead Ads - New Lead
→ Facebook Lead Ads - Get Lead Details
→ HTTP - Make a request`}</pre>
            </div>
            <div className="guide-step">
              <b>1. Prepare access</b>
              <p>The Facebook Page must have an Instant Form, and your Facebook account must have lead access for that Page. Instagram leads come through the connected Facebook Page.</p>
            </div>
            <div className="guide-step">
              <b>2. First module: New Lead</b>
              <p>Create a Make scenario and add Facebook Lead Ads → New Lead. Connect Facebook, choose the Page, and choose the exact Form. If the Page is not selectable, use the numeric Page ID, not the page name.</p>
              <pre>{`Module: Facebook Lead Ads - New Lead
Webhook name: OwnerHub - Form Name
Page: choose from dropdown or use numeric Page ID
Form: choose one exact lead form`}</pre>
            </div>
            <div className="guide-step">
              <b>3. Second module: Get Lead Details</b>
              <p>Add Facebook Lead Ads → Get Lead Details. In Lead ID, choose Lead ID from the first New Lead module. Do not choose Full Name, Phone Number, or Email there.</p>
              <pre>{`Module: Facebook Lead Ads - Get Lead Details
Page: same Page
Form: same Form
Lead ID: Lead ID from module 1 - New Lead`}</pre>
            </div>
            <div className="guide-step">
              <b>4. Third module: HTTP</b>
              <p>Add HTTP → Make a request. Authentication type must be No authentication. Security is handled by the x-ownerhub-token header.</p>
              <pre>{`Authentication type: No authentication
URL: ${webhookUrl}
Method: POST
Headers:
  Content-Type: application/json
  x-ownerhub-token: ${displayToken}
Body content type: application/json
Body input method: JSON string
Parse response: Yes`}</pre>
            </div>
            <div className="guide-step">
              <b>5. Body content</b>
              <p>Paste the JSON below. In field_data, choose Field data from the Get Lead Details module. Do not type field_data manually and do not wrap the mapped token in quotes.</p>
              <pre>{`{
  "source": "Facebook Lead Form",
  "field_data": {{Field data}},
  "notes": "Imported from Make"
}`}</pre>
            </div>
            <div className="guide-step">
              <b>6. Smart mapping</b>
              <p>Forms can be different. The webhook reads field_data and maps full_name, phone_number, email, city, state, CDL, truck_make, trailer_make, Russian labels, and similar variants. Unrecognized answers are saved into candidate comments.</p>
            </div>
            <div className="guide-step">
              <b>7. Multiple forms</b>
              <p>Create a separate Make scenario for each Facebook Lead Form. Use the same URL and token when all leads should go into this workspace. Put the form name into source so OwnerHub shows where the lead came from.</p>
            </div>
            <div className="guide-step">
              <b>8. Test</b>
              <p>Click Run once in Make, create a test lead in Meta Lead Ads Testing Tool, and check the HTTP response. A successful response returns ok: true. Then the candidate appears in Candidates.</p>
            </div>
          </div>
          <div className="modal-foot"><button className="btn btn-primary" onClick={onClose}>{t("done")}</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="modal wide">
        <div className="modal-head"><strong>Make lead setup</strong><button className="btn icon-btn" onClick={onClose}>×</button></div>
        <div className="modal-body guide">
          <div className="guide-step guide-intro">
            <b>Что мы собираем</b>
            <p>Финальная цепочка в Make должна быть такой. Для каждой Facebook Lead Form лучше создать отдельный scenario.</p>
            <pre>{`Facebook Lead Ads - New Lead
→ Facebook Lead Ads - Get Lead Details
→ HTTP - Make a request`}</pre>
          </div>

          <div className="guide-step">
            <b>1. Подготовь доступы</b>
            <p>Facebook Page должна иметь Instant Form, а твой Facebook account должен иметь доступ к лидам этой Page. Instagram-лиды работают через Facebook Page, к которой привязан Instagram professional account.</p>
          </div>

          <div className="guide-step">
            <b>2. Первый модуль: New Lead</b>
            <p>В Make создай Scenario и добавь Facebook Lead Ads → New Lead. Подключи Facebook connection, выбери Page из списка и выбери нужную Form. Если Page не выбирается из списка, вставляй numeric Page ID, а не название страницы.</p>
            <pre>{`Module: Facebook Lead Ads - New Lead
Webhook name: OwnerHub - Form Name
Page: choose from dropdown or use numeric Page ID
Form: choose one exact lead form`}</pre>
          </div>

          <div className="guide-step">
            <b>3. Второй модуль: Get Lead Details</b>
            <p>Добавь Facebook Lead Ads → Get Lead Details. В поле Lead ID нужно выбрать Lead ID из первого модуля New Lead. Не выбирай Full Name, Phone Number или Email в этом поле.</p>
            <pre>{`Module: Facebook Lead Ads - Get Lead Details
Page: same Page
Form: same Form
Lead ID: Lead ID from module 1 - New Lead`}</pre>
          </div>

          <div className="guide-step">
            <b>4. Третий модуль: HTTP</b>
            <p>Добавь HTTP → Make a request. Authentication type должен быть No authentication. Безопасность идет через header x-ownerhub-token.</p>
            <pre>{`Authentication type: No authentication
URL: ${webhookUrl}
Method: POST
Headers:
  Content-Type: application/json
  x-ownerhub-token: ${displayToken}
Body content type: application/json
Body input method: JSON string
Parse response: Yes`}</pre>
          </div>

          <div className="guide-step">
            <b>5. Body content</b>
            <p>Вставь JSON ниже. В поле field_data нужно выбрать Field data из второго модуля Get Lead Details. Не пиши field_data руками и не ставь кавычки вокруг выбранного токена.</p>
            <pre>{`{
  "source": "Facebook Lead Form",
  "field_data": {{Field data}},
  "notes": "Imported from Make"
}`}</pre></div>

          <div className="guide-step">
            <b>Если Field data нет в списке</b>
            <p>Тогда выбери отдельные поля из Get Lead Details вручную. Этот вариант хуже для разных форм, но тоже работает.</p>
            <pre>{`{
  "name": "{{Full Name}}",
  "phone": "{{Phone Number}}",
  "email": "{{Email}}",
  "source": "Facebook Lead Form",
  "notes": "Imported from Make"
}`}</pre>
          </div>

          <div className="guide-step">
            <b>6. Smart mapping</b>
            <p>Формы могут быть разными. Webhook читает field_data и сам раскладывает full_name, phone_number, email, city, state, CDL, truck_make, trailer_make, русские названия и похожие варианты. Нераспознанные ответы не теряются: они сохраняются в комментарии кандидата.</p>
          </div>

          <div className="guide-step">
            <b>7. Если форм несколько</b>
            <p>Создай отдельный Make scenario на каждую Facebook Lead Form. URL и token можно использовать те же, если все лиды должны попадать в этот workspace. В source лучше указывать название формы, чтобы в OwnerHub было понятно, откуда пришел лид.</p>
            <pre>{`Scenario 1: Owner ENG Form
New Lead → Get Lead Details → HTTP OwnerHub

Scenario 2: Owner RU Form
New Lead → Get Lead Details → HTTP OwnerHub`}</pre>
          </div>

          <div className="guide-step">
            <b>8. Test</b>
            <p>Нажми Run once в Make, создай тестовый лид в Meta Lead Ads Testing Tool и проверь HTTP response. Успешный ответ выглядит как ok: true. После этого кандидат появится в Candidates.</p>
            <pre>{`Success:
{"ok":true,"action":"created","candidate_id":"..."}`}</pre>
          </div>

          <div className="guide-step">
            <b>Частые ошибки</b>
            <p>Page field принимает Page из dropdown или numeric Page ID, не текстовое название. Lead ID во втором модуле должен приходить из первого модуля New Lead. Field data в HTTP body нужно выбирать из Get Lead Details и ставить без кавычек.</p>
          </div>
        </div>
        <div className="modal-foot"><button className="btn btn-primary" onClick={onClose}>Готово</button></div>
      </div>
    </div>
  );
}

function LocationFields({ draft, setDraft }) {
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [zipStatus, setZipStatus] = useState("");
  const cityQuery = draft.city.trim();
  const cleanZip = String(draft.zip || "").replace(/\D/g, "").slice(0, 5);

  useEffect(() => {
    if (!cityOpen || cityQuery.length < 2) {
      setCitySuggestions([]);
      return;
    }

    const controller = new globalThis.AbortController();
    const query = encodeURIComponent(cityQuery);

    globalThis.fetch(`/api/locations/cities?q=${query}&limit=8`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setCitySuggestions(data?.cities || []))
      .catch((error) => {
        if (error.name !== "AbortError") setCitySuggestions([]);
      });

    return () => controller.abort();
  }, [cityOpen, cityQuery]);

  useEffect(() => {
    if (cleanZip.length !== 5) {
      setZipStatus("");
      return;
    }

    const controller = new globalThis.AbortController();
    setZipStatus("Looking up ZIP...");

    globalThis.fetch(`/api/locations/zip/${cleanZip}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data?.location) {
          setZipStatus("ZIP not found");
          return;
        }

        setDraft((current) => ({
          ...current,
          city: data.location.city,
          state: data.location.state,
          zip: data.location.zip
        }));
        setZipStatus("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setZipStatus("ZIP not found");
      });

    return () => controller.abort();
  }, [cleanZip, setDraft]);

  const chooseCity = (location) => {
    setDraft((current) => ({
      ...current,
      city: location.city,
      state: location.state
    }));
    setCityOpen(false);
    setCitySuggestions([]);
  };

  return (
    <>
      <div className="location-field">
        <label>City<input name="city" value={draft.city} onFocus={() => setCityOpen(true)} onChange={(event) => {
          setDraft((current) => ({ ...current, city: event.target.value }));
          setCityOpen(true);
        }} onBlur={() => setTimeout(() => setCityOpen(false), 140)} autoComplete="off" /></label>
        {cityOpen && citySuggestions.length ? (
          <div className="autocomplete-menu">
            {citySuggestions.map((location) => (
              <button type="button" key={`${location.city}-${location.state}`} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseCity(location)}>
                <strong>{location.city}</strong><span>{location.state}{location.zip ? ` · ${location.zip}` : ""}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <label>State<select name="state" value={draft.state} onChange={(event) => setDraft((current) => ({ ...current, state: event.target.value }))}><option value="">Выберите</option>{states.map((state) => <option key={state}>{state}</option>)}</select></label>
      <label>ZIP<input name="zip" inputMode="numeric" value={draft.zip} onChange={(event) => setDraft((current) => ({ ...current, zip: event.target.value.replace(/\D/g, "").slice(0, 5) }))} />{zipStatus ? <span className={`field-hint ${zipStatus.includes("not") ? "error" : ""}`}>{zipStatus}</span> : null}</label>
    </>
  );
}

function CsvImportModal({ onClose, onImport }) {
  const { t } = useI18n();
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const runImport = async () => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const summary = await onImport(files);
      setResult(summary);
    } catch (importError) {
      setError(importError.message || "Не удалось импортировать CSV");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head"><strong>{t("csvTitle")}</strong><button className="btn icon-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="import-panel">
            <label className="field-span">
              {t("csvFiles")}
              <input
                type="file"
                accept=".csv,text/csv,.tsv,text/tab-separated-values"
                multiple
                disabled={Boolean(result) || busy}
                onChange={(event) => setFiles(Array.from(event.target.files || []))}
              />
            </label>
            <div className="section-note">
              {t("csvHint")}
            </div>
            {files.length ? (
              <div className="import-file-list">
                {files.map((file) => <div key={`${file.name}-${file.size}`}>{file.name}<span>{Math.max(1, Math.round(file.size / 1024))} KB</span></div>)}
              </div>
            ) : null}
            {result ? (
              <div className="import-result">
                <strong>{t("csvReady")}</strong>
                <span>{t("csvFileCount", { count: result.files })}</span>
                <span>{t("csvRows", { count: result.parsed })}</span>
                <span>{t("csvCreated", { count: result.created })}</span>
                <span>{t("csvUpdated", { count: result.updated })}</span>
                <span>{t("csvSkipped", { count: result.skipped })}</span>
              </div>
            ) : null}
            {error ? <div className="field-hint error">{error}</div> : null}
          </div>
        </div>
        <div className="modal-foot">
          {result ? (
            <button className="btn btn-primary" onClick={onClose}>{t("done")}</button>
          ) : (
            <>
              <button className="btn" onClick={onClose}>{t("close")}</button>
              <button className="btn btn-primary" disabled={!files.length || busy} onClick={runImport}>{busy ? t("importing") : t("importAction")}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CandidateModal({ candidate, onClose, onSave }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(structuredClone(candidate));
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updateNested = (group, key, value) => setDraft((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));

  return (
    <div className="modal-backdrop">
      <div className="modal wide">
        <div className="modal-head"><strong>{candidate.firstName || candidate.lastName ? t("editCandidateModal") : t("newCandidateModal")}</strong><button className="btn icon-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="field-grid-3">
            <label>{t("firstName")}<input value={draft.firstName} onChange={(event) => update("firstName", event.target.value)} /></label>
            <label>{t("lastName")}<input value={draft.lastName} onChange={(event) => update("lastName", event.target.value)} /></label>
            <label>{t("language")}<select value={draft.language} onChange={(event) => update("language", event.target.value)}>{["Russian", "Ukrainian", "English"].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>{t("phone")}<input value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></label>
            <label>Email<input value={draft.email} onChange={(event) => update("email", event.target.value)} /></label>
            <label>{t("source")}<input value={draft.source} onChange={(event) => update("source", event.target.value)} /></label>
            <LocationFields draft={draft} setDraft={setDraft} />
            <label>{t("format")}<select value={draft.workPreference} onChange={(event) => update("workPreference", event.target.value)}><option value="">{t("notSelected")}</option>{["Local", "OTR", "Both", "Not sure"].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>{t("homeTime")}<input value={draft.homeTime} onChange={(event) => update("homeTime", event.target.value)} /></label>
            <label>{t("startDate")}<input type="date" value={draft.startDate} onChange={(event) => update("startDate", event.target.value)} /></label>
            <label>CDL<select value={draft.cdl} onChange={(event) => update("cdl", event.target.value)}><option value="">{t("notSpecified")}</option><option>Yes</option><option>No</option></select></label>
            <label>Experience years<input type="number" value={draft.experienceYears} onChange={(event) => update("experienceYears", event.target.value)} /></label>
            <label>Car hauling years<input type="number" value={draft.carHaulingYears} onChange={(event) => update("carHaulingYears", event.target.value)} /></label>
            <label>Truck make<input value={draft.truck.make} onChange={(event) => updateNested("truck", "make", event.target.value)} /></label>
            <label>Truck model<input value={draft.truck.model} onChange={(event) => updateNested("truck", "model", event.target.value)} /></label>
            <label>Truck year<input type="number" value={draft.truck.year} onChange={(event) => updateNested("truck", "year", event.target.value)} /></label>
            <label>Trailer make<input value={draft.trailer.make} onChange={(event) => updateNested("trailer", "make", event.target.value)} /></label>
            <label>Trailer model<input value={draft.trailer.model} onChange={(event) => updateNested("trailer", "model", event.target.value)} /></label>
            <label>Trailer year<input type="number" value={draft.trailer.year} onChange={(event) => updateNested("trailer", "year", event.target.value)} /></label>
            <label className="field-span">{t("note")}<textarea value={draft.notes} onChange={(event) => update("notes", event.target.value)} /></label>
          </div>
        </div>
        <div className="modal-foot"><button className="btn" onClick={onClose}>{t("cancel")}</button><button className="btn btn-primary" onClick={() => onSave({ ...draft, score: calculateScore(draft), updatedAt: new Date().toISOString() })}>{t("save")}</button></div>
      </div>
    </div>
  );
}

function FollowupModal({ candidates, defaultCandidateId, onClose, onSave }) {
  const { t } = useI18n();
  const [candidateId, setCandidateId] = useState(defaultCandidateId);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("10:00");
  const [type, setType] = useState("Call");
  const [note, setNote] = useState("");
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head"><strong>{t("newFollowup")}</strong><button className="btn icon-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="field-grid">
            <label className="field-span">{t("candidate")}<select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}><option value="">{t("chooseCandidate")}</option>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{fullName(candidate)} · {[candidate.city, candidate.state].filter(Boolean).join(", ")}</option>)}</select></label>
            <label>{t("date")}<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
            <label>{t("time")}<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
            <label>{t("type")}<select value={type} onChange={(event) => setType(event.target.value)}>{["Call", "WhatsApp", "SMS", "Email"].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="field-span">{t("note")}<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("whatToDo")} /></label>
          </div>
        </div>
        <div className="modal-foot"><button className="btn" onClick={onClose}>{t("cancel")}</button><button className="btn btn-primary" onClick={() => candidateId && onSave({ candidateId, date, time, type, note })}>{t("add")}</button></div>
      </div>
    </div>
  );
}

function KnowledgeModal({ item, onClose, onSave }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState({
    ...item,
    tagsText: (item.tags || []).join(", ")
  });
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="modal-backdrop">
      <div className="modal wide">
        <div className="modal-head"><strong>{item.title ? t("editKnowledge") : t("newKnowledge")}</strong><button className="btn icon-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="field-grid">
            <label>{t("title")}<input value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder={t("knowledgeTitlePlaceholder")} /></label>
            <label>{t("category")}<select value={draft.category} onChange={(event) => update("category", event.target.value)}>{knowledgeCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label>{t("order")}<input type="number" value={draft.sortOrder} onChange={(event) => update("sortOrder", event.target.value)} /></label>
            <label>Tags<input value={draft.tagsText} onChange={(event) => update("tagsText", event.target.value)} placeholder="insurance, objection, docs" /></label>
            <label className="field-span">{t("content")}<textarea className="knowledge-textarea" value={draft.content} onChange={(event) => update("content", event.target.value)} placeholder={t("knowledgeContentPlaceholder")} /></label>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>{t("cancel")}</button>
          <button className="btn btn-primary" onClick={() => onSave({
            ...draft,
            tags: draft.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean)
          })}>{t("save")}</button>
        </div>
      </div>
    </div>
  );
}

function Person({ candidate }) {
  const { t } = useI18n();
  return <div className="person"><div className="avatar">{initials(candidate)}</div><div><strong>{fullName(candidate)}</strong><small>{candidate.phone || candidate.email || t("noContact")}</small></div></div>;
}

function StatusBadge({ status }) {
  const { t } = useI18n();
  return <span className={`badge ${badgeClass(status)}`}>{statusLabel(status, t)}</span>;
}

function Score({ value, small = false }) {
  return <div className={`score ${scoreClass(value)} ${small ? "score-small" : ""}`}>{value}</div>;
}

function Empty({ title, note }) {
  return <div className="empty"><div className="empty-icon">◎</div><strong>{title}</strong><div>{note}</div></div>;
}

function FollowItem({ followup, candidate, openCandidate, completeFollowup, snoozeFollowup }) {
  const { t } = useI18n();
  return (
    <div className="follow-item">
      <div className="follow-time">{followup.time || "-"}<div>{fmtDate(followup.date).split(" ").slice(0, 2).join(" ")}</div></div>
      <div className="follow-main" onClick={() => candidate && openCandidate?.(candidate.id)}><strong>{candidate ? fullName(candidate) : t("deletedCandidate")}</strong><span>{followup.type} · {followup.note || t("noComment")}</span></div>
      {followup.status === "open" && completeFollowup ? <div className="follow-actions"><button className="btn btn-small" onClick={() => completeFollowup(followup.id)}>✓</button><button className="btn btn-small" onClick={() => snoozeFollowup(followup.id)}>+1</button></div> : followup.status === "done" ? <span className="badge badge-green">Done</span> : null}
    </div>
  );
}
