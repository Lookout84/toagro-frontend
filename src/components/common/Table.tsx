import React, { ReactNode } from "react";
import classNames from "classnames";

// Типи пропсів для основного компонента Table
interface TableProps {
  children: ReactNode;
  className?: string;
  striped?: boolean;
  bordered?: boolean;
  compact?: boolean;
}

// Типи пропсів для рядка таблиці
interface TableRowProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  active?: boolean;
}

// Типи пропсів для комірки таблиці
interface TableCellProps {
  children: ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}

// Типи пропсів для комірки заголовка таблиці
interface TableHeaderCellProps extends TableCellProps {
  sortable?: boolean;
  sorted?: "asc" | "desc" | null;
  onSort?: () => void;
}

// Основний компонент таблиці
const Table: React.FC<TableProps> & {
  Head: React.FC<{ children: ReactNode; className?: string }>;
  Body: React.FC<{ children: ReactNode; className?: string }>;
  Row: React.FC<TableRowProps>;
  Cell: React.FC<TableCellProps>;
  HeaderCell: React.FC<TableHeaderCellProps>;
} = ({ children, className, striped = false, bordered = false, compact = false }) => {
  const tableClasses = classNames(
    "min-w-full divide-y divide-gray-200 bg-white",
    {
      "border border-gray-200": bordered,
    },
    className
  );

  return (
    <table className={tableClasses}>
      {children}
    </table>
  );
};

// Компонент для групи заголовків таблиці
const TableHead: React.FC<{ children: ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  const headClasses = classNames(
    "bg-gray-50",
    className
  );

  return (
    <thead className={headClasses}>
      {children}
    </thead>
  );
};

// Компонент для тіла таблиці
const TableBody: React.FC<{ children: ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  const bodyClasses = classNames(
    "bg-white divide-y divide-gray-200",
    className
  );

  return (
    <tbody className={bodyClasses}>
      {children}
    </tbody>
  );
};

// Компонент для рядка таблиці
const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className, 
  hover = false,
  active = false
}) => {
  const rowClasses = classNames(
    {
      "hover:bg-gray-50": hover,
      "bg-gray-50": active,
    },
    className
  );

  return (
    <tr className={rowClasses}>
      {children}
    </tr>
  );
};

// Компонент для комірки таблиці
const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  className, 
  colSpan, 
  rowSpan 
}) => {
  const cellClasses = classNames(
    "px-6 py-4 whitespace-nowrap",
    className
  );

  return (
    <td className={cellClasses} colSpan={colSpan} rowSpan={rowSpan}>
      {children}
    </td>
  );
};

// Компонент для комірки заголовка таблиці
const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ 
  children, 
  className, 
  colSpan, 
  rowSpan,
  sortable = false,
  sorted = null,
  onSort
}) => {
  const headerCellClasses = classNames(
    "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
    {
      "cursor-pointer select-none": sortable,
    },
    className
  );

  return (
    <th 
      className={headerCellClasses} 
      colSpan={colSpan} 
      rowSpan={rowSpan}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center">
        <span>{children}</span>
        {sortable && (
          <span className="ml-2">
            {sorted === "asc" && (
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {sorted === "desc" && (
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {sorted === null && (
              <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </span>
        )}
      </div>
    </th>
  );
};

// Призначення підкомпонентів
Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Cell = TableCell;
Table.HeaderCell = TableHeaderCell;

export default Table;