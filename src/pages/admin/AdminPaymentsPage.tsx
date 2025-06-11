import React, { useEffect, useState } from "react";
import { Card, Loader, Alert, Button, Input, Select, Pagination } from "../../components/common";
import { RefreshCw, CreditCard } from "lucide-react";
import { adminAPI } from "../../api/apiClient";

interface Payment {
  id: number;
  userEmail: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "cancelled";
  method: string;
  createdAt: string;
  description?: string;
}

const statusOptions = [
  { value: "all", label: "Всі" },
  { value: "pending", label: "Очікує" },
  { value: "success", label: "Успішно" },
  { value: "failed", label: "Помилка" },
  { value: "cancelled", label: "Скасовано" },
];

const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [status, setStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: any = {
          page: currentPage,
          limit: 15,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (status !== "all") params.status = status;
        const response = await adminAPI.getPayments(params);
        const data = response.data.data;
        setPayments(Array.isArray(data.payments) ? data.payments : []);
        setTotalPages(data.meta?.pages || 1);
        setCurrentPage(data.meta?.page || 1);
        setTotalItems(data.meta?.total || 0);
      } catch {
        setPayments([]);
        setError("Не вдалося отримати список платежів.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [debouncedSearch, status, currentPage]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <CreditCard className="text-blue-600" /> Управління платежами
        </h1>
        <p className="text-gray-600 mb-6">
          Перегляд та керування платежами і транзакціями платформи.
        </p>
        {error && <Alert type="error" message={error} className="mb-4" />}
        <Card className="mb-6">
          <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full md:w-1/3">
              <Input
                type="text"
                placeholder="Пошук за email, описом..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-1/4">
              <Select
                value={status}
                onChange={setStatus}
                options={statusOptions}
              />
            </div>
            <div className="w-full md:w-auto flex justify-end">
              <Button
                variant="outline"
                size="small"
                icon={<RefreshCw className={loading ? "animate-spin" : ""} />}
                onClick={() => setCurrentPage(1)}
                disabled={loading}
              >
                Оновити
              </Button>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader />
              </div>
            ) : payments.length === 0 ? (
              <Alert type="info" message="Платежів не знайдено." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Сума</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Метод</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Опис</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">{p.userEmail}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold">
                            {p.amount} {p.currency}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              p.status === "success"
                                ? "bg-green-100 text-green-800"
                                : p.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : p.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {p.status === "success"
                              ? "Успішно"
                              : p.status === "pending"
                              ? "Очікує"
                              : p.status === "failed"
                              ? "Помилка"
                              : "Скасовано"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{p.method}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{p.description || "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(p.createdAt).toLocaleString("uk-UA")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
        <div className="mt-4 text-sm text-gray-600 text-center">
          Показано {payments.length} платежів з {totalItems}
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;