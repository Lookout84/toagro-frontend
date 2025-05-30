import { useState, useEffect } from "react";
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
    L: any;
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
  const { categories } = useAppSelector(
    (state) => state.catalog
  );
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
  });

  const [motorizedSpec, setMotorizedSpec] =
    useState<MotorizedSpecFormType>(initialMotorizedSpec);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isUploading, setIsUploading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

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

      // Виправлено: Перевіряємо, що числа відправляються як числа, а не порожні рядки
      if (formData.latitude !== undefined && formData.longitude !== undefined) {
        formDataToSubmit.append("latitude", String(formData.latitude));
        formDataToSubmit.append("longitude", String(formData.longitude));
      }

      // Виправлено: відправляємо condition у правильному форматі
      formDataToSubmit.append("condition", formData.condition);
      formDataToSubmit.append("brandId", formData.brandId);

      // Виправлено: Переконуємося що всі поля JSON правильно сформовані
      const locationData = {
        countryId: Number(formData.countryId),
        regionId: Number(formData.regionId),
        ...(formData.communityId
          ? { communityId: Number(formData.communityId) }
          : {}),
        settlement: formData.locationName,
      };
      formDataToSubmit.append("location", JSON.stringify(locationData));

      // Додаємо нові поля
      formDataToSubmit.append("priceType", formData.priceType);
      formDataToSubmit.append("vatIncluded", String(formData.vatIncluded));

      // Виправлено: Переконуємося що motorizedSpec правильно конвертується
      if (isMotorized) {
        // Перевіряємо, чи є заповнені поля
        const hasFilledValues = Object.values(motorizedSpec).some((value) => {
          if (value === null || value === undefined) return false;
          if (typeof value === "string" && value.trim() === "") return false;
          if (typeof value === "boolean" && value === false) return false;
          return true;
        });

        if (hasFilledValues) {
          // Конвертуємо числові поля безпечно
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

          // Конвертуємо порожні рядки в null і числові поля в числа
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
                cleanMotorizedSpec[typedKey] = Number(value) as any;
              }
          });

          formDataToSubmit.append(
            "motorizedSpec",
            JSON.stringify(cleanMotorizedSpec)
          );
        }
      }

      // Додаємо зображення
      for (let i = 0; i < formData.images.length; i++) {
        const file = formData.images[i];
        if (file) {
          formDataToSubmit.append("images", file);
        }
      }

      // Логуємо дані для налагодження
      console.log("Submitting form data:", {
        title: formData.title,
        description: formData.description.substring(0, 30) + "...",
        price: formData.price,
        currency: formData.currency,
        category: formData.categoryName,
        categoryId: formData.categoryId,
        location: locationData,
        imagesCount: formData.images.length,
        condition: formData.condition,
      });

      const resultAction = await dispatch(createListing(formDataToSubmit));

      if (createListing.fulfilled.match(resultAction)) {
        navigate(`/listings/${resultAction.payload.id}`);
      } else {
        console.error("Create listing failed:", resultAction.error);
        alert(
          `Не вдалося створити оголошення: ${resultAction.error?.message || "Перевірте правильність заповнення форми"}`
        );
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Виникла помилка під час створення оголошення, спробуйте пізніше.");
    } finally {
      setIsUploading(false);
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

            {/* Марка техніки - використовуємо компонент BrandSelector */}
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
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Ціна з вибором валюти - використовуємо компонент PriceInput */}
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
            {/* Категорія - використовуємо компонент CategorySelector */}
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

            {/* Локація - використовуємо компонент LocationSelector */}
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
            />

            {/* Завантаження зображень - використовуємо компонент ImageUploader */}
            <ImageUploader
              images={formData.images}
              onChange={handleImagesChange}
              onRemove={handleRemoveImage}
              error={errors.images || ""}
            />
          </div>
        </div>

        {/* Технічні характеристики - використовуємо компонент MotorizedSpecForm */}
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
