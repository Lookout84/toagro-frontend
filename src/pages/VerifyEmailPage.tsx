import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { authAPI } from "../api/apiClient";
import { CheckCircle, XCircle, Loader } from "lucide-react";

const VerifyEmailPage = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Токен підтвердження не надано");
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);
        setStatus("success");
        setMessage(response.data.message || "Електронну пошту успішно підтверджено!");
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error.response?.data?.message || 
          "Не вдалося підтвердити електронну пошту. Можливо, токен недійсний або закінчився термін його дії."
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className={`p-6 text-center ${
          status === "loading" 
            ? "bg-blue-50" 
            : status === "success" 
              ? "bg-green-50" 
              : "bg-red-50"
        }`}>
          {status === "loading" ? (
            <Loader className="h-16 w-16 text-blue-500 mx-auto animate-spin" />
          ) : status === "success" ? (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          )}
          
          <h2 className="text-2xl font-bold mt-4 mb-2 text-gray-900">
            {status === "loading" 
              ? "Підтвердження електронної пошти..." 
              : status === "success" 
                ? "Пошту підтверджено!" 
                : "Помилка підтвердження"}
          </h2>
          
          <p className={`mb-6 ${
            status === "loading" 
              ? "text-blue-700" 
              : status === "success" 
                ? "text-green-700" 
                : "text-red-700"
          }`}>
            {message || (status === "loading" ? "Перевірка вашого токену..." : "")}
          </p>
          
          {status !== "loading" && (
            <div className="mt-6">
              {status === "success" ? (
                <Link
                  to="/login"
                  className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Увійти до облікового запису
                </Link>
              ) : (
                <div className="space-y-4">
                  <Link
                    to="/login"
                    className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Спробувати увійти
                  </Link>
                  
                  <div className="block text-gray-600 mt-4">
                    Проблеми з підтвердженням?{" "}
                    <Link to="/contact" className="text-blue-600 hover:underline">
                      Зв&#39;язатися з підтримкою
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;