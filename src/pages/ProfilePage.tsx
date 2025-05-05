import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchUserListings, deleteListing } from '../store/listingSlice';
import {
  User, Settings, LogOut, ListOrdered, Scale, Plus,
  Edit2, Trash2, AlertTriangle, ExternalLink
} from 'lucide-react';
import Loader from '../components/common/Loader';
import ListingCard from '../components/ui/ListingCard';

// Компонент особистої інформації
const ProfileInfo = () => {
  const { user, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    avatar: user?.avatar || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Оновлення форми при зміні користувача
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phoneNumber: user.phoneNumber || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);
  
  // Обробник зміни полів форми
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Обробник відправки форми
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateUserProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Особиста інформація
        </h2>
        
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Ім'я та прізвище
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Номер телефону
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+380 XX XXX XX XX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">
                  URL фото профілю
                </label>
                <input
                  type="url"
                  id="avatar"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div className="flex space-x-3 pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Збереження...' : 'Зберегти зміни'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Скасувати
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex items-start mb-6">
              <div className="mr-4">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={32} className="text-gray-500" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {user?.name}
                </h3>
                <p className="text-gray-600">{user?.email}</p>
                {user?.phoneNumber && (
                  <p className="text-gray-600">{user?.phoneNumber}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {user?.isVerified 
                    ? 'Підтверджений користувач' 
                    : 'Непідтверджений користувач'}
                </p>
              </div>
              
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center text-green-600 hover:text-green-700"
              >
                <Edit2 size={18} className="mr-1" />
                Редагувати
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Налаштування</h4>
              <div className="space-y-3">
                <Link
                  to="/profile/settings/password"
                  className="flex items-center text-gray-700 hover:text-green-600"
                >
                  <Settings size={18} className="mr-2" />
                  Змінити пароль
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Компонент списку оголошень користувача
const UserListings = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const { userListings, isLoading } = useAppSelector((state) => state.listing);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<number | null>(null);
  
  // Завантаження оголошень користувача
  useEffect(() => {
    dispatch(fetchUserListings());
  }, [dispatch]);
  
  // Обробник для відкриття діалогу видалення
  const handleOpenDeleteModal = (id: number) => {
    setListingToDelete(id);
    setShowDeleteModal(true);
  };
  
  // Обробник для підтвердження видалення
  const handleConfirmDelete = async () => {
    if (listingToDelete) {
      await dispatch(deleteListing(listingToDelete));
      setShowDeleteModal(false);
      setListingToDelete(null);
    }
  };
  
  if (isLoading) {
    return <Loader />;
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Мої оголошення
          </h2>
          
          <Link
            to="/listings/create"
            className="flex items-center text-green-600 hover:text-green-700"
          >
            <Plus size={18} className="mr-1" />
            Додати оголошення
          </Link>
        </div>
        
        {userListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ListOrdered size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">
              У вас ще немає опублікованих оголошень
            </p>
            <Link
              to="/listings/create"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Створити перше оголошення
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userListings.map((listing) => (
              <div key={listing.id} className="relative">
                <ListingCard listing={listing} />
                
                {/* Кнопки керування */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  <Link
                    to={`/listings/${listing.id}`}
                    className="p-2 bg-white bg-opacity-80 rounded-full text-gray-700 hover:bg-opacity-100 transition-opacity"
                    title="Переглянути"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <Link
                    to={`/profile/listings/edit/${listing.id}`}
                    className="p-2 bg-white bg-opacity-80 rounded-full text-gray-700 hover:bg-opacity-100 transition-opacity"
                    title="Редагувати"
                  >
                    <Edit2 size={16} />
                  </Link>
                  <button
                    onClick={() => handleOpenDeleteModal(listing.id)}
                    className="p-2 bg-white bg-opacity-80 rounded-full text-red-600 hover:bg-opacity-100 transition-opacity"
                    title="Видалити"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Модальне вікно підтвердження видалення */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle size={24} className="mr-2" />
              <h3 className="text-lg font-semibold">Видалення оголошення</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              Ви дійсно бажаєте видалити це оголошення? Цю дію неможливо скасувати.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Скасувати
              </button>
              
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент порівняння оголошень
const CompareListings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [compareListings, setCompareListings] = useState<any[]>([]);
  
  // Отримання оголошень для порівняння з параметрів навігації
  useEffect(() => {
    if (location.state?.listings) {
      setCompareListings(location.state.listings);
    }
  }, [location.state]);
  
  if (compareListings.length < 2) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Порівняння оголошень
          </h2>
          
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Scale size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">
              Для порівняння необхідно вибрати щонайменше 2 оголошення
            </p>
            <Link
              to="/catalog"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Перейти до каталогу
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Порівняння оголошень
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 w-1/4">Характеристика</th>
                {compareListings.map((listing) => (
                  <th key={listing.id} className="text-left py-3 px-4 font-semibold text-gray-700">
                    {listing.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Зображення */}
              <tr className="border-b border-gray-200">
                <td className="py-3 px-4 font-medium text-gray-700">Фото</td>
                {compareListings.map((listing) => (
                  <td key={`${listing.id}-image`} className="py-3 px-4">
                    <img
                      src={listing.images[0] || 'https://via.placeholder.com/100?text=Немає+фото'}
                      alt={listing.title}
                      className="w-24 h-24 object-cover rounded-md"
                    />
                  </td>
                ))}
              </tr>
              
              {/* Ціна */}
              <tr className="border-b border-gray-200">
                <td className="py-3 px-4 font-medium text-gray-700">Ціна</td>
                {compareListings.map((listing) => (
                  <td key={`${listing.id}-price`} className="py-3 px-4 font-bold text-gray-900">
                    {new Intl.NumberFormat('uk-UA', {
                      style: 'currency',
                      currency: 'UAH',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(listing.price)}
                  </td>
                ))}
              </tr>
              
              {/* Категорія */}
              <tr className="border-b border-gray-200">
                <td className="py-3 px-4 font-medium text-gray-700">Категорія</td>
                {compareListings.map((listing) => (
                  <td key={`${listing.id}-category`} className="py-3 px-4">
                    {listing.category}
                  </td>
                ))}
              </tr>
              
              {/* Місцезнаходження */}
              <tr className="border-b border-gray-200">
                <td className="py-3 px-4 font-medium text-gray-700">Місцезнаходження</td>
                {compareListings.map((listing) => (
                  <td key={`${listing.id}-location`} className="py-3 px-4">
                    {listing.location}
                  </td>
                ))}
              </tr>
              
              {/* Дата публікації */}
              <tr className="border-b border-gray-200">
                <td className="py-3 px-4 font-medium text-gray-700">Дата публікації</td>
                {compareListings.map((listing) => (
                  <td key={`${listing.id}-date`} className="py-3 px-4">
                    {new Date(listing.createdAt).toLocaleDateString('uk-UA')}
                  </td>
                ))}
              </tr>
              
              {/* Опис */}
              <tr className="border-b border-gray-200">
                <td className="py-3 px-4 font-medium text-gray-700">Опис</td>
                {compareListings.map((listing) => (
                  <td key={`${listing.id}-description`} className="py-3 px-4">
                    <p className="line-clamp-3 text-sm text-gray-600">
                      {listing.description}
                    </p>
                    <Link
                      to={`/listings/${listing.id}`}
                      className="text-green-600 hover:text-green-700 text-sm mt-1 inline-block"
                    >
                      Детальніше
                    </Link>
                  </td>
                ))}
              </tr>
              
              {/* Продавець */}
              <tr className="border-b border-gray-200">
                <td className="py-3 px-4 font-medium text-gray-700">Продавець</td>
                {compareListings.map((listing) => (
                  <td key={`${listing.id}-seller`} className="py-3 px-4">
                    {listing.user.name}
                  </td>
                ))}
              </tr>
              
              {/* Кнопка перегляду */}
              <tr>
                <td className="py-3 px-4"></td>
                {compareListings.map((listing) => (
                  <td key={`${listing.id}-action`} className="py-3 px-4">
                    <Link
                      to={`/listings/${listing.id}`}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-block"
                    >
                      Переглянути
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Основний компонент сторінки профілю
const ProfilePage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Вкладки профілю
  const tabs = [
    {
      name: 'Профіль',
      path: '/profile',
      icon: <User size={20} />,
    },
    {
      name: 'Мої оголошення',
      path: '/profile/listings',
      icon: <ListOrdered size={20} />,
    },
    {
      name: 'Порівняння',
      path: '/profile/compare',
      icon: <Scale size={20} />,
    },
  ];
  
  // Визначення активної вкладки
  const getActiveTab = () => {
    if (location.pathname.startsWith('/profile/listings')) {
      return '/profile/listings';
    }
    if (location.pathname.startsWith('/profile/compare')) {
      return '/profile/compare';
    }
    return '/profile';
  };
  
  const activeTab = getActiveTab();
  
  // Обробник виходу з облікового запису
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Особистий кабінет
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Бічне меню */}
        <aside className="md:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center px-4 py-3 ${
                    activeTab === tab.path
                      ? 'bg-green-50 border-l-4 border-green-600 text-green-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.name}
                </Link>
              ))}
              
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-3 text-red-600 hover:bg-red-50 w-full text-left"
              >
                <LogOut size={20} className="mr-3" />
                Вийти
              </button>
            </nav>
          </div>
        </aside>
        
        {/* Основний контент */}
        <div className="md:col-span-3">
          <Routes>
            <Route path="/" element={<ProfileInfo />} />
            <Route path="/listings" element={<UserListings />} />
            <Route path="/compare" element={<CompareListings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;