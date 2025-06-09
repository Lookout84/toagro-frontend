import React, { useState } from "react";
import {
  Modal,
  Button,
  Tabs,
  Tab,
  TextArea,
  Select
} from "../common";
import { CompanyDocument } from "../../types/company";
import { FileCheck, FileX, Download } from "lucide-react";
import { formatDate, formatFileSize, getDocumentTypeLabel } from "../../utils/formatters";

interface DocumentPreviewModalProps {
  document: CompanyDocument;
  onClose: () => void;
  onVerify: () => void;
  onReject: (reason: string) => void;
}

/**
 * Модальне вікно для перегляду документа та прийняття рішення щодо верифікації
 */
const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose,
  onVerify,
  onReject
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedReason, setSelectedReason] = useState("");

  const isPdf = document.fileUrl.toLowerCase().endsWith(".pdf");
  
  const handleRejectSubmit = () => {
    onReject(rejectReason || selectedReason);
  };
  
  const commonReasons = [
    { value: "", label: "Виберіть причину відхилення" },
    { value: "Низька якість зображення", label: "Низька якість зображення" },
    { value: "Неправильний тип документа", label: "Неправильний тип документа" },
    { value: "Недійсний документ", label: "Недійсний документ" },
    { value: "Термін дії документа закінчився", label: "Термін дії документа закінчився" },
    { value: "Пошкоджений файл", label: "Пошкоджений файл" },
    { value: "Інформація не відповідає даним компанії", label: "Інформація не відповідає даним компанії" },
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Перегляд документа: ${document.name}`}
      size="lg"
    >
      <div className="p-4">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Компанія (ID)</p>
            <p className="font-medium">{document.companyId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Тип документа</p>
            <p className="font-medium">{getDocumentTypeLabel(document.type)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Розмір файлу</p>
            <p className="font-medium">{formatFileSize(document.fileSize)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Дата завантаження</p>
            <p className="font-medium">{formatDate(document.createdAt)}</p>
          </div>
        </div>
        
        <Tabs activeTab={activeTab} onChange={setActiveTab}>
          <Tab title="Перегляд документа">
            <div className="flex flex-col items-center">
              {isPdf ? (
                <div className="w-full h-[500px] bg-gray-100 rounded-md overflow-hidden">
                  <iframe
                    src={`${document.fileUrl}#toolbar=0`}
                    className="w-full h-full"
                    title={document.name}
                  />
                </div>
              ) : (
                <div className="flex justify-center">
                  <img
                    src={document.fileUrl}
                    alt={document.name}
                    className="max-w-full max-h-[500px] object-contain"
                  />
                </div>
              )}
              
              <div className="mt-4">
                <Button
                  variant="outline"
                  icon={<Download size={16} />}
                  onClick={() => window.open(document.fileUrl, "_blank")}
                >
                  Завантажити документ
                </Button>
              </div>
            </div>
          </Tab>
          <Tab title="Верифікація">
            <div className="space-y-6">
              <p className="text-sm text-gray-700">
                Перевірте документ та прийміть рішення щодо його верифікації. 
                У разі відхилення, вкажіть причину.
              </p>
              
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Виберіть стандартну причину відхилення</span>
                  <Select
                    value={selectedReason}
                    onChange={(value) => setSelectedReason(value)}
                    options={commonReasons}
                    className="w-full mt-1"
                  />
                </label>
                
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Або вкажіть власну причину відхилення</span>
                  <TextArea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Вкажіть причину відхилення документа..."
                    rows={3}
                    className="mt-1"
                  />
                </label>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Скасувати
                </Button>
                <Button 
                  variant="danger" 
                  icon={<FileX size={16} />}
                  onClick={handleRejectSubmit}
                  disabled={!rejectReason && !selectedReason}
                >
                  Відхилити
                </Button>
                <Button 
                  variant="primary" 
                  icon={<FileCheck size={16} />}
                  onClick={onVerify}
                >
                  Підтвердити
                </Button>
              </div>
            </div>
          </Tab>
        </Tabs>
      </div>
    </Modal>
  );
};

export default DocumentPreviewModal;