import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchCategories } from "../store/catalogSlice";
import { fetchBrands } from "../store/brandSlice";
import { createListing } from "../store/listingSlice";
import {
  fetchRegions,
  fetchCommunities,
  fetchLocations,
} from "../store/locationSlice";
import { Upload, X, Plus, ChevronDown } from "lucide-react";
import { formatPriceWithSymbol, getCurrencySymbol } from "../utils/formatters";
import { countriesAPI } from "../api/apiClient";
import { useRef } from "react";

// Add Leaflet to the Window type for TypeScript
declare global {
  interface Window {
    L: any;
  }
}

// Додайте цей об'єкт для центрів країн
const countryCenters: Record<string, [number, number]> = {
  UA: [48.3794, 31.1656], // Україна
  PL: [52.069167, 19.480556], // Польща
  // додайте інші країни за потреби
};

// --- MotorizedSpec тип ---
interface MotorizedSpecForm {
  model: string;
  year: string;
  serialNumber: string;
  enginePower: string;
  enginePowerKw: string;
  engineModel: string;
  fuelType: string;
  fuelCapacity: string;
  transmission: string;
  numberOfGears: string;
  length: string;
  width: string;
  height: string;
  weight: string;
  wheelbase: string;
  groundClearance: string;
  workingWidth: string;
  capacity: string;
  liftCapacity: string;
  threePtHitch: boolean;
  pto: boolean;
  ptoSpeed: string;
  frontAxle: string;
  rearAxle: string;
  frontTireSize: string;
  rearTireSize: string;
  hydraulicFlow: string;
  hydraulicPressure: string;
  grainTankCapacity: string;
  headerWidth: string;
  threshingWidth: string;
  cleaningArea: string;
  engineHours: string;
  mileage: string;
  lastServiceDate: string;
  nextServiceDate: string;
  isOperational: boolean;
}

const initialMotorizedSpec: MotorizedSpecForm = {
  model: "",
  year: "",
  serialNumber: "",
  enginePower: "",
  enginePowerKw: "",
  engineModel: "",
  fuelType: "DIESEL",
  fuelCapacity: "",
  transmission: "MANUAL",
  numberOfGears: "",
  length: "",
  width: "",
  height: "",
  weight: "",
  wheelbase: "",
  groundClearance: "",
  workingWidth: "",
  capacity: "",
  liftCapacity: "",
  threePtHitch: false,
  pto: false,
  ptoSpeed: "",
  frontAxle: "",
  rearAxle: "",
  frontTireSize: "",
  rearTireSize: "",
  hydraulicFlow: "",
  hydraulicPressure: "",
  grainTankCapacity: "",
  headerWidth: "",
  threshingWidth: "",
  cleaningArea: "",
  engineHours: "",
  mileage: "",
  lastServiceDate: "",
  nextServiceDate: "",
  isOperational: true,
};

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
  brandId?: string;
  latitude?: string;
  longitude?: string;
}

const CreateListingPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
 const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const { categories, status: categoriesStatus } = useAppSelector(
    (state) => state.catalog
  );
  const { brands, status: brandsStatus } = useAppSelector(
    (state) => state.brands
  );
  const { isLoading } = useAppSelector((state) => state.listing);
  const {
    regions,
    communities,
    status: locationStatus,
  } = useAppSelector((state) => state.locations);

  const [countries, setCountries] = useState<{ id: number; name: string; code: string }[]>([]);
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
  });

  const [motorizedSpec, setMotorizedSpec] =
    useState<MotorizedSpecForm>(initialMotorizedSpec);

  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");
  const [brandsDropdownOpen, setBrandsDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // --- Карта ---
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (categories.length === 0) dispatch(fetchCategories());
    if (brands.length === 0) dispatch(fetchBrands());
    countriesAPI.getAll().then((res) => {
      setCountries(res.data.data || []);
    });
  }, [dispatch, categories.length, brands.length]);

  useEffect(() => {
    if (formData.countryId) {
      dispatch(fetchRegions(formData.countryId));
      setFormData((prev) => ({
        ...prev,
        regionId: "",
        communityId: "",
        locationId: "",
      }));
    }
  }, [dispatch, formData.countryId]);

  useEffect(() => {
    if (formData.regionId) {
      dispatch(fetchCommunities(formData.regionId));
      setFormData((prev) => ({
        ...prev,
        communityId: "",
        locationId: "",
      }));
    }
  }, [dispatch, formData.regionId]);

  useEffect(() => {
    if (formData.communityId) {
      dispatch(fetchLocations(formData.communityId));
      setFormData((prev) => ({
        ...prev,
        locationId: "",
      }));
    }
  }, [dispatch, formData.communityId]);

  // --- Карта: Leaflet ---
 // 1. Динамічне підключення leaflet
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

  // 2. Ініціалізація карти лише один раз
  useEffect(() => {
    if (
      mapLoaded &&
      window.L &&
      document.getElementById("listing-map") &&
      !mapRef.current
    ) {
      const L = window.L;
      const country = countries.find((c) => c.id.toString() === formData.countryId);
      const center = countryCenters[country?.code || "UA"] || [48.3794, 31.1656];
      mapRef.current = L.map("listing-map").setView(center, 6);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://osm.org/copyright">OSM</a>',
      }).addTo(mapRef.current);

      mapRef.current.on("click", function (e: any) {
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = L.marker(e.latlng, { draggable: true }).addTo(mapRef.current);
          markerRef.current.on("dragend", function (event: any) {
            const latlng = event.target.getLatLng();
            setFormData((prev) => ({
              ...prev,
              latitude: latlng.lat,
              longitude: latlng.lng,
            }));
          });
        }
        setFormData((prev) => ({
          ...prev,
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        }));
      });
    }
    // eslint-disable-next-line
  }, [mapLoaded]);

  // 3. Зміна центру карти при зміні країни
  useEffect(() => {
    if (mapRef.current && countries.length && formData.countryId) {
      const country = countries.find((c) => c.id.toString() === formData.countryId);
      const center = countryCenters[country?.code || "UA"] || [48.3794, 31.1656];
      mapRef.current.setView(center, 6);
      // Скидаємо маркер при зміні країни
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      setFormData((prev) => ({
        ...prev,
        latitude: undefined,
        longitude: undefined,
      }));
    }
    // eslint-disable-next-line
  }, [formData.countryId, countries]);

  // 4. Встановлення маркера, якщо вже є координати
  useEffect(() => {
    if (
      mapRef.current &&
      window.L &&
      formData.latitude &&
      formData.longitude
    ) {
      const L = window.L;
      if (markerRef.current) {
        markerRef.current.setLatLng([formData.latitude, formData.longitude]);
      } else {
        markerRef.current = L.marker([formData.latitude, formData.longitude], { draggable: true }).addTo(mapRef.current);
        markerRef.current.on("dragend", function (event: any) {
          const latlng = event.target.getLatLng();
          setFormData((prev) => ({
            ...prev,
            latitude: latlng.lat,
            longitude: latlng.lng,
          }));
        });
      }
      mapRef.current.setView([formData.latitude, formData.longitude], 12);
    }
    // eslint-disable-next-line
  }, [formData.latitude, formData.longitude]);

  const selectedCategoryObj = categories.find(
    (cat) => cat.id === Number(formData.categoryId)
  );
  const isMotorized = selectedCategoryObj?.isMotorized ?? false;

  const isUkraine =
    countries.find((c) => c.id.toString() === formData.countryId)?.code ===
    "UA";

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "categoryId") {
      const selectedCategory = categories.find(
        (cat) => cat.id === Number(value)
      );
      setFormData({
        ...formData,
        [name]: value,
        categoryName: selectedCategory ? selectedCategory.name : "",
      });
    } else if (name === "brandId") {
      const selectedBrand = brands.find((brand) => brand.id === Number(value));
      setFormData({
        ...formData,
        [name]: value,
        brandName: selectedBrand ? selectedBrand.name : "",
      });
    } else if (name === "countryId") {
      setFormData({
        ...formData,
        countryId: value,
        regionId: "",
        communityId: "",
        locationId: "",
      });
    } else if (name === "regionId") {
      setFormData({
        ...formData,
        regionId: value,
        communityId: "",
        locationId: "",
      });
    } else if (name === "communityId") {
      setFormData({
        ...formData,
        communityId: value,
        locationId: "",
      });
    } else if (name === "locationId") {
      setFormData({
        ...formData,
        locationId: value,
      });
    } else if (name === "locationName") {
      setFormData({
        ...formData,
        locationName: value,
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

  const handleBrandSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrandSearchQuery(e.target.value);
    setBrandsDropdownOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    handleFiles(Array.from(files));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);

    const newPreviewUrls = [...imagePreviewUrls];
    newPreviewUrls.splice(index, 1);

    setFormData({
      ...formData,
      images: newImages,
    });

    setImagePreviewUrls(newPreviewUrls);
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
    if (isUkraine && !formData.communityId)
      newErrors.communityId = "Виберіть громаду";
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
      formDataToSubmit.append("title", formData.title);
      formDataToSubmit.append("description", formData.description);
      formDataToSubmit.append("price", formData.price);
      formDataToSubmit.append("currency", formData.currency);
      formDataToSubmit.append("category", formData.categoryName);
      formDataToSubmit.append("categoryId", formData.categoryId);
      formDataToSubmit.append("countryId", formData.countryId);
      formDataToSubmit.append("regionId", formData.regionId);
      if (isUkraine) formDataToSubmit.append("communityId", formData.communityId);
      formDataToSubmit.append("locationName", formData.locationName);
      formDataToSubmit.append("latitude", String(formData.latitude ?? ""));
      formDataToSubmit.append("longitude", String(formData.longitude ?? ""));
      formDataToSubmit.append(
        "condition",
        formData.condition === "NEW" ? "new" : "used"
      );
      formDataToSubmit.append("brandId", formData.brandId);

      if (isMotorized) {
        Object.entries(motorizedSpec).forEach(([key, value]) => {
          formDataToSubmit.append(
            `motorizedSpec.${key}`,
            value?.toString() ?? ""
          );
        });
      }

      formData.images.forEach((image) => {
        formDataToSubmit.append("images", image);
      });

      const resultAction = await dispatch(createListing(formDataToSubmit));

      if (createListing.fulfilled.match(resultAction)) {
        navigate(`/listings/${resultAction.payload.id}`);
      } else {
        alert("Не вдалося створити оголошення, спробуйте ще раз.");
      }
    } catch (_) {
      alert("Виникла помилка під час створення оголошення, спробуйте пізніше.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFiles = (files: File[]) => {
    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const imageFiles = files.filter((file) =>
      validImageTypes.includes(file.type)
    );

    if (imageFiles.length === 0) {
      setErrors({ ...errors, images: "Завантажте тільки зображення" });
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = imageFiles.filter(
      (file) => file.size > MAX_FILE_SIZE
    );
    if (oversizedFiles.length > 0) {
      setErrors({
        ...errors,
        images: "Розмір зображення не може перевищувати 5MB",
      });
      return;
    }

    const totalImages = formData.images.length + imageFiles.length;
    if (totalImages > 10) {
      setErrors({ ...errors, images: "Максимум 10 фото" });
      return;
    }

    const newPreviewUrls = imageFiles.map((file) => URL.createObjectURL(file));
    setFormData({
      ...formData,
      images: [...formData.images, ...imageFiles],
    });
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);

    if (errors.images) {
      setErrors({ ...errors, images: undefined });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Створення нового оголошення
      </h1>
      <form onSubmit={handleSubmit}>
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
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>
            {/* Марка техніки */}
            <div>
              <label
                htmlFor="brandId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Марка техніки *
              </label>
              <div className="relative" id="brands-dropdown-container">
                <div
                  className={`relative w-full border ${
                    errors.brandId ? "border-red-500" : "border-gray-300"
                  } rounded-md focus-within:ring-1 focus-within:ring-green-500 focus-within:border-green-500`}
                >
                  <input
                    type="text"
                    placeholder="Почніть вводити назву марки..."
                    value={brandSearchQuery}
                    onChange={handleBrandSearchChange}
                    onFocus={() => setBrandsDropdownOpen(true)}
                    className="w-full px-4 py-2 rounded-md focus:outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <button
                      type="button"
                      onClick={() => setBrandsDropdownOpen(!brandsDropdownOpen)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown size={18} className="text-gray-400" />
                    </button>
                  </div>
                </div>
                {brandsDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {brandsStatus === "loading" ? (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        Завантаження марок...
                      </div>
                    ) : Array.isArray(brands) && brands.length > 0 ? (
                      <ul className="py-1">
                        <li className="px-4 py-1 text-xs text-gray-500 border-b">
                          Знайдено брендів: {brands.length}
                        </li>
                        {brands
                          .filter((brand) =>
                            brandSearchQuery
                              ? brand.name
                                  .toLowerCase()
                                  .includes(brandSearchQuery.toLowerCase())
                              : true
                          )
                          .map((brand) => (
                            <li key={brand.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    brandId: brand.id.toString(),
                                    brandName: brand.name,
                                  });
                                  setBrandSearchQuery(brand.name);
                                  setBrandsDropdownOpen(false);
                                  if (errors.brandId) {
                                    setErrors(prev => {
                                      const { brandId, ...rest } = prev;
                                      return rest;
                                    });
                                  }
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                  formData.brandId === brand.id.toString()
                                    ? "bg-green-50 text-green-700"
                                    : "text-gray-700"
                                }`}
                              >
                                {brand.name}
                              </button>
                            </li>
                          ))}
                        {brands.filter((brand) =>
                          brandSearchQuery
                            ? brand.name
                                .toLowerCase()
                                .includes(brandSearchQuery.toLowerCase())
                            : true
                        ).length === 0 && (
                          <li className="px-4 py-2 text-sm text-gray-500">
                            За вашим запитом нічого не знайдено
                          </li>
                        )}
                      </ul>
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        Немає доступних марок
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.brandId && (
                <p className="mt-1 text-sm text-red-500">{errors.brandId}</p>
              )}
            </div>
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
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.description}
                </p>
              )}
            </div>
            {/* Ціна з вибором валюти */}
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ціна *
              </label>
              <div className="flex">
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder={`Наприклад: 1000000 ${getCurrencySymbol(formData.currency)}`}
                  min="0"
                  step="1"
                  className={`w-3/4 px-4 py-2 border ${
                    errors.price ? "border-red-500" : "border-gray-300"
                  } rounded-l-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                />
                <div className="relative w-1/4">
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="appearance-none w-full h-full px-3 py-2 border-l-0 border border-gray-300 rounded-r-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="UAH">{getCurrencySymbol("UAH")} UAH</option>
                    <option value="USD">{getCurrencySymbol("USD")} USD</option>
                    <option value="EUR">{getCurrencySymbol("EUR")} EUR</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown size={18} className="text-gray-400" />
                  </div>
                </div>
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-500">{errors.price}</p>
              )}
              {formData.price && !errors.price && (
                <div className="text-sm text-gray-500 mt-1">
                  Буде відображатися як:{" "}
                  {formatPriceWithSymbol(formData.price, formData.currency)}
                </div>
              )}
            </div>
          </div>
          {/* Права колонка */}
          <div className="space-y-6">
            {/* Категорія */}
            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Категорія *
              </label>
              <div className="relative">
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className={`appearance-none w-full px-4 py-2 border ${
                    errors.categoryId ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                >
                  <option value="">Виберіть категорію</option>
                  {categoriesStatus === "loading" ? (
                    <option disabled>Завантаження категорій...</option>
                  ) : (
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
              </div>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>
              )}
            </div>
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
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
              </div>
            </div>
            {/* Місцезнаходження */}
            {/* Країна */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Країна *
              </label>
              <div className="relative">
                <select
                  id="countryId"
                  name="countryId"
                  value={formData.countryId}
                  onChange={handleInputChange}
                  className={`appearance-none w-full px-4 py-2 border ${
                    errors.countryId ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                >
                  <option value="">Виберіть країну</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
              </div>
              {errors.countryId && (
                <p className="mt-1 text-sm text-red-500">{errors.countryId}</p>
              )}
            </div>
            {/* Область */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Область *
              </label>
              <div className="relative">
                <select
                  id="regionId"
                  name="regionId"
                  value={formData.regionId}
                  onChange={handleInputChange}
                  disabled={!formData.countryId}
                  className={`appearance-none w-full px-4 py-2 border ${
                    errors.regionId ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                >
                  <option value="">Виберіть область</option>
                  {locationStatus === "loading" ? (
                    <option disabled>Завантаження областей...</option>
                  ) : (
                    Array.isArray(regions) &&
                    regions.map((region: { id: number; name: string }) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
              </div>
              {errors.regionId && (
                <p className="mt-1 text-sm text-red-500">{errors.regionId}</p>
              )}
            </div>
            {/* Громада (тільки для України) */}
            {isUkraine && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Громада {isUkraine ? "" : "(не обов'язково)"}
                </label>
                <div className="relative">
                  <select
                    id="communityId"
                    name="communityId"
                    value={formData.communityId}
                    onChange={handleInputChange}
                    disabled={!formData.regionId}
                    className={`appearance-none w-full px-4 py-2 border ${
                      errors.communityId ? "border-red-500" : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                  >
                    <option value="">Виберіть громаду</option>
                    {locationStatus === "loading" ? (
                      <option disabled>Завантаження громад...</option>
                    ) : (
                      communities?.map((community: any) => (
                        <option key={community.id} value={community.id}>
                          {community.name}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown size={18} className="text-gray-400" />
                  </div>
                </div>
                {errors.communityId && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.communityId}
                  </p>
                )}
              </div>
            )}
            {/* Населений пункт */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Населений пункт *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="locationName"
                  name="locationName"
                  value={formData.locationName}
                  onChange={handleInputChange}
                  placeholder="Введіть назву населеного пункту"
                  className={`appearance-none w-full px-4 py-2 border ${
                    errors.locationName ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                />
              </div>
              {errors.locationName && (
                <p className="mt-1 text-sm text-red-500">{errors.locationName}</p>
              )}
            </div>
            {/* Карта для вибору координат */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Вкажіть місцезнаходження на карті *
              </label>
              <div className="w-full h-64 rounded-md border border-gray-300 overflow-hidden">
                <div id="listing-map" style={{ width: "100%", height: "100%" }} />
              </div>
              {errors.latitude && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.latitude || errors.longitude}
                </p>
              )}
              {formData.latitude && formData.longitude && (
                <div className="text-xs text-gray-500 mt-1">
                  Координати: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </div>
              )}
            </div>
            {/* Завантаження зображень */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Фотографії *
              </label>
              <div
                className={`border-2 border-dashed ${
                  isDragging
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300"
                } rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Upload size={36} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-700 mb-1">
                  Перетягніть зображення сюди або натисніть, щоб вибрати
                </p>
                <p className="text-xs text-gray-500">
                  Підтримувані формати: JPEG, PNG, GIF, WEBP. Максимум 10 фото,
                  до 5MB кожне.
                </p>
              </div>
              {errors.images && (
                <p className="mt-2 text-sm text-red-500">{errors.images}</p>
              )}
              {imagePreviewUrls.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Завантажені зображення ({imagePreviewUrls.length}/10)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {imagePreviewUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative aspect-w-1 aspect-h-1 rounded-md overflow-hidden group"
                      >
                        <img
                          src={url}
                          alt={`Зображення ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                    {imagePreviewUrls.length < 10 && (
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() =>
                          document.getElementById("image-upload")?.click()
                        }
                      >
                        <Plus size={24} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* --- MOTORIZE FIELDS --- */}
        {isMotorized && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Технічні характеристики (моторизована техніка)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Модель
                </label>
                <input
                  type="text"
                  name="model"
                  value={motorizedSpec.model}
                  onChange={handleMotorizedSpecChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Рік випуску
                </label>
                <input
                  type="number"
                  name="year"
                  value={motorizedSpec.year}
                  onChange={handleMotorizedSpecChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Потужність двигуна (к.с.)
                </label>
                <input
                  type="number"
                  name="enginePower"
                  value={motorizedSpec.enginePower}
                  onChange={handleMotorizedSpecChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип пального
                </label>
                <select
                  name="fuelType"
                  value={motorizedSpec.fuelType}
                  onChange={handleMotorizedSpecChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="DIESEL">Дизель</option>
                  <option value="GASOLINE">Бензин</option>
                  <option value="ELECTRIC">Електро</option>
                  <option value="HYBRID">Гібрид</option>
                  <option value="GAS">Газ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  В робочому стані
                </label>
                <input
                  type="checkbox"
                  name="isOperational"
                  checked={motorizedSpec.isOperational}
                  onChange={handleMotorizedSpecChange}
                  className="mr-2"
                />
                <span>Так</span>
              </div>
              {/* Додайте інші поля за потреби */}
            </div>
          </div>
        )}
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