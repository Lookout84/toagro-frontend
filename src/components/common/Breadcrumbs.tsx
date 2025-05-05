import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path?: string | undefined;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  homeIcon?: React.ReactNode;
  className?: string;
}

/**
 * Компонент для відображення "хлібних крихт"
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator = <ChevronRight size={16} className="mx-2 text-gray-400" />,
  homeIcon,
  className = "",
}) => {
  const location = useLocation();

  // Якщо items не передано, генеруємо з поточного шляху
  const breadcrumbItems =
    items || generateBreadcrumbsFromPath(location.pathname);

  return (
    <nav className={`flex items-center text-sm ${className}`}>
      <Link
        to="/"
        className="text-gray-500 hover:text-green-600 flex items-center"
      >
        {homeIcon || "Головна"}
      </Link>

      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {separator}
          {item.path ? (
            <Link to={item.path} className="text-gray-500 hover:text-green-600">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-700">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

/**
 * Генерує елементи "хлібних крихт" з шляху URL
 */
function generateBreadcrumbsFromPath(path: string): BreadcrumbItem[] {
  if (path === "/") return [];

  // Розбиваємо шлях на сегменти
  const segments = path.split("/").filter(Boolean);

  // Мапуємо шляхи для хлібних крихт
  return segments.map((segment, index) => {
    const isLastSegment = index === segments.length - 1;

    // Форматуємо мітку (перша літера велика, заміна дефісів на пробіли)
    const label = segment
      .replace(/-/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase());

    // Для останнього сегмента не додаємо шлях (немає посилання)
    return {
      label,
      path: isLastSegment
        ? undefined
        : `/${segments.slice(0, index + 1).join("/")}`,
    };
  });
}

export default Breadcrumbs;
