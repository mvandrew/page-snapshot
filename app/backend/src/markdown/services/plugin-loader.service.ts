import { Injectable, Logger } from '@nestjs/common';
import { MarkdownPlugin } from '../markdown-plugin.interface';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Сервис для загрузки и управления плагинами Markdown
 * Инкапсулирует логику динамической загрузки плагинов
 */
@Injectable()
export class PluginLoaderService {
    private readonly logger = new Logger(PluginLoaderService.name);
    private plugins: MarkdownPlugin[] = [];

    constructor() {
        this.loadPlugins();
    }

    /**
     * Получает все загруженные плагины
     * @returns массив плагинов
     */
    getPlugins(): MarkdownPlugin[] {
        return [...this.plugins];
    }

    /**
     * Загружает все плагины в правильном порядке
     */
    private loadPlugins(): void {
        this.logger.log('Начинаем загрузку плагинов');

        const plugins: MarkdownPlugin[] = [];

        // 1. Загружаем пользовательские плагины (приоритет)
        const customPlugins = this.loadPluginsFromDirectory(this.getCustomPluginsPath());
        plugins.push(...customPlugins);

        // 2. Загружаем системные плагины
        const standardPlugins = this.loadPluginsFromDirectory(this.getStandardPluginsPath());
        plugins.push(...standardPlugins);

        this.plugins = plugins;
        this.logger.log(`Всего загружено плагинов: ${this.plugins.length}`);

        // Логируем порядок загрузки
        this.plugins.forEach((plugin, index) => {
            this.logger.debug(`${index + 1}. ${plugin.constructor.name}`);
        });
    }

    /**
     * Загружает плагины из указанной директории
     * @param directoryPath - путь к директории с плагинами
     * @returns массив загруженных плагинов
     */
    private loadPluginsFromDirectory(directoryPath: string): MarkdownPlugin[] {
        const plugins: MarkdownPlugin[] = [];

        if (!fs.existsSync(directoryPath)) {
            this.logger.debug(`Папка плагинов не найдена: ${directoryPath}`);
            return plugins;
        }

        try {
            const files = this.getPluginFiles(directoryPath);
            this.logger.debug(`Найдено файлов плагинов в ${directoryPath}: ${files.length}`);

            for (const file of files) {
                const plugin = this.loadPluginFromFile(directoryPath, file);
                if (plugin) {
                    plugins.push(plugin);
                }
            }
        } catch (error) {
            this.logger.error(`Ошибка чтения директории ${directoryPath}: ${error.message}`);
        }

        return plugins;
    }

    /**
     * Получает список файлов плагинов в директории
     * @param directoryPath - путь к директории
     * @returns массив имен файлов плагинов
     */
    private getPluginFiles(directoryPath: string): string[] {
        return fs.readdirSync(directoryPath)
            .filter(file => file.endsWith('.plugin.js'))
            .sort(); // Сортируем по алфавиту
    }

    /**
     * Загружает плагин из файла
     * @param directoryPath - путь к директории
     * @param fileName - имя файла плагина
     * @returns загруженный плагин или null
     */
    private loadPluginFromFile(directoryPath: string, fileName: string): MarkdownPlugin | null {
        try {
            const pluginPath = path.join(directoryPath, fileName);
            this.logger.debug(`Загружаем плагин: ${fileName}`);

            const pluginModule = require(pluginPath);
            const PluginClass = this.extractPluginClass(pluginModule);

            if (!PluginClass) {
                this.logger.warn(`Плагин ${fileName} не экспортирует класс или функцию`);
                return null;
            }

            const plugin = new PluginClass();
            if (typeof plugin.convert !== 'function') {
                this.logger.warn(`Плагин ${fileName} не реализует метод convert`);
                return null;
            }

            this.logger.debug(`Плагин ${fileName} успешно загружен`);
            return plugin;
        } catch (error) {
            this.logger.error(`Ошибка загрузки плагина ${fileName}: ${error.message}`);
            return null;
        }
    }

    /**
     * Извлекает класс плагина из модуля
     * @param pluginModule - загруженный модуль
     * @returns класс плагина или null
     */
    private extractPluginClass(pluginModule: any): any {
        return pluginModule.default || pluginModule[Object.keys(pluginModule)[0]];
    }

    /**
     * Получает путь к папке пользовательских плагинов
     * @returns путь к папке пользовательских плагинов
     */
    private getCustomPluginsPath(): string {
        return path.join(process.cwd(), 'dist', 'plugins', 'custom');
    }

    /**
     * Получает путь к папке системных плагинов
     * @returns путь к папке системных плагинов
     */
    private getStandardPluginsPath(): string {
        return path.join(process.cwd(), 'dist', 'plugins', 'standard');
    }
}
