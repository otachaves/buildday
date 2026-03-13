export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { first, last, email, role, type } = req.body;

  if (!first || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    // 1. Notify Otavio
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@build.archipelagoaec.com',
        to: 'otavio@archipelagoaec.com',
        subject: `New BuildDay Waitlist — ${first} ${last}`,
        html: `
          <h2>New waitlist registration 🎉</h2>
          <table style="font-family:sans-serif;font-size:15px;line-height:1.6;">
            <tr><td><strong>Name</strong></td><td>${first} ${last}</td></tr>
            <tr><td><strong>Email</strong></td><td>${email}</td></tr>
            <tr><td><strong>Role</strong></td><td>${role || '—'}</td></tr>
            <tr><td><strong>Joining as</strong></td><td>${type || '—'}</td></tr>
          </table>
          <p style="margin-top:24px;color:#888;font-size:13px;">BuildDay · June 6, 2026 · SFU Vancouver</p>
        `,
      }),
    });

    // 2. Confirm to the registrant
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BuildDay <noreply@build.archipelagoaec.com>',
        to: email,
        subject: `You're on the list — BuildDay, June 6 · Vancouver`,
        html: `
          <div style="font-family:'Segoe UI',system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0A0E1A;">
            <div style="background:#0066FF;padding:2rem;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:#fff;font-size:1.6rem;font-weight:900;margin:0;letter-spacing:-0.5px;">BuildDay</h1>
              <p style="color:rgba(255,255,255,.75);font-size:.9rem;margin:.4rem 0 0;">June 6, 2026 · SFU Vancouver</p>
            </div>
            <div style="background:#f7f8fc;padding:2rem;border-radius:0 0 12px 12px;border:1px solid #DDE2F0;border-top:none;">
              <h2 style="font-size:1.2rem;font-weight:800;margin:0 0 1rem;">Hey ${first}, you're on the list! 🎉</h2>
              <p style="color:#5A6180;line-height:1.6;margin:0 0 1rem;">
                Thanks for your interest in BuildDay — a full day AEC innovation sprint where real challenges become real apps.
              </p>
              <p style="color:#5A6180;line-height:1.6;margin:0 0 1.5rem;">
                We're opening registration soon. You'll be the <strong style="color:#0A0E1A;">first to know</strong> when tickets go live — and you'll have priority access to early bird pricing.
              </p>
              <div style="background:#fff;border:1px solid #DDE2F0;border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
                <div style="font-size:.8rem;text-transform:uppercase;letter-spacing:1px;color:#0066FF;font-weight:700;margin-bottom:.75rem;">Event Details</div>
                <div style="font-size:.9rem;color:#0A0E1A;line-height:1.8;">
                  📅 <strong>June 6, 2026</strong><br/>
                  📍 <strong>Morris J. Wosk Centre for Dialogue</strong><br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Simon Fraser University, Vancouver BC<br/>
                  🎟️ <strong>Early bird from $49</strong>
                </div>
              </div>
              <p style="color:#5A6180;font-size:.85rem;line-height:1.6;margin:0;">
                Questions? Reply to this email or reach us at 
                <a href="mailto:otavio@archipelagoaec.com" style="color:#0066FF;">otavio@archipelagoaec.com</a>
              </p>
              <hr style="border:none;border-top:1px solid #DDE2F0;margin:1.5rem 0;"/>
              <p style="color:#aaa;font-size:.75rem;margin:0;text-align:center;">
                A collaboration between <strong style="color:#0A0E1A;">Archipelago</strong> × <strong style="color:#0A0E1A;">Simon Fraser University</strong>
              </p>
            </div>
          </div>
        `,
      }),
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
