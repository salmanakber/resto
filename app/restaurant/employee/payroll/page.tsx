"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Plus, Download, Clock, Gift, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useLoading } from '@/hooks/use-loading';
import { Loading } from '@/components/ui/loading';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"

interface PayrollRecord {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: string;
  overtimePay: string;
  tipsAmount: string;
  deductions: string;
  netSalary: string;
  status: string;
  paymentDate: string | null;
  payslipUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
  };
  overtimeRecords: Array<{
    id: string;
    date: string;
    hours: string;
    rate: string;
    amount: string;
    notes: string | null;
  }>;
  tipRecords: Array<{
    id: string;
    date: string;
    amount: string;
    type: string;
    notes: string;
  }>;
  deductionRecords: Array<{
    id: string;
    type: string;
    amount: string;
    description: string;
    startDate: string;
    endDate: string | null;
  }>;
}

interface EmployeePayrolls {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
  };
  payrolls: PayrollRecord[];
}

interface PayrollData {
  [key: string]: EmployeePayrolls;
}

export default function PayrollManagement() {
  const { isLoading, withLoading } = useLoading();
  const [payrollData, setPayrollData] = useState<PayrollData>({});
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showDeductionDialog, setShowDeductionDialog] = useState(false);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showOvertimeDialog, setShowOvertimeDialog] = useState(false);
  const [showTipsDialog, setShowTipsDialog] = useState(false);
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [currency, setCurrency] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPayrolls, setSelectedPayrolls] = useState<string[]>([])
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const itemsPerPage = 5

  // Get current year and month
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, [selectedMonth, selectedYear, page, statusFilter]);

  const fetchPayrolls = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', selectedYear);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', itemsPerPage.toString());
      
      const response = await fetch(`/api/restaurants/payroll?${params}`);
      
      if (!response.ok) throw new Error('Failed to fetch payrolls');
      
      const data = await response.json();
      // Ensure we always set an object, even if empty
      
      setPayrollData(data.data || {});
      console.log('data', data)
      setTotalPages(Math.ceil((data.pendingCount || 0) / itemsPerPage));
      await withLoading(fetchEmployees());
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      toast.error('Failed to fetch payroll records');
      // Set empty object on error
      setPayrollData({});
      setTotalPages(1);
      
    }
  };
  

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/restaurants/employee',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      toast.error('Failed to fetch employees');
    }
  };

  useEffect(() => {
    if (employeeSearch.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const searchLower = employeeSearch.toLowerCase();
      const filtered = employees.filter(emp => 
        emp.firstName.toLowerCase().includes(searchLower) ||
        emp.lastName.toLowerCase().includes(searchLower)
      );
      setFilteredEmployees(filtered);
    }
  }, [employeeSearch, employees]);

  const handleProcessPayroll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const month = parseInt(formData.get('month') as string);
    const year = parseInt(formData.get('year') as string);
    const paymentDate = new Date(formData.get('paymentDate') as string).toISOString();
    const employeeId = formData.get('employeeId') as string;
    const baseSalary = parseFloat(formData.get('baseSalary') as string);
    const overtimePay = parseFloat(formData.get('overtimePay') as string) || 0;
    const tipsAmount = parseFloat(formData.get('tipsAmount') as string) || 0;
    const deductions = parseFloat(formData.get('deductions') as string) || 0;

    try {
      const processPayroll = async () => {
        const response = await fetch('/api/restaurants/payroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId,
            month,
            year,
            baseSalary,
            overtimePay,
            tipsAmount,
            deductions,
            paymentDate,
          }),
        });

        if (!response.ok) throw new Error('Failed to process payroll');
        
        toast.success('Payroll processed successfully');
        setShowProcessDialog(false);
        fetchPayrolls();
      };

      await withLoading(processPayroll());
    } catch (error) {
      toast.error('Failed to process payroll');
    }
  };

  const handleAddOvertime = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      employeeId: formData.get('employeeId') as string,
      date: formData.get('date') as string,
      hours: parseFloat(formData.get('hours') as string),
      rate: parseFloat(formData.get('rate') as string),
      notes: formData.get('notes') as string,
    };

    try {
      const addOvertime = async () => {
        const response = await fetch('/api/restaurants/overtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to add overtime');
        
        toast.success('Overtime added successfully');
        setShowOvertimeDialog(false);
        fetchPayrolls();
      };

      await withLoading(addOvertime());
    } catch (error) {
      toast.error('Failed to add overtime');
    }
  };

  const handleAddTips = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      employeeId: formData.get('employeeId') as string,
      date: new Date(formData.get('date') as string).toISOString(),
      amount: parseFloat(formData.get('amount') as string),
      type: formData.get('type') as 'individual' | 'pooled',
      notes: formData.get('notes') as string,
    };

    try {
      const addTips = async () => {
        const response = await fetch('/api/restaurants/tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to add tips');
        
        toast.success('Tips added successfully');
        setShowTipsDialog(false);
        fetchPayrolls();
      };

      await withLoading(addTips());
    } catch (error) {
      toast.error('Failed to add tips');
    }
  };

  const handleAddDeduction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      employeeId: formData.get('employeeId') as string,
      type: formData.get('type') as string,
      amount: parseFloat(formData.get('amount') as string),
      description: formData.get('description') as string,
      startDate: new Date().toISOString(),
    };

    try {
      const addDeduction = async () => {
        const response = await fetch('/api/restaurants/deductions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to add deduction');
        
        toast.success('Deduction added successfully');
        setShowDeductionDialog(false);
        fetchPayrolls();
      };

      await withLoading(addDeduction());
    } catch (error) {
      toast.error('Failed to add deduction');
    }
  };

  const generatePayslip = async (payrollId: string) => {
    try {
      const generatePayslipPDF = async () => {
        const response = await fetch(`/api/restaurants/payroll/${payrollId}/payslip`, {
          method: 'POST',
        });

        if (!response.ok) throw new Error('Failed to generate payslip');
        
        const data = await response.json();
        window.open(data, '_blank');
      };

      await withLoading(generatePayslipPDF());
    } catch (error) {
      toast.error('Failed to generate payslip');
    }
  };

  const downloadPayslip = async (payrollId: string) => {
    try {
      const response = await fetch(`/api/restaurants/payroll/${payrollId}/payslip`, {
        method: 'POST',
      });
  
      if (!response.ok) throw new Error('Failed to download payslip');
  
      const data = await response.json();
  
      // Assuming `data` is a direct file URL
      const link = document.createElement('a');
      link.href = data;
      link.download = link.href.split('/').pop() || 'payslip.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error('Failed to download payslip');
    }
  };
  
  // Function to get settings

  const getSettings = async (key: string) => {
    const response = await fetch('/api/settings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: key,
        }),
      }
    );
    if (!response.ok) throw new Error('Failed to fetch currency');
    const data = await response.json();
    return data;
  };

  useEffect(() => {
    getSettings('currency').then((data) => {
      const currentCurrencySettings = JSON.parse(data.value);
      const defaultCurrency = Object.entries(currentCurrencySettings).find(
        ([_, value]) => (value as any).default
      )?.[0] || 'USD';
      setCurrency(currentCurrencySettings[defaultCurrency] || { symbol: '$' });
    });
    getSettings('company').then((data) => {
      const currentCompanySettings = JSON.parse(data.value);
      setCompany(currentCompanySettings);
    });
  }, []);

  // Function to handle employee selection
  const handleEmployeeSelect = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/restaurants/employee/${employeeId}`);
      if (!response.ok) throw new Error('Failed to fetch employee details');
      const employeeData = await response.json();
      setSelectedEmployee(employeeData);
      setEmployeeSearch(employeeData.firstName + ' ' + employeeData.lastName);
      setShowEmployeeDropdown(false);
    } catch (error) {
      toast.error('Failed to fetch employee details');
    }
  };
  
  const formatCurrency = (value: number) => {
    if (!currency) return '0.00';
    return currency.symbol + Number(value).toFixed(2)
  }
  
  const handleStatusChange = async (payrollId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/restaurants/payroll/${payrollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      toast.success('Payroll status updated successfully');
      fetchPayrolls(); // Refresh the list
      setShowStatusDialog(false);
    } catch (error) {
      toast.error('Failed to update payroll status');
    }
  };

  // Calculate totals for all payrolls
  const calculateTotals = () => {
    let totalPayroll = 0;
    let pendingPayments = 0;
    let totalDeductions = 0;
    let netPayments = 0;

    if (!payrollData) {
      return {
        totalPayroll,
        pendingPayments,
        totalDeductions,
        netPayments,
      };
    }

    Object.values(payrollData).forEach((employeeData) => {
      if (!employeeData?.payrolls) return;
      
      employeeData.payrolls.forEach((payroll) => {
        totalPayroll += Number(payroll.netSalary) || 0;
        if (payroll.status === 'pending') {
          pendingPayments += Number(payroll.netSalary) || 0;
        }
        totalDeductions += Number(payroll.deductions) || 0;
        netPayments += Number(payroll.netSalary) || 0;
      });
    });

    return {
      totalPayroll,
      pendingPayments,
      totalDeductions,
      netPayments,
    };
  };

  const totals = calculateTotals();

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedPayrolls.length === 0) {
      toast.error('Please select at least one payroll record')
      return
    }

    setIsBulkUpdating(true)
    try {
      const response = await fetch('/api/restaurants/payroll/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payrollIds: selectedPayrolls,
          status: newStatus
        }),
      })

      if (!response.ok) throw new Error('Failed to update status')
      
      toast.success('Status updated successfully')
      setSelectedPayrolls([])
      fetchPayrolls()
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const handleSelectAll = (employeeId: string, checked: boolean) => {
    const employeePayrolls = payrollData[employeeId]?.payrolls || []
    if (checked) {
      setSelectedPayrolls(prev => [...prev, ...employeePayrolls.map(p => p.id)])
    } else {
      setSelectedPayrolls(prev => prev.filter(id => !employeePayrolls.some(p => p.id === id)))
    }
  }

  const handleSelectPayroll = (payrollId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayrolls(prev => [...prev, payrollId])
    } else {
      setSelectedPayrolls(prev => prev.filter(id => id !== payrollId))
    }
  }

  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>

          {[...Array(3)].map((_, i) => (
            <Card key={i} className="mb-6">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">
            Manage employee salaries and payments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowTipsDialog(true)}>
            <Gift className="mr-2 h-4 w-4" />
            Add Tips
          </Button>
          <Button variant="outline" onClick={() => setShowOvertimeDialog(true)}>
            <Clock className="mr-2 h-4 w-4" />
            Add Overtime
          </Button>
          <Dialog open={showDeductionDialog} onOpenChange={setShowDeductionDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Deduction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Deduction</DialogTitle>
                <DialogDescription>
                  Add a deduction for the employee
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDeduction} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="employeeId">Employee</Label>
                  <div className="space-y-2 relative">
                    <Input
                      placeholder="Search employees..."
                      value={employeeSearch}
                      onChange={(e) => {
                        setEmployeeSearch(e.target.value);
                        setShowEmployeeDropdown(true);
                      }}
                      className="mb-2"
                    />
                    {showEmployeeDropdown && (
                      <div className="flex flex-col gap-2 bg-white shadow absolute top-8 left-0 w-full p-2 rounded-md z-10">
                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto bg-gray-100 p-2 rounded-md">
                          {filteredEmployees.map((employee) => (
                            <div
                              key={employee.id}
                              className="cursor-pointer hover:bg-gray-200 p-2 rounded-md"
                              onClick={() => handleEmployeeSelect(employee.id)}
                            >
                              {employee.firstName} {employee.lastName}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <input type="hidden" name="employeeId" value={selectedEmployee?.id || ''} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Deduction Type</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tax">Tax</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" />
                </div>
                <Button type="submit">Add Deduction</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Process Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Process Payroll</DialogTitle>
                <DialogDescription>
                  Generate payroll for an employee for the selected period
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleProcessPayroll} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="employeeId">Employee</Label>
                  <div className="space-y-2 relative">
                    <Input
                      placeholder="Search employees..."
                      value={employeeSearch}
                      onChange={(e) => {
                        setEmployeeSearch(e.target.value);
                        setShowEmployeeDropdown(true);
                      }}
                      className="mb-2"
                    />
                    {showEmployeeDropdown && (
                      <div className="flex flex-col gap-2 bg-white shadow absolute top-8 left-0 w-full p-2 rounded-md z-10">
                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto bg-gray-100 p-2 rounded-md">
                          {filteredEmployees.map((employee) => (
                            <div
                              key={employee.id}
                              className="cursor-pointer hover:bg-gray-200 p-2 rounded-md"
                              onClick={() => handleEmployeeSelect(employee.id)}
                            >
                              {employee.firstName} {employee.lastName}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <input type="hidden" name="employeeId" value={selectedEmployee?.id || ''} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="month">Month</Label>
                    <Select name="month" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <SelectItem key={month} value={month.toString()}>
                            {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="year">Year</Label>
                    <Select name="year" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="baseSalary">Base Salary</Label>
                    <Input 
                      id="baseSalary" 
                      name="baseSalary" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      required 
                      defaultValue={selectedEmployee?.salary || ''}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="overtimePay">Overtime Pay</Label>
                    <Input 
                      id="overtimePay" 
                      name="overtimePay" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      defaultValue="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tipsAmount">Tips Amount</Label>
                    <Input 
                      id="tipsAmount" 
                      name="tipsAmount" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      defaultValue="0"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="deductions">Deductions</Label>
                    <Input 
                      id="deductions" 
                      name="deductions" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      defaultValue="0"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input 
                    id="paymentDate" 
                    name="paymentDate" 
                    type="date" 
                    required 
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <Button type="submit">Process Payroll</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Month/Year Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="month">Month</Label>
          <Select
            value={selectedMonth}
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="year">Year</Label>
          <Select
            value={selectedYear}
            onValueChange={setSelectedYear}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedPayrolls.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedPayrolls.length} payroll(s) selected
          </span>
          <Select
            onValueChange={handleBulkStatusUpdate}
            disabled={isBulkUpdating}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Update status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            onClick={() => setSelectedPayrolls([])}
            disabled={isBulkUpdating}
          >
            Clear Selection
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalPayroll)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.pendingPayments)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Deductions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalDeductions)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.netPayments)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Payroll Records</h2>
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {Object.entries(payrollData).map(([employeeId, employeeData]) => (
          <Card key={employeeId} className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {employeeData.employee.firstName} {employeeData.employee.lastName}
                  </CardTitle>
                  <CardDescription>
                    {employeeData.employee.department} • {employeeData.employee.email}
                  </CardDescription>
                </div>
                <Checkbox
                  checked={employeeData.payrolls.every(p => selectedPayrolls.includes(p.id))}
                  onCheckedChange={(checked) => handleSelectAll(employeeId, checked as boolean)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Tips</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeData.payrolls.map((payroll) => (
                    <TableRow key={payroll.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPayrolls.includes(payroll.id)}
                          onCheckedChange={(checked) => handleSelectPayroll(payroll.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long' })} {payroll.year}
                      </TableCell>
                      <TableCell>{formatCurrency(Number(payroll.baseSalary))}</TableCell>
                      <TableCell>{formatCurrency(Number(payroll.overtimePay))}</TableCell>
                      <TableCell>{formatCurrency(Number(payroll.tipsAmount))}</TableCell>
                      <TableCell>{formatCurrency(Number(payroll.deductions))}</TableCell>
                      <TableCell>{formatCurrency(Number(payroll.netSalary))}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payroll.status === 'paid'
                              ? 'default'
                              : payroll.status === 'processing'
                              ? 'secondary'
                              : payroll.status === 'failed'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {payroll.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPayroll(payroll);
                                setShowStatusDialog(true);
                              }}
                            >
                              Change Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => generatePayslip(payroll.id)}
                            >
                              View Payslip
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => downloadPayslip(payroll.id)}
                            >
                              Download Payslip
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Overtime Dialog */}
      <Dialog open={showOvertimeDialog} onOpenChange={setShowOvertimeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Overtime</DialogTitle>
            <DialogDescription>
              Record employee overtime hours
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddOvertime} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="employeeId">Employee</Label>
              <div className="space-y-2 relative">
                <Input
                  placeholder="Search employees..."
                  value={employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value);
                    setShowEmployeeDropdown(true);
                  }}
                  className="mb-2"
                />
                {showEmployeeDropdown && (
                  <div className="flex flex-col gap-2 bg-white shadow absolute top-8 left-0 w-full p-2 rounded-md z-10">
                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto bg-gray-100 p-2 rounded-md">
                      {filteredEmployees.map((employee) => (
                        <div
                          key={employee.id}
                          className="cursor-pointer hover:bg-gray-200 p-2 rounded-md"
                          onClick={() => handleEmployeeSelect(employee.id)}
                        >
                          {employee.firstName} {employee.lastName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <input type="hidden" name="employeeId" value={selectedEmployee?.id || ''} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hours">Hours</Label>
              <Input id="hours" name="hours" type="number" step="0.5" min="0" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate">Rate per Hour</Label>
              <Input id="rate" name="rate" type="number" step="0.01" min="0" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <Button type="submit">Add Overtime</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tips Dialog */}
      <Dialog open={showTipsDialog} onOpenChange={setShowTipsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tips</DialogTitle>
            <DialogDescription>
              Record employee tips
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTips} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="employeeId">Employee</Label>
              <div className="space-y-2 relative">
                <Input
                  placeholder="Search employees..."
                  value={employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value);
                    setShowEmployeeDropdown(true);
                  }}
                  className="mb-2"
                />
                {showEmployeeDropdown && (
                  <div className="flex flex-col gap-2 bg-white shadow absolute top-8 left-0 w-full p-2 rounded-md z-10">
                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto bg-gray-100 p-2 rounded-md">
                      {filteredEmployees.map((employee) => (
                        <div
                          key={employee.id}
                          className="cursor-pointer hover:bg-gray-200 p-2 rounded-md"
                          onClick={() => handleEmployeeSelect(employee.id)}
                        >
                          {employee.firstName} {employee.lastName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <input type="hidden" name="employeeId" value={selectedEmployee?.id || ''} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required readOnly/> 
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="pooled">Pooled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <Button type="submit">Add Tips</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Payroll Status</DialogTitle>
            <DialogDescription>
              Update the status for payroll record of {selectedPayroll?.employee.firstName} {selectedPayroll?.employee.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={selectedPayroll?.status}
                onValueChange={(value) => handleStatusChange(selectedPayroll?.id, value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 