import { Role } from '@prisma/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const roleFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  description: z.string().optional(),
  access_area: z.string().optional(),
})

type RoleFormValues = z.infer<typeof roleFormSchema>

interface RoleFormProps {
  role?: Role
}

export default function RoleForm({ role }: RoleFormProps) {
  const router = useRouter()
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name || '',
      displayName: role?.displayName || '',
      description: role?.description || '',
      access_area: role?.access_area || '',
    },
  })

  async function onSubmit(data: RoleFormValues) {
    try {
      const response = await fetch(
        role ? `/api/admin/roles/${role.id}` : '/api/admin/roles',
        {
          method: role ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to save role')
      }

      toast.success(role ? 'Role updated' : 'Role created')
      router.push('/admin/roles')
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="access_area"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Access Area</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter JSON configuration for access areas"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit">
            {role ? 'Update Role' : 'Create Role'}
          </Button>
        </div>
      </form>
    </Form>
  )
} 