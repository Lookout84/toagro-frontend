import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Відображаємо індикатор завантаження під час перевірки автентифікації
  if (isLoading) {
    return <Loader />;
  }

  // Якщо користувач не автентифікований, перенаправляємо на сторінку входу
  // із збереженням шляху, на який намагався потрапити користувач
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Якщо користувач автентифікований, відображаємо дочірні елементи
  return <>{children}</>;
};

export default ProtectedRoute;