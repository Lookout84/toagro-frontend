import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSize?: number;
  totalItems?: number;
  visiblePages?: number;
  className?: string;
}

/**
 * Компонент для відображення пагінації з можливістю вибору кількості елементів на сторінці
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSize = 10,
  totalItems = 0,
  visiblePages = 5,
  className = "",
}) => {
  if (totalPages <= 1 && totalItems <= pageSize) return null;

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
      startPage = Math.max(
        1,
        startPage - (currentPage + sidePages - totalPages)
      );
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

  // Опції для вибору кількості елементів на сторінці
  const pageSizeOptions = [10, 20, 50, 100];

  // Розрахунок діапазону відображуваних елементів
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems || 0);

  return (
    <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 ${className}`}>
      {/* Інформація про кількість відображуваних елементів */}
      {totalItems > 0 && (
        <div className="text-sm text-gray-700">
          Показано <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> з{" "}
          <span className="font-medium">{totalItems}</span> елементів
        </div>
      )}

      {/* Контейнер для пагінації і вибору кількості елементів */}
      <div className="flex items-center gap-4">
        {/* Пагінація */}
        <nav className="flex justify-center" aria-label="Pagination">
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

        {/* Вибір кількості елементів на сторінці */}
        {onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <label htmlFor="page-size" className="text-sm text-gray-700">
              Показувати:
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;

// import React from "react";
// import { ChevronLeft, ChevronRight } from "lucide-react";

// interface PaginationProps {
//   currentPage: number;
//   totalPages: number;
//   onPageChange: (page: number) => void;
//   onPageSizeChange?: (size: number) => void;
//   pageSize?: number;
//   totalItems?: number;
//   visiblePages?: number;
//   className?: string;
// }

// /**
//  * Компонент для відображення пагінації
//  */
// const Pagination: React.FC<PaginationProps> = ({
//   currentPage,
//   totalPages,
//   onPageChange,
//   visiblePages = 5,
//   className = "",
// }) => {
//   if (totalPages <= 1) return null;

//   // Функція для створення списку відображуваних сторінок
//   const getPageNumbers = (): (number | string)[] => {
//     const pageNumbers: (number | string)[] = [];

//     // Кількість сторінок до і після поточної
//     const sidePages = Math.floor(visiblePages / 2);

//     let startPage = Math.max(1, currentPage - sidePages);
//     let endPage = Math.min(totalPages, currentPage + sidePages);

//     // Коригування, якщо недостатньо сторінок з одного боку
//     if (currentPage - sidePages < 1) {
//       endPage = Math.min(totalPages, endPage + (1 - (currentPage - sidePages)));
//     }

//     if (currentPage + sidePages > totalPages) {
//       startPage = Math.max(
//         1,
//         startPage - (currentPage + sidePages - totalPages)
//       );
//     }

//     // Додавання першої сторінки та "..."
//     if (startPage > 1) {
//       pageNumbers.push(1);
//       if (startPage > 2) {
//         pageNumbers.push("...");
//       }
//     }

//     // Додавання діапазону сторінок
//     for (let i = startPage; i <= endPage; i++) {
//       pageNumbers.push(i);
//     }

//     // Додавання "..." та останньої сторінки
//     if (endPage < totalPages) {
//       if (endPage < totalPages - 1) {
//         pageNumbers.push("...");
//       }
//       pageNumbers.push(totalPages);
//     }

//     return pageNumbers;
//   };

//   const pageNumbers = getPageNumbers();

//   return (
//     <nav className={`flex justify-center ${className}`} aria-label="Pagination">
//       <ul className="flex items-center -space-x-px">
//         {/* Кнопка для переходу на попередню сторінку */}
//         <li>
//           <button
//             onClick={() => onPageChange(currentPage - 1)}
//             disabled={currentPage === 1}
//             className={`w-10 h-10 flex items-center justify-center rounded-l-md ${
//               currentPage === 1
//                 ? "text-gray-400 cursor-not-allowed bg-gray-100"
//                 : "text-gray-700 hover:bg-gray-100"
//             } border border-gray-300`}
//             aria-label="Попередня сторінка"
//           >
//             <ChevronLeft size={16} />
//           </button>
//         </li>

//         {/* Кнопки для переходу на конкретні сторінки */}
//         {pageNumbers.map((pageNumber, index) => (
//           <li key={index}>
//             {typeof pageNumber === "number" ? (
//               <button
//                 onClick={() => onPageChange(pageNumber)}
//                 className={`w-10 h-10 flex items-center justify-center ${
//                   pageNumber === currentPage
//                     ? "z-10 bg-green-600 text-white"
//                     : "text-gray-700 hover:bg-gray-100"
//                 } border border-gray-300`}
//                 aria-current={pageNumber === currentPage ? "page" : undefined}
//               >
//                 {pageNumber}
//               </button>
//             ) : (
//               <span className="w-10 h-10 flex items-center justify-center text-gray-500 border border-gray-300">
//                 {pageNumber}
//               </span>
//             )}
//           </li>
//         ))}

//         {/* Кнопка для переходу на наступну сторінку */}
//         <li>
//           <button
//             onClick={() => onPageChange(currentPage + 1)}
//             disabled={currentPage === totalPages}
//             className={`w-10 h-10 flex items-center justify-center rounded-r-md ${
//               currentPage === totalPages
//                 ? "text-gray-400 cursor-not-allowed bg-gray-100"
//                 : "text-gray-700 hover:bg-gray-100"
//             } border border-gray-300`}
//             aria-label="Наступна сторінка"
//           >
//             <ChevronRight size={16} />
//           </button>
//         </li>
//       </ul>
//     </nav>
//   );
// };

// export default Pagination;
