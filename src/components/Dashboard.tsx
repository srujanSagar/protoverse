import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  IndianRupee,
  Package,
  Trophy,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Store,
  Calendar,
  FileX
} from 'lucide-react';
import { Order } from '../types';
import Dropdown from './ui/Dropdown';

interface DashboardProps {
  orders: Order[];
}

const Dashboard: React.FC<DashboardProps> = ({ orders }) => {
  // Local filter states
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>(['All Stores']);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = previous week, +1 = next week
  const [chartView, setChartView] = useState<'count' | 'revenue'>('count');

  // Filter options - Updated to match actual CSV data
  const outlets = ['All Stores', 'Kondapur', 'Kompally'];
  
  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  }, []);

  // Time slots for analysis - Fixed to use 24-hour format properly
  const timeSlots = [
    { label: '11:30 AM - 3:30 PM', start: 11.5, end: 15.5, icon: '🌅' },
    { label: '3:30 PM - 7:30 PM', start: 15.5, end: 19.5, icon: '☀️' },
    { label: '7:30 PM - 11:30 PM', start: 19.5, end: 23.5, icon: '🌆' },
    { label: 'Late Night', start: 23.5, end: 35.5, icon: '🌙' } // 35.5 = 11:30 AM next day
  ];

  // Filter orders based on selected criteria
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Month filter
      const orderDate = new Date(order.timestamp);
      const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Store filter - normalize outlet names for comparison
      const selectedStore = selectedOutlets[0];
      const normalizeOutletName = (name: string) => {
        return name.replace(/\s+/g, ' ').trim().toLowerCase();
      };
      
      const normalizedOrderOutlet = normalizeOutletName(order.outlet || '');
      const normalizedSelectedStore = normalizeOutletName(selectedStore);
      
      const matchesStore = selectedStore === 'All Stores' || 
        normalizedOrderOutlet === normalizedSelectedStore;
      
      return orderMonth === selectedMonth && matchesStore;
    });
  }, [orders, selectedMonth, selectedOutlets]);

  // Check if month has no data
  const hasNoData = filteredOrders.length === 0;

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate days in selected month for avg orders per day
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const avgOrdersPerDay = totalOrders / daysInMonth;

    // Calculate time slot counts for current month with improved logic
    const timeSlotCounts = timeSlots.map(slot => {
      const count = filteredOrders.filter(order => {
        const orderDate = new Date(order.timestamp);
        let hour = orderDate.getHours() + orderDate.getMinutes() / 60;
        
        // Handle late night slot that crosses midnight
        if (slot.label === 'Late Night') {
          // Late night is 11:30 PM to 11:30 AM next day
          return hour >= 23.5 || hour < 11.5;
        }
        
        // For other slots, use normal range check
        return hour >= slot.start && hour < slot.end;
      }).length;
      
      return { ...slot, count };
    });

    // Find peak time slot - only if there are orders and values > 0
    let peakSlot = null;
    let peakSlotIcon = null;
    
    if (totalOrders > 0) {
      // Filter out slots with 0 orders
      const slotsWithOrders = timeSlotCounts.filter(slot => slot.count > 0);
      
      if (slotsWithOrders.length > 0) {
        // Find the maximum count
        const maxCount = Math.max(...slotsWithOrders.map(slot => slot.count));
        
        // Get all slots with the maximum count (in case of tie)
        const topSlots = slotsWithOrders.filter(slot => slot.count === maxCount);
        
        if (topSlots.length === 1) {
          // Clear winner
          peakSlot = topSlots[0].label;
          peakSlotIcon = topSlots[0].icon;
        } else {
          // Tie - need to check previous months' cumulative performance
          // Get all orders from previous months for tie-breaking
          const previousMonthsOrders = orders.filter(order => {
            const orderDate = new Date(order.timestamp);
            const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            const selectedStore = selectedOutlets[0];
            const normalizeOutletName = (name: string) => {
              return name.replace(/\s+/g, ' ').trim().toLowerCase();
            };
            const matchesStore = selectedStore === 'All Stores' || 
              normalizeOutletName(order.outlet || '') === normalizeOutletName(selectedStore);
            return orderMonth < selectedMonth && matchesStore;
          });
          
          // Calculate cumulative performance for tied slots
          const tieBreaker = topSlots.map(slot => {
            const cumulativeCount = previousMonthsOrders.filter(order => {
              const orderDate = new Date(order.timestamp);
              let hour = orderDate.getHours() + orderDate.getMinutes() / 60;
              
              // Handle late night slot that crosses midnight
              if (slot.label === 'Late Night') {
                return hour >= 23.5 || hour < 11.5;
              }
              
              return hour >= slot.start && hour < slot.end;
            }).length;
            
            return { ...slot, cumulativeCount };
          });
          
          // Find the slot with highest cumulative performance
          const winner = tieBreaker.reduce((max, slot) => 
            slot.cumulativeCount > max.cumulativeCount ? slot : max, tieBreaker[0]);
          
          peakSlot = winner.label;
          peakSlotIcon = winner.icon;
        }
      }
    }

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      avgOrdersPerDay,
      peakSlot,
      peakSlotIcon,
      timeSlotCounts
    };
  }, [filteredOrders, selectedMonth, orders, selectedOutlets]);

  // Weekly data for bar chart (within selected month and store)
  const weeklyData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);
    
    // Find the first Sunday of the month or before
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Add week offset
    const targetWeekStart = new Date(startDate);
    targetWeekStart.setDate(startDate.getDate() + (weekOffset * 7));
    
    const weekData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(targetWeekStart);
      date.setDate(targetWeekStart.getDate() + i);
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.timestamp);
        const selectedStore = selectedOutlets[0];
        const normalizeOutletName = (name: string) => {
          return name.replace(/\s+/g, ' ').trim().toLowerCase();
        };
        const matchesStore = selectedStore === 'All Stores' || 
          normalizeOutletName(order.outlet || '') === normalizeOutletName(selectedStore);
        return orderDate.toDateString() === date.toDateString() && matchesStore;
      });
      
      const count = dayOrders.length;
      const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
      
      weekData.push({
        day: days[i],
        date: String(date.getDate()).padStart(2, '0'),
        fullDate: date.toDateString(),
        count,
        revenue
      });
    }
    
    return weekData;
  }, [orders, selectedMonth, weekOffset, selectedOutlets]);

  // Top selling items with pie chart data
  const topSellingItems = useMemo(() => {
    const itemStats = new Map();
    
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.menuItem.id;
        const existing = itemStats.get(key);
        
        if (existing) {
          itemStats.set(key, {
            ...existing,
            count: existing.count + item.quantity,
            revenue: existing.revenue + (item.menuItem.price * item.quantity)
          });
        } else {
          itemStats.set(key, {
            name: item.menuItem.name,
            count: item.quantity,
            revenue: item.menuItem.price * item.quantity
          });
        }
      });
    });
    
    const totalItemsSold = Array.from(itemStats.values()).reduce((sum, item) => sum + item.count, 0);
    
    const allItems = Array.from(itemStats.values())
      .map(item => ({
        ...item,
        percentage: totalItemsSold > 0 ? (item.count / totalItemsSold) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    const top3 = allItems.slice(0, 3);
    const others = allItems.slice(3);
    const othersPercentage = others.reduce((sum, item) => sum + item.percentage, 0);

    return { top3, othersPercentage, totalItemsSold };
  }, [filteredOrders]);

  // Pie chart component
  const PieChart = ({ data }: { data: any }) => {
    if (data.totalItemsSold === 0) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No sales data</p>
          </div>
        </div>
      );
    }

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    let cumulativePercentage = 0;

    const segments = [
      ...data.top3.map((item: any, index: number) => ({
        ...item,
        color: colors[index],
        startAngle: cumulativePercentage,
        endAngle: cumulativePercentage += item.percentage
      })),
      ...(data.othersPercentage > 0 ? [{
        name: 'Others',
        percentage: data.othersPercentage,
        color: colors[3],
        startAngle: cumulativePercentage,
        endAngle: cumulativePercentage + data.othersPercentage
      }] : [])
    ];

    const radius = 70;
    const centerX = 90;
    const centerY = 90;

    return (
      <div className="flex flex-col items-center">
        <svg width="180" height="180" className="mb-4">
          {segments.map((segment, index) => {
            const startAngle = (segment.startAngle / 100) * 360 - 90;
            const endAngle = (segment.endAngle / 100) * 360 - 90;
            
            const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
            
            const largeArcFlag = segment.percentage > 50 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            return (
              <path
                key={index}
                d={pathData}
                fill={segment.color}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        
        {/* Legend */}
        <div className="space-y-2 w-full">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-gray-700 dark:text-gray-300 truncate max-w-20" title={segment.name}>
                  {segment.name}
                </span>
              </div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {segment.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Least selling item - ensure it's different from top performers
  const leastSellingItem = useMemo(() => {
    const itemStats = new Map();
    
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.menuItem.id;
        const existing = itemStats.get(key);
        
        if (existing) {
          itemStats.set(key, {
            ...existing,
            count: existing.count + item.quantity
          });
        } else {
          itemStats.set(key, {
            name: item.menuItem.name,
            count: item.quantity
          });
        }
      });
    });
    
    const items = Array.from(itemStats.values());
    const topItemIds = new Set(topSellingItems.top3.map(item => item.name));
    
    // Filter out top performers to find true underperformers
    const underperformers = items.filter(item => !topItemIds.has(item.name));
    
    return underperformers.length > 0 ? 
      underperformers.sort((a, b) => a.count - b.count)[0] : 
      null;
  }, [filteredOrders, topSellingItems]);

  const maxWeeklyValue = Math.max(...weeklyData.map(d => chartView === 'count' ? d.count : d.revenue));

  // Helper function to determine if a week is the current week
  const isCurrentWeek = (weekStartDate: Date) => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(weekStartDate);
    weekStart.setHours(0, 0, 0, 0);
    
    return weekStart.getTime() === currentWeekStart.getTime();
  };

  const getWeekLabel = () => {
    // Calculate the actual week start date for the current offset
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const targetWeekStart = new Date(startDate);
    targetWeekStart.setDate(startDate.getDate() + (weekOffset * 7));
    
    // Check if this week is the current week
    if (isCurrentWeek(targetWeekStart)) {
      return 'Current Week';
    }
    
    // For other weeks, calculate relative position
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const weeksDiff = Math.round((targetWeekStart.getTime() - currentWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    if (weeksDiff === -1) return 'Previous Week';
    if (weeksDiff === 1) return 'Next Week';
    if (weeksDiff < 0) return `${Math.abs(weeksDiff)} Weeks Ago`;
    if (weeksDiff > 0) return `${weeksDiff} Weeks Ahead`;
    
    return 'Current Week'; // Fallback
  };

  const getSelectedMonthLabel = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getSelectedStoreLabel = () => {
    return selectedOutlets[0] === 'All Stores' ? 'all stores' : selectedOutlets[0];
  };

  // Empty state for months with no data
  if (hasNoData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Global Filters */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Business insights and analytics</p>
          </div>
          
          {/* Global Filters */}
          <div className="flex items-center space-x-3">
            {/* Outlet Selector */}
            <div className="min-w-[140px]">
              <Dropdown
                value={selectedOutlets[0]}
                onChange={(value) => setSelectedOutlets([value])}
                options={outlets}
                icon={<Store className="h-4 w-4 text-gray-400" />}
              />
            </div>

            {/* Month Selector */}
            <div className="min-w-[160px]">
              <Dropdown
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={monthOptions.map(opt => opt.value)}
                optionLabels={monthOptions.reduce((acc, opt) => ({ ...acc, [opt.value]: opt.label }), {})}
                icon={<Calendar className="h-4 w-4 text-gray-400" />}
              />
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                <FileX className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Data Available</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No orders found for <strong>{getSelectedMonthLabel()}</strong> at <strong>{getSelectedStoreLabel()}</strong>. 
              Try selecting a different month or store, or check back when orders are placed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  const now = new Date();
                  setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Current Month
              </button>
              <button
                onClick={() => setSelectedOutlets(['All Stores'])}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                View All Stores
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Global Filters */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Business insights and analytics</p>
        </div>
        
        {/* Global Filters */}
        <div className="flex items-center space-x-3">
          {/* Outlet Selector */}
          <div className="min-w-[140px]">
            <Dropdown
              value={selectedOutlets[0]}
              onChange={(value) => setSelectedOutlets([value])}
              options={outlets}
              icon={<Store className="h-4 w-4 text-gray-400" />}
            />
          </div>

          {/* Month Selector */}
          <div className="min-w-[160px]">
            <Dropdown
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={monthOptions.map(opt => opt.value)}
              optionLabels={monthOptions.reduce((acc, opt) => ({ ...acc, [opt.value]: opt.label }), {})}
              icon={<Calendar className="h-4 w-4 text-gray-400" />}
            />
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 dark:bg-green-900/50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Orders/Day</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.avgOrdersPerDay.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/50 rounded-lg">
              <IndianRupee className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{metrics.totalRevenue.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/50 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{metrics.avgOrderValue.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphs & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Week-wise Orders Vertical Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Week-wise Orders</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setChartView('count')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  chartView === 'count' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/70'
                }`}
              >
                Count
              </button>
              <button
                onClick={() => setChartView('revenue')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  chartView === 'revenue' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/70'
                }`}
              >
                Revenue
              </button>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-center mb-6">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="mx-4 font-medium text-gray-900 dark:text-white">{getWeekLabel()}</span>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Vertical Bar Chart */}
          <div className="flex items-end justify-between h-64 px-2">
            {weeklyData.map((day, index) => {
              const value = chartView === 'count' ? day.count : day.revenue;
              const percentage = maxWeeklyValue > 0 ? (value / maxWeeklyValue) * 100 : 0;
              const height = Math.max(percentage * 2, value > 0 ? 8 : 0); // Minimum height for visibility
              
              return (
                <div key={index} className="flex flex-col items-center flex-1 mx-1">
                  {/* Bar */}
                  <div className="relative flex flex-col justify-end w-full" style={{ height: '200px' }}>
                    <div
                      className="bg-blue-500 rounded-t-lg transition-all duration-300 relative group cursor-pointer hover:bg-blue-600 w-full"
                      style={{ height: `${height}px` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {chartView === 'count' ? `${day.count} orders` : `₹${day.revenue.toFixed(0)}`}
                      </div>
                      
                      {/* Value label on bar */}
                      {value > 0 && (
                        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white">
                          {chartView === 'count' ? day.count : `₹${day.revenue.toFixed(0)}`}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Day label */}
                  <div className="mt-3 text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{day.date}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{day.day}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time-Slot Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Time-Slot Distribution</h3>
          
          <div className="space-y-4">
            {metrics.timeSlotCounts.map((slot, index) => {
              const totalOrders = metrics.totalOrders;
              const percentage = totalOrders > 0 ? (slot.count / totalOrders) * 100 : 0;
              const isPeakSlot = metrics.peakSlot && slot.label === metrics.peakSlot;
              
              return (
                <div key={index} className="group cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{slot.icon}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{slot.label}</span>
                      {isPeakSlot && (
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Peak</span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-3 relative">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        isPeakSlot 
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                          : 'bg-gradient-to-r from-purple-400 to-purple-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {slot.count} orders
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bestsellers & Underperformers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top-Selling Items with Pie Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
            Top-Selling Items
          </h3>
          
          {topSellingItems.top3.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No sales data available</p>
            </div>
          ) : (
            <div className="flex gap-6">
              {/* Cards Section - 70% */}
              <div className="flex-1" style={{ flexBasis: '70%' }}>
                <div className="space-y-4">
                  {topSellingItems.top3.map((item, index) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div key={index} className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-2xl mr-4">{medals[index]}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{item.name}</h4>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Count:</span> {item.count}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Revenue:</span> ₹{item.revenue.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pie Chart Section - 30% */}
              <div className="flex-shrink-0" style={{ flexBasis: '30%' }}>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-full">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">Market Share</h4>
                  <PieChart data={topSellingItems} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Least-Selling Item */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <TrendingDown className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
            Underperformer
          </h3>
          
          {!leastSellingItem ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No underperformer data</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">All items performing well</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="p-4 bg-red-50 dark:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{leastSellingItem.name}</h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{leastSellingItem.count}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">units sold</p>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  💡 Consider promotional strategies or menu optimization
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;