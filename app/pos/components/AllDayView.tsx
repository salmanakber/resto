import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, RefreshCcw } from "lucide-react";
import { format, startOfDay, endOfDay } from 'date-fns';
import { cn } from "@/lib/utils";

interface AllDayViewProps {
  onClose: () => void;
  dailyStats: {
    totalSales: number;
    totalOrders: number;
    newCustomers: number;
    itemSales: { [key: string]: number };
    hourlySales: { hour: string; sales: number }[];
  };
  isDarkMode: boolean;
  currency: {
    symbol: string;
  };
  onDateChange?: (date: Date) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AllDayView: React.FC<AllDayViewProps> = ({ onClose, dailyStats, isDarkMode, currency, onDateChange }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      if (onDateChange) {
        onDateChange(date);
      }
    }
  };

  const handleRefresh = () => {
    if (onDateChange) {
      onDateChange(selectedDate);
      setIsLoading(true);
      setSelectedDate(new Date());
      setIsLoading(false);  
      setSelectedDate(new Date());
      setSearchQuery('');
      setFilterStatus('all');
      setIsLoading(false);
    }
  };

  // Transform itemSales data for charts
//  console.log(dailyStats);
  const itemSalesDataTopSeller = Object.entries(dailyStats.itemSales).map(([name, value]) => ({
    name,
    value
  }));

  const itemSalesData = Object.entries(dailyStats.categorySales).map(([name, value]) => ({
    name,
    TopSeller: value
  }));


  const hourlySalesData = dailyStats.hourlySales

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded- w-[100%] h-[100%] overflow-hidden`}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>All Day View</h2>
          <div className="flex items-center gap-4">
                <Button variant="outline" className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'}`} onClick={() => {
                    handleRefresh();
                    setIsLoading(false);

                }}>
                    {isLoading && <Loader2 className="w-6 h-6 animate-spin" color={isDarkMode ? 'white' : 'black'} />}
                    {!isLoading && <RefreshCcw className="w-6 h-6" color={isDarkMode ? 'white' : 'black'} />}
                </Button>
            

            <Popover className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <PopoverTrigger asChild className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <Button
                  variant="outline"
                  className={cn(
                    `w-[240px] justify-start text-left font-normal ${isDarkMode ? 'text-white' : 'text-gray-900'}`,
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className={`mr-2 h-4 w-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className={`w-auto p-0 ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`} align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

     
            <button
              onClick={onClose}
              className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(90vh-80px)]">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className={`p-6 rounded-sm card-container shadow-md ${isDarkMode ? 'bg-gray-700' : 'bg-[#f43f5e]'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-white'}`}>Total Sales</h3>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}> {currency.symbol}{dailyStats.totalSales.toFixed(2)}</p>
            </div>
            <div className={`p-6 rounded-sm card-container shadow-md ${isDarkMode ? 'bg-gray-700' : 'bg-[#f43f5e]'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-white'}`}>Total Orders</h3>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>{dailyStats.totalOrders}</p>
            </div>
            <div className={`p-6 rounded-sm card-container shadow-md ${isDarkMode ? 'bg-gray-700' : 'bg-[#f43f5e]'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-white'}`}>New Customers</h3>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>{dailyStats.newCustomers}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Hourly Sales Chart */}
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-6 rounded-xl shadow-sm`}>
              <h3 className={`text-md text-center font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Hourly Sales</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlySalesData} fontSize={12}>
                    <CartesianGrid strokeDasharray="1 1"  stroke="#f43f5e"  />
                    <XAxis dataKey="hour" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', color: 'black' }} labelStyle={{ color: 'black' }} formatter={(value) => `${currency.symbol}${value}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#f43f5e"
                      strokeWidth={2}   
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Item Sales Chart */}
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-6 rounded-xl shadow-sm`}>
              <h3 className={`text-md text-center font-semibold mb2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Item Sales Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={itemSalesDataTopSeller}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                    //   label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      nameKey="name"
                      valueKey="value"
                      outerRadius={100}
                      innerRadius={50}
                      fill="#f43f5e"
                      dataKey="value"
                    >
                      {itemSalesDataTopSeller.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Selling Items */}
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-1 rounded-xl shadow-md card-container`}>
              <h3 className={`text-md font-semibold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Top Selling Items</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%" >
                  <BarChart data={itemSalesData} fontSize={12}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name"  fontSize={10}/>
                    <YAxis fontSize={12}/>
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="TopSeller" fill="#f43f5e"  barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by Category */}
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-1 rounded-xl shadow-md card-container`}>
              <h3 className={`text-md font-semibold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sales by Category</h3>
              <div className="h-[300px] ">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={itemSalesData}>
                    <CartesianGrid strokeDasharray="3 3" fontSize={10}/>
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend fontSize={12} />
                    <Bar dataKey="TopSeller" fill="#f43f5e"  barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 