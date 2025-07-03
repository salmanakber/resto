"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRange, RangeKeyDict } from 'react-date-range';
import { Download } from 'lucide-react';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const REPORT_TYPES = [
  { value: 'attendance', label: 'Attendance' },
  { value: 'leave', label: 'Leave' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'performance', label: 'Performance' },
];

export default function ReportsPage() {
  const [type, setType] = useState('attendance');
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
      key: 'selection',
    },
  ]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    const start = dateRange[0].startDate?.toISOString().split('T')[0];
    const end = dateRange[0].endDate?.toISOString().split('T')[0];
    const res = await fetch(`/api/restaurants/reports?type=${type}&start=${start}&end=${end}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  const exportToCSV = () => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type}-report.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map(rt => (
                  <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRange
              editableDateInputs={true}
              onChange={(range: RangeKeyDict) => setDateRange([range.selection])}
              moveRangeOnFirstSelection={false}
              ranges={dateRange}
              className="text-sm"
            />
            <Button onClick={fetchReport} disabled={loading}>
              {loading ? 'Loading...' : 'Generate'}
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={!data.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto mt-4">
            {data.length > 0 ? (
              <table className="min-w-full text-xs border">
                <thead>
                  <tr>
                    {Object.keys(data[0]).map((k) => (
                      <th key={k} className="border px-2 py-1 text-left">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i}>
                      {Object.keys(data[0]).map((k) => (
                        <td key={k} className="border px-2 py-1">{typeof row[k] === 'object' ? JSON.stringify(row[k]) : row[k]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-muted-foreground text-sm">No data</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HRM Reports</CardTitle>
          <CardDescription>
            Generate HRM-style reports for employees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select HRM report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee-list">Employee List</SelectItem>
                <SelectItem value="department-wise">Department-wise Report</SelectItem>
                <SelectItem value="role-wise">Role-wise Report</SelectItem>
                <SelectItem value="salary">Salary Structure Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full">Generate HRM Report</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee Invoices</CardTitle>
          <CardDescription>
            Generate and manage employee invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {/* Employee options will be populated dynamically */}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Invoice Period</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="custom">Custom Period</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full">Generate Invoice</Button>
        </CardContent>
      </Card>
    </div>
  );
} 