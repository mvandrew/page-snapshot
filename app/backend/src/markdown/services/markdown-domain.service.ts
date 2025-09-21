import { Injectable, Logger } from '@nestjs/common';
import { MarkdownConverterService } from './markdown-converter.service';
import { FileReaderService } from './file-reader.service';

/**
 * Доменный сервис для конвертации HTML в Markdown
 * Отвечает за бизнес-логику конвертации
 */
@Injectable()
export class MarkdownDomainService {
    private readonly logger = new Logger(MarkdownDomainService.name);

    constructor(
        private readonly markdownConverter: MarkdownConverterService,
        private readonly fileReader: FileReaderService
    ) { }

    /**
     * Конвертирует HTML файл в Markdown используя систему плагинов
     * @param htmlFilePath - путь к HTML файлу
     * @returns Markdown код
     */
    async convertHtmlToMarkdown(htmlFilePath: string): Promise<string> {
        this.logger.log(`Начинаем конвертацию HTML в Markdown: ${htmlFilePath}`);

        // Проверяем существование файла
        await this.fileReader.validateFileExists(htmlFilePath);

        // Получаем URL страницы из data.json
        const pageUrl = await this.fileReader.getPageUrlFromDataJson(htmlFilePath);
        this.logger.debug(`URL страницы: ${pageUrl}`);

        // Конвертируем используя систему плагинов
        const markdownContent = await this.markdownConverter.convert(htmlFilePath, pageUrl);

        this.logger.log(`Конвертация завершена успешно. Размер: ${markdownContent.length} символов`);
        return markdownContent;
    }
}
