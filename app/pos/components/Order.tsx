import React, { useState, useEffect } from 'react';
import { X, Printer, Calendar, Search, RefreshCcw, Eye } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  customerDetails?: {
    name: string;
    email: string;
    phone: string;
  };
  dineInCustomer?: {
    name: string;
    phone: string;
  };
  subtotal: number;
  tax: number;
  total: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'preparing' | 'ready';
  createdAt: string;
}

interface OrderProps {
  onClose: () => void;
  data: Order[];
  onUpdateOrder: (orderId: string, updates: any) => void;
  onDateChange: (startDate: Date, endDate: Date) => void;
  isDarkMode: boolean;
  currency: {
    symbol: string;
    code: string;
  };
  onPrint: (order: Order) => void;
}

export const Order: React.FC<OrderProps> = ({
  onClose,
  data,
  onUpdateOrder,
  onDateChange, 
  isDarkMode,
  currency,
  onPrint,
}) => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isloadingOrders, setIsloadingOrders] = useState(false);


  function getSafeName(data: any): string {
    try {
      const obj = typeof data === 'string' ? JSON.parse(data) : data;
      return obj?.name || '';
    } catch (e) {
      return '';
    }
  }
  


  useEffect(() => {
    let filtered = [...data];
    
    // Apply search filter only
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getSafeName(order.customerDetails).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getSafeName(order.dineInCustomer).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredOrders(filtered);
  }, [data, searchQuery]);

  const handleDateRangeChange = (range: 'today' | 'week' | 'month' | 'year' | 'custom') => {
    setDateRange(range);
    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);
  
    switch (range) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfDay(subDays(now, 7));
        break;
      case 'month':
        startDate = startOfDay(subDays(now, 30));
        break;
      case 'year':
        startDate = startOfDay(subDays(now, 365));
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          startDate = startOfDay(customDateRange.start);
          endDate = endOfDay(customDateRange.end);
        } else {
          startDate = startOfDay(now);
        }
        break;
      default:
        startDate = startOfDay(now);
    }
  
    // Pass both start and end date
    onDateChange(startDate, endDate);
  };
  

  const handleCustomDateChange = (range: DateRange | undefined) => {
    setIsloadingOrders(true);
    
    if (range?.from) {
      const start = range.from;
      const end = range.to || range.from;
  
      setCustomDateRange({ start, end });
      setCalendarOpen(false);
      
      // Pass both start and end
      onDateChange(startOfDay(start), endOfDay(end));
  
      setIsloadingOrders(false);
    }
  };
  

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      setIsloadingOrders(true);
      await onUpdateOrder(orderId, { status: newStatus });
      setIsloadingOrders(false);
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleRefresh = () => {
    setIsloadingOrders(true);
    handleDateRangeChange(dateRange);
    setIsloadingOrders(false);
  };

  const handlePrint = (order: Order) => {
    onPrint(order);
  };

  const handleViewOrder = (order: Order) => {
    // setShowOrder(true);
    // setOrder(order);
  };



  const handleCloseOrder = () => {
    console.log('close');
  };


  function getSafePhone(data: any): string {
    try {
      const obj = typeof data === 'string' ? JSON.parse(data) : data;
      return obj?.phone || '';
    } catch (e) {
      return '';
    }
  }
  
  return (
    <div className={`fixed mb-20 inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center z-50`}>
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounde w-[100%] h-[100%] overflow-hidden`}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Orders</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4"> 
              <button
                onClick={handleRefresh}
                className={`p-2 hover:bg-gray-100 rounded-md transition-colors shadow ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
              >
                <RefreshCcw className={`w-6 h-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`} />
              </button>   
            </div>
            <button
              onClick={onClose}
              className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">

          {isloadingOrders && (
            <div className="flex justify-center items-center h-full mt-10 opacity-50">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-600"></div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-4 mb-6 relative">
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-gray-600 text-gray-100 bg-gray-800' : 'focus:ring-rose-500 text-gray-900 bg-white'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <select
              value={dateRange}
              className={`border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-gray-600 text-gray-100 bg-gray-800' : 'focus:ring-rose-500 text-gray-900 bg-white'}`}
              onChange={(e) => handleDateRangeChange(e.target.value as any)}
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 365 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            {dateRange === 'custom' && (
              <div className="relative">
                <button
                  onClick={() => setCalendarOpen(!calendarOpen)}
                  className={`flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-gray-50 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <Calendar className="w-4 h-4" />
                  {customDateRange.start && customDateRange.end
                    ? `${format(customDateRange.start, 'MMM d')} - ${format(customDateRange.end, 'MMM d')}`
                    : 'Select dates'}
                </button>
                {calendarOpen && (
                  <div className={`absolute right-0 z-10 mt-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-lg p-3`}>
                    <CalendarComponent
                      mode="range"
                      selected={{
                        from: customDateRange.start || undefined,
                        to: customDateRange.end || undefined
                      }}
                      onSelect={handleCustomDateChange}
                      numberOfMonths={2}
                      className={`rounded-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                      classNames={{
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                        day_range_start: "day-range-start",
                        day_range_end: "day-range-end",
                        day_selected: "bg-[#e41e3f] text-white hover:bg-[#e41e3f] hover:text-white focus:bg-[#e41e3f] focus:text-white",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible"
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Orders List */}
          <div className="overflow-y-auto max-h-[calc(90vh-12rem)]">
            <table className="w-full">
              <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase text-xs`}>Order ID</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Date</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Customer</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Total</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Status</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Order Type</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Actions</th>
                </tr>
              </thead>
              {filteredOrders.length > 0 ? (
                <tbody className={`divide-y divide-gray-200 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  {filteredOrders.map((order) => (
                    // console.log(order.customerDetails.name),
                    <tr key={order.orderNumber} className={` ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'} ${order.status === 'completed' ? 'bg-green-100 text-green-800 opacity-50' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                      order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'}`}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}" title={order.orderNumber} onMouseEnter={() => handleViewOrder(order)} onMouseLeave={() => handleCloseOrder()}>
                        <span>#{order.orderNumber.slice(0, 3)}...{order.orderNumber.slice(-3)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}">
                        {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}">
                        {/* {console.log(order, 'order.customerDetails')} */}
                        {order.orderType === 'dine-in' ? getSafeName(order.dineInCustomer) : getSafeName(order.customerDetails)}
                        {/* {console.log(order)} */}
                      {/* if order.customerDetails is not null then show the customer name else show the dine in customer name */}
                      
            
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}">{currency.symbol}{order.totalAmount}</td>
                      <td className="px-6 py-4">
                        
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                          className={`text-sm rounded-full px-3 py-1 ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                            order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                          >
              <option value="preparing" selected={order.status === 'preparing'}>preparing</option>
<option value="ready" selected={order.status === 'ready'}>ready</option>
<option value="completed" selected={order.status === 'completed'}>completed</option>
<option value="cancelled" selected={order.status === 'cancelled'}>cancelled</option>

                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {order.orderType}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePrint(order)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No orders found with this filter</td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}; 