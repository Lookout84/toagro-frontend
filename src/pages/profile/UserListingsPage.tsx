import React, { useState, useEffect } from "react"; // Додано явний імпорт React
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchUserListings, deleteListing } from "../../store/listingSlice";
import {
  Plus,
  ListOrdered,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Eye,
} from "lucide-react";
import Loader from "../../components/common/Loader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import type { Listing as BaseCatalogListing } from "../../store/catalogSlice";

// Оновлене визначення типу для кращої типізації зображень
export type CatalogListing = BaseCatalogListing & {
  status: string;
  currency?: string;
  images?: Array<{ url?: string; path?: string; } | string>;
};

// Виправлення: мемоізація селектора для оптимізації
const selectUserListingsState = (state: any) => ({
  userListings: state.listing.userListings as CatalogListing[],
  isLoading: state.listing.isLoading,
});

const UserListingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { userListings, isLoading } = useAppSelector(selectUserListingsState);

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [listingToDelete, setListingToDelete] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Завантаження оголошень користувача
  useEffect(() => {
    // Виправлення: додано обробку помилок
    const loadUserListings = async () => {
      try {
        await dispatch(fetchUserListings()).unwrap();
      } catch (error) {
        console.error("Помилка завантаження оголошень:", error);
      }
    };
    
    loadUserListings();
  }, [dispatch]);

  // Обробник для відкриття діалогу видалення
  const handleOpenDeleteModal = (id: number) => {
    setListingToDelete(id);
    setShowDeleteModal(true);
  };

  // Обробник для підтвердження видалення
  const handleConfirmDelete = async () => {
    if (listingToDelete) {
      try {
        await dispatch(deleteListing(listingToDelete)).unwrap();
        setShowDeleteModal(false);
        setListingToDelete(null);
      } catch (error) {
        console.error("Помилка видалення оголошення:", error);
      }
    }
  };

  // Обробник для оновлення списку оголошень
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchUserListings()).unwrap();
    } catch (error) {
      console.error("Помилка оновлення списку оголошень:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Форматування ціни з правильною валютою
  const formatPrice = (price: number, currency = "UAH") => {
    try {
      // Визначаємо правильну валюту для форматування
      const currencyCode = currency?.toUpperCase()?.trim() || "UAH";
      return new Intl.NumberFormat("uk-UA", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    } catch (error) {
      console.error("Помилка форматування ціни:", error);
      return `${price} грн`;
    }
  };

  // Форматування дати
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("uk-UA");
    } catch (error) {
      console.error("Помилка форматування дати:", error);
      return dateString;
    }
  };

  // Отримання кольору для статусу
  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
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

  // Отримання URL зображення з різних форматів
  const getImageUrl = (image: any): string => {
    if (!image) return '';
    
    if (typeof image === 'string') return image;
    
    return image.url || image.path || '';
  };

  // Відображення завантажувача під час завантаження даних
  if (isLoading && !userListings?.length) {
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
              {userListings?.length || 0}
            </span>
          </h2>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="small"
              icon={<RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              Оновити
            </Button>

            <Link to="/listings/create">
              <Button
                variant="primary"
                size="small"
                icon={<Plus size={16} />}
              >
                Додати оголошення
              </Button>
            </Link>
          </div>
        </div>

        {!userListings?.length ? (
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
                            src={getImageUrl(listing.images[0])}
                            alt={listing.title}
                            onError={(e) => {
                              // Виправлення: додано обробник помилки завантаження зображення
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = 'https://via.placeholder.com/100?text=Немає+фото';
                            }}
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
                        {formatPrice(listing.price, listing.currency)}
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
                          variant="outline"
                          size="small"
                          icon={<Eye size={14} />}
                          title="Переглянути"
                        >
                          Переглянути
                        </Button>
                      </Link>
                      <Link to={`/profile/listings/edit/${listing.id}`}>
                        <Button
                          variant="outline"
                          size="small"
                          icon={<Edit2 size={14} />}
                          title="Редагувати"
                        >
                          Редагувати
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="small"
                        icon={<Trash2 size={14} />}
                        title="Видалити"
                        onClick={() => handleOpenDeleteModal(listing.id)}
                      >
                        Видалити
                      </Button>
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
        </Modal>
      </div>
    </Card>
  );
};

export default UserListingsPage;


// import { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { useAppDispatch, useAppSelector } from "../../store";
// import { fetchUserListings, deleteListing } from "../../store/listingSlice";
// import {
//   Plus,
//   ListOrdered,
//   Edit2,
//   Trash2,
//   AlertTriangle,
//   RefreshCw,
//   Eye,
// } from "lucide-react";
// import Loader from "../../components/common/Loader";
// import Card from "../../components/common/Card";
// import Button from "../../components/common/Button";
// import Modal from "../../components/common/Modal"; // Перенесено вгору
// import type { Listing as BaseCatalogListing } from "../../store/catalogSlice";

// // Об'єднано типи в один
// export type CatalogListing = BaseCatalogListing & {
//   status: string;
//   currency?: string; // Додано currency для коректного форматування ціни
//   images?: Array<{ url?: string; path?: string; } | string>; // Додано тип для images, враховуючи можливість string
// };

// const UserListingsPage = () => {
//   const dispatch = useAppDispatch();
//   const { userListings, isLoading } = useAppSelector((state) => ({
//     userListings: state.listing.userListings as CatalogListing[],
//     isLoading: state.listing.isLoading,
//   }));

//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [listingToDelete, setListingToDelete] = useState<number | null>(null);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // Load user listings
//   useEffect(() => {
//     dispatch(fetchUserListings());
//   }, [dispatch]);

//   // Handler for opening delete dialog
//   const handleOpenDeleteModal = (id: number) => {
//     setListingToDelete(id);
//     setShowDeleteModal(true);
//   };

//   // Handler for confirming deletion
//   const handleConfirmDelete = async () => {
//     if (listingToDelete) {
//       await dispatch(deleteListing(listingToDelete));
//       setShowDeleteModal(false);
//       setListingToDelete(null);
//     }
//   };

//   // Handler for refreshing listings
//   const handleRefresh = async () => {
//     setIsRefreshing(true);
//     await dispatch(fetchUserListings());
//     setIsRefreshing(false);
//   };

//   // Format price with correct currency
//   const formatPrice = (price: number, currency = "UAH") => {
//     // Визначаємо правильну валюту для форматування
//     const currencyCode = currency.toUpperCase().trim();
//     return new Intl.NumberFormat("uk-UA", {
//       style: "currency",
//       currency: currencyCode,
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(price);
//   };

//   // Format date
//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString("uk-UA");
//   };

//   // Get status color
//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'active':
//         return 'bg-green-100 text-green-800';
//       case 'pending':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'rejected':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   if (isLoading && !userListings.length) {
//     return <Loader />;
//   }

//   return (
//     <Card>
//       <div className="p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-semibold text-gray-900 flex items-center">
//             <ListOrdered className="mr-2" size={24} />
//             Мої оголошення
//             <span className="ml-2 text-sm bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
//               {userListings.length}
//             </span>
//           </h2>

//           <div className="flex space-x-2">
//             <Button
//               variant="outline"
//               size="sm"
//               icon={<RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />}
//               onClick={handleRefresh}
//               disabled={isRefreshing}
//             >
//               Оновити
//             </Button>

//             <Link to="/listings/create">
//               <Button
//                 variant="primary"
//                 size="sm"
//                 icon={<Plus size={16} />}
//               >
//                 Додати оголошення
//               </Button>
//             </Link>
//           </div>
//         </div>

//         {userListings.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-12 text-center">
//             <ListOrdered size={48} className="text-gray-300 mb-4" />
//             <p className="text-gray-600 mb-4">
//               У вас ще немає опублікованих оголошень
//             </p>
//             <Link to="/listings/create">
//               <Button
//                 variant="primary"
//                 icon={<Plus size={18} />}
//               >
//                 Створити перше оголошення
//               </Button>
//             </Link>
//           </div>
//         ) : (
//           <div className="overflow-hidden border border-gray-200 rounded-lg">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Фото
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Назва
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Ціна
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Дата
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Статус
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Дії
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {userListings.map((listing: CatalogListing) => (
//                   <tr key={listing.id}>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex-shrink-0 h-10 w-10">
//                         {listing.images && listing.images.length > 0 ? (
//                           <img
//                             className="h-10 w-10 rounded-md object-cover"
//                             src={typeof listing.images[0] === 'string' 
//                               ? listing.images[0] 
//                               : (listing.images[0] 
//                                 ? ((listing.images[0] as {url?: string; path?: string})?.url || 
//                                    (listing.images[0] as {url?: string; path?: string})?.path || '')
//                                 : '')}
//                             alt={listing.title}
//                           />
//                         ) : (
//                           <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
//                             <AlertTriangle size={16} className="text-gray-400" />
//                           </div>
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm font-medium text-gray-900">
//                         {listing.title}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm text-gray-900">
//                         {formatPrice(listing.price, listing.currency)}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm text-gray-500">
//                         {formatDate(listing.createdAt)}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(listing.status)}`}>
//                         {listing.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
//                       <Link to={`/listings/${listing.id}`}>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           icon={<Eye size={14} />}
//                           title="Переглянути"
//                         />
//                       </Link>
//                       <Link to={`/listings/edit/${listing.id}`}>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           icon={<Edit2 size={14} />}
//                           title="Редагувати"
//                         />
//                       </Link>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         icon={<Trash2 size={14} />}
//                         title="Видалити"
//                         onClick={() => handleOpenDeleteModal(listing.id)}
//                       />
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Delete Confirmation Modal */}
//         <Modal
//           isOpen={showDeleteModal}
//           onClose={() => setShowDeleteModal(false)}
//           title="Підтвердження видалення"
//         >
//           <p>Ви впевнені, що хочете видалити це оголошення? Цю дію не можна буде скасувати.</p>
//           <div className="mt-4 flex justify-end space-x-2">
//             <Button
//               variant="outline"
//               onClick={() => setShowDeleteModal(false)}
//             >
//               Скасувати
//             </Button>
//             <Button
//               variant="danger"
//               onClick={handleConfirmDelete}
//             >
//               Видалити
//             </Button>
//           </div>
//         </Modal>
//       </div>
//     </Card>
//   );
// };

// export default UserListingsPage;