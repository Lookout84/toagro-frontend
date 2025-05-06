import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  fetchCampaigns,
  fetchCampaignTypes,
  fetchCampaignStatuses,
  activateCampaign,
  pauseCampaign,
  cancelCampaign,
  deleteCampaign
} from "../../store/campaignsSlice";
import { Link } from "react-router-dom";
import {
  Plus,
  Bell,
  CheckCircle,
  PauseCircle,
  StopCircle,
  Trash2,
  Edit,
  BarChart2,
  Copy,
  Filter,
  ChevronDown,
  Search
} from "lucide-react";
import Loader from "../../components/common/Loader";
import { Campaign } from "../../types/api";

const AdminCampaignsPage = () => {
  const dispatch = useAppDispatch();
  const { campaigns, campaignTypes, campaignStatuses, meta, isLoading, error } = useAppSelector(
    (state) => state.campaigns
  );
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  // Завантаження кампаній, типів та статусів при першому рендері
  useEffect(() => {
    dispatch(fetchCampaigns());
    dispatch(fetchCampaignTypes());
    dispatch(fetchCampaignStatuses());
  }, [dispatch]);

  // Обробник пошуку
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(fetchCampaigns({ search: searchTerm }));
  };

  // Обробник зміни фільтрів
  const applyFilters = () => {
    dispatch(fetchCampaigns({ type: filterType, status: filterStatus }));
    setShowFilters(false);
  };

  // Обробник скидання фільтрів
  const resetFilters = () => {
    setFilterType(null);
    setFilterStatus(null);
    dispatch(fetchCampaigns());
    setShowFilters(false);
  };

  // Обробники дій з кампаніями
  const handleAction = (campaign: Campaign, action: string) => {
    setSelectedCampaign(campaign);
    setConfirmAction(action);
    setShowConfirmation(true);
  };

  // Підтвердження дії
  const confirmActionHandler = async () => {
    if (!selectedCampaign) return;

    try {
      switch (confirmAction) {
        case "activate":
          await dispatch(activateCampaign(selectedCampaign.id));
          break;
        case "pause":
          await dispatch(pauseCampaign(selectedCampaign.id));
          break;
        case "cancel":
          await dispatch(cancelCampaign(selectedCampaign.id));
          break;
        case "delete":
          await dispatch(deleteCampaign(selectedCampaign.id));
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error performing campaign action:", error);
    }

    setShowConfirmation(false);
    setSelectedCampaign(null);
    setConfirmAction(null);
  };
  
  // Форматування дати
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Не визначено";
    const date = new Date(dateString);
    return date.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // Отримання стилю для відображення статусу
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Переклад статусу
  const translateStatus = (status: string) => {
    switch (status) {
      case "active":
        return "Активна";
      case "paused":
        return "Призупинена";
      case "draft":
        return "Чернетка";
      case "completed":
        return "Завершена";
      case "canceled":
        return "Скасована";
      default:
        return status;
    }
  };

  // Переклад типу
  const translateType = (type: string) => {
    switch (type) {
      case "email":
        return "Електронна пошта";
      case "sms":
        return "SMS";
      case "push":
        return "Push-сповіщення";
      case "in-app":
        return "В додатку";
      case "promotion":
        return "Промоція";
      case "announcement":
        return "Оголошення";
      default:
        return type;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-0">Управління кампаніями</h2>
          
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Пошук */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Пошук кампаній..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
              <button type="submit" className="absolute inset-y-0 right-0 px-3 flex items-center">
                <Search size={18} className="text-gray-400" />
              </button>
            </form>
            
            {/* Кнопка фільтрів */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Filter size={18} />
                <span>Фільтри</span>
                <ChevronDown size={16} />
              </button>
              
              {/* Випадаюче меню з фільтрами */}
              {showFilters && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Фільтри</h3>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип кампанії
                    </label>
                    <select
                      value={filterType || ""}
                      onChange={(e) => setFilterType(e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Всі типи</option>
                      {campaignTypes.map((type) => (
                        <option key={type} value={type}>
                          {translateType(type)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Статус
                    </label>
                    <select
                      value={filterStatus || ""}
                      onChange={(e) => setFilterStatus(e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Всі статуси</option>
                      {campaignStatuses.map((status) => (
                        <option key={status} value={status}>
                          {translateStatus(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={resetFilters}
                      className="px-3 py-1 text-gray-600 hover:text-gray-900"
                    >
                      Скинути
                    </button>
                    <button
                      onClick={applyFilters}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Застосувати
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Кнопка створення */}
            <Link
              to="/admin/campaigns/create"
              className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus size={18} />
              <span>Створити кампанію</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {isLoading && !campaigns.length ? (
          <Loader />
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-6">Ще немає створених кампаній</p>
            <Link
              to="/admin/campaigns/create"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus size={18} />
              <span>Створити першу кампанію</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Таблиця кампаній */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Назва
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дати
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Bell size={18} className="text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {campaign.name}
                            </div>
                            {campaign.description && (
                              <div className="text-sm text-gray-500 max-w-md truncate">
                                {campaign.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {translateType(campaign.type)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusStyle(
                            campaign.status
                          )}`}
                        >
                          {translateStatus(campaign.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Створено: {formatDate(campaign.createdAt)}</div>
                        {campaign.startDate && (
                          <div>Початок: {formatDate(campaign.startDate)}</div>
                        )}
                        {campaign.endDate && (
                          <div>Кінець: {formatDate(campaign.endDate)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          <Link
                            to={`/admin/campaigns/${campaign.id}`}
                            className="text-gray-500 hover:text-gray-700"
                            title="Деталі"
                          >
                            <Eye size={18} />
                          </Link>
                          
                          <Link
                            to={`/admin/campaigns/${campaign.id}/analytics`}
                            className="text-blue-500 hover:text-blue-700"
                            title="Аналітика"
                          >
                            <BarChart2 size={18} />
                          </Link>
                          
                          <Link
                            to={`/admin/campaigns/${campaign.id}/edit`}
                            className="text-indigo-500 hover:text-indigo-700"
                            title="Редагувати"
                          >
                            <Edit size={18} />
                          </Link>
                          
                          <button
                            onClick={() => handleAction(campaign, 'duplicate')}
                            className="text-purple-500 hover:text-purple-700"
                            title="Дублювати"
                          >
                            <Copy size={18} />
                          </button>
                          
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => handleAction(campaign, 'activate')}
                              className="text-green-500 hover:text-green-700"
                              title="Активувати"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          
                          {campaign.status === 'active' && (
                            <button
                              onClick={() => handleAction(campaign, 'pause')}
                              className="text-yellow-500 hover:text-yellow-700"
                              title="Призупинити"
                            >
                              <PauseCircle size={18} />
                            </button>
                          )}
                          
                          {campaign.status === 'paused' && (
                            <button
                              onClick={() => handleAction(campaign, 'activate')}
                              className="text-green-500 hover:text-green-700"
                              title="Відновити"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          
                          {['draft', 'active', 'paused'].includes(campaign.status) && (
                            <button
                              onClick={() => handleAction(campaign, 'cancel')}
                              className="text-orange-500 hover:text-orange-700"
                              title="Скасувати"
                            >
                              <StopCircle size={18} />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleAction(campaign, 'delete')}
                            className="text-red-500 hover:text-red-700"
                            title="Видалити"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагінація */}
            {meta.pages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => dispatch(fetchCampaigns({ ...{ type: filterType, status: filterStatus }, page: meta.page - 1 }))}
                    disabled={meta.page === 1}
                    className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      meta.page === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="sr-only">Попередня сторінка</span>
                    &larr;
                  </button>
                  
                  {/* Номери сторінок */}
                  {Array.from({ length: meta.pages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === meta.pages ||
                        Math.abs(page - meta.page) <= 1
                    )
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => dispatch(fetchCampaigns({ ...{ type: filterType, status: filterStatus }, page }))}
                          className={`w-10 h-10 rounded-md flex items-center justify-center ${
                            page === meta.page
                              ? "bg-green-600 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                  
                  <button
                    onClick={() => dispatch(fetchCampaigns({ ...{ type: filterType, status: filterStatus }, page: meta.page + 1 }))}
                    disabled={meta.page === meta.pages}
                    className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      meta.page === meta.pages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="sr-only">Наступна сторінка</span>
                    &rarr;
                  </button>
                </nav>
              </div>
            )}
          </>
        )}

        {/* Модальне вікно підтвердження дії */}
        {showConfirmation && selectedCampaign && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {confirmAction === 'activate' && 'Активувати кампанію'}
                {confirmAction === 'pause' && 'Призупинити кампанію'}
                {confirmAction === 'cancel' && 'Скасувати кампанію'}
                {confirmAction === 'delete' && 'Видалити кампанію'}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {confirmAction === 'activate' && 
                  `Ви впевнені, що хочете активувати кампанію "${selectedCampaign.name}"? Після активації кампанія буде доступна для користувачів.`}
                {confirmAction === 'pause' && 
                  `Ви впевнені, що хочете призупинити кампанію "${selectedCampaign.name}"? Ви зможете відновити її пізніше.`}
                {confirmAction === 'cancel' && 
                  `Ви впевнені, що хочете скасувати кампанію "${selectedCampaign.name}"? Скасовану кампанію не можна буде відновити.`}
                {confirmAction === 'delete' && 
                  `Ви впевнені, що хочете видалити кампанію "${selectedCampaign.name}"? Ця дія незворотна.`}
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Скасувати
                </button>
                
                <button
                  onClick={confirmActionHandler}
                  className={`px-4 py-2 rounded-md text-white ${
                    confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Підтвердити
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCampaignsPage;