OWNERHUB HRM - NEXT.JS + SUPABASE

Проект переведен со статического index.html на Next.js, чтобы нормально деплоиться на Vercel и работать с Supabase.

Что внутри:
- Next.js app router;
- Supabase Auth login/signup;
- workspace model: один аккаунт = одна отдельная компания/система с изолированными данными;
- хранение кандидатов, follow-ups, документов, insurance, call state и активности в Supabase;
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
   OWNERHUB_MAKE_WEBHOOK_SECRET
3. Deploy.

Make.com lead webhook:
1. В Vercel добавьте SUPABASE_SERVICE_ROLE_KEY. Это серверный ключ, он используется только в API route.
2. В Vercel добавьте OWNERHUB_MAKE_WEBHOOK_SECRET. Придумайте длинный секрет, например 32+ символа.
3. Если в Supabase будет больше одного workspace, добавьте OWNERHUB_MAKE_WORKSPACE_ID.
4. В Make создайте HTTP -> Make a request:
   Method: POST
   URL: https://your-vercel-domain.vercel.app/api/make/leads
   Headers:
     Content-Type: application/json
     x-ownerhub-secret: значение OWNERHUB_MAKE_WEBHOOK_SECRET
   Body type: Raw JSON

Пример JSON для Make:
{
  "name": "Alex Ivanov",
  "phone": "+1 214 555 0184",
  "email": "alex@example.com",
  "source": "Facebook Lead Form",
  "city": "Dallas",
  "state": "TX",
  "zip": "75201",
  "workPreference": "Local",
  "truckMake": "Ford",
  "truckModel": "F-350",
  "trailerMake": "Kaufman",
  "notes": "Imported from Make"
}

Webhook делает dedupe по phone или email внутри workspace: если кандидат уже есть, он обновится, если нет - создастся новый.

Важно:
- SUPABASE_SERVICE_ROLE_KEY нельзя добавлять во frontend и нельзя делать NEXT_PUBLIC.
- Безопасность держится на Supabase RLS policies.
- Каждый пользователь видит только данные своего workspace.
- Текущий файл index.html оставлен как legacy backup. Next.js использует app/page.jsx.
