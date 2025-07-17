import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchCategories } from "../store/catalogSlice";
import { fetchBrands } from "../store/brandSlice";
import { createListing } from "../store/listingSlice";
import { fetchRegions } from "../store/locationSlice";
import { countriesAPI } from "../api/apiClient";
import MotorizedSpecFormComponent, {
  initialMotorizedSpec,
  MotorizedSpecForm as MotorizedSpecFormType,
} from "../components/ui/MotorizedSpecForm";
import CategorySelector from "../components/ui/CategorySelector";
import BrandSelector from "../components/ui/BrandSelector";
import PriceInput from "../components/ui/PriceInput";
import ImageUploader from "../components/ui/ImageUploader";
import LocationSelector from "../components/ui/LocationSelector";

// Add Leaflet to the Window type for TypeScript
declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

interface FormData {
  title: string;
  description: string;
  price: string;
  currency: "UAH" | "USD" | "EUR";
  categoryId: string;
  categoryName: string;
  countryId: string;
  regionId: string;
  communityId: string;
  locationId: string;
  locationName: string;
  latitude: number | undefined;
  longitude: number | undefined;
  images: File[];
  condition: "NEW" | "USED";
  brandId: string;
  brandName: string;
  priceType: "NETTO" | "BRUTTO";
  vatIncluded: boolean;
  // Нові поля для геолокації
  useMyLocation: boolean; // чи використовувати місце автора
  userLatitude: number | undefined; // координати автора
  userLongitude: number | undefined;
}

interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
  categoryId?: string;
  countryId?: string;
  regionId?: string;
  communityId?: string;
  locationId?: string;
  locationName?: string;
  images?: string | undefined;
  brandId?: string | undefined;
  latitude?: string;
  longitude?: string;
}

const CreateListingPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { categories } = useAppSelector((state) => state.catalog);
  const { isLoading } = useAppSelector((state) => state.listing);

  const [countries, setCountries] = useState<
    {
      id: number;
      name: string;
      code: string;
      latitude?: number;
      longitude?: number;
    }[]
  >([]);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    price: "",
    currency: "UAH",
    categoryId: "",
    categoryName: "",
    countryId: "",
    regionId: "",
    communityId: "",
    locationId: "",
    locationName: "",
    latitude: undefined,
    longitude: undefined,
    images: [],
    condition: "USED",
    brandId: "",
    brandName: "",
    priceType: "NETTO",
    vatIncluded: false,
    useMyLocation: true,
    userLatitude: undefined,
    userLongitude: undefined,
  });

  const [motorizedSpec, setMotorizedSpec] =
    useState<MotorizedSpecFormType>(initialMotorizedSpec);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isUploading, setIsUploading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false); // Додано

  useEffect(() => {
    if (categories.length === 0) dispatch(fetchCategories());
    if (!countries.length) {
      dispatch(fetchBrands());
      countriesAPI.getAll().then((res) => {
        setCountries(res.data.data || []);
      });
    }
  }, [dispatch, categories.length, countries.length]);

  useEffect(() => {
    if (formData.countryId) {
      dispatch(fetchRegions(formData.countryId));
    }
  }, [dispatch, formData.countryId]);

  // Динамічне підключення Leaflet
  useEffect(() => {
    if (!mapLoaded && typeof window !== "undefined") {
      const leafletCss = document.createElement("link");
      leafletCss.rel = "stylesheet";
      leafletCss.href = "https://unpkg.com/leaflet/dist/leaflet.css";
      document.head.appendChild(leafletCss);

      const leafletScript = document.createElement("script");
      leafletScript.src = "https://unpkg.com/leaflet/dist/leaflet.js";
      leafletScript.async = true;
      leafletScript.onload = () => setMapLoaded(true);
      document.body.appendChild(leafletScript);
    }
  }, [mapLoaded]);

  const selectedCategoryObj = categories.find(
    (cat) => cat.id === Number(formData.categoryId)
  );
  const isMotorized = selectedCategoryObj?.isMotorized ?? false;

  // --- GEOLOCATION: автоматичне визначення місця ---
  useEffect(() => {
    console.log("Перевірка геолокації:", {
      hasGeolocation: !!navigator.geolocation,
      userLatitude: formData.userLatitude,
      userLongitude: formData.userLongitude,
      countriesLength: countries.length
    });

    if (
      navigator.geolocation &&
      !formData.userLatitude &&
      !formData.userLongitude &&
      countries.length > 0
    ) {
      console.log("Запуск геолокації...");
      setIsLoadingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Геолокація успішна:", position.coords);
          const { latitude, longitude } = position.coords;
          
          // Встановлюємо координати користувача
          setFormData((prev) => ({
            ...prev,
            userLatitude: latitude,
            userLongitude: longitude,
            // Якщо useMyLocation === true, то одразу встановлюємо координати товару
            ...(prev.useMyLocation && {
              latitude,
              longitude,
            }),
          }));
          
          console.log("Запуск зворотного геокодування для:", { latitude, longitude });
          
          // Зворотне геокодування для автоматичного заповнення полів
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          )
            .then((res) => res.json())
            .then((result) => {
              console.log("Результат зворотного геокодування:", result);
              const address = result.address || {};
              
              // Використовуємо нову функцію для обробки адреси
              const processedAddress = processGeocodeAddress(address, countries);
              
              if (processedAddress) {
                // Оновлюємо поля форми
                setFormData((prev) => ({
                  ...prev,
                  countryId: String(processedAddress.country.id),
                  locationName: processedAddress.locationName,
                }));
                
                // Завантажуємо регіони для знайденої країни
                dispatch(fetchRegions(String(processedAddress.country.id)));
              }
            })
            .catch((error) => {
              console.warn("Помилка зворотного геокодування:", error);
            })
            .finally(() => {
              setIsLoadingLocation(false);
            });
        },
        (error) => {
          console.warn("Помилка геолокації:", error);
          console.warn("Код помилки:", error.code);
          console.warn("Повідомлення:", error.message);
          setIsLoadingLocation(false);
          // Можна показати повідомлення користувачу про неможливість визначити місцезнаходження
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000 // 5 хвилин
        }
      );
    }
  }, [countries, formData.userLatitude, formData.userLongitude, dispatch]);
  // --- END GEOLOCATION ---

  // Додатковий useEffect для обробки регіонів після геолокації
  useEffect(() => {
    if (formData.countryId && formData.userLatitude && formData.userLongitude) {
      // Отримуємо регіони після встановлення країни через геолокацію
      dispatch(fetchRegions(formData.countryId)).then(() => {
        // Після завантаження регіонів, спробуємо знайти підходящий регіон
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${formData.userLatitude}&lon=${formData.userLongitude}&zoom=18&addressdetails=1`
        )
          .then((res) => res.json())
          .then((result) => {
            console.log("Пошук регіону для:", result);
            const address = result.address || {};
            
            // Використовуємо нову функцію для обробки адреси
            const processedAddress = processGeocodeAddress(address, countries);
            
            if (processedAddress && processedAddress.regionName) {
              // Отримуємо регіони зі стору
              const state = (window as unknown as { store?: { getState: () => { locations?: { regions?: { id: number | string; name: string }[] } } } })?.store?.getState();
              const regions = state?.locations?.regions || [];
              
              console.log("Шукаємо регіон:", processedAddress.regionName, "серед:", regions);
              
              // Очищуємо назву регіону від суфіксів
              const cleanRegionName = processedAddress.regionName.toLowerCase().replace(/область|обл\.?/g, '').trim();
              console.log("Очищена назва регіону:", cleanRegionName);
              
              const foundRegion = regions.find(
                (r: { id: number | string; name: string }) => {
                  const regionNameLower = r.name.toLowerCase();
                  const cleanRegionFromDB = regionNameLower.replace(/область|обл\.?/g, '').trim();
                  
                  console.log(`Порівнюємо "${cleanRegionName}" з "${cleanRegionFromDB}" (оригінал: "${r.name}")`);
                  
                  return regionNameLower.includes(processedAddress.regionName.toLowerCase()) ||
                         processedAddress.regionName.toLowerCase().includes(regionNameLower) ||
                         cleanRegionFromDB === cleanRegionName ||
                         cleanRegionName.includes(cleanRegionFromDB) ||
                         cleanRegionFromDB.includes(cleanRegionName);
                }
              );
              
              console.log("Знайдений регіон:", foundRegion);
              
              if (foundRegion) {
                setFormData((prev) => ({
                  ...prev,
                  regionId: String(foundRegion.id),
                }));
              }
            }
          })
          .catch((error) => {
            console.warn("Помилка пошуку регіону:", error);
          });
      });
    }
  }, [formData.countryId, formData.userLatitude, formData.userLongitude, dispatch, countries]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    if (name === "categoryId") {
      const selectedCategory = categories.find(
        (cat) => cat.id === Number(value)
      );
      setFormData({
        ...formData,
        [name]: value,
        categoryName: selectedCategory ? selectedCategory.name : "",
      });
    } else if (name === "vatIncluded") {
      setFormData({
        ...formData,
        vatIncluded: type === "checkbox" ? !!checked : value === "true",
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  const handleMotorizedSpecChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setMotorizedSpec((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLocationChange = (name: string, value: string | number) => {
    if (name === "countryId") {
      setFormData({
        ...formData,
        countryId: String(value),
        regionId: "",
        communityId: "",
        locationId: "",
      });
    } else if (name === "regionId") {
      setFormData({
        ...formData,
        regionId: String(value),
        communityId: "",
        locationId: "",
      });
    } else if (name === "communityId") {
      setFormData({
        ...formData,
        communityId: String(value),
        locationId: "",
      });
    } else if (name === "latitude" || name === "longitude") {
      setFormData({
        ...formData,
        [name]: typeof value === "number" ? value : parseFloat(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: String(value),
      });
    }

    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  const handleBrandSelect = (brandId: string, brandName: string) => {
    setFormData({
      ...formData,
      brandId,
      brandName,
    });

    if (errors.brandId) {
      setErrors({
        ...errors,
        brandId: undefined,
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);

    setFormData({
      ...formData,
      images: newImages,
    });
  };

  const handleImagesChange = (newImages: (File | string)[]) => {
    // Filter out string images as they're handled separately
    const fileImages = newImages.filter((img): img is File => img instanceof File);

    setFormData({
      ...formData,
      images: fileImages,
    });

    if (errors.images) {
      setErrors({
        ...errors,
        images: undefined,
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) newErrors.title = "Введіть назву оголошення";
    if (!formData.brandId) newErrors.brandId = "Виберіть марку техніки";
    if (!formData.description.trim())
      newErrors.description = "Введіть опис оголошення (не менше 20 символів)";
    if (!formData.price.trim()) newErrors.price = "Введіть ціну";
    else if (
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) <= 0
    )
      newErrors.price = "Введіть коректну ціну";
    if (!formData.categoryId) newErrors.categoryId = "Виберіть категорію";
    if (!formData.countryId) newErrors.countryId = "Виберіть країну";
    if (!formData.regionId) newErrors.regionId = "Виберіть область";
    // Громада не обов'язкова!
    if (!formData.locationName?.trim())
      newErrors.locationName = "Введіть населений пункт";
    if (formData.latitude === undefined || formData.longitude === undefined)
      newErrors.latitude = "Вкажіть місцезнаходження на карті";
    if (formData.images.length === 0)
      newErrors.images = "Завантажте хоча б одне зображення";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsUploading(true);

    try {
      const formDataToSubmit = new FormData();

      // Базова інформація
      formDataToSubmit.append("title", formData.title);
      formDataToSubmit.append("description", formData.description);
      formDataToSubmit.append("price", formData.price);
      formDataToSubmit.append("currency", formData.currency);
      formDataToSubmit.append("category", formData.categoryName);
      formDataToSubmit.append("categoryId", formData.categoryId);

      // Логування координат для діагностики
      console.log("Координати для відправки:", {
        latitude: formData.latitude,
        longitude: formData.longitude,
        useMyLocation: formData.useMyLocation,
        userLatitude: formData.userLatitude,
        userLongitude: formData.userLongitude
      });

      if (formData.latitude !== undefined && formData.longitude !== undefined) {
        formDataToSubmit.append("latitude", String(formData.latitude));
        formDataToSubmit.append("longitude", String(formData.longitude));
      }

      formDataToSubmit.append("condition", formData.condition);
      formDataToSubmit.append("brandId", formData.brandId);

      const locationData = {
        countryId: Number(formData.countryId),
        regionId: Number(formData.regionId),
        ...(formData.communityId
          ? { communityId: Number(formData.communityId) }
          : {}),
        settlement: formData.locationName,
      };
      
      // Логування locationData
      console.log("LocationData для відправки:", locationData);
      
      formDataToSubmit.append("location", JSON.stringify(locationData));

      formDataToSubmit.append("priceType", formData.priceType);
      formDataToSubmit.append("vatIncluded", String(formData.vatIncluded));

      // Логування всіх даних що відправляються
      console.log("Всі дані форми:", Object.fromEntries(formDataToSubmit.entries()));

      if (isMotorized) {
        const hasFilledValues = Object.values(motorizedSpec).some((value) => {
          if (value === null || value === undefined) return false;
          if (typeof value === "string" && value.trim() === "") return false;
          if (typeof value === "boolean" && value === false) return false;
          return true;
        });

        if (hasFilledValues) {
          const numericFields = [
            "enginePower",
            "enginePowerKw",
            "fuelCapacity",
            "numberOfGears",
            "length",
            "width",
            "height",
            "weight",
            "wheelbase",
            "groundClearance",
            "workingWidth",
            "capacity",
            "liftCapacity",
            "ptoSpeed",
            "hydraulicFlow",
            "hydraulicPressure",
            "grainTankCapacity",
            "headerWidth",
            "threshingWidth",
            "cleaningArea",
            "engineHours",
            "mileage",
            "year",
          ];

          const cleanMotorizedSpec = { ...motorizedSpec };

          Object.keys(cleanMotorizedSpec).forEach((key) => {
            const typedKey = key as keyof typeof cleanMotorizedSpec;
            const value = cleanMotorizedSpec[typedKey];

            if (value === "") {
              cleanMotorizedSpec[typedKey] = null;
            } else if (
              numericFields.includes(key) &&
              typeof value === "string" &&
              value.trim() !== ""
            ) {
              cleanMotorizedSpec[typedKey] = Number(value) as never;
            }
          });

          formDataToSubmit.append(
            "motorizedSpec",
            JSON.stringify(cleanMotorizedSpec)
          );
        }
      }

      for (let i = 0; i < formData.images.length; i++) {
        const file = formData.images[i];
        if (file) {
          formDataToSubmit.append("images", file);
        }
      }

      const resultAction = await dispatch(createListing(formDataToSubmit));

      if (createListing.fulfilled.match(resultAction)) {
        navigate(`/listings/${resultAction.payload.id}`);
      } else {
        alert(
          `Не вдалося створити оголошення: ${resultAction.error?.message || "Перевірте правильність заповнення форми"}`
        );
      }
    } catch (_error) {
      alert("Виникла помилка під час створення оголошення, спробуйте пізніше.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUseMyLocationToggle = (checked: boolean) => {
    setFormData((prev) => {
      if (checked && prev.userLatitude && prev.userLongitude) {
        // Якщо включаємо "моє місцезнаходження" і є координати користувача
        return {
          ...prev,
          useMyLocation: true,
          latitude: prev.userLatitude,
          longitude: prev.userLongitude,
        };
      } else {
        // Якщо відключаємо, залишаємо координати товару як є
        return {
          ...prev,
          useMyLocation: false,
        };
      }
    });
  };

  const requestGeolocation = () => {
    if (navigator.geolocation) {
      console.log("Ручний запит геолокації...");
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Ручна геолокація успішна:", position.coords);
          const { latitude, longitude } = position.coords;
          
          setFormData((prev) => ({
            ...prev,
            userLatitude: latitude,
            userLongitude: longitude,
            ...(prev.useMyLocation && {
              latitude,
              longitude,
            }),
          }));
          
          // Зворотне геокодування
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          )
            .then((res) => res.json())
            .then((result) => {
              console.log("Ручне зворотне геокодування результат:", result);
              const address = result.address || {};
              
              // Використовуємо нову функцію для обробки адреси
              const processedAddress = processGeocodeAddress(address, countries);
              
              if (processedAddress) {
                setFormData((prev) => ({
                  ...prev,
                  countryId: String(processedAddress.country.id),
                  locationName: processedAddress.locationName,
                }));
                dispatch(fetchRegions(String(processedAddress.country.id)));
              }
            })
            .catch((error) => {
              console.warn("Помилка ручного зворотного геокодування:", error);
            })
            .finally(() => {
              setIsLoadingLocation(false);
            });
        },
        (error) => {
          console.warn("Помилка ручної геолокації:", error);
          console.warn("Код помилки:", error.code);
          console.warn("Повідомлення:", error.message);
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0 // Для ручного запиту завжди свіжі дані
        }
      );
    }
  };

  // Тест геолокації при ініціалізації компонента
  useEffect(() => {
    console.log("=== ТЕСТ ГЕОЛОКАЦІЇ ===");
    console.log("navigator.geolocation доступний:", !!navigator.geolocation);
    
    if (navigator.geolocation) {
      console.log("Тестуємо дозволи геолокації...");
      navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
        console.log("Дозвіл геолокації:", result.state);
      }).catch(() => {
        console.log("Не вдалося перевірити дозвіл геолокації");
      });
    }
  }, []);

  // Функція для обробки адреси з геокодування
  const processGeocodeAddress = (
    address: Record<string, string>, 
    countries: { id: number; name: string; code: string; latitude?: number; longitude?: number }[]
  ) => {
    console.log("Обробка адреси:", address);
    console.log("Доступні країни:", countries.map(c => `${c.name} (${c.code})`));
    
    // Знаходимо країну
    const country = countries.find(
      (c) => {
        const countryCodeMatch = c.code?.toLowerCase() === (address.country_code || "").toLowerCase();
        const countryNameMatch = c.name?.toLowerCase() === (address.country || "").toLowerCase();
        
        console.log(`Перевіряємо країну ${c.name} (${c.code}):`, {
          codeMatch: countryCodeMatch,
          nameMatch: countryNameMatch,
          searchingCode: address.country_code,
          searchingName: address.country
        });
        
        return countryCodeMatch || countryNameMatch;
      }
    );
    
    if (!country) {
      console.warn("Країну не знайдено для:", address.country_code, address.country);
      return null;
    }
    
    // Визначаємо населений пункт залежно від типу
    let locationName = "";
    
    // Пріоритет: місто -> містечко -> село -> передмістя -> район
    const locationFields = [
      'city', 'town', 'village', 'hamlet', 
      'suburb', 'neighbourhood', 'quarter', 
      'city_district', 'municipality'
    ];
    
    for (const field of locationFields) {
      if (address[field]) {
        locationName = address[field];
        break;
      }
    }
    
    // Визначаємо регіон/область залежно від країни
    let regionName = "";
    
    const countryCode = country.code?.toUpperCase();
    
    switch (countryCode) {
      case "UA": // Україна
        regionName = address.state || address.region || address.province || "";
        break;
      case "PL": // Польща  
        regionName = address.state || address.province || ""; // воєводство
        break;
      case "DE": // Німеччина
        regionName = address.state || ""; // земля (bundesland)
        break;
      case "US": // США
        regionName = address.state || ""; // штат
        break;
      case "RO": // Румунія
        regionName = address.county || address.state || ""; // повіт
        break;
      case "FR": // Франція
        regionName = address.state || address.region || ""; // регіон
        break;
      case "IT": // Італія
        regionName = address.state || address.region || ""; // регіон
        break;
      case "ES": // Іспанія
        regionName = address.state || address.region || ""; // автономна область
        break;
      case "GB": // Великобританія
        regionName = address.county || address.state || "";
        break;
      case "CZ": // Чехія
        regionName = address.state || address.region || ""; // край
        break;
      case "SK": // Словаччина
        regionName = address.state || address.region || ""; // край
        break;
      case "HU": // Угорщина
        regionName = address.county || address.state || ""; // медьє
        break;
      default: // Загальний випадок
        regionName = address.state || address.region || address.province || address.county || "";
        break;
    }
    
    console.log("Результат обробки:", {
      country: country,
      locationName,
      regionName,
      rawAddress: address
    });
    
    if (!locationName) {
      console.warn("Населений пункт не знайдено у адресі:", address);
    }
    
    if (!regionName) {
      console.warn("Регіон не знайдено у адресі:", address);
    }
    
    return {
      country,
      locationName,
      regionName
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Створення нового оголошення
      </h1>

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ліва колонка */}
          <div className="space-y-6">
            {/* Назва оголошення */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Назва оголошення *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Наприклад: Трактор John Deere 6155M, 2020"
                className={`w-full px-4 py-2 border ${
                  errors.title ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                autoComplete="off"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Марка техніки */}
            <BrandSelector
              value={formData.brandId}
              onChange={handleBrandSelect}
              error={errors.brandId || ""}
            />

            {/* Опис */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Опис *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Детальний опис товару, технічні характеристики, стан, комплектація тощо"
                rows={8}
                className={`w-full px-4 py-2 border ${
                  errors.description ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                autoComplete="off"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Ціна */}
            <PriceInput
              price={formData.price}
              currency={formData.currency}
              priceType={formData.priceType}
              vatIncluded={formData.vatIncluded}
              onChange={handleInputChange}
              error={errors.price || ""}
            />
          </div>

          {/* Права колонка */}
          <div className="space-y-6">
            {/* Категорія */}
            <CategorySelector
              value={formData.categoryId}
              onChange={handleInputChange}
              error={errors.categoryId || ""}
            />

            {/* Стан техніки */}
            <div>
              <label
                htmlFor="condition"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Стан техніки *
              </label>
              <div className="relative">
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="NEW">Нова</option>
                  <option value="USED">Вживана</option>
                </select>
              </div>
            </div>

            {/* Місцезнаходження товару */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Місцезнаходження товару</h3>
              
              {/* Тестова кнопка геолокації */}
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      console.log("Тест геолокації вручну");
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => console.log("Тест успішний:", pos.coords),
                          (err) => console.error("Тест неуспішний:", err),
                          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                      }
                    }}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded"
                  >
                    🧪 Тест геолокації
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      console.log("Поточний стан форми:", {
                        useMyLocation: formData.useMyLocation,
                        userCoords: [formData.userLatitude, formData.userLongitude],
                        productCoords: [formData.latitude, formData.longitude],
                        country: formData.countryId,
                        region: formData.regionId,
                        location: formData.locationName
                      });
                    }}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded"
                  >
                    📊 Показати стан
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      console.log("=== КРАЇНИ В БАЗІ ===");
                      console.log("Кількість країн:", countries.length);
                      countries.forEach((country, index) => {
                        console.log(`${index + 1}. ID: ${country.id}, Name: "${country.name}", Code: "${country.code}"`);
                      });
                      console.log("Шукаємо код 'ua' серед:", countries.map(c => `"${c.code}"`));
                    }}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded"
                  >
                    🏴 Показати країни
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const state = (window as unknown as { store?: { getState: () => { locations?: { regions?: { id: number | string; name: string }[] } } } })?.store?.getState();
                      const regions = state?.locations?.regions || [];
                      console.log("=== РЕГІОНИ В СТОРІ ===");
                      console.log("Кількість регіонів:", regions.length);
                      console.log("Список регіонів:", regions.map((r: { id: number | string; name: string }) => `${r.id}: ${r.name}`));
                    }}
                    className="px-3 py-1 text-xs bg-indigo-600 text-white rounded"
                  >
                    📍 Показати регіони
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.userLatitude && formData.userLongitude) {
                        fetch(
                          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${formData.userLatitude}&lon=${formData.userLongitude}&zoom=18&addressdetails=1`
                        )
                          .then((res) => res.json())
                          .then((result) => {
                            console.log("=== ТЕСТ ОБРОБКИ АДРЕСИ ===");
                            console.log("Сира адреса:", result.address);
                            const processed = processGeocodeAddress(result.address || {}, countries);
                            console.log("Оброблена адреса:", processed);
                          });
                      }
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded"
                  >
                    🌍 Тест адреси
                  </button>
                </div>
                
                <div className="text-xs text-gray-600">
                  <div>Користувач: {formData.userLatitude ? `${formData.userLatitude.toFixed(4)}, ${formData.userLongitude?.toFixed(4)}` : 'не визначено'}</div>
                  <div>Товар: {formData.latitude ? `${formData.latitude.toFixed(4)}, ${formData.longitude?.toFixed(4)}` : 'не визначено'}</div>
                  <div>Країна: {formData.countryId || 'не вибрано'} | Регіон: {formData.regionId || 'не вибрано'}</div>
                  <div>Місто: {formData.locationName || 'не визначено'}</div>
                </div>
              </div>
              
              {/* Перемикач "Використовувати моє місцезнаходження" */}
              <div className="flex items-center space-x-2">
                <input
                  id="useMyLocation"
                  type="checkbox"
                  checked={formData.useMyLocation}
                  onChange={(e) => handleUseMyLocationToggle(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="useMyLocation"
                  className="block text-sm text-gray-900"
                >
                  Використовувати моє місцезнаходження
                </label>
                {isLoadingLocation && (
                  <div className="flex items-center text-blue-600">
                    <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs">Визначення...</span>
                  </div>
                )}
              </div>
              
              {!formData.useMyLocation && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                  💡 Виберіть місце розташування товару на карті нижче
                </div>
              )}
              
              {formData.useMyLocation && formData.userLatitude && formData.userLongitude && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  ✅ Ваше місцезнаходження визначено автоматично
                </div>
              )}
              
              {formData.useMyLocation && !formData.userLatitude && !isLoadingLocation && (
                <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <span>⚠️ Не вдалося визначити ваше місцезнаходження.</span>
                    <button
                      type="button"
                      onClick={requestGeolocation}
                      className="ml-2 px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      Спробувати ще раз
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Локація */}
            <LocationSelector
              countries={countries}
              data={{
                countryId: formData.countryId,
                regionId: formData.regionId,
                communityId: formData.communityId,
                locationName: formData.locationName,
                latitude: formData.latitude || 0,
                longitude: formData.longitude || 0,
              }}
              errors={{
                countryId: errors.countryId || "",
                regionId: errors.regionId || "",
                communityId: errors.communityId || "",
                locationName: errors.locationName || "",
                latitude: errors.latitude || "",
              }}
              onChange={handleLocationChange}
              mapLoaded={mapLoaded}
              useCountryCoordinates={true}
            />

            {/* Завантаження зображень */}
            <ImageUploader
              images={formData.images}
              onChange={handleImagesChange}
              onRemove={handleRemoveImage}
              error={errors.images || ""}
            />
          </div>
        </div>

        {/* Технічні характеристики */}
        <MotorizedSpecFormComponent
          isMotorized={isMotorized}
          motorizedSpec={motorizedSpec}
          onChange={handleMotorizedSpecChange}
        />

        <div className="mt-8 flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Скасувати
          </button>
          <button
            type="submit"
            disabled={isLoading || isUploading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading || isUploading
              ? "Публікація..."
              : "Опублікувати оголошення"}
          </button>
        </div>
      </form>
    </div>
  );

  };

export default CreateListingPage;