import { XCircleIcon } from '@heroicons/react/24/solid';
import { ReactNode } from 'react';

interface ErrorAlertProps {
  message: ReactNode;
  className?: string;
}

const ErrorAlert = ({ message, className = '' }: ErrorAlertProps) => {
  return (
    <div
      role="alert"
      className={`p-4 rounded-md bg-red-50 border border-red-200 ${className}`}
    >
      <div className="flex items-center">
        <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
        <div className="text-sm text-red-700">{message}</div>
      </div>
    </div>
  );
};

export default ErrorAlert;