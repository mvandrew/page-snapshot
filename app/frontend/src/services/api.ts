import type { ApiError } from '../types/api';

/**
 * API клиент для работы с backend
 */
class ApiService {
    private readonly baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    private readonly timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '5000');

    /**
     * Получает markdown контент с сервера
     * @returns Promise<string | null> - null если нет данных (404), строка с контентом в остальных случаях
     */
    async getMarkdown(): Promise<string | null> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(`${this.baseUrl}/api/md`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/plain',
                    'Content-Type': 'text/plain; charset=utf-8',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // 404 означает, что нет данных для конвертации - это нормальная ситуация, не ошибка
                if (response.status === 404) {
                    // Возвращаем null вместо выброса ошибки для 404
                    return null;
                }

                const errorData = await this.parseErrorResponse(response);
                const error: ApiError = {
                    status: response.status,
                    message: errorData.message || 'Ошибка загрузки markdown',
                    details: errorData.details,
                };
                throw error;
            }

            const content = await response.text();

            if (!content || content.trim().length === 0) {
                const error: ApiError = {
                    status: 204,
                    message: 'Markdown контент пуст',
                };
                throw error;
            }

            return content;
        } catch (error) {
            if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
                throw error;
            }

            // Обработка таймаута
            if (error instanceof Error && error.name === 'AbortError') {
                const timeoutError: ApiError = {
                    status: 408,
                    message: `Превышено время ожидания (${this.timeout}мс). Проверьте доступность сервера.`,
                    details: `Сервер не отвечает по адресу ${this.baseUrl}`,
                };
                throw timeoutError;
            }

            // Обработка сетевых ошибок
            const networkError: ApiError = {
                status: 0,
                message: 'Ошибка сети. Проверьте подключение к серверу.',
                details: error instanceof Error ? error.message : 'Неизвестная ошибка',
            };
            throw networkError;
        }
    }

    /**
     * Парсит ответ с ошибкой от сервера
     */
    private async parseErrorResponse(response: Response): Promise<{ message?: string; details?: string }> {
        try {
            const contentType = response.headers.get('content-type');

            if (contentType?.includes('application/json')) {
                return await response.json();
            } else {
                const text = await response.text();
                return { message: text || 'Ошибка сервера' };
            }
        } catch {
            return { message: 'Ошибка парсинга ответа сервера' };
        }
    }

    /**
     * Проверяет доступность сервера
     */
    async checkHealth(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(`${this.baseUrl}/api/md`, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Сервер доступен, если он отвечает (даже с ошибкой 404)
            // 404 означает, что сервер работает, но нет данных
            return response.status !== 0;
        } catch {
            return false;
        }
    }
}

export const apiService = new ApiService();
