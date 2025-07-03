'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Location } from './columns'

export default function LocationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<'active' | 'inactive'>('active')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/admin/locations')
      if (!response.ok) {
        throw new Error('Failed to fetch locations')
      }
      const data = await response.json()
      setLocations(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch locations',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRowSelectionChange = (selected: string[]) => {
    setSelectedRows(selected)
  }

  const handleBulkDelete = async () => {
    console.log(selectedRows)
    if (selectedRows.length === 0) return

    try {
      const response = await fetch('/api/admin/locations/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedRows }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete locations')
      }

      toast({
        title: 'Success',
        description: 'Selected locations have been deleted',
      })

      fetchLocations()
      // Refresh the page to show updated data
      router.refresh()
      setSelectedRows([])
      setShowDeleteDialog(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete locations',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Locations</h1>
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Selected
              </Button>
            </>
          )}
          <Button onClick={() => router.push('/admin/locations/new')} className='bg-red-500 hover:bg-red-600'>
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={locations}
        searchKey="name"
        onRowSelectionChange={handleRowSelectionChange}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected locations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 