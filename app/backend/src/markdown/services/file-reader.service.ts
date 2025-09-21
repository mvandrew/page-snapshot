import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Сервис для чтения файлов и получения метаданных
 * Инкапсулирует работу с файловой системой
 */
@Injectable()
export class FileReaderService {
    private readonly logger = new Logger(FileReaderService.name);

    /**
     * Проверяет существование файла
     * @param filePath - путь к файлу
     * @throws Error если файл не существует
     */
    async validateFileExists(filePath: string): Promise<void> {
        if (!fs.existsSync(filePath)) {
            const error = `HTML файл не найден: ${filePath}`;
            this.logger.error(error);
            throw new Error(error);
        }
    }

    /**
     * Получает URL страницы из data.json файла
     * @param htmlFilePath - путь к HTML файлу
     * @returns URL страницы или пустую строку если не найден
     */
    async getPageUrlFromDataJson(htmlFilePath: string): Promise<string> {
        try {
            const dataJsonPath = this.getDataJsonPath(htmlFilePath);
            this.logger.debug(`Путь к data.json: ${dataJsonPath}`);

            if (!fs.existsSync(dataJsonPath)) {
                this.logger.warn(`Файл data.json не найден: ${dataJsonPath}`);
                return '';
            }

            const dataJsonContent = await this.readFile(dataJsonPath);
            const data = JSON.parse(dataJsonContent);

            const url = data.url || '';
            this.logger.debug(`URL из data.json: ${url}`);

            return url;
        } catch (error) {
            this.logger.error(`Ошибка при чтении data.json: ${error.message}`);
            return '';
        }
    }

    /**
     * Читает содержимое файла
     * @param filePath - путь к файлу
     * @returns содержимое файла
     */
    async readFile(filePath: string): Promise<string> {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            this.logger.error(`Ошибка чтения файла ${filePath}: ${error.message}`);
            throw new Error(`Не удалось прочитать файл: ${error.message}`);
        }
    }

    /**
     * Получает путь к data.json файлу на основе пути к HTML файлу
     * @param htmlFilePath - путь к HTML файлу
     * @returns путь к data.json файлу
     */
    private getDataJsonPath(htmlFilePath: string): string {
        const htmlDir = path.dirname(htmlFilePath);
        return path.join(htmlDir, 'data.json');
    }
}
