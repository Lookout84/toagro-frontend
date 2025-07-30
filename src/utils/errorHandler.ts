interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// Type guard для перевірки, чи є об'єкт ApiError
const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    (('response' in error) || ('message' in error))
  );
};

export const handleApiError = (error: unknown): string => {
  console.error('API Error:', error);

  // Перевіряємо, чи є це ApiError
  if (isApiError(error) && error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 404:
        return "Ресурс не знайдено. Можливо, дані недоступні для цієї країни";
      case 403:
        return "Доступ заборонено. Перевірте права доступу";
      case 401:
        return "Необхідна авторизація";
      case 429:
        return "Забагато запитів. Спробуйте пізніше";
      case 500:
      case 502:
      case 503:
      case 504:
        return "Помилка сервера. Спробуйте пізніше";
      default:
        return data?.message || `Помилка ${status}: ${getStatusText(status)}`;
    }
  }
  
  // Перевіряємо, чи є це ApiError з message
  if (isApiError(error) && error.message) {
    return error.message;
  }

  // Якщо це звичайна помилка з message
  if (error instanceof Error) {
    return error.message;
  }

  // Якщо це рядок
  if (typeof error === 'string') {
    return error;
  }
  
  return "Невідома помилка. Перевірте з'єднання з інтернетом";
};

const getStatusText = (status: number): string => {
  const statusTexts: Record<number, string> = {
    400: "Неправильний запит",
    401: "Не авторизований",
    403: "Доступ заборонено",
    404: "Не знайдено",
    408: "Тайм-аут запиту",
    409: "Конфлікт",
    422: "Помилка валідації",
    429: "Забагато запитів",
    500: "Внутрішня помилка сервера",
    502: "Поганий шлюз",
    503: "Сервіс недоступний",
    504: "Тайм-аут шлюзу",
  };
  
  return statusTexts[status] || "Невідома помилка";
};

export const isNetworkError = (error: unknown): boolean => {
  if (isApiError(error)) {
    return !error.response && (error.message?.includes('Network Error') ?? false);
  }
  if (error instanceof Error) {
    return error.message.includes('Network Error');
  }
  return false;
};

export const getErrorSeverity = (error: ApiError): 'low' | 'medium' | 'high' => {
  if (!error.response) return 'high';
  
  const status = error.response.status;
  
  if (status >= 500) return 'high';
  if (status === 404 || status === 403) return 'medium';
  return 'low';
};
