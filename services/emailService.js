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

const sendRentalReminder = async (rental, reminderType) => {
  // Development mode: just log the email
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.log('\n📧 ===== RENTAL REMINDER (DEV MODE - NOT SENT) =====');
    console.log('To:', process.env.CONTACT_EMAIL || 'info@hermpo.com');
    console.log('Client:', rental.clientName, '<' + rental.clientEmail + '>');
    console.log('Billboard:', rental.billboard?.name || 'N/A');
    console.log('Reminder Type:', reminderType);
    console.log('Days Left:', rental.daysRemaining);
    console.log('====================================================\n');
    return { success: true, messageId: 'dev-mode' };
  }

  if (!transporter) {
    console.log('\n📧 ===== RENTAL REMINDER (NOT CONFIGURED) =====');
    console.log('To:', process.env.CONTACT_EMAIL || 'info@hermpo.com');
    console.log('Client:', rental.clientName);
    console.log('Reminder Type:', reminderType);
    console.log('===============================================\n');
    throw new Error('Email service not configured');
  }

  // Format reminder type for display
  const reminderDisplay = reminderType
    .replace('_', ' ')
    .replace('months', 'months left')
    .replace('month', 'month left')
    .replace('week', 'week left');

  const mailOptions = {
    from: process.env.SENDGRID_FROM || process.env.EMAIL_USER,
    to: process.env.CONTACT_EMAIL || 'info@hermpo.com',
    subject: `🔔 Rental Expiring: ${rental.billboard?.name || 'Billboard'} - ${reminderDisplay}`,
    html: `
      <h2>🔔 Rental Contract Expiration Reminder</h2>
      <p><strong>Alert:</strong> ${reminderDisplay.toUpperCase()}</p>
      <hr>
      <h3>Billboard Details:</h3>
      <p><strong>Name:</strong> ${rental.billboard?.name || 'N/A'}</p>
      <p><strong>Location:</strong> ${rental.billboard?.location?.address || 'N/A'}</p>
      <p><strong>Size:</strong> ${rental.billboard?.size || 'N/A'}</p>
      <p><strong>Type:</strong> ${rental.billboard?.type || 'N/A'}</p>
      
      <h3>Client Information:</h3>
      <p><strong>Name:</strong> ${rental.clientName}</p>
      <p><strong>Email:</strong> ${rental.clientEmail}</p>
      ${rental.clientPhone ? `<p><strong>Phone:</strong> ${rental.clientPhone}</p>` : ''}
      ${rental.clientCompany ? `<p><strong>Company:</strong> ${rental.clientCompany}</p>` : ''}
      
      <h3>Contract Details:</h3>
      <p><strong>Start Date:</strong> ${new Date(rental.startDate).toLocaleDateString()}</p>
      <p><strong>End Date:</strong> ${new Date(rental.endDate).toLocaleDateString()}</p>
      <p><strong>Duration:</strong> ${rental.contractDuration} months</p>
      <p><strong>Days Remaining:</strong> <span style="color: ${rental.daysRemaining <= 7 ? 'red' : 'orange'}; font-weight: bold;">${rental.daysRemaining} days</span></p>
      <p><strong>Monthly Rate:</strong> R${rental.monthlyRate.toLocaleString()}</p>
      <p><strong>Total Amount:</strong> R${rental.totalAmount.toLocaleString()}</p>
      
      ${rental.notes ? `
      <h3>Notes:</h3>
      <p>${rental.notes.replace(/\n/g, '<br>')}</p>
      ` : ''}
      
      <hr>
      <p style="color: #666; font-size: 12px;">
        This is an automated reminder. Please contact the client to discuss contract renewal.
      </p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Rental reminder sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send rental reminder:', error.message);
    throw error;
  }
};

module.exports = { sendContactEmail, sendRentalReminder };
