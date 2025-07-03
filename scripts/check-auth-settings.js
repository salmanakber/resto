const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for Google and Facebook settings...');
  
  const settings = await prisma.setting.findMany({
    where: {
      OR: [
        { key: { contains: 'GOOGLE' } },
        { key: { contains: 'FACEBOOK' } }
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