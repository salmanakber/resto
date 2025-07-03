'use client';

import { useState, useEffect } from 'react';
import { categories, menuItems, sampleCustomers } from './mockData';
import { Customer, MenuItem, Order, OrderItem } from './types';
import NewCustomerForm from './components/NewCustomerForm';
import CustomizeOrder from './components/CustomizeOrder';
import { useRouter } from 'next/navigation';
import { 
  PlusCircle, 
  Settings2, 
  Search, 
  XCircle, 
  Receipt, 
  ArrowLeft, 
  ArrowRight,
  UserX,
  ShoppingBag,
  Home,
  Truck,
  Filter,
  ChevronLeft,
  Sun,
  Moon,
  Calendar,
  Clock,
  Maximize,
  Minimize,
  CheckCircle,
  Circle
} from "lucide-react";

// Update the print styles at the top of the file
const printStyles = `
  @media print {
    @page {
      size: 80mm 297mm;
      margin: 0;
    }

    body * {
      visibility: hidden;
    }

    .print-section, .print-section * {
      visibility: visible;
    }

    .print-section {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 80mm;
      background-color: white;
      padding: 20px;
      font-size: 12px;
      line-height: 1.4;
    }

    .print-section h2 {
      font-size: 16px;
      margin-bottom: 4px;
    }

    .print-section h3 {
      font-size: 14px;
      margin-bottom: 4px;
    }

    .print-section .text-sm {
      font-size: 10px;
    }

    .print-section .border-t,
    .print-section .border-b {
      border-color: #000;
      border-width: 1px;
    }

    .print-section .mb-4 {
      margin-bottom: 12px;
    }

    .print-section .pt-4 {
      padding-top: 12px;
    }

    .print-section .py-4 {
      padding-top: 12px;
      padding-bottom: 12px;
    }

    .print-section .pl-4 {
      padding-left: 12px;
    }

    .no-print {
      display: none !important;
    }

    .print-divider {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }

    .print-section .receipt-header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #000;
    }

    .print-section .receipt-footer {
      text-align: center;
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px dashed #000;
    }
  }
`;

export default function POSPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [searchPhone, setSearchPhone] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [orderType, setOrderType] = useState<'dine-in' | 'pickup' | 'delivery'>('dine-in');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOrderSlip, setShowOrderSlip] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [orderTimestamp, setOrderTimestamp] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [currentOrderPage, setCurrentOrderPage] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const ordersPerPage = 4;
  
  // Mock orders data - in a real app this would come from your backend
  const allOrders = [
    { id: 16, status: 'ready', color: 'red', items: 2 },
    { id: 17, status: 'in-kitchen', color: 'blue', items: 3 },
    { id: 18, status: 'in-kitchen', color: 'yellow', items: 1 },
    { id: 19, status: 'in-kitchen', color: 'yellow', items: 4 },
    { id: 20, status: 'ready', color: 'green', items: 2 },
    { id: 21, status: 'in-kitchen', color: 'blue', items: 3 },
    { id: 22, status: 'ready', color: 'red', items: 1 },
    { id: 23, status: 'in-kitchen', color: 'yellow', items: 2 }
  ];

  // Calculate the total number of pages
  const totalPages = Math.ceil(allOrders.length / ordersPerPage);

  // Get current visible orders and next/previous orders for smooth transition
  const getCurrentOrders = (page: number) => {
    const normalizedPage = ((page % totalPages) + totalPages) % totalPages;
    return allOrders.slice(
      normalizedPage * ordersPerPage,
      (normalizedPage + 1) * ordersPerPage
    );
  };

  const currentOrders = getCurrentOrders(currentOrderPage);
  const nextOrders = getCurrentOrders(currentOrderPage + 1);
  const prevOrders = getCurrentOrders(currentOrderPage - 1);

  // Navigation functions
  const handlePrevPage = () => {
    if (isSliding) return;
    setSlideDirection('right');
    setIsSliding(true);
    setTimeout(() => {
      setCurrentOrderPage(prev => (prev > 0 ? prev - 1 : totalPages - 1));
      setIsSliding(false);
      setSlideDirection(null);
    }, 300);
  };

  const handleNextPage = () => {
    if (isSliding) return;
    setSlideDirection('left');
    setIsSliding(true);
    setTimeout(() => {
      setCurrentOrderPage(prev => (prev < totalPages - 1 ? prev + 1 : 0));
      setIsSliding(false);
      setSlideDirection(null);
    }, 300);
  };

  // Update fullscreen effect
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Add useEffect for current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date and time
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const searchedItems = searchQuery
    ? filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredItems;

  const findCustomerByPhone = (phone: string) => {
    return sampleCustomers.find(c => c.phone === phone);
  };

  const handlePhoneSearch = (phone: string) => {
    setSearchPhone(phone);
    const found = findCustomerByPhone(phone);
    if (found) {
      setCustomer(found);
      setShowNewCustomerForm(false);
    } else if (phone.length >= 10) {
      setShowNewCustomerForm(true);
    }
  };

  const handleNewCustomer = (newCustomer: Customer) => {
    setCustomer(newCustomer);
    setShowNewCustomerForm(false);
    // In a real app, you would save this to your backend
  };

  const handleAddToOrder = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
  };

  const handleCustomizationSave = (orderItem: Omit<OrderItem, 'id'>) => {
    setCurrentOrder(prev => [
      ...prev,
      { ...orderItem, id: Date.now().toString() }
    ]);
    setSelectedMenuItem(null);
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentOrder(prev => prev.filter(item => item.id !== itemId));
  };

  const calculateTotal = () => {
    const subtotal = currentOrder.reduce((sum, item) => {
      if (item.isFree) return sum;
      const itemTotal = item.menuItem.price * item.quantity;
      const customizationsTotal = (item.customizations?.reduce((sum, c) => sum + c.price, 0) || 0) * item.quantity;
      return sum + itemTotal + customizationsTotal;
    }, 0);
    
    const tax = subtotal * 0.1;
    const discount = (subtotal + tax) * (discountPercentage / 100);
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      discount: discount.toFixed(2),
      total: (subtotal + tax - discount).toFixed(2)
    };
  };

  const handleToggleFreeItem = (itemId: string) => {
    setCurrentOrder(prev => prev.map(item => 
      item.id === itemId ? { ...item, isFree: !item.isFree } : item
    ));
  };

  const handlePayment = () => {
    if (!customer) {
      alert('Please select a customer first');
      return;
    }

    const orderTime = new Date();
    const orderNum = Date.now().toString().slice(-4);

    setOrderNumber(orderNum);
    setOrderTimestamp(orderTime.toLocaleString());

    const order: Order = {
      id: Date.now().toString(),
      customer,
      items: currentOrder,
      status: 'in-progress',
      type: orderType,
      subtotal: parseFloat(calculateTotal().subtotal),
      tax: parseFloat(calculateTotal().tax),
      discount: parseFloat(calculateTotal().discount),
      total: parseFloat(calculateTotal().total),
      orderDate: orderTime,
    };

    // In a real app, you would save this to your backend
    console.log('Processing order:', order);
    
    // Set order as complete
    setOrderComplete(true);
    setShowOrderSlip(true);

    // Clear the current order
    setCurrentOrder([]);
    setCustomer(null);
    setSearchPhone('');
    setOrderType('dine-in');
  };

  const handleDirectAdd = (item: MenuItem) => {
    setCurrentOrder(prev => [
      ...prev,
      { 
        id: Date.now().toString(), 
        menuItem: item, 
        quantity: 1 
      }
    ]);
  };

  const handleRemoveCustomer = () => {
    setCustomer(null);
    setSearchPhone('');
  };

  const generateOrderSlip = () => {
    setShowOrderSlip(true);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${
        isDarkMode ? 'bg-gray-800 text-white border-b border-gray-700' : 'bg-white'
      } shadow-md px-6 py-2 flex justify-between items-center`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } rounded-lg px-3 py-1.5 transition-colors`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-2 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } rounded-lg px-3 py-1.5 transition-colors`}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Center Logo */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#e11d48] text-white">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"></path>
              <path d="M15.88 8.29L10.29 13.88C10.2 13.97 10.1 14 10 14C9.9 14 9.8 13.97 9.71 13.88L8.12 12.29C7.93 12.1 7.93 11.8 8.12 11.61C8.31 11.42 8.61 11.42 8.8 11.61L10 12.81L15.2 7.61C15.39 7.42 15.69 7.42 15.88 7.61C16.07 7.8 16.07 8.09 15.88 8.29Z" fill="currentColor"></path>
              <path d="M7.5 12C7.5 12.83 6.83 13.5 6 13.5C5.17 13.5 4.5 12.83 4.5 12C4.5 11.17 5.17 10.5 6 10.5C6.83 10.5 7.5 11.17 7.5 12Z" fill="currentColor"></path>
              <path d="M19.5 12C19.5 12.83 18.83 13.5 18 13.5C17.17 13.5 16.5 12.83 16.5 12C16.5 11.17 17.17 10.5 18 10.5C18.83 10.5 19.5 11.17 19.5 12Z" fill="currentColor"></path>
            </svg>
          </div>
          <span className={`font-bold text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>OPENPHO</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-rose-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <p className="font-medium text-sm">
                {formatDate(currentDateTime)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <p className="font-mono text-sm font-medium">
                {formatTime(currentDateTime)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } transition-colors`}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex h-screen pt-12">
        <style>{printStyles}</style>
        {/* Main Content Area (70%) */}
        <div className={`w-[70%] p-8 overflow-y-auto ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          {/* Order List */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Order List</h1>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrevPage}
                  disabled={isSliding}
                  className={`p-2 rounded-full ${
                    isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-50 text-gray-700'
                  } shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleNextPage}
                  disabled={isSliding}
                  className={`p-2 rounded-full ${
                    isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-50 text-gray-700'
                  } shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="relative overflow-hidden pb-2">
              <div className={`grid grid-cols-3 gap-3 transition-transform duration-300 ${
                isSliding && slideDirection === 'left' ? '-translate-x-full' : 
                isSliding && slideDirection === 'right' ? 'translate-x-full' : 
                'translate-x-0'
              }`}>
                {currentOrders.map(order => (
                  <div key={order.id} className={`${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  } rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 bg-${order.color}-500`}>
                      T{order.id}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>{order.items} items</div>
                    <div className="flex items-center mt-2">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'ready' ? 'bg-rose-500' : 'bg-yellow-500'} mr-2`} />
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {order.status === 'ready' ? 'Ready to serve' : 'In the kitchen'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Previous Orders (for smooth transition) */}
              <div className={`absolute top-0 right-full grid grid-cols-4 gap-4 w-full transition-transform duration-300 ${
                isSliding && slideDirection === 'right' ? 'translate-x-full' : 'translate-x-0'
              }`}>
                {prevOrders.map(order => (
                  <div key={`prev-${order.id}`} className={`${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  } rounded-xl p-4 shadow-sm`}>
                    {/* Same content structure as current orders */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 bg-${order.color}-500`}>
                      T{order.id}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>{order.items} items</div>
                    <div className="flex items-center mt-2">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'ready' ? 'bg-rose-500' : 'bg-yellow-500'} mr-2`} />
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {order.status === 'ready' ? 'Ready to serve' : 'In the kitchen'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Next Orders (for smooth transition) */}
              <div className={`absolute top-0 left-full grid grid-cols-4 gap-4 w-full transition-transform duration-300 ${
                isSliding && slideDirection === 'left' ? '-translate-x-full' : 'translate-x-0'
              }`}>
                {nextOrders.map(order => (
                  <div key={`next-${order.id}`} className={`${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  } rounded-xl p-4 shadow-sm`}>
                    {/* Same content structure as current orders */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 bg-${order.color}-500`}>
                      T{order.id}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>{order.items} items</div>
                    <div className="flex items-center mt-2">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'ready' ? 'bg-rose-500' : 'bg-yellow-500'} mr-2`} />
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {order.status === 'ready' ? 'Ready to serve' : 'In the kitchen'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Categories</h2>
            <div className="grid grid-cols-8 gap-4">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-xl transition-colors ${
                    selectedCategory === category.id 
                      ? 'bg-rose-500 text-white' 
                      : isDarkMode 
                        ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
                        : 'bg-white hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="text-sm font-medium">{category.name}</div>
                  <div className={`text-xs mt-1 ${
                    selectedCategory === category.id 
                      ? 'text-white' 
                      : isDarkMode 
                        ? 'text-gray-400' 
                        : 'text-gray-500'
                  }`}>{category.itemCount} items</div>
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full p-4 pl-12 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white placeholder-gray-400' 
                    : 'bg-white text-gray-900 placeholder-gray-500'
                }`}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Special Menu */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Special menu for you</h2>
              <button className={`px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 ${
                isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}>
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {searchedItems.map(item => (
                <div
                  key={item.id}
                  className={`${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  } rounded-xl overflow-hidden shadow-sm hover:shadow transition-shadow group`}
                >
                  <div className="relative">
                    <img 
                      src={item.image || `/images/menu/${item.category}-default.jpg`} 
                      alt={item.name} 
                      className="w-full h-48 object-cover"
                    />
                    {item.discount && (
                      <div className="absolute top-2 left-2 bg-purple-500 text-white px-3 py-1 rounded-lg text-sm">
                        {item.discount}% OFF
                      </div>
                    )}
                    {item.isRecommended && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm">
                        Recommendation
                      </div>
                    )}
                    {/* Action Buttons */}
                    <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectAdd(item);
                        }}
                        className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                        title="Add to order"
                      >
                        <PlusCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToOrder(item);
                        }}
                        className="p-2 bg-rose-400 text-white rounded-lg hover:bg-rose-500 transition-colors"
                        title="Customize"
                      >
                        <Settings2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{item.quantity}x</span>
                          <h3 className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{item.name}</h3>
                        </div>
                        <div className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        } mt-1`}>
                          {item.isFree ? 'Free of cost' : `$${(item.price * item.quantity).toFixed(2)}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFreeItem(item.id)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            item.isFree 
                              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md' 
                              : isDarkMode 
                                ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                          title={item.isFree ? "Make Paid" : "Make Free"}
                        >
                          {item.isFree ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Circle className="w-4 h-4" />
                              
                            </div>
                          )}
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-rose-500 hover:text-rose-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Details (30%) */}
        <div className={`w-[30%] border-l ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700 text-white' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Order Details</h2>
            </div>

            {/* Order Type Selection */}
            <div className="mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setOrderType('dine-in')}
                  className={`flex-1 p-4 rounded-xl transition-colors flex flex-col items-center gap-2 ${
                    orderType === 'dine-in'
                      ? 'bg-rose-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Dine-in"
                >
                  <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${
                    orderType === 'dine-in'
                      ? 'bg-white bg-opacity-20'
                      : isDarkMode
                        ? 'bg-gray-600'
                        : 'bg-white'
                  }`}>
                    <Home className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-medium">Dine-in</span>
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`flex-1 p-4 rounded-xl transition-colors flex flex-col items-center gap-2 ${
                    orderType === 'delivery'
                      ? 'bg-rose-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Delivery"
                >
                  <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${
                    orderType === 'delivery'
                      ? 'bg-white bg-opacity-20'
                      : isDarkMode
                        ? 'bg-gray-600'
                        : 'bg-white'
                  }`}>
                    <Truck className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-medium">Delivery</span>
                </button>
              </div>
            </div>

            {/* Customer Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Enter customer phone number"
                value={searchPhone}
                onChange={(e) => handlePhoneSearch(e.target.value)}
                className={`w-full p-3 border rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-200 placeholder-gray-400'
                }`}
              />
              {customer && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Customer Details
                    </h3>
                    <button
                      onClick={handleRemoveCustomer}
                      className="text-rose-500 hover:text-rose-600 p-1"
                      title="Remove Customer"
                    >
                      <UserX className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Name: {customer.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Phone: {customer.phone}
                    </p>
                    {customer.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Email: {customer.email}
                      </p>
                    )}
                    {customer.address && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Address: {customer.address}
                      </p>
                    )}
                    {customer.loyaltyPoints !== undefined && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Loyalty Tier:
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.loyaltyTier === 'platinum' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                            customer.loyaltyTier === 'gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            customer.loyaltyTier === 'silver' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                            'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          }`}>
                            {customer.loyaltyTier?.charAt(0).toUpperCase()}{customer.loyaltyTier?.slice(1)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Points:
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {customer.loyaltyPoints.toLocaleString()}
                          </span>
                        </div>
                        {customer.totalSpent !== undefined && (
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              Total Spent:
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {showNewCustomerForm && (
              <div className="mb-6">
                <NewCustomerForm
                  phone={searchPhone}
                  onSave={handleNewCustomer}
                  onCancel={() => setShowNewCustomerForm(false)}
                />
              </div>
            )}

            {/* Order Items */}
            <div className="flex-1 overflow-y-auto mb-6 space-y-4">
              {currentOrder.map((item) => (
                <div key={item.id} className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font[10] ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{item.quantity}x</span>
                        <h3 className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{item.menuItem.name}</h3>
                      </div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      } mt-1`}>
                        {item.isFree ? 'Free of cost' : `$${(item.menuItem.price * item.quantity).toFixed(2)}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleFreeItem(item.id)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          item.isFree 
                            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md' 
                            : isDarkMode 
                              ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                        title={item.isFree ? "Make Paid" : "Make Free"}
                      >
                        {item.isFree ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            
                          </div>
                        ) : (
              
                        )}
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-rose-500 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {item.customizations && item.customizations.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {item.customizations.map((custom, idx) => (
                        <div key={idx} className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        } flex justify-between`}>
                          <span>+ {custom.name}</span>
                          <span>{item.isFree ? 'Free' : `$${custom.price.toFixed(2)}`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.specialInstructions && (
                    <div className={`mt-2 text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    } italic`}>
                      Note: {item.specialInstructions}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className={`border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            } pt-4`}>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>Subtotal</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>${calculateTotal().subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>Tax 10%</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>${calculateTotal().tax}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>Discount {discountPercentage}%</span>
                  <span className="text-rose-500">-${calculateTotal().discount}</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg mb-6">
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Total</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>${calculateTotal().total}</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    const input = prompt('Enter discount percentage (0-100):');
                    const value = parseInt(input || '0');
                    if (!isNaN(value) && value >= 0 && value <= 100) {
                      setDiscountPercentage(value);
                    } else {
                      alert('Please enter a valid discount percentage between 0 and 100');
                    }
                  }}
                  className={`py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-rose-500">%</span>
                  Discount
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!customer || currentOrder.length === 0}
                  className="py-3 bg-rose-500 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Receipt className="w-5 h-5" />
                  Order
                </button>
                <button
                  onClick={() => {
                    if (!orderComplete) {
                      alert('Please complete the order first');
                      return;
                    }
                    setShowOrderSlip(true);
                  }}
                  className={`py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    orderComplete
                      ? 'bg-rose-500 text-white hover:bg-rose-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Receipt className="w-5 h-5" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customize Order Modal */}
        {selectedMenuItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="w-full max-w-md">
              <CustomizeOrder
                menuItem={selectedMenuItem}
                onSave={handleCustomizationSave}
                onCancel={() => setSelectedMenuItem(null)}
              />
            </div>
          </div>
        )}

        {/* Order Slip Modal */}
        {showOrderSlip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowOrderSlip(false);
                  setOrderComplete(false);
                  setOrderNumber('');
                  setOrderTimestamp('');
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 no-print"
              >
                <XCircle className="w-6 h-6" />
              </button>

              <div className="print-section">
                <div className="receipt-header">
                  <h2 className="text-xl font-bold">OPENPHO</h2>
                  <p className="text-sm text-gray-500">123 Restaurant Street</p>
                  <p className="text-sm text-gray-500">Phone: (123) 456-7890</p>
                  <div className="print-divider"></div>
                  <p className="text-sm font-medium">Order #{orderNumber}</p>
                  <p className="text-sm text-gray-500">{orderTimestamp}</p>
                </div>

                <div className="py-4">
                  <p className="font-medium">Customer Details:</p>
                  <p className="text-sm">{customer?.name}</p>
                  <p className="text-sm text-gray-500">{customer?.phone}</p>
                  <p className="text-sm text-gray-500 capitalize">Order Type: {orderType}</p>
                </div>

                <div className="print-divider"></div>

                <div className="py-4">
                  <p className="font-medium mb-2">Order Items:</p>
                  {currentOrder.map((item) => (
                    <div key={item.id} className="mb-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{item.quantity}x {item.menuItem.name}</span>
                        <span className="text-sm">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.customizations && item.customizations.length > 0 && (
                        <div className="pl-4">
                          {item.customizations.map((custom, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-gray-500">
                              <span>+ {custom.name}</span>
                              <span>${custom.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {item.specialInstructions && (
                        <div className="pl-4 text-sm text-gray-500 italic">
                          Note: {item.specialInstructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="print-divider"></div>

                <div className="py-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Subtotal</span>
                    <span>${calculateTotal().subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tax (10%)</span>
                    <span>${calculateTotal().tax}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Discount (20%)</span>
                    <span>-${calculateTotal().discount}</span>
                  </div>
                  <div className="print-divider"></div>
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total</span>
                    <span>${calculateTotal().total}</span>
                  </div>
                </div>

                <div className="receipt-footer">
                  <p className="text-sm">Thank you for your order!</p>
                  <p className="text-sm">Please keep this slip for your reference.</p>
                  <div className="print-divider"></div>
                  <p className="text-xs">{orderTimestamp}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 no-print">
                <button
                  onClick={() => {
                    setShowOrderSlip(false);
                    setOrderComplete(false);
                    setOrderNumber('');
                    setOrderTimestamp('');
                  }}
                  className="w-1/2 py-3 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Close
                </button>
                <button
                  onClick={() => {
                    if (!orderComplete) {
                      alert('Please complete the order payment first');
                      return;
                    }
                    window.print();
                    setShowOrderSlip(false);
                    setOrderComplete(false);
                  }}
                  className={`w-1/2 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    orderComplete 
                      ? 'bg-rose-500 text-white hover:bg-rose-600' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Receipt className="w-5 h-5" />
                  Print
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 