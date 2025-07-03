const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addOtpSettings() {
  try {
    

    // Define the settings to add
    const settings = [
      { key: 'otp_expiry_minutes', value: '10', category: 'otp', description: 'OTP expiry time in minutes' },
      { key: 'otp_length', value: '6', category: 'otp', description: 'Length of OTP code' },
      { key: 'otp_email_enabled', value: 'true', category: 'otp', description: 'Whether email OTP is enabled' },
      { key: 'otp_phone_enabled', value: 'false', category: 'otp', description: 'Whether SMS OTP is enabled' },
    ];

    // Add or update each setting
    for (const setting of settings) {
      const existingSetting = await prisma.setting.findUnique({
        where: { key: setting.key },
      });

      if (existingSetting) {
        
        await prisma.setting.update({
          where: { key: setting.key },
          data: {
            value: setting.value,
            category: setting.category,
            description: setting.description,
          },
        });
      } else {
        
        await prisma.setting.create({
          data: setting,
        });
      }
    }

    
  } catch (error) {
    console.error('Error adding OTP settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addOtpSettings(); 