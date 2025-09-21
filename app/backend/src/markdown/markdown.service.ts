import { Injectable, Logger } from '@nestjs/common';
import { MarkdownDomainService } from './services/markdown-domain.service';

/**
 * Фасадный сервис для конвертации HTML в Markdown
 * Предоставляет упрощенный интерфейс для контроллера
 */
@Injectable()
export class MarkdownService {
    private readonly logger = new Logger(MarkdownService.name);

    constructor(private readonly markdownDomainService: MarkdownDomainService) { }

    /**
     * Конвертирует HTML файл в Markdown используя систему плагинов
     * @param htmlFilePath - путь к HTML файлу
     * @returns Markdown код
     */
    async convertHtmlToMarkdown(htmlFilePath: string): Promise<string> {
        this.logger.log(`Получен запрос на конвертацию HTML в Markdown: ${htmlFilePath}`);

        try {
            const result = await this.markdownDomainService.convertHtmlToMarkdown(htmlFilePath);
            this.logger.log(`Конвертация завершена успешно. Размер: ${result.length} символов`);
            return result;
        } catch (error) {
            this.logger.error(`Ошибка конвертации HTML в Markdown: ${error.message}`, error.stack);
            throw error;
        }
    }
}
