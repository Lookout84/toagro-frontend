import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  visiblePages?: number;
  className?: string;
}

/**
 * Компонент для відображення пагінації
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  visiblePages = 5,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  // Функція для створення списку відображуваних сторінок
  const getPageNumbers = (): (number | string)[] => {
    const pageNumbers: (number | string)[] = [];
    
    // Кількість сторінок до і після поточної
    const sidePages = Math.floor(visiblePages / 2);
    
    let startPage = Math.max(1, currentPage - sidePages);
    let endPage = Math.min(totalPages, currentPage + sidePages);
    
    // Коригування, якщо недостатньо сторінок з одного боку
    if (currentPage - sidePages < 1) {
      endPage = Math.min(totalPages, endPage + (1 - (currentPage - sidePages)));
    }
    
    if (currentPage + sidePages > totalPages) {
      startPage = Math.max(1, startPage - ((currentPage + sidePages) - totalPages));
    }
    
    // Додавання першої сторінки та "..."
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push("...");
      }
    }
    
    // Додавання діапазону сторінок
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // Додавання "..." та останньої сторінки
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push("...");
      }
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <nav className={`flex justify-center ${className}`} aria-label="Pagination">
      <ul className="flex items-center -space-x-px">
        {/* Кнопка для переходу на попередню сторінку */}
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`w-10 h-10 flex items-center justify-center rounded-l-md ${
              currentPage === 1
                ? "text-gray-400 cursor-not-allowed bg-gray-100"
                : "text-gray-700 hover:bg-gray-100"
            } border border-gray-300`}
            aria-label="Попередня сторінка"
          >
            <ChevronLeft size={16} />
          </button>
        </li>
        
        {/* Кнопки для переходу на конкретні сторінки */}
        {pageNumbers.map((pageNumber, index) => (
          <li key={index}>
            {typeof pageNumber === "number" ? (
              <button
                onClick={() => onPageChange(pageNumber)}
                className={`w-10 h-10 flex items-center justify-center ${
                  pageNumber === currentPage
                    ? "z-10 bg-green-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                } border border-gray-300`}
                aria-current={pageNumber === currentPage ? "page" : undefined}
              >
                {pageNumber}
              </button>
            ) : (
              <span className="w-10 h-10 flex items-center justify-center text-gray-500 border border-gray-300">
                {pageNumber}
              </span>
            )}
          </li>
        ))}
        
        {/* Кнопка для переходу на наступну сторінку */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`w-10 h-10 flex items-center justify-center rounded-r-md ${
              currentPage === totalPages
                ? "text-gray-400 cursor-not-allowed bg-gray-100"
                : "text-gray-700 hover:bg-gray-100"
            } border border-gray-300`}
            aria-label="Наступна сторінка"
          >
            <ChevronRight size={16} />
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;