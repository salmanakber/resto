import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import UserForm from '../_components/UserForm'

interface EditUserPageProps {
  params: {
    id: string
  }
}

async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
    },
  })

  if (!user) {
    notFound()
  }

  return user
}

async function getRoles() {
  return prisma.role.findMany()
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const [user, roles] = await Promise.all([
    getUser(params.id),
    getRoles(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
        <p className="text-muted-foreground">
          Update user information and role
        </p>
      </div>

      <UserForm user={user} roles={roles} />
    </div>
  )
} 