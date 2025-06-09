import React from "react";
import { ShieldCheck, ShieldX } from "lucide-react";
import { Badge, Button } from "../common"; // Adjust the import path as necessary
import { Company } from "../../types/company";

interface CompanyHeaderProps {
  company: Company;
  onVerify: () => void;
  onReject: () => void;
}

const CompanyHeader: React.FC<CompanyHeaderProps> = ({ company, onVerify, onReject }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <h1 className="text-3xl font-bold text-gray-900">{company.companyName}</h1>
      
      <div className="mt-2 md:mt-0 flex flex-wrap gap-2">
        {company.isVerified ? (
          <>
            <Badge color="green" size="large" icon={<ShieldCheck size={16} />}>
              Верифікована компанія
            </Badge>
            
            <Button
              variant="danger"
              size="small"
              onClick={onReject}
            >
              Скасувати верифікацію
            </Button>
          </>
        ) : (
          <>
            <Badge color="gray" size="large" icon={<ShieldX size={16} />}>
              Не верифікована
            </Badge>
            
            <Button
              variant="success"
              size="small"
              onClick={onVerify}
            >
              Верифікувати
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyHeader;