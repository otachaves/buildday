const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  general_early:    'price_1TJbuuIVE3YXiSehEGl5xQCd',
  student_early:    'price_1TJc1iIVE3YXiSeh1j7kTnq0',
  general_standard: 'price_1TJd8SIVE3YXiSehy0XXs5vy',
  student_standard: 'price_1TJd9ZIVE3YXiSehjDlE6kwq',
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { ticket, first, last, email, company, role, diet, phone } = req.body;

  const priceId = PRICE_IDS[ticket];
  if (!priceId) return res.status(400).json({ error: 'Invalid ticket type' });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    metadata: { ticket, first, last, email, company: company||'', role: role||'', diet: diet||'', phone: phone||'' },
    success_url: `${process.env.SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.SITE_URL}/#register`,
  });

  return res.status(200).json({ url: session.url });
};
