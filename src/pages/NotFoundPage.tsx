import { Link } from "react-router-dom";
import { Home } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
      <h1 className="text-9xl font-bold text-green-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Сторінку не знайдено
      </h2>
      <p className="text-gray-600 mb-8 max-w-lg">
        Сторінку, яку ви шукаєте, не існує або було переміщено. Перевірте
        правильність URL-адреси або перейдіть на головну сторінку.
      </p>

      <div className="flex space-x-4">
        <Link
          to="/"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <Home size={18} className="mr-2" />
          На головну
        </Link>
        <Link
          to="/catalog"
          className="border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors"
        >
          До каталогу
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
