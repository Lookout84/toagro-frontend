import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchDashboardStats } from "../../store/adminSlice";
import { Link } from "react-router-dom";
import {
  Users,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Bell,
  Calendar,
  Tag,
  Settings,
  Clock,
  Activity
} from "lucide-react";
import Loader from "../../components/common/Loader";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const AdminDashboardPage = () => {
  const dispatch = useAppDispatch();
  const { dashboardStats, isLoading, error } = useAppSelector((state) => state.admin);

  // Завантаження статистики при першому рендері
  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (isLoading && !dashboardStats) {
    return <Loader />;
  }

  // Форматування суми
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Адміністративна панель</h1>
        <div className="flex space-x-2">
          <Link to="/admin/system-health" className="flex items-center text-gray-600 px-3 py-1 rounded-md hover:bg-gray-100">
            <Activity size={16} className="mr-1" />
            <span>Стан системи</span>
          </Link>
          <Link to="/admin/settings" className="flex items-center text-gray-600 px-3 py-1 rounded-md hover:bg-gray-100">
            <Settings size={16} className="mr-1" />
            <span>Налаштування</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {dashboardStats && (
        <>
          {/* Блоки зі статистикою */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Користувачі</h3>
                <span className="p-2 bg-blue-100 rounded-full text-blue-600">
                  <Users size={20} />
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalUsers}</p>
                <p className="text-green-600 text-sm">
                  +{dashboardStats.newUsersToday} сьогодні
                </p>
              </div>
              <div className="mt-4">
                <Link to="/admin/users" className="text-sm text-blue-600">
                  Показати всіх користувачів &rarr;
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Оголошення</h3>
                <span className="p-2 bg-green-100 rounded-full text-green-600">
                  <ShoppingBag size={20} />
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalListings}</p>
                <p className="text-green-600 text-sm">
                  +{dashboardStats.newListingsToday} сьогодні
                </p>
              </div>
              <div className="mt-4">
                <Link to="/admin/listings" className="text-sm text-blue-600">
                  Показати всі оголошення &rarr;
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Транзакції</h3>
                <span className="p-2 bg-purple-100 rounded-full text-purple-600">
                  <CreditCard size={20} />
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalTransactions}</p>
              </div>
              <div className="mt-4">
                <Link to="/admin/payments" className="text-sm text-blue-600">
                  Переглянути всі транзакції &rarr;
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Дохід</h3>
                <span className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                  <TrendingUp size={20} />
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(dashboardStats.totalRevenue)}</p>
                <p className="text-green-600 text-sm">
                  +{formatCurrency(dashboardStats.revenueToday)} сьогодні
                </p>
              </div>
              <div className="mt-4">
                <Link to="/admin/reports" className="text-sm text-blue-600">
                  Дивитися звіти &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Графіки */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Графік зростання користувачів */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-gray-700 font-medium mb-6">Зростання користувачів</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dashboardStats.userGrowth.labels.map((label, index) => ({
                      name: label,
                      value: dashboardStats.userGrowth.data[index]
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#4F46E5"
                      activeDot={{ r: 8 }}
                      name="Нові користувачі"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Графік зростання оголошень */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-gray-700 font-medium mb-6">Нові оголошення</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardStats.listingGrowth.labels.map((label, index) => ({
                      name: label,
                      value: dashboardStats.listingGrowth.data[index]
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#16A34A" name="Нові оголошення" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Графік доходу */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-gray-700 font-medium mb-6">Дохід</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dashboardStats.revenueGrowth.labels.map((label, index) => ({
                      name: label,
                      value: dashboardStats.revenueGrowth.data[index]
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Дохід"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#FBBF24"
                      activeDot={{ r: 8 }}
                      name="Дохід"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Швидкі посилання */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-gray-700 font-medium mb-6">Швидкі дії</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/admin/campaigns/create"
                  className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex flex-col items-center text-center transition-colors"
                >
                  <Bell size={24} className="text-blue-500 mb-2" />
                  <span className="text-gray-700 font-medium">Створити кампанію</span>
                </Link>
                
                <Link
                  to="/admin/categories"
                  className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex flex-col items-center text-center transition-colors"
                >
                  <Tag size={24} className="text-green-500 mb-2" />
                  <span className="text-gray-700 font-medium">Керувати категоріями</span>
                </Link>
                
                <Link
                  to="/admin/scheduled-tasks"
                  className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex flex-col items-center text-center transition-colors"
                >
                  <Clock size={24} className="text-purple-500 mb-2" />
                  <span className="text-gray-700 font-medium">Заплановані завдання</span>
                </Link>
                
                <Link
                  to="/admin/notifications/templates"
                  className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex flex-col items-center text-center transition-colors"
                >
                  <Bell size={24} className="text-yellow-500 mb-2" />
                  <span className="text-gray-700 font-medium">Шаблони сповіщень</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Нижній ряд статистики */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Заплановані завдання */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-700 font-medium">Заплановані завдання</h3>
                <Link to="/admin/scheduled-tasks" className="text-blue-600 text-sm">
                  Переглянути всі
                </Link>
              </div>
              
              {/* Тут буде компонент для відображення запланованих завдань */}
              <div className="space-y-2">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Calendar size={18} className="text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Деактивація оголошень</p>
                    <p className="text-xs text-gray-500">Сьогодні, 23:00</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Заплановано
                  </span>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Bell size={18} className="text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Щотижневий дайджест</p>
                    <p className="text-xs text-gray-500">Завтра, 09:00</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Заплановано
                  </span>
                </div>
              </div>
            </div>

            {/* Активні кампанії */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-700 font-medium">Активні кампанії</h3>
                <Link to="/admin/campaigns" className="text-blue-600 text-sm">
                  Переглянути всі
                </Link>
              </div>
              
              {/* Тут буде компонент для відображення активних кампаній */}
              <div className="space-y-2">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Bell size={18} className="text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Літня знижка</p>
                    <p className="text-xs text-gray-500">До 31.08.2023</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    Активна
                  </span>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Bell size={18} className="text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Оновлення платформи</p>
                    <p className="text-xs text-gray-500">Триваюча кампанія</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    Активна
                  </span>
                </div>
              </div>
            </div>

            {/* Нещодавні платежі */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-700 font-medium">Останні транзакції</h3>
                <Link to="/admin/payments" className="text-blue-600 text-sm">
                  Переглянути всі
                </Link>
              </div>
              
              {/* Тут буде компонент для відображення останніх транзакцій */}
              <div className="space-y-2">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <CreditCard size={18} className="text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Платіж за оголошення</p>
                    <p className="text-xs text-gray-500">2 години тому</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(1500)}
                  </span>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <CreditCard size={18} className="text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Платіж за рекламу</p>
                    <p className="text-xs text-gray-500">5 годин тому</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(2500)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;