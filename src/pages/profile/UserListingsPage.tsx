import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchUserListings, deleteListing } from "../../store/listingSlice";
import {
  Plus,
  ListOrdered,
  Edit2,
  Trash2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Eye,
} from "lucide-react";
import Loader from "../../components/common/Loader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import type { Listing as CatalogListing } from "../../store/catalogSlice";
import Modal from "../../components/common/Modal";

export type Listing = {
  id: number;
  title: string;
  price: number;
  createdAt: string;
  images: string[];
  status: string; // Added 'status' property
};

const UserListingsPage = () => {
  const dispatch = useAppDispatch();
  const { userListings, isLoading } = useAppSelector((state) => state.listing);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load user listings
  useEffect(() => {
    dispatch(fetchUserListings());
  }, [dispatch]);

  // Handler for opening delete dialog
  const handleOpenDeleteModal = (id: number) => {
    setListingToDelete(id);
    setShowDeleteModal(true);
  };

  // Handler for confirming deletion
  const handleConfirmDelete = async () => {
    if (listingToDelete) {
      await dispatch(deleteListing(listingToDelete));
      setShowDeleteModal(false);
      setListingToDelete(null);
    }
  };

  // Handler for refreshing listings
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(fetchUserListings());
    setIsRefreshing(false);
  };

  // Format price in UAH
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "UAH",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uk-UA");
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && !userListings.length) {
    return <Loader />;
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <ListOrdered className="mr-2" size={24} />
            Мої оголошення
            <span className="ml-2 text-sm bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {userListings.length}
            </span>
          </h2>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              Оновити
            </Button>

            <Link to="/listings/create">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={16} />}
              >
                Додати оголошення
              </Button>
            </Link>
          </div>
        </div>

        {userListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ListOrdered size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">
              У вас ще немає опублікованих оголошень
            </p>
            <Link to="/listings/create">
              <Button
                variant="primary"
                icon={<Plus size={18} />}
              >
                Створити перше оголошення
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Фото
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Назва
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ціна
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userListings.map((listing: CatalogListing) => (
                  <tr key={listing.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex-shrink-0 h-10 w-10">
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            className="h-10 w-10 rounded-md object-cover"
                            src={listing.images[0]}
                            alt={listing.title}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                            <AlertTriangle size={16} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {listing.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatPrice(listing.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(listing.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(listing.status)}`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link to={`/listings/${listing.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye size={14} />}
                          title="Переглянути"
                        />
                      </Link>
                      <Link to={`/listings/edit/${listing.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 size={14} />}
                          title="Редагувати"
                        />
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        title="Видалити"
                        onClick={() => handleOpenDeleteModal(listing.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Підтвердження видалення"
          >
            <p>Ви впевнені, що хочете видалити це оголошення? Цю дію не можна буде скасувати.</p>
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Скасувати
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
              >
                Видалити
              </Button>
            </div>
          <p>Ви впевнені, що хочете видалити це оголошення? Цю дію не можна буде скасувати.</p>
        </Modal>
      </div>
    </Card>
  );
};

export default UserListingsPage;