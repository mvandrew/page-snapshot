import { Controller, Get, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { MarkdownService } from './markdown.service';
import { FileStorageService } from '../shared/services/file-storage.service';

@Controller('api/md')
export class MarkdownController {
    constructor(
        private readonly markdownService: MarkdownService,
        private readonly fileStorageService: FileStorageService
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    async convertToMarkdown(): Promise<string> {
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

            return markdownContent;
        } catch (error) {
            console.error('=== ОШИБКА ПРИ КОНВЕРТАЦИИ В MARKDOWN ===');
            console.error('Тип ошибки:', error.constructor.name);
            console.error('Сообщение ошибки:', error.message);
            console.error('Стек ошибки:', error.stack);

            throw new HttpException(
                {
                    success: false,
                    message: `Ошибка конвертации в Markdown: ${error.message}`
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
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
