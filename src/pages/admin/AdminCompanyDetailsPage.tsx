import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { uk } from "date-fns/locale";
import { 
  Building, 
  ChevronLeft, 
  ShieldCheck, 
  ShieldX,
  RotateCcw,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { adminAPI } from "../../api/apiClient";
import { 
  Button, 
  Alert, 
  Badge, 
  Card,
  Tabs,
  Tab,
  Loader
} from "../../components/common";

// Імпорт компонентів
import CompanyHeader from "../../components/company/CompanyHeader";
import CompanyInfoSidebar from "../../components/company/CompanyInfoSidebar";
import CompanyDetailCard from "../../components/company/CompanyDetailCard";
import DocumentsTab from "../../components/company/DocumentsTab";
import ListingsTab from "../../components/company/ListingsTab";
import VerificationHistoryTab from "../../components/company/VerificationHistoryTab";
import VerifyCompanyModal from "../../components/company/VerifyCompanyModal";
import RejectVerificationModal from "../../components/company/RejectVerificationModal";
import DocumentActionModal from "../../components/company/DocumentActionModal";
import BlockUserModal from "../../components/company/BlockUserModal";

// Імпорт типів
import { 
  Company, 
  CompanyDocument, 
  CompanyListing, 
  VerificationHistoryItem,
  CompanyStats
} from "../../types/company";

// Утиліти
// import { 
//   formatDate, 
//   formatFileSize, 
//   getCompanySize, 
//   getDocumentTypeLabel,
//   getDocumentStatusBadge,
//   getListingStatusBadge,
//   getConditionBadge,
//   formatPrice,
//   getHistoryActionIcon,
//   getHistoryActionText
// } from "../../utils/formatters";

const AdminCompanyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [listings, setListings] = useState<CompanyListing[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistoryItem[]>([]);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  
  // Стани для модальних вікон
  const [verifyModalOpen, setVerifyModalOpen] = useState<boolean>(false);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [documentModalOpen, setDocumentModalOpen] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<CompanyDocument | null>(null);
  const [documentAction, setDocumentAction] = useState<"verify" | "reject">("verify");
  const [documentComment, setDocumentComment] = useState<string>("");
  const [blockModalOpen, setBlockModalOpen] = useState<boolean>(false);
  const [blockReason, setBlockReason] = useState<string>("");
  const [blockDuration, setBlockDuration] = useState<string>("7"); // Кількість днів
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Завантаження даних компанії
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!id || !user || user.role !== "ADMIN") return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Завантаження основних даних компанії
        const companyResponse = await adminAPI.getCompany(Number(id));
        setCompany(companyResponse.data);
        
        // Завантаження документів компанії
        const documentsResponse = await adminAPI.getCompanyDocuments(Number(id));
        setDocuments(documentsResponse.data);
        
        // Завантаження оголошень компанії
        const listingsResponse = await adminAPI.getCompanyListings(Number(id));
        setListings(listingsResponse.data);
        
        // Завантаження історії верифікації
        const historyResponse = await adminAPI.getCompanyVerificationHistory(Number(id));
        setVerificationHistory(historyResponse.data);
        
        // Завантаження статистики компанії
        const statsResponse = await adminAPI.getCompanyStats(Number(id));
        setStats(statsResponse.data);
      } catch (err: unknown) {
        console.error("Error fetching company data:", err);

        if (
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { status?: number } }).response === "object" &&
          (err as { response?: { status?: number } }).response !== null &&
          "status" in (err as { response?: { status?: number } }).response!
        ) {
          const status = (err as { response: { status: number } }).response.status;
          if (status === 404) {
            setError("Компанію не знайдено. Можливо, вона була видалена.");
            return;
          }
        }
        setError("Помилка при завантаженні даних компанії. Спробуйте знову пізніше.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanyData();
  }, [id, user]);
  
  // Обробник для верифікації компанії
  const handleVerifyCompany = async () => {
    if (!company) return;
    
    try {
      setActionLoading(true);
      await adminAPI.verifyCompany(company.id);
      
      // Оновлюємо дані компанії
      setCompany({ ...company, isVerified: true });
      
      // Оновлюємо історію верифікації
      const historyResponse = await adminAPI.getCompanyVerificationHistory(company.id);
      setVerificationHistory(historyResponse.data);
      
      // Закриваємо модальне вікно
      setVerifyModalOpen(false);
    } catch (err: any) {
      console.error("Error verifying company:", err);
      setError("Помилка при верифікації компанії. Спробуйте знову пізніше.");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Обробник для відхилення верифікації компанії
  const handleRejectCompany = async () => {
    if (!company || !rejectReason.trim()) return;
    
    try {
      setActionLoading(true);
      await adminAPI.rejectCompany(company.id, { reason: rejectReason });
      
      // Оновлюємо дані компанії
      setCompany({ ...company, isVerified: false });
      
      // Оновлюємо історію верифікації
      const historyResponse = await adminAPI.getCompanyVerificationHistory(company.id);
      setVerificationHistory(historyResponse.data);
      
      // Закриваємо модальне вікно
      setRejectModalOpen(false);
      setRejectReason("");
    } catch (err: any) {
      console.error("Error rejecting company:", err);
      setError("Помилка при відхиленні верифікації компанії. Спробуйте знову пізніше.");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Обробник для верифікації документа
  const handleVerifyDocument = async () => {
    if (!selectedDocument) return;
    
    try {
      setActionLoading(true);
      
      // Якщо дія - верифікація
      if (documentAction === "verify") {
        await adminAPI.verifyDocument(Number(id), selectedDocument.id);
      } 
      // Якщо дія - відхилення
      else if (documentAction === "reject") {
        if (!documentComment.trim()) {
          setError("Вкажіть причину відхилення документа");
          return;
        }
        await adminAPI.rejectDocument(Number(id), selectedDocument.id, { reason: documentComment });
      }
      
      // Оновлюємо список документів
      const documentsResponse = await adminAPI.getCompanyDocuments(Number(id));
      setDocuments(documentsResponse.data);
      
      // Оновлюємо історію верифікації
      const historyResponse = await adminAPI.getCompanyVerificationHistory(Number(id));
      setVerificationHistory(historyResponse.data);
      
      // Закриваємо модальне вікно
      setDocumentModalOpen(false);
      setSelectedDocument(null);
      setDocumentComment("");
    } catch (err: any) {
      console.error("Error processing document:", err);
      setError(`Помилка при ${documentAction === "verify" ? "верифікації" : "відхиленні"} документа. Спробуйте знову пізніше.`);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Обробник для блокування компанії
  const handleBlockCompany = async () => {
    if (!company || !blockReason.trim()) return;
    
    try {
      setActionLoading(true);
      
      await adminAPI.blockCompany(company.id, { 
        reason: blockReason,
        durationDays: parseInt(blockDuration)
      });
      
      // Оновлюємо дані компанії та користувача
      const companyResponse = await adminAPI.getCompany(company.id);
      setCompany(companyResponse.data);
      
      // Закриваємо модальне вікно
      setBlockModalOpen(false);
      setBlockReason("");
      setBlockDuration("7");
    } catch (err: any) {
      console.error("Error blocking company:", err);
      setError("Помилка при блокуванні компанії. Спробуйте знову пізніше.");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Функція для відкриття модального вікна обробки документа
  const openDocumentModal = (document: CompanyDocument, action: "verify" | "reject") => {
    setSelectedDocument(document);
    setDocumentAction(action);
    setDocumentComment("");
    setDocumentModalOpen(true);
  };
  
  // Якщо дані завантажуються
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center py-12">
            <Loader size="large" />
            <p className="text-gray-600 mt-4">Завантаження даних компанії...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Якщо сталася помилка
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="outline"
            size="small"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/admin/companies')}
            className="mb-4"
          >
            Повернутися до списку компаній
          </Button>
          
          <Alert type="error" message={error} className="mb-6" />
          
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Не вдалося завантажити дані компанії</h2>
            <p className="text-gray-600 mb-6">
              Спробуйте оновити сторінку або поверніться пізніше.
            </p>
            <Button 
              variant="primary" 
              icon={<RotateCcw size={16} />}
              onClick={() => window.location.reload()}
            >
              Оновити сторінку
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Якщо компанію не знайдено
  if (!company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="outline"
            size="small"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/admin/companies')}
            className="mb-4"
          >
            Повернутися до списку компаній
          </Button>
          
          <Alert type="error" message="Компанію не знайдено. Можливо, вона була видалена." className="mb-6" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Навігація та заголовок */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="small"
            icon={<ChevronLeft size={16} />}
            onClick={() => navigate('/admin/companies')}
            className="mb-4"
          >
            Повернутися до списку компаній
          </Button>
          
          <CompanyHeader 
            company={company} 
            onVerify={() => setVerifyModalOpen(true)}
            onReject={() => setRejectModalOpen(true)}
          />
        </div>
        
        {/* Основна інформація про компанію */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Ліва колонка - логотип та основні дані */}
          <CompanyInfoSidebar 
            company={company} 
            onBlockUser={() => setBlockModalOpen(true)}
          />
          
          {/* Права колонка - детальна інформація */}
          <CompanyDetailCard 
            company={company}
            stats={stats}
          />
        </div>
        
        {/* Вкладки з додатковою інформацією */}
        <Tabs activeTab={activeTab} onChange={setActiveTab} variant="boxed" className="mb-8">
          <Tab title="Документи">
            <DocumentsTab 
              documents={documents}
              onOpenDocumentModal={openDocumentModal}
            />
          </Tab>
          
          <Tab title="Оголошення">
            <ListingsTab listings={listings} />
          </Tab>
          
          <Tab title="Історія верифікації">
            <VerificationHistoryTab history={verificationHistory} />
          </Tab>
        </Tabs>
      </div>
      
      {/* Модальні вікна */}
      <VerifyCompanyModal 
        isOpen={verifyModalOpen}
        onClose={() => !actionLoading && setVerifyModalOpen(false)}
        onVerify={handleVerifyCompany}
        company={company}
        loading={actionLoading}
      />
      
      <RejectVerificationModal 
        isOpen={rejectModalOpen}
        onClose={() => !actionLoading && setRejectModalOpen(false)}
        onReject={handleRejectCompany}
        company={company}
        loading={actionLoading}
        reason={rejectReason}
        onReasonChange={(e) => setRejectReason(e.target.value)}
      />
      
      <DocumentActionModal 
        isOpen={documentModalOpen}
        onClose={() => !actionLoading && setDocumentModalOpen(false)}
        onAction={handleVerifyDocument}
        document={selectedDocument}
        action={documentAction}
        comment={documentComment}
        onCommentChange={(e) => setDocumentComment(e.target.value)}
        loading={actionLoading}
      />
      
      <BlockUserModal 
        isOpen={blockModalOpen}
        onClose={() => !actionLoading && setBlockModalOpen(false)}
        onBlock={handleBlockCompany}
        company={company}
        loading={actionLoading}
        reason={blockReason}
        onReasonChange={(e) => setBlockReason(e.target.value)}
        duration={blockDuration}
        onDurationChange={(value: string) => setBlockDuration(value)}
      />
    </div>
  );
};

export default AdminCompanyDetailsPage;