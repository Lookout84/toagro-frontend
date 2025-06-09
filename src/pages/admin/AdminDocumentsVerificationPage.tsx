import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  FileCheck,
  FileX,
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
  DateRangePicker,
  EmptyState,
  Dropdown,
  DropdownItem,
} from "../../components/common";
import { adminAPI } from "../../api/apiClient";
import { formatDate, formatFileSize, getDocumentTypeLabel, getDocumentStatusBadge } from "../../utils/formatters";
import { CompanyDocument, DocumentStatus, DocumentType } from "../../types/company";

/**
 * Інтерфейс для параметрів фільтрації документів
 */
interface FilterParams {
  status: DocumentStatus | "ALL";
  type: DocumentType | "ALL";
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  sortBy: "DATE_ASC" | "DATE_DESC" | "NAME_ASC" | "NAME_DESC";
  companyId?: number;
}

/**
 * Інтерфейс для відповіді API із списком документів
 */
interface DocumentsResponse {
  documents: CompanyDocument[];
  totalCount: number;
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
}

/**
 * Компонент сторінки верифікації документів для адміністратора
 */
const AdminDocumentsVerificationPage: React.FC = () => {
  // Стан для списків документів
  const [pendingDocuments, setPendingDocuments] = useState<CompanyDocument[]>([]);
  const [verifiedDocuments, setVerifiedDocuments] = useState<CompanyDocument[]>([]);
  const [rejectedDocuments, setRejectedDocuments] = useState<CompanyDocument[]>([]);
  
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
    type: "ALL",
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
  
  // Стан для вибраного документа (для перегляду)
  const [selectedDocument, setSelectedDocument] = useState<CompanyDocument | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
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
    fetchDocuments();
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
   * Функція для завантаження документів з API
   */
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        pageSize,
        status: filters.status,
        sortBy: filters.sortBy,
      };
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (filters.type !== "ALL") params.type = filters.type;
      if (filters.dateRange.from) params.fromDate = filters.dateRange.from.toISOString();
      if (filters.dateRange.to) params.toDate = filters.dateRange.to.toISOString();
      if (filters.companyId) params.companyId = filters.companyId;

      const response = await adminAPI.getDocumentsForVerification(params);
      
      const data: DocumentsResponse = response.data;
      
      // Оновлюємо списки документів в залежності від активної вкладки
      if (filters.status === "PENDING") {
        setPendingDocuments(data.documents);
      } else if (filters.status === "VERIFIED") {
        setVerifiedDocuments(data.documents);
      } else if (filters.status === "REJECTED") {
        setRejectedDocuments(data.documents);
      }
      
      // Оновлюємо лічильники
      setTotalItems(data.totalCount);
      setPendingCount(data.pendingCount);
      setVerifiedCount(data.verifiedCount);
      setRejectedCount(data.rejectedCount);
      
    } catch (err: any) {
      console.error("Error fetching documents:", err);
      setError("Помилка завантаження списку документів. Спробуйте знову пізніше.");
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
   * Обробник для перегляду документа
   */
  const handleViewDocument = (document: CompanyDocument) => {
    setSelectedDocument(document);
    setPreviewModalOpen(true);
  };

  /**
   * Обробник для підтвердження документа
   */
  const handleVerifyDocument = async (documentId: number, companyId: number) => {
    try {
      await adminAPI.verifyDocument(companyId, documentId);
      fetchDocuments(); // Оновлюємо список після успішної верифікації
    } catch (err) {
      console.error("Error verifying document:", err);
      // Показати повідомлення про помилку
    }
  };

  /**
   * Обробник для відхилення документа
   */
  const handleRejectDocument = async (documentId: number, companyId: number, reason: string) => {
    try {
      await adminAPI.rejectDocument(companyId, documentId, { reason });
      fetchDocuments(); // Оновлюємо список після успішного відхилення
    } catch (err) {
      console.error("Error rejecting document:", err);
      // Показати повідомлення про помилку
    }
  };

  /**
   * Обробник для оновлення даних
   */
  const handleRefresh = () => {
    fetchDocuments();
  };

  /**
   * Обробник для зміни параметрів сортування
   */
  const handleSortChange = (sortBy: FilterParams["sortBy"]) => {
    setFilters(prev => ({ ...prev, sortBy }));
    setPage(1);
  };

  /**
   * Обробник для зміни типу документа
   */
  const handleTypeChange = (type: DocumentType | "ALL") => {
    setFilters(prev => ({ ...prev, type }));
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
      type: "ALL",
      dateRange: { from: null, to: null },
      sortBy: "DATE_DESC"
    });
    setSearchQuery("");
    setPage(1);
  };

  /**
   * Функція для рендерингу списку документів
   */
  const renderDocumentList = (documents: CompanyDocument[]) => {
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

    if (documents.length === 0) {
      return (
        <EmptyState 
          icon={<FileText size={48} className="text-gray-400" />}
          title="Немає документів"
          description={
            debouncedSearchQuery 
              ? "За вашим запитом не знайдено жодного документа. Спробуйте змінити параметри пошуку."
              : activeTab === 0 
                ? "Немає документів, які очікують на верифікацію."
                : activeTab === 1 
                  ? "Немає верифікованих документів."
                  : "Немає відхилених документів."
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
                  Документ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Компанія
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Розмір
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата завантаження
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
              {documents.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-6 w-6 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {document.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                      onClick={() => handleViewCompany(document.companyId)}
                    >
                      Компанія #{document.companyId}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getDocumentTypeLabel(document.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(document.fileSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(document.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getDocumentStatusBadge(document.verificationStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="small"
                        icon={<Eye size={14} />}
                        onClick={() => handleViewDocument(document)}
                      >
                        Переглянути
                      </Button>
                      
                      {document.verificationStatus === "PENDING" && (
                        <>
                          <Button
                            variant="primary"
                            size="small"
                            icon={<FileCheck size={14} />}
                            onClick={() => handleVerifyDocument(document.id, document.companyId)}
                          >
                            Підтвердити
                          </Button>
                          <Dropdown
                            trigger="Відхилити"
                            align="right"
                            buttonVariant="outline"
                            icon={<ChevronDown size={14} />}
                            width="auto"
                          >
                            <DropdownItem
                              onClick={() => handleRejectDocument(document.id, document.companyId, "Низька якість зображення")}
                            >
                              Низька якість зображення
                            </DropdownItem>
                            <DropdownItem
                              onClick={() => handleRejectDocument(document.id, document.companyId, "Неправильний тип документа")}
                            >
                              Неправильний тип документа
                            </DropdownItem>
                            <DropdownItem
                              onClick={() => handleRejectDocument(document.id, document.companyId, "Недійсний документ")}
                            >
                              Недійсний документ
                            </DropdownItem>
                            <DropdownItem
                              onClick={() => handleRejectDocument(document.id, document.companyId, "Пошкоджений файл")}
                            >
                              Пошкоджений файл
                            </DropdownItem>
                          </Dropdown>
                        </>
                      )}
                    </div>
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

  // Додайте тут модальне вікно для перегляду документа, якщо потрібно

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Верифікація документів</h1>
          <p className="text-gray-600 mt-1">
            Перегляд та верифікація документів компаній, зареєстрованих на платформі
          </p>
        </div>

        <Card className="mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Пошук за назвою документа або компанії"
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
                      Тип документа
                    </label>
                    <Select
                      value={filters.type}
                      onChange={(value) => handleTypeChange(value as DocumentType | "ALL")}
                      options={[
                        { value: "ALL", label: "Всі типи" },
                        { value: "REGISTRATION_CERTIFICATE", label: "Свідоцтво про реєстрацію" },
                        { value: "TAX_ID", label: "Податковий номер" },
                        { value: "DIRECTOR_ID", label: "Посвідчення директора" },
                        { value: "BUSINESS_LICENSE", label: "Ліцензія на ведення бізнесу" },
                        { value: "FINANCIAL_STATEMENT", label: "Фінансова звітність" },
                        { value: "OTHER", label: "Інший документ" }
                      ]}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Дата завантаження
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
                <Tab title={`Підтверджені (${verifiedCount})`}>{null}</Tab>
                <Tab title={`Відхилені (${rejectedCount})`}>{null}</Tab>
              </Tabs>
            </div>

            {activeTab === 0 && renderDocumentList(pendingDocuments)}
            {activeTab === 1 && renderDocumentList(verifiedDocuments)}
            {activeTab === 2 && renderDocumentList(rejectedDocuments)}
          </div>
        </Card>
      </div>
      
      {/* Тут можна додати модальне вікно для перегляду документа */}
      {/* Наприклад:
      {previewModalOpen && selectedDocument && (
        <DocumentPreviewModal 
          document={selectedDocument}
          onClose={() => setPreviewModalOpen(false)}
          onVerify={() => {
            handleVerifyDocument(selectedDocument.id);
            setPreviewModalOpen(false);
          }}
          onReject={(reason) => {
            handleRejectDocument(selectedDocument.id, reason);
            setPreviewModalOpen(false);
          }}
        />
      )}
      */}
    </div>
  );
};

export default AdminDocumentsVerificationPage;