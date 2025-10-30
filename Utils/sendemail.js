import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text, html = null) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465, // true for SSL, false for TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
       tls: { rejectUnauthorized: false }, // Important for Render
        connectionTimeout: 10000, // 10 seconds timeout

    });

    // Verify connection (optional for debugging)
    // await transporter.verify();
    await transporter.verify();
        console.log("✅ SMTP connection verified");

    await transporter.sendMail({
      from: `"Boutique App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || undefined, // if html is provided, it will be used
    });
    console.log("Email sent successfully to", to);
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Email could not be sent");
  }
};
