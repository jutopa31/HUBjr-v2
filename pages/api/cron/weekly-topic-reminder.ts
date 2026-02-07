import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';
const DEFAULT_FROM = 'Academia <no-reply@hubjr.app>';
const DEFAULT_SUBJECT = 'Tema semanal de Academia';
const MAX_RECIPIENTS_PER_REQUEST = 50;

type WeekTopic = {
  topic_title: string;
  summary?: string | null;
};

const getIsoDateInTimeZone = (timeZone: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
};

const getWeekStartIso = (timeZone: string) => {
  const isoDate = getIsoDateInTimeZone(timeZone);
  const [year, month, day] = isoDate.split('-').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = base.getUTCDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  base.setUTCDate(base.getUTCDate() + diff);
  return base.toISOString().split('T')[0];
};

const formatDateRange = (startIso: string, timeZone: string) => {
  const [year, month, day] = startIso.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, day));
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);

  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone,
    day: '2-digit',
    month: 'short'
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
};

const chunkArray = <T,>(arr: T[], size: number) => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';
  const providedSecret = authHeader.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : (req.headers['x-cron-secret'] as string | undefined);

  if (cronSecret && providedSecret !== cronSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!resendApiKey || !supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Missing server configuration' });
  }

  const timeZone = process.env.ACADEMY_TIMEZONE || DEFAULT_TIMEZONE;
  const fromAddress = process.env.RESEND_FROM || DEFAULT_FROM;
  const subject = process.env.ACADEMY_REMINDER_SUBJECT || DEFAULT_SUBJECT;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const weekStartDate = getWeekStartIso(timeZone);

    const { data: existingLog } = await supabaseAdmin
      .from('academy_weekly_reminder_logs')
      .select('id')
      .eq('week_start_date', weekStartDate)
      .maybeSingle();

    if (existingLog) {
      return res.status(200).json({ skipped: true, reason: 'Already sent' });
    }

    const { data: weeklyTopic } = await supabaseAdmin
      .from('academy_weekly_topics')
      .select('topic_title, summary')
      .eq('week_start_date', weekStartDate)
      .maybeSingle();

    const { data: userList, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (userError) {
      console.error('Error listing users:', userError);
      return res.status(500).json({ error: 'Unable to list users' });
    }

    const emails = (userList?.users || [])
      .map((user) => user.email)
      .filter((email): email is string => Boolean(email));

    if (!emails.length) {
      return res.status(200).json({ skipped: true, reason: 'No recipients' });
    }

    const dateRange = formatDateRange(weekStartDate, timeZone);
    const topicTitle = weeklyTopic?.topic_title || 'Tema pendiente';
    const topicSummary = weeklyTopic?.summary || 'Propon un tema semanal desde Academia.';
    const academyLink = appUrl ? `${appUrl}/academia` : 'Academia';

    const textBody = [
      `Tema semanal (${dateRange})`,
      `Tema: ${topicTitle}`,
      `Resumen: ${topicSummary}`,
      '',
      `Accede a Academia: ${academyLink}`
    ].join('\n');

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <h2 style="margin:0 0 8px;">Tema semanal (${dateRange})</h2>
        <p style="margin:0 0 8px;"><strong>Tema:</strong> ${topicTitle}</p>
        <p style="margin:0 0 16px;"><strong>Resumen:</strong> ${topicSummary}</p>
        <a href="${academyLink}" style="display:inline-block;padding:10px 16px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;">
          Abrir Academia
        </a>
      </div>
    `;

    const recipientChunks = chunkArray(emails, MAX_RECIPIENTS_PER_REQUEST);
    for (const chunk of recipientChunks) {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: chunk,
          subject,
          text: textBody,
          html: htmlBody
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resend error:', errorText);
        return res.status(500).json({ error: 'Failed to send emails' });
      }
    }

    await supabaseAdmin
      .from('academy_weekly_reminder_logs')
      .insert([{ week_start_date: weekStartDate, recipient_count: emails.length }]);

    return res.status(200).json({ success: true, recipients: emails.length });
  } catch (error) {
    console.error('Weekly reminder error:', error);
    return res.status(500).json({ error: 'Unexpected error' });
  }
}
