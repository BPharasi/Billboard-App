const nodemailer = require('nodemailer');

// Create transporter (check if credentials exist)
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email service error:', error);
    } else {
      console.log('✓ Email service ready');
    }
  });
} else {
  console.warn('⚠️  Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env file.');
}

const sendContactEmail = async (name, email, subject, message) => {
  // Development mode: just log the email instead of sending
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.log('\n📧 ===== EMAIL (DEV MODE - NOT SENT) =====');
    console.log('To:', process.env.CONTACT_EMAIL || 'hermpo12@gmail.com');
    console.log('From:', name, '<' + email + '>');
    console.log('Subject:', subject);
    console.log('Message:', message);
    console.log('==========================================\n');
    return { success: true, messageId: 'dev-mode' };
  }

  if (!transporter) {
    throw new Error('Email service not configured. Please contact administrator.');
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.CONTACT_EMAIL || 'hermpo12@gmail.com',
    replyTo: email,
    subject: `Contact Form: ${subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
};

module.exports = { sendContactEmail };
