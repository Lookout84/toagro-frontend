import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Building, 
  FileText, 
  Settings, 
  AlertTriangle, 
  Check, 
  ChevronRight, 
  BarChart2, 
  Briefcase,
  PlusCircle,
  Clock,
  ShieldCheck,
  Users
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { companiesAPI } from "../../api/apiClient";
import { Button, Alert } from "../../components/common";

// Типи для компанії та її статус
type VerificationStatus = "pending" | "verified" | "rejected" | "not_submitted";
type CompanySize = "SMALL" | "MEDIUM" | "LARGE";

interface CompanyProfile {
  id: number;
  userId: number;
  companyName: string;
  companyCode: string;
  vatNumber?: string;
  website?: string;
  industry?: string;
  foundedYear?: number;
  size: CompanySize;
  description?: string;
  logoUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  documentsCount: number;
  verifiedDocumentsCount: number;
}

const CompanyDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("not_submitted");
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        const response = await companiesAPI.getMyCompany();
        setCompany(response.data);
        
        // Визначаємо статус верифікації компанії
        if (response.data.isVerified) {
          setVerificationStatus("verified");
        } else if (response.data.documentsCount > 0) {
          setVerificationStatus("pending");
        } else {
          setVerificationStatus("not_submitted");
        }
        
        // Завантажуємо статистику компанії, якщо вона верифікована
        if (response.data.isVerified) {
          fetchCompanyStats(response.data.id);
        }
      } catch (err: any) {
        console.error("Error fetching company data:", err);
        
        // Перевіряємо, чи компанія взагалі існує
        if (err.response && err.response.status === 404) {
          setError("Профіль компанії не знайдено. Будь ласка, створіть його.");
        } else {
          setError("Помилка при завантаженні даних компанії. Спробуйте знову пізніше.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.role === "COMPANY") {
      fetchCompanyData();
    } else {
      setError("Для доступу до цієї сторінки потрібно мати роль компанії");
    }
  }, [user]);
  
  const fetchCompanyStats = async (companyId: number) => {
    try {
      setStatsLoading(true);
      // Це буде ваш API-запит для отримання статистики компанії
      // Наразі заглушка з прикладом статистики
      // const response = await someAPI.getCompanyStats(companyId);
      // setStats(response.data);
      
      // Приклад даних статистики
      setTimeout(() => {
        setStats({
          listingsCount: 12,
          viewsTotal: 560,
          contactsReceived: 23,
          activeListings: 8,
          pendingListings: 2,
          completedDeals: 5,
          popularCategories: ["Трактори", "Комбайни", "Запчастини"],
          weeklyViews: {
            Mon: 12,
            Tue: 18,
            Wed: 24,
            Thu: 16,
            Fri: 22,
            Sat: 10,
            Sun: 8
          }
        });
        setStatsLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Error fetching company stats:", err);
      setStatsLoading(false);
    }
  };
  
  // Для відображення статусу верифікації компанії
  const renderVerificationBadge = () => {
    switch (verificationStatus) {
      case "verified":
        return (
          <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
            <ShieldCheck size={16} className="mr-1" />
            <span className="text-sm font-medium">Верифіковано</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
            <Clock size={16} className="mr-1" />
            <span className="text-sm font-medium">Очікує верифікації</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full">
            <AlertTriangle size={16} className="mr-1" />
            <span className="text-sm font-medium">Відхилено</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
            <AlertTriangle size={16} className="mr-1" />
            <span className="text-sm font-medium">Не верифіковано</span>
          </div>
        );
    }
  };
  
  // Для відображення розміру компанії
  const renderCompanySize = (size: CompanySize) => {
    switch (size) {
      case "SMALL":
        return "Малий бізнес";
      case "MEDIUM":
        return "Середній бізнес";
      case "LARGE":
        return "Великий бізнес";
      default:
        return "Не вказано";
    }
  };

  // Компонент статистики
  const StatsCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ 
    title, value, icon 
  }) => {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className="p-2 bg-green-100 rounded-full text-green-600">
            {icon}
          </div>
        </div>
      </div>
    );
  };
  
  // Якщо йде завантаження 
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Завантаження інформації про компанію...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Якщо виникла помилка
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Alert type="error" message={error} className="mb-4" />
          
          {/* Якщо компанія не знайдена, пропонуємо створити її */}
          {error.includes("не знайдено") && (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Створіть профіль компанії</h2>
              <p className="text-gray-600 mb-6">
                Щоб почати користуватися всіма можливостями платформи для компаній, 
                потрібно створити та верифікувати профіль вашої компанії.
              </p>
              <Button 
                variant="primary" 
                onClick={() => navigate("/company/setup")}
              >
                Створити профіль компанії
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Заголовок сторінки та верифікація */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Кабінет компанії</h1>
            {renderVerificationBadge()}
          </div>
          <p className="text-gray-600">
            Управління профілем та діяльністю вашої компанії
          </p>
        </div>

        {/* Картка компанії */}
        {company && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="flex-shrink-0 mr-6 mb-4 md:mb-0">
                  {company.logoUrl ? (
                    <img 
                      src={company.logoUrl} 
                      alt={company.companyName} 
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Building className="text-gray-400" size={40} />
                    </div>
                  )}
                </div>
                
                <div className="flex-grow">
                  <h2 className="text-2xl font-bold text-gray-900">{company.companyName}</h2>
                  
                  <div className="flex flex-col sm:flex-row sm:flex-wrap mt-2">
                    {company.industry && (
                      <div className="flex items-center text-gray-500 mr-6 mb-2">
                        <Briefcase size={16} className="mr-1" />
                        <span className="text-sm">{company.industry}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-gray-500 mr-6 mb-2">
                      <FileText size={16} className="mr-1" />
                      <span className="text-sm">ЄДРПОУ: {company.companyCode}</span>
                    </div>
                    
                    {company.size && (
                      <div className="flex items-center text-gray-500 mr-6 mb-2">
                        <Users size={16} className="mr-1" />
                        <span className="text-sm">{renderCompanySize(company.size)}</span>
                      </div>
                    )}
                    
                    {company.website && (
                      <div className="flex items-center text-gray-500 mb-2">
                        <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                          <span className="mr-1">Веб-сайт</span>
                          <ChevronRight size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {company.description && (
                    <p className="text-gray-600 mt-2 max-w-prose">
                      {company.description.length > 150 
                        ? `${company.description.substring(0, 150)}...` 
                        : company.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row mt-6 space-y-3 sm:space-y-0 sm:space-x-3">
                <Button
                  variant="outline"
                  icon={<Settings size={16} />}
                  onClick={() => navigate("/company/edit")}
                >
                  Редагувати профіль
                </Button>
                
                <Button
                  variant="outline"
                  icon={<FileText size={16} />}
                  onClick={() => navigate("/company/documents")}
                >
                  Документи
                  {company.verifiedDocumentsCount < company.documentsCount && (
                    <span className="ml-1 bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full">
                      {company.verifiedDocumentsCount}/{company.documentsCount}
                    </span>
                  )}
                </Button>
                
                <Button
                  variant="primary"
                  icon={<PlusCircle size={16} />}
                  onClick={() => navigate("/listings/create")}
                >
                  Створити оголошення
                </Button>
              </div>
              
              {/* Попередження, якщо компанія не верифікована */}
              {!company.isVerified && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Ваша компанія потребує верифікації
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Для доступу до всіх функцій платформи необхідно пройти верифікацію компанії. 
                          {verificationStatus === "not_submitted" ? (
                            <> Будь ласка, завантажте необхідні документи.</>
                          ) : (
                            <> Ваші документи очікують перевірки адміністратором.</>
                          )}
                        </p>
                      </div>
                      {verificationStatus === "not_submitted" && (
                        <div className="mt-4">
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => navigate("/company/documents")}
                          >
                            Завантажити документи
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Кроки верифікації, якщо не верифіковано */}
            {!company.isVerified && (
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Кроки для верифікації компанії:</h3>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-8">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center
                      ${verificationStatus !== "not_submitted" ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      {verificationStatus !== "not_submitted" ? (
                        <Check size={12} className="text-white" />
                      ) : (
                        <span className="text-white text-xs">1</span>
                      )}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">Завантажити документи</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center
                      ${verificationStatus === "verified" ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      {verificationStatus === "verified" ? (
                        <Check size={12} className="text-white" />
                      ) : (
                        <span className="text-white text-xs">2</span>
                      )}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">Перевірка адміністратором</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center
                      ${verificationStatus === "verified" ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      {verificationStatus === "verified" ? (
                        <Check size={12} className="text-white" />
                      ) : (
                        <span className="text-white text-xs">3</span>
                      )}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">Отримання статусу верифікації</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Статистика та активність компанії (показуємо тільки для верифікованих компаній) */}
        {company && company.isVerified && (
          <>
            {/* Заголовок секції статистики */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Статистика та активність</h2>
              <Link 
                to="/profile/listings" 
                className="text-sm font-medium text-green-600 hover:text-green-800 flex items-center"
              >
                Управління оголошеннями
                <ChevronRight size={16} />
              </Link>
            </div>
            
            {/* Картки статистики */}
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-7 bg-gray-200 rounded w-1/3"></div>
                    <div className="mt-4 flex justify-end">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard 
                  title="Активні оголошення" 
                  value={stats.activeListings} 
                  icon={<FileText size={20} />} 
                />
                <StatsCard 
                  title="Перегляди" 
                  value={stats.viewsTotal} 
                  icon={<BarChart2 size={20} />} 
                />
                <StatsCard 
                  title="Отримані контакти" 
                  value={stats.contactsReceived} 
                  icon={<Users size={20} />} 
                />
                <StatsCard 
                  title="Успішні угоди" 
                  value={stats.completedDeals} 
                  icon={<Check size={20} />} 
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Немає доступних даних статистики</p>
              </div>
            )}
            
            {/* Швидкі дії */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Швидкі дії</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/listings/create" className="bg-white rounded-lg shadow p-5 hover:bg-gray-50 transition duration-150 ease-in-out">
                  <PlusCircle size={24} className="text-green-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">Створити оголошення</h3>
                  <p className="text-sm text-gray-500">Розмістіть нове оголошення про продаж техніки чи послуг</p>
                </Link>
                <Link to="/company/profile" className="bg-white rounded-lg shadow p-5 hover:bg-gray-50 transition duration-150 ease-in-out">
                  <Building size={24} className="text-green-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">Перегляд профілю</h3>
                  <p className="text-sm text-gray-500">Перегляньте публічний профіль вашої компанії</p>
                </Link>
                <Link to="/chat" className="bg-white rounded-lg shadow p-5 hover:bg-gray-50 transition duration-150 ease-in-out">
                  <Users size={24} className="text-green-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">Повідомлення</h3>
                  <p className="text-sm text-gray-500">Спілкуйтеся з клієнтами та іншими компаніями</p>
                </Link>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default CompanyDashboardPage;