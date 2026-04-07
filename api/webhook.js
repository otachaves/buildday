const Stripe = require('stripe');
const { Resend } = require('resend');
const { google } = require('googleapis');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

const SHEET_ID    = '1wvRwIxLSP-Vuxx68EUhtjYcQPVoCldF_Qjikahr_-y8';
const ADMIN_EMAIL = 'communitymanager@archipelagoaec.com';
const FROM_EMAIL  = 'noreply@build.archipelagoaec.com';

const TICKET_NAMES = {
  general_early:    'General Admission — Early Bird ($49)',
  student_early:    'Student — Early Bird ($29)',
  general_standard: 'General Admission ($79)',
  student_standard: 'Student ($39)',
};

module.exports.config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig     = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type !== 'checkout.session.completed') return res.status(200).end();

  const session = event.data.object;
  const meta    = session.metadata || {};
  const { ticket, first, last, email, company, role, diet, phone } = meta;

  // 1. Google Sheets
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toISOString(),
          TICKET_NAMES[ticket] || ticket,
          first, last, email,
          company || '—',
          role    || '—',
          diet    || '—',
          phone   || '—',
        ]],
      },
    });
  } catch (err) {
    console.error('Sheets error:', err);
  }

  // 2. Email to attendee
  try {
    await resend.emails.send({
      from:    `BuildDay <${FROM_EMAIL}>`,
      to:      email,
      subject: "You're registered for BuildDay — June 6 🏗️",
      html:    attendeeEmail({ first, ticket }),
    });
  } catch (err) {
    console.error('Resend attendee error:', err);
  }

  // 3. Email to admin
  try {
    await resend.emails.send({
      from:    `BuildDay <${FROM_EMAIL}>`,
      to:      ADMIN_EMAIL,
      subject: `New registration: ${first} ${last} — ${TICKET_NAMES[ticket] || ticket}`,
      html:    adminEmail({ ticket, first, last, email, company, role, diet, phone }),
    });
  } catch (err) {
    console.error('Resend admin error:', err);
  }

  return res.status(200).json({ received: true });
};

function attendeeEmail({ first, ticket }) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F7F8FC;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:560px;margin:2rem auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07);">
    <div style="background:#0066FF;padding:2rem 2rem 1.5rem;">
      <p style="margin:0;font-size:1.5rem;font-weight:900;color:#fff;letter-spacing:-.5px;">Build<span style="opacity:.75;">Day</span></p>
      <p style="margin:.25rem 0 0;font-size:.85rem;color:rgba(255,255,255,.7);">June 6, 2026 · Segal Building, SFU Vancouver</p>
    </div>
    <div style="padding:2rem;">
      <p style="font-size:1.1rem;font-weight:800;margin:0 0 .75rem;">Hey ${first}! You're in 🎉</p>
      <p style="color:#5A6180;font-size:.92rem;margin:0 0 1.25rem;">Your spot at BuildDay is confirmed. We can't wait to build with you.</p>
      <div style="background:#F7F8FC;border-radius:10px;padding:1rem 1.25rem;margin-bottom:1.5rem;">
        <p style="margin:0 0 .4rem;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0066FF;">Your ticket</p>
        <p style="margin:0;font-weight:800;font-size:.95rem;">${TICKET_NAMES[ticket] || ticket}</p>
      </div>
      <p style="font-size:.88rem;color:#5A6180;margin:0 0 .5rem;"><strong style="color:#0A0E1A;">📅 Date:</strong> June 6, 2026</p>
      <p style="font-size:.88rem;color:#5A6180;margin:0 0 .5rem;"><strong style="color:#0A0E1A;">📍 Venue:</strong> Segal Building — SFU Vancouver<br><span style="padding-left:1.4rem;">500 Granville St, Vancouver, BC V6C 1W6</span></p>
      <p style="font-size:.88rem;color:#5A6180;margin:0 0 1.5rem;"><strong style="color:#0A0E1A;">⏰ Doors open:</strong> 8:00 AM</p>
      <p style="font-size:.82rem;color:#5A6180;border-top:1px solid #DDE2F0;padding-top:1.25rem;margin:0;">Questions? Reply to this email or reach us at <a href="mailto:communitymanager@archipelagoaec.com" style="color:#0066FF;">communitymanager@archipelagoaec.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

function adminEmail({ ticket, first, last, email, company, role, diet, phone }) {
  const rows = [
    ['Ticket',   TICKET_NAMES[ticket] || ticket],
    ['Name',     `${first} ${last}`],
    ['Email',    email],
    ['Company',  company || '—'],
    ['Role',     role    || '—'],
    ['Dietary',  diet    || '—'],
    ['WhatsApp', phone   || '—'],
  ];
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F7F8FC;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:480px;margin:2rem auto;background:#fff;border-radius:16px;padding:1.75rem;box-shadow:0 4px 24px rgba(0,0,0,.07);">
    <p style="font-weight:900;font-size:1rem;margin:0 0 1.25rem;">🏗️ New BuildDay Registration</p>
    <table style="width:100%;border-collapse:collapse;font-size:.88rem;">
      ${rows.map(([k,v]) => `
      <tr>
        <td style="padding:.5rem .75rem .5rem 0;color:#5A6180;font-weight:600;white-space:nowrap;vertical-align:top;">${k}</td>
        <td style="padding:.5rem 0;color:#0A0E1A;">${v}</td>
      </tr>`).join('')}
    </table>
  </div>
</body>
</html>`;
}
