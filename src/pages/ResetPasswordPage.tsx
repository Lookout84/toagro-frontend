import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { authAPI } from "../api/apiClient";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Button from "../components/common/Button";

const ResetPasswordPage = () => {
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; token?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);

  // Check if token is provided
  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      setErrors({ token: "Токен відсутній або недійсний" });
    }
  }, [token]);

  // Form validation
  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = "Введіть пароль";
    } else if (password.length < 8) {
      newErrors.password = "Пароль має бути не менше 8 символів";
    } else if (!/\d/.test(password)) {
      newErrors.password = "Пароль має містити хоча б одну цифру";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Підтвердіть пароль";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Паролі не співпадають";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !isTokenValid) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authAPI.resetPassword(token, password);
      setIsSuccess(true);
      
      // Redirect to login page after successful password reset
      const redirectTimer = setTimeout(() => {
        navigate("/login", { replace: true });
      }, 5000);
      
      return () => clearTimeout(redirectTimer);
    } catch (error: unknown) {
      let errorMessage = "Помилка відновлення паролю";
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as { response?: { status?: number, data?: { message?: string } } };
        errorMessage = apiError.response?.data?.message || errorMessage;
        
        if (apiError.response?.status === 400 || apiError.response?.status === 404) {
          setIsTokenValid(false);
          setErrors({ token: errorMessage });
        } else {
          setErrors({ password: errorMessage });
        }
      } else {
        setErrors({ password: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If token is invalid, show error message
  if (!isTokenValid) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-red-600 p-6">
            <h2 className="text-2xl font-bold text-white text-center">
              Помилка відновлення паролю
            </h2>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <div className="bg-red-100 text-red-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Недійсний або застарілий токен</h3>
              <p className="text-gray-600 mb-6">
                {errors.token || "Посилання для відновлення паролю недійсне або термін його дії закінчився."}
              </p>
              <p className="text-gray-600 mb-6">
                Спробуйте знову запросити відновлення паролю.
              </p>
              <Link
                to="/forgot-password"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
              >
                Відновити пароль
              </Link>
              
              <div className="mt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center text-green-600 hover:text-green-700"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Повернутися до входу
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 p-6">
          <h2 className="text-2xl font-bold text-white text-center">
            Створення нового паролю
          </h2>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="bg-green-100 text-green-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Пароль змінено!</h3>
              <p className="text-gray-600 mb-6">
                Ваш пароль було успішно змінено. Зараз ви будете перенаправлені на сторінку входу.
              </p>
              <Link
                to="/login"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
              >
                Увійти зараз
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Будь ласка, створіть новий пароль для вашого облікового запису.
              </p>

              <form onSubmit={handleSubmit}>
                {/* Password field */}
                <div className="mb-4">
                  <label
                    htmlFor="password"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Новий пароль
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={20} className="text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="Введіть новий пароль"
                      className={`block w-full pl-10 pr-10 py-2 border ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.password}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Пароль повинен містити не менше 8 символів і хоча б одну цифру
                  </p>
                </div>

                {/* Confirm password field */}
                <div className="mb-6">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Підтвердження паролю
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={20} className="text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      placeholder="Підтвердіть пароль"
                      className={`block w-full pl-10 pr-10 py-2 border ${
                        errors.confirmPassword ? "border-red-500" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  fullWidth
                >
                  {isSubmitting ? "Збереження..." : "Встановити новий пароль"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-green-600 hover:text-green-700"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Повернутися до входу
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;