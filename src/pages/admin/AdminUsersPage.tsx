import React, { useEffect, useState } from "react";
import { Search, UserCheck, UserX, RefreshCw } from "lucide-react";
import { adminAPI } from "../../api/apiClient";
import { Button, Input, Select, Card, Badge, Alert, Pagination, Loader } from "../../components/common";

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isVerified?: boolean;
  role: string;
  createdAt: string;
}

interface UserListResponse {
  users: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: any = {
          page: currentPage,
          limit: 10,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (roleFilter !== "all") params.role = roleFilter;

        const response = await adminAPI.getUsers(params);
        // Очікуємо структуру { status, data: { users, meta } }
        const data: UserListResponse = response.data.data;
        setUsers(Array.isArray(data.users) ? data.users : []);
        setTotalPages(data.meta?.pages || 1);
        setCurrentPage(data.meta?.page || 1);
        setTotalItems(data.meta?.total || 0);
      } catch {
        setUsers([]);
        setError("Не вдалося завантажити список користувачів.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [debouncedSearch, roleFilter, currentPage]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Користувачі</h1>
        <p className="text-gray-600 mb-6">Управління користувачами платформи</p>

        {error && <Alert type="error" message={error} className="mb-4" />}

        <Card className="mb-6">
          <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full md:w-1/3">
              <Input
                type="text"
                placeholder="Пошук за email, ім'ям..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                icon={<Search size={20} className="text-gray-400" />}
              />
            </div>
            <div className="w-full md:w-1/4">
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                options={[
                  { value: "all", label: "Всі ролі" },
                  { value: "ADMIN", label: "Адміністратор" },
                  { value: "USER", label: "Користувач" },
                  { value: "COMPANY", label: "Компанія" },
                ]}
              />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ім&#39;я</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата реєстрації</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Дії</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <Loader />
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.firstName || ""} {user.lastName || ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={user.role === "ADMIN" ? "blue" : user.role === "COMPANY" ? "green" : "gray"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isActive ? (
                          <Badge color="green" icon={<UserCheck size={14} />}>Активний</Badge>
                        ) : (
                          <Badge color="red" icon={<UserX size={14} />}>Неактивний</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString("uk-UA")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/* Дії: наприклад, блокування, перегляд, тощо */}
                        <Button variant="outline" size="small" disabled>
                          Дії
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Користувачів не знайдено
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
          Показано {users.length} користувачів з {totalItems}
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;