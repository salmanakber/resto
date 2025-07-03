"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loading } from "@/components/ui/loading";
import { useLoading } from "@/hooks/use-loading";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  joiningDate: string;
  salary: number;
  status: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  access_area: string;
}

const ROLES = [
  { value: "restaurant", label: "Head/Owner" },
  { value: "restaurant_manager", label: "Manager/Senior" },
  { value: "restaurant_supervisor", label: "Assist/Supervisor" },
  { value: "kitchen_boy", label: "Clerk/Waiter" }
];

const DEPARTMENTS = [
  { value: "all", label: "All Departments" },
  { value: "kitchen", label: "Kitchen" },
  { value: "service", label: "Service" },
  { value: "management", label: "Management" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "Human Resources" }
];

export default function EmployeeDirectory() {
  const router = useRouter();
  const { isLoading, withLoading } = useLoading();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rolesMap, setRolesMap] = useState<Map<string, Role>>(new Map());
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchEmployees();
  }, []);

  const fetchRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/roles/${roleId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch role');
      }
      const role = await response.json();
      setRolesMap(prev => new Map(prev).set(roleId, role));
    } catch (error) {
      console.error('Error fetching role:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`/api/restaurants/employee?role=${selectedRole}&department=${selectedDepartment}`);
      if (!response.ok) {
        if(response.status === 401 || response.status === 404) {
          toast.error('Unauthorized or User not found');
          // router.push('/login?callbackUrl=/restaurant/employee/directory');
    
        }
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      
      setEmployees(data);
      
      // Fetch roles for all employees
      const uniqueRoleIds = [...new Set(data.map((emp: Employee) => emp.role))];
      for (const roleId of uniqueRoleIds) {
        if (roleId && !rolesMap.has(roleId)) {
          await fetchRole(roleId);
        }
      }
    } catch (error) {
      toast.error('Failed to load employees');
    }
  };

  const handleDelete = async (id: string) => {
    setEmployeeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    try {
      const response = await fetch(`/api/restaurants/employee?id=${employeeToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete employee');
      toast.success('Employee deleted successfully');
      await fetchEmployees();
    } catch (error) {
      toast.error('Failed to delete employee');
    } finally {
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      {isLoading && <Loading />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Directory</h1>
          <p className="text-muted-foreground">
            Manage and view all employee information
          </p>
        </div>
        <Button onClick={() => router.push('/restaurant/employee/add')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <Select
          value={selectedRole}
          onValueChange={setSelectedRole}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedDepartment}
          onValueChange={setSelectedDepartment}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept.value} value={dept.value}>
                {dept.value === "all" ? "All Departments" : dept.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees
                .filter(employee => 
                  (selectedRole === "all" || employee.role === selectedRole) &&
                  (selectedDepartment === "all" || employee.department === selectedDepartment)
                )
                .map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{`${employee.firstName} ${employee.lastName}`}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{rolesMap.get(employee.role)?.displayName || employee.role}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        employee.status === 'active' ? 'bg-green-100 text-green-800' :
                        employee.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {employee.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/restaurant/employee/${employee.id}`)}>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/restaurant/employee/${employee.id}/edit`)}>
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(employee.id)}
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee and their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 