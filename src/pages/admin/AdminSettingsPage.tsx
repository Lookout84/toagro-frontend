import React, { useState } from "react";
import { Card, Button, Input, Select, Alert } from "../../components/common";
import { Save, Settings, RefreshCw } from "lucide-react";

const languageOptions = [
  { value: "uk", label: "Українська" },
  { value: "en", label: "English" },
];

const themeOptions = [
  { value: "light", label: "Світла" },
  { value: "dark", label: "Темна" },
  { value: "system", label: "Системна" },
];

const notificationOptions = [
  { value: "all", label: "Всі сповіщення" },
  { value: "important", label: "Тільки важливі" },
  { value: "none", label: "Вимкнено" },
];

const AdminSettingsPage: React.FC = () => {
  const [language, setLanguage] = useState("uk");
  const [theme, setTheme] = useState("system");
  const [notifications, setNotifications] = useState("all");
  const [adminEmail, setAdminEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Тут має бути API-запит для збереження налаштувань
      await new Promise((res) => setTimeout(res, 800));
      setSuccess("Налаштування успішно збережено.");
    } catch {
      setError("Не вдалося зберегти налаштування.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Settings className="text-blue-600" /> Налаштування адміністратора
        </h1>
        <Card>
          <form onSubmit={handleSave} className="p-6 space-y-6">
            {success && <Alert type="success" message={success} />}
            {error && <Alert type="error" message={error} />}
            <div>
              <label className="block font-medium mb-1">Мова інтерфейсу</label>
              <Select
                value={language}
                onChange={setLanguage}
                options={languageOptions}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Тема</label>
              <Select
                value={theme}
                onChange={setTheme}
                options={themeOptions}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Email для сповіщень</label>
              <Input
                type="email"
                placeholder="admin@toagro.com"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Сповіщення</label>
              <Select
                value={notifications}
                onChange={setNotifications}
                options={notificationOptions}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                icon={<RefreshCw />}
                onClick={() => {
                  setLanguage("uk");
                  setTheme("system");
                  setNotifications("all");
                  setAdminEmail("");
                  setSuccess(null);
                  setError(null);
                }}
                disabled={saving}
              >
                Скинути
              </Button>
              <Button
                type="submit"
                variant="success"
                icon={<Save />}
                loading={saving}
              >
                Зберегти
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettingsPage;