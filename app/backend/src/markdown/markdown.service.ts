import { Injectable, Logger } from '@nestjs/common';
import { MarkdownPlugin } from './markdown-plugin.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MarkdownService {
    private readonly logger = new Logger(MarkdownService.name);
    private plugins: MarkdownPlugin[] = [];

    constructor() {
        this.loadPlugins();
    }

    /**
     * Конвертирует HTML файл в Markdown используя систему плагинов
     * @param htmlFilePath - путь к HTML файлу
     * @returns Markdown код
     */
    async convertHtmlToMarkdown(htmlFilePath: string): Promise<string> {
        console.log('=== КОНВЕРТАЦИЯ HTML В MARKDOWN ===');
        console.log('Путь к файлу:', htmlFilePath);
        console.log('Загружено плагинов:', this.plugins.length);

        // Проверяем существование файла
        if (!fs.existsSync(htmlFilePath)) {
            const error = `HTML файл не найден: ${htmlFilePath}`;
            console.error('ОШИБКА:', error);
            throw new Error(error);
        }

        // Пробуем каждый плагин по порядку
        for (let i = 0; i < this.plugins.length; i++) {
            const plugin = this.plugins[i];
            const pluginName = plugin.constructor.name;

            try {
                console.log(`Пробуем плагин ${i + 1}/${this.plugins.length}: ${pluginName}`);

                const result = plugin.convert(htmlFilePath);

                if (result && result.trim().length > 0) {
                    console.log(`Плагин ${pluginName} успешно обработал файл`);
                    console.log('Результат:', result.substring(0, 100) + (result.length > 100 ? '...' : ''));
                    return result;
                } else {
                    console.log(`Плагин ${pluginName} не смог обработать файл (вернул пустой результат)`);
                }
            } catch (error) {
                console.error(`Ошибка в плагине ${pluginName}:`, error.message);
                // Продолжаем с следующим плагином
            }
        }

        // Если ни один плагин не смог обработать файл
        const error = 'Не удалось конвертировать файл - ни один плагин не смог его обработать';
        console.error('ОШИБКА:', error);
        throw new Error(error);
    }

    /**
     * Загружает все плагины в правильном порядке
     */
    private loadPlugins(): void {
        console.log('=== ЗАГРУЗКА ПЛАГИНОВ ===');

        const plugins: MarkdownPlugin[] = [];

        // 1. Загружаем пользовательские плагины (приоритет)
        const customPluginsPath = path.join(process.cwd(), 'dist', 'plugins', 'custom');
        if (fs.existsSync(customPluginsPath)) {
            console.log('Загружаем пользовательские плагины из:', customPluginsPath);
            const customPlugins = this.loadPluginsFromDirectory(customPluginsPath);
            plugins.push(...customPlugins);
        } else {
            console.log('Папка пользовательских плагинов не найдена:', customPluginsPath);
        }

        // 2. Загружаем системные плагины
        const standardPluginsPath = path.join(process.cwd(), 'dist', 'plugins', 'standard');
        if (fs.existsSync(standardPluginsPath)) {
            console.log('Загружаем системные плагины из:', standardPluginsPath);
            const standardPlugins = this.loadPluginsFromDirectory(standardPluginsPath);
            plugins.push(...standardPlugins);
        } else {
            console.log('Папка системных плагинов не найдена:', standardPluginsPath);
        }

        this.plugins = plugins;
        console.log(`Всего загружено плагинов: ${this.plugins.length}`);

        // Логируем порядок загрузки
        this.plugins.forEach((plugin, index) => {
            console.log(`${index + 1}. ${plugin.constructor.name}`);
        });
    }

    /**
     * Загружает плагины из указанной директории
     * @param directoryPath - путь к директории с плагинами
     * @returns массив загруженных плагинов
     */
    private loadPluginsFromDirectory(directoryPath: string): MarkdownPlugin[] {
        const plugins: MarkdownPlugin[] = [];

        try {
            const files = fs.readdirSync(directoryPath)
                .filter(file => file.endsWith('.plugin.js'))
                .sort(); // Сортируем по алфавиту

            console.log(`Найдено файлов плагинов: ${files.length}`);
            files.forEach(file => console.log(`  - ${file}`));

            for (const file of files) {
                try {
                    const pluginPath = path.join(directoryPath, file);
                    console.log(`Загружаем плагин: ${file}`);

                    // Динамически импортируем плагин
                    const pluginModule = require(pluginPath);

                    // Ищем экспортированный класс или функцию
                    let PluginClass = pluginModule.default || pluginModule[Object.keys(pluginModule)[0]];

                    if (typeof PluginClass === 'function') {
                        const plugin = new PluginClass();
                        if (typeof plugin.convert === 'function') {
                            plugins.push(plugin);
                            console.log(`Плагин ${file} успешно загружен`);
                        } else {
                            console.warn(`Плагин ${file} не реализует метод convert`);
                        }
                    } else {
                        console.warn(`Плагин ${file} не экспортирует класс или функцию`);
                    }
                } catch (error) {
                    console.error(`Ошибка загрузки плагина ${file}:`, error.message);
                }
            }
        } catch (error) {
            console.error(`Ошибка чтения директории ${directoryPath}:`, error.message);
        }

        return plugins;
    }
}
