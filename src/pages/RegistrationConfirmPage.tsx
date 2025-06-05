import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Check, AlertTriangle } from "lucide-react";
import { Button, Alert } from "../components/common";
import api from "../api/apiClient";

const RegistrationConfirmPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const verifyAccount = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Недійсний токен підтвердження.");
        return;
      }

      try {
        const response = await api.post(`/auth/verify/${token}`);
        setStatus("success");
        setMessage(response.data.message || "Ваш обліковий запис успішно підтверджено!");
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error?.response?.data?.message || 
          "Помилка при підтвердженні облікового запису. Токен може бути недійсним або закінчився термін його дії."
        );
      }
    };

    verifyAccount();
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className={`p-6 ${
          status === "loading" ? "bg-blue-600" : 
          status === "success" ? "bg-green-600" : 
          "bg-red-600"
        }`}>
          <h2 className="text-2xl font-bold text-white text-center">
            {status === "loading" ? "Підтвердження реєстрації" : 
             status === "success" ? "Реєстрацію підтверджено" : 
             "Помилка підтвердження"}
          </h2>
        </div>

        <div className="p-6">
          {status === "loading" && (
            <div className="flex flex-col items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-600 text-center">
                Підтверджуємо ваш обліковий запис, будь ласка, зачекайте...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Check className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Реєстрацію успішно підтверджено!
              </h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="flex flex-col space-y-3">
                <Button 
                  variant="primary"
                  onClick={() => navigate("/login")}
                >
                  Увійти до облікового запису
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  На головну сторінку
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Виникла проблема!
              </h3>
              <Alert type="error" message={message} className="mb-6" />
              <div className="flex flex-col space-y-3">
                <Button 
                  variant="primary"
                  onClick={() => navigate("/register")}
                >
                  Повторити реєстрацію
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  На головну сторінку
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationConfirmPage;