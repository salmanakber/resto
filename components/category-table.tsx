import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Folder, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
  isActive: boolean
  order: number | null
  parentId: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
  children?: Category[]
}

interface CategoryTableProps {
  categories: Category[]
  onAdd: (parentId?: string) => void
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
}

export function CategoryTable({ categories, onAdd, onEdit, onDelete }: CategoryTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCategories(newExpanded)
  }

  const renderCategoryRow = (category: Category, level: number = 0): JSX.Element => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)

    return (
      <>
        <TableRow key={category.id} className={cn(
          "hover:bg-gray-50 dark:hover:bg-gray-800",
          level > 0 && "bg-gray-50/50 dark:bg-gray-800/50"
        )}>
          <TableCell className="font-medium">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleCategory(category.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-amber-500" />
                ) : (
                  <Folder className="h-4 w-4 text-amber-500" />
                )
              ) : (
                <div className="h-4 w-4" />
              )}
              <span>{category.name}</span>
            </div>
          </TableCell>
          <TableCell>{category.description || '-'}</TableCell>
          <TableCell>
            <span className={cn(
              "px-2 py-1 rounded-full text-xs",
              category.isActive
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            )}>
              {category.isActive ? 'Active' : 'Inactive'}
            </span>
          </TableCell>
          <TableCell>{category.order || '-'}</TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAdd(category.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subcategory
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDelete(category.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        {isExpanded && hasChildren && (
          category.children?.map((child) => renderCategoryRow(child, level + 1))
        )}
      </>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Order</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No categories found.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => renderCategoryRow(category))
          )}
        </TableBody>
      </Table>
    </div>
  ) as JSX.Element
} 