import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n=== Roles ===')
  const roles = await prisma.role.findMany()
  

  console.log('\n=== Users ===')
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      emailVerified: true,
      isActive: true,
    }
  })
  

  console.log('\n=== Settings ===')
  const settings = await prisma.setting.findMany()
  

  console.log('\n=== Login Logs ===')
  const loginLogs = await prisma.loginLog.findMany()
  
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 