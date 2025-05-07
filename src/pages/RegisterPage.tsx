import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Обробник зміни полів форми
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Валідація форми
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Введіть ваше ім'я";
    }

    if (!formData.email) {
      newErrors.email = "Введіть email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Введіть коректний email";
    }

    if (
      formData.phoneNumber &&
      !/^(\+?38)?\d{10}$/.test(formData.phoneNumber.replace(/\s/g, ""))
    ) {
      newErrors.phoneNumber = "Введіть коректний номер телефону";
    }

    if (!formData.password) {
      newErrors.password = "Введіть пароль";
    } else if (formData.password.length < 6) {
      newErrors.password = "Пароль має бути не менше 6 символів";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Паролі не співпадають";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обробник подання форми
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Видаляємо поле confirmPassword перед відправкою
      const { confirmPassword: _confirmPassword, ...registerData } = formData;

      await register(registerData);
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 p-6">
          <h2 className="text-2xl font-bold text-white text-center">
            Реєстрація
          </h2>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Ім'я */}
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-gray-700 font-medium mb-2"
              >
                Ім&apos;я та прізвище
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Введіть ваше ім'я та прізвище"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
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
                  name="email"
                  placeholder="Введіть ваш email"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Телефон */}
            <div className="mb-4">
              <label
                htmlFor="phoneNumber"
                className="block text-gray-700 font-medium mb-2"
              >
                Номер телефону (необов&apos;язково)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone size={20} className="text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="+380 XX XXX XX XX"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.phoneNumber ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Пароль */}
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-gray-700 font-medium mb-2"
              >
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Створіть пароль"
                  className={`block w-full pl-10 pr-10 py-2 border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                  value={formData.password}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Підтвердження пароля */}
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-gray-700 font-medium mb-2"
              >
                Підтвердження пароля
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Повторіть пароль"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Кнопка реєстрації */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white font-medium py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Реєстрація..." : "Зареєструватися"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Вже маєте обліковий запис?{" "}
              <Link
                to="/login"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Увійти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
