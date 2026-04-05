import nodemailer from "nodemailer";

/**
 * Hàm gửi email sử dụng nodemailer.
 * @author QuangHaDev - 05.04.2026
 * @param email Địa chỉ email người nhận.
 * @param title Tiêu đề email.
 * @param content Nội dung email (hỗ trợ HTML).
 */
export const sendMail = (email: string, title: string, content: string) => {
  // Create a transporter object
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // use false for STARTTLS; true for SSL on port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Configure the mailoptions object
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: title,
    html: content,
  };

  // Send the email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Error:", error);
    } else {
      console.log("Email sent: ", info.response);
    }
  });
};
