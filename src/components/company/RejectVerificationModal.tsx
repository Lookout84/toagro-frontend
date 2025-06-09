import React, { ChangeEvent } from "react";
import { ShieldX } from "lucide-react";
import { Modal, Button, TextArea } from "../common";
import { Company } from "../../types/company";

interface RejectVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: () => void;
  company: Company;
  loading: boolean;
  reason: string;
  onReasonChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

const RejectVerificationModal: React.FC<RejectVerificationModalProps> = ({
  isOpen,
  onClose,
  onReject,
  company,
  loading,
  reason,
  onReasonChange
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title="Відхилення верифікації"
    >
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <ShieldX size={24} className="text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              {company.isVerified 
                ? "Скасувати верифікацію компанії?" 
                : "Відхилити верифікацію компанії?"}
            </h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            {company.isVerified 
              ? `Ви збираєтесь скасувати верифікацію компанії "${company.companyName}".` 
              : `Ви збираєтесь відхилити верифікацію компанії "${company.companyName}".`}
          </p>
          
          <div className="mb-4">
            <label htmlFor="rejectReason" className="block text-gray-700 font-medium mb-2">
              Причина відхилення *
            </label>
            <TextArea
              id="rejectReason"
              name="rejectReason"
              placeholder="Вкажіть причину відхилення верифікації"
              rows={4}
              value={reason}
              onChange={onReasonChange}
              error={reason.trim() === "" ? "Вкажіть причину відхилення" : ""}
            />
            <p className="mt-1 text-xs text-gray-500">
              Ця інформація буде надіслана компанії для виправлення проблем.
            </p>
          </div>
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
            variant="danger"
            onClick={onReject}
            loading={loading}
            disabled={reason.trim() === ""}
          >
            {loading ? "Відхилення..." : "Відхилити верифікацію"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RejectVerificationModal;