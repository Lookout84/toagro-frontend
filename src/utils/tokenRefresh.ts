import { authAPI } from '../api/apiClient';
import { getToken, setToken } from './auth';

export async function ensureFreshToken(): Promise<boolean> {
  try {
    // Перевіряємо, чи є діючий токен
    const token = getToken();
    if (!token) {
      console.error("Токен відсутній");
      return false;
    }

    // Викликаємо API для оновлення токену
    const response = await authAPI.refreshToken();
    
    if (response.data && response.data.accessToken) {
      setToken(response.data.accessToken);
      console.log("Токен успішно оновлено");
      return true;
    }
    
    console.warn("Не отримано новий токен");
    return false;
  } catch (error) {
    console.error("Помилка оновлення токена:", error);
    return false;
  }
}