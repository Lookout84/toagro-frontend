import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getToken } from "../utils/auth";
import { listingsAPI } from "../api/apiClient";

const TestAuthPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [apiTestResult, setApiTestResult] = useState<string>("");

  useEffect(() => {
    setToken(getToken());
  }, []);

  const testApiCall = async () => {
    setApiTestResult("Тестування...");
    try {
      const response = await listingsAPI.getById(10);
      setApiTestResult(`✅ Успішно: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      setApiTestResult(`❌ Помилка: ${error.message || error}`);
    }
  };

  const testUpdateCall = async () => {
    setApiTestResult("Тестування оновлення...");
    try {
      const formData = new FormData();
      formData.append("title", "Test Update from Frontend");
      
      const response = await listingsAPI.update(10, formData);
      setApiTestResult(`✅ Оновлення успішне: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      setApiTestResult(`❌ Помилка оновлення: ${error.response?.data?.message || error.message || error}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Тест авторизації</h1>
      
      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Стан авторизації</h2>
          
          <div className="space-y-2">
            <p><strong>Авторизований:</strong> {isAuthenticated ? "✅ Так" : "❌ Ні"}</p>
            <p><strong>Користувач:</strong> {user ? `${user.name} (${user.email})` : "Немає"}</p>
            <p><strong>Токен:</strong> {token ? `${token.substring(0, 20)}...` : "Немає"}</p>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Тестування API</h2>
          
          <div className="space-x-4 mb-4">
            <button
              onClick={testApiCall}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Тестувати GET запит
            </button>
            
            <button
              onClick={testUpdateCall}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Тестувати PUT запит
            </button>
          </div>
          
          {apiTestResult && (
            <div className="bg-gray-50 border rounded p-4">
              <pre className="text-sm whitespace-pre-wrap">{apiTestResult}</pre>
            </div>
          )}
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Дії</h2>
          
          <div className="space-x-4">
            <a 
              href="/login" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
            >
              Увійти в систему
            </a>
            
            <a 
              href="/profile/listings/edit/10" 
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 inline-block"
            >
              Перейти до редагування
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAuthPage;