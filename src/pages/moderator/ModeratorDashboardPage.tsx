import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  CheckCircle, 
  FileText, 
  ShoppingBag, 
  Building2, 
  AlertTriangle, 
  Clock, 
  Shield, 
  TrendingUp 
} from "lucide-react";
import { Card, Loader, Alert } from "../../components/common";
import { useAuth } from "../../context/AuthContext";
import { moderatorAPI } from "../../api/apiClient";

interface ModeratorStats {
  pendingListings: number;
  approvedListings: number;
  rejectedListings: number;
  pendingCompanies: number;
  verifiedCompanies: number;
  pendingDocuments: number;
  reportedListings: number;
  todayReviewed: number;
}

/**
 * Сторінка дашборду модератора з основною статистикою та швидким доступом до функцій
 */
const ModeratorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ModeratorStats>({
    pendingListings: 0,
    approvedListings: 0,
    rejectedListings: 0,
    pendingCompanies: 0,
    verifiedCompanies: 0,
    pendingDocuments: 0,
    reportedListings: 0,
    todayReviewed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Отримання статистики при першому завантаженні
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await moderatorAPI.getDashboardStats();
        setStats(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching moderator stats:", err);
        setError("Не вдалося завантажити статистику. Спробуйте пізніше.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Масив функціональних блоків для дашборду
  const dashboardCards = [
    {
      title: "Модерація оголошень",
      description: "Перегляд та модерація нових та існуючих оголошень",
      icon: <ShoppingBag size={36} className="text-blue-600" />,
      link: "/moderator/listings",
      stats: [
        { label: "Очікують перевірки", value: stats.pendingListings },
        { label: "Підтверджені", value: stats.approvedListings },
        { label: "Відхилені", value: stats.rejectedListings },
      ],
      priority: stats.pendingListings > 0,
    },
    {
      title: "Верифікація компаній",
      description: "Перевірка та верифікація нових компаній на платформі",
      icon: <Building2 size={36} className="text-green-600" />,
      link: "/moderator/verification",
      stats: [
        { label: "Очікують верифікації", value: stats.pendingCompanies },
        { label: "Верифіковані", value: stats.verifiedCompanies },
      ],
      priority: stats.pendingCompanies > 0,
    },
    {
      title: "Документи компаній",
      description: "Перевірка документів, завантажених компаніями",
      icon: <FileText size={36} className="text-purple-600" />,
      link: "/moderator/documents",
      stats: [
        { label: "Очікують перевірки", value: stats.pendingDocuments },
      ],
      priority: stats.pendingDocuments > 0,
    },
    {
      title: "Скарги на оголошення",
      description: "Розгляд скарг користувачів на оголошення",
      icon: <AlertTriangle size={36} className="text-amber-600" />,
      link: "/moderator/reports",
      stats: [
        { label: "Потребують уваги", value: stats.reportedListings },
      ],
      priority: stats.reportedListings > 0,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Панель модератора</h1>
            <p className="text-gray-600 mt-1">
              Огляд та управління контентом платформи
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
            <Shield size={20} />
            <span className="font-medium">Модератор</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="large" />
          </div>
        ) : error ? (
          <Alert type="error" message={error} className="mb-6" />
        ) : (
          <>
            {/* Статистика роботи */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Очікують модерації</p>
                      <h3 className="text-2xl font-bold text-blue-900 mt-1">
                        {stats.pendingListings + stats.pendingCompanies + stats.pendingDocuments}
                      </h3>
                    </div>
                    <div className="bg-blue-200 rounded-full p-3">
                      <Clock size={24} className="text-blue-700" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">Розглянуто сьогодні</p>
                      <h3 className="text-2xl font-bold text-green-900 mt-1">
                        {stats.todayReviewed}
                      </h3>
                    </div>
                    <div className="bg-green-200 rounded-full p-3">
                      <CheckCircle size={24} className="text-green-700" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-700 font-medium">Скарги</p>
                      <h3 className="text-2xl font-bold text-amber-900 mt-1">
                        {stats.reportedListings}
                      </h3>
                    </div>
                    <div className="bg-amber-200 rounded-full p-3">
                      <AlertTriangle size={24} className="text-amber-700" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700 font-medium">Загальна активність</p>
                      <h3 className="text-2xl font-bold text-purple-900 mt-1">
                        {stats.pendingListings > 0 || stats.pendingCompanies > 0
                          ? "Висока"
                          : "Нормальна"}
                      </h3>
                    </div>
                    <div className="bg-purple-200 rounded-full p-3">
                      <TrendingUp size={24} className="text-purple-700" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Картки швидкого доступу до функцій модератора */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {/* Спочатку відображаємо картки з високим пріоритетом */}
              {dashboardCards
                .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))
                .map((card, index) => (
                  <Link to={card.link} key={index} className="block hover:no-underline">
                    <Card 
                      className={`h-full transition-transform transform hover:scale-[1.01] hover:shadow-md ${
                        card.priority ? "border-l-4 border-l-blue-500" : ""
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 rounded-lg bg-gray-50">{card.icon}</div>
                          {card.priority && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                              Потребує уваги
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {card.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{card.description}</p>

                        {card.stats.length > 0 && (
                          <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                            {card.stats.map((stat, statIndex) => (
                              <div
                                key={statIndex}
                                className="flex items-center justify-between"
                              >
                                <span className="text-gray-500 text-sm">{stat.label}:</span>
                                <span className={`font-semibold ${
                                  stat.value > 0 && ["Очікують", "Потребують"].some(
                                    s => stat.label.includes(s)
                                  )
                                    ? "text-blue-600"
                                    : "text-gray-900"
                                }`}>
                                  {stat.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
            </div>

            {/* Інформація про модератора */}
            <Card className="mt-8">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Інформація про модератора</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32">Ім&apos;я:</span>
                    <span className="font-medium">{user?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32">Email:</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32">Статус:</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Активний
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ModeratorDashboardPage;