// import { ReactNode } from "react";
// import { Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import Loader from "./Loader";

// interface ProtectedRouteProps {
//   children: ReactNode;
// }

// const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
//   const { isAuthenticated, isLoading } = useAuth();
//   const location = useLocation();

//   // Відображаємо індикатор завантаження під час перевірки автентифікації
//   if (isLoading) {
//     return <Loader />;
//   }

//   // Якщо користувач не автентифікований, перенаправляємо на сторінку входу
//   // із збереженням шляху, на який намагався потрапити користувач
//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   // Якщо користувач автентифікований, відображаємо дочірні елементи
//   return <>{children}</>;
// };

// export default ProtectedRoute;

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Якщо AuthContext ще завантажується, показуємо заглушку
  if (isLoading) {
    return <div>Завантаження...</div>;
  }

  // Якщо користувач не авторизований і маршрут захищений
  if (!isAuthenticated && requireAuth) {
    // Перенаправляємо на сторінку входу, зберігаючи інформацію про початковий URL
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Якщо користувач авторизований і намагається зайти на сторінку входу/реєстрації
  if (isAuthenticated && !requireAuth) {
    // Перенаправляємо на головну сторінку
    return <Navigate to="/" replace />;
  }

  // В інших випадках показуємо дочірні компоненти
  return <>{children}</>;
};

export default ProtectedRoute;