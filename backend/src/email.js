require('dotenv').config();
const nodemailer = require('nodemailer');

let transporter;

if (process.env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
} else {
  throw new Error('Nincs GMAIL_APP_PASSWORD megadva. Állíts be App Password-öt a .env-ben.');
}

async function sendEmail(to, subject, html) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  });
}

async function sendVerificationEmail(to, token) {
  const verifyUrl = `${process.env.CLIENT_URL}/verify?token=${encodeURIComponent(token)}`;
  const html = `
    <div style="font-family:Arial,sans-serif">
      <h2>PetFinder – Email megerősítés</h2>
      <p>Kattints az alábbi gombra az email címed megerősítéséhez:</p>
      <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">Email megerősítése</a></p>
      <p>Vagy másold be ezt a linket a böngésződbe:<br />${verifyUrl}</p>
      <p>Ha nem te regisztráltál, hagyd figyelmen kívül ezt az üzenetet.</p>
    </div>
  `;
  await sendEmail(to, 'PetFinder – Erősítsd meg az email címed!', html);
}

module.exports = { sendEmail, sendVerificationEmail };
