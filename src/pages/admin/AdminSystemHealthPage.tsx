import React, { useEffect, useState } from "react";
import { AlertCircle, Server, Database, Activity, RefreshCw, Cpu } from "lucide-react";
import { adminAPI } from "../../api/apiClient";
import { Card, Alert, Loader, Button } from "../../components/common";

interface HealthMetrics {
  apiStatus: "ok" | "error";
  dbStatus: "ok" | "error";
  uptime: number;
  nodeVersion: string;
  timestamp: string;
  platform: string;
  env: string;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
}

const AdminSystemHealthPage: React.FC = () => {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getSystemHealth();
      const d = response.data.data;
      setMetrics({
        apiStatus: d.status === "ok" ? "ok" : "error",
        dbStatus: d.database === "up" ? "ok" : "error",
        uptime: d.uptime,
        nodeVersion: d.nodeVersion,
        timestamp: d.timestamp,
        platform: d.platform,
        env: d.env,
        memory: d.memory,
      });
    } catch {
      setError("Не вдалося отримати інформацію про стан системи.");
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // eslint-disable-next-line
  }, []);

  const formatUptime = (seconds: number) => {
    if (!seconds) return "—";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}д ${h}г ${m}хв`;
  };

  const formatBytes = (bytes: number) =>
    bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : "—";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Activity className="text-green-600" /> Стан системи
        </h1>
        <p className="text-gray-600 mb-6">
          Огляд стану API, бази даних та основних сервісів платформи.
        </p>
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="small"
            icon={<RefreshCw className={loading ? "animate-spin" : ""} />}
            onClick={fetchHealth}
            disabled={loading}
          >
            Оновити
          </Button>
        </div>
        <Card>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader />
              </div>
            ) : error ? (
              <Alert type="error" message={error} />
            ) : metrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Server size={32} className={metrics.apiStatus === "ok" ? "text-green-600" : "text-red-500"} />
                  <div>
                    <div className="font-semibold">API</div>
                    <div>
                      {metrics.apiStatus === "ok" ? (
                        <span className="text-green-600">Працює</span>
                      ) : (
                        <span className="text-red-500">Помилка</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Database size={32} className={metrics.dbStatus === "ok" ? "text-green-600" : "text-red-500"} />
                  <div>
                    <div className="font-semibold">База даних</div>
                    <div>
                      {metrics.dbStatus === "ok" ? (
                        <span className="text-green-600">Працює</span>
                      ) : (
                        <span className="text-red-500">Помилка</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Activity size={32} className="text-blue-600" />
                  <div>
                    <div className="font-semibold">Аптайм</div>
                    <div>{formatUptime(metrics.uptime)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Cpu size={32} className="text-gray-500" />
                  <div>
                    <div className="font-semibold">Node.js</div>
                    <div>{metrics.nodeVersion || "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircle size={32} className="text-gray-500" />
                  <div>
                    <div className="font-semibold">Платформа</div>
                    <div>{metrics.platform || "—"} ({metrics.env})</div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <div className="font-semibold mb-1">Памʼять Node.js</div>
                  <div className="text-sm text-gray-700 flex flex-wrap gap-4">
                    <span>RSS: {formatBytes(metrics.memory.rss)}</span>
                    <span>Heap Total: {formatBytes(metrics.memory.heapTotal)}</span>
                    <span>Heap Used: {formatBytes(metrics.memory.heapUsed)}</span>
                    <span>External: {formatBytes(metrics.memory.external)}</span>
                    <span>ArrayBuffers: {formatBytes(metrics.memory.arrayBuffers)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <span className="text-gray-500 text-sm">
                    Остання перевірка:{" "}
                    {metrics.timestamp
                      ? new Date(metrics.timestamp).toLocaleString("uk-UA")
                      : "—"}
                  </span>
                </div>
              </div>
            ) : (
              <Alert type="warning" message="Дані про стан системи відсутні." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminSystemHealthPage;