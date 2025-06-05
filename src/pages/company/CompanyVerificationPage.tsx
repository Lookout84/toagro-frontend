import React from 'react';
import { Link } from 'react-router-dom';
import { Building, FileCheck, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/common';

const CompanyVerificationPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 p-6">
          <h2 className="text-2xl font-bold text-white text-center">
            Реєстрація компанії
          </h2>
        </div>

        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-3">
              <Building className="h-12 w-12 text-green-600" />
            </div>
          </div>
          
          <h3 className="text-xl font-medium text-gray-900 text-center mb-6">
            Дякуємо за реєстрацію вашої компанії!
          </h3>
          
          <div className="bg-gray-50 p-5 rounded-lg mb-6">
            <h4 className="flex items-center text-gray-900 font-medium mb-3">
              <ShieldCheck className="mr-2 text-green-600" size={20} />
              Наступні кроки
            </h4>
            
            <ol className="list-decimal pl-6 space-y-3 text-gray-700">
              <li>
                <span className="font-medium">Підтвердіть вашу електронну пошту</span> - ми надіслали лист з посиланням для підтвердження на вказану адресу
              </li>
              <li>
                <span className="font-medium">Завантажте документи</span> - для повної верифікації компанії потрібно надати підтверджуючі документи
              </li>
              <li>
                <span className="font-medium">Очікуйте підтвердження</span> - наші спеціалісти перевірять надану інформацію
              </li>
            </ol>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start mb-6">
            <AlertTriangle className="text-amber-500 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">Важлива інформація</h4>
              <p className="text-amber-700 text-sm">
                Доступ до всіх функцій платформи для компаній буде відкрито після перевірки та верифікації вашої компанії. Цей процес зазвичай займає 1-2 робочих дні.
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <FileCheck className="text-green-600 mr-2" size={20} />
            <span className="text-gray-700">Вам потрібно завантажити документи для перевірки</span>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
            <Link to="/account/company/documents">
              <Button variant="primary">
                Завантажити документи
              </Button>
            </Link>
            
            <Link to="/account/dashboard">
              <Button variant="outline">
                Перейти до особистого кабінету
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyVerificationPage;