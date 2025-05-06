import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { User, Save, AlertCircle } from "lucide-react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import FormInput from "../../components/common/FormInput";
import Loader from "../../components/common/Loader";

interface FormData {
  name: string;
  phoneNumber: string;
  avatar: string;
}

const UserProfileSettingsPage = () => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phoneNumber: "",
    avatar: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phoneNumber: user.phoneNumber || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);
  
  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Ім'я обов'язкове";
    }
    
    // Validate phone number format if provided
    if (formData.phoneNumber && !/^\+?[0-9]{10,15}$/.test(formData.phoneNumber.replace(/\s/g, ""))) {
      newErrors.phoneNumber = "Неправильний формат номера телефону";
    }
    
    // Validate avatar URL if provided
    if (formData.avatar && !/^(https?:\/\/)/.test(formData.avatar)) {
      newErrors.avatar = "URL повинен починатися з http:// або https://";
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
      await updateUserProfile(formData);
      setSuccessMessage("Профіль успішно оновлено");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
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
  
  if (!user) {
    return <Loader />;
  }
  
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <User className="mr-2" size={24} />
          Налаштування профілю
        </h2>
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center">
            <CheckCircle size={18} className="mr-2" />
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <FormInput
              label="Ім'я та прізвище"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              required
            />
            
            <FormInput
              label="Номер телефону"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              error={errors.phoneNumber}
              placeholder="+380 XX XXX XX XX"
              helper="Вкажіть номер телефону у форматі +380XXXXXXXXX"
            />
            
            <FormInput
              label="URL фото профілю"
              id="avatar"
              name="avatar"
              value={formData.avatar}
              onChange={handleInputChange}
              error={errors.avatar}
              placeholder="https://example.com/my-avatar.jpg"
              helper="Вкажіть URL-адресу зображення для вашого профілю"
            />
            
            {formData.avatar && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">Попередній перегляд:</p>
                <img 
                  src={formData.avatar} 
                  alt="Avatar preview" 
                  className="w-24 h-24 object-cover rounded-full border border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; 
                    target.src = "https://via.placeholder.com/100?text=Error";
                    setErrors({...errors, avatar: "Не вдалося завантажити зображення"});
                  }}
                />
              </div>
            )}
            
            <div className="flex mt-6 space-x-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                icon={<Save size={18} />}
              >
                {isSubmitting ? "Збереження..." : "Зберегти зміни"}
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
        
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
            <div className="flex items-center mb-2">
              <AlertCircle size={18} className="mr-2" />
              <p className="font-medium">Форма містить помилки:</p>
            </div>
            <ul className="list-disc pl-10">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

export default UserProfileSettingsPage;