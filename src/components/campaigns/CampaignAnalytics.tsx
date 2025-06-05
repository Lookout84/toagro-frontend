import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { campaignsAPI } from '../../api/apiClient';
import { formatCurrency } from '../../utils/currencyFormatter';
// Update the import paths below to the actual locations of Loader and Alert components
import Loader from '../common/Loader';
import Alert from '../common/Alert';

interface CampaignAnalyticsProps {
  campaignId: number;
}

interface AnalyticsData {
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  timeData: {
    date: string;
    sent: number;
    delivered: number;
    opened: number;
  }[];
  deviceData: {
    name: string;
    value: number;
  }[];
  revenue?: number;
  roi?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({ campaignId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await campaignsAPI.getAnalytics(campaignId);
        setAnalytics(response.data);
      } catch (err) {
        console.error('Помилка при завантаженні аналітики:', err);
        setError('Не вдалося завантажити аналітику кампанії. Спробуйте пізніше.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [campaignId]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (!analytics) {
    return (
      <div className="bg-gray-50 p-8 rounded-md text-center">
        <p className="text-gray-600">Аналітика недоступна для цієї кампанії</p>
      </div>
    );
  }

  const { metrics, timeData, deviceData, revenue, roi } = analytics;

  // Перетворення метрик у формат для графіка
  const metricsData = [
    { name: 'Відправлено', value: metrics.sent },
    { name: 'Доставлено', value: metrics.delivered },
    { name: 'Відкрито', value: metrics.opened },
    { name: 'Клікнуто', value: metrics.clicked },
    { name: 'Конверсії', value: metrics.converted },
  ];

  // Функція для форматування відсотків
  const formatPercent = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  // Спеціальний компонент для відображення тултіпа на графіках
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="bg-white shadow-md rounded-md p-6">
        <h2 className="text-lg font-semibold mb-4">Ключові метрики</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="text-xl font-bold text-blue-600">{metrics.sent}</div>
            <div className="text-sm text-gray-600">Відправлено</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-md">
            <div className="text-xl font-bold text-green-600">{metrics.delivered}</div>
            <div className="text-sm text-gray-600">Доставлено</div>
            <div className="text-xs text-gray-500">
              {formatPercent(metrics.delivered, metrics.sent)}
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-md">
            <div className="text-xl font-bold text-yellow-600">{metrics.opened}</div>
            <div className="text-sm text-gray-600">Відкрито</div>
            <div className="text-xs text-gray-500">
              {formatPercent(metrics.opened, metrics.delivered)}
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-md">
            <div className="text-xl font-bold text-orange-600">{metrics.clicked}</div>
            <div className="text-sm text-gray-600">Клікнуто</div>
            <div className="text-xs text-gray-500">
              {formatPercent(metrics.clicked, metrics.opened)}
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-md">
            <div className="text-xl font-bold text-purple-600">{metrics.converted}</div>
            <div className="text-sm text-gray-600">Конверсії</div>
            <div className="text-xs text-gray-500">
              {formatPercent(metrics.converted, metrics.clicked)}
            </div>
          </div>
        </div>
        
        {(revenue !== undefined || roi !== undefined) && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {revenue !== undefined && (
              <div className="bg-indigo-50 p-4 rounded-md">
                <div className="text-xl font-bold text-indigo-600">{formatCurrency(revenue)}</div>
                <div className="text-sm text-gray-600">Дохід</div>
              </div>
            )}
            
            {roi !== undefined && (
              <div className="bg-pink-50 p-4 rounded-md">
                <div className="text-xl font-bold text-pink-600">{roi.toFixed(2)}%</div>
                <div className="text-sm text-gray-600">ROI</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white shadow-md rounded-md p-6">
        <h2 className="text-lg font-semibold mb-4">Активність за часом</h2>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="sent" fill="#8884d8" name="Відправлено" />
              <Bar dataKey="delivered" fill="#82ca9d" name="Доставлено" />
              <Bar dataKey="opened" fill="#ffc658" name="Відкрито" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-md p-6">
        <h2 className="text-lg font-semibold mb-4">Розподіл за пристроями</h2>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {deviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Розділ з додатковою аналітикою по конверсіях */}
      {metrics.converted > 0 && (
        <div className="bg-white shadow-md rounded-md p-6">
          <h2 className="text-lg font-semibold mb-4">Аналіз конверсій</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-xl font-bold text-gray-800">
                {formatPercent(metrics.converted, metrics.sent)}
              </div>
              <div className="text-sm text-gray-600">Загальна конверсія</div>
              <div className="text-xs text-gray-500">
                Відношення конверсій до відправлених
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-xl font-bold text-gray-800">
                {formatPercent(metrics.converted, metrics.opened)}
              </div>
              <div className="text-sm text-gray-600">Конверсія відкриттів</div>
              <div className="text-xs text-gray-500">
                Відношення конверсій до відкритих
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-xl font-bold text-gray-800">
                {formatPercent(metrics.converted, metrics.clicked)}
              </div>
              <div className="text-sm text-gray-600">Конверсія кліків</div>
              <div className="text-xs text-gray-500">
                Відношення конверсій до кліків
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignAnalytics;