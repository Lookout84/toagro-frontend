import React, { useState } from "react";
import { Card, Button, Input, TextArea, Alert, Loader, Select } from "../../components/common";
import { adminAPI } from "../../api/apiClient";

const initialState = {
  title: "",
  description: "",
  goal: "",
  status: "draft",
};

const statusOptions = [
  { value: "draft", label: "Чернетка" },
  { value: "active", label: "Активна" },
  { value: "completed", label: "Завершена" },
];

const AdminCreateCampaignPage: React.FC = () => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStatusChange = (value: string) => {
    setForm({ ...form, status: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await adminAPI.createCampaign({
        title: form.title,
        description: form.description,
        goal: Number(form.goal),
        status: form.status,
      });
      setSuccess("Кампанію успішно створено!");
      setForm(initialState);
    } catch {
      setError("Не вдалося створити кампанію.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Створення кампанії</h1>
        <Card>
          <div className="p-6">
            {error && <Alert type="error" message={error} className="mb-4" />}
            {success && <Alert type="success" message={success} className="mb-4" />}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label>
                Назва кампанії
                <Input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Опис
                <TextArea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </label>
              <label>
                Ціль (сума, грн)
                <Input
                  name="goal"
                  type="number"
                  min={1}
                  value={form.goal}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Статус
                <Select
                  value={form.status}
                  onChange={handleStatusChange}
                  options={statusOptions}
                />
              </label>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="success"
                  loading={loading}
                  disabled={loading}
                >
                  Створити кампанію
                </Button>
              </div>
            </form>
            {loading && (
              <div className="flex justify-center mt-4">
                <Loader />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminCreateCampaignPage;