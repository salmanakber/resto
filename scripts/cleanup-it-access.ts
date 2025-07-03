import { prisma } from '../lib/prisma';

async function cleanupExpiredITAccess() {
  try {
    const expiredAccess = await prisma.itAccess.findMany({
      where: {
        expiryDate: {
          lte: new Date()
        },
        isActive: true
      },
      include: {
        user: true
      }
    });

    for (const access of expiredAccess) {
      // Deactivate the IT access
      await prisma.itAccess.update({
        where: { id: access.id },
        data: { isActive: false }
      });

      // Remove IT department permissions from the user's role
      const user = await prisma.user.findUnique({
        where: { id: access.userId },
        include: { role: true }
      });

      if (user && user.role) {
        const permissions = JSON.parse(user.role.access_area || '[]');
        const updatedPermissions = permissions.filter((p: string) => p !== 'SETUP_IT_DEPARTMENT');
        
        await prisma.role.update({
          where: { id: user.role.id },
          data: { access_area: JSON.stringify(updatedPermissions) }
        });
      }
    }

    
  } catch (error) {
    console.error('Error cleaning up expired IT access:', error);
  }
}

// Run the cleanup
cleanupExpiredITAccess()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 