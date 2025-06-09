import React from "react";
import { ShieldCheck } from "lucide-react";
import { Modal, Button } from "../common";
import { Company } from "../../types/company";

interface VerifyCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
  company: Company;
  loading: boolean;
}

const VerifyCompanyModal: React.FC<VerifyCompanyModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  company,
  loading
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title="Верифікація компанії"
    >
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <ShieldCheck size={24} className="text-green-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Верифікувати компанію?
            </h3>
          </div>
          
          <p className="text-gray-600 mb-2">
            Ви збираєтесь верифікувати компанію <strong>{company.companyName}</strong>.
          </p>
          <p className="text-gray-600">
            Верифікована компанія отримає доступ до всіх функцій платформи. Це дія означає, що:
          </p>
          <ul className="list-disc pl-5 mt-2 text-gray-600 space-y-1">
            <li>Ви перевірили документи компанії та підтверджуєте їх достовірність</li>
            <li>Компанія отримає спеціальну відмітку &quot;Верифіковано&quot; у профілі</li>
            <li>Компанія отримає доступ до додаткових функцій платформи</li>
          </ul>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Скасувати
          </Button>
          <Button
            type="button"
            variant="success"
            onClick={onVerify}
            loading={loading}
          >
            {loading ? "Верифікація..." : "Підтвердити верифікацію"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VerifyCompanyModal;