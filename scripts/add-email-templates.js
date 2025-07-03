const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addEmailTemplates() {
  try {
    
    
    // Add OTP verification template
    const otpTemplate = await prisma.emailTemplate.upsert({
      where: { name: 'otp_verification' },
      update: {
        subject: 'Your OTP Code for Restaurant Ordering',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Your OTP Code</h1>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="font-size: 16px; margin-bottom: 10px;">Your OTP code is:</p>
              <div style="background-color: #fff; padding: 15px; border-radius: 5px; text-align: center; margin: 10px 0;">
                <span style="font-size: 24px; font-weight: bold; color: #007bff;">{{otp}}</span>
              </div>
              <p style="font-size: 14px; color: #666;">This code will expire in 5 minutes.</p>
            </div>
            <p style="font-size: 14px; color: #666; text-align: center;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
        variables: JSON.stringify(['otp']),
        isActive: true
      },
      create: {
        name: 'otp_verification',
        subject: 'Your OTP Code for Restaurant Ordering',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Your OTP Code</h1>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="font-size: 16px; margin-bottom: 10px;">Your OTP code is:</p>
              <div style="background-color: #fff; padding: 15px; border-radius: 5px; text-align: center; margin: 10px 0;">
                <span style="font-size: 24px; font-weight: bold; color: #007bff;">{{otp}}</span>
              </div>
              <p style="font-size: 14px; color: #666;">This code will expire in 5 minutes.</p>
            </div>
            <p style="font-size: 14px; color: #666; text-align: center;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
        variables: JSON.stringify(['otp']),
        isActive: true
      }
    });
    
    
  } catch (error) {
    console.error('Error adding email templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addEmailTemplates(); 