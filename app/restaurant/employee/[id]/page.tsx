"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Edit } from "lucide-react";
import { use } from "react";

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
  restaurantId: string;
  userId: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  access_area: string;
}

export default function EmployeeProfile({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<{ symbol: string } | null>(null);
  
  // Properly unwrap the params using React.use()
  const { id } = use(params);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await fetch(`/api/restaurants/employee/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch employee');
        }
        const data = await response.json();
        setEmployee(data);

        // get currency
        const currencyResponse = await fetch(`/api/settings`, {
          method: 'POST',
          body: JSON.stringify({ key: 'currency' })
        });
        if (currencyResponse.ok) {
            const currencyData = await currencyResponse.json();
            const currentCurrencySettings = JSON.parse(currencyData.value);
          const defaultCurrency = Object.entries(currentCurrencySettings).find(
            ([_, value]) => (value as any).default
          )?.[0] || 'USD';
          setCurrency(currentCurrencySettings[defaultCurrency] || { symbol: '$' });
        } 
        

        // Fetch role details
        if (data.role) {
          const roleResponse = await fetch(`/api/roles/${data.role}`);
          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            setRole(roleData);
          }
        }
      } catch (error) {
        toast.error('Failed to load employee details');
        router.push('/restaurant/employee/directory');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Employee not found</h2>
          <Button onClick={() => router.push('/restaurant/employee/directory')}>
            Back to Directory
          </Button>
        </div>
      </div>
    );
  }

  

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/restaurant/employee/directory')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Employee Profile</h1>
            <p className="text-muted-foreground">
              View and manage employee information
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/restaurant/employee/${employee.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic details about the employee</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium text-muted-foreground">Full Name</div>
              <div>{employee.firstName} {employee.lastName}</div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium text-muted-foreground">Email</div>
              <div>{employee.email}</div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium text-muted-foreground">Phone</div>
              <div>{employee.phone}</div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div>
                {employee.status === 'active' ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Active
                  </span>
                ) : employee.status === 'on_leave' ? (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    On Leave
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>Work-related details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium text-muted-foreground">Role</div>
              <div>{role?.displayName || employee.role}</div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium text-muted-foreground">Department</div>
              <div>{employee.department}</div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium text-muted-foreground">Joining Date</div>
              <div>{new Date(employee.joiningDate).toLocaleDateString()}</div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium text-muted-foreground">Salary</div>
                <div>{currency?.symbol}{ employee.salary.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 