import React from 'react';
import { useParams } from 'react-router-dom';

const PaymentSuccessPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  
  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Payment Successful!</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Thank you for your payment. Your transaction was successful.
          </p>
          <p className="text-gray-600 mb-4">
            Transaction ID: <span className="font-semibold">{transactionId}</span>
          </p>
          <p className="text-gray-600">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col sm:flex-row justify-between">
            <button 
              onClick={() => window.location.href = '/profile/transactions'}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded mb-3 sm:mb-0"
            >
              View Transactions
            </button>
            <button 
              onClick={() => window.location.href = '/catalog'}
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;