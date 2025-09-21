import { Injectable, Logger } from '@nestjs/common';
import { MarkdownPlugin } from '../markdown-plugin.interface';
import { PluginLoaderService } from './plugin-loader.service';

/**
 * Сервис для конвертации HTML в Markdown
 * Использует систему плагинов для обработки различных типов контента
 */
@Injectable()
export class MarkdownConverterService {
    private readonly logger = new Logger(MarkdownConverterService.name);

    constructor(private readonly pluginLoader: PluginLoaderService) { }

    /**
     * Конвертирует HTML файл в Markdown используя доступные плагины
     * @param htmlFilePath - путь к HTML файлу
     * @param pageUrl - URL страницы для контекста
     * @returns Markdown код
     */
    async convert(htmlFilePath: string, pageUrl: string): Promise<string> {
        this.logger.log(`Начинаем конвертацию файла: ${htmlFilePath}`);
        this.logger.debug(`URL страницы: ${pageUrl}`);

        const plugins = this.pluginLoader.getPlugins();
        this.logger.debug(`Доступно плагинов: ${plugins.length}`);

        if (plugins.length === 0) {
            throw new Error('Нет доступных плагинов для конвертации');
        }

        // Пробуем каждый плагин по порядку
        for (let i = 0; i < plugins.length; i++) {
            const plugin = plugins[i];
            const pluginName = plugin.constructor.name;

            try {
                this.logger.debug(`Пробуем плагин ${i + 1}/${plugins.length}: ${pluginName}`);

                const result = this.tryPlugin(plugin, htmlFilePath, pageUrl);

                if (this.isValidResult(result)) {
                    this.logger.log(`Плагин ${pluginName} успешно обработал файл`);
                    this.logger.debug(`Результат: ${result!.substring(0, 100)}${result!.length > 100 ? '...' : ''}`);
                    return result!;
                } else {
                    this.logger.debug(`Плагин ${pluginName} не смог обработать файл (вернул пустой результат)`);
                }
            } catch (error) {
                this.logger.warn(`Ошибка в плагине ${pluginName}: ${error.message}`);
                // Продолжаем с следующим плагином
            }
        }

        // Если ни один плагин не смог обработать файл
        throw new Error('Не удалось конвертировать файл - ни один плагин не смог его обработать');
    }

    /**
     * Пытается выполнить конвертацию с помощью плагина
     * @param plugin - плагин для использования
     * @param htmlFilePath - путь к HTML файлу
     * @param pageUrl - URL страницы
     * @returns результат конвертации или null
     */
    private tryPlugin(plugin: MarkdownPlugin, htmlFilePath: string, pageUrl: string): string | null {
        try {
            const result = plugin.convert(htmlFilePath, pageUrl);
            return result;
        } catch (error) {
            this.logger.debug(`Плагин ${plugin.constructor.name} выбросил ошибку: ${error.message}`);
            return null;
        }
    }

    /**
     * Проверяет, является ли результат валидным
     * @param result - результат конвертации
     * @returns true если результат валидный
     */
    private isValidResult(result: string | null): boolean {
        return result !== null && result !== undefined && result.trim().length > 0;
    }
}
