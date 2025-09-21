import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

/**
 * Глобальный фильтр для обработки ошибок валидации
 * Преобразует ошибки class-validator в стандартизированный формат ответа
 */
@Catch()
export class ValidationExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(ValidationExceptionFilter.name);

    /**
     * Обрабатывает исключения валидации
     * @param exception - Исключение для обработки
     * @param host - Контекст выполнения запроса
     */
    catch(exception: any, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        this.logger.error('Обработка исключения', {
            exception: exception.constructor.name,
            message: exception.message,
            stack: exception.stack,
            url: request.url,
            method: request.method
        });

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Внутренняя ошибка сервера';
        let details: any = null;

        // Обработка ошибок валидации
        if (exception.message && typeof exception.message === 'string') {
            if (exception.message.includes('должен быть') ||
                exception.message.includes('не может быть') ||
                exception.message.includes('должен быть в корректном формате')) {
                status = HttpStatus.BAD_REQUEST;
                message = 'Ошибка валидации данных';
                details = {
                    validationErrors: [exception.message]
                };
            } else if (exception.message.includes('Не удалось сохранить снимок')) {
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                message = exception.message;
            } else {
                status = HttpStatus.BAD_REQUEST;
                message = `Ошибка обработки снимка: ${exception.message}`;
            }
        }

        // Обработка HTTP исключений NestJS
        if (exception.status) {
            status = exception.status;
            message = exception.message || message;
            details = exception.response || details;
        }

        const errorResponse = {
            success: false,
            message,
            ...(details && { details }),
            timestamp: new Date().toISOString(),
            path: request.url
        };

        this.logger.debug('Отправка ответа об ошибке', {
            status,
            response: errorResponse
        });

        response.status(status).json(errorResponse);
    }
}
