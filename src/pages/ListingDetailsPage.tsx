import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchListingById, setSimilarListings } from "../store/listingSlice";
import { listingsAPI, chatAPI } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import {
  Share2,
  Heart,
  Printer,
  Flag,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
  Calendar,
  Eye,
  Phone,
  User,
  MessageSquare,
} from "lucide-react";
import Loader from "../components/common/Loader";
import ListingCard from "../components/ui/ListingCard";

type ListingUser = {
  id: number;
  name: string;
  avatar?: string;
  phoneNumber?: string | null;
  email?: string | null;
};

type Listing = {
  id: number;
  title: string;
  description: string;
  price: number;
  priceType?: string;
  currency?: string;
  images: string[];
  location: any;
  category: string;
  categoryId: number;
  createdAt: string;
  views: number;
  user: ListingUser; // Ensures user always has phoneNumber, email, etc.
};

const ListingDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth();

  const { currentListing, similarListings, userListings, isLoading } = useAppSelector(
    (state) => state.listing
  );

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Функція для форматування location
  const renderLocation = (locationObj: any) => {
    if (!locationObj) return "Місце не вказано";
    if (typeof locationObj === "string") return locationObj;
    const parts = [
      locationObj.settlement,
      locationObj.community?.name,
      locationObj.region?.name,
      locationObj.country?.name,
    ].filter((part) => typeof part === "string" && part.trim().length > 0);
    return parts.length ? parts.join(", ") : "Місце не вказано";
  };

  // Завантаження оголошення
  useEffect(() => {
    if (id) {
      dispatch(fetchListingById(parseInt(id)));
    }
    window.scrollTo(0, 0);
    return () => {};
  }, [id, dispatch]);

  // Завантаження схожих оголошень
  useEffect(() => {
    if (currentListing) {
      // Завантаження схожих оголошень
      const fetchSimilarListings = async () => {
        try {
          const response = await listingsAPI.getAll({
            categoryId: currentListing.categoryId,
            limit: 4,
            exclude: currentListing.id,
          });
          dispatch(setSimilarListings(response.data.data.listings));
        } catch (error) {
          console.error("Error fetching similar listings:", error);
        }
      };
      
      fetchSimilarListings();
    }
  }, [currentListing, dispatch]);

  const handleImageChange = (index: number) => setActiveImageIndex(index);

  const handleNextImage = () => {
    if (currentListing && currentListing.images.length > 0) {
      setActiveImageIndex((prev) => (prev + 1) % currentListing.images.length);
    }
  };

  const handlePrevImage = () => {
    if (currentListing && currentListing.images.length > 0) {
      setActiveImageIndex(
        (prev) =>
          (prev - 1 + currentListing.images.length) %
          currentListing.images.length
      );
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Інтеграція з API для обраного
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/listings/${id}` } });
      return;
    }
    if (!messageText.trim() || !currentListing) return;
    setIsSendingMessage(true);
    try {
      await chatAPI.sendMessage(
        currentListing.user.id,
        messageText,
        currentListing.id
      );
      setMessageText("");
      navigate(`/chat/${currentListing.user.id}`);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handlePrint = () => window.print();

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: currentListing?.title ?? "",
          text: currentListing?.description ?? "",
          url: window.location.href,
        })
        .catch((error) => console.error("Error sharing:", error));
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Показати повідомлення про копіювання
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    if (price === undefined || price === null) return "Ціна не вказана";

    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    
    // Форматування ціни
    const formattedPrice = new Intl.NumberFormat("uk-UA").format(numericPrice);
    
    // Визначення валюти
    const normalizedCurrency = currentListing?.currency 
      ? currentListing.currency.toUpperCase().trim()
      : "UAH";
      
    let currencySymbol = "₴";
    if (normalizedCurrency === "USD") currencySymbol = "$";
    else if (normalizedCurrency === "EUR") currencySymbol = "€";
    
    // Формування повного тексту ціни
    return `${formattedPrice} ${currencySymbol}`;
  };

  const isOwner =
    user &&
    currentListing &&
    currentListing.user &&
    user.id === currentListing.user.id;

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (!currentListing) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Оголошення не знайдено
          </h1>
          <p className="text-gray-600 mb-6">
            Оголошення могло бути видалено або ви перейшли за неправильним
            посиланням.
          </p>
          <Link
            to="/catalog"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Перейти до каталогу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Навігаційний шлях */}
      <div className="flex items-center mb-6 text-sm">
        <Link to="/" className="text-gray-500 hover:text-green-600">
          Головна
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link to="/catalog" className="text-gray-500 hover:text-green-600">
          Каталог
        </Link>
        {currentListing.category && (
          <>
            <span className="mx-2 text-gray-400">/</span>
            <Link
              to={`/catalog?category=${currentListing.category}`}
              className="text-gray-500 hover:text-green-600"
            >
              {currentListing.category}
            </Link>
          </>
        )}
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-700">{currentListing.title}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Галерея зображень */}
          <div>
            <div className="relative aspect-w-4 aspect-h-3 bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img
                src={
                  currentListing.images[activeImageIndex] ||
                  "https://via.placeholder.com/600x400?text=Немає+фото"
                }
                alt={currentListing.title}
                className="object-contain w-full h-full"
              />
              {currentListing.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-full text-gray-800 hover:bg-opacity-100"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-full text-gray-800 hover:bg-opacity-100"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
            {currentListing.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {currentListing.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageChange(index)}
                    className={`flex-shrink-0 w-20 h-16 rounded-md overflow-hidden border-2 ${
                      activeImageIndex === index
                        ? "border-green-600"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${currentListing.title} - зображення ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Інформація про оголошення */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {currentListing.title}
            </h1>

            <div className="text-2xl font-bold text-gray-900 mb-4">
              {formatPrice(currentListing.price)}
              {currentListing.priceType && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {currentListing.priceType === "BRUTTO" ? "(з ПДВ)" : 
                   currentListing.priceType === "NETTO" ? "(без ПДВ)" : ""}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
              <div className="flex items-center">
                <MapPin size={16} className="mr-1 text-green-600" />
                <span>{renderLocation(currentListing.location)}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="mr-1 text-green-600" />
                <span>{formatDate(currentListing.createdAt)}</span>
              </div>
              <div className="flex items-center">
                <Eye size={16} className="mr-1 text-green-600" />
                <span>{currentListing.views} переглядів</span>
              </div>
              <div className="flex items-center">
                <Tag size={16} className="mr-1 text-green-600" />
                <span>{currentListing.category}</span>
              </div>
            </div>

            {/* Кнопки дій */}
            <div className="flex flex-wrap gap-3 mb-6">
              {isOwner ? (
                <>
                  <Link
                    to={`/profile/listings/edit/${currentListing.id}`}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Редагувати оголошення
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowContactInfo(!showContactInfo)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    {showContactInfo
                      ? "Приховати контакти"
                      : "Показати контакти"}
                  </button>
                </>
              )}

              <button
                onClick={handleToggleFavorite}
                className={`flex items-center px-4 py-2 rounded-md border ${
                  isFavorite
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Heart
                  size={18}
                  className="mr-2"
                  fill={isFavorite ? "currentColor" : "none"}
                />
                {isFavorite ? "В обраному" : "В обране"}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Share2 size={18} className="mr-2" />
                Поділитися
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Printer size={18} className="mr-2" />
                Друк
              </button>

              <button className="flex items-center px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                <Flag size={18} className="mr-2" />
                Скарга
              </button>
            </div>

            {/* Контактна інформація */}
            {showContactInfo && !isOwner && (
              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <h3 className="font-medium text-gray-900 mb-3">
                  Контактна інформація
                </h3>
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User size={18} className="text-green-600 mr-2" />
                      <span>{currentListing.user?.name || "Продавець"}</span>
                    </div>
                    {currentListing.user?.phoneNumber ? (
                      <div className="flex items-center">
                        <Phone size={18} className="text-green-600 mr-2" />
                        <a
                          href={`tel:${currentListing.user.phoneNumber}`}
                          className="text-green-600 hover:underline"
                        >
                          {currentListing.user.phoneNumber}
                        </a>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        Номер телефону не вказано
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    Щоб переглянути контакти,{" "}
                    <Link
                      to="/login"
                      className="text-green-600 hover:underline"
                    >
                      увійдіть у свій акаунт
                    </Link>
                    .
                  </div>
                )}
              </div>
            )}

            {/* Форма відправки повідомлення */}
            {!isOwner && (
              <div className="mt-auto">
                <h3 className="font-medium text-gray-900 mb-3">
                  Написати продавцю
                </h3>
                <form onSubmit={handleSendMessage}>
                  <textarea
                    placeholder="Введіть ваше повідомлення..."
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 mb-3"
                    rows={3}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={isSendingMessage || !isAuthenticated}
                  ></textarea>

                  <button
                    type="submit"
                    className={`w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center ${
                      isSendingMessage || !isAuthenticated
                        ? "opacity-70 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={isSendingMessage || !isAuthenticated}
                  >
                    {!isAuthenticated ? (
                      "Увійдіть, щоб написати повідомлення"
                    ) : isSendingMessage ? (
                      "Відправка..."
                    ) : (
                      <>
                        <MessageSquare size={18} className="mr-2" />
                        Відправити повідомлення
                      </>
                    )}
                  </button>

                  {!isAuthenticated && (
                    <div className="mt-2 text-center">
                      <Link
                        to="/login"
                        className="text-green-600 hover:underline"
                      >
                        Увійти до облікового запису
                      </Link>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Детальна інформація про оголошення */}
        <div className="p-6 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Опис</h2>
          <div className="prose prose-green max-w-none mb-8">
            <p className="whitespace-pre-line text-gray-700">
              {currentListing.description}
            </p>
          </div>
          {/* TODO: Додаткові характеристики, якщо вони є */}
        </div>
      </div>

      {/* Схожі оголошення */}
      {similarListings && similarListings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Схожі оголошення
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Інші оголошення продавця */}
      {userListings && userListings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Інші оголошення продавця
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link 
              to={`/catalog?userId=${currentListing.user.id}`} 
              className="text-green-600 hover:underline"
            >
              Переглянути всі оголошення продавця
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetailsPage;