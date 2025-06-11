import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, Home, ArrowLeft, User, Building2, Settings, UserCog } from "lucide-react";
import { Button } from "../components/common";

/**
 * Сторінка, яка відображається при спробі доступу до захищеного ресурсу без необхідних прав
 */
const AccessDeniedPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Визначаємо, куди перенаправляти користувача в залежності від ролі
  const getRedirectLink = () => {
    if (!isAuthenticated) return "/login";
    
    switch (user?.role) {
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

  // Отримуємо іконку в залежності від ролі
  const getRoleIcon = () => {
    if (!isAuthenticated) return <User size={24} />;
    
    switch (user?.role) {
      case "ADMIN":
        return <UserCog size={24} className="text-green-700" />;
      case "MODERATOR":
        return <UserCog size={24} className="text-blue-600" />;
      case "COMPANY":
        return <Building2 size={24} />;
      default:
        return <User size={24} />;
    }
  };

  // Отримуємо назву ролі для відображення
  const getRoleName = () => {
    if (!isAuthenticated) return "гість";
    
    switch (user?.role) {
      case "ADMIN":
        return "адміністратор";
      case "MODERATOR":
        return "модератор";
      case "COMPANY":
        return "компанія";
      default:
        return "користувач";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <ShieldAlert size={48} className="text-red-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Доступ заборонено
          </h1>
          
          <p className="text-gray-600 text-center mb-6">
            У вас немає необхідних прав для доступу до цієї сторінки.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <div className="mr-3">
                {getRoleIcon()}
              </div>
              <div>
                <p className="text-sm text-gray-500">Ваша роль:</p>
                <p className="font-medium text-gray-900">{getRoleName()}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              icon={<ArrowLeft size={18} />}
              onClick={() => navigate(-1)}
            >
              Повернутися назад
            </Button>
            
            <Link to={getRedirectLink()}>
              <Button
                variant="outline"
                className="w-full"
                icon={user ? <Settings size={18} /> : <User size={18} />}
              >
                {user ? "Перейти до панелі управління" : "Увійти в систему"}
              </Button>
            </Link>
            
            <Link to="/">
              <Button
                variant="outline"
                className="w-full"
                icon={<Home size={18} />}
              >
                На головну сторінку
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-center text-gray-500 text-sm">
        Якщо ви вважаєте, що це помилка, будь ласка, зв&apos;яжіться з 
        <a href="mailto:support@toagro.com" className="text-green-600 hover:text-green-700 ml-1">
          службою підтримки
        </a>.
      </p>
    </div>
  );
};

export default AccessDeniedPage;