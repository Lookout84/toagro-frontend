import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Plus, 
  FileCheck, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Upload, 
  Download,
  CheckCircle,
  XCircle,
  HelpCircle,
  Calendar
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { uk } from "date-fns/locale";
import { useAuth } from "../../context/AuthContext";
import { companiesAPI } from "../../api/apiClient";
import { Button, Alert, Modal, Input, Select } from "../../components/common";

// Типи документів
interface Document {
  id: number;
  companyId: number;
  name: string;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  isVerified: boolean | null;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationComment?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

interface Company {
  id: number;
  companyName: string;
  isVerified: boolean;
}

// Типи документів для вибору
const documentTypes = [
  { value: "REGISTRATION_CERTIFICATE", label: "Свідоцтво про реєстрацію" },
  { value: "TAX_CERTIFICATE", label: "Свідоцтво платника податків" },
  { value: "BANK_STATEMENT", label: "Банківські реквізити" },
  { value: "LICENSE", label: "Ліцензія/Дозвіл" },
  { value: "COMPANY_CHARTER", label: "Статут компанії" },
  { value: "FINANCIAL_STATEMENT", label: "Фінансова звітність" },
  { value: "POWER_OF_ATTORNEY", label: "Довіреність" },
  { value: "OTHER", label: "Інший документ" },
];

const CompanyDocumentsPage: React.FC = () => {
  // Стани для документів та їх завантаження
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  // Стани для модального вікна додавання документа
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  
  // Стани для форми додавання документа
  const [documentName, setDocumentName] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentExpiry, setDocumentExpiry] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Стан для модального вікна видалення
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Стан для модального вікна перегляду деталей
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Завантаження документів компанії при монтуванні компонента
  useEffect(() => {
    const fetchCompanyAndDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Спочатку отримуємо інформацію про компанію
        const companyResponse = await companiesAPI.getMyCompany();
        setCompany(companyResponse.data);

        // Потім отримуємо документи компанії
        const documentsResponse = await companiesAPI.getDocuments(companyResponse.data.id);
        setDocuments(documentsResponse.data);
      } catch (err: any) {
        console.error("Error fetching documents:", err);
        
        // Перевіряємо чи компанія взагалі існує
        if (err.response && err.response.status === 404) {
          setError("Профіль компанії не знайдено. Спочатку створіть профіль компанії.");
        } else {
          setError("Помилка при завантаженні документів. Спробуйте ще раз пізніше.");
        }
      } finally {
        setLoading(false);
      }
    };

    // Перевіряємо, чи користувач має роль компанії
    if (user && user.role === "COMPANY") {
      fetchCompanyAndDocuments();
    } else if (user && user.role !== "COMPANY") {
      setError("Для доступу до цієї сторінки потрібно мати роль компанії");
    }
  }, [user]);

  // Обробник для відкриття модального вікна додавання документа
  const handleAddDocument = () => {
    // Скидання форми
    setDocumentName("");
    setDocumentType("");
    setDocumentFile(null);
    setDocumentExpiry("");
    setFormErrors({});
    setUploadSuccess(false);
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  // Обробник для зміни файлу документа
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Перевірка розміру файлу (не більше 10 МБ)
      if (file.size > 10 * 1024 * 1024) {
        setFormErrors({
          ...formErrors,
          file: "Розмір файлу не повинен перевищувати 10 МБ"
        });
        return;
      }
      
      // Перевірка типу файлу
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        setFormErrors({
          ...formErrors,
          file: "Дозволені типи файлів: PDF, JPG, PNG"
        });
        return;
      }
      
      setDocumentFile(file);
      
      // Очищення помилок, якщо вони були
      if (formErrors.file) {
        const { file, ...rest } = formErrors;
        setFormErrors(rest);
      }
    }
  };

  // Валідація форми додавання документа
  const validateDocumentForm = () => {
    const errors: Record<string, string> = {};
    
    if (!documentName.trim()) {
      errors.name = "Назва документа обов'язкова";
    }
    
    if (!documentType) {
      errors.type = "Тип документа обов'язковий";
    }
    
    if (!documentFile) {
      errors.file = "Файл документа обов'язковий";
    }
    
    // Перевірка дати закінчення терміну дії, якщо вона вказана
    if (documentExpiry) {
      const expiryDate = new Date(documentExpiry);
      const today = new Date();
      if (expiryDate < today) {
        errors.expiry = "Дата закінчення терміну дії не може бути в минулому";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Обробник для відправки форми додавання документа
  const handleUploadDocument = async () => {
    if (!validateDocumentForm() || !company || !documentFile) {
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Імітація прогресу завантаження
      const simulateProgress = () => {
        setUploadProgress((prev) => {
          if (prev < 90) {
            return prev + 10;
          }
          return prev;
        });
      };
      
      const progressInterval = setInterval(simulateProgress, 300);
      
      // Створення об'єкту для відправки
      const documentData: {
        name: string;
        type: string;
        file: File;
        expiresAt?: string | Date;
      } = {
        name: documentName,
        type: documentType,
        file: documentFile,
      };
      if (documentExpiry) {
        documentData.expiresAt = documentExpiry;
      }
      
      // Відправка на сервер
      await companiesAPI.addDocument(company.id, documentData);
      
      // Завершення завантаження
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);
      
      // Оновлення списку документів
      const documentsResponse = await companiesAPI.getDocuments(company.id);
      setDocuments(documentsResponse.data);
      
      // Закриття модального вікна через 1.5 секунди після успішного завантаження
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error uploading document:", err);
      
      if (err.response) {
        if (err.response.status === 400 && err.response.data?.errors) {
          const serverErrors: Record<string, string> = {};
          Object.entries(err.response.data.errors).forEach(([key, value]) => {
            serverErrors[key] = Array.isArray(value) ? value[0] : value as string;
          });
          setFormErrors(serverErrors);
        } else {
          setFormErrors({
            submit: err.response.data?.message || "Помилка при завантаженні документа"
          });
        }
      } else {
        setFormErrors({
          submit: "Не вдалося з'єднатися з сервером. Перевірте з'єднання."
        });
      }
    } finally {
      setUploading(false);
    }
  };

  // Обробник для видалення документа
  const handleOpenDeleteModal = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteModalOpen(true);
  };

  // Обробник для підтвердження видалення документа
  const handleDeleteDocument = async () => {
    if (!documentToDelete || !company) return;
    
    setDeleting(true);
    
    try {
      await companiesAPI.deleteDocument(company.id, documentToDelete.id);
      
      // Видалення документа зі списку
      setDocuments(prevDocuments => prevDocuments.filter(doc => doc.id !== documentToDelete.id));
      
      // Закриття модального вікна
      setDeleteModalOpen(false);
      setDocumentToDelete(null);
    } catch (err: any) {
      console.error("Error deleting document:", err);
      setError("Помилка при видаленні документа. Спробуйте ще раз пізніше.");
    } finally {
      setDeleting(false);
    }
  };

  // Обробник для відкриття деталей документа
  const handleViewDocumentDetails = (document: Document) => {
    setSelectedDocument(document);
    setDetailsModalOpen(true);
  };

  // Функція форматування дати
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Не вказано";
    try {
      return format(parseISO(dateString), "d MMMM yyyy", { locale: uk });
    } catch (error) {
      return "Невірний формат дати";
    }
  };

  // Функція форматування розміру файлу
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  // Функція для відображення статусу верифікації документа
  const renderVerificationStatus = (status: Document["verificationStatus"], isCompact = false) => {
    switch (status) {
      case "VERIFIED":
        return (
          <div className={`flex items-center ${isCompact ? "" : "px-3 py-1 rounded-full"} bg-green-100 text-green-800`}>
            <CheckCircle size={isCompact ? 16 : 18} className="mr-1" />
            <span className={isCompact ? "text-xs" : "text-sm"}>Підтверджено</span>
          </div>
        );
      case "REJECTED":
        return (
          <div className={`flex items-center ${isCompact ? "" : "px-3 py-1 rounded-full"} bg-red-100 text-red-800`}>
            <XCircle size={isCompact ? 16 : 18} className="mr-1" />
            <span className={isCompact ? "text-xs" : "text-sm"}>Відхилено</span>
          </div>
        );
      case "PENDING":
      default:
        return (
          <div className={`flex items-center ${isCompact ? "" : "px-3 py-1 rounded-full"} bg-yellow-100 text-yellow-800`}>
            <Clock size={isCompact ? 16 : 18} className="mr-1" />
            <span className={isCompact ? "text-xs" : "text-sm"}>Очікує перевірки</span>
          </div>
        );
    }
  };

  // Відображення типу документа
  const getDocumentTypeLabel = (typeValue: string) => {
    const docType = documentTypes.find(type => type.value === typeValue);
    return docType ? docType.label : "Інший документ";
  };

  // Компонент картки документа
  const DocumentCard = ({ document }: { document: Document }) => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <FileText className="text-gray-500 mr-2" size={20} />
              <h3 className="font-medium text-gray-900 truncate max-w-xs">{document.name}</h3>
            </div>
            {renderVerificationStatus(document.verificationStatus, true)}
          </div>
          
          <div className="text-sm text-gray-500 mb-3">
            {getDocumentTypeLabel(document.type)}
          </div>
          
          <div className="flex items-center text-xs text-gray-500 mb-3">
            <Calendar size={14} className="mr-1" />
            <span>Завантажено: {formatDate(document.createdAt)}</span>
          </div>
          
          {document.expiresAt && (
            <div className="flex items-center text-xs text-gray-500 mb-3">
              <AlertCircle size={14} className="mr-1" />
              <span>Дійсний до: {formatDate(document.expiresAt)}</span>
            </div>
          )}
          
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              size="small"
              icon={<Download size={14} />}
              onClick={() => window.open(document.fileUrl, "_blank")}
            >
              Відкрити
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="small"
                onClick={() => handleViewDocumentDetails(document)}
              >
                Деталі
              </Button>
              
              {document.verificationStatus !== "VERIFIED" && (
                <Button
                  variant="danger"
                  size="small"
                  icon={<Trash2 size={14} />}
                  onClick={() => handleOpenDeleteModal(document)}
                >
                  Видалити
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // JSX для відображення завантаження
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Завантаження документів...</p>
          </div>
        </div>
      </div>
    );
  }

  // JSX для відображення помилки
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
                Для завантаження документів необхідно спочатку створити профіль компанії.
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
      <div className="max-w-5xl mx-auto">
        {/* Заголовок сторінки */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Документи компанії</h1>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={handleAddDocument}
            >
              Додати документ
            </Button>
          </div>
          <p className="text-gray-600">
            Завантажте документи для верифікації вашої компанії
          </p>
        </div>

        {/* Статус верифікації компанії */}
        {company && (
          <div className={`p-4 mb-6 rounded-lg ${company.isVerified ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {company.isVerified ? (
                  <FileCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${company.isVerified ? 'text-green-800' : 'text-yellow-800'}`}>
                  {company.isVerified ? "Компанію верифіковано" : "Компанію не верифіковано"}
                </h3>
                <div className={`mt-2 text-sm ${company.isVerified ? 'text-green-700' : 'text-yellow-700'}`}>
                  <p>
                    {company.isVerified 
                      ? "Ваша компанія пройшла верифікацію. Ви маєте повний доступ до всіх функцій платформи." 
                      : "Для проходження верифікації необхідно завантажити документи, що підтверджують вашу компанію. Після перевірки документів адміністратором, ваша компанія отримає статус верифікованої."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Інструкції для завантаження документів */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Які документи потрібно завантажити?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">
                  Для верифікації компанії необхідно завантажити наступні документи:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Свідоцтво про державну реєстрацію юридичної особи</li>
                  <li>Витяг з ЄДР (не старше 3 місяців)</li>
                  <li>Довідка про взяття на облік платника податків (за наявності)</li>
                  <li>Підтвердження юридичної адреси</li>
                </ul>
                <p className="mt-2">
                  Додатково можуть знадобитися ліцензії та дозволи для вашої сфери діяльності.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Список документів */}
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">У вас немає документів</h2>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Завантажте документи для верифікації вашої компанії, щоб отримати доступ до всіх функцій платформи
            </p>
            <Button
              variant="primary"
              icon={<Upload size={16} />}
              onClick={handleAddDocument}
            >
              Завантажити перший документ
            </Button>
          </div>
        )}

        {/* Модальне вікно для додавання документа */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => !uploading && setIsModalOpen(false)}
          title="Додати новий документ"
        >
          <div className="p-6">
            {uploadSuccess ? (
              <div className="text-center py-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Документ успішно завантажено
                </h3>
                <p className="text-gray-600">
                  Ваш документ буде перевірено адміністратором найближчим часом
                </p>
              </div>
            ) : (
              <form className="space-y-4">
                <div>
                  <label htmlFor="documentName" className="block text-gray-700 font-medium mb-2">
                    Назва документа *
                  </label>
                  <Input
                    type="text"
                    id="documentName"
                    name="documentName"
                    placeholder="Введіть назву документа"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    error={formErrors.name || ""}
                  />
                </div>
                
                <div>
                  <label htmlFor="documentType" className="block text-gray-700 font-medium mb-2">
                    Тип документа *
                  </label>
                  <Select
                    value={documentType}
                    onChange={setDocumentType}
                    options={[
                      { value: "", label: "Виберіть тип документа" },
                      ...documentTypes,
                    ]}
                    error={formErrors.type || ""}
                  />
                </div>
                
                <div>
                  <label htmlFor="documentFile" className="block text-gray-700 font-medium mb-2">
                    Файл документа *
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      id="documentFile"
                      name="documentFile"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mr-2"
                      onClick={() => fileInputRef.current?.click()}
                      icon={<Upload size={16} />}
                    >
                      Вибрати файл
                    </Button>
                    <span className="text-sm text-gray-500">
                      {documentFile ? documentFile.name : "Файл не вибрано"}
                    </span>
                  </div>
                  {formErrors.file && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.file}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Дозволені формати: PDF, JPG, PNG. Максимальний розмір: 10 МБ
                  </p>
                </div>
                
                <div>
                  <label htmlFor="documentExpiry" className="block text-gray-700 font-medium mb-2">
                    Дата закінчення терміну дії (необов&apos;язково)
                  </label>
                  <Input
                    type="date"
                    id="documentExpiry"
                    name="documentExpiry"
                    value={documentExpiry}
                    onChange={(e) => setDocumentExpiry(e.target.value)}
                    error={formErrors.expiry || ""}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Вкажіть, якщо документ має обмежений термін дії
                  </p>
                </div>
                
                {formErrors.submit && (
                  <Alert type="error" message={formErrors.submit} />
                )}
                
                {uploading && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Завантаження: {uploadProgress}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={uploading}
                  >
                    Скасувати
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleUploadDocument}
                    loading={uploading}
                  >
                    {uploading ? "Завантаження..." : "Завантажити документ"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Modal>

        {/* Модальне вікно для видалення документа */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => !deleting && setDeleteModalOpen(false)}
          title="Видалити документ"
        >
          <div className="p-6">
            <p className="text-gray-700 mb-6">
              Ви впевнені, що хочете видалити документ &quot;{documentToDelete?.name}&quot;?
              Цю дію неможливо скасувати.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Скасувати
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteDocument}
                loading={deleting}
              >
                {deleting ? "Видалення..." : "Видалити"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Модальне вікно для деталей документа */}
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="Деталі документа"
        >
          {selectedDocument && (
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Назва документа</h3>
                  <p className="text-gray-900">{selectedDocument.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Тип документа</h3>
                  <p className="text-gray-900">{getDocumentTypeLabel(selectedDocument.type)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Дата завантаження</h3>
                  <p className="text-gray-900">{formatDate(selectedDocument.createdAt)}</p>
                </div>
                
                {selectedDocument.expiresAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Дійсний до</h3>
                    <p className="text-gray-900">{formatDate(selectedDocument.expiresAt)}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Файл</h3>
                  <p className="text-gray-900">
                    {selectedDocument.fileName} ({formatFileSize(selectedDocument.fileSize)})
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Статус верифікації</h3>
                  <div className="mt-1">{renderVerificationStatus(selectedDocument.verificationStatus)}</div>
                </div>
                
                {selectedDocument.verificationStatus === "REJECTED" && selectedDocument.verificationComment && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Коментар до відхилення</h3>
                    <div className="p-3 bg-red-50 text-red-800 rounded-lg">
                      {selectedDocument.verificationComment}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(selectedDocument.fileUrl, "_blank")}
                    icon={<Download size={16} />}
                  >
                    Переглянути документ
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setDetailsModalOpen(false)}
                  >
                    Закрити
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default CompanyDocumentsPage;