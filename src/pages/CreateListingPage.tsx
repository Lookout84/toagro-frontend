import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchCategories } from "../store/catalogSlice";
import { createListing } from "../store/listingSlice";
import { Upload, X, Plus, ChevronDown } from "lucide-react";

interface FormData {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  categoryName: string;
  location: string;
  images: File[];
  condition: "NEW" | "USED";
}

interface FormErrors {
  title?: string | undefined;
  description?: string | undefined;
  price?: string | undefined;
  categoryId?: string | undefined;
  location?: string | undefined;
  images?: string | undefined;
}

const CreateListingPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { categories, status: categoriesStatus } = useAppSelector(
    (state) => state.catalog
  );
  const { isLoading } = useAppSelector((state) => state.listing);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    price: "",
    categoryId: "",
    categoryName: "",
    location: "",
    images: [],
    condition: "USED",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Автоматично встановлюємо categoryName при виборі categoryId
    if (name === "categoryId") {
      const selectedCategory = categories.find(
        (cat) => cat.id === Number(value)
      );
      setFormData({
        ...formData,
        [name]: value,
        categoryName: selectedCategory ? selectedCategory.name : "",
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

    if (!formData.title.trim()) {
      newErrors.title = "Введіть назву оголошення";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Введіть опис оголошення (не менше 20 символів)";
    }

    if (!formData.price.trim()) {
      newErrors.price = "Введіть ціну";
    } else if (
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) <= 0
    ) {
      newErrors.price = "Введіть коректну ціну";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Виберіть категорію";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Введіть місце розташування";
    }

    if (formData.images.length === 0) {
      newErrors.images = "Завантажте хоча б одне зображення";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = new FormData();
    submitData.append("title", formData.title);
    submitData.append("description", formData.description);
    submitData.append("price", parseFloat(formData.price).toString());
    submitData.append("categoryId", Number(formData.categoryId).toString());
    submitData.append("category", formData.categoryName);
    submitData.append("location", formData.location);
    submitData.append("condition", formData.condition);

    formData.images.forEach((image) => {
      submitData.append("images", image);
    });

    try {
      const resultAction = await dispatch(createListing(submitData));
      if (createListing.fulfilled.match(resultAction)) {
        navigate(`/listings/${resultAction.payload.id}`);
      } else {
        alert("Не вдалося створити оголошення, спробуйте ще раз.");
      }
    } catch (error) {
      console.error("Помилка при створенні оголошення:", error);
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

            {/* Ціна */}
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ціна (грн) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Наприклад: 1000000"
                min="0"
                step="1"
                className={`w-full px-4 py-2 border ${
                  errors.price ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-500">{errors.price}</p>
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
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Місцезнаходження *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Наприклад: Київ, Київська область"
                className={`w-full px-4 py-2 border ${
                  errors.location ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-500">{errors.location}</p>
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
                  Підтримувані формати: JPEG, PNG, GIF, WEBP. Максимум 10 фото.
                </p>
              </div>

              {errors.images && (
                <p className="mt-2 text-sm text-red-500">{errors.images}</p>
              )}

              {/* Попередній перегляд завантажених зображень */}
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

                    {/* Кнопка для додавання нових зображень */}
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

        {/* Кнопки дій */}
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
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Публікація..." : "Опублікувати оголошення"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateListingPage;
