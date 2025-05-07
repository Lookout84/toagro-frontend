import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../api/apiClient";
import { Lock, Eye, EyeOff, Shield, AlertCircle, CheckCircle } from "lucide-react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import FormInput from "../../components/common/FormInput";

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

const UserPasswordChangePage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = "Поточний пароль обов'язковий";
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = "Новий пароль обов'язковий";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Пароль має бути не менше 6 символів";
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = "Новий пароль має відрізнятися від поточного";
    }
    
    if (!formData.confirmNewPassword) {
      newErrors.confirmNewPassword = "Підтвердження паролю обов'язкове";
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = "Паролі не співпадають";
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
      await authAPI.changePassword(formData.currentPassword, formData.newPassword);
      setSuccessMessage("Пароль успішно змінено");
      
      // Clear form after successful submission
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      
      // Clear success message and redirect after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
        navigate("/profile");
      }, 3000);
    } catch (error: unknown) {
      let errorMessage = "Помилка зміни паролю";
      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } };
        errorMessage = err.response?.data?.message || errorMessage;
      }
      setErrors({
        ...errors,
        currentPassword: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Form input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Shield className="mr-2" size={24} />
          Зміна паролю
        </h2>
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center">
            <CheckCircle size={18} className="mr-2" />
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <FormInput
                label="Поточний пароль"
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={formData.currentPassword}
                onChange={handleInputChange}
                error={errors.currentPassword || ""}
                leftIcon={<Lock size={18} className="text-gray-400" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showCurrentPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
            
            <div className="relative">
              <FormInput
                label="Новий пароль"
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={handleInputChange}
                error={errors.newPassword || ""}
                leftIcon={<Lock size={18} className="text-gray-400" />}
                helper="Мінімум 6 символів"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
            
            <div className="relative">
              <FormInput
                label="Підтвердіть новий пароль"
                id="confirmNewPassword"
                name="confirmNewPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmNewPassword}
                onChange={handleInputChange}
                error={errors.confirmNewPassword || ""}
                leftIcon={<Lock size={18} className="text-gray-400" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
            
            <div className="flex mt-6 space-x-4">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Збереження..." : "Змінити пароль"}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
              >
                Скасувати
              </Button>
            </div>
          </div>
        </form>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2 flex items-center">
            <AlertCircle size={18} className="mr-2 text-gray-500" />
            Рекомендації щодо безпеки пароля:
          </h3>
          <ul className="list-disc pl-10 text-sm text-gray-600 space-y-1">
            <li>Використовуйте мінімум 8 символів (обов&#39;язковий мінімум - 6)</li>
            <li>Поєднуйте великі та малі літери</li>
            <li>Додавайте цифри та спеціальні символи (!, @, #, $ тощо)</li>
            <li>Не використовуйте особисту інформацію (дата народження, ім&#39;я)</li>
            <li>Не використовуйте однаковий пароль для різних сервісів</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default UserPasswordChangePage;