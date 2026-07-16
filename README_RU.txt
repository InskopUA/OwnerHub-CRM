SOFIA RECRUITING HUB - NEXT.JS + SUPABASE

Проект переведен со статического index.html на Next.js, чтобы нормально деплоиться на Vercel и работать с Supabase.

Что внутри:
- Next.js app router;
- Supabase Auth login/signup;
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
3. Deploy.

Важно:
- SUPABASE_SERVICE_ROLE_KEY нельзя добавлять в frontend и нельзя делать NEXT_PUBLIC.
- Безопасность держится на Supabase RLS policies.
- Текущий файл index.html оставлен как legacy backup. Next.js использует app/page.jsx.
