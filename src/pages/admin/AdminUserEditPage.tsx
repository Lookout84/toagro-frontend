import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminAPI } from "../../api/apiClient";
import { Button, Input, Select, Card, Alert, Loader } from "../../components/common";

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isVerified?: boolean;
  role: string;
}

const roleOptions = [
  { value: "ADMIN", label: "Адміністратор" },
  { value: "USER", label: "Користувач" },
  { value: "COMPANY", label: "Компанія" },
];

const AdminUserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.getUserById(id!);
        setUser(response.data.data);
      } catch {
        setError("Не вдалося завантажити дані користувача.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id]);

  const handleChange = (field: keyof User, value: any) => {
    if (!user) return;
    setUser({ ...user, [field]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await adminAPI.updateUser(user.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive,
        role: user.role,
      });
      setSuccess("Дані користувача успішно оновлено.");
      setTimeout(() => navigate("/admin/users"), 1200);
    } catch {
      setError("Не вдалося зберегти зміни.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Редагування користувача</h1>
        <Card>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader />
              </div>
            ) : error ? (
              <Alert type="error" message={error} />
            ) : user ? (
              <form onSubmit={handleSave} className="space-y-5">
                {success && <Alert type="success" message={success} />}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    onChange={e => handleChange("email", e.target.value)}
                    required
                    disabled
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Ім&#39;я
                    </label>
                    <Input
                      id="firstName"
                      value={user.firstName || ""}
                      onChange={e => handleChange("firstName", e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Прізвище
                    </label>
                    <Input
                      id="lastName"
                      value={user.lastName || ""}
                      onChange={e => handleChange("lastName", e.target.value)}
                    />
                  </div>
                </div>
                <Select
                  value={user.role}
                  onChange={val => handleChange("role", val)}
                  options={roleOptions}
                />
                <div className="flex items-center gap-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={user.isActive}
                    onChange={e => handleChange("isActive", e.target.checked)}
                  />
                  <label htmlFor="isActive" className="text-gray-700">
                    Активний користувач
                  </label>
                </div>
                <div className="flex justify-between mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/users")}
                    disabled={saving}
                  >
                    Скасувати
                  </Button>
                  <Button
                    type="submit"
                    variant="success"
                    loading={saving}
                  >
                    Зберегти зміни
                  </Button>
                </div>
              </form>
            ) : (
              <Alert type="warning" message="Користувача не знайдено." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserEditPage;