"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { CategoryTable } from '@/components/category-table'
import { useMenuCategories } from "@/hooks/useMenuCategories"
import { useRouter } from "next/navigation"
import { MenuCategory } from "@/lib/services/menu-categories"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronRight, Edit, Plus, Trash, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ImageUpload } from "@/components/image-upload"

interface CategoryFormData {
  id?: string
  name: string
  description?: string | null
  isActive: boolean
  parentId?: string | null
  image?: string | null
  order?: number | null
}

const CollapsibleRow = ({ 
  category, 
  onEdit, 
  onDelete, 
  onAddSubCategory,
  subCategories = [],
  allCategories = []
}: { 
  category: MenuCategory; 
  onEdit: (category: MenuCategory) => void; 
  onDelete: (id: string) => void;
  onAddSubCategory: (parentId: string) => void;
  subCategories?: MenuCategory[];
  allCategories?: MenuCategory[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubCategories = subCategories.length > 0;
  const isChildCategory = category.parentId !== null;
  const paddingLeft = isChildCategory ? 'pl-12' : '';

  return (
    <>
      <TableRow>
        <TableCell className={paddingLeft}>
          {hasSubCategories && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mr-2"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          {category.name}
        </TableCell>
        <TableCell>{category.description}</TableCell>
        <TableCell>{category.order}</TableCell>
        <TableCell>
          <Switch checked={category.isActive} disabled />
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(category)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onAddSubCategory(category.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(category.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && subCategories.map((subCategory) => {
        const subSubCategories = allCategories.filter(cat => cat.parentId === subCategory.id);
        return (
          <CollapsibleRow
            key={subCategory.id}
            category={subCategory}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubCategory={onAddSubCategory}
            subCategories={subSubCategories}
            allCategories={allCategories}
          />
        );
      })}
    </>
  );
};

export default function CategoriesPage() {
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryFormData | null>(null)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { categories, loading, error, addCategory, editCategory, removeCategory } = useMenuCategories()
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedImage(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  })

  const handleAddCategory = (parentId?: string) => {
    setSelectedCategory({
      name: '',
      description: '',
      isActive: true,
      parentId: parentId || null
    })
    setOpenCategoryDialog(true)
  }

  const handleEditCategory = (category: CategoryFormData) => {
    setSelectedCategory(category)
    setOpenCategoryDialog(true)
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await removeCategory(id)
      } catch (error) {
        console.error('Failed to delete category:', error)
      }
    }
  }

  const handleSaveCategory = async (formData: FormData) => {
    try {
      setIsSaving(true);
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const parentId = formData.get('parentId') as string;
      const isActive = formData.get('isActive') === 'on';
      const order = parseInt(formData.get('order') as string) || 0;
      const image = selectedCategory?.image || null;

      const categoryData = {
        name,
        description,
        isActive,
        order,
        parentId: parentId || null,
        image
      };

      if (selectedCategory?.id) {
        await editCategory(selectedCategory.id, categoryData);
        toast.success('Category updated successfully');
      } else {
        await addCategory(categoryData);
        toast.success('Category created successfully');
      }

      setOpenCategoryDialog(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error('Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubCategory = (parentId: string) => {
    setSelectedCategory({
      name: '',
      description: '',
      isActive: true,
      parentId: parentId
    });
    setOpenCategoryDialog(true);
  };

  // Group categories by parent
  const parentCategories = categories.filter(cat => !cat.parentId);
  const subCategories = categories.filter(cat => cat.parentId);

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Menu Categories</h1>
        <Button onClick={() => handleAddCategory()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Manage your menu categories and subcategories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parentCategories.map((category) => (
                <CollapsibleRow
                  key={category.id}
                  category={category}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  onAddSubCategory={handleAddSubCategory}
                  subCategories={subCategories.filter(sub => sub.parentId === category.id)}
                  allCategories={categories}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openCategoryDialog} onOpenChange={setOpenCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory?.id ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {selectedCategory?.id ? 'Update the category details below.' : 'Add a new category to your menu.'}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleSaveCategory(formData)
            }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedCategory?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={selectedCategory?.description || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Category</Label>
                <select
                  id="parentId"
                  name="parentId"
                  className="w-full p-2 border rounded"
                  defaultValue={selectedCategory?.parentId || ''}
                >
                  <option value="">None</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Category Image</Label>
                <ImageUpload
                  value={selectedCategory?.image || ''}
                  onUploadSuccess={(url) => {
                    if (selectedCategory) {
                      setSelectedCategory({
                        ...selectedCategory,
                        image: url
                      });
                    }
                  }}
                  onUploadError={(error) => {
                    toast.error(error);
                  }}
                  maxSize={5 * 1024 * 1024} // 5MB
                  previewClassName="max-h-32 mx-auto"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  name="isActive"
                  defaultChecked={selectedCategory?.isActive ?? true}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenCategoryDialog(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {selectedCategory?.id ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  selectedCategory?.id ? 'Update Category' : 'Create Category'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 