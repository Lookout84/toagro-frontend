import React, { useEffect, useState } from "react";
import { Card, Button, Input, Loader, Alert } from "../../components/common";
import { RefreshCw, Plus, Edit, Trash2, Folder } from "lucide-react";
import { adminAPI } from "../../api/apiClient";

interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  parent?: { id: number; name: string } | null;
  children?: Category[];
  slug?: string;
}

function buildCategoryTree(flat: Category[]): Category[] {
  const map = new Map<number, Category>();
  const roots: Category[] = [];
  flat.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });
  map.forEach((cat) => {
    if (cat.parent && map.has(cat.parent.id)) {
      map.get(cat.parent.id)!.children!.push(cat);
    } else {
      roots.push(cat);
    }
  });
  return roots;
}

function transliterate(text: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh",
    з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l", м: "m", н: "n",
    о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ю: "yu", я: "ya", ё: "yo", э: "e", ы: "y",
    ь: "", ъ: "",
  };
  return text
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      const isUpper = char !== lower;
      const latin = map[lower] || lower;
      return isUpper ? latin.charAt(0).toUpperCase() + latin.slice(1) : latin;
    })
    .join("");
}

// Функція для генерації slug з назви
function generateSlug(name: string) {
  return transliterate(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/gi, "") // тільки латиниця, цифри, пробіли, дефіси
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<string>("");
  const [newSlug, setNewSlug] = useState<string>("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [editingSlug, setEditingSlug] = useState<string>("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getCategories();
      const flat = Array.isArray(response.data.data.categories)
        ? response.data.data.categories
        : [];
      setFlatCategories(flat);
      setCategories(buildCategoryTree(flat));
    } catch {
      setError("Не вдалося отримати список категорій.");
      setCategories([]);
      setFlatCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Автоматичне оновлення slug при зміні назви нової категорії
  useEffect(() => {
    setNewSlug(generateSlug(newCategory));
  }, [newCategory]);

  // Автоматичне оновлення slug при зміні назви редагованої категорії
  useEffect(() => {
    if (editingId !== null) {
      setEditingSlug(generateSlug(editingName));
    }
  }, [editingName, editingId]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || !newSlug.trim()) return;
    setSaving(true);
    try {
      await adminAPI.createCategory({
        name: newCategory,
        slug: newSlug,
        parentId: parentId || null,
      } as { name: string; slug: string; parentId?: number | null });
      setNewCategory("");
      setNewSlug("");
      setParentId(null);
      await fetchCategories();
    } catch {
      setError("Не вдалося додати категорію.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setEditingSlug(cat.slug || generateSlug(cat.name));
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim() || !editingSlug.trim() || editingId === null) return;
    setSaving(true);
    try {
      await adminAPI.updateCategory(editingId, { name: editingName, slug: editingSlug });
      setEditingId(null);
      setEditingName("");
      setEditingSlug("");
      await fetchCategories();
    } catch {
      setError("Не вдалося оновити категорію.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цю категорію?"))
      return;
    setSaving(true);
    try {
      await adminAPI.deleteCategory(id);
      await fetchCategories();
    } catch {
      setError("Не вдалося видалити категорію.");
    } finally {
      setSaving(false);
    }
  };

  // Рекурсивний рендер категорій у вигляді рядків таблиці
  const renderCategoryRows = (cats: Category[], level = 0): React.ReactNode[] =>
    cats.flatMap((cat) => [
      <tr key={cat.id}>
        <td className="py-2 px-3 align-top">
          <div className="flex items-center gap-2" style={{ marginLeft: level * 20 }}>
            <Folder className="text-gray-400 flex-shrink-0" size={18} />
            {editingId === cat.id ? (
              <>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  size={12}
                  className="w-40"
                />
                <Input
                  value={editingSlug}
                  onChange={(e) => setEditingSlug(e.target.value)}
                  size={12}
                  className="w-40"
                  placeholder="Slug (латиницею)"
                />
              </>
            ) : (
              <span className="font-medium truncate">{cat.name}</span>
            )}
          </div>
        </td>
        <td className="py-2 px-3 align-top text-gray-500">
          {editingId === cat.id ? (
            <span className="text-xs text-gray-400">slug:</span>
          ) : (
            <span className="font-mono text-xs">{cat.slug}</span>
          )}
        </td>
        <td className="py-2 px-3 align-top text-gray-500">
          {cat.parent?.name || "-"}
        </td>
        <td className="py-2 px-3 align-top">
          <div className="flex gap-2 flex-shrink-0">
            {editingId === cat.id ? (
              <>
                <Button
                  size="small"
                  variant="success"
                  onClick={handleSaveEdit}
                  loading={saving}
                >
                  Зберегти
                </Button>
                <Button
                  size="small"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setEditingName("");
                    setEditingSlug("");
                  }}
                  disabled={saving}
                >
                  Скасувати
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="small"
                  variant="outline"
                  icon={<Edit size={14} />}
                  onClick={() => handleEditCategory(cat)}
                  disabled={saving}
                  title="Редагувати"
                >
                  <span className="sr-only">Редагувати</span>
                </Button>
                <Button
                  size="small"
                  variant="danger"
                  icon={<Trash2 size={14} />}
                  onClick={() => handleDeleteCategory(cat.id)}
                  loading={saving}
                  title="Видалити"
                >
                  <span className="sr-only">Видалити</span>
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>,
      ...(cat.children && cat.children.length > 0
        ? renderCategoryRows(cat.children, level + 1)
        : []),
    ]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Управління категоріями</h1>
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">
              Додавайте, редагуйте та видаляйте категорії товарів.
            </span>
            <Button
              variant="outline"
              size="small"
              icon={<RefreshCw className={loading ? "animate-spin" : ""} />}
              onClick={fetchCategories}
              disabled={loading}
            >
              Оновити
            </Button>
          </div>
          {error && <Alert type="error" message={error} className="mb-4" />}
          <form
            onSubmit={handleAddCategory}
            className="flex gap-2 mb-6 flex-wrap"
          >
            <Input
              placeholder="Нова категорія"
              value={newCategory}
              onChange={(e) => {
                setNewCategory(e.target.value);
                setNewSlug(generateSlug(e.target.value));
              }}
              size={12}
              className="w-48"
              required
            />
            <Input
              placeholder="Slug (латиницею)"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              size={12}
              className="w-48"
              required
            />
            <select
              className="border rounded px-2 py-1 text-sm"
              value={parentId ?? ""}
              onChange={(e) =>
                setParentId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Без батьківської категорії</option>
              {flatCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              variant="success"
              size="small"
              icon={<Plus size={16} />}
              loading={saving}
            >
              Додати
            </Button>
          </form>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : categories.length === 0 ? (
            <Alert type="info" message="Категорій не знайдено." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border rounded bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Назва
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Slug
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Батьківська
                    </th>
                    <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody>{renderCategoryRows(categories)}</tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminCategoriesPage;