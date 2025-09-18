import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Сервис для работы с файловым хранилищем
 * Предоставляет методы для создания директорий, записи файлов и проверки существования
 */
@Injectable()
export class FileStorageService {
    private readonly logger = new Logger(FileStorageService.name);

    constructor(private readonly configService: ConfigService) { }

    /**
     * Получает базовый путь к хранилищу из переменных окружения
     */
    getStoragePath(): string {
        return this.configService.get<string>('SNAPSHOT_STORAGE_PATH', './storage/snapshots');
    }

    /**
     * Создает директорию, если она не существует
     * @param dirPath - путь к директории
     * @throws Error если не удалось создать директорию
     */
    async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fs.promises.access(dirPath);
            this.logger.debug(`Директория уже существует: ${dirPath}`);
        } catch {
            try {
                await fs.promises.mkdir(dirPath, { recursive: true });
                this.logger.debug(`Создана директория: ${dirPath}`);
            } catch (error) {
                this.logger.error(`Ошибка создания директории ${dirPath}: ${error.message}`);
                throw new Error(`Не удалось создать директорию: ${error.message}`);
            }
        }
    }

    /**
     * Записывает содержимое в файл
     * @param filePath - путь к файлу
     * @param content - содержимое для записи
     * @param encoding - кодировка (по умолчанию utf8)
     * @throws Error если не удалось записать файл
     */
    async writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
        try {
            await fs.promises.writeFile(filePath, content, encoding);
            this.logger.debug(`Файл записан: ${filePath}`);
        } catch (error) {
            this.logger.error(`Ошибка записи файла ${filePath}: ${error.message}`);
            throw new Error(`Не удалось записать файл: ${error.message}`);
        }
    }

    /**
     * Читает содержимое файла
     * @param filePath - путь к файлу
     * @param encoding - кодировка (по умолчанию utf8)
     * @returns содержимое файла
     * @throws Error если не удалось прочитать файл
     */
    async readFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
        try {
            const content = await fs.promises.readFile(filePath, encoding);
            this.logger.debug(`Файл прочитан: ${filePath}`);
            return content;
        } catch (error) {
            this.logger.error(`Ошибка чтения файла ${filePath}: ${error.message}`);
            throw new Error(`Не удалось прочитать файл: ${error.message}`);
        }
    }

    /**
     * Проверяет существование файла
     * @param filePath - путь к файлу
     * @returns true если файл существует, false если нет
     */
    async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Создает полный путь к файлу в хранилище
     * @param fileName - имя файла
     * @returns полный путь к файлу
     */
    createFilePath(fileName: string): string {
        const storagePath = this.getStoragePath();
        return path.join(storagePath, fileName);
    }

    /**
     * Получает информацию о файле
     * @param filePath - путь к файлу
     * @returns информация о файле или null если файл не существует
     */
    async getFileStats(filePath: string): Promise<fs.Stats | null> {
        try {
            const stats = await fs.promises.stat(filePath);
            return stats;
        } catch {
            return null;
        }
    }
}
