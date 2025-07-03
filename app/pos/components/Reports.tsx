import React, { useState } from 'react';
import { X, Download, Calendar, Filter, Loader2, RefreshCcw } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import { format, subDays, isWithinInterval } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ReportsProps {
  onClose: () => void;
  data: {
    salesData: Array<{
      date: string;
      amount: number;
      createdAt: string;
    }>;
    categoryData: Array<{
      name: string;
      value: number;
      createdAt: string;
    }>;
    topItems: Array<{
      name: string;
      quantity: number;
      revenue: number;
      createdAt: string;
    }>;
    customerMetrics: {
      newCustomers: number;
      returningCustomers: number;
      averageOrderValue: number;
      customerRetention: number;
      createdAt: string;
    };
  };
  isDarkMode: boolean;
  currency: any;
  onDateChange: (startDate: Date, endDate: Date) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const Reports: React.FC<ReportsProps> = ({ onClose, data, isDarkMode, currency, onDateChange }) => {
  const [dateRange, setDateRange] = React.useState('');
  const [selectedReport, setSelectedReport] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return `${currency?.symbol || '$'}${amount.toFixed(2)}`;
  };

  const filterDataByDate = (data: any[], date: Date | null, range: string) => {
    // If both date and range are empty/cleared, return all data
    if (!date && !range) {
      return data;
    }
    
    const today = new Date();
    let startDate: Date;
    
    if (date) {
      startDate = date;
    } else if (range) {
      switch (range) {
        case 'week':
          startDate = subDays(today, 7);
          break;
        case 'month':
          startDate = subDays(today, 30);
          break;
        case 'quarter':
          startDate = subDays(today, 90);
          break;
        case 'year':
          startDate = subDays(today, 365);
          break;
        default:
          return data;
      }
    } else {
      return data;
    }

    return data.filter(item => {
      const itemDate = new Date(item.createdAt);
      return isWithinInterval(itemDate, { start: startDate, end: today });
    });
  };

  const getFilteredData = () => {
    let filteredData = { ...data };

    // Filter by date
    filteredData.salesData = filterDataByDate(data.salesData, selectedDate, dateRange);
    filteredData.categoryData = filterDataByDate(data.categoryData, selectedDate, dateRange);
    filteredData.topItems = filterDataByDate(data.topItems, selectedDate, dateRange);

    // Filter by report type
    if (selectedReport) {
      switch (selectedReport) {
        case 'sales':
          filteredData.categoryData = [];
          filteredData.topItems = [];
          break;
        case 'items':
          filteredData.salesData = [];
          filteredData.customerMetrics = {
            newCustomers: 0,
            returningCustomers: 0,
            averageOrderValue: 0,
            customerRetention: 0,
            createdAt: new Date().toISOString()
          };
          break;
        case 'customers':
          filteredData.salesData = [];
          filteredData.categoryData = [];
          filteredData.topItems = [];
          break;
      }
    }

    return filteredData;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setDateRange('');
      onDateChange(date, date);
    } else {
      // Clear date selection
      setSelectedDate(null);
      setDateRange('');
      // Reset to show all data
      onDateChange(new Date(), new Date() );
    }
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    setSelectedDate(null);
  
    if (range) {
      const today = new Date();
      let startDate: Date;
      const endDate = today;
  
      switch (range) {
        case 'week':
          startDate = subDays(today, 7);
          break;
        case 'month':
          startDate = subDays(today, 30);
          break;
        case 'quarter':
          startDate = subDays(today, 90);
          break;
        case 'year':
          startDate = subDays(today, 365);
          break;
        default:
          // Reset to show all data
          onDateChange(new Date(0), new Date()); // from epoch start to now
          return;
      }
  
      onDateChange(startDate, endDate);
      setSelectedDate(startDate);
      setSelectedDate(endDate);
      setDateRange(range);
      setIsLoading(false);
    } else {
      // Reset to show all data
      onDateChange(new Date(0), new Date());
    }
  };
  

  const handleReportTypeChange = (type: string) => {
    setSelectedReport(type);
  };

  const handleRefresh = () => {
    setIsLoading(true); 
    if (onDateChange) {
      onDateChange(selectedDate || new Date(), selectedDate || new Date());

      setSelectedReport('');
      setDateRange('');
      setSelectedDate(null);
      setIsLoading(false);  

    }
  };

  const exportToExcel = () => {
    const filteredData = getFilteredData();
    const wb = XLSX.utils.book_new();
    
    if (filteredData.salesData.length > 0) {
      const salesWS = XLSX.utils.json_to_sheet(filteredData.salesData.map(item => ({
        Date: item.date,
        Amount: item.amount
      })));
      XLSX.utils.book_append_sheet(wb, salesWS, "Sales Data");
    }

    if (filteredData.categoryData.length > 0) {
      const categoryWS = XLSX.utils.json_to_sheet(filteredData.categoryData.map(item => ({
        Category: item.name,
        Value: item.value
      })));
      XLSX.utils.book_append_sheet(wb, categoryWS, "Category Data");
    }

    if (filteredData.topItems.length > 0) {
      const itemsWS = XLSX.utils.json_to_sheet(filteredData.topItems.map(item => ({
        Item: item.name,
        Quantity: item.quantity,
        Revenue: item.revenue
      })));
      XLSX.utils.book_append_sheet(wb, itemsWS, "Top Items");
    }

    if (selectedReport === 'customers' || !selectedReport) {
      const metricsWS = XLSX.utils.json_to_sheet([{
        'New Customers': filteredData.customerMetrics.newCustomers,
        'Returning Customers': filteredData.customerMetrics.returningCustomers,
        'Average Order Value': filteredData.customerMetrics.averageOrderValue,
        'Customer Retention': `${filteredData.customerMetrics.customerRetention}%`
      }]);
      XLSX.utils.book_append_sheet(wb, metricsWS, "Customer Metrics");
    }

    XLSX.writeFile(wb, `restaurant_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const filteredData = getFilteredData();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Restaurant Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            h2 { color: #333; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Restaurant Report</h1>
          ${filteredData.salesData.length > 0 ? `
            <h2>Sales Data</h2>
            <table>
              <tr>
                <th>Date</th>
                <th>Amount</th>
              </tr>
              ${filteredData.salesData.map(item => `
                <tr>
                  <td>${item.date}</td>
                  <td>${formatCurrency(item.amount)}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}

          ${filteredData.categoryData.length > 0 ? `
            <h2>Category Distribution</h2>
            <table>
              <tr>
                <th>Category</th>
                <th>Value</th>
              </tr>
              ${filteredData.categoryData.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${formatCurrency(item.value)}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}

          ${filteredData.topItems.length > 0 ? `
            <h2>Top Selling Items</h2>
            <table>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Revenue</th>
              </tr>
              ${filteredData.topItems.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.revenue)}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}

          ${(selectedReport === 'customers' || !selectedReport) ? `
            <h2>Customer Metrics</h2>
            <table>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
              <tr>
                <td>New Customers</td>
                <td>${filteredData.customerMetrics.newCustomers}</td>
              </tr>
              <tr>
                <td>Returning Customers</td>
                <td>${filteredData.customerMetrics.returningCustomers}</td>
              </tr>
              <tr>
                <td>Average Order Value</td>
                <td>${formatCurrency(filteredData.customerMetrics.averageOrderValue)}</td>
              </tr>
              <tr>
                <td>Customer Retention</td>
                <td>${filteredData.customerMetrics.customerRetention}%</td>
              </tr>
            </table>
          ` : ''}
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredData = getFilteredData();

  return (
    <div className={`fixed mb-20 inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center z-50`}>
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-0 w-[100%] h-[100%] overflow-hidden`}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Reports & Analytics</h2>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button variant="outline" className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'}`} onClick={() => {
                handleRefresh();
              }}>
                {isLoading && <Loader2 className="w-6 h-6 animate-spin" color={isDarkMode ? 'white' : 'black'} />}
                {!isLoading && <RefreshCcw className="w-6 h-6" color={isDarkMode ? 'white' : 'black'} />}
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 ${
                      isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate || undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <button 
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
              <button 
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
              <Download className="w-4 h-4" />
                Export PDF
            </button>
            </div>
            <button
              onClick={onClose}
              className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100%-80px)]">
          {/* Controls */}
          <div className="flex gap-4 mb-6">
            <select
              value={selectedReport}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900'
              }`}
            >
              <option value="">All</option>
              <option value="sales">Sales</option>
              <option value="items">Items</option>
              <option value="customers">Customers</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900'
              }`}
            >
              <option value="">All</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">Last 365 Days</option>
            </select>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-rose-600'} p-4 rounded-xl shadow-sm`}>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-white'}`}>New Customers</h3>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-white'}`}>{filteredData.customerMetrics.newCustomers}</p>
            </div>
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-rose-600'} p-4 rounded-xl shadow-sm`}>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-white'}`}>Returning Customers</h3>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-white'}`}>{filteredData.customerMetrics.returningCustomers}</p>
            </div>
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-rose-600'} p-4 rounded-xl shadow-sm`}>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-white'}`}>Average Order Value</h3>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-white'}`}>{formatCurrency(filteredData.customerMetrics.averageOrderValue)}</p>
            </div>
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-rose-600'} p-4 rounded-xl shadow-sm`}>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-white'}`}>Customer Retention</h3>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-white'}`}>{filteredData.customerMetrics.customerRetention}%</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Sales Trend */}
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-xl shadow-sm`}>
              <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sales Trend</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {filteredData.salesData.length > 0 ? (
                    <LineChart data={filteredData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4B5563' : '#E5E7EB'} />
                      <XAxis dataKey="date" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize={10} />
                      <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} tickFormatter={(value) => formatCurrency(value)} fontSize={10} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#f43f5e' : '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          color: isDarkMode ? '#FFFFFF' : '#000000',
                          fontSize: 10,
                        }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    <Legend />
                      <Line type="monotone" dataKey="amount" stroke="#f43f5e" />
                  </LineChart>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No sales data available</p>
                    </div>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution */}
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-xl shadow-sm`}>
              <h3 className={`text-md font-medium text-center mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Category Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {filteredData.categoryData.length > 0 ? (
                  <PieChart>
                    <Pie
                        data={filteredData.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                        fill="#f43f5e"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {filteredData.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          color: isDarkMode ? '#FFFFFF' : '#000000'
                        }}
                      />
                  </PieChart>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No category data available</p>
                    </div>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Selling Items */}
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-xl shadow-sm`}>
              <h3 className={`text-md font-medium text-center mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Top Selling Items</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {filteredData.topItems.length > 0 ? (
                    <BarChart data={filteredData.topItems}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4B5563' : '#E5E7EB'} />
                      <XAxis dataKey="name" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize={10} />
                      <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} tickFormatter={(value) => formatCurrency(value)} fontSize={10} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          color: isDarkMode ? '#FFFFFF' : '#000000'
                        }}
                      />
                    <Legend />
                      <Bar dataKey="quantity" fill="black" name="Quantity" />
                      <Bar dataKey="revenue" fill="#f43f5e" name="Revenue" />
                  </BarChart>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No items data available</p>
                    </div>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Customer Activity */}
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-xl shadow-sm`}>
              <h3 className={`text-md font-medium text-center mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Customer Activity</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {filteredData.salesData.length > 0 ? (
                    <LineChart data={filteredData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4B5563' : '#E5E7EB'} />
                      <XAxis dataKey="date" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize={10} />
                      <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} tickFormatter={(value) => formatCurrency(value)} fontSize={10} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          color: isDarkMode ? '#FFFFFF' : '#000000'
                        }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    <Legend />
                      <Line type="monotone" dataKey="amount" stroke="#f43f5e" name="Customer Orders" />
                  </LineChart>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No customer activity data available</p>
                    </div>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 