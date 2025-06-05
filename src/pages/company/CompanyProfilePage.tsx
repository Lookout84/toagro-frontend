import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Building, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  ShieldCheck, 
  Calendar, 
  Users, 
  Briefcase,
  FileText,
  MessageSquare,
  ChevronRight,
  Star,
  ExternalLink,
  Tag
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { uk } from "date-fns/locale";
import { useAuth } from "../../context/AuthContext";
import { companiesAPI } from "../../api/apiClient";
import { Button, Alert, Card, Tabs, Tab } from "../../components/common";

// Типи для даних компанії
interface CompanyProfile {
  id: number;
  userId: number;
  companyName: string;
  companyCode: string; // ЄДРПОУ
  vatNumber?: string; // ІПН
  website?: string;
  industry?: string;
  foundedYear?: number;
  size: "SMALL" | "MEDIUM" | "LARGE";
  description?: string;
  logoUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
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

interface CompanyListing {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  condition: "NEW" | "USED";
  category: string;
  createdAt: string;
}

interface CompanyReview {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const CompanyProfilePage: React.FC = () => {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [listings, setListings] = useState<CompanyListing[]>([]);
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Завантаження даних компанії та пов'язаних даних
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Отримання даних компанії поточного користувача
        const companyResponse = await companiesAPI.getMyCompany();
        setCompany(companyResponse.data);
        
        // Отримання оголошень компанії
        const listingsResponse = await companiesAPI.getAll({ companyId: companyResponse.data.id });
        setListings(listingsResponse.data.data.listings || listingsResponse.data.listings || []);
        
        // Отримання відгуків про компанію
        const reviewsResponse = await companiesAPI.getCompanyReviews(companyResponse.data.id);
        setReviews(reviewsResponse.data);
        
        // Розрахунок середнього рейтингу
        if (reviewsResponse.data.length > 0) {
          const totalRating = reviewsResponse.data.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating(totalRating / reviewsResponse.data.length);
        }
      } catch (err: any) {
        console.error("Error fetching company data:", err);
        
        if (err.response && err.response.status === 404) {
          setError("Профіль компанії не знайдено. Спочатку створіть профіль компанії.");
        } else {
          setError("Помилка при завантаженні даних. Спробуйте знову пізніше.");
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
  
  // Форматування дати
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return format(parseISO(dateString), "d MMMM yyyy", { locale: uk });
    } catch (error) {
      return dateString;
    }
  };
  
  // Функція форматування розміру компанії
  const formatCompanySize = (size: string) => {
    switch (size) {
      case "SMALL": return "Малий бізнес";
      case "MEDIUM": return "Середній бізнес";
      case "LARGE": return "Великий бізнес";
      default: return "Не вказано";
    }
  };
  
  // Компонент для відображення рейтингу у вигляді зірок
  const StarRating = ({ rating }: { rating: number }) => {
    const roundedRating = Math.round(rating * 2) / 2; // Округлення до 0.5
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        // Повна зірка
        stars.push(<Star key={i} fill="#FBBF24" color="#FBBF24" size={16} />);
      } else if (i - 0.5 === roundedRating) {
        // Половина зірки (імітуємо за допомогою background clip)
        stars.push(
          <div key={i} className="relative">
            <Star size={16} color="#E5E7EB" className="absolute" />
            <div className="absolute overflow-hidden w-1/2">
              <Star size={16} fill="#FBBF24" color="#FBBF24" />
            </div>
          </div>
        );
      } else {
        // Порожня зірка
        stars.push(<Star key={i} color="#E5E7EB" size={16} />);
      }
    }
    
    return <div className="flex">{stars}</div>;
  };
  
  // Відображення картки оголошення
  const ListingCard = ({ listing }: { listing: CompanyListing }) => {
    return (
      <Card className="h-full flex flex-col">
        <div className="relative pb-[56.25%] overflow-hidden rounded-t-lg">
          <img
            src={listing.imageUrl || "/images/placeholder-product.jpg"}
            alt={listing.title}
            className="absolute h-full w-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <div className={`px-2 py-1 text-xs font-medium rounded-full ${
              listing.condition === "NEW" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
            }`}>
              {listing.condition === "NEW" ? "Нове" : "Вживане"}
            </div>
          </div>
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <div className="mb-1">
            <span className="text-xs text-gray-500">{listing.category}</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">{listing.title}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{listing.description}</p>
          <div className="mt-auto flex items-center justify-between">
            <div className="font-bold text-gray-900">
              {new Intl.NumberFormat("uk-UA", {
                style: "currency",
                currency: listing.currency,
                maximumFractionDigits: 0,
              }).format(listing.price)}
            </div>
            <Link to={`/listings/${listing.id}`} className="text-green-600 hover:text-green-800 text-sm font-medium">
              Детальніше
            </Link>
          </div>
        </div>
      </Card>
    );
  };
  
  // Відображення картки відгуку
  const ReviewCard = ({ review }: { review: CompanyReview }) => {
    return (
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-4">
            {review.userAvatar ? (
              <img
                src={review.userAvatar}
                alt={review.userName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500 font-medium">
                  {review.userName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <h4 className="font-medium text-gray-900 mr-2">{review.userName}</h4>
              <div className="text-xs text-gray-500 mt-1 sm:mt-0">
                {formatDate(review.createdAt)}
              </div>
            </div>
            <div className="mt-1 mb-2">
              <StarRating rating={review.rating} />
            </div>
            <p className="text-gray-600">{review.comment}</p>
          </div>
        </div>
      </div>
    );
  };
  
  // Відображення під час завантаження
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Завантаження профілю компанії...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Відображення помилки
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Alert type="error" message={error} className="mb-4" />
          
          {/* Якщо компанія не знайдена, пропонуємо створити її */}
          {error.includes("не знайдено") && (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Створіть профіль компанії</h2>
              <p className="text-gray-600 mb-6">
                Для відображення публічного профілю компанії необхідно спочатку створити його.
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
  
  // Відображення, якщо компанію не знайдено
  if (!company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Alert 
            type="warning" 
            message="Профіль компанії не знайдено. Будь ласка, перевірте наявність профілю компанії." 
            className="mb-4" 
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Заголовок сторінки */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Профіль компанії</h1>
          <div className="mt-2 md:mt-0">
            <Button
              variant="outline"
              icon={<ExternalLink size={16} />}
              onClick={() => window.open(`/companies/${company.id}`, "_blank")}
              className="mr-2"
            >
              Переглянути публічний профіль
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate("/company/edit")}
            >
              Редагувати профіль
            </Button>
          </div>
        </div>
        
        {/* Основна інформація про компанію */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row p-6">
            <div className="md:w-1/3 mb-6 md:mb-0 md:pr-6">
              <div className="flex justify-center md:justify-start">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.companyName}
                    className="w-40 h-40 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Building className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              {company.isVerified && (
                <div className="flex items-center justify-center md:justify-start mt-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                  <ShieldCheck size={18} className="mr-2" />
                  <span className="font-medium">Верифікована компанія</span>
                </div>
              )}
            </div>
            
            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{company.companyName}</h2>
              
              {company.description && (
                <p className="text-gray-600 mb-4">{company.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                <div className="flex items-start">
                  <FileText size={18} className="text-gray-500 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">ЄДРПОУ:</p>
                    <p className="text-gray-900">{company.companyCode}</p>
                  </div>
                </div>
                
                {company.industry && (
                  <div className="flex items-start">
                    <Briefcase size={18} className="text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Галузь:</p>
                      <p className="text-gray-900">{company.industry}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start">
                  <Users size={18} className="text-gray-500 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Розмір компанії:</p>
                    <p className="text-gray-900">{formatCompanySize(company.size)}</p>
                  </div>
                </div>
                
                {company.foundedYear && (
                  <div className="flex items-start">
                    <Calendar size={18} className="text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Рік заснування:</p>
                      <p className="text-gray-900">{company.foundedYear}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Вкладки з інформацією */}
        <div className="mb-8">
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <Tab label="Контактна інформація">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Контактна інформація</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <MapPin size={18} className="text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Адреса:</p>
                      <p className="text-gray-900">
                        {[
                          company.address.street,
                          company.address.city,
                          company.address.region,
                          company.address.country,
                          company.address.postalCode
                        ].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Mail size={18} className="text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Email:</p>
                      <a href={`mailto:${company.contactInfo.email}`} className="text-blue-600 hover:underline">
                        {company.contactInfo.email}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone size={18} className="text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Телефон:</p>
                      <a href={`tel:${company.contactInfo.phone}`} className="text-blue-600 hover:underline">
                        {company.contactInfo.phone}
                      </a>
                    </div>
                  </div>
                  
                  {company.contactInfo.additionalPhone && (
                    <div className="flex items-start">
                      <Phone size={18} className="text-gray-500 mt-0.5 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Додатковий телефон:</p>
                        <a href={`tel:${company.contactInfo.additionalPhone}`} className="text-blue-600 hover:underline">
                          {company.contactInfo.additionalPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {company.website && (
                    <div className="flex items-start">
                      <Globe size={18} className="text-gray-500 mt-0.5 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Веб-сайт:</p>
                        <a 
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline"
                        >
                          {company.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row sm:justify-between">
                  <Button
                    variant="outline"
                    icon={<MessageSquare size={16} />}
                    onClick={() => navigate("/chat")}
                    className="mb-2 sm:mb-0"
                  >
                    Перейти до повідомлень
                  </Button>
                  
                  <Button
                    variant="primary"
                    onClick={() => navigate("/company/edit")}
                  >
                    Оновити контактну інформацію
                  </Button>
                </div>
              </div>
            </Tab>
            
            <Tab label="Оголошення">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Оголошення компанії</h3>
                  <Link 
                    to="/profile/listings" 
                    className="text-green-600 hover:text-green-800 flex items-center text-sm font-medium"
                  >
                    Всі оголошення
                    <ChevronRight size={16} />
                  </Link>
                </div>
                
                {listings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.slice(0, 6).map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h4 className="text-xl font-medium text-gray-900 mb-2">Немає активних оголошень</h4>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      У вашої компанії ще немає оголошень. Створіть перше оголошення для 
                      розширення вашого бізнесу на платформі.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => navigate("/listings/create")}
                    >
                      Створити оголошення
                    </Button>
                  </div>
                )}
              </div>
            </Tab>
            
            <Tab label="Відгуки">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Відгуки про компанію</h3>
                  {reviews.length > 0 && (
                    <div className="flex items-center">
                      <StarRating rating={averageRating} />
                      <span className="ml-2 text-gray-700 font-medium">{averageRating.toFixed(1)}</span>
                      <span className="ml-1 text-gray-500">({reviews.length})</span>
                    </div>
                  )}
                </div>
                
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h4 className="text-xl font-medium text-gray-900 mb-2">Немає відгуків</h4>
                    <p className="text-gray-600 max-w-md mx-auto mb-4">
                      У вашої компанії ще немає відгуків. Відгуки з'являться після взаємодії з клієнтами.
                    </p>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </div>
        
        {/* Додаткова інформація */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Додаткова інформація</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Статус верифікації:</p>
              <div className="flex items-center">
                {company.isVerified ? (
                  <>
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                    <p className="text-green-600 font-medium">Компанію верифіковано</p>
                  </>
                ) : (
                  <>
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 mr-2"></div>
                    <p className="text-yellow-600 font-medium">Очікує верифікації</p>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Дата реєстрації на платформі:</p>
              <p className="text-gray-900">{formatDate(company.createdAt)}</p>
            </div>
            
            {company.vatNumber && (
              <div>
                <p className="text-sm text-gray-500 mb-1">ІПН:</p>
                <p className="text-gray-900">{company.vatNumber}</p>
              </div>
            )}
          </div>
          
          {!company.isVerified && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Завершіть верифікацію вашої компанії
                  </h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Для отримання повного доступу до всіх функцій платформи, необхідно 
                      завершити процес верифікації. Завантажте необхідні документи через сторінку
                      управління документами.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => navigate("/company/documents")}
                    >
                      Перейти до документів
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfilePage;