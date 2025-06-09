import React from "react";
import { FileText, Eye, Download } from "lucide-react";
import { Card, Button } from "../common";
import { CompanyDocument } from "../../types/company";
import { formatDate, formatFileSize, getDocumentTypeLabel, getDocumentStatusBadge } from "../../utils/formatters";

interface DocumentsTabProps {
  documents: CompanyDocument[];
  onOpenDocumentModal: (document: CompanyDocument, action: "verify" | "reject") => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ documents, onOpenDocumentModal }) => {
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Документи компанії</h3>
        
        {documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Назва документа
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата завантаження
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText size={16} className="text-gray-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {doc.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(doc.fileSize)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDocumentTypeLabel(doc.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getDocumentStatusBadge(doc.verificationStatus)}
                      {doc.verificationComment !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          {doc.verificationComment}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="small"
                        icon={<Eye size={14} />}
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                        className="mr-2"
                      >
                        Перегляд
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="small"
                        icon={<Download size={14} />}
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.fileUrl;
                          link.download = doc.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="mr-2"
                      >
                        Завантажити
                      </Button>
                      
                      {doc.verificationStatus === "PENDING" && (
                        <>
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => onOpenDocumentModal(doc, "verify")}
                            className="mr-2"
                          >
                            Підтвердити
                          </Button>
                          
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => onOpenDocumentModal(doc, "reject")}
                          >
                            Відхилити
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Немає документів</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Ця компанія ще не завантажила жодного документа для верифікації.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DocumentsTab;