import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MenuForm } from '../_components/MenuForm'

export default async function NewMenuItemPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'Admin') {
    redirect('/')
  }

  const categories = await prisma.menuCategory.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">New Menu Item</h2>
      </div>
      <div className="grid gap-4">
        <MenuForm categories={categories} userId={session.user.id} />
      </div>
    </div>
  )
} 