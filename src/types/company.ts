/**
 * Інтерфейс для адреси компанії
 */
export interface CompanyAddress {
  street: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
}

/**
 * Інтерфейс для контактної інформації компанії
 */
export interface CompanyContactInfo {
  email: string;
  phone: string;
  additionalPhone?: string;
}

/**
 * Інтерфейс для користувача, пов'язаного з компанією
 */
export interface CompanyUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  role: string;
}

/**
 * Інтерфейс для базової інформації про компанію
 */
export interface Company {
  id: number;
  companyName: string;
  companyCode: string; // ЄДРПОУ
  logoUrl?: string;
  description?: string;
  website?: string;
  industry?: string;
  size: "MICRO" | "SMALL" | "MEDIUM" | "LARGE";
  foundedYear?: number;
  vatNumber?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  address: CompanyAddress;
  contactInfo: CompanyContactInfo;
  user: CompanyUser;
  documentsCount?: number;
  rejectionReason?: string; // Додано для підтримки відхилених компаній
}

/**
 * Статуси документів компанії
 */
export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

/**
 * Типи документів компанії
 */
export type DocumentType =
  | "REGISTRATION_CERTIFICATE"
  | "TAX_ID"
  | "DIRECTOR_ID"
  | "BUSINESS_LICENSE"
  | "FINANCIAL_STATEMENT"
  | "OTHER";

/**
 * Інтерфейс для документа компанії
 */
export interface CompanyDocument {
  id: number;
  companyId: number;
  name: string;
  type: DocumentType;
  fileUrl: string;
  fileSize: number;
  verificationStatus: DocumentStatus;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  verificationComment?: string;
}

/**
 * Статуси оголошень компанії
 */
export type ListingStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "REJECTED";

/**
 * Стан товару в оголошенні
 */
export type ProductCondition = "NEW" | "USED" | "REFURBISHED";

/**
 * Інтерфейс для оголошення компанії
 */
export interface CompanyListing {
  id: number;
  companyId: number;
  title: string;
  price: number;
  currency: string;
  categoryId: number;
  categoryName: string;
  condition: ProductCondition;
  thumbnailUrl?: string;
  status: ListingStatus;
  views: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Типи дій в історії верифікації
 */
export type VerificationAction =
  | "COMPANY_VERIFIED"
  | "COMPANY_REJECTED"
  | "DOCUMENT_VERIFIED"
  | "DOCUMENT_REJECTED"
  | "USER_BLOCKED"
  | "USER_UNBLOCKED";

/**
 * Інтерфейс для елемента історії верифікації
 */
export interface VerificationHistoryItem {
  id: number;
  companyId: number;
  adminId: number;
  adminName: string;
  action: VerificationAction;
  documentId?: number;
  documentName?: string;
  comment?: string;
  timestamp: string;
}

/**
 * Інтерфейс для статистики компанії
 */
export interface CompanyStats {
  activeListingsCount: number;
  totalViews: number;
  totalListings: number;
  activeListings: number;
  totalDocuments: number;
  documentsCount: number;
  pendingDocuments: number;
  totalOrders: number;
  totalReviews: number;
  averageRating: number;
  lastActivityDate?: string;
  averageResponseTime?: number; // в годинах
  responseRate?: number; // відсоток від 0 до 100
  completedDealsCount?: number;
  positiveRatingsPercentage?: number; // відсоток від 0 до 100
}
