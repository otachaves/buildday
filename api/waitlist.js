export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { first, last, email, role, type } = req.body;

  if (!first || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
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

    if (!response.ok) {
      const err = await response.json();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
