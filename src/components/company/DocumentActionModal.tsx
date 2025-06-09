import React, { ChangeEvent } from "react";
import { Check, X, FileText, Eye } from "lucide-react";
import { Modal, Button, TextArea } from "../common";
import { CompanyDocument } from "../../types/company";
// Update the import path below to the correct relative path where 'formatters' actually exists.
// For example, if 'utils/formatters.ts' is in 'src/utils/formatters.ts', use:
import { formatFileSize, getDocumentTypeLabel } from "../../utils/formatters";

interface DocumentActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
  document: CompanyDocument | null;
  action: "verify" | "reject";
  comment: string;
  onCommentChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  loading: boolean;
}

const DocumentActionModal: React.FC<DocumentActionModalProps> = ({
  isOpen,
  onClose,
  onAction,
  document,
  action,
  comment,
  onCommentChange,
  loading
}) => {
  if (!document) return null;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title={action === "verify" ? "Підтвердження документа" : "Відхилення документа"}
    >
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            {action === "verify" ? (
              <Check size={24} className="text-green-500 mr-2" />
            ) : (
              <X size={24} className="text-red-500 mr-2" />
            )}
            <h3 className="text-lg font-medium text-gray-900">
              {action === "verify" 
                ? "Підтвердження документа" 
                : "Відхилення документа"}
            </h3>
          </div>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <FileText size={16} className="text-gray-500 mr-2" />
              <p className="text-gray-900 font-medium">{document.name}</p>
            </div>
            <p className="text-sm text-gray-600">
              Тип: {getDocumentTypeLabel(document.type)}
            </p>
            <p className="text-sm text-gray-600">
              Розмір: {formatFileSize(document.fileSize)}
            </p>
            <div className="mt-2">
              <Button
                variant="outline"
                size="small"
                icon={<Eye size={14} />}
                onClick={() => window.open(document.fileUrl, "_blank")}
              >
                Переглянути документ
              </Button>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="documentComment" className="block text-gray-700 font-medium mb-2">
              {action === "verify" 
                ? "Коментар (необов'язково)" 
                : "Причина відхилення *"}
            </label>
            <TextArea
              id="documentComment"
              name="documentComment"
              placeholder={
                action === "verify"
                  ? "Додайте коментар до підтвердження (необов'язково)"
                  : "Вкажіть причину відхилення документа"
              }
              rows={4}
              value={comment}
              onChange={onCommentChange}
              error={
                action === "reject" && comment.trim() === "" 
                  ? "Вкажіть причину відхилення" 
                  : ""
              }
            />
            {action === "reject" && (
              <p className="mt-1 text-xs text-gray-500">
                Ця інформація буде надіслана компанії для виправлення проблем.
              </p>
            )}
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
            variant={action === "verify" ? "success" : "danger"}
            onClick={onAction}
            loading={loading}
            disabled={action === "reject" && comment.trim() === ""}
          >
            {loading 
              ? (action === "verify" ? "Підтвердження..." : "Відхилення...") 
              : (action === "verify" ? "Підтвердити документ" : "Відхилити документ")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentActionModal;