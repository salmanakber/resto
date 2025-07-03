"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  FileText,
  BarChart3,
  UserPlus,
  Briefcase,
  Award,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/loading';
import { useLoading } from '@/hooks/use-loading';
import { toast } from 'sonner';
import { ActivityChart } from "@/app/components/ActivityChart";


interface DashboardMetrics {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  totalPayroll: number;
  pendingPayrolls: number;
  activeDepartments: number;
  recentHires: number;
  upcomingReviews: number;
  pendingComplaints: number;
  recentActivities: any[];
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    onLeaveToday: 0,
    totalPayroll: 0,
    pendingPayrolls: 0,
    activeDepartments: 0,
    recentHires: 0,
    upcomingReviews: 0,
    pendingComplaints: 0,
    recentActivities: []
  });
  const [currency, setCurrency] = useState<any>(null);


  useEffect(() => {
    
  const fetchCurrency = async () => {
    startLoading();
    try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'currency'
      })
    });
    if (!response.ok) throw new Error('Failed to fetch currency data');
    const data = await response.json();
    const currentCurrencySettings = JSON.parse(data.value);
    const defaultCurrency = Object.entries(currentCurrencySettings).find(
      ([_, value]) => (value as any).default
    )?.[0] || 'USD';
    setCurrency(currentCurrencySettings[defaultCurrency] || { symbol: '$' });
    } catch (error) {

      toast.error('Failed to fetch currency data');
    } finally {
      stopLoading();
    }
  };
  fetchCurrency();

  }, []);

  const moneyFormat = (amount: number) => {
    return (currency?.symbol || '$') + amount.toLocaleString();
  }


  useEffect(() => {

  const fetchDashboardData = async () => {
    try {
      startLoading();
      const response = await fetch('/api/restaurants/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      stopLoading();
    }
  };
  fetchDashboardData(); 
  }, []);

  if (isLoading) {
    return <Loading />;
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">HRM Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Human Resource Management System
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">
                  Active employees in the system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.presentToday}</div>
                <p className="text-xs text-muted-foreground">
                  Employees present today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{moneyFormat(metrics.totalPayroll)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.pendingPayrolls} pending payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departments</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeDepartments}</div>
                <p className="text-xs text-muted-foreground">
                  Active departments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.absentToday}</div>
                <p className="text-xs text-muted-foreground">
                  Employees absent today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Late Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.lateToday}</div>
                <p className="text-xs text-muted-foreground">
                  Late arrivals today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On Leave</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.onLeaveToday}</div>
                <p className="text-xs text-muted-foreground">
                  Employees on leave
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Hires</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.recentHires}</div>
                <p className="text-xs text-muted-foreground">
                  New employees this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>

              <CardContent>
            <ActivityChart data={metrics.recentActivities} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/restaurant/employee/attendance')}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Manage Attendance
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/restaurant/employee/payroll')}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Process Payroll
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/restaurant/employee/performance')}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Performance Reviews
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/restaurant/employee/directory')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Employee Directory
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/restaurant/employee/add')}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                </div>
              </CardContent>
            </Card>

           
          </div>

          {/* Activity Chart */}
         
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>
                View and manage employee attendance records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.presentToday}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.absentToday}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Late Today</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.lateToday}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">On Leave</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.onLeaveToday}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4">
                <Button 
                  className="w-full"
                  onClick={() => router.push('/restaurant/employee/attendance')}
                >
                  View Detailed Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Overview</CardTitle>
              <CardDescription>
                Manage employee payroll and compensation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${metrics.totalPayroll.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.pendingPayrolls}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4">
                <Button 
                  className="w-full"
                  onClick={() => router.push('/restaurant/employee/payroll')}
                >
                  Manage Payroll
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>
                Track employee performance and reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Reviews</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.upcomingReviews}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Complaints</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.pendingComplaints}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4">
                <Button 
                  className="w-full"
                  onClick={() => router.push('/restaurant/employee/performance')}
                >
                  View Performance Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 