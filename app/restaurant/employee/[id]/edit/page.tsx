"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loading } from "@/components/ui/loading";
import { useLoading } from "@/hooks/use-loading";
import * as React from "react";

interface Role {
  id: string;
  name: string;
  displayName: string;
  access_area: string;
}

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: 'First name must be at least 2 characters.',
  }),
  lastName: z.string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().min(10, {
    message: 'Please enter a valid phone number.',
  }),
  roleId: z.string({
    required_error: 'Please select a role.',
  }),
  department: z.string({
    required_error: 'Please select a department.',
  }),
  joiningDate: z.string({
    required_error: 'Please select a joining date.',
  }),
  salary: z.string({
    required_error: 'Please enter a salary.',
  }),
  status: z.string({
    required_error: 'Please select a status.',
  }),
  permissions: z.object({
    managePOS: z.boolean().default(false),
    modifyOrder: z.boolean().default(false),
    kitchenDisplayScreen: z.boolean().default(false),
    kitchenDashboard: z.boolean().default(false),
    employeeModuleAccess: z.boolean().default(false),
    deleteOrder: z.boolean().default(false),
    restaurantDashboard: z.boolean().default(false),
    setupITAccess: z.boolean().default(false),
  }),
});

const DEPARTMENTS = [
  { value: "kitchen", label: "Kitchen" },
  { value: "service", label: "Service" },
  { value: "management", label: "Management" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "Human Resources" }
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" }
];

interface PageParams {
  id: string;
}

export default function EditEmployee({ params }: { params: PageParams }) {
  const router = useRouter();
  const { isLoading, withLoading } = useLoading();
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<any>(null);
  const { id } = useParams()
  const [isLoadingpage, setIsLoadingpage] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setIsLoadingpage(true);
          // Fetch employee data
          const employeeResponse = await fetch(`/api/restaurants/employee/${id}`);
          if (!employeeResponse.ok) {
            throw new Error('Failed to fetch employee data');
          }
          const employeeData = await employeeResponse.json();
          setEmployee(employeeData);
       
      
          // Fetch roles
          const rolesResponse = await fetch('/api/roles');
          if (!rolesResponse.ok) {
            throw new Error('Failed to fetch roles');
          }
          const rolesData = await rolesResponse.json();
          setRoles(rolesData);
          
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
        toast.error('Failed to load data');
      } finally {
        setIsLoadingpage(false);
        }
    };

    fetchData();
  }, [id]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      roleId: '',
      department: '',
      joiningDate: '',
      salary: '',
      status: 'active',
      permissions: {
        managePOS: false,
        modifyOrder: false,
        kitchenDisplayScreen: false,
        kitchenDashboard: false,
        employeeModuleAccess: false,
        deleteOrder: false,
        restaurantDashboard: false,
        setupITAccess: false,
      },
    },
  });

  // Update form values when employee data is loaded
  useEffect(() => {
    if (employee) {
      form.reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        roleId: employee.role,
        department: employee.department,
        joiningDate: new Date(employee.joiningDate).toISOString().split('T')[0],
        salary: employee.salary.toString(),
        status: employee.status,
      });
    }
  }, [employee, form]);

  const selectedRoleId = form.watch('roleId');

  useEffect(() => {
    if (selectedRoleId) {
      const selectedRole = roles.find(role => role.id === selectedRoleId);
      if (selectedRole && selectedRole.access_area) {
        try {
          const permissions = JSON.parse(selectedRole.access_area);
          form.setValue('permissions', {
            managePOS: permissions.includes('MANAGE_POS'),
            modifyOrder: permissions.includes('MODIFY_ORDER'),
            kitchenDisplayScreen: permissions.includes('KITCHEN_DISPLAY_SCREEN'),
            kitchenDashboard: permissions.includes('KITCHEN_DASHBOARD'),
            employeeModuleAccess: permissions.includes('EMPLOYEE_MODULE_ACCESS'),
            deleteOrder: permissions.includes('DELETE_ORDER'),
            restaurantDashboard: permissions.includes('RESTAURANT_DASHBOARD'),
            setupITAccess: permissions.includes('SETUP_IT_DEPARTMENT'),
          });
        } catch (error) {
          console.error('Error parsing permissions:', error);
        }
      }
    }
  }, [selectedRoleId, roles, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoadingpage(true);
        const response = await fetch(`/api/restaurants/employee/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error);
        }

        toast.success('Employee updated successfully');
        router.push(`/restaurant/employee/${id}`);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update employee');
    } finally {
      setIsLoadingpage(false);
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (isLoadingpage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isLoading && <Loading />}
      <div>
        <h1 className="text-3xl font-bold">Edit Employee</h1>
        <p className="text-muted-foreground">
          Update employee information and permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
          <CardDescription>
            Update the employee's personal and professional details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value}>
                              {dept.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="joiningDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Joining Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter salary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Permissions</h3>
                <p className="text-sm text-muted-foreground">
                  Permissions are automatically set based on the selected role. You cannot modify them directly.
                </p>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="permissions.managePOS"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={true}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Manage POS</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="permissions.modifyOrder"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={true}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Modify Orders</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="permissions.kitchenDisplayScreen"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={true}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Kitchen Display Screen</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="permissions.kitchenDashboard"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={true}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Kitchen Dashboard</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="permissions.employeeModuleAccess"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={true}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Employee Module Access</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="permissions.deleteOrder"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={true}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Delete Orders</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="permissions.restaurantDashboard"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={true}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Restaurant Dashboard</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="permissions.setupITAccess"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={true}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Setup IT Department Access</FormLabel>
                          <FormDescription>
                            This permission allows access to manage IT Department access through the separate IT Access menu
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit">Update Employee</Button>
                <Button
                  type="button"
                  variant="outline"
                    onClick={() => router.push(`/restaurant/employee/${id}`)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 