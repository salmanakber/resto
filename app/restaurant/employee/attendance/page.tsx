'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Plus, Download, Filter, Search, MapPin, Edit2, Save, X, FilterIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLoading } from '@/hooks/use-loading';
import { Loading } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DateRange, RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

// Helper for time options (15-min increments)
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = Math.floor(i / 4).toString().padStart(2, '0');
  const m = ((i % 4) * 15).toString().padStart(2, '0');
  return `${h}:${m}`;
});

// Add these new interfaces after the existing interfaces
interface MonthlyStats {
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  totalDays: number;
  earlyClockIns: number;
  averageClockIn: string;
  averageClockOut: string;
  totalOvertime: string;
}

export default function AttendancePage() {
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [status, setStatus] = useState<string>('present');
  const [notes, setNotes] = useState<string>('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateRangeState, setDateRangeState] = useState([
    {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
      key: 'selection',
      color: 'red',
    },
  ]);
  const [inlineAdd, setInlineAdd] = useState({
    employeeId: '',
    date: new Date(),
    checkIn: '',
    checkOut: '',
    status: 'present',
    notes: '',
  });
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<any>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentMonthlyPage, setCurrentMonthlyPage] = useState(1);
  const itemsPerPage = 10;
  const [monthlyReportData, setMonthlyReportData] = useState<any[]>([]);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, [month, year]);

  const fetchAttendance = async () => {
    try {
      startLoading();
      const response = await fetch(
        `/api/restaurants/attendance?month=${month}&year=${year}`
      );
      if (!response.ok) throw new Error('Failed to fetch attendance');
      const data = await response.json();
      setAttendance(data);
    } catch (error) {
      toast.error('Failed to fetch attendance records');
    } finally {
      stopLoading();
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/restaurants/employee');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      toast.error('Failed to fetch employees');
    }
  };

  const parseTimeToDate = (timeStr: string, baseDate?: Date): Date => {
    const date = baseDate ? new Date(baseDate) : new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };
  

  const handleAddAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      startLoading();

      // Validate check-in and check-out times
      if (checkOut && new Date(checkIn) > new Date(checkOut)) {
        toast.error('Check-out time must be after check-in time');
        return;
      }


      const response = await fetch('/api/restaurants/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          date: selectedDate,
          checkIn: parseTimeToDate(checkIn),
          checkOut: parseTimeToDate(checkOut),
          status,
          notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to add attendance record');
      
      toast.success('Attendance record added successfully');
      setShowAddDialog(false);
      resetForm();
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to add attendance record');
    } finally {
      stopLoading();
    }
  };

  const resetForm = () => {
    setSelectedEmployee('');
    setCheckIn('');
    setCheckOut('');
    setStatus('present');
    setNotes('');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'default';
      case 'absent':
        return 'destructive';
      case 'late':
        return 'secondary';
      case 'half-day':
        return 'outline';
      default:
        return 'default';
    }
  };

  // --- Overtime calculation ---
  const calculateOvertime = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return '-';
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const diffMs = outDate.getTime() - inDate.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffM = Math.floor((diffMs / (1000 * 60)) % 60);
    // Assume 8h is normal, anything above is overtime
    const overtimeMins = diffH * 60 + diffM - 8 * 60;
    if (overtimeMins <= 0) return '-';
    const h = Math.floor(overtimeMins / 60);
    const m = overtimeMins % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
  };

  // --- Unique departments for filter dropdown ---
  const uniqueDepartments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  // --- Filtered attendance with date range and department ---
  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = searchQuery === '' || 
      `${record.employee.firstName} ${record.employee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || (record.employee.department && record.employee.department === departmentFilter);
    let matchesDate = true;
    const { startDate, endDate } = dateRangeState[0];
    if (startDate && endDate) {
      const recordDate = new Date(record.date);
      matchesDate = recordDate >= startDate && recordDate <= endDate;
    }
    return matchesSearch && matchesStatus && matchesDepartment && matchesDate;
  });

  // --- Date range picker handler ---
  const handleDateRangeChange = (range: RangeKeyDict) => {
    if (range.selection.startDate && range.selection.endDate) {
      setDateRangeState([{
        startDate: range.selection.startDate,
        endDate: range.selection.endDate,
        key: 'selection',
        color: 'red'
      }]);
    }
  };
  const clearDateRange = () => {
    setDateRangeState([
      {
        startDate: new Date(2000, 0, 1),
        endDate: new Date(2100, 11, 31),
        key: 'selection',
        color: 'red',
      
  
       

      },
    ]);
  };

  const exportToCSV = () => {
    const headers = ['Employee', 'Date', 'Check In', 'Check Out', 'Overtime', 'Picture', 'Location', 'Status', 'Notes'];
    const csvData = filteredAttendance.map(record => [
      `${record.employee.firstName} ${record.employee.lastName}`,
      new Date(record.date).toLocaleDateString(),
      record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-',
      record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-',
      calculateOvertime(record.checkIn, record.checkOut),
      record.employee.profilePicture,
      record.employee.locationUrl ? record.employee.location : record.employee.location,
      record.status,
      record.notes || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-${month}-${year}.csv`;
    link.click();
  };

  // --- Dashboard summary calculation ---
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const earlyCount = attendance.filter(a => {
    if (!a.checkIn) return false;
    const checkIn = new Date(a.checkIn);
    return checkIn.getHours() < 9;
  }).length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  // ... add more as needed ...

  // --- Inline add handler ---
  const handleInlineAdd = async () => {
    try {
      startLoading();
      const response = await fetch('/api/restaurants/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: inlineAdd.employeeId,
          date: inlineAdd.date,
          checkIn: parseTimeToDate(inlineAdd.checkIn),
          checkOut: parseTimeToDate(inlineAdd.checkOut),
          status: inlineAdd.status,
          notes: inlineAdd.notes,
        }),
      });
      if (!response.ok) throw new Error('Failed to add attendance record');
      toast.success('Attendance record added successfully');
      setInlineAdd({ employeeId: '', date: new Date(), checkIn: '', checkOut: '', status: 'present', notes: '' });
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to add attendance record');
    } finally {
      stopLoading();
    }
  };

  // --- Inline edit handlers ---
  const startEdit = (record: any) => {
    setEditingId(record.id);
    setEditRow({
      ...record,
      checkIn: record.checkIn ? formatTimeForPicker(new Date(record.checkIn)) : '',
      checkOut: record.checkOut ? formatTimeForPicker(new Date(record.checkOut)) : '',
    });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditRow(null);
  };
  const saveEdit = async () => {
    try {
      startLoading();
      const response = await fetch(`/api/restaurants/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editRow.id,
          checkIn: editRow.checkIn ? parseTimeToDate(editRow.checkIn, editRow.date) : null,
          checkOut: editRow.checkOut ? parseTimeToDate(editRow.checkOut, editRow.date) : null,
          status: editRow.status,
          notes: editRow.notes,
        }),
      });
      if (!response.ok) throw new Error('Failed to update attendance record');
      toast.success('Attendance record updated');
      setEditingId(null);
      setEditRow(null);
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to update attendance record');
    } finally {
      stopLoading();
    }
  };

  // Helper to format Date to "HH:mm"
  function formatTimeForPicker(date: Date) {
    return date.toTimeString().slice(0, 5);
  }
  const showHideCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  // Add this new function to calculate monthly stats
  const calculateMonthlyStats = (attendance: any[]) => {
    const stats: { [key: string]: MonthlyStats } = {};

    attendance.forEach(record => {
      const date = new Date(record.date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `${record.employeeId}-${month}-${year}`;

      if (!stats[key]) {
        stats[key] = {
          employeeId: record.employeeId,
          employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
          month,
          year,
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          totalDays: 0,
          earlyClockIns: 0,
          averageClockIn: '00:00',
          averageClockOut: '00:00',
          totalOvertime: '00:00'
        };
      }

      const stat = stats[key];
      stat.totalDays++;

      switch (record.status) {
        case 'present':
          stat.present++;
          break;
        case 'absent':
          stat.absent++;
          break;
        case 'late':
          stat.late++;
          break;
        case 'half-day':
          stat.halfDay++;
          break;
      }

      if (record.checkIn) {
        const checkIn = new Date(record.checkIn);
        if (checkIn.getHours() < 9) {
          stat.earlyClockIns++;
        }
      }

      // Calculate overtime
      if (record.checkIn && record.checkOut) {
        const overtime = calculateOvertime(record.checkIn, record.checkOut);
        if (overtime !== '-') {
          const [hours, minutes] = overtime.split('h ').map(part => parseInt(part) || 0);
          const currentOvertime = stat.totalOvertime.split(':').map(Number);
          const totalMinutes = (hours * 60 + minutes) + (currentOvertime[0] * 60 + currentOvertime[1]);
          stat.totalOvertime = `${Math.floor(totalMinutes / 60)}:${totalMinutes % 60}`;
        }
      }
    });

    return Object.values(stats);
  };

  // Add this function to export monthly report for a specific employee
  const exportMonthlyReport = (employeeId: string, month: number, year: number) => {
    const employeeStats = monthlyStats.find(
      stat => stat.employeeId === employeeId && stat.month === month && stat.year === year
    );

    if (!employeeStats) return;

    const headers = ['Metric', 'Value'];
    const data = [
      ['Employee Name', employeeStats.employeeName],
      ['Month', `${month}/${year}`],
      ['Total Days', employeeStats.totalDays],
      ['Present Days', employeeStats.present],
      ['Absent Days', employeeStats.absent],
      ['Late Days', employeeStats.late],
      ['Half Days', employeeStats.halfDay],
      ['Early Clock-ins', employeeStats.earlyClockIns],
      ['Average Clock-in', employeeStats.averageClockIn],
      ['Average Clock-out', employeeStats.averageClockOut],
      ['Total Overtime', employeeStats.totalOvertime]
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-report-${employeeStats.employeeName}-${month}-${year}.csv`;
    link.click();
  };

  // Add these pagination helper functions
  const getPaginatedData = (data: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[]) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  // Add this pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
    return (
      <div className="flex items-center justify-end space-x-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  // Add this effect to reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, departmentFilter, dateRangeState]);

  // Add new function to fetch monthly report data
  const fetchMonthlyReport = async (month: number, year: number) => {
    setIsLoadingMonthly(true);
    try {
      const response = await fetch(
        `/api/restaurants/attendance/monthly-report?month=${month}&year=${year}`
      );
      if (!response.ok) throw new Error('Failed to fetch monthly report');
      const data = await response.json();
      setMonthlyReportData(data);
      setMonthlyStats(data); // The API already returns data in the correct format
    } catch (error) {
      toast.error('Failed to fetch monthly report');
    } finally {
      setIsLoadingMonthly(false);
    }
  };

  // Add effect to fetch monthly report when month/year changes
  useEffect(() => {
    fetchMonthlyReport(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  // Add this helper function after the existing helper functions
  const isWithin24Hours = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  };

  // Add this function to handle record deletion
  const handleDelete = async (recordId: string) => {
    try {
      startLoading();
      const response = await fetch(`/api/restaurants/attendance?id=${recordId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete attendance record');
      toast.success('Attendance record deleted');
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to delete attendance record');
    } finally {
      stopLoading();
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Sticky Sidebar */}

 
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* --- Dashboard Summaries --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
            <CardHeader>
              <CardTitle className="text-sm">Present Summary</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex flex-col gap-2">
                <div className="text-sm">On time: <span className="font-bold">{presentCount}</span></div>
                <div className="text-sm">Late clock-in: <span className="font-bold">{lateCount}</span></div>
                <div className="text-sm">Early clock-in: <span className="font-bold">{earlyCount}</span></div>
              </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
              <CardTitle className="text-sm">Not Present Summary</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex flex-col gap-2">
                <div>Absent: <span className="font-bold">{absentCount}</span></div>
                {/* Add more as needed */}
              </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
              <CardTitle className="text-sm">Away Summary</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex flex-col gap-2">
                <div className="text-sm">Day off: <span className="font-bold">0</span></div>
                <div className="text-sm">Time off: <span className="font-bold">0</span></div>
              </div>
          </CardContent>
        </Card>
      </div>

        {/* --- Filters (date range, search, etc.) --- */}
        <div className="flex gap-4 items-center mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" onClick={exportToCSV} className="text-xs">
            <Download className="h-4 w-4 mr-2 text-xs" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="flex inline-flex text-xs">
            <Plus className="h-4 w-4 mr-2 text-xs" />
            Add Attendance
          </Button>
            <Button onClick={showHideCalendar} className="flex inline-flex">
            <FilterIcon className="h-4 w-4 mr-2 text-xs" />
            Calendar
          </Button>
        </div>

        {/* --- Attendance Table with Inline Add Row --- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Employee</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Check In</TableHead>
                  <TableHead className="text-xs">Check Out</TableHead>
                  <TableHead className="text-xs">Overtime</TableHead>
                  <TableHead className="text-xs">Picture</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Notes</TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Inline Add Row (with dropdown time pickers) */}
                <TableRow>
                  <TableCell>
                    <Select value={inlineAdd.employeeId} onValueChange={v => setInlineAdd({ ...inlineAdd, employeeId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Employee" />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            <div className="flex items-center gap-2 text-xs">
                              <Avatar className="h-6 w-6"><AvatarImage src={emp.profilePicture} /><AvatarFallback>{emp.firstName[0]}</AvatarFallback></Avatar>
                              {emp.firstName} {emp.lastName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input type="date" value={format(inlineAdd.date, 'yyyy-MM-dd')} onChange={e => setInlineAdd({ ...inlineAdd, date: new Date(e.target.value) })} />
                  </TableCell>
                  <TableCell>
                    <Select value={inlineAdd.checkIn} onValueChange={v => setInlineAdd({ ...inlineAdd, checkIn: v })}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder="Check In" /></SelectTrigger>
                      <SelectContent className="text-xs">
                        {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={inlineAdd.checkOut} onValueChange={v => setInlineAdd({ ...inlineAdd, checkOut: v })}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder="Check Out" /></SelectTrigger>
                      <SelectContent className="text-xs">
                        {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    {inlineAdd.employeeId ? (
                      <Avatar className="h-6 w-6"><AvatarImage src={employees.find(e => e.id === inlineAdd.employeeId)?.profilePicture} /><AvatarFallback>{employees.find(e => e.id === inlineAdd.employeeId)?.firstName?.[0]}</AvatarFallback></Avatar>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {inlineAdd.employeeId ? employees.find(e => e.id === inlineAdd.employeeId)?.department : ''}
                  </TableCell>
                  <TableCell>
                    <Select value={inlineAdd.status} onValueChange={v => setInlineAdd({ ...inlineAdd, status: v })}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="half-day">Half Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input value={inlineAdd.notes} onChange={e => setInlineAdd({ ...inlineAdd, notes: e.target.value })} placeholder="Notes" className="text-xs" />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" onClick={handleInlineAdd} disabled={isLoading || !inlineAdd.employeeId || !inlineAdd.checkIn}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                {/* Existing records with inline editing */}
                {getPaginatedData(filteredAttendance, currentPage).map((record) => (
                  editingId === record.id ? (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6"><AvatarImage src={record.employee.profilePicture} /><AvatarFallback>{record.employee.firstName[0]}</AvatarFallback></Avatar>
                          {record.employee.firstName} {record.employee.lastName}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Select value={editRow.checkIn} onValueChange={v => setEditRow({ ...editRow, checkIn: v })}>
                          <SelectTrigger className="text-xs"><SelectValue placeholder="Check In" /></SelectTrigger>
                          <SelectContent className="text-xs">
                            {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={editRow.checkOut} onValueChange={v => setEditRow({ ...editRow, checkOut: v })}>
                          <SelectTrigger><SelectValue placeholder="Check Out" /></SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{calculateOvertime(editRow.checkIn, editRow.checkOut)}</TableCell>
                      <TableCell>
                        <Avatar className="h-6 w-6"><AvatarImage src={record.employee.profilePicture} /><AvatarFallback>{record.employee.firstName[0]}</AvatarFallback></Avatar>
                      </TableCell>
                      <TableCell>{record.employee.department}</TableCell>
                      <TableCell>
                        <Select value={editRow.status} onValueChange={v => setEditRow({ ...editRow, status: v })}>
                          <SelectTrigger className="text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                          <SelectContent className="text-xs">
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="half-day">Half Day</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input value={editRow.notes} onChange={e => setEditRow({ ...editRow, notes: e.target.value })} placeholder="Notes" className="text-xs"  />
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} disabled={isLoading}><Save className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6"><AvatarImage src={record.employee.profilePicture} /><AvatarFallback>{record.employee.firstName[0]}</AvatarFallback></Avatar>
                          {record.employee.firstName} {record.employee.lastName}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}</TableCell>
                      <TableCell>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}</TableCell>
                      <TableCell>{calculateOvertime(record.checkIn, record.checkOut)}</TableCell>
                      <TableCell><Avatar className="h-6 w-6"><AvatarImage src={record.employee.profilePicture} /><AvatarFallback>{record.employee.firstName[0]}</AvatarFallback></Avatar></TableCell>
                      <TableCell>{record.employee.department}</TableCell>
                      <TableCell><Badge variant={getStatusColor(record.status)}>{record.status}</Badge></TableCell>
                      <TableCell>{record.notes || '-'}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(record)}><Edit2 className="h-4 w-4" /></Button>
                        {isWithin24Hours(new Date(record.createdAt)) && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDelete(record.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                ))}
              </TableBody>
            </Table>
            <Pagination
              currentPage={currentPage}
              totalPages={getTotalPages(filteredAttendance)}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>

        {/* Existing Dialog for Add Attendance (kept for mobile) */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Attendance Record</DialogTitle>
              <DialogDescription>
                Record employee attendance for the selected date
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddAttendance} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee</Label>
                  <Select
                    value={selectedEmployee}
                    onValueChange={setSelectedEmployee}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">Check In</Label>
                  <Input
                    id="checkIn"
                    type="time"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkOut">Check Out</Label>
                  <Input
                    id="checkOut"
                    type="time"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="half-day">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Record'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Reports</CardTitle>
            <CardDescription>
              View and export detailed monthly reports for each employee
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => {
                  setSelectedMonth(parseInt(value));
                  setCurrentMonthlyPage(1);
                }}
              >
                <SelectTrigger>
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
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => {
                  setSelectedYear(parseInt(value));
                  setCurrentMonthlyPage(1);
                }}
              >
                <SelectTrigger>
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
            </div>

            {isLoadingMonthly ? (
              <div className="flex items-center justify-center h-40">
                <Loading />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Half Days</TableHead>
                      <TableHead>Early Clock-ins</TableHead>
                      <TableHead>Total Overtime</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedData(monthlyStats, currentMonthlyPage).map((stat) => (
                      <TableRow key={stat.employeeId}>
                        <TableCell className="font-medium">{stat.employeeName}</TableCell>
                        <TableCell>{stat.department}</TableCell>
                        <TableCell>{stat.stats.present}</TableCell>
                        <TableCell>{stat.stats.absent}</TableCell>
                        <TableCell>{stat.stats.late}</TableCell>
                        <TableCell>{stat.stats.halfDay}</TableCell>
                        <TableCell>{stat.stats.earlyClockIns}</TableCell>
                        <TableCell>{stat.stats.totalOvertime}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportMonthlyReport(stat.employeeId, selectedMonth, selectedYear)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination
                  currentPage={currentMonthlyPage}
                  totalPages={getTotalPages(monthlyStats)}
                  onPageChange={setCurrentMonthlyPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

        <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Calendar</DialogTitle>
      <DialogDescription>
        Select a date range to filter attendance records
      </DialogDescription>
    </DialogHeader>
   

  <div className="flex flex-col gap-2 w-full">
    <h2 className="font-bold text-lg mb-2">Filters</h2>
    <DateRange
      editableDateInputs={true}
      onChange={handleDateRangeChange}
      moveRangeOnFirstSelection={false}
      ranges={dateRangeState}
      className="text-sm w-full"
    />
    <Button variant="outline" size="sm" className="mt-2 w-full" onClick={clearDateRange}>Clear Date Range</Button>
  </div>
  <div>
    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Filter by department" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Departments</SelectItem>
        {uniqueDepartments.map(dept => (
          <SelectItem key={dept} value={dept}>{dept.charAt(0).toUpperCase() + dept.slice(1)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

</DialogContent>
</Dialog>
    </div>
  


)
} 