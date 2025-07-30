import React from 'react';

interface AutoFilledFieldProps {
  children: React.ReactNode;
  isAutoFilled: boolean;
}

const AutoFilledField: React.FC<AutoFilledFieldProps> = ({
  children,
  isAutoFilled
}) => {
  return (
    <div className="relative">
      {children}
      {isAutoFilled && (
        <div className="mt-1 flex items-center text-xs text-blue-600">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Заповнено автоматично на основі геолокації</span>
        </div>
      )}
    </div>
  );
};

export default AutoFilledField;
