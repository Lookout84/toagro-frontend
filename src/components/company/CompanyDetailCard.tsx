import React from "react";
import { 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Tag, 
  FileText, 
  Truck,
  MessageSquare,
  Star
} from "lucide-react";
import { Card } from "../common";
import { Company, CompanyStats } from "../../types/company";

interface CompanyDetailCardProps {
  company: Company;
  stats: CompanyStats | null;
}

const CompanyDetailCard: React.FC<CompanyDetailCardProps> = ({ company, stats }) => {
  return (
    <Card className="lg:col-span-2">
      <div className="p-6">
        {/* Опис компанії */}
        {company.description && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Опис компанії</h3>
            <p className="text-gray-700">{company.description}</p>
          </div>
        )}
        
        {/* Контактна інформація */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Контактна інформація</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <MapPin size={18} className="text-gray-500 mt-0.5 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Адреса:</p>
                <p className="text-gray-900">
                  {[
                    company.address.street,
                    company.address.city,
                    company.address.region,
                    company.address.country,
                    company.address.postalCode
                  ].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Mail size={18} className="text-gray-500 mt-0.5 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Email:</p>
                <a href={`mailto:${company.contactInfo.email}`} className="text-blue-600 hover:underline">
                  {company.contactInfo.email}
                </a>
              </div>
            </div>
            
            <div className="flex items-start">
              <Phone size={18} className="text-gray-500 mt-0.5 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Телефон:</p>
                <a href={`tel:${company.contactInfo.phone}`} className="text-blue-600 hover:underline">
                  {company.contactInfo.phone}
                </a>
              </div>
            </div>
            
            {company.contactInfo.additionalPhone && (
              <div className="flex items-start">
                <Phone size={18} className="text-gray-500 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Додатковий телефон:</p>
                  <a href={`tel:${company.contactInfo.additionalPhone}`} className="text-blue-600 hover:underline">
                    {company.contactInfo.additionalPhone}
                  </a>
                </div>
              </div>
            )}
            
            {company.website && (
              <div className="flex items-start">
                <Globe size={18} className="text-gray-500 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Веб-сайт:</p>
                  <a 
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline"
                  >
                    {company.website}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Статистика компанії */}
        {stats && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Статистика</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-100 text-green-600 mx-auto mb-2">
                  <Tag size={20} />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalListings}</p>
                  <p className="text-sm text-gray-500">Всього оголошень</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 text-blue-600 mx-auto mb-2">
                  <Tag size={20} />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.activeListings}</p>
                  <p className="text-sm text-gray-500">Активних оголошень</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-100 text-purple-600 mx-auto mb-2">
                  <FileText size={20} />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
                  <p className="text-sm text-gray-500">Документів</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-yellow-100 text-yellow-600 mx-auto mb-2">
                  <FileText size={20} />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingDocuments}</p>
                  <p className="text-sm text-gray-500">Очікують перевірки</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 mx-auto mb-2">
                  <Truck size={20} />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                  <p className="text-sm text-gray-500">Замовлень</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-100 text-amber-600 mx-auto mb-2">
                  <MessageSquare size={20} />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
                  <p className="text-sm text-gray-500">Відгуків</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 col-span-2">
                <div className="flex items-center">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-orange-100 text-orange-600 mr-3">
                    <Star size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
                    </p>
                    <p className="text-sm text-gray-500">Середній рейтинг</p>
                  </div>
                  {stats.averageRating > 0 && (
                    <div className="ml-auto">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={
                              star <= Math.round(stats.averageRating)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 text-right">
                        На основі {stats.totalReviews} відгуків
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CompanyDetailCard;