import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12">
      <div className="container mx-auto px-4 py-8">
        {/* Основна частина футера */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Інформація про компанію */}
          <div>
            <div className="flex items-center mb-4">
              <svg viewBox="0 0 200 50" className="h-8 w-32">
                <path
                  d="M10 10 L40 10 M25 10 L25 40"
                  stroke="#059669"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <circle
                  cx="65"
                  cy="25"
                  r="15"
                  stroke="#059669"
                  strokeWidth="8"
                  fill="none"
                />
                <text
                  x="95"
                  y="35"
                  fontFamily="Arial"
                  fontWeight="bold"
                  fontSize="30"
                  fill="#1F2937"
                >
                  AGRO
                </text>
                <path
                  d="M160 15 Q170 5, 180 15 Q170 25, 160 15"
                  fill="#059669"
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">
              Ваш надійний партнер у світі агротехніки. Купівля, продаж та обмін
              сільськогосподарської техніки та запчастин.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-600"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-600"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-600"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Навігація по сайту */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Навігація
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-green-600">
                  Головна
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog"
                  className="text-gray-600 hover:text-green-600"
                >
                  Каталог
                </Link>
              </li>
              <li>
                <Link
                  to="/listings/create"
                  className="text-gray-600 hover:text-green-600"
                >
                  Додати оголошення
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-600 hover:text-green-600"
                >
                  Про нас
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-gray-600 hover:text-green-600">
                  Допомога
                </Link>
              </li>
            </ul>
          </div>

          {/* Категорії */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Категорії
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/catalog?category=tractors"
                  className="text-gray-600 hover:text-green-600"
                >
                  Трактори
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?category=harvesters"
                  className="text-gray-600 hover:text-green-600"
                >
                  Комбайни
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?category=seeders"
                  className="text-gray-600 hover:text-green-600"
                >
                  Посівна техніка
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?category=tillage"
                  className="text-gray-600 hover:text-green-600"
                >
                  Ґрунтообробна техніка
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?category=parts"
                  className="text-gray-600 hover:text-green-600"
                >
                  Запчастини
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакти */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Контакти
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Phone size={18} className="text-green-600 mr-2" />
                <a
                  href="tel:+380501234567"
                  className="text-gray-600 hover:text-green-600"
                >
                  +38 (050) 123-45-67
                </a>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="text-green-600 mr-2" />
                <a
                  href="mailto:info@toagro.com.ua"
                  className="text-gray-600 hover:text-green-600"
                >
                  info@toagro.com.ua
                </a>
              </li>
              <li className="flex items-start">
                <MapPin size={18} className="text-green-600 mr-2 mt-1" />
                <span className="text-gray-600">
                  м. Київ, вул. Хрещатик, 1, офіс 123
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Нижня частина футера */}
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row md:justify-between items-center">
          <div className="text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {currentYear} ToAgro. Всі права захищено
          </div>
          <div className="flex space-x-4 text-sm">
            <Link to="/terms" className="text-gray-500 hover:text-green-600">
              Умови використання
            </Link>
            <Link to="/privacy" className="text-gray-500 hover:text-green-600">
              Політика конфіденційності
            </Link>
            <Link to="/cookies" className="text-gray-500 hover:text-green-600">
              Політика cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
