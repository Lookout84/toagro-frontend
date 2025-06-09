import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building, 
  FileText, 
  User, 
  Calendar, 
  Eye, 
  MessageSquare, 
  Ban 
} from "lucide-react";
import { Card, Badge, Button } from "../common";
import { Company } from "../../types/company";
import { formatters} from "../../utils"; // Using formatters instead of formatDate

interface CompanyInfoSidebarProps {
  company: Company;
  onBlockUser: () => void;
}

const CompanyInfoSidebar: React.FC<CompanyInfoSidebarProps> = ({ 
  company, 
  onBlockUser 
}) => {
  const navigate = useNavigate();
  
  function getCompanySize(size: string): React.ReactNode {
    switch (size) {
      case "small":
        return "Мала (до 50 співробітників)";
      case "medium":
        return "Середня (51-250 співробітників)";
      case "large":
        return "Велика (понад 250 співробітників)";
      default:
        return "Не вказано";
    }
  }

  return (
    <Card className="lg:col-span-1">
      <div className="p-6">
        <div className="flex justify-center mb-6">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.companyName}
              className="w-48 h-48 object-cover rounded-lg"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <Building className="h-20 w-20 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText size={18} className="text-green-600 mr-2" />
              Основна інформація
            </h3>
            
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-sm text-gray-500">ЄДРПОУ:</p>
                <p className="text-gray-900 font-medium">{company.companyCode}</p>
              </div>
              
              {company.vatNumber && (
                <div>
                  <p className="text-sm text-gray-500">ІПН:</p>
                  <p className="text-gray-900">{company.vatNumber}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500">Розмір компанії:</p>
                <p className="text-gray-900">{getCompanySize(company.size)}</p>
              </div>
              
              {company.foundedYear && (
                <div>
                  <p className="text-sm text-gray-500">Рік заснування:</p>
                  <p className="text-gray-900">{company.foundedYear}</p>
                </div>
              )}
              
              {company.industry && (
                <div>
                  <p className="text-sm text-gray-500">Галузь:</p>
                  <p className="text-gray-900">{company.industry}</p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User size={18} className="text-green-600 mr-2" />
              Інформація про користувача
            </h3>
            
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-sm text-gray-500">Ім&#39;я та прізвище:</p>
                <p className="text-gray-900">{company.user.firstName} {company.user.lastName}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Email:</p>
                <p className="text-gray-900">{company.user.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Статус:</p>
                <p className="text-gray-900">
                  {company.user.isActive ? (
                    <Badge color="green">Активний</Badge>
                  ) : (
                    <Badge color="red">Заблокований</Badge>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar size={18} className="text-green-600 mr-2" />
              Дати
            </h3>
            
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-sm text-gray-500">Дата реєстрації:</p>
                <p className="text-gray-900">{formatters.formatDate(company.createdAt)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Останнє оновлення:</p>
                <p className="text-gray-900">{formatters.formatDate(company.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 space-y-2">
          <Button
            variant="outline"
            fullWidth
            icon={<Eye size={16} />}
            onClick={() => window.open(`/companies/${company.id}`, "_blank")}
          >
            Переглянути публічний профіль
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            icon={<MessageSquare size={16} />}
            onClick={() => navigate(`/admin/messages?userId=${company.user.id}`)}
          >
            Надіслати повідомлення
          </Button>
          
          <Button
            variant="danger"
            fullWidth
            icon={<Ban size={16} />}
            onClick={onBlockUser}
            disabled={!company.user.isActive}
          >
            {company.user.isActive ? "Заблокувати користувача" : "Користувач заблокований"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CompanyInfoSidebar;