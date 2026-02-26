import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = async ({
  email,
  subject,
  html,
  text = "Please view in HTML-supported email client",
}) => {
  const mailOption = {
    from: `"Haldia Guest House" <${process.env.EMAIL_ID}>`,
    to: email,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOption);
    return true;
  } catch (error) {
    console.error("[MAIL ERROR]", error);
    return false;
  }
};

export default sendMail;
