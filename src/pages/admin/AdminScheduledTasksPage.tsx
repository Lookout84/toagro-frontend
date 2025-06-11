import React, { useEffect, useState } from "react";
import { Card, Button, Loader, Alert } from "../../components/common";
import { RefreshCw, Clock, Trash2, Play, Pause } from "lucide-react";
import { adminAPI } from "../../api/apiClient";

interface ScheduledTask {
  id: number;
  name: string;
  status: "scheduled" | "running" | "paused" | "completed" | "failed";
  cron: string;
  lastRun: string | null;
  nextRun: string | null;
  description?: string;
}

const statusColors: Record<ScheduledTask["status"], string> = {
  scheduled: "blue",
  running: "green",
  paused: "yellow",
  completed: "gray",
  failed: "red",
};

const AdminScheduledTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getScheduledTasks();
      setTasks(Array.isArray(response.data.data) ? response.data.data : []);
    } catch {
      setError("Не вдалося отримати список задач.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAction = async (
    taskId: number,
    action: "pause" | "resume" | "delete"
  ) => {
    setActionLoading(taskId);
    try {
      if (action === "pause") {
        await adminAPI.pauseScheduledTask(taskId);
      } else if (action === "resume") {
        await adminAPI.resumeScheduledTask(taskId);
      } else if (action === "delete") {
        await adminAPI.cancelScheduledTask(taskId);
      }
      await fetchTasks();
    } catch {
      setError("Не вдалося виконати дію над задачею.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Clock className="text-blue-600" /> Заплановані задачі
        </h1>
        <p className="text-gray-600 mb-6">
          Перегляд та керування запланованими задачами системи.
        </p>
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="small"
            icon={<RefreshCw className={loading ? "animate-spin" : ""} />}
            onClick={fetchTasks}
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
            ) : tasks.length === 0 ? (
              <Alert type="info" message="Запланованих задач не знайдено." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Назва</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Опис</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cron</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Останній запуск</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Наступний запуск</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap font-medium">{task.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{task.description || "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">{task.cron}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold bg-${statusColors[task.status]}-100 text-${statusColors[task.status]}-800`}
                          >
                            {task.status === "scheduled"
                              ? "Заплановано"
                              : task.status === "running"
                              ? "Виконується"
                              : task.status === "paused"
                              ? "Призупинено"
                              : task.status === "completed"
                              ? "Завершено"
                              : "Помилка"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {task.lastRun
                            ? new Date(task.lastRun).toLocaleString("uk-UA")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {task.nextRun
                            ? new Date(task.nextRun).toLocaleString("uk-UA")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex gap-2 justify-end">
                            {task.status === "running" || task.status === "scheduled" ? (
                              <Button
                                variant="outline"
                                size="small"
                                icon={<Pause size={16} />}
                                loading={actionLoading === task.id}
                                onClick={() => handleAction(task.id, "pause")}
                                title="Призупинити"
                              >{" "}</Button>
                            ) : task.status === "paused" ? (
                              <Button
                                variant="outline"
                                size="small"
                                icon={<Play size={16} />}
                                loading={actionLoading === task.id}
                                onClick={() => handleAction(task.id, "resume")}
                                title="Відновити"
                              >{" "}</Button>
                            ) : null}
                            <Button
                              variant="danger"
                              size="small"
                              icon={<Trash2 size={16} />}
                              loading={actionLoading === task.id}
                              onClick={() => handleAction(task.id, "delete")}
                              title="Видалити"
                            >{" "}</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminScheduledTasksPage;