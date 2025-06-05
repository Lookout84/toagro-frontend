import React from "react";

export interface LoaderProps {
  fullScreen?: boolean;
  size?: "small" | "medium" | "large";
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({
  fullScreen = false,
  size = "medium",
  text = "Завантаження...",
}) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-10 w-10",
    large: "h-16 w-16",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50"
    : "flex flex-col items-center justify-center py-8";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center">
        <div
          className={`animate-spin rounded-full border-4 border-gray-200 border-t-green-600 ${sizeClasses[size]}`}
        ></div>
        {text && <p className="mt-4 text-gray-600">{text}</p>}
      </div>
    </div>
  );
};

export default Loader;
