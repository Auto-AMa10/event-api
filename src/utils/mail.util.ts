import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendOTP = async (to: string, otp: string) => {
  const mailOptions = {
    from: `"LoketDigital Security" <${process.env.MAIL_USER}>`,
    to,
    subject: "Kode Verifikasi 2 Langkah Anda",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6C5CE7; text-align: center;">LoketDigital</h2>
        <p>Halo,</p>
        <p>Anda menerima email ini karena Anda (atau seseorang) mencoba mengakses/mengubah pengaturan keamanan akun Anda.</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #777;">Kode ini akan kadaluarsa dalam 10 menit. Jangan bagikan kode ini kepada siapa pun.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
