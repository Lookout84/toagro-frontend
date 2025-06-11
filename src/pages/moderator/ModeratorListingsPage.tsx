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
  AlertTriangle,
  ExternalLink,
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
} from "../../components/common";
import { moderatorAPI } from "../../api/apiClient";
import { formatDate } from "../../utils/formatters";
import { formatCurrency } from "../../utils/currencyFormatter";

// Статуси оголошень
enum ListingStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  REPORTED = "REPORTED",
  ALL = "ALL",
}

// Типи оголошень
enum ListingType {
  NEW = "NEW",
  USED = "USED",
  PARTS = "PARTS",
  SERVICE = "SERVICE",
  ALL = "ALL",
}

// Параметри фільтрації оголошень
interface FilterParams {
  status: ListingStatus;
  type: ListingType;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  sortBy: "DATE_DESC" | "DATE_ASC" | "PRICE_DESC" | "PRICE_ASC";
  categoryId?: number;
}

// Інтерфейс оголошення
interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  type: ListingType;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  images: string[];
  categoryName: string;
  userFullName: string;
  userEmail: string;
  companyName?: string;
  companyId?: number;
  reportCount?: number;
  reportReasons?: string[];
}

/**
 * Сторінка для модерації оголошень
 */
const ModeratorListingsPage: React.FC = () => {
  // Стани для відображення оголошень
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [approvedListings, setApprovedListings] = useState<Listing[]>([]);
  const [rejectedListings, setRejectedListings] = useState<Listing[]>([]);
  const [reportedListings, setReportedListings] = useState<Listing[]>([]);
  
  // Стани для пагінації
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Стани для лічильників
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [reportedCount, setReportedCount] = useState(0);
  
  // Стани для фільтрів
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<FilterParams>({
    status: ListingStatus.PENDING,
    type: ListingType.ALL,
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
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedPresetReason, setSelectedPresetReason] = useState("");

  // Ефект для дебаунсу пошукового запиту
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Ефект для завантаження даних при зміні параметрів
  useEffect(() => {
    fetchListings();
  }, [page, pageSize, debouncedSearchQuery, filters, activeTab]);

  // Оновлення статусу фільтрації при зміні активної вкладки
  useEffect(() => {
    let newStatus: ListingStatus = ListingStatus.ALL;
    
    if (activeTab === 0) newStatus = ListingStatus.PENDING;
    else if (activeTab === 1) newStatus = ListingStatus.APPROVED;
    else if (activeTab === 2) newStatus = ListingStatus.REJECTED;
    else if (activeTab === 3) newStatus = ListingStatus.REPORTED;
    
    setFilters(prev => ({ ...prev, status: newStatus }));
    setPage(1); // Скидаємо сторінку при зміні вкладки
  }, [activeTab]);

  /**
   * Завантаження оголошень з API
   */
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await moderatorAPI.getListings({
        page,
        pageSize,
        search: debouncedSearchQuery,
        status: filters.status,
        type: filters.type === ListingType.ALL ? undefined : filters.type,
        fromDate: filters.dateRange.from ? filters.dateRange.from.toISOString() : undefined,
        toDate: filters.dateRange.to ? filters.dateRange.to.toISOString() : undefined,
        sortBy: filters.sortBy,
        categoryId: filters.categoryId
      });
      
      const data = response.data;
      
      // Оновлюємо списки оголошень в залежності від активної вкладки
      if (filters.status === ListingStatus.PENDING) {
        setPendingListings(data.listings);
      } else if (filters.status === ListingStatus.APPROVED) {
        setApprovedListings(data.listings);
      } else if (filters.status === ListingStatus.REJECTED) {
        setRejectedListings(data.listings);
      } else if (filters.status === ListingStatus.REPORTED) {
        setReportedListings(data.listings);
      }
      
      // Оновлюємо лічильники
      setTotalItems(data.totalCount);
      setPendingCount(data.pendingCount);
      setApprovedCount(data.approvedCount);
      setRejectedCount(data.rejectedCount);
      setReportedCount(data.reportedCount);
      
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Помилка завантаження списку оголошень. Спробуйте знову пізніше.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Підтвердження оголошення
   */
  const handleApproveListing = async (id: number) => {
    try {
      await moderatorAPI.approveListing(id);
      fetchListings(); // Оновлюємо список
    } catch (err) {
      console.error("Error approving listing:", err);
      setError("Помилка при підтвердженні оголошення.");
    }
  };

  /**
   * Відхилення оголошення
   */
  const handleRejectListing = async () => {
    if (!selectedListing) return;
    
    try {
      const reason = rejectReason || selectedPresetReason;
      await moderatorAPI.rejectListing(selectedListing.id, reason);
      setRejectModalOpen(false);
      setRejectReason("");
      setSelectedPresetReason("");
      fetchListings(); // Оновлюємо список
    } catch (err) {
      console.error("Error rejecting listing:", err);
      setError("Помилка при відхиленні оголошення.");
    }
  };

  /**
   * Показ модального вікна для відхилення
   */
  const showRejectModal = (listing: Listing) => {
    setSelectedListing(listing);
    setRejectModalOpen(true);
  };

  /**
   * Показ модального вікна для перегляду
   */
  const showPreviewModal = (listing: Listing) => {
    setSelectedListing(listing);
    setPreviewModalOpen(true);
  };

  /**
   * Оновлення даних
   */
  const handleRefresh = () => {
    fetchListings();
  };

  /**
   * Зміна параметрів сортування
   */
  const handleSortChange = (sortBy: FilterParams["sortBy"]) => {
    setFilters(prev => ({ ...prev, sortBy }));
    setPage(1);
  };

  /**
   * Зміна типу оголошення
   */
  const handleTypeChange = (type: ListingType) => {
    setFilters(prev => ({ ...prev, type }));
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
      status: activeTab === 0 ? ListingStatus.PENDING :
              activeTab === 1 ? ListingStatus.APPROVED :
              activeTab === 2 ? ListingStatus.REJECTED :
              ListingStatus.REPORTED,
      type: ListingType.ALL,
      dateRange: { from: null, to: null },
      sortBy: "DATE_DESC"
    });
    setSearchQuery("");
    setPage(1);
  };

  /**
   * Функція для отримання бейджу статусу оголошення
   */
  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case ListingStatus.PENDING:
        return <Badge color="yellow" icon={<Clock size={14} />}>Очікує</Badge>;
      case ListingStatus.APPROVED:
        return <Badge color="green" icon={<CheckCircle size={14} />}>Підтверджено</Badge>;
      case ListingStatus.REJECTED:
        return <Badge color="red" icon={<XCircle size={14} />}>Відхилено</Badge>;
      case ListingStatus.REPORTED:
        return <Badge color="orange" icon={<AlertTriangle size={14} />}>Скарга</Badge>;
      default:
        return <Badge color="gray">Невідомо</Badge>;
    }
  };

  /**
   * Функція для отримання списку оголошень залежно від вкладки
   */
  const getActiveListings = () => {
    switch (activeTab) {
      case 0: return pendingListings;
      case 1: return approvedListings;
      case 2: return rejectedListings;
      case 3: return reportedListings;
      default: return [];
    }
  };

  /**
   * Функція для отримання заголовка пустого стану
   */
  const getEmptyStateTitle = () => {
    switch (activeTab) {
      case 0: return "Немає оголошень, які очікують модерації";
      case 1: return "Немає підтверджених оголошень";
      case 2: return "Немає відхилених оголошень";
      case 3: return "Немає оголошень зі скаргами";
      default: return "Немає оголошень";
    }
  };

  /**
   * Рендеринг списку оголошень
   */
  const renderListings = () => {
    const listings = getActiveListings();
    
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
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="small" 
              onClick={handleRefresh}
              icon={<RefreshCw size={14} />}
            >
              Спробувати знову
            </Button>
          </div>
        </div>
      );
    }

    if (listings.length === 0) {
      return (
        <EmptyState 
          icon={<AlertTriangle size={48} className="text-gray-400" />}
          title={debouncedSearchQuery ? "Нічого не знайдено" : getEmptyStateTitle()}
          description={
            debouncedSearchQuery 
              ? "За вашим запитом не знайдено жодного оголошення. Спробуйте змінити параметри пошуку."
              : "Наразі немає оголошень для відображення в цій категорії."
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
                  Оголошення
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категорія
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ціна
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Автор
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
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
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {listing.images && listing.images.length > 0 ? (
                        <img 
                          src={listing.images[0]} 
                          alt={listing.title} 
                          className="h-10 w-10 rounded-md object-cover mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-200 mr-3 flex items-center justify-center text-gray-500">
                          <AlertTriangle size={16} />
                        </div>
                      )}
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {listing.title}
                        </div>
                        {activeTab === 3 && listing.reportCount && (
                          <div className="text-xs text-red-600 mt-1">
                            {listing.reportCount} {listing.reportCount === 1 ? 'скарга' : 
                             listing.reportCount < 5 ? 'скарги' : 'скарг'}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {listing.categoryName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {listing.type === ListingType.NEW ? "Нове" :
                     listing.type === ListingType.USED ? "Вживане" :
                     listing.type === ListingType.PARTS ? "Запчастини" :
                     "Сервіс"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatCurrency(listing.price, { currency: listing.currency })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{listing.userFullName}</div>
                    {listing.companyName && (
                      <div className="text-xs text-gray-500">{listing.companyName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(listing.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(listing.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="small"
                        icon={<Eye size={14} />}
                        onClick={() => showPreviewModal(listing)}
                      >
                        Переглянути
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="small"
                        icon={<ExternalLink size={14} />}
                        onClick={() => window.open(`/listings/${listing.id}`, '_blank')}
                      >
                        На сайті
                      </Button>
                      
                      {listing.status === ListingStatus.PENDING && (
                        <>
                          <Button
                            variant="primary"
                            size="small"
                            icon={<CheckCircle size={14} />}
                            onClick={() => handleApproveListing(listing.id)}
                          >
                            Підтвердити
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            icon={<XCircle size={14} />}
                            onClick={() => showRejectModal(listing)}
                          >
                            Відхилити
                          </Button>
                        </>
                      )}

                      {listing.status === ListingStatus.REPORTED && (
                        <>
                          <Button
                            variant="primary"
                            size="small"
                            icon={<CheckCircle size={14} />}
                            onClick={() => handleApproveListing(listing.id)}
                          >
                            Залишити
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            icon={<XCircle size={14} />}
                            onClick={() => showRejectModal(listing)}
                          >
                            Видалити
                          </Button>
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
          <h1 className="text-2xl font-bold text-gray-900">Модерація оголошень</h1>
          <p className="text-gray-600 mt-1">
            Перегляд та модерація оголошень на платформі
          </p>
        </div>

        <Card className="mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Пошук за назвою оголошення або автором"
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
                      Тип оголошення
                    </label>
                    <Select
                      value={filters.type}
                      onChange={(value) => handleTypeChange(value as ListingType)}
                      options={[
                        { value: ListingType.ALL, label: "Всі типи" },
                        { value: ListingType.NEW, label: "Нова техніка" },
                        { value: ListingType.USED, label: "Вживана техніка" },
                        { value: ListingType.PARTS, label: "Запчастини" },
                        { value: ListingType.SERVICE, label: "Сервіс" },
                      ]}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Дата створення
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
                        { value: "PRICE_DESC", label: "За ціною (від високої до низької)" },
                        { value: "PRICE_ASC", label: "За ціною (від низької до високої)" },
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
                <Tab title={`Очікують модерації (${pendingCount})`}>Очікують модерації</Tab>
                <Tab title={`Підтверджені (${approvedCount})`}>Підтверджені</Tab>
                <Tab title={`Відхилені (${rejectedCount})`}>Відхилені</Tab>
                <Tab title={`Скарги (${reportedCount})`}>Скарги</Tab>
              </Tabs>
            </div>

            {renderListings()}
          </div>
        </Card>
      </div>
      
      {/* Модальне вікно для відхилення оголошення */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Відхилити оголошення"
      >
        <div className="p-6">
          <p className="mb-4 text-gray-700">
            Вкажіть причину відхилення оголошення. Ця інформація буде надіслана автору.
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
                { value: "Неякісні або відсутні фото", label: "Неякісні або відсутні фото" },
                { value: "Неправильна категорія", label: "Неправильна категорія" },
                { value: "Порушення правил платформи", label: "Порушення правил платформи" },
                { value: "Заборонений товар або послуга", label: "Заборонений товар або послуга" },
                { value: "Дублікат оголошення", label: "Дублікат оголошення" },
                { value: "Невідповідна ціна", label: "Невідповідна ціна" },
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
              onClick={handleRejectListing}
              disabled={!rejectReason && !selectedPresetReason}
            >
              Відхилити оголошення
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Модальне вікно для перегляду оголошення */}
      {selectedListing && previewModalOpen && (
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          title={`Перегляд оголошення: ${selectedListing.title}`}
          size="lg"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {selectedListing.images && selectedListing.images.length > 0 ? (
                  <div className="mb-4">
                    <img
                      src={selectedListing.images[0]}
                      alt={selectedListing.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    {selectedListing.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {selectedListing.images.slice(1, 5).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${selectedListing.title} ${index + 2}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-4 flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                    <p className="text-gray-500">Немає зображень</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Інформація про оголошення</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ціна:</span>
                        <span className="font-medium">{formatCurrency(selectedListing.price, { currency: selectedListing.currency })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Категорія:</span>
                        <span>{selectedListing.categoryName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Тип:</span>
                        <span>
                          {selectedListing.type === ListingType.NEW ? "Нова техніка" :
                           selectedListing.type === ListingType.USED ? "Вживана техніка" :
                           selectedListing.type === ListingType.PARTS ? "Запчастини" :
                           "Сервіс"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Дата створення:</span>
                        <span>{formatDate(selectedListing.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Статус:</span>
                        <span>{getStatusBadge(selectedListing.status)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Інформація про автора */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Автор</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ім&apos;я:</span>
                        <span>{selectedListing.userFullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span>{selectedListing.userEmail}</span>
                      </div>
                      {selectedListing.companyName && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Компанія:</span>
                          <span>{selectedListing.companyName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Скарги, якщо є */}
                  {selectedListing.status === ListingStatus.REPORTED && selectedListing.reportReasons && (
                    <div>
                      <h3 className="text-lg font-medium text-red-700">Скарги</h3>
                      <div className="mt-2 space-y-2">
                        <ul className="list-disc pl-5 text-gray-700">
                          {selectedListing.reportReasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedListing.title}</h2>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-line">{selectedListing.description}</p>
                  </div>
                </div>
                
                {selectedListing.status === ListingStatus.PENDING && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Дії з оголошенням</h3>
                    <div className="flex space-x-3">
                      <Button
                        variant="primary"
                        icon={<CheckCircle size={18} />}
                        className="flex-1"
                        onClick={() => {
                          handleApproveListing(selectedListing.id);
                          setPreviewModalOpen(false);
                        }}
                      >
                        Підтвердити оголошення
                      </Button>
                      <Button
                        variant="danger"
                        icon={<XCircle size={18} />}
                        className="flex-1"
                        onClick={() => {
                          setPreviewModalOpen(false);
                          showRejectModal(selectedListing);
                        }}
                      >
                        Відхилити оголошення
                      </Button>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        icon={<ExternalLink size={18} />}
                        className="w-full"
                        onClick={() => window.open(`/listings/${selectedListing.id}`, '_blank')}
                      >
                        Відкрити на сайті
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedListing.status === ListingStatus.REPORTED && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Дії зі скаргою</h3>
                    <div className="flex space-x-3">
                      <Button
                        variant="primary"
                        icon={<CheckCircle size={18} />}
                        className="flex-1"
                        onClick={() => {
                          handleApproveListing(selectedListing.id);
                          setPreviewModalOpen(false);
                        }}
                      >
                        Залишити оголошення
                      </Button>
                      <Button
                        variant="danger"
                        icon={<XCircle size={18} />}
                        className="flex-1"
                        onClick={() => {
                          setPreviewModalOpen(false);
                          showRejectModal(selectedListing);
                        }}
                      >
                        Видалити оголошення
                      </Button>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        icon={<ExternalLink size={18} />}
                        className="w-full"
                        onClick={() => window.open(`/listings/${selectedListing.id}`, '_blank')}
                      >
                        Відкрити на сайті
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ModeratorListingsPage;