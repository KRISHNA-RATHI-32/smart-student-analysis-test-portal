import nodemailer from "nodemailer";


export const sendOtpEmail = async (email, otp) => {
  // Always log to console (for development / if email not configured)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });
  console.log(`\n📧 OTP for ${email}: ${otp}\n`);

  // If SMTP credentials are not set, skip sending email
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.log("⚠️  SMTP not configured — OTP logged to console only");
    return;
  }
  console.log("ENV CHECK:", process.env.SMTP_EMAIL, process.env.SMTP_PASSWORD);

  try {
    await transporter.sendMail({
      from: `"ExamIQ" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "ExamIQ - Your OTP Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #2563eb;">ExamIQ Verification</h2>
          <p>Your OTP code is:</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code expires in 5 minutes. Do not share it with anyone.</p>
        </div>
      `
    });
    console.log(`✅ OTP email sent to ${email}`);
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error.message);
    // Don't throw — OTP is still logged to console
  }
};
