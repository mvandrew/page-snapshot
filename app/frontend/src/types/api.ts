/**
 * Типы для работы с API
 */

export interface ApiError {
    /** HTTP статус код */
    status: number;
    /** Сообщение об ошибке */
    message: string;
    /** Дополнительная информация */
    details?: string;
}
