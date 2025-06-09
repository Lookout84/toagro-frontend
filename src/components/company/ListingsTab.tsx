import React from "react";
import { Tag, Eye } from "lucide-react";
import { Card, Button } from "../common";
import { CompanyListing } from "../../types/company";
import { getConditionBadge, getListingStatusBadge, formatPrice } from "../../utils/formatters";

interface ListingsTabProps {
  listings: CompanyListing[];
}

const ListingsTab: React.FC<ListingsTabProps> = ({ listings }) => {
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Оголошення компанії</h3>
        
        {listings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Оголошення
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Категорія
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ціна
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Стан
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Переглядів
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {listing.thumbnailUrl ? (
                          <img 
                            src={listing.thumbnailUrl} 
                            alt={listing.title}
                            className="h-10 w-10 rounded object-cover mr-3"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center mr-3">
                            <Tag size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {listing.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {listing.categoryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(listing.price, listing.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getConditionBadge(listing.condition)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getListingStatusBadge(listing.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {listing.views}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="small"
                        icon={<Eye size={14} />}
                        onClick={() => window.open(`/listings/${listing.id}`, "_blank")}
                      >
                        Перегляд
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Немає оголошень</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Ця компанія ще не створила жодного оголошення.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ListingsTab;