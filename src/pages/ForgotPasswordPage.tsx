import { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../api/apiClient";
import { Mail, ArrowLeft, AlertCircle } from "lucide-react";
import Button from "../components/common/Button";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form validation
  const validateForm = () => {
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = "Введіть email";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Введіть коректний email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authAPI.forgotPassword(email);
      setIsSuccess(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Помилка відправки запиту на відновлення паролю.";
      setErrors({ email: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 p-6">
          <h2 className="text-2xl font-bold text-white text-center">
            Відновлення паролю
          </h2>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="bg-green-100 text-green-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Mail size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Перевірте вашу електронну пошту</h3>
              <p className="text-gray-600 mb-6">
                Ми надіслали інструкції з відновлення паролю на адресу {email}. Будь ласка, перевірте вашу поштову скриньку.
              </p>
              <p className="text-gray-600 mb-4">
                Не отримали листа? Перевірте папку &quot;Спам&quot; або
                <button
                  className="text-green-600 hover:text-green-700 ml-1 underline"
                  onClick={() => {
                    setIsSuccess(false);
                    setIsSubmitting(false);
                  }}
                >
                  спробуйте ще раз
                </button>
              </p>
              <Link
                to="/login"
                className="inline-flex items-center text-green-600 hover:text-green-700"
              >
                <ArrowLeft size={16} className="mr-1" />
                Повернутися до входу
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Введіть адресу електронної пошти, яку ви використовували при реєстрації, і ми надішлемо вам інструкції з відновлення паролю.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label
                    htmlFor="email"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      placeholder="Введіть ваш email"
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  fullWidth
                >
                  {isSubmitting ? "Відправка..." : "Відновити пароль"}
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

export default ForgotPasswordPage;