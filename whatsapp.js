// whatsapp.js
const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromWa     = process.env.TWILIO_WHATSAPP_FROM; // e.g. 'whatsapp:+1415xxxxxxx'
const client     = twilio(accountSid, authToken);

async function sendWhatsApp(toPhone, message) {
  if (!accountSid || !authToken || !fromWa) {
    console.warn('Twilio not configured. Message not sent:', message);
    return;
  }
  const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  return client.messages.create({
    from: fromWa,
    to,
    body: message
  });
}

module.exports = { sendWhatsApp };
