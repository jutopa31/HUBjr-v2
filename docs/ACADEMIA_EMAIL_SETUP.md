# Academia - Recordatorios Semanales por Email (Resend + Supabase Scheduler)

## Requisitos
- Resend API Key
- Dominio verificado en Resend
- Supabase Service Role Key
- Un CRON_SECRET
- URL publica de la app

## Variables de entorno
Configurar en el entorno de produccion:

- RESEND_API_KEY
- RESEND_FROM (ej: "Academia <no-reply@hubjr.app>")
- ACADEMY_REMINDER_SUBJECT (ej: "Tema semanal de Academia")
- ACADEMY_TIMEZONE (ej: "America/Argentina/Buenos_Aires")
- NEXT_PUBLIC_APP_URL (ej: "https://hubjr.app")
- CRON_SECRET (string secreto)
- SUPABASE_SERVICE_ROLE_KEY

## SQL
Ejecutar en Supabase el archivo:
- database/setup_academia_weekly_quizzes.sql

Incluye tabla de logs para evitar envios duplicados.

## Scheduler (Supabase)
1) Supabase Dashboard -> Database -> Scheduled tasks
2) New scheduled task
3) Tipo: HTTP request
4) URL:
   https://<TU_DOMINIO>/api/cron/weekly-topic-reminder
5) Method: POST
6) Schedule (UTC): 0 11 * * 1
   - Lunes 11:00 UTC = Lunes 08:00 America/Argentina/Buenos_Aires
7) Headers:
   Authorization: Bearer <CRON_SECRET>

## Endpoint
El endpoint que ejecuta el envio es:
- pages/api/cron/weekly-topic-reminder.ts

Este endpoint:
- Busca el tema semanal actual
- Lista usuarios (service role)
- Envia email via Resend
- Registra el envio en academy_weekly_reminder_logs
