import type { ApiError } from '../types/api';

/**
 * API клиент для работы с backend
 */
class ApiService {
    private readonly baseUrl = 'http://localhost:3000';

    /**
     * Получает markdown контент с сервера
     * @returns Promise<string | null> - null если нет данных (404), строка с контентом в остальных случаях
     */
    async getMarkdown(): Promise<string | null> {
        try {
            const response = await fetch(`${this.baseUrl}/api/md`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/plain',
                    'Content-Type': 'text/plain; charset=utf-8',
                },
            });

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
            // Используем GET запрос вместо HEAD, чтобы получить полный ответ
            const response = await fetch(`${this.baseUrl}/api/md`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000), // 5 секунд таймаут
            });

            // Сервер доступен, если он отвечает (даже с ошибкой 404)
            // 404 означает, что сервер работает, но нет данных
            return response.status !== 0;
        } catch {
            return false;
        }
    }
}

export const apiService = new ApiService();
