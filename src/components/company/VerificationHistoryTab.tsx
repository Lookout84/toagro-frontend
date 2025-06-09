import React from "react";
import { FileSpreadsheet } from "lucide-react";
import { Card } from "../common";
import { VerificationHistoryItem } from "../../types/company";
import { formatDate, getHistoryActionIcon, getHistoryActionText } from "../../utils/formatters";

interface VerificationHistoryTabProps {
  history: VerificationHistoryItem[];
}

const VerificationHistoryTab: React.FC<VerificationHistoryTabProps> = ({ history }) => {
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Історія верифікації</h3>
        
        {history.length > 0 ? (
          <div className="flow-root">
            <ul className="-mb-8">
              {history.map((item, index) => (
                <li key={item.id}>
                  <div className="relative pb-8">
                    {index !== history.length - 1 ? (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                          {getHistoryActionIcon(item.action)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">{item.adminName}</span>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {formatDate(item.timestamp)}
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          <p className="font-medium">{getHistoryActionText(item)}</p>
                          {item.comment && (
                            <p className="mt-1 text-gray-600">
                              Коментар: {item.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Немає історії верифікації</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Для цієї компанії ще не було жодних дій з верифікації.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VerificationHistoryTab;