import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchListingById, updateListing } from "../store/listingSlice";
import { fetchCategories } from "../store/catalogSlice";
import { fetchBrands } from "../store/brandSlice";
import {
  fetchRegions,
  fetchCommunities,
  fetchLocations,
} from "../store/locationSlice";
import { ensureFreshToken } from "../utils/tokenRefresh";
import { countriesAPI, listingsAPI } from "../api/apiClient";
import MotorizedSpecFormComponent, {
  initialMotorizedSpec,
  MotorizedSpecForm as MotorizedSpecFormType,
} from "../components/ui/MotorizedSpecForm";
import CategorySelector from "../components/ui/CategorySelector";
import BrandSelector from "../components/ui/BrandSelector";
import PriceInput from "../components/ui/PriceInput";
import ImageUploader from "../components/ui/ImageUploader";
import LocationSelector from "../components/ui/LocationSelector";
import Loader from "../components/common/Loader";

interface FormData {
  title: string;
  description: string;
  price: string;
  currency: "UAH" | "USD" | "EUR";
  categoryId: string;
  categoryName?: string;
  regionId: string;
  communityId: string;
  locationId: string;
  locationName: string;
  images: (File | string)[];
  countryId: string;
  condition: "NEW" | "USED";
  brandId: string;
  brandName: string;
  priceType: "NETTO" | "BRUTTO";
  vatIncluded: boolean;
}

interface FormErrors {
  title?: string | undefined;
  description?: string | undefined;
  price?: string | undefined;
  categoryId?: string | undefined;
  countryId?: string | undefined;
  regionId?: string | undefined;
  communityId?: string | undefined;
  locationId?: string | undefined;
  locationName?: string | undefined;
  images?: string | undefined;
  brandId?: string | undefined;
  latitude?: string | undefined;
}

const EditListingPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux selectors
  const { currentListing, isLoading } = useAppSelector(
    (state) => state.listing
  );
  const { categories } = useAppSelector((state) => state.catalog);
  const { locations } = useAppSelector(
    (state) => state.locations
  );

  // State
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    price: "",
    currency: "UAH",
    categoryId: "",
    regionId: "",
    communityId: "",
    locationId: "",
    locationName: "",
    images: [],
    countryId: "",
    condition: "USED",
    brandId: "",
    brandName: "",
    priceType: "NETTO",
    vatIncluded: false,
  });

  const [motorizedSpec, setMotorizedSpec] =
    useState<MotorizedSpecFormType>(initialMotorizedSpec);
  const [errors, setErrors] = useState<FormErrors>({});
  const [countries, setCountries] = useState<
    {
      id: number;
      name: string;
      code: string;
      latitude?: number;
      longitude?: number;
    }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [mapLoaded, setMapLoaded] = useState(false);

  // // References
  // const mapRef = useRef<any>(null);
  // const markerRef = useRef<any>(null);

  // Get country code and check if it's Ukraine
  const selectedCountry = countries.find(
    (c) => c.id.toString() === formData.countryId
  );
  const isUkraine = selectedCountry?.code === "UA";

  // Load initial data: listing and categories
  useEffect(() => {
    if (id) {
      dispatch(fetchListingById(parseInt(id)));
    }

    dispatch(fetchCategories());
    dispatch(fetchBrands());

    // Get countries list
    countriesAPI.getAll().then((res) => {
      if (res.data && res.data.data) {
        setCountries(res.data.data);
      }
    });
  }, [dispatch, id]);

  // Load Leaflet dynamically
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

  // Check if selected category is motorized
  const selectedCategoryObj = categories.find(
    (cat) => cat.id === Number(formData.categoryId)
  );
  const isMotorized = selectedCategoryObj?.isMotorized ?? false;

  // Helper function to get value from listing data
  const getListingValue = useCallback(
    (key: string, defaultValue: any = "") => {
      if (!currentListing) return defaultValue;

      // Special handling for coordinates and location
      if (key === "latitude" || key === "longitude") {
        // Try to find coordinates in various places
        if (currentListing && typeof currentListing === "object") {
          // Direct in listing object
          if (key in currentListing) {
            return currentListing[key as keyof typeof currentListing];
          }

          // In location object if exists
          if ("location" in currentListing && currentListing.location) {
            const location = currentListing.location as any;
            if (key in location) {
              return location[key];
            }
          }

          // In data.location
          if (
            "data" in currentListing &&
            (currentListing as any).data &&
            typeof (currentListing as any).data === "object"
          ) {
            const data = (currentListing as any).data;

            // Check data.location
            if ("location" in data && data.location) {
              if (key in data.location) {
                return data.location[key];
              }
            }

            // Check data.listing.location
            if (
              "listing" in data &&
              data.listing &&
              "location" in data.listing &&
              data.listing.location
            ) {
              if (key in data.listing.location) {
                return data.listing.location[key];
              }
            }
          }
        }
      }

      // Special handling for location object
      if (key === "location") {
        if (currentListing && typeof currentListing === "object") {
          // Direct in listing
          if ("location" in currentListing) {
            return currentListing.location;
          }

          // In data
          if (
            typeof currentListing === "object" &&
            currentListing !== null &&
            "data" in currentListing &&
            (currentListing as any).data &&
            typeof (currentListing as any).data === "object"
          ) {
            const data = (currentListing as any).data;

            // Check data.location
            if ("location" in data) {
              return data.location;
            }

            // Check data.listing.location
            if (
              "listing" in data &&
              data.listing &&
              "location" in data.listing
            ) {
              return data.listing.location;
            }
          }
        }
        return defaultValue;
      }

      // Regular fields - check directly in listing
      if (
        currentListing &&
        typeof currentListing === "object" &&
        key in currentListing
      ) {
        const value = currentListing[key as keyof typeof currentListing];
        return value !== null && value !== undefined ? value : defaultValue;
      }

      // Check in data object
      if (
        currentListing &&
        typeof currentListing === "object" &&
        "data" in currentListing &&
        (currentListing as any).data !== null &&
        typeof (currentListing as any).data === "object"
      ) {
        const data = (currentListing as any).data as Record<string, any>;

        // Check directly in data
        if (key in data) {
          return data[key] !== null && data[key] !== undefined
            ? data[key]
            : defaultValue;
        }

        // Check in data.listing
        if (
          "listing" in data &&
          data.listing !== null &&
          typeof data.listing === "object" &&
          key in data.listing
        ) {
          return data.listing[key] !== null && data.listing[key] !== undefined
            ? data.listing[key]
            : defaultValue;
        }
      }

      return defaultValue;
    },
    [currentListing]
  );

  // Log listing structure for debugging
  useEffect(() => {
    if (currentListing) {
      console.log("Current listing data structure:", currentListing);
    }
  }, [currentListing]);

  // Initialize form with listing data
  useEffect(() => {
    if (currentListing && !isInitialized) {
      try {
        console.log("Initializing form with listing data:", currentListing);

        // Extract base data from API response
        let listingData: any = currentListing;

        // Check if data is nested in data or data.listing objects
        if ((currentListing as any).data) {
          if ((currentListing as any).data.listing) {
            listingData = (currentListing as any).data.listing;
          } else {
            listingData = (currentListing as any).data;
          }
        }

        // Basic fields
        const title = getListingValue("title", "");
        const description = getListingValue("description", "");
        const price = getListingValue("price", "");
        const currency = getListingValue("currency", "UAH");
        const categoryId = getListingValue("categoryId", "");
        const brandId = getListingValue("brandId", "");
        const brandName = getListingValue("brandName", "");
        const condition = getListingValue("condition", "USED");
        const priceType = getListingValue("priceType", "NETTO");
        const vatIncluded = getListingValue("vatIncluded", false);

        // Location handling
        // First try to get the complete location object
        const locationObj = getListingValue("location", null);
        console.log("Location object found:", locationObj);

        // Extract location fields from the location object or fallback to direct fields
        let countryId = "";
        let regionId = "";
        let communityId = "";
        let locationId = "";
        let locationName = "";

        // Оновіть частину коду, де отримуються дані локації
        if (locationObj) {
          // Переконуємося, що отримуємо числові значення і конвертуємо їх у рядки
          countryId =
            locationObj.countryId !== undefined
              ? String(locationObj.countryId)
              : locationObj.country?.id !== undefined
                ? String(locationObj.country.id)
                : "";

          regionId =
            locationObj.regionId !== undefined
              ? String(locationObj.regionId)
              : locationObj.region?.id !== undefined
                ? String(locationObj.region.id)
                : "";

          communityId =
            locationObj.communityId !== undefined
              ? String(locationObj.communityId)
              : locationObj.community?.id !== undefined
                ? String(locationObj.community.id)
                : "";

          locationId =
            locationObj.id !== undefined ? String(locationObj.id) : "";
          locationName = locationObj.settlement || locationObj.name || "";

          console.log("Location fields from object (after conversion):", {
            countryId,
            regionId,
            communityId,
            locationId,
            locationName,
          });
        } else {
          // Fallback to direct fields if location object not found
          countryId = getListingValue("countryId", "");
          regionId = getListingValue("regionId", "");
          communityId = getListingValue("communityId", "");
          locationId = getListingValue("locationId", "");
          locationName = getListingValue(
            "locationName",
            getListingValue("settlement", "")
          );

          console.log("Location fields from direct properties:", {
            countryId,
            regionId,
            communityId,
            locationId,
            locationName,
          });
        }

        // Coordinates - try multiple sources
        let lat: number | undefined = undefined;
        let lng: number | undefined = undefined;

        // Try direct coordinates
        const directLat = getListingValue("latitude", undefined);
        const directLng = getListingValue("longitude", undefined);

        if (directLat !== undefined && directLng !== undefined) {
          lat = directLat;
          lng = directLng;
          console.log("Found direct coordinates:", { lat, lng });
        }
        // Try location object coordinates
        else if (
          locationObj &&
          locationObj.latitude !== undefined &&
          locationObj.longitude !== undefined
        ) {
          lat = locationObj.latitude;
          lng = locationObj.longitude;
          console.log("Found coordinates in location object:", { lat, lng });
        }

        // ВСТАВТЕ КОД СЮДИ - одразу після спроб отримати координати з різних джерел
        // Переконуємося, що координати - валідні числа
        if (lat !== undefined && lng !== undefined) {
          // Перевірка на NaN і невалідні значення
          if (
            isNaN(Number(lat)) ||
            isNaN(Number(lng)) ||
            Number(lat) === 0 ||
            Number(lng) === 0
          ) {
            console.warn("Found invalid coordinates:", { lat, lng });

            // Спробуємо знайти координати країни як запасний варіант
            const countryWithCoords = countries.find(
              (c) => c.id.toString() === String(countryId)
            );

            if (countryWithCoords?.latitude && countryWithCoords?.longitude) {
              lat = countryWithCoords.latitude;
              lng = countryWithCoords.longitude;
              console.log("Using country coordinates instead:", { lat, lng });
            }
          } else {
            console.log("Using valid coordinates:", { lat, lng });
          }
        }
        // Images
        let images: any[] = getListingValue("images", []);
        if (!Array.isArray(images)) {
          console.log("Images is not an array, converting:", images);
          images = [];
        }

        console.log("Final extracted values:", {
          title,
          description,
          price,
          currency,
          categoryId,
          brandId,
          countryId,
          regionId,
          communityId,
          locationName,
          coordinates: { lat, lng },
          images: images.length,
        });

        // Initialize form data
        setFormData({
          title,
          description,
          price: price !== null && price !== undefined ? String(price) : "",
          currency: ["UAH", "USD", "EUR"].includes(currency)
            ? (currency as "UAH" | "USD" | "EUR")
            : "UAH",
          categoryId: categoryId ? String(categoryId) : "",
          countryId: countryId ? String(countryId) : "",
          regionId: regionId ? String(regionId) : "",
          communityId: communityId ? String(communityId) : "",
          locationId: locationId ? String(locationId) : "",
          locationName: locationName || "",
          images: Array.isArray(images) ? images : [],
          condition: condition === "NEW" ? "NEW" : "USED",
          brandId: brandId ? String(brandId) : "",
          brandName: brandName || "",
          priceType: priceType === "BRUTTO" ? "BRUTTO" : "NETTO",
          vatIncluded: !!vatIncluded,
        });

        // Store image URLs for preview
        const imageUrls = images
          .filter((img) => typeof img === "string")
          .map((img) => (typeof img === "string" ? img : ""));

        console.log("Image preview URLs:", imageUrls);
        setImagePreviewUrls(imageUrls);

        // Set coordinates
        setLatitude(lat);
        setLongitude(lng);
        console.log("Setting coordinates:", { latitude: lat, longitude: lng });

        // Check for motorizedSpec data
        const motorizedSpecData = getListingValue("motorizedSpec", null);
        if (motorizedSpecData) {
          console.log("Found motorizedSpec data:", motorizedSpecData);
          setMotorizedSpec({
            ...initialMotorizedSpec,
            ...motorizedSpecData,
          });
        }

        // Load regions and communities if applicable
        if (countryId) {
          dispatch(fetchRegions(String(countryId)));
          if (regionId) {
            if (isUkraine && communityId) {
              dispatch(fetchCommunities(String(regionId)));
              dispatch(fetchLocations(String(communityId)));
            } else {
              dispatch(fetchLocations(String(regionId)));
            }
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing form:", error);
      }
    }
  }, [currentListing, isInitialized, getListingValue, dispatch, isUkraine, countries]);

  // Fetch regions when country changes
  useEffect(() => {
    if (formData.countryId) {
      dispatch(fetchRegions(formData.countryId));
    }
  }, [dispatch, formData.countryId]);

  // Fetch locations when community changes (Ukraine only)
  useEffect(() => {
    if (
      isUkraine &&
      formData.communityId &&
      formData.communityId !== "undefined"
    ) {
      // Перевіряємо, що communityId не є "undefined"
      console.log("Fetching locations for community ID:", formData.communityId);
      dispatch(fetchLocations(String(formData.communityId)));
    } else if (
      !isUkraine &&
      formData.regionId &&
      formData.regionId !== "undefined"
    ) {
      // Для не-України локації отримуємо по регіону
      console.log(
        "Fetching locations for region ID (non-Ukraine):",
        formData.regionId
      );
      dispatch(fetchLocations(String(formData.regionId)));
    }
  }, [dispatch, formData.communityId, formData.regionId, isUkraine]);

  // Fetch locations when community changes (Ukraine only)
  useEffect(() => {
    if (isUkraine && formData.communityId) {
      dispatch(fetchLocations(formData.communityId));
    }
  }, [dispatch, formData.communityId, isUkraine]);

  // Navigate away if listing not found
  useEffect(() => {
    if (!isLoading && currentListing === null && id && isInitialized) {
      navigate("/not-found", { replace: true });
    }
  }, [currentListing, isLoading, id, navigate, isInitialized]);

  // Handle standard input changes
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
        vatIncluded: checked !== undefined ? checked : value === "true",
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear error for changed field
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  // Handle motorized spec changes
  const handleMotorizedSpecChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setMotorizedSpec((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle location fields changes
  const handleLocationChange = (name: string, value: string | number) => {
    if (name === "countryId") {
      setFormData({
        ...formData,
        countryId: String(value),
        regionId: "",
        communityId: "",
        locationId: "",
        locationName: "",
      });
    } else if (name === "regionId") {
      setFormData({
        ...formData,
        regionId: String(value),
        communityId: "",
        locationId: "",
        locationName: "",
      });
    } else if (name === "communityId") {
      setFormData({
        ...formData,
        communityId: String(value),
        locationId: "",
        locationName: "",
      });
    } else if (name === "locationName") {
      // If selecting from dropdown, try to find matching location
      const selectedLocation = locations.find(
        (loc) => loc.settlement === value
      );

      setFormData({
        ...formData,
        locationName: String(value),
        locationId: selectedLocation
          ? String(selectedLocation.id)
          : formData.locationId,
      });
    } else if (name === "latitude") {
      setLatitude(
        typeof value === "number" ? value : parseFloat(String(value))
      );
    } else if (name === "longitude") {
      setLongitude(
        typeof value === "number" ? value : parseFloat(String(value))
      );
    } else {
      setFormData({
        ...formData,
        [name]: String(value),
      });
    }

    // Clear error for changed field
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  // Handle brand selection
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

  // Handle image management
  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);

    // Also remove preview URL if it was an existing image
    const newPreviewUrls = [...imagePreviewUrls];
    if (typeof formData.images[index] === "string") {
      const imgUrl = formData.images[index] as string;
      const previewIndex = newPreviewUrls.indexOf(imgUrl);
      if (previewIndex !== -1) {
        newPreviewUrls.splice(previewIndex, 1);
      }
      setImagePreviewUrls(newPreviewUrls);
    }

    setFormData({
      ...formData,
      images: newImages,
    });
  };

  const handleImagesChange = (newImages: (File | string)[]) => {
    // Keep existing image URLs
    const existingUrls = formData.images.filter(
      (img): img is string => typeof img === "string"
    );

    // Add new files
    setFormData({
      ...formData,
      images: [...existingUrls, ...newImages],
    });

    if (errors.images) {
      setErrors({
        ...errors,
        images: undefined,
      });
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) newErrors.title = "Введіть назву оголошення";
    if (!formData.brandId) newErrors.brandId = "Виберіть марку техніки";
    if (!formData.description.trim())
      newErrors.description = "Введіть опис оголошення";
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
    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude === 0 ||
      longitude === 0
    )
      newErrors.latitude = "Вкажіть місцезнаходження на карті";
    if (formData.images.length === 0)
      newErrors.images = "Завантажте хоча б одне зображення";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🚀 handleSubmit started");
    console.log("📋 Current formData:", formData);
    console.log("📍 Current coordinates:", { latitude, longitude });
    console.log("🔧 Is motorized:", isMotorized);
    console.log("⚙️ Motorized spec:", motorizedSpec);

    if (!validateForm() || !id) {
      console.log("❌ Validation failed or no ID");
      return;
    }

    setIsSubmitting(true);
    console.log("🔄 Setting isSubmitting to true");

    try {
      // Ensure token is fresh
      console.log("🔑 Ensuring fresh token...");
      await ensureFreshToken();

      // Prepare form data for submission
      const formDataToSubmit = new FormData();
      console.log("📦 Creating FormData for submission");

      // Basic information
      formDataToSubmit.append("title", formData.title);
      formDataToSubmit.append("description", formData.description);
  // Ensure price is a clean numeric string
  const cleanPrice = formData.price.replace(/\s/g, "");
  formDataToSubmit.append("price", cleanPrice);
      formDataToSubmit.append("currency", formData.currency);
      formDataToSubmit.append("categoryId", formData.categoryId);
      formDataToSubmit.append("brandId", formData.brandId);
      // Backend expects lowercase condition (e.g., "used" | "new")
      formDataToSubmit.append(
        "condition",
        formData.condition.toLowerCase() as "used" | "new"
      );

      console.log("✅ Basic fields added to FormData");

      // Coordinates
      if (latitude !== undefined && longitude !== undefined) {
        formDataToSubmit.append("latitude", String(latitude));
        formDataToSubmit.append("longitude", String(longitude));
        console.log("🗺️ Coordinates added:", { latitude, longitude });
      }

      // Location data with embedded coordinates for redundancy
      const locationData = {
        countryId: Number(formData.countryId),
        regionId: Number(formData.regionId),
        ...(formData.communityId
          ? { communityId: Number(formData.communityId) }
          : {}),
        settlement: formData.locationName,
        latitude,
        longitude,
      };
      formDataToSubmit.append("location", JSON.stringify(locationData));
      console.log("🏠 Location data added:", locationData);

      // Price settings
      formDataToSubmit.append("priceType", formData.priceType);
      formDataToSubmit.append("vatIncluded", String(formData.vatIncluded));
      console.log("💰 Price settings added");

      // Technical specs for motorized equipment
      if (isMotorized) {
        console.log("🚜 Processing motorized specs...");
        const hasFilledValues = Object.values(motorizedSpec).some((value) => {
          if (value === null || value === undefined) return false;
          if (typeof value === "string" && value.trim() === "") return false;
          if (typeof value === "boolean" && value === false) return false;
          return true;
        });

        console.log("📊 Has filled motorized values:", hasFilledValues);

        if (hasFilledValues) {
          // Clean and convert motorizedSpec
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

          // Process values
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
          console.log("⚙️ Motorized spec added:", cleanMotorizedSpec);
        }
      } else {
        console.log("🚫 Not motorized, skipping specs");
      }

      // Images - handle both new files and existing URLs
      console.log("🖼️ Processing images:", formData.images.length);
      formData.images.forEach((image, index) => {
        if (image instanceof File) {
          formDataToSubmit.append("images", image);
          console.log(`📁 Added new image file ${index + 1}:`, image.name);
        } else if (typeof image === "string") {
          // Existing URLs are sent separately
          formDataToSubmit.append("existingImages", image);
          console.log(`🔗 Added existing image URL ${index + 1}:`, image);
        }
      });

      console.log("📋 Final FormData summary:", {
        title: formData.title,
        price: formData.price,
        coordinates: [latitude, longitude],
        location: locationData,
        imagesCount: formData.images.length,
      });

      // Log all FormData entries
      console.log("📦 All FormData entries:");
      for (const [key, value] of formDataToSubmit.entries()) {
        console.log(`  ${key}:`, value);
      }

      // Send to server
      console.log("🌐 Sending update request to server...");
      const resultAction = await dispatch(
        updateListing({ id: parseInt(id), formData: formDataToSubmit })
      );

      console.log("📥 Server response action:", resultAction);

      if (updateListing.fulfilled.match(resultAction)) {
        console.log("✅ Update successful! Navigating to listing page...");
        navigate(`/listings/${id}`);
      } else {
        console.error("❌ Update listing failed:", resultAction.error);
        alert(
          `Не вдалося оновити оголошення: ${resultAction.error?.message || "Перевірте правильність заповнення форми"}`
        );
      }
    } catch (error) {
      console.error("💥 Error updating listing:", error);
      alert(
        `Помилка при оновленні оголошення: ${error instanceof Error ? error.message : "Невідома помилка"}`
      );
    } finally {
      console.log("🏁 Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Редагування оголошення
      </h1>

      {isLoading && !isInitialized ? (
        <Loader />
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Статус збереження */}
          {isSubmitting && (
            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              🔄 Збереження змін... Будь ласка, зачекайте.
            </div>
          )}
          
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
                  latitude: latitude || 0,
                  longitude: longitude || 0,
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

              {/* Завантаження зображень - використовуємо компонент ImageUploader */}
              <ImageUploader
                images={formData.images as File[]}
                onChange={handleImagesChange}
                onRemove={handleRemoveImage}
                error={errors.images || ""}
                existingImages={imagePreviewUrls}
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
            
            {/* Кнопка простого тестування */}
            <button
              type="button"
              onClick={async () => {
                console.log("🧪 Test button clicked");
                try {
                  const formData = new FormData();
                  formData.append("title", "Test Update " + new Date().toISOString());
                  
                  const response = await listingsAPI.update(parseInt(id!), formData);
                  console.log("✅ Direct API test successful:", response);
                  alert("Прямий тест API пройшов успішно!");
                } catch (error) {
                  console.error("❌ Direct API test failed:", error);
                  alert("Прямий тест API провалився: " + ((error as Error)?.message || 'Unknown error'));
                }
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              🧪 Тест API
            </button>
            
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading || isSubmitting ? "Збереження..." : "Зберегти зміни"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditListingPage;
