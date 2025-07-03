import React, { useState } from 'react';
import { X, Search, Filter, Loader2, RefreshCcw } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay } from 'date-fns';
import { cn } from "@/lib/utils";

interface TodayCustomersProps {
  onClose: () => void;
  customers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    totalSpent: number;
    totalOrders: number;
    lastOrderDate: string;
    status: string;
  }>;
  onDateChange: (date: Date) => void;
  isDarkMode: boolean;
  currency: {
    symbol: string;
  };
}

export const TodayCustomers: React.FC<TodayCustomersProps> = ({ onClose, customers, onDateChange, isDarkMode, currency }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [isLoading, setIsLoading] = useState(false);


  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
      setSearchQuery('');
      setFilterStatus('all');
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phoneNumber.includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-0 w-[100%] h-[100%] overflow-hidden`}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Today's Customers</h2>
          <div className="flex items-center gap-4 ">
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
              <PopoverContent className="w-auto p-0" align="end">
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

        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="new">New</option>
            </select>
          </div>

          {/* Customer List */}
          <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl shadow-sm overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-500'} uppercase tracking-wider`}>
                      Customer
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-500'} uppercase tracking-wider`}>
                      Contact
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-500'} uppercase tracking-wider`}>
                      Total Spent
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-500'} uppercase tracking-wider`}>
                      Orders
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-500'} uppercase tracking-wider`}>
                      Last Order
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-500'} uppercase tracking-wider`}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} divide-y divide-gray-200`}>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className={`hover:bg-gray-50 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
                            <span className="text-gray-500 font-medium">
                              {customer.firstName[0]}{customer.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {customer.firstName} {customer.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{customer.email}</div>
                        <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-500'}`}>{customer.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currency.symbol}{Number(customer.totalSpent).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{customer.totalOrders}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(customer.lastOrderDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          customer.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : customer.status === 'inactive'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 