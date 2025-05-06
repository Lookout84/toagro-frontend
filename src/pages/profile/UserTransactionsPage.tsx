import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchTransactions } from "../../store/transactionsSlice";
import { Link } from "react-router-dom";
import { CreditCard, FileText, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Loader from "../../components/common/Loader";
import { Transaction } from "../../types/api";

const UserTransactionsPage = () => {
  const dispatch = useAppDispatch();
  const { transactions, meta, isLoading, error } = useAppSelector(
    (state) => state.transactions
  );
  
  const [expandedTransactions, setExpandedTransactions] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Завантаження транзакцій при першому рендері
  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  // Обробник для розгортання/згортання деталей транзакції
  const toggleTransaction = (id: number) => {
    if (expandedTransactions.includes(id)) {
      setExpandedTransactions(expandedTransactions.filter((txId) => txId !== id));
    } else {
      setExpandedTransactions([...expandedTransactions, id]);
    }
  };

  // Обробник зміни фільтра статусу
  const handleStatusFilterChange = (status: string | null) => {
    setFilterStatus(status);
    dispatch(fetchTransactions({ status }));
  };

  // Форматування дати
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uk-UA', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Форматування суми
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Отримання класу стилю для статусу транзакції
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Переклад статусу транзакції
  const translateStatus = (status: string) => {
    switch (status) {
      case 'success':
        return 'Успішно';
      case 'pending':
        return 'В обробці';
      case 'failed':
        return 'Невдало';
      case 'canceled':
        return 'Скасовано';
      default:
        return status;
    }
  };

  // Фільтрація транзакцій за статусом
  const filteredTransactions = filterStatus
    ? transactions.filter((transaction) => transaction.status === filterStatus)
    : transactions;

  if (isLoading && !transactions.length) {
    return <Loader />;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Історія платежів</h2>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusFilterChange(null)}
              className={`px-3 py-1 rounded-md text-sm ${
                filterStatus === null
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Усі
            </button>
            <button
              onClick={() => handleStatusFilterChange('success')}
              className={`px-3 py-1 rounded-md text-sm ${
                filterStatus === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Успішні
            </button>
            <button
              onClick={() => handleStatusFilterChange('pending')}
              className={`px-3 py-1 rounded-md text-sm ${
                filterStatus === 'pending'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              В обробці
            </button>
            <button
              onClick={() => handleStatusFilterChange('failed')}
              className={`px-3 py-1 rounded-md text-sm ${
                filterStatus === 'failed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Невдалі
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {/* Список транзакцій */}
        {filteredTransactions.length > 0 ? (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Заголовок транзакції */}
                <div
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
                  onClick={() => toggleTransaction(Number(transaction.id))}
                >
                  <div className="flex items-center">
                    <CreditCard className="text-gray-500 mr-3" size={20} />
                    <div>
                      <div className="font-medium text-gray-900">
                        {transaction.description || `Платіж #${transaction.id}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-3 ${getStatusClass(
                        transaction.status
                      )}`}
                    >
                      {translateStatus(transaction.status)}
                    </span>
                    <div className="text-lg font-semibold">
                      {formatAmount(transaction.amount)}
                    </div>
                    {expandedTransactions.includes(Number(transaction.id)) ? (
                      <ChevronUp className="ml-2 text-gray-500" size={20} />
                    ) : (
                      <ChevronDown className="ml-2 text-gray-500" size={20} />
                    )}
                  </div>
                </div>

                {/* Розгорнуті деталі транзакції */}
                {expandedTransactions.includes(Number(transaction.id)) && (
                  <div className="p-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Ідентифікатор транзакції
                        </h4>
                        <p className="text-gray-800">{transaction.id}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Спосіб оплати
                        </h4>
                        <p className="text-gray-800">{transaction.paymentMethod}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Дата створення
                        </h4>
                        <p className="text-gray-800">{formatDate(transaction.createdAt)}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Дата оновлення
                        </h4>
                        <p className="text-gray-800">{formatDate(transaction.updatedAt)}</p>
                      </div>
                      
                      {transaction.listingId && (
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-medium text-gray-500 mb-1">
                            Пов'язане оголошення
                          </h4>
                          <Link
                            to={`/listings/${transaction.listingId}`}
                            className="text-green-600 hover:text-green-700 flex items-center"
                          >
                            Переглянути оголошення
                            <ExternalLink size={14} className="ml-1" />
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Link
                        to={`/payment/${transaction.id}`}
                        className="flex items-center text-gray-600 hover:text-green-600"
                      >
                        <FileText size={16} className="mr-1" />
                        Детальна інформація
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">У вас немає платежів</p>
          </div>
        )}

        {/* Пагінація */}
        {meta.pages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => dispatch(fetchTransactions({ page: meta.page - 1 }))}
                disabled={meta.page === 1}
                className={`w-10 h-10 rounded-md flex items-center justify-center ${
                  meta.page === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="sr-only">Попередня сторінка</span>
                &larr;
              </button>
              
              {/* Номери сторінок */}
              {Array.from({ length: meta.pages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === meta.pages ||
                    Math.abs(page - meta.page) <= 1
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => dispatch(fetchTransactions({ page }))}
                      className={`w-10 h-10 rounded-md flex items-center justify-center ${
                        page === meta.page
                          ? "bg-green-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
              
              <button
                onClick={() => dispatch(fetchTransactions({ page: meta.page + 1 }))}
                disabled={meta.page === meta.pages}
                className={`w-10 h-10 rounded-md flex items-center justify-center ${
                  meta.page === meta.pages
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="sr-only">Наступна сторінка</span>
                &rarr;
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

 UserTransactionsPage;

export default UserTransactionsPage;