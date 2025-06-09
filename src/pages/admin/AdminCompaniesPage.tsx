import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building, 
  Search, 
  Filter, 
  User, 
  Calendar, 
  ShieldCheck, 
  ShieldX, 
  ExternalLink,
  EyeIcon,
  FileText,
  Check,
  X,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { uk } from "date-fns/locale";
import { useAuth } from "../../context/AuthContext";
import { adminAPI } from "../../api/apiClient";
import { 
  Button, 
  Input, 
  Select, 
  Alert, 
  Badge, 
  Modal, 
  Pagination,
  Card,
  Tabs,
  Tab,
  Loader,
  TextArea
} from "../../components/common";

// Типи для компаній
interface Company {
  id: number;
  userId: number;
  companyName: string;
  companyCode: string; // ЄДРПОУ
  vatNumber?: string; // ІПН
  website?: string;
  industry?: string;
  foundedYear?: number;
  size: "SMALL" | "MEDIUM" | "LARGE";
  description?: string;
  logoUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  address: {
    country: string;
    region?: string;
    city: string;
    street?: string;
    postalCode?: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    additionalPhone?: string;
  };
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
  pendingDocumentsCount: number;
}

interface CompanyListResponse {
  companies: Company[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

// Інтерфейс для параметрів фільтрації та сортування
interface CompanyListParams {
  [key: string]: unknown;
  page: number;
  size: number;
  search?: string;
  isVerified?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  hasPendingDocuments?: boolean;
}

// Типи для документів компанії
interface CompanyDocument {
  id: number;
  companyId: number;
  name: string;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationComment?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

const AdminCompaniesPage: React.FC = () => {
  // Стани для списку компаній та пагінації
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  
  // Стани для фільтрації та пошуку
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pendingDocumentsFilter, setPendingDocumentsFilter] = useState<boolean>(false);
  
  // Стани для модальних вікон та детальної інформації
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyDocuments, setCompanyDocuments] = useState<CompanyDocument[]>([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState<boolean>(false);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [activeTab, setActiveTab] = useState<number>(0);
  
  // Стани для завантаження та помилок
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Ефект для затримки пошуку (debounce)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);
  
  // Основний ефект для завантаження компаній
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Підготовка параметрів запиту
        const params: CompanyListParams = {
          page: currentPage,
          size: 10,
          sortBy: sortField,
          sortOrder: sortOrder,
        };
        
        // Додавання фільтрів, якщо вони вказані
        if (debouncedSearchTerm) {
          params.search = debouncedSearchTerm;
        }
        
        if (verificationFilter !== "all") {
          params.isVerified = verificationFilter === "verified";
        }
        
        if (pendingDocumentsFilter) {
          params.hasPendingDocuments = true;
        }
        
        // Запит до API
        const response = await adminAPI.getCompanies(params);
        const data: CompanyListResponse = response.data;
        
        setCompanies(data.companies);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setTotalItems(data.totalItems);
      } catch (err: any) {
        console.error("Error fetching companies:", err);
        setError("Помилка при завантаженні списку компаній. Спробуйте знову пізніше.");
      } finally {
        setLoading(false);
      }
    };
    
    // Перевіряємо, чи користувач має роль адміністратора
    if (user && user.role === "ADMIN") {
      fetchCompanies();
    } else if (user && user.role !== "ADMIN") {
      setError("Ви не маєте доступу до цієї сторінки.");
      setLoading(false);
    }
  }, [
    user, 
    currentPage, 
    debouncedSearchTerm, 
    verificationFilter, 
    sortField, 
    sortOrder,
    pendingDocumentsFilter
  ]);
  
  // Завантаження документів компанії
  const fetchCompanyDocuments = async (companyId: number) => {
    try {
      setActionLoading(true);
      const response = await adminAPI.getCompanyDocuments(companyId);
      setCompanyDocuments(response.data);
    } catch (err: any) {
      console.error("Error fetching company documents:", err);
      setError("Помилка при завантаженні документів компанії.");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Обробник для відкриття деталей компанії
  const handleViewCompanyDetails = (company: Company) => {
    setSelectedCompany(company);
    setDetailsModalOpen(true);
    fetchCompanyDocuments(company.id);
  };
  
  // Обробник для зміни сторінки
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Обробник для зміни пошукового запиту
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Обробник для зміни фільтра верифікації
  const handleVerificationFilterChange = (value: string) => {
    setVerificationFilter(value);
    setCurrentPage(1); // Скидаємо сторінку при зміні фільтра
  };
  
  // Обробник для зміни фільтра документів, що очікують перевірки
  const handlePendingDocumentsFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingDocumentsFilter(e.target.checked);
    setCurrentPage(1); // Скидаємо сторінку при зміні фільтра
  };
  
  // Обробник для зміни сортування
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      // Якщо поле вже вибране, змінюємо порядок сортування
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Якщо вибрано нове поле, встановлюємо його з порядком за замовчуванням
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Скидаємо сторінку при зміні сортування
  };
  
  // Обробник для відкриття модального вікна верифікації
  const handleOpenVerifyModal = (company: Company) => {
    setSelectedCompany(company);
    setVerifyModalOpen(true);
  };
  
  // Обробник для відкриття модального вікна відхилення
  const handleOpenRejectModal = (company: Company) => {
    setSelectedCompany(company);
    setRejectReason("");
    setRejectModalOpen(true);
  };
  
  // Обробник для верифікації компанії
  const handleVerifyCompany = async () => {
    if (!selectedCompany) return;
    
    try {
      setActionLoading(true);
      await adminAPI.verifyCompany(selectedCompany.id);
      
      // Оновлюємо список компаній
      setCompanies(prevCompanies => 
        prevCompanies.map(company => 
          company.id === selectedCompany.id 
            ? { ...company, isVerified: true } 
            : company
        )
      );
      
      // Закриваємо модальне вікно
      setVerifyModalOpen(false);
      setSelectedCompany(null);
    } catch (err: any) {
      console.error("Error verifying company:", err);
      setError("Помилка при верифікації компанії. Спробуйте знову пізніше.");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Обробник для відхилення компанії
  const handleRejectCompany = async () => {
    if (!selectedCompany || !rejectReason.trim()) return;
    
    try {
      setActionLoading(true);
      await adminAPI.rejectCompany(selectedCompany.id, { reason: rejectReason });
      
      // Оновлюємо список компаній
      setCompanies(prevCompanies => 
        prevCompanies.map(company => 
          company.id === selectedCompany.id 
            ? { ...company, isVerified: false } 
            : company
        )
      );
      
      // Закриваємо модальне вікно
      setRejectModalOpen(false);
      setSelectedCompany(null);
      setRejectReason("");
    } catch (err: any) {
      console.error("Error rejecting company:", err);
      setError("Помилка при відхиленні компанії. Спробуйте знову пізніше.");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Функція форматування дати
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Не вказано";
    try {
      return format(parseISO(dateString), "d MMMM yyyy", { locale: uk });
    } catch (error) {
      return "Невірний формат дати";
    }
  };
  
  // Функція для визначення розміру компанії
  const getCompanySize = (size: string) => {
    switch (size) {
      case "SMALL": return "Малий бізнес";
      case "MEDIUM": return "Середній бізнес";
      case "LARGE": return "Великий бізнес";
      default: return "Не вказано";
    }
  };
  
  // Функція для отримання типу документа
  const getDocumentTypeLabel = (type: string) => {
    const documentTypes: Record<string, string> = {
      "REGISTRATION_CERTIFICATE": "Свідоцтво про реєстрацію",
      "TAX_CERTIFICATE": "Свідоцтво платника податків",
      "BANK_STATEMENT": "Банківські реквізити",
      "LICENSE": "Ліцензія/Дозвіл",
      "COMPANY_CHARTER": "Статут компанії",
      "FINANCIAL_STATEMENT": "Фінансова звітність",
      "POWER_OF_ATTORNEY": "Довіреність",
      "OTHER": "Інший документ"
    };
    
    return documentTypes[type] || "Інший документ";
  };
  
  // Функція для відображення статусу верифікації документа
  const getDocumentStatus = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge color="green" icon={<Check size={14} />}>Підтверджено</Badge>;
      case "REJECTED":
        return <Badge color="red" icon={<X size={14} />}>Відхилено</Badge>;
      case "PENDING":
      default:
        return <Badge color="yellow" icon={<AlertTriangle size={14} />}>Очікує перевірки</Badge>;
    }
  };
  
  // Функція для відображення розміру файлу
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };
  
  // Обробник для верифікації документа
  const handleVerifyDocument = async (documentId: number) => {
    if (!selectedCompany) return;
    
    try {
      setActionLoading(true);
      await adminAPI.verifyDocument(selectedCompany.id, documentId);
      
      // Оновлюємо список документів
      await fetchCompanyDocuments(selectedCompany.id);
    } catch (err: any) {
      console.error("Error verifying document:", err);
      setError("Помилка при верифікації документа. Спробуйте знову пізніше.");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Обробник для відхилення документа
  const handleRejectDocument = async (documentId: number, reason: string) => {
    if (!selectedCompany || !reason.trim()) return;
    
    try {
      setActionLoading(true);
      await adminAPI.rejectDocument(selectedCompany.id, documentId, { reason });
      
      // Оновлюємо список документів
      await fetchCompanyDocuments(selectedCompany.id);
    } catch (err: any) {
      console.error("Error rejecting document:", err);
      setError("Помилка при відхиленні документа. Спробуйте знову пізніше.");
    } finally {
      setActionLoading(false);
    }
  };
  
  // JSX для відображення під час завантаження
  if (loading && companies.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center py-12">
            <Loader size="large" />
            <p className="text-gray-600 mt-4">Завантаження списку компаній...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // JSX для відображення помилки доступу
  if (error && user?.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Alert type="error" message={error} className="mb-4" />
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Доступ заборонено</h2>
            <p className="text-gray-600 mb-6">
              Ця сторінка доступна тільки для адміністраторів системи.
            </p>
            <Button 
              variant="primary" 
              onClick={() => navigate("/")}
            >
              Повернутися на головну
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок сторінки */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Управління компаніями</h1>
          <p className="text-gray-600">
            Перегляд, верифікація та управління компаніями в системі
          </p>
        </div>
        
        {/* Помилка, якщо є */}
        {error && <Alert type="error" message={error} className="mb-6" />}
        
        {/* Панель фільтрів та пошуку */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="w-full md:w-1/3">
                <Input
                  type="text"
                  placeholder="Пошук за назвою, ЄДРПОУ, email..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  icon={<Search size={20} className="text-gray-400" />}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-auto">
                  <Select
                    value={verificationFilter}
                    onChange={handleVerificationFilterChange}
                    options={[
                      { value: "all", label: "Усі компанії" },
                      { value: "verified", label: "Верифіковані" },
                      { value: "unverified", label: "Неверифіковані" },
                    ]}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pendingDocuments"
                    checked={pendingDocumentsFilter}
                    onChange={handlePendingDocumentsFilterChange}
                    className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <label htmlFor="pendingDocuments" className="ml-2 text-sm text-gray-700">
                    Документи на перевірці
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Таблиця компаній */}
        <Card className="mb-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange("companyName")}
                  >
                    <div className="flex items-center">
                      <span>Назва компанії</span>
                      {sortField === "companyName" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    ЄДРПОУ
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Контакти
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange("createdAt")}
                  >
                    <div className="flex items-center">
                      <span>Дата реєстрації</span>
                      {sortField === "createdAt" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Статус
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.length > 0 ? (
                  companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {company.logoUrl ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={company.logoUrl}
                                alt={company.companyName}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <Building className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {company.companyName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {company.industry || "Галузь не вказана"}
                            </div>
                          </div>
                          {company.pendingDocumentsCount > 0 && (
                            <div className="ml-2">
                              <Badge color="yellow" size="small">
                                {company.pendingDocumentsCount} док.
                              </Badge>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{company.companyCode}</div>
                        {company.vatNumber && (
                          <div className="text-xs text-gray-500">ІПН: {company.vatNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{company.contactInfo.email}</div>
                        <div className="text-sm text-gray-500">{company.contactInfo.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(company.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {company.isVerified ? (
                          <Badge color="green" icon={<ShieldCheck size={14} />}>
                            Верифікована
                          </Badge>
                        ) : (
                          <Badge color="gray" icon={<ShieldX size={14} />}>
                            Не верифікована
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="outline"
                          size="small"
                          icon={<EyeIcon size={14} />}
                          onClick={() => handleViewCompanyDetails(company)}
                          className="mr-2"
                        >
                          Деталі
                        </Button>
                        
                        {!company.isVerified && (
                          <Button
                            variant="success"
                            size="small"
                            onClick={() => handleOpenVerifyModal(company)}
                          >
                            Верифікувати
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {loading ? (
                        <div className="flex justify-center items-center py-4">
                          <RefreshCw className="animate-spin h-5 w-5 mr-2 text-gray-500" />
                          <span>Завантаження...</span>
                        </div>
                      ) : (
                        "Компанії не знайдено"
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        
        {/* Пагінація */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
        
        {/* Статистика */}
        <div className="mt-4 text-sm text-gray-600 text-center">
          Показано {companies.length} компаній з {totalItems}
        </div>
        
        {/* Модальне вікно з деталями компанії */}
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="Деталі компанії"
          size="lg"
        >
          {selectedCompany && (
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="md:w-1/3">
                  <div className="flex justify-center">
                    {selectedCompany.logoUrl ? (
                      <img
                        src={selectedCompany.logoUrl}
                        alt={selectedCompany.companyName}
                        className="w-40 h-40 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Building className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 text-center">
                    {selectedCompany.isVerified ? (
                      <Badge color="green" icon={<ShieldCheck size={14} />} size="large">
                        Верифікована компанія
                      </Badge>
                    ) : (
                      <Badge color="gray" icon={<ShieldX size={14} />} size="large">
                        Не верифікована
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      size="small"
                      icon={<ExternalLink size={14} />}
                      onClick={() => window.open(`/companies/${selectedCompany.id}`, "_blank")}
                    >
                      Відкрити публічний профіль
                    </Button>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCompany.companyName}</h2>
                  
                  {selectedCompany.description && (
                    <p className="text-gray-600 mb-4">{selectedCompany.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">ЄДРПОУ:</p>
                      <p className="text-gray-900">{selectedCompany.companyCode}</p>
                    </div>
                    
                    {selectedCompany.vatNumber && (
                      <div>
                        <p className="text-sm text-gray-500">ІПН:</p>
                        <p className="text-gray-900">{selectedCompany.vatNumber}</p>
                      </div>
                    )}
                    
                    {selectedCompany.industry && (
                      <div>
                        <p className="text-sm text-gray-500">Галузь:</p>
                        <p className="text-gray-900">{selectedCompany.industry}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-500">Розмір компанії:</p>
                      <p className="text-gray-900">{getCompanySize(selectedCompany.size)}</p>
                    </div>
                    
                    {selectedCompany.foundedYear && (
                      <div>
                        <p className="text-sm text-gray-500">Рік заснування:</p>
                        <p className="text-gray-900">{selectedCompany.foundedYear}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-500">Адреса:</p>
                      <p className="text-gray-900">
                        {[
                          selectedCompany.address.street,
                          selectedCompany.address.city,
                          selectedCompany.address.region,
                          selectedCompany.address.country,
                          selectedCompany.address.postalCode
                        ].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">Контактна інформація</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                    <div>
                      <p className="text-sm text-gray-500">Email:</p>
                      <p className="text-gray-900">{selectedCompany.contactInfo.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Телефон:</p>
                      <p className="text-gray-900">{selectedCompany.contactInfo.phone}</p>
                    </div>
                    
                    {selectedCompany.contactInfo.additionalPhone && (
                      <div>
                        <p className="text-sm text-gray-500">Додатковий телефон:</p>
                        <p className="text-gray-900">{selectedCompany.contactInfo.additionalPhone}</p>
                      </div>
                    )}
                    
                    {selectedCompany.website && (
                      <div>
                        <p className="text-sm text-gray-500">Веб-сайт:</p>
                        <a 
                          href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline"
                        >
                          {selectedCompany.website}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">Інформація про користувача</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                    <div>
                      <p className="text-sm text-gray-500">Користувач:</p>
                      <p className="text-gray-900">
                        {selectedCompany.user.firstName} {selectedCompany.user.lastName}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Email користувача:</p>
                      <p className="text-gray-900">{selectedCompany.user.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Статус користувача:</p>
                      <p className="text-gray-900">
                        {selectedCompany.user.isActive ? (
                          <Badge color="green">Активний</Badge>
                        ) : (
                          <Badge color="red">Неактивний</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <p className="text-sm text-gray-500">Дата реєстрації:</p>
                    <p className="text-gray-900">{formatDate(selectedCompany.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              {/* Вкладки з документами та іншою інформацією */}
              <Tabs activeTab={activeTab} onChange={setActiveTab}>
                <Tab title="Документи">
                  {actionLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader />
                      <p className="ml-2 text-gray-600">Завантаження документів...</p>
                    </div>
                  ) : (
                    <div>
                      {companyDocuments.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Назва документа
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Тип
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Дата завантаження
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Статус
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Дії
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {companyDocuments.map((document) => (
                                <tr key={document.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <FileText size={16} className="text-gray-500 mr-2" />
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {document.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {formatFileSize(document.fileSize)}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {getDocumentTypeLabel(document.type)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(document.createdAt)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {getDocumentStatus(document.verificationStatus)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Button
                                      variant="outline"
                                      size="small"
                                      onClick={() => window.open(document.fileUrl, "_blank")}
                                      className="mr-2"
                                    >
                                      Перегляд
                                    </Button>
                                    
                                    {document.verificationStatus === "PENDING" && (
                                      <>
                                        <Button
                                          variant="success"
                                          size="small"
                                          onClick={() => handleVerifyDocument(document.id)}
                                          className="mr-2"
                                          disabled={actionLoading}
                                        >
                                          Підтвердити
                                        </Button>
                                        
                                        <Button
                                          variant="danger"
                                          size="small"
                                          onClick={() => {
                                            const reason = prompt("Вкажіть причину відхилення:");
                                            if (reason) {
                                              handleRejectDocument(document.id, reason);
                                            }
                                          }}
                                          disabled={actionLoading}
                                        >
                                          Відхилити
                                        </Button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Немає документів</h3>
                          <p className="text-gray-600 max-w-md mx-auto">
                            Ця компанія ще не завантажила жодного документа для верифікації.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Tab>
                
                <Tab title="Історія змін">
                  <div className="text-center py-8">
                    <RefreshCw className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Історія змін</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Функціональність перегляду історії змін ще в розробці.
                    </p>
                  </div>
                </Tab>
              </Tabs>
              
              {/* Кнопки дій для компанії */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row justify-between">
                <Button
                  variant="outline"
                  onClick={() => setDetailsModalOpen(false)}
                >
                  Закрити
                </Button>
                
                <div className="space-x-2 mb-2 sm:mb-0">
                  {!selectedCompany.isVerified ? (
                    <>
                      <Button
                        variant="danger"
                        onClick={() => {
                          setDetailsModalOpen(false);
                          handleOpenRejectModal(selectedCompany);
                        }}
                      >
                        Відхилити верифікацію
                      </Button>
                      
                      <Button
                        variant="success"
                        onClick={() => {
                          setDetailsModalOpen(false);
                          handleOpenVerifyModal(selectedCompany);
                        }}
                      >
                        Верифікувати компанію
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="danger"
                      onClick={() => {
                        setDetailsModalOpen(false);
                        handleOpenRejectModal(selectedCompany);
                      }}
                    >
                      Скасувати верифікацію
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
        
        {/* Модальне вікно для верифікації компанії */}
        <Modal
          isOpen={verifyModalOpen}
          onClose={() => !actionLoading && setVerifyModalOpen(false)}
          title="Верифікація компанії"
        >
          {selectedCompany && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <ShieldCheck size={24} className="text-green-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Верифікувати компанію?
                  </h3>
                </div>
                
                <p className="text-gray-600 mb-2">
                  Ви збираєтесь верифікувати компанію <strong>{selectedCompany.companyName}</strong>.
                </p>
                <p className="text-gray-600">
                  Верифікована компанія отримає доступ до всіх функцій платформи. Це дія означає, що:
                </p>
                <ul className="list-disc pl-5 mt-2 text-gray-600 space-y-1">
                  <li>Ви перевірили документи компанії та підтверджуєте їх достовірність</li>
                  <li>Компанія отримає спеціальну відмітку &quot;Верифіковано&quot; у профілі</li>
                  <li>Компанія отримає доступ до додаткових функцій платформи</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVerifyModalOpen(false)}
                  disabled={actionLoading}
                >
                  Скасувати
                </Button>
                <Button
                  type="button"
                  variant="success"
                  onClick={handleVerifyCompany}
                  loading={actionLoading}
                >
                  {actionLoading ? "Верифікація..." : "Підтвердити верифікацію"}
                </Button>
              </div>
            </div>
          )}
        </Modal>
        
        {/* Модальне вікно для відхилення верифікації компанії */}
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => !actionLoading && setRejectModalOpen(false)}
          title="Відхилення верифікації"
        >
          {selectedCompany && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <ShieldX size={24} className="text-red-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedCompany.isVerified 
                      ? "Скасувати верифікацію компанії?" 
                      : "Відхилити верифікацію компанії?"}
                  </h3>
                </div>
                
                <p className="text-gray-600 mb-4">
                  {selectedCompany.isVerified 
                    ? `Ви збираєтесь скасувати верифікацію компанії "${selectedCompany.companyName}".` 
                    : `Ви збираєтесь відхилити верифікацію компанії "${selectedCompany.companyName}".`}
                </p>
                
                <div className="mb-4">
                  <label htmlFor="rejectReason" className="block text-gray-700 font-medium mb-2">
                    Причина відхилення *
                  </label>
                  <TextArea
                    id="rejectReason"
                    name="rejectReason"
                    placeholder="Вкажіть причину відхилення верифікації"
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    error={rejectReason.trim() === "" ? "Вкажіть причину відхилення" : ""}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ця інформація буде надіслана компанії для виправлення проблем.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={actionLoading}
                >
                  Скасувати
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleRejectCompany}
                  loading={actionLoading}
                  disabled={rejectReason.trim() === ""}
                >
                  {actionLoading ? "Відхилення..." : "Відхилити верифікацію"}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default AdminCompaniesPage;