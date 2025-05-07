import React from 'react';

const PaymentFailurePage: React.FC = () => {
  return (
    <div className="payment-failure-container">
      <h1>Payment Failed</h1>
      <p>Unfortunately, your payment could not be processed.</p>
      <p>Please try again or contact customer support if the problem persists.</p>
    </div>
  );
};

export default PaymentFailurePage;