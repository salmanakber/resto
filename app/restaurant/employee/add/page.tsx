"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  description: string;
  access_area: string;
  displayName: string;
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
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
  confirmPassword: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
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
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AddEmployee() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        
        const response = await fetch('/api/roles');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch roles: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Roles Data< ', data)
        
        setRoles(data);
      } catch (error) {
        console.error("Error fetching roles:", error);
        setError(error instanceof Error ? error.message : 'Failed to load roles');
        toast.error('Failed to load roles');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      roleId: undefined,
      department: undefined,
      joiningDate: '',
      salary: '',
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
      const response = await fetch('/api/restaurants/employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      toast.success('Employee added successfully');
      router.push('/restaurant/employee/directory');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add employee');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Employee</h1>
        <p className="text-muted-foreground">
          Fill in the details to add a new employee to the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
          <CardDescription>
            Enter the employee's personal and professional details
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
                        <Input placeholder="john.doe@example.com" {...field} />
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
                        <Input placeholder="+1 234 567 8900" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Password must be at least 8 characters long
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm password" {...field} />
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
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loading ? "Loading roles..." : "Select a role"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loading ? (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              Loading roles...
                            </div>
                          ) : error ? (
                            <div className="p-2 text-center text-sm text-destructive">
                              {error}
                            </div>
                          ) : roles.length === 0 ? (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              No roles available
                            </div>
                          ) : (
                            roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.displayName}
                              </SelectItem>
                            ))
                          )}
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kitchen">Kitchen</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="management">Management</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
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

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Permissions</h3>
                <div className="grid gap-4 md:grid-cols-2">
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
                          <FormLabel>Modify Order</FormLabel>
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
                          <FormLabel>Delete Order</FormLabel>
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

              <Button type="submit">Add Employee</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 