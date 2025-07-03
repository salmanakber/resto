'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Report {
  id: string;
  type: string;
  date: string;
  status: string;
  downloadUrl: string;
}

export function EmployeeReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement actual API call when backend is ready
      // For now, using mock data
      const mockReports: Report[] = [
        {
          id: '1',
          type: 'Employee Attendance',
          date: new Date().toISOString(),
          status: 'Completed',
          downloadUrl: '#',
        },
        {
          id: '2',
          type: 'Performance Report',
          date: new Date().toISOString(),
          status: 'Pending',
          downloadUrl: '#',
        },
      ];
      setReports(mockReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async (type: string) => {
    try {
      setIsLoading(true);
      // TODO: Implement actual API call when backend is ready
      console.log(`Generating ${type} report...`);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4 space-x-2">
        <Button
          onClick={() => handleGenerateReport('attendance')}
          disabled={isLoading}
        >
          Generate Attendance Report
        </Button>
        <Button
          onClick={() => handleGenerateReport('performance')}
          disabled={isLoading}
        >
          Generate Performance Report
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Report Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">
                Loading...
              </TableCell>
            </TableRow>
          ) : reports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">
                No reports found
              </TableCell>
            </TableRow>
          ) : (
            reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report.type}</TableCell>
                <TableCell>{new Date(report.date).toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    report.status === 'Completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={report.status !== 'Completed'}
                    onClick={() => window.open(report.downloadUrl, '_blank')}
                  >
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 