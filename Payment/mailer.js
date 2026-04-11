const nodeMailer = require('nodemailer');

const mailHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const mailPort = Number(process.env.SMTP_PORT || 587);
const adminEmail = process.env.SMTP_USER || '';
const adminPassword = process.env.SMTP_PASS || '';

const sendMail = (to, subject, htmlContent) => {
  if (!adminEmail || !adminPassword) {
    return Promise.reject(new Error('Missing SMTP_USER or SMTP_PASS in env'));
  }

  const transporter = nodeMailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: mailPort === 465,
    auth: {
      user: adminEmail,
      pass: adminPassword,
    },
  });

  const options = {
    from: adminEmail,
    to,
    subject,
    html: htmlContent,
  };

  return transporter.sendMail(options);
};

module.exports = {
  sendMail,
};
