OWNERHUB HRM - NEXT.JS + SUPABASE

Проект переведен со статического index.html на Next.js, чтобы нормально деплоиться на Vercel и работать с Supabase.

Что внутри:
- Next.js app router;
- Supabase Auth login/signup;
- workspace model: один аккаунт = одна отдельная компания/система с изолированными данными;
- хранение кандидатов, follow-ups, документов, insurance, call state и активности в Supabase;
- редактируемая база знаний для скрипта звонка в каждом workspace;
- SQL-схема в файле supabase_schema.sql;
- Vercel env-переменные через .env.example.

Первичная настройка Supabase:
1. Создайте проект в Supabase.
2. Откройте SQL Editor.
3. Вставьте весь код из supabase_schema.sql и нажмите Run.
4. В Supabase Auth создайте пользователя или разрешите signup.

Локальный запуск:
1. Установите зависимости:
   npm install

2. Создайте .env.local по примеру .env.example:
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

3. Запустите:
   npm run dev

4. Откройте:
   http://localhost:3000

Vercel:
1. Подключите GitHub repo к Vercel.
2. В Project Settings -> Environment Variables добавьте:
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
3. Deploy.

Make.com lead webhook:
1. В Vercel добавьте SUPABASE_SERVICE_ROLE_KEY. Это серверный ключ, он используется только в API route.
2. Пользователь входит в OwnerHub HRM и открывает Settings -> Make Integration.
3. Нажимает Generate token.
4. В Make создаёт scenario по схеме:
   Facebook Lead Ads - New Lead
   -> Facebook Lead Ads - Get Lead Details
   -> HTTP - Make a request
5. В первом модуле New Lead выбирается конкретная Page и конкретная Form.
   Если Page не выбирается из списка, нужно вставлять numeric Page ID, а не название страницы.
6. Во втором модуле Get Lead Details в поле Lead ID нужно выбрать Lead ID из первого модуля New Lead.
   Нельзя выбирать Full Name, Phone Number или Email в поле Lead ID.
7. В HTTP -> Make a request:
   Authentication type: No authentication
   Method: POST
   URL: https://your-vercel-domain.vercel.app/api/make/leads
   Headers:
     Content-Type: application/json
     x-ownerhub-token: personal token from Settings
   Body content type: application/json
   Body input method: JSON string
   Parse response: Yes

Основной JSON для Make. Field data нужно выбрать из модуля Get Lead Details и вставить без кавычек:
{
  "source": "Facebook Lead Form",
  "field_data": {{Field data}},
  "notes": "Imported from Make"
}

Если Field data не отображается в Make, можно выбрать отдельные поля из Get Lead Details:
{
  "name": "{{Full Name}}",
  "phone": "{{Phone Number}}",
  "email": "{{Email}}",
  "source": "Facebook Lead Form",
  "notes": "Imported from Make"
}

Webhook делает dedupe по phone или email внутри workspace: если кандидат уже есть, он обновится, если нет - создастся новый.
Каждый token привязан к конкретному workspace, поэтому разные пользователи могут самостоятельно подключить свои Facebook/Instagram лиды.
Если форм несколько, создайте отдельный Make scenario на каждую Facebook Lead Form. URL и token можно использовать те же для одного workspace.
Webhook умеет smart mapping: он читает field_data, разные названия полей вроде full_name, phone_number, city, truck_make и русские названия распознаются автоматически. Нераспознанные ответы сохраняются в notes кандидата.

Call knowledge base:
- вкладка "Скрипт звонка" содержит базу знаний для HR: opening, qualification, terms, insurance, documents, objections и process;
- материалы можно добавлять, редактировать, удалять и искать;
- данные хранятся в таблице call_knowledge_items и изолированы по workspace;
- после обновления проекта обязательно прогоните актуальный supabase_schema.sql, чтобы создать новую таблицу и RLS policies.

Важно:
- SUPABASE_SERVICE_ROLE_KEY нельзя добавлять во frontend и нельзя делать NEXT_PUBLIC.
- Безопасность держится на Supabase RLS policies.
- Каждый пользователь видит только данные своего workspace.
- Текущий файл index.html оставлен как legacy backup. Next.js использует app/page.jsx.
