import React, { useEffect, useState } from "react";
import { Card, Loader, Alert, Button, Input, Select, Pagination } from "../../components/common";
import { RefreshCw, List } from "lucide-react";
import { adminAPI } from "../../api/apiClient";

interface Listing {
  id: number;
  title: string;
  category: { id: number; name: string };
  user: { id: number; email: string };
  price: number;
  status: "active" | "pending" | "archived" | "rejected";
  createdAt: string;
}

const statusOptions = [
  { value: "all", label: "Всі" },
  { value: "active", label: "Активні" },
  { value: "pending", label: "На модерації" },
  { value: "archived", label: "Архів" },
  { value: "rejected", label: "Відхилені" },
];

const AdminListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
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
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: {
          page: number;
          limit: number;
          search?: string;
          status?: string;
        } = {
          page: currentPage,
          limit: 20,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (status !== "all") params.status = status;
        const response = await adminAPI.getListings(params);
        const data = response.data.data;
        setListings(Array.isArray(data.listings) ? data.listings : []);
        setTotalPages(data.meta?.pages || 1);
        setCurrentPage(data.meta?.page || 1);
        setTotalItems(data.meta?.total || 0);
      } catch {
        setListings([]);
        setError("Не вдалося отримати список оголошень.");
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [debouncedSearch, status, currentPage]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <List className="text-blue-600" /> Оголошення (адмін)
        </h1>
        <p className="text-gray-600 mb-6">
          Перегляд, пошук та керування всіма оголошеннями платформи.
        </p>
        {error && <Alert type="error" message={error} className="mb-4" />}
        <Card className="mb-6">
          <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full md:w-1/3">
              <Input
                type="text"
                placeholder="Пошук за назвою, email..."
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
            ) : listings.length === 0 ? (
              <Alert type="info" message="Оголошень не знайдено." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Назва</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Категорія</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Користувач</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ціна</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {listings.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">{l.title}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{l.category?.name || "-"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{l.user?.email || "-"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold">{l.price} грн</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              l.status === "active"
                                ? "bg-green-100 text-green-800"
                                : l.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : l.status === "archived"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {l.status === "active"
                              ? "Активне"
                              : l.status === "pending"
                              ? "На модерації"
                              : l.status === "archived"
                              ? "Архів"
                              : "Відхилено"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(l.createdAt).toLocaleString("uk-UA")}
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
          Показано {listings.length} оголошень з {totalItems}
        </div>
      </div>
    </div>
  );
};

export default AdminListingsPage;