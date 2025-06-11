import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  FileText,
  MapPin,
  Phone,
  Mail,
  Globe,
  Info,
  Calendar,
} from "lucide-react";
import {
  Card,
  Input,
  Button,
  Select,
  Tabs,
  Tab,
  Badge,
  Pagination,
  Loader,
  Alert,
  DateRangePicker,
  EmptyState,
  Modal,
  TextArea,
  Table,
} from "../../components/common";
import { moderatorAPI } from "../../api/apiClient";
import { formatDate } from "../../utils/formatters";
import { useToast } from "../../hooks/useToast";

// Статуси верифікації компаній
enum CompanyVerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  ALL = "ALL",
}

// Параметри фільтрації компаній
interface FilterParams {
  status: CompanyVerificationStatus;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  sortBy: "DATE_DESC" | "DATE_ASC" | "NAME_ASC" | "NAME_DESC";
  categoryId?: number;
}

// Тип документа
interface Document {
  id: number;
  name: string;
  fileName: string;
  url: string;
  mimeType: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  uploadedAt: string;
  verifiedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

// Інтерфейс компанії
interface Company {
  id: number;
  name: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  foundedYear?: number;
  employeeCount?: number;
  status: CompanyVerificationStatus;
  categoryId?: number;
  categoryName?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  documents: Document[];
}

/**
 * Сторінка модератора для верифікації компаній
 */
const ModeratorVerificationPage: React.FC = () => {
  // Стани для відображення компаній
  const [pendingCompanies, setPendingCompanies] = useState<Company[]>([]);
  const [verifiedCompanies, setVerifiedCompanies] = useState<Company[]>([]);
  const [rejectedCompanies, setRejectedCompanies] = useState<Company[]>([]);
  
  // Стани для пагінації
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Стани для лічильників
  const [pendingCount, setPendingCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  
  // Стани для фільтрів
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<FilterParams>({
    status: CompanyVerificationStatus.PENDING,
    dateRange: { from: null, to: null },
    sortBy: "DATE_DESC"
  });
  
  // Стани для пошуку
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Стани для відображення
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Стани для модальних вікон
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedPresetReason, setSelectedPresetReason] = useState("");
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  
  // Хук для відображення повідомлень
  const { showToast } = useToast();

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
    let newStatus: CompanyVerificationStatus = CompanyVerificationStatus.ALL;
    
    if (activeTab === 0) newStatus = CompanyVerificationStatus.PENDING;
    else if (activeTab === 1) newStatus = CompanyVerificationStatus.VERIFIED;
    else if (activeTab === 2) newStatus = CompanyVerificationStatus.REJECTED;
    
    setFilters(prev => ({ ...prev, status: newStatus }));
    setPage(1); // Скидаємо сторінку при зміні вкладки
  }, [activeTab]);

  /**
   * Завантаження компаній з API
   */
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await moderatorAPI.getCompanies({
        page,
        pageSize,
        search: debouncedSearchQuery,
        status: filters.status,
        fromDate: filters.dateRange.from ? filters.dateRange.from.toISOString() : undefined,
        toDate: filters.dateRange.to ? filters.dateRange.to.toISOString() : undefined,
        sortBy: filters.sortBy,
        categoryId: filters.categoryId
      });
      
      const data = response.data;
      
      // Оновлюємо списки компаній в залежності від активної вкладки
      if (filters.status === CompanyVerificationStatus.PENDING) {
        setPendingCompanies(data.companies);
      } else if (filters.status === CompanyVerificationStatus.VERIFIED) {
        setVerifiedCompanies(data.companies);
      } else if (filters.status === CompanyVerificationStatus.REJECTED) {
        setRejectedCompanies(data.companies);
      }
      
      // Оновлюємо лічильники
      setTotalItems(data.totalCount);
      setPendingCount(data.pendingCount);
      setVerifiedCount(data.verifiedCount);
      setRejectedCount(data.rejectedCount);
      
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError("Помилка завантаження списку компаній. Спробуйте знову пізніше.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Підтвердження компанії
   */
  const handleVerifyCompany = async (id: number) => {
    try {
      await moderatorAPI.verifyCompany(id);
      showToast({
        type: "success",
        title: "Успішно!",
        message: "Компанію успішно верифіковано.",
      });
      fetchCompanies(); // Оновлюємо список
    } catch (err) {
      console.error("Error verifying company:", err);
      showToast({
        type: "error",
        title: "Помилка!",
        message: "Не вдалося верифікувати компанію.",
      });
    }
  };

  /**
   * Відхилення компанії
   */
  const handleRejectCompany = async () => {
    if (!selectedCompany) return;
    
    try {
      const reason = rejectReason || selectedPresetReason;
      await moderatorAPI.rejectCompany(selectedCompany.id, reason);
      setRejectModalOpen(false);
      setRejectReason("");
      setSelectedPresetReason("");
      showToast({
        type: "success",
        title: "Успішно!",
        message: "Компанію відхилено.",
      });
      fetchCompanies(); // Оновлюємо список
    } catch (err) {
      console.error("Error rejecting company:", err);
      showToast({
        type: "error",
        title: "Помилка!",
        message: "Не вдалося відхилити компанію.",
      });
    }
  };

  /**
   * Верифікація документа
   */
  const handleVerifyDocument = async (companyId: number, documentId: number) => {
    try {
      await moderatorAPI.verifyDocument(documentId);
      showToast({
        type: "success",
        title: "Успішно!",
        message: "Документ верифіковано.",
      });
      
      // Оновлюємо деталі компанії, якщо відкрите модальне вікно
      if (selectedCompany && selectedCompany.id === companyId) {
        const updatedCompany = {
          ...selectedCompany,
          documents: selectedCompany.documents.map(doc => 
            doc.id === documentId ? { ...doc, status: "VERIFIED" as const } : doc
          )
        };
        setSelectedCompany(updatedCompany);
      }
      
      fetchCompanies(); // Оновлюємо список компаній
    } catch (err) {
      console.error("Error verifying document:", err);
      showToast({
        type: "error",
        title: "Помилка!",
        message: "Не вдалося верифікувати документ.",
      });
    }
  };

  /**
   * Відхилення документа
   */
  const handleRejectDocument = async (companyId: number, documentId: number, reason: string) => {
    try {
      await moderatorAPI.rejectDocument(documentId, reason);
      showToast({
        type: "success",
        title: "Успішно!",
        message: "Документ відхилено.",
      });
      
      // Оновлюємо деталі компанії, якщо відкрите модальне вікно
      if (selectedCompany && selectedCompany.id === companyId) {
        const updatedCompany = {
          ...selectedCompany,
          documents: selectedCompany.documents.map(doc => 
            doc.id === documentId ? { ...doc, status: "REJECTED" as const, rejectionReason: reason } : doc
          )
        };
        setSelectedCompany(updatedCompany);
      }
      
      fetchCompanies(); // Оновлюємо список компаній
    } catch (err) {
      console.error("Error rejecting document:", err);
      showToast({
        type: "error",
        title: "Помилка!",
        message: "Не вдалося відхилити документ.",
      });
    }
  };

  /**
   * Показ модального вікна для відхилення
   */
  const showRejectModal = (company: Company) => {
    setSelectedCompany(company);
    setRejectModalOpen(true);
  };

  /**
   * Показ модального вікна для перегляду
   */
  const showPreviewModal = (company: Company) => {
    setSelectedCompany(company);
    setPreviewModalOpen(true);
  };

  /**
   * Оновлення даних
   */
  const handleRefresh = () => {
    fetchCompanies();
  };

  /**
   * Зміна параметрів сортування
   */
  const handleSortChange = (sortBy: FilterParams["sortBy"]) => {
    setFilters(prev => ({ ...prev, sortBy }));
    setPage(1);
  };

  /**
   * Зміна діапазону дат
   */
  const handleDateRangeChange = (dateRange: { from: Date | null; to: Date | null }) => {
    setFilters(prev => ({ ...prev, dateRange }));
    setPage(1);
  };

  /**
   * Скидання всіх фільтрів
   */
  const handleResetFilters = () => {
    setFilters({
      status: activeTab === 0 ? CompanyVerificationStatus.PENDING :
              activeTab === 1 ? CompanyVerificationStatus.VERIFIED :
              CompanyVerificationStatus.REJECTED,
      dateRange: { from: null, to: null },
      sortBy: "DATE_DESC"
    });
    setSearchQuery("");
    setPage(1);
  };

  /**
   * Функція для отримання бейджу статусу компанії
   */
  const getStatusBadge = (status: CompanyVerificationStatus) => {
    switch (status) {
      case CompanyVerificationStatus.PENDING:
        return <Badge color="yellow" icon={<Clock size={14} />}>Очікує</Badge>;
      case CompanyVerificationStatus.VERIFIED:
        return <Badge color="green" icon={<CheckCircle size={14} />}>Верифіковано</Badge>;
      case CompanyVerificationStatus.REJECTED:
        return <Badge color="red" icon={<XCircle size={14} />}>Відхилено</Badge>;
      default:
        return <Badge color="gray">Невідомо</Badge>;
    }
  };

  /**
   * Функція для отримання бейджу статусу документа
   */
  const getDocumentStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "PENDING":
        return <Badge color="yellow" icon={<Clock size={14} />}>Очікує</Badge>;
      case "VERIFIED":
        return <Badge color="green" icon={<CheckCircle size={14} />}>Верифіковано</Badge>;
      case "REJECTED":
        return <Badge color="red" icon={<XCircle size={14} />}>Відхилено</Badge>;
      default:
        return <Badge color="gray">Невідомо</Badge>;
    }
  };

  /**
   * Функція для отримання списку компаній залежно від вкладки
   */
  const getActiveCompanies = () => {
    switch (activeTab) {
      case 0: return pendingCompanies;
      case 1: return verifiedCompanies;
      case 2: return rejectedCompanies;
      default: return [];
    }
  };

  /**
   * Функція для отримання заголовка пустого стану
   */
  const getEmptyStateTitle = () => {
    switch (activeTab) {
      case 0: return "Немає компаній, які очікують верифікації";
      case 1: return "Немає верифікованих компаній";
      case 2: return "Немає відхилених компаній";
      default: return "Немає компаній";
    }
  };

  /**
   * Функція для перегляду документа
   */
  const previewDocument = (url: string) => {
    setDocumentPreviewUrl(url);
    setDocumentPreviewOpen(true);
  };

  /**
   * Рендеринг списку компаній
   */
  const renderCompanies = () => {
    const companies = getActiveCompanies();
    
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
          icon={<Building2 size={48} className="text-gray-400" />}
          title={debouncedSearchQuery ? "Нічого не знайдено" : getEmptyStateTitle()}
          description={
            debouncedSearchQuery 
              ? "За вашим запитом не знайдено жодної компанії. Спробуйте змінити параметри пошуку."
              : "Наразі немає компаній для відображення в цій категорії."
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
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Компанія</Table.HeaderCell>
                <Table.HeaderCell>Категорія</Table.HeaderCell>
                <Table.HeaderCell>Контакти</Table.HeaderCell>
                <Table.HeaderCell>Документи</Table.HeaderCell>
                <Table.HeaderCell>Дата реєстрації</Table.HeaderCell>
                <Table.HeaderCell>Статус</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Дії</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {companies.map((company) => (
                <Table.Row key={company.id} hover>
                  <Table.Cell>
                    <div className="flex items-center">
                      {company.logoUrl ? (
                        <img 
                          src={company.logoUrl} 
                          alt={company.name} 
                          className="h-10 w-10 rounded-md object-cover mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-200 mr-3 flex items-center justify-center text-gray-500">
                          <Building2 size={16} />
                        </div>
                      )}
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {company.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {company.city}, {company.region}
                        </div>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-gray-500">
                      {company.categoryName || "Не вказано"}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center">
                        <Mail size={14} className="text-gray-400 mr-1.5" />
                        <span className="text-gray-600">{company.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone size={14} className="text-gray-400 mr-1.5" />
                        <span className="text-gray-600">{company.phone}</span>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-sm">
                      <span className="text-gray-600">
                        {company.documents.length} {company.documents.length === 1 ? 'документ' : 
                        company.documents.length < 5 ? 'документи' : 'документів'}
                      </span>
                      <div className="flex mt-1 space-x-1">
                        {company.documents.filter(doc => doc.status === "PENDING").length > 0 && (
                          <Badge color="yellow" size="small">
                            {company.documents.filter(doc => doc.status === "PENDING").length} очікує
                          </Badge>
                        )}
                        {company.documents.filter(doc => doc.status === "VERIFIED").length > 0 && (
                          <Badge color="green" size="small">
                            {company.documents.filter(doc => doc.status === "VERIFIED").length} верифіковано
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-gray-500">
                      {formatDate(company.createdAt)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    {getStatusBadge(company.status)}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="small"
                        icon={<Eye size={14} />}
                        onClick={() => showPreviewModal(company)}
                      >
                        Переглянути
                      </Button>
                      
                      {company.status === CompanyVerificationStatus.PENDING && (
                        <>
                          <Button
                            variant="primary"
                            size="small"
                            icon={<CheckCircle size={14} />}
                            onClick={() => handleVerifyCompany(company.id)}
                          >
                            Верифікувати
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            icon={<XCircle size={14} />}
                            onClick={() => showRejectModal(company)}
                          >
                            Відхилити
                          </Button>
                        </>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
        
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalItems / pageSize)}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            pageSize={pageSize}
            totalItems={totalItems}
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
            Перевірка та верифікація компаній та їхніх документів
          </p>
        </div>

        <Card className="mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Пошук за назвою компанії або контактною інформацією"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        { value: "DATE_DESC", label: "За датою (нові спочатку)" },
                        { value: "DATE_ASC", label: "За датою (старі спочатку)" },
                        { value: "NAME_ASC", label: "За назвою (А-Я)" },
                        { value: "NAME_DESC", label: "За назвою (Я-А)" },
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
                <Tab title={`Очікують верифікації (${pendingCount})`}>{null}</Tab>
                <Tab title={`Верифіковані (${verifiedCount})`}>{null}</Tab>
                <Tab title={`Відхилені (${rejectedCount})`}>{null}</Tab>
              </Tabs>
            </div>

            {renderCompanies()}
          </div>
        </Card>
      </div>
      
      {/* Модальне вікно для відхилення компанії */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Відхилити компанію"
      >
        <div className="p-6">
          <p className="mb-4 text-gray-700">
            Вкажіть причину відхилення компанії. Ця інформація буде надіслана власнику.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Виберіть причину
            </label>
            <Select
              value={selectedPresetReason}
              onChange={(value) => setSelectedPresetReason(value)}
              options={[
                { value: "", label: "Оберіть причину або введіть власну" },
                { value: "Недостатня або неправильна інформація", label: "Недостатня або неправильна інформація" },
                { value: "Недостатньо документів для верифікації", label: "Недостатньо документів для верифікації" },
                { value: "Некоректні контактні дані", label: "Некоректні контактні дані" },
                { value: "Невідповідність вказаній категорії", label: "Невідповідність вказаній категорії" },
                { value: "Порушення правил платформи", label: "Порушення правил платформи" },
                { value: "Підозра на шахрайство", label: "Підозра на шахрайство" },
              ]}
              className="w-full"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Додаткові коментарі
            </label>
            <TextArea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={selectedPresetReason ? "Додайте деталі, якщо необхідно" : "Вкажіть причину відхилення..."}
              rows={4}
              className="w-full"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
            >
              Скасувати
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectCompany}
              disabled={!rejectReason && !selectedPresetReason}
            >
              Відхилити компанію
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Модальне вікно для перегляду компанії */}
      {selectedCompany && previewModalOpen && (
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          title={`Перегляд компанії: ${selectedCompany.name}`}
          size="lg"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {/* Логотип та обкладинка */}
                <div className="mb-6">
                  {selectedCompany.coverUrl && (
                    <div className="h-40 rounded-t-lg overflow-hidden mb-4">
                      <img
                        src={selectedCompany.coverUrl}
                        alt={`${selectedCompany.name} cover`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <div className="mr-4">
                      {selectedCompany.logoUrl ? (
                        <img
                          src={selectedCompany.logoUrl}
                          alt={selectedCompany.name}
                          className="w-16 h-16 rounded-md object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center">
                          <Building2 size={32} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedCompany.name}</h2>
                      {selectedCompany.categoryName && (
                        <p className="text-sm text-gray-500">{selectedCompany.categoryName}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Інформація про компанію */}
                <Card className="mb-6">
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Контактна інформація</h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <MapPin size={18} className="text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <span className="text-gray-700 block">
                            {selectedCompany.address}, {selectedCompany.city},
                          </span>
                          <span className="text-gray-700 block">
                            {selectedCompany.region}, {selectedCompany.postalCode}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Phone size={18} className="text-gray-400 mr-2" />
                        <span className="text-gray-700">{selectedCompany.phone}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Mail size={18} className="text-gray-400 mr-2" />
                        <span className="text-gray-700">{selectedCompany.email}</span>
                      </div>
                      
                      {selectedCompany.website && (
                        <div className="flex items-center">
                          <Globe size={18} className="text-gray-400 mr-2" />
                          <a 
                            href={selectedCompany.website.startsWith('http') 
                              ? selectedCompany.website 
                              : `https://${selectedCompany.website}`
                            } 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedCompany.website}
                          </a>
                        </div>
                      )}
                      
                      {selectedCompany.foundedYear && (
                        <div className="flex items-center">
                          <Calendar size={18} className="text-gray-400 mr-2" />
                          <span className="text-gray-700">
                            Рік заснування: {selectedCompany.foundedYear}
                          </span>
                        </div>
                      )}
                      
                      {selectedCompany.employeeCount && (
                        <div className="flex items-center">
                          <Info size={18} className="text-gray-400 mr-2" />
                          <span className="text-gray-700">
                            Кількість працівників: {selectedCompany.employeeCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
                
                {/* Інформація про власника */}
                <Card className="mb-6">
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Інформація про власника</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="text-gray-500 w-24">Ім&#39;я:</span>
                        <span className="text-gray-700 font-medium">{selectedCompany.ownerName}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 w-24">Email:</span>
                        <span className="text-gray-700">{selectedCompany.ownerEmail}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 w-24">ID:</span>
                        <span className="text-gray-700">{selectedCompany.ownerId}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              
              <div>
                {/* Опис компанії */}
                <Card className="mb-6">
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Опис компанії</h3>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                      <p className="text-gray-700 whitespace-pre-line">{selectedCompany.description}</p>
                    </div>
                  </div>
                </Card>
                
                {/* Документи компанії */}
                <Card className="mb-6">
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Документи компанії</h3>
                    {selectedCompany.documents.length === 0 ? (
                      <p className="text-gray-500 italic">Немає завантажених документів</p>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {selectedCompany.documents.map((doc) => (
                          <div key={doc.id} className="py-3 first:pt-0 last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="flex items-center">
                                  <FileText size={16} className="text-gray-400 mr-2" />
                                  <span className="font-medium text-gray-900">{doc.name}</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Завантажено: {formatDate(doc.uploadedAt)}
                                </div>
                              </div>
                              <div>
                                {getDocumentStatusBadge(doc.status)}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="small"
                                icon={<Eye size={14} />}
                                onClick={() => previewDocument(doc.url)}
                              >
                                Переглянути
                              </Button>
                              
                              {doc.status === "PENDING" && (
                                <>
                                  <Button
                                    variant="primary"
                                    size="small"
                                    icon={<CheckCircle size={14} />}
                                    onClick={() => handleVerifyDocument(selectedCompany.id, doc.id)}
                                  >
                                    Верифікувати
                                  </Button>
                                  
                                  <Button
                                    variant="danger"
                                    size="small"
                                    icon={<XCircle size={14} />}
                                    onClick={() => {
                                      const reason = prompt("Вкажіть причину відхилення документа:");
                                      if (reason) {
                                        handleRejectDocument(selectedCompany.id, doc.id, reason);
                                      }
                                    }}
                                  >
                                    Відхилити
                                  </Button>
                                </>
                              )}
                              
                              {doc.status === "REJECTED" && doc.rejectionReason && (
                                <div className="w-full mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                                  <strong>Причина відхилення:</strong> {doc.rejectionReason}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
                
                {selectedCompany.status === CompanyVerificationStatus.PENDING && (
                  <div className="flex space-x-3">
                    <Button
                      variant="primary"
                      icon={<CheckCircle size={18} />}
                      className="flex-1"
                      onClick={() => {
                        handleVerifyCompany(selectedCompany.id);
                        setPreviewModalOpen(false);
                      }}
                      disabled={
                        selectedCompany.documents.length === 0 ||
                        selectedCompany.documents.some(doc => doc.status === "PENDING")
                      }
                    >
                      Верифікувати компанію
                    </Button>
                    <Button
                      variant="danger"
                      icon={<XCircle size={18} />}
                      className="flex-1"
                      onClick={() => {
                        setPreviewModalOpen(false);
                        showRejectModal(selectedCompany);
                      }}
                    >
                      Відхилити компанію
                    </Button>
                  </div>
                )}
                
                {selectedCompany.status === CompanyVerificationStatus.PENDING && 
                 (selectedCompany.documents.length === 0 ||
                  selectedCompany.documents.some(doc => doc.status === "PENDING")) && (
                  <p className="mt-3 text-amber-600 text-sm">
                    <Info size={14} className="inline mr-1" />
                    Для верифікації компанії необхідно перевірити всі документи.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Модальне вікно для перегляду документів */}
      <Modal
        isOpen={documentPreviewOpen}
        onClose={() => {
          setDocumentPreviewOpen(false);
          setDocumentPreviewUrl(null);
        }}
        title="Перегляд документа"
        size="lg"
      >
        <div className="p-6">
          {documentPreviewUrl && (
            <div className="h-[80vh] w-full">
              <iframe 
                src={documentPreviewUrl} 
                className="w-full h-full border-0"
                title="Document Preview"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ModeratorVerificationPage;