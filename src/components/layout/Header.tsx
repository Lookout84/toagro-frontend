import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Search,
  Menu,
  X,
  User,
  MessageSquare,
  ShoppingCart,
  ChevronDown,
  Settings,
  UserCog,
  Building2,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../store";
import { fetchCategories, fetchCategoryTree } from "../../store/catalogSlice";
import { chatAPI } from "../../api/apiClient";

const Header = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { categories, categoryTree } = useAppSelector((state) => state.catalog);

  // Завантаження категорій при першому рендері
  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
      dispatch(fetchCategoryTree());
    }
  }, [dispatch, categories.length]);

  // Отримання кількості непрочитаних повідомлень для авторизованих користувачів
  useEffect(() => {
    if (isAuthenticated) {
      const fetchUnreadCount = async () => {
        try {
          const response = await chatAPI.getUnreadCount();
          setUnreadCount(response.data.data.count);
        } catch (error) {
          console.error("Error fetching unread messages count:", error);
        }
      };

      fetchUnreadCount();

      // Встановлюємо інтервал для періодичного оновлення
      const interval = setInterval(fetchUnreadCount, 60000); // Оновлення кожну хвилину

      return () => clearInterval(interval);
    }
    return undefined;
  }, [isAuthenticated]);

  // Обробник пошуку
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
    }
  };

  // Закриття меню при навігації
  const handleNavigation = () => {
    setIsMenuOpen(false);
    setIsCategoryMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  // Обробник виходу
  const handleLogout = () => {
    logout();
    handleNavigation();
    navigate("/");
  };

  // Визначення URL профілю в залежності від ролі
  const getProfileUrl = () => {
    if (!user) return "/profile";
    
    switch (user.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "MODERATOR":
        return "/moderator/dashboard";
      case "COMPANY":
        return "/company/dashboard";
      default:
        return "/profile";
    }
  };

  // Рендеринг пунктів меню профілю в залежності від ролі
  const renderProfileMenuItems = () => {
    if (!user) return null;

    const commonItems = (
      <>
        <Link
          to={getProfileUrl()}
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={handleNavigation}
        >
          {user.role === "ADMIN" || user.role === "MODERATOR" 
            ? "Панель управління" 
            : "Мій профіль"}
        </Link>
        
        <Link
          to="/profile/listings"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={handleNavigation}
        >
          Мої оголошення
        </Link>
        
        <Link
          to="/listings/create"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={handleNavigation}
        >
          Додати оголошення
        </Link>
      </>
    );

    // Додаткові пункти меню для кожної ролі
    switch (user.role) {
      case "ADMIN":
        return (
          <>
            {commonItems}
            <div className="border-t border-gray-200 my-1"></div>
            <Link
              to="/admin/companies"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleNavigation}
            >
              <Building2 size={16} className="inline-block mr-2" />
              Компанії
            </Link>
            <Link
              to="/admin/users"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleNavigation}
            >
              <UserCog size={16} className="inline-block mr-2" />
              Користувачі
            </Link>
            <Link
              to="/admin/settings"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleNavigation}
            >
              <Settings size={16} className="inline-block mr-2" />
              Налаштування
            </Link>
          </>
        );
      
      case "MODERATOR":
        return (
          <>
            {commonItems}
            <div className="border-t border-gray-200 my-1"></div>
            <Link
              to="/moderator/verification"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleNavigation}
            >
              Верифікація компаній
            </Link>
            <Link
              to="/moderator/listings"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleNavigation}
            >
              Модерація оголошень
            </Link>
          </>
        );
      
      case "COMPANY":
        return (
          <>
            {commonItems}
            <div className="border-t border-gray-200 my-1"></div>
            <Link
              to="/company/settings"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleNavigation}
            >
              Налаштування компанії
            </Link>
            <Link
              to="/company/documents"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleNavigation}
            >
              Документи компанії
            </Link>
          </>
        );
      
      default:
        return commonItems;
    }
  };

  // Отримання іконки для профілю в залежності від ролі
  const getProfileIcon = () => {
    if (!user) return <User size={24} className="text-gray-600 group-hover:text-green-600" />;
    
    switch (user.role) {
      case "ADMIN":
        return <UserCog size={24} className="text-green-700 group-hover:text-green-600" />;
      case "MODERATOR":
        return <UserCog size={24} className="text-blue-600 group-hover:text-green-600" />;
      case "COMPANY":
        return <Building2 size={24} className="text-gray-600 group-hover:text-green-600" />;
      default:
        return <User size={24} className="text-gray-600 group-hover:text-green-600" />;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        {/* Верхня частина шапки з логотипом та пошуком */}
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center"
              onClick={handleNavigation}
            >
              <svg viewBox="0 0 200 50" className="h-10 w-40">
                <path
                  d="M10 10 L40 10 M25 10 L25 40"
                  stroke="#059669"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <circle
                  cx="65"
                  cy="25"
                  r="15"
                  stroke="#059669"
                  strokeWidth="8"
                  fill="none"
                />
                <text
                  x="95"
                  y="35"
                  fontFamily="Arial"
                  fontWeight="bold"
                  fontSize="30"
                  fill="#1F2937"
                >
                  AGRO
                </text>
                <path
                  d="M160 15 Q170 5, 180 15 Q170 25, 160 15"
                  fill="#059669"
                />
              </svg>
            </Link>
          </div>

          {/* Пошук - показується тільки на середніх та великих екранах */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Знайти техніку або запчастини..."
                  className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-green-500"
                >
                  <Search size={20} />
                </button>
              </div>
            </form>
          </div>

          {/* Навігація - показується тільки на середніх та великих екранах */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {/* Іконка порівняння */}
                <div className="flex items-center cursor-pointer group">
                  <Link
                    to="/profile/compare"
                    className="flex items-center"
                    onClick={handleNavigation}
                  >
                    <ShoppingCart
                      className="text-gray-600 group-hover:text-green-600"
                      size={24}
                    />
                    <span className="ml-2 text-sm text-gray-600 group-hover:text-green-600 hidden lg:inline">
                      Порівняти
                    </span>
                  </Link>
                </div>

                {/* Іконка повідомлень */}
                <div className="flex items-center cursor-pointer group relative">
                  <Link
                    to="/chat"
                    className="flex items-center"
                    onClick={handleNavigation}
                  >
                    <MessageSquare
                      className="text-gray-600 group-hover:text-green-600"
                      size={24}
                    />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                    <span className="ml-2 text-sm text-gray-600 group-hover:text-green-600 hidden lg:inline">
                      Повідомлення
                    </span>
                  </Link>
                </div>

                {/* Іконка профілю з випадаючим меню */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center cursor-pointer group"
                  >
                    {getProfileIcon()}
                    <span className="ml-2 text-gray-600 group-hover:text-green-600">
                      {user?.name.split(" ")[0]}
                      {user?.role === "ADMIN" && (
                        <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                          Адмін
                        </span>
                      )}
                      {user?.role === "MODERATOR" && (
                        <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                          Модератор
                        </span>
                      )}
                    </span>
                    <ChevronDown size={16} className="ml-1 text-gray-400" />
                  </button>

                  {/* Меню користувача */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <div className="py-1">
                        {renderProfileMenuItems()}
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Вийти
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-green-600"
                  onClick={handleNavigation}
                >
                  Увійти
                </Link>
                <Link
                  to="/register"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  onClick={handleNavigation}
                >
                  Реєстрація
                </Link>
              </>
            )}
          </div>

          {/* Кнопка мобільного меню - показується тільки на малих екранах */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-green-600 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Мобільний пошук - показується тільки на малих екранах */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <input
                type="text"
                placeholder="Знайти техніку або запчастини..."
                className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-3 top-2.5 text-gray-400 hover:text-green-500"
              >
                <Search size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Категорії навігації */}
      <nav className="bg-green-600 text-white">
        <div className="container mx-auto px-4">
          <div className="hidden md:flex items-center space-x-8 h-12">
            <div
              className="flex items-center cursor-pointer hover:bg-green-700 px-4 h-full relative"
              onMouseEnter={() => setIsCategoryMenuOpen(true)}
              onMouseLeave={() => setIsCategoryMenuOpen(false)}
            >
              <Menu size={20} className="mr-2" />
              <span>Каталог</span>
              <ChevronDown size={16} className="ml-2" />

              {/* Випадаюче меню категорій */}
              {isCategoryMenuOpen && (
                <div className="absolute top-full left-0 mt-0 w-64 bg-white border border-gray-200 rounded-b-md shadow-lg z-50 text-gray-700">
                  <div className="py-2">
                    {categoryTree.map((category) => (
                      <div key={category.id} className="relative group">
                        <Link
                          to={`/catalog/${category.slug}`}
                          className="block px-4 py-2 hover:bg-gray-100"
                          onClick={handleNavigation}
                        >
                          {category.name}
                          {category.children &&
                            category.children.length > 0 && (
                              <ChevronDown
                                size={16}
                                className="absolute right-4 top-3"
                              />
                            )}
                        </Link>

                        {/* Підменю для підкатегорій */}
                        {category.children && category.children.length > 0 && (
                          <div className="absolute left-full top-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 hidden group-hover:block">
                            <div className="py-2">
                              {category.children.map((subCategory) => (
                                <Link
                                  key={subCategory.id}
                                  to={`/catalog/${subCategory.slug}`}
                                  className="block px-4 py-2 hover:bg-gray-100"
                                  onClick={handleNavigation}
                                >
                                  {subCategory.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/new"
              className="hover:text-green-200"
              onClick={handleNavigation}
            >
              Нова техніка
            </Link>
            <Link
              to="/used"
              className="hover:text-green-200"
              onClick={handleNavigation}
            >
              Вживана техніка
            </Link>
            <Link
              to="/catalog?category=parts"
              className="hover:text-green-200"
              onClick={handleNavigation}
            >
              Запчастини
            </Link>
            <Link
              to="/catalog?category=service"
              className="hover:text-green-200"
              onClick={handleNavigation}
            >
              Сервіс
            </Link>

            {isAuthenticated && (
              <Link
                to="/listings/create"
                className="hover:text-green-200"
                onClick={handleNavigation}
              >
                Продати техніку
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Мобільне меню */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-4">
              <Link
                to="/catalog?category=new"
                className="text-gray-700 hover:text-green-600"
                onClick={handleNavigation}
              >
                Нова техніка
              </Link>
              <Link
                to="/catalog?category=used"
                className="text-gray-700 hover:text-green-600"
                onClick={handleNavigation}
              >
                Вживана техніка
              </Link>
              <Link
                to="/catalog?category=parts"
                className="text-gray-700 hover:text-green-600"
                onClick={handleNavigation}
              >
                Запчастини
              </Link>
              <Link
                to="/catalog?category=service"
                className="text-gray-700 hover:text-green-600"
                onClick={handleNavigation}
              >
                Сервіс
              </Link>

              <div className="border-t border-gray-200 my-2 pt-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to={getProfileUrl()}
                      className="block py-2 text-gray-700 hover:text-green-600"
                      onClick={handleNavigation}
                    >
                      {user?.role === "ADMIN" || user?.role === "MODERATOR" 
                        ? "Панель управління" 
                        : "Мій профіль"}
                      {user?.role === "ADMIN" && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                          Адмін
                        </span>
                      )}
                      {user?.role === "MODERATOR" && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                          Модератор
                        </span>
                      )}
                    </Link>
                    
                    {/* Додаткові пункти меню в залежності від ролі */}
                    {user?.role === "ADMIN" && (
                      <>
                        <Link
                          to="/admin/companies"
                          className="block py-2 text-gray-700 hover:text-green-600"
                          onClick={handleNavigation}
                        >
                          Компанії
                        </Link>
                        <Link
                          to="/admin/users"
                          className="block py-2 text-gray-700 hover:text-green-600"
                          onClick={handleNavigation}
                        >
                          Користувачі
                        </Link>
                      </>
                    )}
                    
                    {user?.role === "MODERATOR" && (
                      <>
                        <Link
                          to="/moderator/verification"
                          className="block py-2 text-gray-700 hover:text-green-600"
                          onClick={handleNavigation}
                        >
                          Верифікація компаній
                        </Link>
                        <Link
                          to="/moderator/listings"
                          className="block py-2 text-gray-700 hover:text-green-600"
                          onClick={handleNavigation}
                        >
                          Модерація оголошень
                        </Link>
                      </>
                    )}
                    
                    {user?.role === "COMPANY" && (
                      <>
                        <Link
                          to="/company/settings"
                          className="block py-2 text-gray-700 hover:text-green-600"
                          onClick={handleNavigation}
                        >
                          Налаштування компанії
                        </Link>
                        <Link
                          to="/company/documents"
                          className="block py-2 text-gray-700 hover:text-green-600"
                          onClick={handleNavigation}
                        >
                          Документи компанії
                        </Link>
                      </>
                    )}
                    
                    <Link
                      to="/profile/listings"
                      className="block py-2 text-gray-700 hover:text-green-600"
                      onClick={handleNavigation}
                    >
                      Мої оголошення
                    </Link>
                    <Link
                      to="/chat"
                      className="block py-2 text-gray-700 hover:text-green-600 relative"
                      onClick={handleNavigation}
                    >
                      Повідомлення
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/listings/create"
                      className="block py-2 text-gray-700 hover:text-green-600"
                      onClick={handleNavigation}
                    >
                      Додати оголошення
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block py-2 text-red-600 hover:text-red-700"
                    >
                      Вийти
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block py-2 text-gray-700 hover:text-green-600"
                      onClick={handleNavigation}
                    >
                      Увійти
                    </Link>
                    <Link
                      to="/register"
                      className="block py-2 text-gray-700 hover:text-green-600"
                      onClick={handleNavigation}
                    >
                      Реєстрація
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;


// import { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {useAuth} from "../../context/AuthContext";
// import {
//   Search,
//   Menu,
//   X,
//   User,
//   MessageSquare,
//   ShoppingCart,
//   ChevronDown,
// } from "lucide-react";

// import { useAppDispatch, useAppSelector } from "../../store";
// import { fetchCategories, fetchCategoryTree } from "../../store/catalogSlice";
// import { chatAPI } from "../../api/apiClient";

// const Header = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
//   const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);

//   const { isAuthenticated, user, logout } = useAuth();
//   const navigate = useNavigate();
//   const dispatch = useAppDispatch();

//   const { categories, categoryTree } = useAppSelector((state) => state.catalog);

//   // Завантаження категорій при першому рендері
//   useEffect(() => {
//     if (categories.length === 0) {
//       dispatch(fetchCategories());
//       dispatch(fetchCategoryTree());
//     }
//   }, [dispatch, categories.length]);

//   // Отримання кількості непрочитаних повідомлень для авторизованих користувачів
//   useEffect(() => {
//     if (isAuthenticated) {
//       const fetchUnreadCount = async () => {
//         try {
//           const response = await chatAPI.getUnreadCount();
//           setUnreadCount(response.data.data.count);
//         } catch (error) {
//           console.error("Error fetching unread messages count:", error);
//         }
//       };

//       fetchUnreadCount();

//       // Встановлюємо інтервал для періодичного оновлення
//       const interval = setInterval(fetchUnreadCount, 60000); // Оновлення кожну хвилину

//       return () => clearInterval(interval);
//     }
//     return undefined;
//   }, [isAuthenticated]);

//   // Обробник пошуку
//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (searchTerm.trim()) {
//       navigate(`/catalog?search=${encodeURIComponent(searchTerm)}`);
//       setSearchTerm("");
//     }
//   };

//   // Закриття меню при навігації
//   const handleNavigation = () => {
//     setIsMenuOpen(false);
//     setIsCategoryMenuOpen(false);
//     setIsUserMenuOpen(false);
//   };

//   // Обробник виходу
//   const handleLogout = () => {
//     logout();
//     handleNavigation();
//     navigate("/");
//   };

//   return (
//     <header className="bg-white border-b border-gray-200">
//       <div className="container mx-auto px-4">
//         {/* Верхня частина шапки з логотипом та пошуком */}
//         <div className="flex items-center justify-between h-16">
//           {/* Логотип */}
//           <div className="flex items-center">
//             <Link
//               to="/"
//               className="flex items-center"
//               onClick={handleNavigation}
//             >
//               <svg viewBox="0 0 200 50" className="h-10 w-40">
//                 <path
//                   d="M10 10 L40 10 M25 10 L25 40"
//                   stroke="#059669"
//                   strokeWidth="8"
//                   strokeLinecap="round"
//                 />
//                 <circle
//                   cx="65"
//                   cy="25"
//                   r="15"
//                   stroke="#059669"
//                   strokeWidth="8"
//                   fill="none"
//                 />
//                 <text
//                   x="95"
//                   y="35"
//                   fontFamily="Arial"
//                   fontWeight="bold"
//                   fontSize="30"
//                   fill="#1F2937"
//                 >
//                   AGRO
//                 </text>
//                 <path
//                   d="M160 15 Q170 5, 180 15 Q170 25, 160 15"
//                   fill="#059669"
//                 />
//               </svg>
//             </Link>
//           </div>

//           {/* Пошук - показується тільки на середніх та великих екранах */}
//           <div className="hidden md:flex flex-1 max-w-2xl mx-8">
//             <form onSubmit={handleSearch} className="w-full">
//               <div className="relative">
//                 <input
//                   type="text"
//                   placeholder="Знайти техніку або запчастини..."
//                   className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//                 <button
//                   type="submit"
//                   className="absolute right-3 top-2.5 text-gray-400 hover:text-green-500"
//                 >
//                   <Search size={20} />
//                 </button>
//               </div>
//             </form>
//           </div>

//           {/* Навігація - показується тільки на середніх та великих екранах */}
//           <div className="hidden md:flex items-center space-x-6">
//             {isAuthenticated ? (
//               <>
//                 {/* Іконка порівняння */}
//                 <div className="flex items-center cursor-pointer group">
//                   <Link
//                     to="/profile/compare"
//                     className="flex items-center"
//                     onClick={handleNavigation}
//                   >
//                     <ShoppingCart
//                       className="text-gray-600 group-hover:text-green-600"
//                       size={24}
//                     />
//                     <span className="ml-2 text-sm text-gray-600 group-hover:text-green-600 hidden lg:inline">
//                       Порівняти
//                     </span>
//                   </Link>
//                 </div>

//                 {/* Іконка повідомлень */}
//                 <div className="flex items-center cursor-pointer group relative">
//                   <Link
//                     to="/chat"
//                     className="flex items-center"
//                     onClick={handleNavigation}
//                   >
//                     <MessageSquare
//                       className="text-gray-600 group-hover:text-green-600"
//                       size={24}
//                     />
//                     {unreadCount > 0 && (
//                       <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//                         {unreadCount > 9 ? "9+" : unreadCount}
//                       </span>
//                     )}
//                     <span className="ml-2 text-sm text-gray-600 group-hover:text-green-600 hidden lg:inline">
//                       Повідомлення
//                     </span>
//                   </Link>
//                 </div>

//                 {/* Іконка профілю з випадаючим меню */}
//                 <div className="relative">
//                   <button
//                     onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
//                     className="flex items-center cursor-pointer group"
//                   >
//                     <User
//                       className="text-gray-600 group-hover:text-green-600"
//                       size={24}
//                     />
//                     <span className="ml-2 text-gray-600 group-hover:text-green-600">
//                       {user?.name.split(" ")[0]}
//                     </span>
//                     <ChevronDown size={16} className="ml-1 text-gray-400" />
//                   </button>

//                   {/* Меню користувача */}
//                   {isUserMenuOpen && (
//                     <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
//                       <div className="py-1">
//                         <Link
//                           to="/profile"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                           onClick={handleNavigation}
//                         >
//                           Мій профіль
//                         </Link>
//                         <Link
//                           to="/profile/listings"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                           onClick={handleNavigation}
//                         >
//                           Мої оголошення
//                         </Link>
//                         <Link
//                           to="/listings/create"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                           onClick={handleNavigation}
//                         >
//                           Додати оголошення
//                         </Link>
//                         <button
//                           onClick={handleLogout}
//                           className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
//                         >
//                           Вийти
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </>
//             ) : (
//               <>
//                 <Link
//                   to="/login"
//                   className="text-gray-600 hover:text-green-600"
//                   onClick={handleNavigation}
//                 >
//                   Увійти
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
//                   onClick={handleNavigation}
//                 >
//                   Реєстрація
//                 </Link>
//               </>
//             )}
//           </div>

//           {/* Кнопка мобільного меню - показується тільки на малих екранах */}
//           <div className="md:hidden flex items-center">
//             <button
//               onClick={() => setIsMenuOpen(!isMenuOpen)}
//               className="text-gray-600 hover:text-green-600 focus:outline-none"
//             >
//               {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
//             </button>
//           </div>
//         </div>

//         {/* Мобільний пошук - показується тільки на малих екранах */}
//         <div className="md:hidden pb-4">
//           <form onSubmit={handleSearch} className="w-full">
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Знайти техніку або запчастини..."
//                 className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               <button
//                 type="submit"
//                 className="absolute right-3 top-2.5 text-gray-400 hover:text-green-500"
//               >
//                 <Search size={20} />
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>

//       {/* Категорії навігації */}
//       <nav className="bg-green-600 text-white">
//         <div className="container mx-auto px-4">
//           <div className="hidden md:flex items-center space-x-8 h-12">
//             <div
//               className="flex items-center cursor-pointer hover:bg-green-700 px-4 h-full relative"
//               onMouseEnter={() => setIsCategoryMenuOpen(true)}
//               onMouseLeave={() => setIsCategoryMenuOpen(false)}
//             >
//               <Menu size={20} className="mr-2" />
//               <span>Каталог</span>
//               <ChevronDown size={16} className="ml-2" />

//               {/* Випадаюче меню категорій */}
//               {isCategoryMenuOpen && (
//                 <div className="absolute top-full left-0 mt-0 w-64 bg-white border border-gray-200 rounded-b-md shadow-lg z-50 text-gray-700">
//                   <div className="py-2">
//                     {categoryTree.map((category) => (
//                       <div key={category.id} className="relative group">
//                         <Link
//                           to={`/catalog/${category.slug}`}
//                           className="block px-4 py-2 hover:bg-gray-100"
//                           onClick={handleNavigation}
//                         >
//                           {category.name}
//                           {category.children &&
//                             category.children.length > 0 && (
//                               <ChevronDown
//                                 size={16}
//                                 className="absolute right-4 top-3"
//                               />
//                             )}
//                         </Link>

//                         {/* Підменю для підкатегорій */}
//                         {category.children && category.children.length > 0 && (
//                           <div className="absolute left-full top-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 hidden group-hover:block">
//                             <div className="py-2">
//                               {category.children.map((subCategory) => (
//                                 <Link
//                                   key={subCategory.id}
//                                   to={`/catalog/${subCategory.slug}`}
//                                   className="block px-4 py-2 hover:bg-gray-100"
//                                   onClick={handleNavigation}
//                                 >
//                                   {subCategory.name}
//                                 </Link>
//                               ))}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <Link
//               to="/new"
//               className="hover:text-green-200"
//               onClick={handleNavigation}
//             >
//               Нова техніка
//             </Link>
//             <Link
//               to="/used"
//               className="hover:text-green-200"
//               onClick={handleNavigation}
//             >
//               Вживана техніка
//             </Link>
//             <Link
//               to="/catalog?category=parts"
//               className="hover:text-green-200"
//               onClick={handleNavigation}
//             >
//               Запчастини
//             </Link>
//             <Link
//               to="/catalog?category=service"
//               className="hover:text-green-200"
//               onClick={handleNavigation}
//             >
//               Сервіс
//             </Link>

//             {isAuthenticated && (
//               <Link
//                 to="/listings/create"
//                 className="hover:text-green-200"
//                 onClick={handleNavigation}
//               >
//                 Продати техніку
//               </Link>
//             )}
//           </div>
//         </div>
//       </nav>

//       {/* Мобільне меню */}
//       {isMenuOpen && (
//         <div className="md:hidden bg-white border-t border-gray-200 z-50">
//           <div className="container mx-auto px-4 py-4">
//             <div className="flex flex-col space-y-4">
//               <Link
//                 to="/catalog?category=new"
//                 className="text-gray-700 hover:text-green-600"
//                 onClick={handleNavigation}
//               >
//                 Нова техніка
//               </Link>
//               <Link
//                 to="/catalog?category=used"
//                 className="text-gray-700 hover:text-green-600"
//                 onClick={handleNavigation}
//               >
//                 Вживана техніка
//               </Link>
//               <Link
//                 to="/catalog?category=parts"
//                 className="text-gray-700 hover:text-green-600"
//                 onClick={handleNavigation}
//               >
//                 Запчастини
//               </Link>
//               <Link
//                 to="/catalog?category=service"
//                 className="text-gray-700 hover:text-green-600"
//                 onClick={handleNavigation}
//               >
//                 Сервіс
//               </Link>

//               <div className="border-t border-gray-200 my-2 pt-2">
//                 {isAuthenticated ? (
//                   <>
//                     <Link
//                       to="/profile"
//                       className="block py-2 text-gray-700 hover:text-green-600"
//                       onClick={handleNavigation}
//                     >
//                       Мій профіль
//                     </Link>
//                     <Link
//                       to="/profile/listings"
//                       className="block py-2 text-gray-700 hover:text-green-600"
//                       onClick={handleNavigation}
//                     >
//                       Мої оголошення
//                     </Link>
//                     <Link
//                       to="/chat"
//                       className="block py-2 text-gray-700 hover:text-green-600 relative"
//                       onClick={handleNavigation}
//                     >
//                       Повідомлення
//                       {unreadCount > 0 && (
//                         <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
//                           {unreadCount}
//                         </span>
//                       )}
//                     </Link>
//                     <Link
//                       to="/listings/create"
//                       className="block py-2 text-gray-700 hover:text-green-600"
//                       onClick={handleNavigation}
//                     >
//                       Додати оголошення
//                     </Link>
//                     <button
//                       onClick={handleLogout}
//                       className="block py-2 text-red-600 hover:text-red-700"
//                     >
//                       Вийти
//                     </button>
//                   </>
//                 ) : (
//                   <>
//                     <Link
//                       to="/login"
//                       className="block py-2 text-gray-700 hover:text-green-600"
//                       onClick={handleNavigation}
//                     >
//                       Увійти
//                     </Link>
//                     <Link
//                       to="/register"
//                       className="block py-2 text-gray-700 hover:text-green-600"
//                       onClick={handleNavigation}
//                     >
//                       Реєстрація
//                     </Link>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </header>
//   );
// };

// export default Header;
