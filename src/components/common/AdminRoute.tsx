import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // Імпорт контексту автентифікації
import Loader from "./Loader";

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * Компонент для захисту адміністративних маршрутів
 * Дозволяє доступ тільки користувачам з роллю 'admin'
 */
const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Відображаємо індикатор завантаження під час перевірки автентифікації
  if (isLoading) {
    return <Loader />;
  }

  // Якщо користувач не автентифікований, перенаправляємо на сторінку входу
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Якщо користувач автентифікований, але не має прав адміністратора,
  // перенаправляємо на головну сторінку (або можна на сторінку "доступ заборонено")
  if (user && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Якщо користувач є адміністратором, відображаємо дочірні елементи
  return <>{children}</>;
};

export default AdminRoute;