import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Calendar,
  ShieldCheck,
  ShieldX,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Eye
} from "lucide-react";
import { 
  Card, 
  Input, 
  Button, 
  Select, 
  Badge, 
  Tabs, 
  Tab, 
  Pagination, 
  Loader,
  Alert,
  Dropdown,
  DropdownItem,
  DateRangePicker
} from "../../components/common";
import { adminAPI } from "../../api/apiClient";
import { formatDate } from "../../utils/formatters";
import { Company } from "../../types/company";
import EmptyState from "../../components/common/EmptyState";

/**
 * Інтерфейс для параметрів фільтрації компаній
 */
interface FilterParams {
  status: "ALL" | "PENDING" | "VERIFIED" | "REJECTED";
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  sortBy: "DATE_ASC" | "DATE_DESC" | "NAME_ASC" | "NAME_DESC";
}

/**
 * Інтерфейс для відповіді API із списком компаній
 */
interface CompaniesResponse {
  companies: Company[];
  totalCount: number;
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
}

/**
 * Компонент сторінки верифікації компаній для адміністратора
 */
const AdminCompanyVerificationPage: React.FC = () => {
  // Стан для списків компаній
  const [pendingCompanies, setPendingCompanies] = useState<Company[]>([]);
  const [verifiedCompanies, setVerifiedCompanies] = useState<Company[]>([]);
  const [rejectedCompanies, setRejectedCompanies] = useState<Company[]>([]);
  
  // Стан для пагінації
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Стан для статистики
  const [pendingCount, setPendingCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  
  // Стан для фільтрів
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<FilterParams>({
    status: "PENDING",
    dateRange: { from: null, to: null },
    sortBy: "DATE_DESC"
  });
  
  // Стан для пошуку
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Стан для завантаження даних
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  const navigate = useNavigate();

  // Ефект для дебаунсу пошукового запиту
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Ефект для завантаження даних при зміні параметрів
  useEffect(() => {
    fetchCompanies();
  }, [page, pageSize, debouncedSearchQuery, filters, activeTab]);

  // Оновлення статусу фільтрації при зміні активної вкладки
  useEffect(() => {
    let newStatus: FilterParams["status"] = "ALL";
    
    if (activeTab === 0) newStatus = "PENDING";
    else if (activeTab === 1) newStatus = "VERIFIED";
    else if (activeTab === 2) newStatus = "REJECTED";
    
    setFilters(prev => ({ ...prev, status: newStatus }));
    setPage(1); // Скидаємо сторінку при зміні вкладки
  }, [activeTab]);

  /**
   * Функція для завантаження компаній з API
   */
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        pageSize,
        status: filters.status,
        sortBy: filters.sortBy
      };
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (filters.dateRange.from) params.fromDate = filters.dateRange.from.toISOString();
      if (filters.dateRange.to) params.toDate = filters.dateRange.to.toISOString();

      const response = await adminAPI.getCompaniesForVerification(params);
      
      const data: CompaniesResponse = response.data;
      
      // Оновлюємо списки компаній в залежності від активної вкладки
      if (filters.status === "PENDING") {
        setPendingCompanies(data.companies);
      } else if (filters.status === "VERIFIED") {
        setVerifiedCompanies(data.companies);
      } else if (filters.status === "REJECTED") {
        setRejectedCompanies(data.companies);
      }
      
      // Оновлюємо лічильники
      setTotalItems(data.totalCount);
      setPendingCount(data.pendingCount);
      setVerifiedCount(data.verifiedCount);
      setRejectedCount(data.rejectedCount);
      
    } catch (err: any) {
      console.error("Error fetching companies:", err);
      setError("Помилка завантаження списку компаній. Спробуйте знову пізніше.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обробник для переходу на сторінку деталей компанії
   */
  const handleViewCompany = (companyId: number) => {
    navigate(`/admin/companies/${companyId}`);
  };

  /**
   * Обробник для оновлення даних
   */
  const handleRefresh = () => {
    fetchCompanies();
  };

  /**
   * Обробник для зміни параметрів сортування
   */
  const handleSortChange = (sortBy: FilterParams["sortBy"]) => {
    setFilters(prev => ({ ...prev, sortBy }));
    setPage(1);
  };

  /**
   * Обробник для зміни діапазону дат
   */
  const handleDateRangeChange = (dateRange: { from: Date | null; to: Date | null }) => {
    setFilters(prev => ({ ...prev, dateRange }));
    setPage(1);
  };

  /**
   * Обробник для скидання всіх фільтрів
   */
  const handleResetFilters = () => {
    setFilters({
      status: activeTab === 0 ? "PENDING" : activeTab === 1 ? "VERIFIED" : "REJECTED",
      dateRange: { from: null, to: null },
      sortBy: "DATE_DESC"
    });
    setSearchQuery("");
    setPage(1);
  };

  /**
   * Функція для рендерингу списку компаній
   */
  const renderCompanyList = (companies: Company[]) => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="mt-4">
          <Alert 
            type="error" 
            message={error} 
            className="mb-2" 
          />
          <Button 
            variant="outline" 
            size="small" 
            onClick={handleRefresh}
            icon={<RefreshCw size={14} />}
          >
            Спробувати знову
          </Button>
        </div>
      );
    }

    if (companies.length === 0) {
      return (
        <EmptyState 
          icon={<FileText size={48} className="text-gray-400" />}
          title="Немає компаній"
          description={
            debouncedSearchQuery 
              ? "За вашим запитом не знайдено жодної компанії. Спробуйте змінити параметри пошуку."
              : activeTab === 0 
                ? "Немає компаній, які очікують на верифікацію."
                : activeTab === 1 
                  ? "Немає верифікованих компаній."
                  : "Немає відхилених компаній."
          }
          action={
            debouncedSearchQuery && (
              <Button 
                variant="outline" 
                onClick={handleResetFilters}
              >
                Скинути фільтри
              </Button>
            )
          }
        />
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Компанія
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ЄДРПОУ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Контакти
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата реєстрації
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Документи
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt={company.companyName} className="h-10 w-10 rounded-full mr-3" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <span className="text-gray-500 font-medium">
                            {company.companyName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {company.companyName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {company.user?.firstName} {company.user?.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.companyCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.contactInfo.email}</div>
                    <div className="text-sm text-gray-500">{company.contactInfo.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(company.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Badge color="blue">{company.documentsCount || 0} документів</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {company.isVerified ? (
                      <Badge color="green" icon={<ShieldCheck size={14} />}>Верифікована</Badge>
                    ) : company.rejectionReason ? (
                      <Badge color="red" icon={<ShieldX size={14} />}>Відхилено</Badge>
                    ) : (
                      <Badge color="yellow">Очікує перевірки</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="outline"
                      size="small"
                      icon={<Eye size={14} />}
                      onClick={() => handleViewCompany(company.id)}
                    >
                      Переглянути
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalItems / pageSize)}
            onPageChange={setPage}
          />
        </div>
      </>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Верифікація компаній</h1>
          <p className="text-gray-600 mt-1">
            Перегляд та верифікація компаній, зареєстрованих на платформі
          </p>
        </div>

        <Card className="mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Пошук за назвою компанії, ЄДРПОУ або іменем власника"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search size={18} />}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  icon={<Filter size={18} />}
                  onClick={() => setFiltersVisible(!filtersVisible)}
                >
                  Фільтри {filtersVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
                <Button
                  variant="outline"
                  icon={<RefreshCw size={18} />}
                  onClick={handleRefresh}
                >
                  Оновити
                </Button>
              </div>
            </div>

            {filtersVisible && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Дата реєстрації
                    </label>
                    <DateRangePicker
                      value={filters.dateRange}
                      onChange={handleDateRangeChange}
                      placeholderText="Виберіть діапазон дат"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Сортування
                    </label>
                    <Select
                      value={filters.sortBy}
                      onChange={(value) => handleSortChange(value as FilterParams["sortBy"])}
                      options={[
                        { value: "DATE_DESC", label: "Спочатку нові" },
                        { value: "DATE_ASC", label: "Спочатку старі" },
                        { value: "NAME_ASC", label: "За назвою (А-Я)" },
                        { value: "NAME_DESC", label: "За назвою (Я-А)" }
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={handleResetFilters}
                  >
                    Скинути фільтри
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-between items-center mb-6">
              <Tabs activeTab={activeTab} onChange={setActiveTab} variant="boxed">
                <Tab title={`Очікують перевірки (${pendingCount})`}>{null}</Tab>
                <Tab title={`Верифіковані (${verifiedCount})`}>{null}</Tab>
                <Tab title={`Відхилені (${rejectedCount})`}>{null}</Tab>
              </Tabs>
            </div>

            {activeTab === 0 && renderCompanyList(pendingCompanies)}
            {activeTab === 1 && renderCompanyList(verifiedCompanies)}
            {activeTab === 2 && renderCompanyList(rejectedCompanies)}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminCompanyVerificationPage;