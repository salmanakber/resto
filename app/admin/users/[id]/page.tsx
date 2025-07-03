import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { UserForm } from '../_components/UserForm'
import { notFound } from 'next/navigation'

interface EditUserPageProps {
  params: {
    id: string
  }
}

async function getRoles() {
  const roles = await prisma.role.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  return roles
}

async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      roleId: true,
    },
  })

  if (!user) {
    notFound()
  }

  return user
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'Admin') {
    redirect('/')
  }

  const [user, roles] = await Promise.all([
    getUser(params.id),
    getRoles(),
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Edit User</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <UserForm roles={roles} user={user} />
        </div>
      </div>
    </div>
  )
} 