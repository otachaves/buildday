export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const data = req.body;
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = 'otavio@archipelagoaec.com';

  const photoHtml = data.photo
    ? `<img src="${data.photo}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid #3ecfb2;">`
    : `<div style="width:80px;height:80px;border-radius:50%;background:#d0f5ee;display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#0f1f3d;">${(data.firstname||'')[0]}${(data.lastname||'')[0]}</div>`;

  const allExpertise = [...(data.expertise||[]), data.expertiseOther].filter(Boolean);

  const adminHtml = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:0 0 32px">
      <div style="background:#0f1f3d;padding:24px;text-align:center">
        <div style="display:inline-block;background:#3ecfb2;color:#0f1f3d;font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;padding:4px 12px;border-radius:20px;margin-bottom:10px">BuildDay Vancouver</div>
        <h1 style="color:white;font-size:22px;margin:0">New Mentor Application</h1>
      </div>
      <div style="padding:28px 24px;background:white;margin:16px;border-radius:12px;border:1px solid #e2e8f0">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
          ${photoHtml}
          <div>
            <div style="font-size:20px;font-weight:700;color:#0f1f3d">${data.firstname} ${data.lastname}</div>
            <div style="color:#64748b;font-size:13px">${data.jobtitle ? data.jobtitle + ' · ' : ''}${data.company}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr><td style="padding:8px 0;color:#94a3b8;width:130px;vertical-align:top">Email</td><td style="padding:8px 0;color:#1e293b">${data.email}</td></tr>
          ${data.phone ? `<tr><td style="padding:8px 0;color:#94a3b8;vertical-align:top">Phone</td><td style="padding:8px 0;color:#1e293b">${data.phone}</td></tr>` : ''}
          ${data.linkedin ? `<tr><td style="padding:8px 0;color:#94a3b8;vertical-align:top">LinkedIn</td><td style="padding:8px 0"><a href="${data.linkedin}" style="color:#3ecfb2">${data.linkedin}</a></td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#94a3b8;vertical-align:top">Event</td><td style="padding:8px 0;color:#1e293b">${data.event}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;vertical-align:top">Expertise</td><td style="padding:8px 0;color:#1e293b">${allExpertise.join(', ')}</td></tr>
          ${data.availability?.length ? `<tr><td style="padding:8px 0;color:#94a3b8;vertical-align:top">June 6 availability</td><td style="padding:8px 0;color:#1e293b">${data.availability.join(', ')}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#94a3b8;vertical-align:top">Can help with</td><td style="padding:8px 0;color:#1e293b">${(data.support||[]).join(', ')}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;vertical-align:top">One area focus</td><td style="padding:8px 0;color:#1e293b">${data.onearea}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;vertical-align:top">Hackathon exp.</td><td style="padding:8px 0;color:#1e293b">${data.hackathon}</td></tr>
        </table>
        <div style="font-size:11px;color:#cbd5e1;margin-top:16px;padding-top:16px;border-top:1px solid #f1f5f9">Submitted ${data.submittedAt} PT</div>
      </div>
    </div>`;

  const confirmHtml = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:0 0 32px">
      <div style="background:#0f1f3d;padding:24px;text-align:center">
        <div style="display:inline-block;background:#3ecfb2;color:#0f1f3d;font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;padding:4px 12px;border-radius:20px;margin-bottom:10px">BuildDay Vancouver</div>
        <h1 style="color:white;font-size:22px;margin:0">You're in! 🙌</h1>
      </div>
      <div style="padding:28px 24px;background:white;margin:16px;border-radius:12px;border:1px solid #e2e8f0">
        <p style="font-size:16px;font-weight:600;color:#0f1f3d;margin-bottom:12px">Hey ${data.firstname}, thank you for applying to be a BuildDay mentor!</p>
        <p style="font-size:14px;color:#475569;line-height:1.7;margin-bottom:16px">We've received your application and we're excited to have someone with your background on board. The BuildDay team will be in touch with details and logistics closer to the event.</p>
        <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:20px">
          <div style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Your event</div>
          <div style="font-size:14px;color:#0f1f3d;font-weight:500">${data.event}</div>
        </div>
        <p style="font-size:13px;color:#94a3b8;line-height:1.6">Questions? Reply to this email or reach us at <a href="mailto:otavio@archipelagoaec.com" style="color:#3ecfb2">otavio@archipelagoaec.com</a></p>
      </div>
      <div style="text-align:center;padding:0 16px">
        <p style="font-size:11px;color:#cbd5e1">Archipelago AEC · Vancouver, BC</p>
      </div>
    </div>`;

  try {
    await Promise.all([
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'BuildDay <noreply@build.archipelagoaec.com>',
          to: [TO_EMAIL],
          subject: `New Mentor: ${data.firstname} ${data.lastname} — ${data.company}`,
          html: adminHtml
        })
      }),
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'BuildDay <noreply@build.archipelagoaec.com>',
          to: [data.email],
          subject: `Got it! Your BuildDay mentor application is confirmed`,
          html: confirmHtml
        })
      })
    ]);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
