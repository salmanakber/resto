"use client"

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calendar as CalendarIcon, Check, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
}

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({ 
    employeeId: '',
    startDate: '', 
    endDate: '', 
    type: 'Sick', 
    notes: '',
    status: 'active'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'month' | 'week'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedLeaves, setSelectedLeaves] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/restaurants/employee', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      
      setEmployees(data);
    } catch (error) {
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      let startDate, endDate;
      
      if (filterType === 'month') {
        const date = new Date(selectedYear, selectedMonth - 1);
        startDate = startOfMonth(date);
        endDate = endOfMonth(date);
      } else {
        endDate = new Date();
        startDate = subDays(endDate, 7);
      }

      const res = await fetch(`/api/restaurants/leave?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
      if (!res.ok) throw new Error('Failed to fetch leaves');
      const json = await res.json();
      
      setLeaves(json);
    } catch (error) {
      toast.error('Failed to fetch leave records');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/restaurants/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      if (!res.ok) throw new Error('Failed to add leave');
      toast.success('Leave request added');
      setShowRequestModal(false);
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to add leave');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (leaveId: string, newStatus: string, startDate: string, endDate: string, typeLeave: string, note: string) => {
    try {
      const res = await fetch(`/api/restaurants/leave/${leaveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, startDate, endDate, typeLeave, note }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Status updated successfully');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedLeaves.length === 0 || !bulkStatus) {
      toast.error('Please select leaves and a status');
      return;
    }

    try {
      const res = await fetch('/api/restaurants/leave/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveIds: selectedLeaves,
          status: bulkStatus
        }),
      });
      if (!res.ok) throw new Error('Failed to update statuses');
      toast.success('Statuses updated successfully');
      setSelectedLeaves([]);
      setBulkStatus('');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to update statuses');
    }
  };

  const toggleLeaveSelection = (leaveId: string) => {
    setSelectedLeaves(prev => 
      prev.includes(leaveId) 
        ? prev.filter(id => id !== leaveId)
        : [...prev, leaveId]
    );
  };

  const toggleAllLeaves = () => {
    setSelectedLeaves(prev => 
      prev.length === leaves.length ? [] : leaves.map(leave => leave.id)

    );
  };

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
  }, [filterType, selectedMonth, selectedYear]);

  // Calculate statistics
  const pendingCount = leaves.filter(l => l.tempStatus === 'pending').length;
  const approvedCount = leaves.filter(l => l.tempStatus === 'approved').length;
  const rejectedCount = leaves.filter(l => l.tempStatus === 'rejected').length;
  const onLeaveToday = leaves.filter(l => {
    const today = new Date();
    const start = new Date(l.leaveStartDate);
    const end = new Date(l.leaveEndDate);
    return l.tempStatus === 'on_leave' && today >= start && today <= end;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">
            Manage employee leave requests and approvals
          </p>
        </div>
        <Button onClick={() => setShowRequestModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Request Leave
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected This Month</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave Today</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onLeaveToday}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Leave Management</CardTitle>
            <div className="flex gap-4 items-center">
              {/* {selectedLeaves.length > 0 && (
                <div className="flex gap-2 items-center">
                  <Select value={bulkStatus} onValueChange={setBulkStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleBulkStatusUpdate}>
                    Update Selected ({selectedLeaves.length})
                  </Button>
                </div>
              )} */}
              <Select value={filterType} onValueChange={(value: 'month' | 'week') => setFilterType(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly View</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>

              {filterType === 'month' && (
                <>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedLeaves.length === leaves.length}
                    onCheckedChange={toggleAllLeaves}
                  />
                </TableHead> */}
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((leave: any) => (
                <TableRow 
                  key={leave.id} 
                  className={leave.tempStatus === 'pending' ? 'bg-yellow-100' : leave.tempStatus === 'rejected' ? 'bg-red-100' : leave.tempStatus === 'on_leave' ? 'bg-green-100' : 'bg-gray-100'}
                >
                  {/* <TableCell>
                    <Checkbox
                      checked={selectedLeaves.includes(leave.id)}
                      onCheckedChange={() => toggleLeaveSelection(leave.id)}
                    />
                  </TableCell> */}
                  
                  <TableCell>{leave.firstName} {leave.lastName}</TableCell>
                  <TableCell>{leave.typeLeave}</TableCell>
                  <TableCell>{leave.leaveStartDate && format(new Date(leave.leaveStartDate), 'PP')}</TableCell>
                  <TableCell>{leave.leaveEndDate && format(new Date(leave.leaveEndDate), 'PP')}</TableCell>
                  <TableCell>{leave.tempStatus}</TableCell>
                  <TableCell>{leave.note?.slice(0, 10)}...</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={leave.tempStatus === 'on_leave' || leave.tempStatus === 'rejected'}
                        className="h-8 w-8 p-0"
                        onClick={() => handleStatusUpdate(leave.id, 'on_leave', leave.leaveStartDate, leave.leaveEndDate, leave.typeLeave, leave.note)}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={leave.tempStatus === 'rejected' || leave.tempStatus === 'on_leave'}
                        className="h-8 w-8 p-0"
                        onClick={() => handleStatusUpdate(leave.id, 'rejected', leave.leaveStartDate, leave.leaveEndDate, leave.typeLeave, leave.note)}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Request Leave Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRequestLeave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee</Label>
              <Select
                value={requestData.employeeId}
                onValueChange={(value) => setRequestData(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={requestData.startDate}
                onChange={(e) => setRequestData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={requestData.endDate}
                onChange={(e) => setRequestData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Leave Type</Label>
              <Select
                value={requestData.type}
                onValueChange={(value) => setRequestData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SickLeave">Sick Leave</SelectItem>
                  <SelectItem value="AnnualLeave">Annual Leave</SelectItem>
                  <SelectItem value="UnpaidLeave">Unpaid Leave</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tempStatus">Status</Label>
              <Select
                value={requestData.status}
                onValueChange={(value) => setRequestData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={requestData.notes}
                onChange={(e) => setRequestData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter reason for leave"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowRequestModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 