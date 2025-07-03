const nodemailer = require('nodemailer');

async function testEmail() {
  try {
    // Create transporter with direct settings
    const transporter = nodemailer.createTransport({
      host: 'mail.sixerweb.com',
      port: 465,
      secure: true,
      auth: {
        user: 'smtp@sixerweb.com',
        pass: 'Admin1234!@#$'
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });

    // Send test email
    const info = await transporter.sendMail({
      from: 'smtp@sixerweb.com',
      to: 'all2client@gmail.com',
      subject: 'Test Email from Restaurant Ordering System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Test Email</h1>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 16px;">This is a test email from the Restaurant Ordering System.</p>
            <p style="font-size: 14px; color: #666;">Time sent: ${new Date().toLocaleString()}</p>
          </div>
          <p style="font-size: 14px; color: #666; text-align: center;">If you receive this email, it means the SMTP configuration is working correctly.</p>
        </div>
      `
    });

 

  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

testEmail(); 