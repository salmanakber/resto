import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MenuForm } from '../_components/MenuForm'
import { notFound } from 'next/navigation'

interface EditMenuItemPageProps {
  params: {
    id: string
  }
}

export default async function EditMenuItemPage({ params }: EditMenuItemPageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'Admin') {
    redirect('/')
  }

  const [menuItem, categories] = await Promise.all([
    prisma.menuItem.findUnique({
      where: {
        id: params.id,
      },
    }),
    prisma.menuCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    }),
  ])

  if (!menuItem) {
    notFound()
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Edit Menu Item</h2>
      </div>
      <div className="grid gap-4">
        <MenuForm menu={menuItem} categories={categories} userId={session.user.id} />
      </div>
    </div>
  )
} 