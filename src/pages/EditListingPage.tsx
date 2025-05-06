import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchListingById, updateListing } from "../store/listingSlice";
import { fetchCategories } from "../store/catalogSlice";
import { Upload, X, Plus, ChevronDown } from "lucide-react";
import Loader from "../components/common/Loader";

interface FormData {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  location: string;
  images: (File | string)[];
}

interface FormErrors {
  title?: string | undefined;
  description?: string | undefined;
  price?: string | undefined;
  categoryId?: string | undefined;
  location?: string | undefined;
  images?: string | undefined;
}

const EditListingPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { currentListing, isLoading } = useAppSelector((state) => state.listing);
  const { categories, status: categoriesStatus } = useAppSelector(
    (state) => state.catalog,
  );

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    price: "",
    categoryId: "",
    location: "",
    images: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Завантаження категорій та поточного оголошення
  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }

    if (id) {
      dispatch(fetchListingById(parseInt(id)));
    }
  }, [dispatch, id, categories.length]);

  // Ініціалізація форми даними з поточного оголошення
  useEffect(() => {
    if (currentListing && !isInitialized) {
      setFormData({
        title: currentListing.title,
        description: currentListing.description,
        price: currentListing.price.toString(),
        categoryId: currentListing.categoryId?.toString() || "",
        location: currentListing.location,
        images: currentListing.images || [],
      });

      setImagePreviewUrls(currentListing.images || []);
      setIsInitialized(true);
    }
  }, [currentListing, isInitialized]);

  // Обробник зміни полів форми
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Очищення помилки при зміні поля
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  // Обробник завантаження зображень
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    handleFiles(Array.from(files));
  };

  // Обробник перетягування файлів
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Обробник перетягування файлів - стан перетягування
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Обробник перетягування файлів - вихід із зони
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Обробник видалення завантаженого зображення
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

  // Валідація форми
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Введіть назву оголошення";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Введіть опис оголошення";
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

  // Обробник відправки форми
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
      return;
    }

    setIsSubmitting(true);

    // Створення об'єкту FormData для відправки файлів
    const submitData = new FormData();
    submitData.append("title", formData.title);
    submitData.append("description", formData.description);
    submitData.append("price", formData.price);
    submitData.append("categoryId", formData.categoryId);
    submitData.append("location", formData.location);

    // Додавання зображень
    formData.images.forEach((image, index) => {
      if (image instanceof File) {
        submitData.append("images", image);
      } else if (typeof image === "string") {
        // Якщо це існуюче зображення (URL), додаємо його як окреме поле
        submitData.append("existingImages", image);
      }
    });

    const resultAction = await dispatch(
      updateListing({ id: parseInt(id), formData: submitData }),
    );

    setIsSubmitting(false);

    if (updateListing.fulfilled.match(resultAction)) {
      // Перехід на сторінку оголошення
      navigate(`/listings/${id}`);
    }
  };

  // Обробник для роботи з файлами зображень
  const handleFiles = (files: File[]) => {
    // Перевірка типу файлів - тільки зображення
    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const imageFiles = files.filter((file) =>
      validImageTypes.includes(file.type),
    );

    if (imageFiles.length === 0) {
      setErrors({
        ...errors,
        images:
          "Будь ласка, завантажте тільки зображення (JPEG, PNG, GIF, WEBP)",
      });
      return;
    }

    // Обмеження на кількість зображень
    const totalImages = formData.images.length + imageFiles.length;
    if (totalImages > 10) {
      setErrors({
        ...errors,
        images: "Максимальна кількість зображень - 10",
      });
      return;
    }

    // Створення URL для попереднього перегляду зображень
    const newPreviewUrls = imageFiles.map((file) => URL.createObjectURL(file));

    setFormData({
      ...formData,
      images: [...formData.images, ...imageFiles],
    });

    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);

    // Очищення помилки
    if (errors.images) {
      setErrors({
        ...errors,
        images: undefined,
      });
    }
  };

  // Відображення індикатора завантаження під час завантаження оголошення
  if (isLoading && !isInitialized) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Редагування оголошення
      </h1>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6">
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
                    <p className="mt-1 text-sm text-red-500">
                      {errors.categoryId}
                    </p>
                  )}
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
                    <p className="mt-1 text-sm text-red-500">
                      {errors.location}
                    </p>
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
                    onClick={() =>
                      document.getElementById("image-upload")?.click()
                    }
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
                      Підтримувані формати: JPEG, PNG, GIF, WEBP. Максимум 10
                      фото.
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
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Збереження..." : "Зберегти зміни"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditListingPage;