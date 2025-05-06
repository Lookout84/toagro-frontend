import React, { useState } from "react";
import { Link } from "react-router-dom";
import { User as UserType } from "../../types/api";
import { User, Edit2, Mail, Phone, Calendar, CheckCircle, XCircle } from "lucide-react";

interface UserProfileProps {
  user: UserType;
  isEditable?: boolean;
  isCompact?: boolean;
  onEdit?: () => void;
}

/**
 * Компонент для відображення профілю користувача
 * Може бути використаний у різних частинах додатку
 */
const UserProfile: React.FC<UserProfileProps> = ({
  user,
  isEditable = false,
  isCompact = false,
  onEdit
}) => {
  // Форматування дати реєстрації
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // Розширене відображення
  if (!isCompact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start">
            {/* Аватар користувача */}
            <div className="md:mr-6 mb-4 md:mb-0 flex-shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={48} className="text-gray-500" />
                </div>
              )}
            </div>

            {/* Інформація про користувача */}
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  <div className="flex items-center mt-1">
                    {user.isVerified ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircle size={16} className="mr-1" />
                        <span>Підтверджений користувач</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600 text-sm">
                        <XCircle size={16} className="mr-1" />
                        <span>Непідтверджений користувач</span>
                      </div>
                    )}
                  </div>
                </div>

                {isEditable && onEdit && (
                  <button
                    onClick={onEdit}
                    className="mt-2 md:mt-0 bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-md flex items-center transition-colors"
                  >
                    <Edit2 size={18} className="mr-1" />
                    <span>Редагувати профіль</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Mail size={18} className="text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="text-gray-900">{user.email}</div>
                  </div>
                </div>

                {user.phoneNumber && (
                  <div className="flex items-center">
                    <Phone size={18} className="text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Телефон</div>
                      <div className="text-gray-900">{user.phoneNumber}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <Calendar size={18} className="text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Дата реєстрації</div>
                    <div className="text-gray-900">{formatDate(user.createdAt)}</div>
                  </div>
                </div>

                {user.role === "admin" && (
                  <div className="flex items-center">
                    <User size={18} className="text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Роль</div>
                      <div className="text-gray-900">Адміністратор</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Компактне відображення
  return (
    <div className="flex items-center">
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover mr-3"
        />
      ) : (
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
          <User size={24} className="text-gray-500" />
        </div>
      )}

      <div>
        <div className="flex items-center">
          <h3 className="font-medium text-gray-900">{user.name}</h3>
          {user.isVerified && (
            <CheckCircle size={14} className="ml-1 text-green-600" />
          )}
        </div>
        <div className="text-sm text-gray-500">{user.email}</div>
      </div>

      {isEditable && onEdit && (
        <button
          onClick={onEdit}
          className="ml-auto text-gray-400 hover:text-green-600"
          aria-label="Редагувати профіль"
        >
          <Edit2 size={18} />
        </button>
      )}
    </div>
  );
};

export default UserProfile;