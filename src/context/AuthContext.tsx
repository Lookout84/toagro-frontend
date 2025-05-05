import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "react-toastify";
import api from "../api/apiClient";

// Інтерфейси для типізації
export interface User {
  id: number;
  email: string;
  name: string;
  phoneNumber?: string;
  avatar?: string;
  role: string;
  isVerified: boolean;
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (formData: RegisterFormData) => Promise<void>;
  logout: () => void;
  updateUserProfile: (formData: UpdateProfileFormData) => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
}

export interface UpdateProfileFormData {
  name?: string;
  phoneNumber?: string;
  avatar?: string;
}

// Створення контексту з початковими значеннями
const AuthContext = createContext<AuthContextProps>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUserProfile: async () => {},
});

// Кастомний хук для використання контексту
export const useAuth = () => useContext(AuthContext);

// Провайдер контексту
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Перевірка та оновлення токена при завантаженні
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          setIsLoading(true);
          // Додаємо токен до заголовків всіх запитів
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Запитуємо дані про користувача
          const response = await api.get("/auth/me");
          setUser(response.data.data.user);
        } catch (err) {
          console.error("Token verification failed:", err);
          // Видаляємо невалідний токен
          localStorage.removeItem("token");
          setToken(null);
          delete api.defaults.headers.common["Authorization"];
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Функція для входу користувача
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post("/auth/login", { email, password });
      const { token: newToken, user: userData } = response.data.data;

      // Зберігаємо токен
      localStorage.setItem("token", newToken);
      setToken(newToken);

      // Встановлюємо токен для всіх наступних запитів
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      // Зберігаємо інформацію про користувача
      setUser(userData);

      toast.success("Вхід виконано успішно!");
    } catch (err: any) {
      console.error("Login failed:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Помилка входу. Перевірте логін та пароль.";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Функція для реєстрації користувача
  const register = async (formData: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post("/auth/register", formData);
      const { token: newToken, user: userData } = response.data.data;

      // Зберігаємо токен
      localStorage.setItem("token", newToken);
      setToken(newToken);

      // Встановлюємо токен для всіх наступних запитів
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      // Зберігаємо інформацію про користувача
      setUser(userData);

      toast.success(
        "Реєстрація успішна! На вашу пошту надіслано лист для підтвердження.",
      );
    } catch (err: any) {
      console.error("Registration failed:", err);
      const errorMessage =
        err.response?.data?.message || "Помилка реєстрації. Спробуйте ще раз.";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Функція для виходу користувача
  const logout = () => {
    // Видаляємо токен
    localStorage.removeItem("token");
    setToken(null);

    // Видаляємо заголовок авторизації
    delete api.defaults.headers.common["Authorization"];

    // Скидаємо інформацію про користувача
    setUser(null);

    toast.info("Ви вийшли з системи");
  };

  // Функція для оновлення профілю користувача
  const updateUserProfile = async (formData: UpdateProfileFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.put("/auth/me", formData);
      const { user: updatedUser } = response.data.data;

      // Оновлюємо інформацію про користувача
      setUser(updatedUser);

      toast.success("Профіль успішно оновлено!");
    } catch (err: any) {
      console.error("Profile update failed:", err);
      const errorMessage =
        err.response?.data?.message || "Помилка оновлення профілю.";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Передаємо значення в контекст
  const contextValue: AuthContextProps = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
