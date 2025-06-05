import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { campaignsAPI } from '../api/apiClient';
import { Campaign, CampaignStatus } from '../types/api';
import { formatDate } from '../utils/formatters';
import { formatCurrency } from '../utils/currencyFormatter';
import { Loader, Button, Alert, Badge, Modal, Tabs, Tab } from '../components/common';
import CampaignAnalytics from '../components/campaigns/CampaignAnalytics';
import MessageForm from '../components/campaigns/MessageForm';

const CampaignDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await campaignsAPI.getById(Number(id));
        setCampaign(response.data);
      } catch (err) {
        console.error('Помилка при завантаженні кампанії:', err);
        setError('Не вдалося завантажити дані кампанії. Спробуйте пізніше.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  const handleStatusChange = async (action: 'activate' | 'pause' | 'cancel') => {
    if (!id) return;

    setActionLoading(true);
    
    try {
      let response;
      switch (action) {
        case 'activate':
          response = await campaignsAPI.activate(Number(id));
          break;
        case 'pause':
          response = await campaignsAPI.pause(Number(id));
          break;
        case 'cancel':
          response = await campaignsAPI.cancel(Number(id));
          break;
      }
      
      setCampaign(response.data);
    } catch (err) {
      console.error(`Помилка при ${action} кампанії:`, err);
      setError(`Не вдалося змінити статус кампанії. Спробуйте пізніше.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!id) return;

    setActionLoading(true);
    
    try {
      const response = await campaignsAPI.duplicate(Number(id));
      navigate(`/campaigns/${response.data.id}`);
    } catch (err) {
      console.error('Помилка при дублюванні кампанії:', err);
      setError('Не вдалося дублювати кампанію. Спробуйте пізніше.');
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setActionLoading(true);
    
    try {
      await campaignsAPI.delete(Number(id));
      navigate('/campaigns');
    } catch (err) {
      console.error('Помилка при видаленні кампанії:', err);
      setError('Не вдалося видалити кампанію. Спробуйте пізніше.');
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    const statusConfig: Record<CampaignStatus, { color: string; label: string }> = {
      DRAFT: { color: 'gray', label: 'Чернетка' },
      ACTIVE: { color: 'green', label: 'Активна' },
      PAUSED: { color: 'yellow', label: 'Призупинена' },
      COMPLETED: { color: 'blue', label: 'Завершена' },
      CANCELLED: { color: 'red', label: 'Скасована' },
    };

    const config = statusConfig[status];
    if (!config) return <Badge color="gray">Невідомий статус</Badge>;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (!campaign) {
    return <Alert type="error" message="Кампанію не знайдено" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <div className="flex items-center mt-2">
            <span className="mr-2">Статус:</span>
            {getStatusBadge(campaign.status as CampaignStatus)}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {campaign.status === 'DRAFT' && (
            <Button
              onClick={() => handleStatusChange('activate')}
              variant="success"
              loading={actionLoading}
            >
              Активувати
            </Button>
          )}
          
          {campaign.status === 'ACTIVE' && (
            <Button
              onClick={() => handleStatusChange('pause')}
              variant="warning"
              loading={actionLoading}
            >
              Призупинити
            </Button>
          )}
          
          {campaign.status === 'PAUSED' && (
            <Button
              onClick={() => handleStatusChange('activate')}
              variant="success"
              loading={actionLoading}
            >
              Відновити
            </Button>
          )}
          
          {(campaign.status === 'DRAFT' || campaign.status === 'ACTIVE' || campaign.status === 'PAUSED') && (
            <Button
              onClick={() => handleStatusChange('cancel')}
              variant="danger"
              loading={actionLoading}
            >
              Скасувати
            </Button>
          )}
          
          <Button
            onClick={() => setShowMessageModal(true)}
            variant="primary"
            disabled={campaign.status !== 'ACTIVE'}
          >
            Почати розсилку
          </Button>
          
          <Button
            onClick={handleDuplicate}
            variant="outline"
            loading={actionLoading}
          >
            Дублювати
          </Button>
          
          <Button
            onClick={() => navigate(`/campaigns/${id}/edit`)}
            variant="outline"
          >
            Редагувати
          </Button>
          
          <Button
            onClick={() => setShowDeleteModal(true)}
            variant="danger"
            outline
          >
            Видалити
          </Button>
        </div>
      </div>

      <Tabs>
        <Tab title="Деталі">
          <div className="bg-white shadow-md rounded-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Основна інформація</h2>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600">Тип кампанії:</span>
                    <p className="font-medium">
                      {campaign.type === 'EMAIL' && 'Email кампанія'}
                      {campaign.type === 'SMS' && 'SMS кампанія'}
                      {campaign.type === 'PUSH' && 'Push кампанія'}
                      {campaign.type === 'MIXED' && 'Змішана кампанія'}
                    </p>
                  </div>
                  
                  {campaign.description && (
                    <div>
                      <span className="text-gray-600">Опис:</span>
                      <p className="font-medium">{campaign.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-600">Створено:</span>
                    <p className="font-medium">{formatDate(campaign.createdAt)}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Оновлено:</span>
                    <p className="font-medium">{formatDate(campaign.updatedAt)}</p>
                  </div>
                  
                  {campaign.goal && (
                    <div>
                      <span className="text-gray-600">Ціль:</span>
                      <p className="font-medium">{campaign.goal}</p>
                    </div>
                  )}
                  
                  {campaign.budget && (
                    <div>
                      <span className="text-gray-600">Бюджет:</span>
                      <p className="font-medium">{formatCurrency(campaign.budget)}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-4">Розклад</h2>
                
                <div className="space-y-3">
                  {campaign.startDate ? (
                    <div>
                      <span className="text-gray-600">Дата початку:</span>
                      <p className="font-medium">{formatDate(campaign.startDate)}</p>
                    </div>
                  ) : (
                    <div className="text-gray-600">Дата початку не вказана</div>
                  )}
                  
                  {campaign.endDate ? (
                    <div>
                      <span className="text-gray-600">Дата закінчення:</span>
                      <p className="font-medium">{formatDate(campaign.endDate)}</p>
                    </div>
                  ) : (
                    <div className="text-gray-600">Дата закінчення не вказана</div>
                  )}
                  
                  {campaign.targetAudience && Object.keys(campaign.targetAudience).length > 0 && (
                    <div>
                      <span className="text-gray-600">Цільова аудиторія:</span>
                      <pre className="mt-1 p-2 bg-gray-50 rounded text-sm overflow-auto">
                        {JSON.stringify(campaign.targetAudience, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Tab>
        
        <Tab title="Аналітика">
          <CampaignAnalytics campaignId={Number(id)} />
        </Tab>
      </Tabs>

      {/* Модальне вікно для початку розсилки */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title="Початок розсилки"
      >
        <MessageForm
          campaignId={Number(id)}
          campaignType={campaign.type}
          onClose={() => setShowMessageModal(false)}
        />
      </Modal>

      {/* Модальне вікно для підтвердження видалення */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Видалення кампанії"
      >
        <div className="p-4">
          <p className="mb-4">
            Ви впевнені, що хочете видалити кампанію &quot;{campaign.name}&quot;? Ця дія не може бути скасована.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Скасувати
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={actionLoading}
            >
              Видалити
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CampaignDetailsPage;