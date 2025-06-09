import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building, 
  Upload, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  Users, 
  Briefcase,
  FileText,
  Save,
  X,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { companiesAPI } from "../../api/apiClient";
import { 
  Button, 
  Input, 
  TextArea, 
  Select, 
  Alert,
  Card
} from "../../components/common";

// Типи для даних компанії
interface CompanyFormData {
  companyName: string;
  companyCode: string; // ЄДРПОУ
  vatNumber?: string; // ІПН
  website?: string;
  industry?: string;
  foundedYear?: string;
  size: "SMALL" | "MEDIUM" | "LARGE";
  description?: string;
  address: {
    country: string;
    region?: string;
    city: string;
    street?: string;
    postalCode?: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    additionalPhone?: string;
  };
}

interface CompanyProfile extends Omit<CompanyFormData, 'foundedYear'> {
  id: number;
  userId: number;
  logoUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  foundedYear?: number;
}

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

const CompanyEditPage: React.FC = () => {
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: "",
    companyCode: "",
    vatNumber: "",
    website: "",
    industry: "",
    foundedYear: "",
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
  });
  
  const [originalData, setOriginalData] = useState<CompanyFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Завантаження даних компанії
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await companiesAPI.getMyCompany();
        const companyData = response.data;
        setCompany(companyData);
        
        // Конвертуємо дані з API до формату форми
        const formattedData: CompanyFormData = {
          companyName: companyData.companyName,
          companyCode: companyData.companyCode,
          vatNumber: companyData.vatNumber || "",
          website: companyData.website || "",
          industry: companyData.industry || "",
          foundedYear: companyData.foundedYear ? companyData.foundedYear.toString() : "",
          size: companyData.size,
          description: companyData.description || "",
          address: {
            country: companyData.address.country,
            region: companyData.address.region || "",
            city: companyData.address.city,
            street: companyData.address.street || "",
            postalCode: companyData.address.postalCode || "",
          },
          contactInfo: {
            email: companyData.contactInfo.email,
            phone: companyData.contactInfo.phone,
            additionalPhone: companyData.contactInfo.additionalPhone || "",
          },
        };
        
        setFormData(formattedData);
        setOriginalData(formattedData);
        
        // Встановлюємо попередній перегляд логотипу, якщо він є
        if (companyData.logoUrl) {
          setLogoPreview(companyData.logoUrl);
        }
      } catch (err: any) {
        console.error("Error fetching company data:", err);
        
        if (err.response && err.response.status === 404) {
          setError("Профіль компанії не знайдено. Спочатку створіть профіль компанії.");
        } else {
          setError("Помилка при завантаженні даних компанії. Спробуйте знову пізніше.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Перевіряємо, чи користувач має роль компанії
    if (user && user.role === "COMPANY") {
      fetchCompanyData();
    } else if (user && user.role !== "COMPANY") {
      setError("Для доступу до цієї сторінки потрібно мати роль компанії");
    }
  }, [user]);
  
  // Обробник зміни полів форми
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Обробка вкладених об'єктів
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent as keyof CompanyFormData]: {
          ...(prev[parent as keyof CompanyFormData] as any),
          [child as string]: value,
        },
      }));
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
  
  // Обробник зміни логотипу
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Перевірка розміру файлу (не більше 5 МБ)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          logo: "Розмір файлу не повинен перевищувати 5 МБ"
        });
        return;
      }
      
      // Перевірка типу файлу
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml"];
      if (!allowedTypes.includes(file.type)) {
        setErrors({
          ...errors,
          logo: "Дозволені типи файлів: JPG, PNG, SVG"
        });
        return;
      }
      
      setLogoFile(file);
      
      // Створення URL для попереднього перегляду
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Очищення помилок логотипу
      if (errors.logo) {
        const { logo, ...rest } = errors;
        setErrors(rest);
      }
    }
  };
  
  // Скасування зміни логотипу
  const handleCancelLogoChange = () => {
    setLogoFile(null);
    setLogoPreview(company?.logoUrl || null);
    
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };
  
  // Валідація форми перед відправкою
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
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
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Обробник відправки форми
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !company) {
      window.scrollTo(0, 0); // Прокручуємо до початку сторінки, щоб показати помилки
      return;
    }
    
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      // Підготовка даних для відправки
      const updateData: any = {
        companyName: formData.companyName,
        companyCode: formData.companyCode,
        website: formData.website || undefined,
        industry: formData.industry || undefined,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
        size: formData.size,
        description: formData.description || undefined,
        address: {
          country: formData.address.country,
          region: formData.address.region || undefined,
          city: formData.address.city,
          street: formData.address.street || undefined,
          postalCode: formData.address.postalCode || undefined,
        },
        contactInfo: {
          email: formData.contactInfo.email,
          phone: formData.contactInfo.phone,
          additionalPhone: formData.contactInfo.additionalPhone || undefined,
        },
      };
      if (formData.vatNumber) {
        updateData.vatNumber = formData.vatNumber;
      }
      
      // Відправка основних даних
      await companiesAPI.update(company.id, updateData);
      
      // Якщо є новий логотип, відправляємо його окремо
      if (logoFile) {
        const formDataForLogo = new FormData();
        formDataForLogo.append("logo", logoFile);
        await companiesAPI.updateCompanyLogo(company.id, formDataForLogo);
      }
      
      setSuccess(true);
      
      // Оновлюємо оригінальні дані
      setOriginalData(formData);
      
      // Прокручуємо до початку сторінки, щоб показати повідомлення про успіх
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error("Error updating company profile:", err);
      
      if (err.response) {
        if (err.response.status === 400 && err.response.data?.errors) {
          const serverErrors: Record<string, string> = {};
          Object.entries(err.response.data.errors).forEach(([key, value]) => {
            serverErrors[key] = Array.isArray(value) ? value[0] : value as string;
          });
          setErrors(serverErrors);
        } else if (err.response.status === 409) {
          if (err.response.data?.message?.includes("companyCode")) {
            setErrors(prev => ({ ...prev, companyCode: "Компанія з таким кодом ЄДРПОУ вже зареєстрована" }));
          } else if (err.response.data?.message?.includes("vatNumber")) {
            setErrors(prev => ({ ...prev, vatNumber: "Компанія з таким ІПН вже зареєстрована" }));
          } else {
            setError(err.response.data?.message || "Конфлікт даних. Спробуйте інші значення.");
          }
        } else {
          setError("Помилка при оновленні профілю компанії. Спробуйте знову пізніше.");
        }
      } else {
        setError("Не вдалося з'єднатися з сервером. Перевірте з'єднання.");
      }
      
      // Прокручуємо до початку сторінки, щоб показати помилки
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };
  
  // Функція перевірки, чи форма була змінена
  const isFormChanged = () => {
    if (!originalData) return false;
    
    return (
      formData.companyName !== originalData.companyName ||
      formData.companyCode !== originalData.companyCode ||
      formData.vatNumber !== originalData.vatNumber ||
      formData.website !== originalData.website ||
      formData.industry !== originalData.industry ||
      formData.foundedYear !== originalData.foundedYear ||
      formData.size !== originalData.size ||
      formData.description !== originalData.description ||
      formData.address.country !== originalData.address.country ||
      formData.address.region !== originalData.address.region ||
      formData.address.city !== originalData.address.city ||
      formData.address.street !== originalData.address.street ||
      formData.address.postalCode !== originalData.address.postalCode ||
      formData.contactInfo.email !== originalData.contactInfo.email ||
      formData.contactInfo.phone !== originalData.contactInfo.phone ||
      formData.contactInfo.additionalPhone !== originalData.contactInfo.additionalPhone ||
      logoFile !== null
    );
  };
  
  // Скасування змін
  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData);
      setLogoFile(null);
      setLogoPreview(company?.logoUrl || null);
      setErrors({});
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
  
  // JSX для відображення під час завантаження
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Завантаження даних компанії...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // JSX для відображення помилки
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Alert type="error" message={error} className="mb-4" />
          
          {/* Якщо компанія не знайдена, пропонуємо створити її */}
          {error.includes("не знайдено") && (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Створіть профіль компанії</h2>
              <p className="text-gray-600 mb-6">
                Для редагування профілю компанії необхідно спочатку створити його.
              </p>
              <Button 
                variant="primary" 
                onClick={() => navigate("/company/setup")}
              >
                Створити профіль компанії
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Заголовок сторінки */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Редагування профілю компанії</h1>
          <p className="text-gray-600">
            Оновіть інформацію про вашу компанію
          </p>
        </div>
        
        {/* Повідомлення про успіх */}
        {success && (
          <Alert 
            type="success" 
            message="Профіль компанії успішно оновлено" 
            className="mb-6"
          />
        )}
        
        {/* Загальна помилка */}
        {error && (
          <Alert 
            type="error" 
            message={error} 
            className="mb-6"
          />
        )}
        
        {/* Форма редагування */}
        <form onSubmit={handleSubmit}>
          {/* Логотип компанії */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">
                <Building className="inline-block mr-2 text-green-600" />
                Логотип компанії
              </h2>
              
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="mb-4 md:mb-0 md:mr-6">
                  {logoPreview ? (
                    <div className="relative w-32 h-32">
                      <img
                        src={logoPreview}
                        alt="Company logo preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      {logoFile && (
                        <button
                          type="button"
                          onClick={handleCancelLogoChange}
                          className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Building className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div>
                  <input
                    type="file"
                    id="logo"
                    name="logo"
                    ref={logoInputRef}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.svg"
                    onChange={handleLogoChange}
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    icon={<Upload size={16} />}
                    className="mb-2"
                  >
                    Завантажити логотип
                  </Button>
                  
                  <p className="text-xs text-gray-500">
                    Рекомендований розмір: 400x400 пікселів. 
                    Максимальний розмір файлу: 5 МБ. 
                    Формати: JPG, PNG, SVG.
                  </p>
                  
                  {errors.logo && (
                    <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
          
          {/* Основна інформація */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">
                <FileText className="inline-block mr-2 text-green-600" />
                Основна інформація
              </h2>
              
              <div className="space-y-4">
                <div>
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
                
                <div>
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
                    disabled={company?.isVerified} // Блокуємо зміну для верифікованих компаній
                  />
                  {company?.isVerified && (
                    <p className="text-xs text-gray-500 mt-1">
                      Код ЄДРПОУ не можна змінити після верифікації компанії.
                    </p>
                  )}
                </div>
                
                <div>
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
                    disabled={company?.isVerified && !!company.vatNumber} // Блокуємо зміну для верифікованих компаній з ІПН
                  />
                  {company?.isVerified && company.vatNumber && (
                    <p className="text-xs text-gray-500 mt-1">
                      ІПН не можна змінити після верифікації компанії.
                    </p>
                  )}
                </div>
                
                <div>
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
                
                <div>
                  <label htmlFor="industry" className="block text-gray-700 font-medium mb-2">
                    Галузь діяльності
                  </label>
                  <Select
                    value={formData.industry ?? ""}
                    onChange={(value) => handleChange({
                      target: { name: "industry", value }
                    } as React.ChangeEvent<HTMLInputElement>)}
                    options={[
                      { value: "", label: "Виберіть галузь" },
                      ...industries,
                    ]}
                    error={errors.industry || ""}
                  />
                </div>
                
                <div>
                  <label htmlFor="foundedYear" className="block text-gray-700 font-medium mb-2">
                    Рік заснування
                  </label>
                  <Select
                    value={formData.foundedYear ?? ""}
                    onChange={(value) => handleChange({
                      target: { name: "foundedYear", value }
                    } as React.ChangeEvent<HTMLInputElement>)}
                    options={[
                      { value: "", label: "Виберіть рік" },
                      ...generateYears(),
                    ]}
                    error={errors.foundedYear || ""}
                  />
                </div>
                
                <div>
                  <label htmlFor="size" className="block text-gray-700 font-medium mb-2">
                    Розмір компанії
                  </label>
                  <Select
                    value={formData.size}
                    onChange={(value) =>
                      handleChange({
                        target: { name: "size", value }
                      } as React.ChangeEvent<HTMLInputElement>)
                    }
                    options={[
                      { value: "SMALL", label: "Малий бізнес (до 50 працівників)" },
                      { value: "MEDIUM", label: "Середній бізнес (50-250 працівників)" },
                      { value: "LARGE", label: "Великий бізнес (понад 250 працівників)" },
                    ]}
                    error={errors.size || ""}
                  />
                </div>
                
                <div>
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
              </div>
            </div>
          </Card>
          
          {/* Адреса */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">
                <MapPin className="inline-block mr-2 text-green-600" />
                Адреса
              </h2>
              
              <div className="space-y-4">
                <div>
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
                  <div>
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
                  
                  <div>
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
                  <div>
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
                  
                  <div>
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
              </div>
            </div>
          </Card>
          
          {/* Контактна інформація */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">
                <Phone className="inline-block mr-2 text-green-600" />
                Контактна інформація
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="contactInfo.email" className="block text-gray-700 font-medium mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    id="contactInfo.email"
                    name="contactInfo.email"
                    placeholder="Введіть email для зв'язку"
                    icon={<Mail size={20} className="text-gray-400" />}
                    value={formData.contactInfo.email}
                    onChange={handleChange}
                    error={errors["contactInfo.email"] || ""}
                  />
                </div>
                
                <div>
                  <label htmlFor="contactInfo.phone" className="block text-gray-700 font-medium mb-2">
                    Телефон *
                  </label>
                  <Input
                    type="tel"
                    id="contactInfo.phone"
                    name="contactInfo.phone"
                    placeholder="+380 XX XXX XX XX"
                    icon={<Phone size={20} className="text-gray-400" />}
                    value={formData.contactInfo.phone}
                    onChange={handleChange}
                    error={errors["contactInfo.phone"] || ""}
                  />
                </div>
                
                <div>
                  <label htmlFor="contactInfo.additionalPhone" className="block text-gray-700 font-medium mb-2">
                    Додатковий телефон
                  </label>
                  <Input
                    type="tel"
                    id="contactInfo.additionalPhone"
                    name="contactInfo.additionalPhone"
                    placeholder="+380 XX XXX XX XX"
                    icon={<Phone size={20} className="text-gray-400" />}
                    value={formData.contactInfo.additionalPhone}
                    onChange={handleChange}
                    error={errors["contactInfo.additionalPhone"] || ""}
                  />
                </div>
              </div>
            </div>
          </Card>
          
          {/* Попередження для верифікованих компаній */}
          {company?.isVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Важлива інформація
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Ваша компанія верифікована, тому деякі основні дані (код ЄДРПОУ, ІПН) 
                      не можуть бути змінені. Якщо вам потрібно змінити ці дані, зверніться 
                      до адміністратора.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Кнопки для збереження/скасування */}
          <div className="flex flex-col-reverse sm:flex-row justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving || !isFormChanged()}
            >
              Скасувати зміни
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={16} />}
              loading={saving}
              disabled={!isFormChanged()}
            >
              {saving ? "Збереження..." : "Зберегти зміни"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyEditPage;