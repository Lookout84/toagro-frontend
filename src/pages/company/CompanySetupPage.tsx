import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building, Info, Check, ChevronRight, MapPin, Globe, Briefcase, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { companiesAPI } from "../../api/apiClient";
import { Button, Input, TextArea, Select, Alert } from "../../components/common";

// Визначення типів
interface CompanyFormData {
  companyName: string;
  companyCode: string; // ЄДРПОУ
  vatNumber: string; // ІПН (необов'язково)
  website: string; // (необов'язково)
  industry: string; // (необов'язково)
  foundedYear: string; // (необов'язково)
  size: "SMALL" | "MEDIUM" | "LARGE"; // (необов'язково)
  description: string; // (необов'язково)
  address: {
    country: string;
    region: string;
    city: string;
    street: string;
    postalCode: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    additionalPhone?: string;
  };
}

// Початкові значення форми
const initialFormData: CompanyFormData = {
  companyName: "",
  companyCode: "",
  vatNumber: "",
  website: "",
  industry: "",
  foundedYear: new Date().getFullYear().toString(),
  size: "SMALL",
  description: "",
  address: {
    country: "Україна",
    region: "",
    city: "",
    street: "",
    postalCode: "",
  },
  contactInfo: {
    email: "",
    phone: "",
    additionalPhone: "",
  },
};

// Галузі для вибору
const industries = [
  { value: "agriculture", label: "Сільське господарство" },
  { value: "machinery", label: "Сільськогосподарська техніка" },
  { value: "fertilizers", label: "Добрива та агрохімія" },
  { value: "seeds", label: "Насіння та селекція" },
  { value: "livestock", label: "Тваринництво" },
  { value: "food_processing", label: "Харчова промисловість" },
  { value: "logistics", label: "Логістика та транспорт" },
  { value: "consulting", label: "Консалтинг" },
  { value: "other", label: "Інше" },
];

// Основна функція компонента
const CompanySetupPage: React.FC = () => {
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [hasCompanyProfile, setHasCompanyProfile] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Перевірка чи користувач має профіль компанії
  useEffect(() => {
    const checkCompanyProfile = async () => {
      try {
        setIsLoading(true);
        const response = await companiesAPI.getMyCompany();
        
        if (response.data) {
          setHasCompanyProfile(true);
          navigate("/company");
        }
      } catch (error: any) {
        if (error.response && error.response.status !== 404) {
          setServerError("Помилка при перевірці даних компанії. Спробуйте ще раз пізніше.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Перевіряємо, чи користувач має роль компанії
    if (user && user.role === "COMPANY") {
      checkCompanyProfile();
      
      // Заповнюємо контактну інформацію з даних користувача
      setFormData(prevData => ({
        ...prevData,
        contactInfo: {
          ...prevData.contactInfo,
          email: user.email || "",
          phone: user.phoneNumber || "",
        }
      }));
    } else if (user && user.role !== "COMPANY") {
      setServerError("Для створення профілю компанії потрібно мати відповідні права. Зверніться до адміністратора.");
    }
  }, [user, navigate]);

  // Обробник зміни полів форми
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Обробка вкладених об'єктів
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => {
        if (
          parent === "address" &&
          child &&
          prev.address &&
          Object.prototype.hasOwnProperty.call(prev, parent)
        ) {
          return {
            ...prev,
            address: {
              ...prev.address,
              [child]: value,
            },
          };
        } else if (
          parent === "contactInfo" &&
          child &&
          prev.contactInfo &&
          Object.prototype.hasOwnProperty.call(prev, parent)
        ) {
          return {
            ...prev,
            contactInfo: {
              ...prev.contactInfo,
              [child]: value,
            },
          };
        } else {
          return prev;
        }
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Очищення помилок при зміні значення
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Валідація форми
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Перший крок - основна інформація
    if (currentStep === 1) {
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Введіть назву компанії";
        isValid = false;
      }

      if (!formData.companyCode.trim()) {
        newErrors.companyCode = "Введіть код ЄДРПОУ";
        isValid = false;
      } else if (!/^\d{8}$/.test(formData.companyCode.trim())) {
        newErrors.companyCode = "Код ЄДРПОУ має містити 8 цифр";
        isValid = false;
      }

      if (formData.vatNumber && !/^\d{10}$/.test(formData.vatNumber.trim())) {
        newErrors.vatNumber = "ІПН має містити 10 цифр";
        isValid = false;
      }

      if (formData.website && 
          !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/.test(formData.website)) {
        newErrors.website = "Введіть коректний URL";
        isValid = false;
      }
    }

    // Другий крок - адреса та контактна інформація
    if (currentStep === 2) {
      if (!formData.address.country.trim()) {
        newErrors["address.country"] = "Введіть країну";
        isValid = false;
      }

      if (!formData.address.city.trim()) {
        newErrors["address.city"] = "Введіть місто";
        isValid = false;
      }

      if (!formData.contactInfo.email.trim()) {
        newErrors["contactInfo.email"] = "Введіть email";
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
        newErrors["contactInfo.email"] = "Введіть коректний email";
        isValid = false;
      }

      if (!formData.contactInfo.phone.trim()) {
        newErrors["contactInfo.phone"] = "Введіть номер телефону";
        isValid = false;
      } else if (!/^(\+?38)?\d{10}$/.test(formData.contactInfo.phone.replace(/\s/g, ""))) {
        newErrors["contactInfo.phone"] = "Введіть коректний номер телефону";
        isValid = false;
      }

      if (formData.contactInfo.additionalPhone && 
          !/^(\+?38)?\d{10}$/.test(formData.contactInfo.additionalPhone.replace(/\s/g, ""))) {
        newErrors["contactInfo.additionalPhone"] = "Введіть коректний номер телефону";
        isValid = false;
      }
    }

    // Третій крок - додаткова інформація (необов'язкова, без валідації)

    setErrors(newErrors);
    return isValid;
  };

  // Обробка кнопки "Далі"
  const handleNextStep = () => {
    if (validateForm()) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  // Обробка кнопки "Назад"
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  // Обробка відправки форми
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валідація останнього кроку
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setServerError(null);

    try {
      // Підготовка даних для відправки на сервер
      const companyData: any = {
        companyName: formData.companyName,
        companyCode: formData.companyCode,
        size: formData.size,
        address: {
          country: formData.address.country,
          city: formData.address.city,
        },
        contactInfo: {
          email: formData.contactInfo.email,
          phone: formData.contactInfo.phone,
        },
      };

      if (formData.vatNumber) companyData.vatNumber = formData.vatNumber;
      if (formData.website) companyData.website = formData.website;
      if (formData.industry) companyData.industry = formData.industry;
      if (formData.foundedYear) companyData.foundedYear = parseInt(formData.foundedYear);
      if (formData.description) companyData.description = formData.description;

      if (formData.address.region) companyData.address.region = formData.address.region;
      if (formData.address.street) companyData.address.street = formData.address.street;
      if (formData.address.postalCode) companyData.address.postalCode = formData.address.postalCode;

      if (formData.contactInfo.additionalPhone) companyData.contactInfo.additionalPhone = formData.contactInfo.additionalPhone;

      // Відправка на сервер
      await companiesAPI.create(companyData);

      // Встановлюємо статус успіху
      setSuccess(true);

      // Перенаправлення на сторінку з документами
      setTimeout(() => {
        navigate("/company/documents");
      }, 2000);
    } catch (error: any) {
      console.error("Error creating company profile:", error);
      
      if (error.response) {
        if (error.response.status === 400) {
          // Валідаційні помилки
          if (error.response.data?.errors) {
            const serverErrors: Record<string, string> = {};
            
            Object.entries(error.response.data.errors).forEach(([key, value]) => {
              serverErrors[key] = Array.isArray(value) ? value[0] : value as string;
            });
            
            setErrors(prev => ({ ...prev, ...serverErrors }));
          } else {
            setServerError(error.response.data?.message || "Неправильні дані компанії");
          }
        } else if (error.response.status === 409) {
          // Конфлікт (наприклад, компанія з таким ЄДРПОУ вже існує)
          if (error.response.data?.message?.includes("companyCode") || error.response.data?.message?.includes("ЄДРПОУ")) {
            setErrors(prev => ({ ...prev, companyCode: "Компанія з таким кодом ЄДРПОУ вже зареєстрована" }));
          } else if (error.response.data?.message?.includes("vatNumber") || error.response.data?.message?.includes("ІПН")) {
            setErrors(prev => ({ ...prev, vatNumber: "Компанія з таким ІПН вже зареєстрована" }));
          } else {
            setServerError(error.response.data?.message || "Компанія з такими даними вже існує");
          }
        } else {
          setServerError("Помилка при створенні профілю компанії. Спробуйте пізніше.");
        }
      } else {
        setServerError("Не вдалося з'єднатися з сервером. Перевірте з'єднання.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Генерація років для select
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 100; year--) {
      years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
  };

  // Відображення прогресу за кроками
  const renderStepProgress = () => {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className={`flex flex-col items-center ${currentStep >= 1 ? "text-green-600" : "text-gray-400"}`}>
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
              ${currentStep >= 1 ? "border-green-600 bg-green-100" : "border-gray-300"}`}
            >
              {currentStep > 1 ? <Check size={16} /> : "1"}
            </div>
            <span className="text-xs mt-1">Основна інформація</span>
          </div>
          
          <div className={`w-full mx-2 h-1 ${currentStep >= 2 ? "bg-green-600" : "bg-gray-300"}`} />
          
          <div className={`flex flex-col items-center ${currentStep >= 2 ? "text-green-600" : "text-gray-400"}`}>
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
              ${currentStep >= 2 ? "border-green-600 bg-green-100" : "border-gray-300"}`}
            >
              {currentStep > 2 ? <Check size={16} /> : "2"}
            </div>
            <span className="text-xs mt-1">Контактні дані</span>
          </div>
          
          <div className={`w-full mx-2 h-1 ${currentStep >= 3 ? "bg-green-600" : "bg-gray-300"}`} />
          
          <div className={`flex flex-col items-center ${currentStep >= 3 ? "text-green-600" : "text-gray-400"}`}>
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
              ${currentStep >= 3 ? "border-green-600 bg-green-100" : "border-gray-300"}`}
            >
              3
            </div>
            <span className="text-xs mt-1">Додаткові дані</span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !serverError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Завантаження...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-600 p-6">
            <h1 className="text-2xl font-bold text-white text-center">
              Профіль компанії створено
            </h1>
          </div>
          <div className="p-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-medium mb-4">Вітаємо!</h2>
            <p className="text-gray-600 mb-6">
              Профіль вашої компанії успішно створено. Зараз вас буде перенаправлено на 
              сторінку завантаження документів для верифікації.
            </p>
            <div className="flex justify-center">
              <Button variant="primary" onClick={() => navigate("/company/documents")}>
                Перейти до завантаження документів
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 p-6">
          <h1 className="text-2xl font-bold text-white text-center">
            Налаштування компанії
          </h1>
        </div>
        
        <div className="p-6">
          {serverError && (
            <Alert type="error" message={serverError} className="mb-6" />
          )}
          
          {renderStepProgress()}
          
          <form onSubmit={handleSubmit}>
            {/* Крок 1: Основна інформація про компанію */}
            {currentStep === 1 && (
              <>
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <Building className="text-green-600 mr-2" size={24} />
                    <h2 className="text-xl font-medium text-gray-900">
                      Основна інформація про компанію
                    </h2>
                  </div>
                  <p className="text-gray-600">
                    Будь ласка, введіть основну інформацію про вашу компанію
                  </p>
                </div>

                <div className="mb-4">
                  <label htmlFor="companyName" className="block text-gray-700 font-medium mb-2">
                    Назва компанії *
                  </label>
                  <Input
                    type="text"
                    id="companyName"
                    name="companyName"
                    placeholder="Введіть офіційну назву компанії"
                    value={formData.companyName}
                    onChange={handleChange}
                    error={errors.companyName || ""}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="companyCode" className="block text-gray-700 font-medium mb-2">
                    Код ЄДРПОУ *
                  </label>
                  <Input
                    type="text"
                    id="companyCode"
                    name="companyCode"
                    placeholder="Введіть 8-значний код ЄДРПОУ"
                    value={formData.companyCode}
                    onChange={handleChange}
                    error={errors.companyCode || ""}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Єдиний державний реєстр підприємств та організацій України
                  </p>
                </div>

                <div className="mb-4">
                  <label htmlFor="vatNumber" className="block text-gray-700 font-medium mb-2">
                    ІПН (необов&apos;язково)
                  </label>
                  <Input
                    type="text"
                    id="vatNumber"
                    name="vatNumber"
                    placeholder="Введіть 10-значний індивідуальний податковий номер"
                    value={formData.vatNumber}
                    onChange={handleChange}
                    error={errors.vatNumber || ""}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="website" className="block text-gray-700 font-medium mb-2">
                    Веб-сайт (необов&apos;язково)
                  </label>
                  <Input
                    type="url"
                    id="website"
                    name="website"
                    placeholder="https://example.com"
                    icon={<Globe size={20} className="text-gray-400" />}
                    value={formData.website}
                    onChange={handleChange}
                    error={errors.website || ""}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="industry" className="block text-gray-700 font-medium mb-2">
                    Галузь діяльності
                  </label>
                  <Select
                    value={formData.industry}
                    onChange={(value: string) =>
                      setFormData((prev) => ({ ...prev, industry: value }))
                    }
                    options={[
                      { value: "", label: "Виберіть галузь" },
                      ...industries,
                    ]}
                    error={errors.industry || ""}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between mt-8">
                  <div></div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNextStep}
                    endIcon={<ChevronRight size={16} />}
                  >
                    Далі
                  </Button>
                </div>
              </>
            )}

            {/* Крок 2: Адреса та контактна інформація */}
            {currentStep === 2 && (
              <>
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <MapPin className="text-green-600 mr-2" size={24} />
                    <h2 className="text-xl font-medium text-gray-900">
                      Адреса та контактна інформація
                    </h2>
                  </div>
                  <p className="text-gray-600">
                    Вкажіть юридичну адресу та контактні дані компанії
                  </p>
                </div>

                <div className="mb-4">
                  <label htmlFor="address.country" className="block text-gray-700 font-medium mb-2">
                    Країна *
                  </label>
                  <Input
                    type="text"
                    id="address.country"
                    name="address.country"
                    placeholder="Введіть країну"
                    value={formData.address.country}
                    onChange={handleChange}
                    error={errors["address.country"] || ""}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label htmlFor="address.region" className="block text-gray-700 font-medium mb-2">
                      Область
                    </label>
                    <Input
                      type="text"
                      id="address.region"
                      name="address.region"
                      placeholder="Введіть область"
                      value={formData.address.region}
                      onChange={handleChange}
                      error={errors["address.region"] || ""}
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="address.city" className="block text-gray-700 font-medium mb-2">
                      Місто *
                    </label>
                    <Input
                      type="text"
                      id="address.city"
                      name="address.city"
                      placeholder="Введіть місто"
                      value={formData.address.city}
                      onChange={handleChange}
                      error={errors["address.city"] || ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label htmlFor="address.street" className="block text-gray-700 font-medium mb-2">
                      Вулиця
                    </label>
                    <Input
                      type="text"
                      id="address.street"
                      name="address.street"
                      placeholder="Введіть вулицю та номер будинку"
                      value={formData.address.street}
                      onChange={handleChange}
                      error={errors["address.street"] || ""}
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="address.postalCode" className="block text-gray-700 font-medium mb-2">
                      Поштовий індекс
                    </label>
                    <Input
                      type="text"
                      id="address.postalCode"
                      name="address.postalCode"
                      placeholder="Введіть поштовий індекс"
                      value={formData.address.postalCode}
                      onChange={handleChange}
                      error={errors["address.postalCode"] || ""}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="contactInfo.email" className="block text-gray-700 font-medium mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    id="contactInfo.email"
                    name="contactInfo.email"
                    placeholder="Введіть email для зв'язку"
                    value={formData.contactInfo.email}
                    onChange={handleChange}
                    error={errors["contactInfo.email"] || ""}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="contactInfo.phone" className="block text-gray-700 font-medium mb-2">
                    Телефон *
                  </label>
                  <Input
                    type="tel"
                    id="contactInfo.phone"
                    name="contactInfo.phone"
                    placeholder="+380 XX XXX XX XX"
                    value={formData.contactInfo.phone}
                    onChange={handleChange}
                    error={errors["contactInfo.phone"] || ""}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="contactInfo.additionalPhone" className="block text-gray-700 font-medium mb-2">
                    Додатковий телефон
                  </label>
                  <Input
                    type="tel"
                    id="contactInfo.additionalPhone"
                    name="contactInfo.additionalPhone"
                    placeholder="+380 XX XXX XX XX"
                    value={formData.contactInfo.additionalPhone}
                    onChange={handleChange}
                    error={errors["contactInfo.additionalPhone"] || ""}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                  >
                    Назад
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNextStep}
                    endIcon={<ChevronRight size={16} />}
                  >
                    Далі
                  </Button>
                </div>
              </>
            )}

            {/* Крок 3: Додаткова інформація */}
            {currentStep === 3 && (
              <>
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <Info className="text-green-600 mr-2" size={24} />
                    <h2 className="text-xl font-medium text-gray-900">
                      Додаткова інформація
                    </h2>
                  </div>
                  <p className="text-gray-600">
                    Ця інформація допоможе користувачам більше дізнатися про вашу компанію
                  </p>
                </div>

                <div className="mb-4">
                  <label htmlFor="foundedYear" className="block text-gray-700 font-medium mb-2">
                    Рік заснування
                  </label>
                  <Select
                    value={formData.foundedYear}
                    onChange={(value: string) =>
                      setFormData((prev) => ({ ...prev, foundedYear: value }))
                    }
                    options={[
                      { value: "", label: "Виберіть рік" },
                      ...generateYears(),
                    ]}
                    error={errors.foundedYear || ""}
                  />
                </div>

                  <Select
                    value={formData.size}
                    onChange={(value: string) =>
                      setFormData((prev) => ({
                        ...prev,
                        size: value as "SMALL" | "MEDIUM" | "LARGE",
                      }))
                    }
                    options={[
                      { value: "SMALL", label: "Малий бізнес (до 50 працівників)" },
                      { value: "MEDIUM", label: "Середній бізнес (50-250 працівників)" },
                      { value: "LARGE", label: "Великий бізнес (понад 250 працівників)" },
                    ]}
                    error={errors.size || ""}
                  />
                <div className="mb-4">
                  <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                    Опис компанії
                  </label>
                  <TextArea
                    id="description"
                    name="description"
                    placeholder="Розкажіть детальніше про діяльність вашої компанії, її продукти та послуги"
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    error={errors.description || ""}
                  />
                </div>

                {/* Інформація про наступні кроки */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Наступний крок: завантаження документів
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          Після створення профілю компанії вам необхідно буде завантажити
                          документи для підтвердження вашого бізнесу. Ви можете зробити це відразу
                          або повернутися до цього кроку пізніше.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                  >
                    Назад
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                  >
                    {isLoading ? "Створення..." : "Створити профіль компанії"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanySetupPage;