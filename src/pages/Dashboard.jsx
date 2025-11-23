import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../services/api';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowUpCircle, ArrowDownCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = { month: selectedMonth, year: selectedYear };
      
      const [summaryRes, categoryRes, trendRes, recentRes] = await Promise.allSettled([
        dashboardAPI.getSummary(params),
        dashboardAPI.getByCategory({ ...params, type: 'expense' }),
        dashboardAPI.getMonthlyTrend({ year: selectedYear }),
        dashboardAPI.getRecentTransactions({ limit: 5 })
      ]);

      // จัดการ summary
      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.data || { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 });
      }

      // จัดการ category
      if (categoryRes.status === 'fulfilled') {
        setCategoryData(categoryRes.value.data?.categories || []);
      }

      // จัดการ trend
      if (trendRes.status === 'fulfilled') {
        setMonthlyTrend(trendRes.value.data?.months || []);
      }

      // จัดการ recent transactions
      if (recentRes.status === 'fulfilled') {
        setRecentTransactions(recentRes.value.data?.transactions || []);
      }

      // ตรวจสอบว่ามี request ไหน fail หรือไม่
      const failedRequests = [summaryRes, categoryRes, trendRes, recentRes].filter(r => r.status === 'rejected');
      if (failedRequests.length > 0) {
        console.warn('Some requests failed:', failedRequests);
        setError('บางส่วนของข้อมูลโหลดไม่สำเร็จ');
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError(error.message || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // Error state with retry
  if (error && !summary.totalIncome && !summary.totalExpense) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500 flex items-center space-x-2">
          <AlertCircle size={24} />
          <span>{error}</span>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={20} />
          <span>ลองอีกครั้ง</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">ภาพรวมการเงินของคุณ</p>
        </div>
        
        {/* Month/Year Selector */}
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleDateString('th-TH', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={2020 + i} value={2020 + i}>
                {2020 + i + 543}
              </option>
            ))}
          </select>
          <button
            onClick={loadDashboardData}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Warning message if partial error */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-yellow-800 font-medium">คำเตือน</p>
            <p className="text-yellow-700 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="text-yellow-600 hover:text-yellow-700"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">รายรับทั้งหมด</p>
              <h3 className="text-3xl font-bold mt-2">{formatCurrency(summary.totalIncome)}</h3>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <ArrowUpCircle size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">รายจ่ายทั้งหมด</p>
              <h3 className="text-3xl font-bold mt-2">{formatCurrency(summary.totalExpense)}</h3>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <ArrowDownCircle size={32} />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${summary.balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-gray-500 to-gray-600'} rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">ยอดคงเหลือ</p>
              <h3 className="text-3xl font-bold mt-2">{formatCurrency(summary.balance)}</h3>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <Wallet size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - รายจ่ายตามหมวดหมู่ */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">รายจ่ายตามหมวดหมู่</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <p>ยังไม่มีข้อมูลรายจ่าย</p>
                <button
                  onClick={() => navigate('/transactions')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  เพิ่มรายการแรก
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Line Chart - แนวโน้มรายเดือน */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">แนวโน้มรายรับ-รายจ่าย</h3>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" name="รายรับ" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" name="รายจ่าย" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              ยังไม่มีข้อมูลแนวโน้ม
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">รายการล่าสุด</h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ดูทั้งหมด →
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{transaction.category?.icon || '📝'}</div>
                  <div>
                    <p className="font-medium text-gray-800">{transaction.category?.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                    {transaction.description && (
                      <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                    )}
                  </div>
                </div>
                <div className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>ยังไม่มีรายการ</p>
            <button
              onClick={() => navigate('/transactions')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              เพิ่มรายการแรก
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">สรุปรายการ</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-600">จำนวนรายการ</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{summary.transactionCount}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-sm text-gray-600">รายรับเฉลี่ย/วัน</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(Math.round(summary.totalIncome / 30))}
            </p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <p className="text-sm text-gray-600">รายจ่ายเฉลี่ย/วัน</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatCurrency(Math.round(summary.totalExpense / 30))}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <p className="text-sm text-gray-600">อัตราการออม</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {summary.totalIncome > 0 ? Math.round((summary.balance / summary.totalIncome) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}