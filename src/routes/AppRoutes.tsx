import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Loader from "../components/common/Loader";
import ProtectedRoute from "../components/common/ProtectedRoute";

// Лінивий імпорт сторінок для оптимізації завантаження
// Головні сторінки
const HomePage = lazy(() => import("../pages/HomePage"));
const CatalogPage = lazy(() => import("../pages/CatalogPage"));
const ListingDetailsPage = lazy(() => import("../pages/ListingDetailsPage"));
const CreateListingPage = lazy(() => import("../pages/CreateListingPage"));
const EditListingPage = lazy(() => import("../pages/EditListingPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const NewListingsPage = lazy(() => import("../pages/NewListingsPage"));
const UsedListingsPage = lazy(() => import("../pages/UsedListingsPage"));
const AccessDeniedPage = lazy(() => import("../pages/AccessDeniedPage"));
const TestApiPage = lazy(() => import("../pages/TestApiPage"));
const TestAuthPage = lazy(() => import("../pages/TestAuthPage"));

// Сторінки авторизації
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const RegistrationConfirmPage = lazy(
  () => import("../pages/RegistrationConfirmPage")
);
const VerifyEmailPage = lazy(() => import("../pages/VerifyEmailPage"));
const CompanyVerificationPage = lazy(
  () => import("../pages/company/CompanyVerificationPage")
);
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));

// Сторінки профілю користувача
const ProfileRedirectPage = lazy(
  () => import("../components/common/ProfileRedirectPage")
);
const ProfilePage = lazy(() => import("../pages/profile/ProfilePage"));
const UserListingsPage = lazy(
  () => import("../pages/profile/UserListingsPage")
);
const UserProfileSettingsPage = lazy(
  () => import("../pages/profile/UserProfileSettingsPage")
);
const UserPasswordChangePage = lazy(
  () => import("../pages/profile/UserPasswordChangePage")
);
const UserNotificationsPage = lazy(
  () => import("../pages/profile/UserNotificationsPage")
);
const CompareListingsPage = lazy(
  () => import("../pages/profile/CompareListingsPage")
);
const UserTransactionsPage = lazy(
  () => import("../pages/profile/UserTransactionsPage")
);

// Сторінки компанії
const CompanyDashboardPage = lazy(
  () => import("../pages/company/CompanyDashboardPage")
);
const CompanySetupPage = lazy(
  () => import("../pages/company/CompanySetupPage")
);
const CompanyDocumentsPage = lazy(
  () => import("../pages/company/CompanyDocumentsPage")
);
const CompanyProfilePage = lazy(
  () => import("../pages/company/CompanyProfilePage")
);
const CompanyEditPage = lazy(() => import("../pages/company/CompanyEditPage"));

// Сторінки чату
const ChatPage = lazy(() => import("../pages/ChatPage"));
const ChatConversationPage = lazy(
  () => import("../pages/ChatConversationPage")
);

// Сторінки оплати
const PaymentPage = lazy(() => import("../pages/PaymentPage"));
const PaymentSuccessPage = lazy(() => import("../pages/PaymentSuccessPage"));
const PaymentFailurePage = lazy(() => import("../pages/PaymentFailurePage"));

// Сторінки адмін-панелі
const AdminDashboardPage = lazy(
  () => import("../pages/admin/AdminDashboardPage")
);
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const AdminUserEditPage = lazy(
  () => import("../pages/admin/AdminUserEditPage")
);
const AdminListingsPage = lazy(
  () => import("../pages/admin/AdminListingsPage")
);
const AdminCategoriesPage = lazy(
  () => import("../pages/admin/AdminCategoriesPage")
);
const AdminPaymentsPage = lazy(
  () => import("../pages/admin/AdminPaymentsPage")
);
const AdminNotificationsPage = lazy(
  () => import("../pages/admin/AdminNotificationsPage")
);
const AdminCampaignsPage = lazy(
  () => import("../pages/admin/AdminCampaignsPage")
);
const AdminCampaignDetailsPage = lazy(
  () => import("../pages/admin/AdminCampaignDetailsPage")
);
const AdminCreateCampaignPage = lazy(
  () => import("../pages/admin/AdminCreateCampaignPage")
);
const AdminEditCampaignPage = lazy(
  () => import("../pages/admin/AdminEditCampaignPage")
);
const AdminScheduledTasksPage = lazy(
  () => import("../pages/admin/AdminScheduledTasksPage")
);
const AdminRecurringTasksPage = lazy(
  () => import("../pages/admin/AdminRecurringTasksPage")
);
const AdminScheduledTaskDetailsPage = lazy(
  () => import("../pages/admin/AdminScheduledTaskDetailsPage")
);
const AdminSystemHealthPage = lazy(
  () => import("../pages/admin/AdminSystemHealthPage")
);
const AdminQueuesPage = lazy(() => import("../pages/admin/AdminQueuesPage"));

// Сторінки адміністрування компаній
const AdminCompaniesPage = lazy(
  () => import("../pages/admin/AdminCompaniesPage")
);
const AdminCompanyDetailsPage = lazy(
  () => import("../pages/admin/AdminCompanyDetailsPage")
);
const AdminCompanyVerificationPage = lazy(
  () => import("../pages/admin/AdminCompanyVerificationPage")
);
const AdminDocumentsVerificationPage = lazy(
  () => import("../pages/admin/AdminDocumentsVerificationPage")
);
const AdminSettingsPage = lazy(
  () => import("../pages/admin/AdminSettingsPage")
);

// Сторінки модератора
const ModeratorDashboardPage = lazy(
  () => import("../pages/moderator/ModeratorDashboardPage")
);
const ModeratorListingsPage = lazy(
  () => import("../pages/moderator/ModeratorListingsPage")
);
const ModeratorVerificationPage = lazy(
  () => import("../pages/moderator/ModeratorVerificationPage")
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Публічні маршрути */}
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/:categorySlug" element={<CatalogPage />} />
        <Route path="/listings/:id" element={<ListingDetailsPage />} />
        <Route path="/new" element={<NewListingsPage />} />
        <Route path="/used" element={<UsedListingsPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route path="/test-api" element={<TestApiPage />} />
        <Route path="/test-auth" element={<TestAuthPage />} />

        {/* Маршрути авторизації - доступні лише для неавторизованих */}
        <Route
          path="/login"
          element={
            <ProtectedRoute requireAuth={false}>
              <LoginPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register"
          element={
            <ProtectedRoute requireAuth={false}>
              <RegisterPage />
            </ProtectedRoute>
          }
        />
        <Route path="/verify/:token" element={<RegistrationConfirmPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Маршрут верифікації компанії */}
        <Route
          path="/company-verification"
          element={
            <ProtectedRoute>
              <CompanyVerificationPage />
            </ProtectedRoute>
          }
        />

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
          path="/profile/listings/edit/:id"
          element={
            <ProtectedRoute>
              <EditListingPage />
            </ProtectedRoute>
          }
        />
        <Route path="/account" element={<ProfileRedirectPage />} />

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

        {/* Сторінки компанії */}
        <Route
          path="/company"
          element={
            <ProtectedRoute roles={["COMPANY"]}>
              <CompanyDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/dashboard"
          element={
            <ProtectedRoute roles={["COMPANY"]}>
              <CompanyDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/setup"
          element={
            <ProtectedRoute roles={["COMPANY"]}>
              <CompanySetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/profile"
          element={
            <ProtectedRoute roles={["COMPANY"]}>
              <CompanyProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/edit"
          element={
            <ProtectedRoute roles={["COMPANY"]}>
              <CompanyEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/documents"
          element={
            <ProtectedRoute roles={["COMPANY"]}>
              <CompanyDocumentsPage />
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
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminUserEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/listings"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminCategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminPaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminNotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/campaigns"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminCampaignsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/campaigns/create"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminCreateCampaignPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/campaigns/:id"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminCampaignDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/campaigns/:id/edit"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminEditCampaignPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/scheduled-tasks"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminScheduledTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/scheduled-tasks/:id"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminScheduledTaskDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/recurring-tasks"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminRecurringTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/system-health"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminSystemHealthPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/queues"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminQueuesPage />
            </ProtectedRoute>
          }
        />

        {/* Маршрути адміністрування компаній */}
        <Route
          path="/admin/companies"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminCompaniesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/companies/:id"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminCompanyDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/companies/verification"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminCompanyVerificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/documents/verification"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminDocumentsVerificationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Маршрути модератора */}
        <Route
          path="/moderator"
          element={
            <ProtectedRoute roles={["MODERATOR", "ADMIN"]}>
              <ModeratorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/moderator/dashboard"
          element={
            <ProtectedRoute roles={["MODERATOR", "ADMIN"]}>
              <ModeratorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/moderator/listings"
          element={
            <ProtectedRoute roles={["MODERATOR", "ADMIN"]}>
              <ModeratorListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/moderator/verification"
          element={
            <ProtectedRoute roles={["MODERATOR", "ADMIN"]}>
              <ModeratorVerificationPage />
            </ProtectedRoute>
          }
        />

        {/* Сторінка 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

// import { lazy, Suspense } from "react";
// import { Routes, Route } from "react-router-dom";
// import Loader from "../components/common/Loader";
// import ProtectedRoute from "../components/common/ProtectedRoute";
// import AdminRoute from "../components/common/AdminRoute";

// // Лінивий імпорт сторінок для оптимізації завантаження
// // Головні сторінки
// const HomePage = lazy(() => import("../pages/HomePage"));
// const CatalogPage = lazy(() => import("../pages/CatalogPage"));
// const ListingDetailsPage = lazy(() => import("../pages/ListingDetailsPage"));
// const CreateListingPage = lazy(() => import("../pages/CreateListingPage"));
// const EditListingPage = lazy(() => import("../pages/EditListingPage"));
// const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
// const NewListingsPage = lazy(() => import("../pages/NewListingsPage"));
// const UsedListingsPage = lazy(() => import("../pages/UsedListingsPage"));

// // Сторінки авторизації
// const LoginPage = lazy(() => import("../pages/LoginPage"));
// const RegisterPage = lazy(() => import("../pages/RegisterPage"));
// const RegistrationConfirmPage = lazy(
//   () => import("../pages/RegistrationConfirmPage")
// );
// const VerifyEmailPage = lazy(() => import("../pages/VerifyEmailPage"));
// const CompanyVerificationPage = lazy(
//   () => import("../pages/company/CompanyVerificationPage")
// );
// const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
// const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));

// // Сторінки профілю користувача
// const ProfileRedirectPage = lazy(() => import("../components/common/ProfileRedirectPage"));
// const ProfilePage = lazy(() => import("../pages/profile/ProfilePage"));
// const UserListingsPage = lazy(
//   () => import("../pages/profile/UserListingsPage")
// );
// const UserProfileSettingsPage = lazy(
//   () => import("../pages/profile/UserProfileSettingsPage")
// );
// const UserPasswordChangePage = lazy(
//   () => import("../pages/profile/UserPasswordChangePage")
// );
// const UserNotificationsPage = lazy(
//   () => import("../pages/profile/UserNotificationsPage")
// );
// const CompareListingsPage = lazy(
//   () => import("../pages/profile/CompareListingsPage")
// );
// const UserTransactionsPage = lazy(
//   () => import("../pages/profile/UserTransactionsPage")
// );

// // Сторінки компанії
// const CompanyDashboardPage = lazy(
//   () => import("../pages/company/CompanyDashboardPage")
// );
// const CompanySetupPage = lazy(
//   () => import("../pages/company/CompanySetupPage")
// );
// const CompanyDocumentsPage = lazy(
//   () => import("../pages/company/CompanyDocumentsPage")
// );
// const CompanyProfilePage = lazy(
//   () => import("../pages/company/CompanyProfilePage")
// );
// const CompanyEditPage = lazy(() => import("../pages/company/CompanyEditPage"));

// // Сторінки чату
// const ChatPage = lazy(() => import("../pages/ChatPage"));
// const ChatConversationPage = lazy(
//   () => import("../pages/ChatConversationPage")
// );

// // Сторінки оплати
// const PaymentPage = lazy(() => import("../pages/PaymentPage"));
// const PaymentSuccessPage = lazy(() => import("../pages/PaymentSuccessPage"));
// const PaymentFailurePage = lazy(() => import("../pages/PaymentFailurePage"));

// // Сторінки адмін-панелі
// const AdminDashboardPage = lazy(
//   () => import("../pages/admin/AdminDashboardPage")
// );
// const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
// const AdminUserEditPage = lazy(
//   () => import("../pages/admin/AdminUserEditPage")
// );
// const AdminListingsPage = lazy(
//   () => import("../pages/admin/AdminListingsPage")
// );
// const AdminCategoriesPage = lazy(
//   () => import("../pages/admin/AdminCategoriesPage")
// );
// const AdminPaymentsPage = lazy(
//   () => import("../pages/admin/AdminPaymentsPage")
// );
// const AdminNotificationsPage = lazy(
//   () => import("../pages/admin/AdminNotificationsPage")
// );
// const AdminCampaignsPage = lazy(
//   () => import("../pages/admin/AdminCampaignsPage")
// );
// const AdminCampaignDetailsPage = lazy(
//   () => import("../pages/admin/AdminCampaignDetailsPage")
// );
// const AdminCreateCampaignPage = lazy(
//   () => import("../pages/admin/AdminCreateCampaignPage")
// );
// const AdminEditCampaignPage = lazy(
//   () => import("../pages/admin/AdminEditCampaignPage")
// );
// const AdminScheduledTasksPage = lazy(
//   () => import("../pages/admin/AdminScheduledTasksPage")
// );
// const AdminSystemHealthPage = lazy(
//   () => import("../pages/admin/AdminSystemHealthPage")
// );
// const AdminQueuesPage = lazy(() => import("../pages/admin/AdminQueuesPage"));

// // Сторінки адміністрування компаній
// const AdminCompaniesPage = lazy(
//   () => import("../pages/admin/AdminCompaniesPage")
// );
// const AdminCompanyDetailsPage = lazy(
//   () => import("../pages/admin/AdminCompanyDetailsPage")
// );
// const AdminCompanyVerificationPage = lazy(
//   () => import("../pages/admin/AdminCompanyVerificationPage")
// );
// const AdminDocumentsVerificationPage = lazy(
//   () => import("../pages/admin/AdminDocumentsVerificationPage")
// );

// const AppRoutes = () => {
//   return (
//     <Suspense fallback={<Loader />}>
//       <Routes>
//         {/* Публічні маршрути */}
//         <Route path="/" element={<HomePage />} />
//         <Route path="/catalog" element={<CatalogPage />} />
//         <Route path="/catalog/:categorySlug" element={<CatalogPage />} />
//         <Route path="/listings/:id" element={<ListingDetailsPage />} />
//         <Route path="/new" element={<NewListingsPage />} />
//         <Route path="/used" element={<UsedListingsPage />} />

//         {/* Маршрути авторизації */}
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/register" element={<RegisterPage />} />
//         <Route path="/verify/:token" element={<RegistrationConfirmPage />} />
//         <Route path="/verify-email" element={<VerifyEmailPage />} />
//         <Route
//           path="/company-verification"
//           element={<CompanyVerificationPage />}
//         />
//         <Route path="/forgot-password" element={<ForgotPasswordPage />} />
//         <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

//         {/* Захищені маршрути - лише для авторизованих користувачів */}
//         <Route
//           path="/listings/create"
//           element={
//             <ProtectedRoute>
//               <CreateListingPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="profile/listings/edit/:id"
//           element={
//             <ProtectedRoute>
//               <EditListingPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route path="/account" element={<ProfileRedirectPage />} />
//         {/* Сторінки профілю користувача */}
//         <Route
//           path="/profile"
//           element={
//             <ProtectedRoute>
//               <ProfilePage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/profile/listings"
//           element={
//             <ProtectedRoute>
//               <UserListingsPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/profile/settings"
//           element={
//             <ProtectedRoute>
//               <UserProfileSettingsPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/profile/settings/password"
//           element={
//             <ProtectedRoute>
//               <UserPasswordChangePage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/profile/notifications"
//           element={
//             <ProtectedRoute>
//               <UserNotificationsPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/profile/compare"
//           element={
//             <ProtectedRoute>
//               <CompareListingsPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/profile/transactions"
//           element={
//             <ProtectedRoute>
//               <UserTransactionsPage />
//             </ProtectedRoute>
//           }
//         />

//         {/* Сторінки компанії */}
//         <Route
//           path="/company"
//           element={
//             <ProtectedRoute>
//               <CompanyDashboardPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/company/setup"
//           element={
//             <ProtectedRoute>
//               <CompanySetupPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/company/profile"
//           element={
//             <ProtectedRoute>
//               <CompanyProfilePage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/company/edit"
//           element={
//             <ProtectedRoute>
//               <CompanyEditPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/company/documents"
//           element={
//             <ProtectedRoute>
//               <CompanyDocumentsPage />
//             </ProtectedRoute>
//           }
//         />

//         {/* Сторінки чату */}
//         <Route
//           path="/chat"
//           element={
//             <ProtectedRoute>
//               <ChatPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/chat/:userId"
//           element={
//             <ProtectedRoute>
//               <ChatConversationPage />
//             </ProtectedRoute>
//           }
//         />

//         {/* Сторінки оплати */}
//         <Route
//           path="/payment/:listingId"
//           element={
//             <ProtectedRoute>
//               <PaymentPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/payment/success/:transactionId"
//           element={
//             <ProtectedRoute>
//               <PaymentSuccessPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/payment/failure/:transactionId"
//           element={
//             <ProtectedRoute>
//               <PaymentFailurePage />
//             </ProtectedRoute>
//           }
//         />

//         {/* Адміністративні маршрути */}
//         <Route
//           path="/admin"
//           element={
//             <AdminRoute>
//               <AdminDashboardPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/users"
//           element={
//             <AdminRoute>
//               <AdminUsersPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/users/:id"
//           element={
//             <AdminRoute>
//               <AdminUserEditPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/listings"
//           element={
//             <AdminRoute>
//               <AdminListingsPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/categories"
//           element={
//             <AdminRoute>
//               <AdminCategoriesPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/payments"
//           element={
//             <AdminRoute>
//               <AdminPaymentsPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/notifications"
//           element={
//             <AdminRoute>
//               <AdminNotificationsPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/campaigns"
//           element={
//             <AdminRoute>
//               <AdminCampaignsPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/campaigns/create"
//           element={
//             <AdminRoute>
//               <AdminCreateCampaignPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/campaigns/:id"
//           element={
//             <AdminRoute>
//               <AdminCampaignDetailsPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/campaigns/:id/edit"
//           element={
//             <AdminRoute>
//               <AdminEditCampaignPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/scheduled-tasks"
//           element={
//             <AdminRoute>
//               <AdminScheduledTasksPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/system-health"
//           element={
//             <AdminRoute>
//               <AdminSystemHealthPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/queues"
//           element={
//             <AdminRoute>
//               <AdminQueuesPage />
//             </AdminRoute>
//           }
//         />

//         {/* Маршрути адміністрування компаній */}
//         <Route
//           path="/admin/companies"
//           element={
//             <AdminRoute>
//               <AdminCompaniesPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/companies/:id"
//           element={
//             <AdminRoute>
//               <AdminCompanyDetailsPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/companies/verification"
//           element={
//             <AdminRoute>
//               <AdminCompanyVerificationPage />
//             </AdminRoute>
//           }
//         />
//         <Route
//           path="/admin/documents/verification"
//           element={
//             <AdminRoute>
//               <AdminDocumentsVerificationPage />
//             </AdminRoute>
//           }
//         />

//         {/* Сторінка 404 */}
//         <Route path="*" element={<NotFoundPage />} />
//       </Routes>
//     </Suspense>
//   );
// };

// export default AppRoutes;
