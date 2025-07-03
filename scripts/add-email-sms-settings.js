const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const settings = [
  // Email settings
  {
    key: 'SMTP_HOST',
    value: process.env.SMTP_HOST || 'smtp.gmail.com',
    category: 'email',
    description: 'SMTP server host'
  },
  {
    key: 'SMTP_PORT',
    value: process.env.SMTP_PORT || '587',
    category: 'email',
    description: 'SMTP server port'
  },
  {
    key: 'SMTP_USER',
    value: process.env.SMTP_USER || 'test@gmail.com',
    category: 'email',
    description: 'SMTP username'
  },
  {
    key: 'SMTP_PASSWORD',
    value: process.env.SMTP_PASSWORD || 'your_app_specific_password',
    category: 'email',
    description: 'SMTP password'
  },
  {
    key: 'SMTP_FROM',
    value: process.env.SMTP_FROM || 'test@gmail.com',
    category: 'email',
    description: 'Default sender email'
  },
  // SMS settings
  {
    key: 'TWILIO_ACCOUNT_SID',
    value: process.env.TWILIO_ACCOUNT_SID || '',
    category: 'sms',
    description: 'Twilio Account SID'
  },
  {
    key: 'TWILIO_AUTH_TOKEN',
    value: process.env.TWILIO_AUTH_TOKEN || '',
    category: 'sms',
    description: 'Twilio Auth Token'
  },
  {
    key: 'TWILIO_PHONE_NUMBER',
    value: process.env.TWILIO_PHONE_NUMBER || '',
    category: 'sms',
    description: 'Twilio Phone Number'
  }
];

async function main() {
  
  
  for (const setting of settings) {
    const existingSetting = await prisma.setting.findUnique({
      where: { key: setting.key }
    });
    
    if (!existingSetting) {
      await prisma.setting.create({
        data: setting
      });
      
    } else {
      await prisma.setting.update({
        where: { key: setting.key },
        data: setting
      });
      
    }
  }
  

  await prisma.$disconnect();
}

main().catch(console.error); 