import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Loader, Alert, Button } from "../../components/common";
import { adminAPI } from "../../api/apiClient";
import { ArrowLeft } from "lucide-react";

interface Campaign {
  id: number;
  title: string;
  description: string;
  goal: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Додайте інші поля, якщо потрібно
}

const statusLabels: Record<string, string> = {
  draft: "Чернетка",
  active: "Активна",
  completed: "Завершена",
};

const AdminCampaignDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.getCampaign(id);
        setCampaign(response.data.data);
      } catch {
        setError("Не вдалося отримати дані кампанії.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCampaign();
  }, [id]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="outline"
        size="small"
        icon={<ArrowLeft />}
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        Назад
      </Button>
      <h1 className="text-2xl font-bold mb-4">Деталі кампанії</h1>
      <Card>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : error ? (
            <Alert type="error" message={error} />
          ) : campaign ? (
            <div>
              <div className="mb-4">
                <span className="text-gray-500">ID:</span> {campaign.id}
              </div>
              <div className="mb-4">
                <span className="text-gray-500">Назва:</span>{" "}
                <span className="font-semibold">{campaign.title}</span>
              </div>
              <div className="mb-4">
                <span className="text-gray-500">Опис:</span>
                <div className="whitespace-pre-line">{campaign.description}</div>
              </div>
              <div className="mb-4">
                <span className="text-gray-500">Ціль:</span>{" "}
                <span className="font-semibold">{campaign.goal} грн</span>
              </div>
              <div className="mb-4">
                <span className="text-gray-500">Статус:</span>{" "}
                <span className="font-semibold">
                  {statusLabels[campaign.status] || campaign.status}
                </span>
              </div>
              <div className="mb-2 text-sm text-gray-400">
                Створено: {new Date(campaign.createdAt).toLocaleString("uk-UA")}
              </div>
              <div className="mb-2 text-sm text-gray-400">
                Оновлено: {new Date(campaign.updatedAt).toLocaleString("uk-UA")}
              </div>
            </div>
          ) : (
            <Alert type="info" message="Кампанію не знайдено." />
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminCampaignDetailsPage;