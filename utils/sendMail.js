const nodemailer = require("nodemailer");

async function sendMail(data) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      port: process.env.PORTMAIL,
      secure: false,
      tls: { rejectUnauthorized: false },
      auth: {
        user: process.env.USER,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: "admin@chaloghoomne.com",
      to: data.email,
      subject: data.subject,
      text: data.text,
    };
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error;
  }
}

module.exports = sendMail;
