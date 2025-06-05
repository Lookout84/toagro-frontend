import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campaignsAPI } from '../api/apiClient';
import { Campaign, CampaignStatus } from '../types/api';
import { formatDate } from '../utils/formatters';
// Update these import paths to the actual locations of your components:
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import Badge from '../components/common/Badge';

const CampaignsListPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await campaignsAPI.getAll();
        setCampaigns(response.data);
      } catch (err) {
        console.error('Помилка при завантаженні кампаній:', err);
        setError('Не вдалося завантажити список кампаній. Спробуйте пізніше.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const getStatusBadge = (status: CampaignStatus) => {
    // Adjust these color values to match the BadgeColor union type from your Badge component
    const statusConfig: Record<CampaignStatus, { color: 'gray' | 'green' | 'yellow' | 'blue' | 'red', label: string }> = {
      DRAFT: { color: 'gray', label: 'Чернетка' },
      ACTIVE: { color: 'green', label: 'Активна' },
      PAUSED: { color: 'yellow', label: 'Призупинена' },
      COMPLETED: { color: 'blue', label: 'Завершена' },
      CANCELLED: { color: 'red', label: 'Скасована' },
    };

    const config = statusConfig[status];
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const handleCreateCampaign = () => {
    navigate('/campaigns/create');
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Кампанії</h1>
        <Button onClick={handleCreateCampaign} variant="primary">
          Створити кампанію
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-md text-center">
          <p className="text-gray-600 mb-4">У вас ще немає кампаній</p>
          <Button onClick={handleCreateCampaign} variant="primary">
            Створити першу кампанію
          </Button>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Назва
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дати
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Створено
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      <Link
                        to={`/campaigns/${campaign.id}`}
                        className="hover:text-blue-600"
                      >
                        {campaign.name}
                      </Link>
                    </div>
                    {campaign.description && (
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {campaign.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {campaign.type === 'EMAIL' && 'Email кампанія'}
                      {campaign.type === 'SMS' && 'SMS кампанія'}
                      {campaign.type === 'PUSH' && 'Push кампанія'}
                      {campaign.type === 'MIXED' && 'Змішана кампанія'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(campaign.status as CampaignStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {campaign.startDate && (
                        <div>Початок: {formatDate(campaign.startDate)}</div>
                      )}
                      {campaign.endDate && (
                        <div>Кінець: {formatDate(campaign.endDate)}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(campaign.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        to={`/campaigns/${campaign.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Деталі
                      </Link>
                      <Link
                        to={`/campaigns/${campaign.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Редагувати
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CampaignsListPage;