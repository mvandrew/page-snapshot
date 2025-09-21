import { Controller, Get, HttpCode, HttpStatus, HttpException, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProduces } from '@nestjs/swagger';
import type { Response } from 'express';
import { MarkdownService } from './markdown.service';
import { FileStorageService } from '../shared/services/file-storage.service';

@ApiTags('markdown')
@Controller('api/md')
export class MarkdownController {
    constructor(
        private readonly markdownService: MarkdownService,
        private readonly fileStorageService: FileStorageService
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Конвертировать HTML в Markdown',
        description: 'Конвертирует сохраненный HTML файл в Markdown формат через систему плагинов'
    })
    @ApiProduces('text/plain')
    @ApiResponse({
        status: 200,
        description: 'Markdown контент успешно сгенерирован',
        content: {
            'text/plain': {
                schema: {
                    type: 'string',
                    example: '# Заголовок страницы\n\n[Открыть оригинал](https://example.com/page)'
                }
            }
        }
    })
    @ApiResponse({
        status: 404,
        description: 'HTML файл не найден',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'HTML файл не найден' },
                error: { type: 'string', example: 'Error' },
                timestamp: { type: 'string', example: '2024-01-01T12:00:00.000Z' }
            }
        }
    })
    @ApiResponse({
        status: 503,
        description: 'Сервис конвертации недоступен',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Сервис конвертации недоступен - нет доступных плагинов' },
                error: { type: 'string', example: 'Error' },
                timestamp: { type: 'string', example: '2024-01-01T12:00:00.000Z' }
            }
        }
    })
    @ApiResponse({
        status: 500,
        description: 'Внутренняя ошибка сервера',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Ошибка конвертации в Markdown: [описание ошибки]' },
                error: { type: 'string', example: 'Error' },
                timestamp: { type: 'string', example: '2024-01-01T12:00:00.000Z' }
            }
        }
    })
    async convertToMarkdown(@Res() res: Response): Promise<void> {
        console.log('=== ПОЛУЧЕН ЗАПРОС НА КОНВЕРТАЦИЮ В MARKDOWN ===');
        console.log('Время запроса:', new Date().toISOString());

        try {
            // Получаем путь к активному HTML файлу (фиксированный в алгоритме)
            const htmlFilePath = this.getActiveHtmlFilePath();
            console.log('Путь к HTML файлу:', htmlFilePath);

            // Конвертируем HTML в Markdown
            const markdownContent = await this.markdownService.convertHtmlToMarkdown(htmlFilePath);

            console.log('=== КОНВЕРТАЦИЯ ЗАВЕРШЕНА УСПЕШНО ===');
            console.log('Размер Markdown:', markdownContent.length, 'символов');
            console.log('Превью:', markdownContent.substring(0, 200) + (markdownContent.length > 200 ? '...' : ''));

            // Возвращаем plain text при успехе
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.send(markdownContent);
        } catch (error) {
            console.error('=== ОШИБКА ПРИ КОНВЕРТАЦИИ В MARKDOWN ===');
            console.error('Тип ошибки:', error.constructor.name);
            console.error('Сообщение ошибки:', error.message);
            console.error('Стек ошибки:', error.stack);

            // Определяем статус код в зависимости от типа ошибки
            let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            let errorMessage = `Ошибка конвертации в Markdown: ${error.message}`;

            // Если файл не найден - 404
            if (error.message.includes('не найден') || error.message.includes('not found')) {
                statusCode = HttpStatus.NOT_FOUND;
                errorMessage = 'HTML файл не найден';
            }
            // Если нет плагинов для обработки - 503
            else if (error.message.includes('ни один плагин не смог')) {
                statusCode = HttpStatus.SERVICE_UNAVAILABLE;
                errorMessage = 'Сервис конвертации недоступен - нет доступных плагинов';
            }
            // Если ошибка чтения файла - 500
            else if (error.message.includes('EACCES') || error.message.includes('EISDIR')) {
                statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
                errorMessage = 'Ошибка доступа к файлу';
            }

            // Возвращаем JSON при ошибке
            res.status(statusCode).json({
                success: false,
                message: errorMessage,
                error: error.constructor.name,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Получает путь к активному HTML файлу
     * Использует тот же алгоритм, что и в snapshot.controller.ts
     * @returns путь к HTML файлу
     */
    private getActiveHtmlFilePath(): string {
        // Получаем путь к папке сохранения (тот же алгоритм, что в snapshot.service.ts)
        const storagePath = this.fileStorageService.getStoragePath();
        const htmlFilePath = this.fileStorageService.createFilePath('index.html');

        console.log('Путь к папке сохранения:', storagePath);
        console.log('Путь к HTML файлу:', htmlFilePath);

        return htmlFilePath;
    }
}
