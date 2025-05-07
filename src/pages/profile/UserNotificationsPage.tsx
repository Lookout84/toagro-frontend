import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  fetchNotificationSettings,
  updateNotificationSettings,
  fetchNotificationPreferences,
  updateNotificationPreferences
} from "../../store/notificationsSlice";
import { Bell, CheckCircle, Trash2, Settings } from "lucide-react";
import Loader from "../../components/common/Loader";
import { NotificationSettings, NotificationPreferences } from "../../types/api";

const UserNotificationsPage = () => {
  const dispatch = useAppDispatch();
  const { notifications, settings, preferences, meta, isLoading, error } = useAppSelector(
    (state) => state.notifications
  );
  
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);

  // Завантаження сповіщень, налаштувань та уподобань при першому рендері
  useEffect(() => {
    dispatch(fetchNotifications({ page: 1 }));
    dispatch(fetchNotificationSettings());
    dispatch(fetchNotificationPreferences());
  }, [dispatch]);

  // Оновлення локального стану при зміні даних у Redux
  useEffect(() => {
    if (settings) {
      setNotificationSettings(settings);
    }
    if (preferences) {
      setNotificationPreferences(preferences);
    }
  }, [settings, preferences]);

  // Обробник позначення всіх сповіщень як прочитаних
  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  // Обробник позначення одного сповіщення як прочитаного
  const handleMarkAsRead = (id: number) => {
    dispatch(markNotificationAsRead(id));
  };

  // Обробник видалення сповіщення
  const handleDeleteNotification = (id: number) => {
    dispatch(deleteNotification(id));
  };

  // Обробник зміни налаштувань сповіщень
  const handleSettingsChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: keyof NotificationSettings
  ) => {
    if (notificationSettings) {
      setNotificationSettings({
        ...notificationSettings,
        [type]: e.target.checked,
      });
    }
  };

  // Обробник зміни уподобань сповіщень
  const handlePreferencesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: keyof NotificationPreferences
  ) => {
    if (notificationPreferences) {
      setNotificationPreferences({
        ...notificationPreferences,
        [type]: e.target.checked,
      });
    }
  };

  // Обробник збереження налаштувань
  const handleSaveSettings = () => {
    if (notificationSettings) {
      dispatch(updateNotificationSettings(notificationSettings));
    }
    if (notificationPreferences) {
      dispatch(updateNotificationPreferences(notificationPreferences));
    }
    setShowSettings(false);
  };

  // Форматування дати
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uk-UA', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading && !notifications.length) {
    return <Loader />;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Сповіщення</h2>
          
          <div className="flex space-x-3">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center text-gray-600 hover:text-green-600"
              disabled={notifications.every((n) => n.isRead)}
            >
              <CheckCircle size={18} className="mr-1" />
              <span>Позначити всі як прочитані</span>
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center text-gray-600 hover:text-green-600"
            >
              <Settings size={18} className="mr-1" />
              <span>Налаштування</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {/* Налаштування сповіщень */}
        {showSettings && notificationSettings && notificationPreferences && (
          <div className="bg-gray-50 p-6 mb-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Налаштування сповіщень</h3>
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-2">Канали сповіщень</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="email-notifications"
                    checked={notificationSettings.email}
                    onChange={(e) => handleSettingsChange(e, "email")}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 rounded"
                  />
                  <label htmlFor="email-notifications" className="ml-2 text-gray-700">
                    Сповіщення електронною поштою
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sms-notifications"
                    checked={notificationSettings.sms}
                    onChange={(e) => handleSettingsChange(e, "sms")}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 rounded"
                  />
                  <label htmlFor="sms-notifications" className="ml-2 text-gray-700">
                    SMS сповіщення
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="push-notifications"
                    checked={notificationSettings.push}
                    onChange={(e) => handleSettingsChange(e, "push")}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 rounded"
                  />
                  <label htmlFor="push-notifications" className="ml-2 text-gray-700">
                    Push-сповіщення
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="inapp-notifications"
                    checked={notificationSettings.inApp}
                    onChange={(e) => handleSettingsChange(e, "inApp")}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 rounded"
                  />
                  <label htmlFor="inapp-notifications" className="ml-2 text-gray-700">
                    Сповіщення у додатку
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Типи сповіщень</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="listingMessages"
                    checked={notificationPreferences.listingMessages}
                    onChange={(e) => handlePreferencesChange(e, "listingMessages")}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 rounded"
                  />
                  <label htmlFor="listingMessages" className="ml-2 text-gray-700">
                    Повідомлення щодо оголошень
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="listingUpdates"
                    checked={notificationPreferences.listingUpdates}
                    onChange={(e) => handlePreferencesChange(e, "listingUpdates")}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 rounded"
                  />
                  <label htmlFor="listingUpdates" className="ml-2 text-gray-700">
                    Оновлення оголошень
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="promotions"
                    checked={notificationPreferences.promotions}
                    onChange={(e) => handlePreferencesChange(e, "promotions")}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 rounded"
                  />
                  <label htmlFor="promotions" className="ml-2 text-gray-700">
                    Промоції та акції
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="systemAnnouncements"
                    checked={notificationPreferences.systemAnnouncements}
                    onChange={(e) => handlePreferencesChange(e, "systemAnnouncements")}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 rounded"
                  />
                  <label htmlFor="systemAnnouncements" className="ml-2 text-gray-700">
                    Системні оголошення
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="accountActivity"
                    checked={notificationPreferences.accountActivity}
                    onChange={(e) => handlePreferencesChange(e, "accountActivity")}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 rounded"
                  />
                  <label htmlFor="accountActivity" className="ml-2 text-gray-700">
                    Активність облікового запису
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Зберегти налаштування
              </button>
            </div>
          </div>
        )}

        {/* Список сповіщень */}
        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg ${
                  notification.isRead ? "bg-white border-gray-200" : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex justify-between">
                  <div className="flex items-start">
                    <Bell
                      size={20}
                      className={`mr-3 mt-1 ${notification.isRead ? "text-gray-400" : "text-green-500"}`}
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      <p className="text-gray-600 mt-1">{notification.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex ml-4">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-gray-400 hover:text-green-600 mr-2"
                        title="Позначити як прочитане"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Видалити сповіщення"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">У вас немає сповіщень</p>
          </div>
        )}

        {/* Пагінація */}
        {meta.pages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => dispatch(fetchNotifications({ page: meta.page - 1 }))}
                disabled={meta.page === 1}
                className={`w-10 h-10 rounded-md flex items-center justify-center ${
                  meta.page === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="sr-only">Попередня сторінка</span>
                &larr;
              </button>
              
              {/* Номери сторінок */}
              {Array.from({ length: meta.pages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === meta.pages ||
                    Math.abs(page - meta.page) <= 1
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => dispatch(fetchNotifications({ page }))}
                      className={`w-10 h-10 rounded-md flex items-center justify-center ${
                        page === meta.page
                          ? "bg-green-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
              
              <button
                onClick={() => dispatch(fetchNotifications({ page: meta.page + 1 }))}
                disabled={meta.page === meta.pages}
                className={`w-10 h-10 rounded-md flex items-center justify-center ${
                  meta.page === meta.pages
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="sr-only">Наступна сторінка</span>
                &rarr;
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserNotificationsPage;