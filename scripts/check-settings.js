const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  
  
  const settings = await prisma.setting.findMany({
    where: {
      OR: [
        { key: { startsWith: 'OTP_' } },
        { key: { startsWith: 'email_' } },
        { key: { startsWith: 'phone_' } }
      ]
    }
  });
  
  
  settings.forEach(setting => {
    
  });
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 