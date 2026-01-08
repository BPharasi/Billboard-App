const nodemailer = require('nodemailer');

// Create transporter (check if credentials exist)
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  // Use SendGrid if no EMAIL_SERVICE specified and EMAIL_USER is 'apikey'
  if (process.env.EMAIL_USER === 'apikey') {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('📧 Email service configured (SendGrid)');
  } else {
    // Gmail or other service
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 10000, // 10 seconds timeout
      greetingTimeout: 10000
    });
    console.log('📧 Email service configured');
  }
} else {
  console.warn('⚠️  Email service not configured');
}

const sendContactEmail = async (name, email, subject, message) => {
  // Development mode: just log the email
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.log('\n📧 ===== EMAIL (DEV MODE - NOT SENT) =====');
    console.log('To:', process.env.CONTACT_EMAIL || 'info@hermpo.com');
    console.log('From:', name, '<' + email + '>');
    console.log('Subject:', subject);
    console.log('Message:', message);
    console.log('==========================================\n');
    return { success: true, messageId: 'dev-mode' };
  }

  if (!transporter) {
    console.log('\n📧 ===== EMAIL (NOT CONFIGURED) =====');
    console.log('To:', process.env.CONTACT_EMAIL || 'info@hermpo.com');
    console.log('From:', name, '<' + email + '>');
    console.log('Subject:', subject);
    console.log('Message:', message);
    console.log('==========================================\n');
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: process.env.SENDGRID_FROM || process.env.EMAIL_USER,
    to: process.env.CONTACT_EMAIL || 'info@hermpo.com',
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
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    throw error;
  }
};

module.exports = { sendContactEmail };
