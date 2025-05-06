import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Loader from "../components/common/Loader";
import ProtectedRoute from "../components/common/ProtectedRoute";
import AdminRoute from "../components/common/AdminRoute";

// Лінивий імпорт сторінок для оптимізації завантаження
// Головні сторінки
const HomePage = lazy(() => import("../pages/HomePage"));
const CatalogPage = lazy(() => import("../pages/CatalogPage"));
const ListingDetailsPage = lazy(() => import("../pages/ListingDetailsPage"));
const CreateListingPage = lazy(() => import("../pages/CreateListingPage"));
const EditListingPage = lazy(() => import("../pages/EditListingPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

// Сторінки авторизації
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("../pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));

// Сторінки профілю користувача
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const UserListingsPage = lazy(() => import("../pages/profile/UserListingsPage"));
const UserProfileSettingsPage = lazy(() => import("../pages/profile/UserProfileSettingsPage"));
const UserPasswordChangePage = lazy(() => import("../pages/profile/UserPasswordChangePage"));
const UserNotificationsPage = lazy(() => import("../pages/profile/UserNotificationsPage"));
const CompareListingsPage = lazy(() => import("../pages/profile/CompareListingsPage"));
const UserTransactionsPage = lazy(() => import("../pages/profile/UserTransactionsPage"));

// Сторінки чату
const ChatPage = lazy(() => import("../pages/ChatPage"));
const ChatConversationPage = lazy(() => import("../pages/ChatConversationPage"));

// Сторінки оплати
const PaymentPage = lazy(() => import("../pages/PaymentPage"));
const PaymentSuccessPage = lazy(() => import("../pages/PaymentSuccessPage"));
const PaymentFailurePage = lazy(() => import("../pages/PaymentFailurePage"));

// Сторінки адмін-панелі
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const AdminUserEditPage = lazy(() => import("../pages/admin/AdminUserEditPage"));
const AdminListingsPage = lazy(() => import("../pages/admin/AdminListingsPage"));
const AdminCategoriesPage = lazy(() => import("../pages/admin/AdminCategoriesPage"));
const AdminPaymentsPage = lazy(() => import("../pages/admin/AdminPaymentsPage"));
const AdminNotificationsPage = lazy(() => import("../pages/admin/AdminNotificationsPage"));
const AdminCampaignsPage = lazy(() => import("../pages/admin/AdminCampaignsPage"));
const AdminCampaignDetailsPage = lazy(() => import("../pages/admin/AdminCampaignDetailsPage"));
const AdminCreateCampaignPage = lazy(() => import("../pages/admin/AdminCreateCampaignPage"));
const AdminEditCampaignPage = lazy(() => import("../pages/admin/AdminEditCampaignPage"));
const AdminScheduledTasksPage = lazy(() => import("../pages/admin/AdminScheduledTasksPage"));
const AdminSystemHealthPage = lazy(() => import("../pages/admin/AdminSystemHealthPage"));
const AdminQueuesPage = lazy(() => import("../pages/admin/AdminQueuesPage"));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Публічні маршрути */}
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/:categorySlug" element={<CatalogPage />} />
        <Route path="/listings/:id" element={<ListingDetailsPage />} />

        {/* Маршрути авторизації */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Захищені маршрути - лише для авторизованих користувачів */}
        <Route
          path="/listings/create"
          element={
            <ProtectedRoute>
              <CreateListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/listings/edit/:id"
          element={
            <ProtectedRoute>
              <EditListingPage />
            </ProtectedRoute>
          }
        />

        {/* Сторінки профілю користувача */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/listings"
          element={
            <ProtectedRoute>
              <UserListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/settings"
          element={
            <ProtectedRoute>
              <UserProfileSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/settings/password"
          element={
            <ProtectedRoute>
              <UserPasswordChangePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/notifications"
          element={
            <ProtectedRoute>
              <UserNotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/compare"
          element={
            <ProtectedRoute>
              <CompareListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/transactions"
          element={
            <ProtectedRoute>
              <UserTransactionsPage />
            </ProtectedRoute>
          }
        />

        {/* Сторінки чату */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:userId"
          element={
            <ProtectedRoute>
              <ChatConversationPage />
            </ProtectedRoute>
          }
        />

        {/* Сторінки оплати */}
        <Route
          path="/payment/:listingId"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/success/:transactionId"
          element={
            <ProtectedRoute>
              <PaymentSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/failure/:transactionId"
          element={
            <ProtectedRoute>
              <PaymentFailurePage />
            </ProtectedRoute>
          }
        />

        {/* Адміністративні маршрути */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <AdminRoute>
              <AdminUserEditPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/listings"
          element={
            <AdminRoute>
              <AdminListingsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <AdminCategoriesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <AdminRoute>
              <AdminPaymentsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <AdminRoute>
              <AdminNotificationsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/campaigns"
          element={
            <AdminRoute>
              <AdminCampaignsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/campaigns/create"
          element={
            <AdminRoute>
              <AdminCreateCampaignPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/campaigns/:id"
          element={
            <AdminRoute>
              <AdminCampaignDetailsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/campaigns/:id/edit"
          element={
            <AdminRoute>
              <AdminEditCampaignPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/scheduled-tasks"
          element={
            <AdminRoute>
              <AdminScheduledTasksPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/system-health"
          element={
            <AdminRoute>
              <AdminSystemHealthPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/queues"
          element={
            <AdminRoute>
              <AdminQueuesPage />
            </AdminRoute>
          }
        />

        {/* Сторінка 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;