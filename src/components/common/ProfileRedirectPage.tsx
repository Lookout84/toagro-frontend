import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loader from "../common/Loader";

/**
 * Компонент для перенаправлення користувачів на відповідні сторінки профілю
 * в залежності від їхньої ролі
 */
const ProfileRedirectPage: React.FC = () => {
  const { user } = useAuth();
  const loading = user === undefined;
  const navigate = useNavigate();
  
  useEffect(() => {
    // Якщо дані користувача завантажені
    if (!loading && user) {
      // Якщо роль користувача - компанія, перенаправляємо на профіль компанії
      if (user.role === "COMPANY") {
        navigate("/company", { replace: true });
      } 
      // Якщо роль - адміністратор, перенаправляємо на панель адміністратора
      else if (user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } 
      // В інших випадках перенаправляємо на звичайний профіль користувача
      else {
        navigate("/profile", { replace: true });
      }
    } 
    // Якщо користувач не авторизований, перенаправляємо на сторінку входу
    else if (!loading && !user) {
      navigate("/login", { replace: true, state: { from: "/profile" } });
    }
  }, [user, loading, navigate]);

  // Поки відбувається перевірка, показуємо завантажувач
  return <Loader />;
};

export default ProfileRedirectPage;