import React, { ChangeEvent } from "react";
import { Ban } from "lucide-react";
import { Modal, Button, TextArea, Select } from "../common";
import { Company } from "../../types/company";

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlock: () => void;
  company: Company;
  loading: boolean;
  reason: string;
  onReasonChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  duration: string;
  onDurationChange: (value: string) => void;
}

const BlockUserModal: React.FC<BlockUserModalProps> = ({
  isOpen,
  onClose,
  onBlock,
  company,
  loading,
  reason,
  onReasonChange,
  duration,
  onDurationChange
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title="Блокування користувача"
    >
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Ban size={24} className="text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Заблокувати користувача?
            </h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            Ви збираєтесь заблокувати користувача компанії &quot;{company?.companyName}&quot;.
            Це обмежить доступ користувача до платформи та функцій.
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="blockDuration" className="block text-gray-700 font-medium mb-2">
                Тривалість блокування *
              </label>
              <Select
                value={duration}
                onChange={onDurationChange}
                options={[
                  { value: "1", label: "1 день" },
                  { value: "3", label: "3 дні" },
                  { value: "7", label: "7 днів" },
                  { value: "14", label: "14 днів" },
                  { value: "30", label: "30 днів" },
                  { value: "90", label: "90 днів" },
                  { value: "365", label: "1 рік" },
                  { value: "0", label: "Назавжди" },
                ]}
              />
            </div>
            
            <div>
              <label htmlFor="blockReason" className="block text-gray-700 font-medium mb-2">
                Причина блокування *
              </label>
              <TextArea
                id="blockReason"
                name="blockReason"
                placeholder="Вкажіть причину блокування користувача"
                rows={4}
                value={reason}
                onChange={onReasonChange}
                error={reason.trim() === "" ? "Вкажіть причину блокування" : ""}
              />
              <p className="mt-1 text-xs text-gray-500">
                Ця інформація буде надіслана користувачу як пояснення блокування.
              </p>
            </div>
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
            onClick={onBlock}
            loading={loading}
            disabled={reason.trim() === ""}
          >
            {loading ? "Блокування..." : "Заблокувати користувача"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BlockUserModal;