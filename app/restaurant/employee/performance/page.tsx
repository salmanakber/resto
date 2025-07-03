"use client";

import { useState, useEffect } from 'react';
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';
import { BarChart2, Target, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectValue, SelectTrigger, SelectItem, SelectContent } from '@/components/ui/select';
import { format } from 'date-fns';

interface StaffPerformance {
  staffId: string;
  staffName: string; // <- missing in your current API response
  totalOrders: number; // <- your API uses 'ordersHandled'
  completedOrders: number; // <- missing
  averagePrepTime: number; // <- called 'avgPrepTimeSeconds' in API
  onTimeOrders: number; // <- missing
  lateOrders: number; // <- missing
  efficiency: number; // <- missing
}

interface PerformanceTrend {
  date: string;
  efficiency: number;
  orders: number;
  onTimeRate: number;
}


export default function PerformanceManagement() {
  const [performanceData, setPerformanceData] = useState<StaffPerformance[]>([]);
  const [trendData, setTrendData] = useState<PerformanceTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [overallStats, setOverallStats] = useState({
    averageEfficiency: 0,
    totalOrders: 0,
    onTimeRate: 0,
    averagePrepTime: 0
  });
  const [days, setDays] = useState<string>('all');

  const fetchPerformance = async (days: string = 'all') => {
    console.log('days are here ', days);
    setLoading(true);
  
    try {
      let res;
      let startDate = '';
      let endDate = '';
  
      if (days === 'all') {
        console.log('Fetching all-time performance');
        res = await fetch(`/api/restaurants/performance`);
      } else {
        const start = new Date();
        const end = new Date();
  
        switch (days) {
          case '7':
            start.setDate(end.getDate() - 7);
            break;
          case '30':
            start.setDate(end.getDate() - 30);
            break;
          case '90':
            start.setDate(end.getDate() - 90);
            break;
          default:
            throw new Error('Invalid range');
        }
  
        startDate = start.toISOString();
        endDate = end.toISOString();
  
        res = await fetch(`/api/restaurants/performance?start=${startDate}&end=${endDate}`);
      }
  
      if (!res.ok) throw new Error('Failed to fetch performance data');
  
      const data = await res.json();
  
      // Sort by efficiency
      const sortedData = (data.staffPerformance || []).sort(
        (a: StaffPerformance, b: StaffPerformance) => b.efficiency - a.efficiency
      );
  
      setPerformanceData(sortedData);
      setTrendData(data.trendData || []);
  
      if (sortedData.length > 0) {
        const totalOrders = sortedData.reduce((acc, curr) => acc + curr.totalOrders, 0);
        const totalEfficiency = sortedData.reduce((acc, curr) => acc + curr.efficiency, 0);
        const totalOnTime = sortedData.reduce((acc, curr) => acc + curr.onTimeOrders, 0);
        const totalPrepTime = sortedData.reduce((acc, curr) => acc + curr.averagePrepTime, 0);
  
        setOverallStats({
          averageEfficiency: totalEfficiency / sortedData.length,
          totalOrders,
          onTimeRate: (totalOnTime / totalOrders) * 100,
          averagePrepTime: totalPrepTime / sortedData.length,
        });
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
      toast.error('Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchPerformance();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  }

  

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Management</h1>
          <p className="text-muted-foreground">
            Track and evaluate staff performance
          </p>
        </div>
      <div className="flex items-center gap-2">
      <Select
        onValueChange={(value) => {
          setDays(value);
          fetchPerformance(value);
        }} 
        defaultValue="all"
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All time performance</SelectItem>
          <SelectItem value="7">7 days</SelectItem>
          <SelectItem value="30">30 days</SelectItem>
          <SelectItem value="90">90 days</SelectItem>
        </SelectContent>
      </Select>
          <Button onClick={() => fetchPerformance()} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Efficiency</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageEfficiency.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Overall staff efficiency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Orders handled in period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.onTimeRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Orders completed on time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Prep Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(overallStats.averagePrepTime)}</div>
            <p className="text-xs text-muted-foreground">
              Average preparation time
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>
            Performance metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            
          <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1" >
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>                  
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tickFormatter={(value) => {
                    const [year, month] = value.split('-'); // "2025-01" → ["2025", "01"]
                    const fakeDate = new Date(`${year}-${month}-01`);
                    return format(fakeDate, 'MMM yy'); // "Jan 25"
                  }}
                    />
                  <YAxis tickFormatter={(value) => `${(value)}%`} axisLine={false} tickLine={false} />
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <Tooltip />
                  <Bar
                    type="monotone"
                    dataKey="efficiency" 
                    stroke="#ec4899" 
                    fillOpacity={1}
                    fill="url(#colorIncome)" 
                  />
                  <Bar
                    type="monotone"
                    dataKey="orders" 
                    stroke="#ff0000" 
                    fillOpacity={1}
                    fill="url(#colorExpense)" 
                  />
                  <Bar
                    type="monotone"
                    dataKey="onTimeRate" 
                    stroke="#ffc658" 
                    fillOpacity={1}
                    fill="url(#colorExpense)" 
                  />

                </BarChart>
              </ResponsiveContainer>

          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff Performance Metrics</CardTitle>
          <CardDescription>
            Detailed performance metrics for each staff member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>On-Time</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Avg Prep Time</TableHead>
                <TableHead>Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map((staff) => (
                <TableRow key={staff.staffId}>
                  <TableCell className="font-medium">{staff.staffName}</TableCell>
                  <TableCell>{staff.totalOrders}</TableCell>
                  <TableCell>{staff.completedOrders}</TableCell>
                  <TableCell>{staff.onTimeOrders}</TableCell>
                  <TableCell>{staff.lateOrders}</TableCell>
                  <TableCell>{formatTime(staff.averagePrepTime)}</TableCell>
                  <TableCell className="font-semibold">{staff.efficiency.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 