import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface ProcessedSnapshot {
    id: string;
    receivedAt: string;
    checksum: string;
}

@Injectable()
export class SnapshotService {
    private readonly logger = new Logger(SnapshotService.name);

    constructor(private readonly configService: ConfigService) { }

    async processSnapshot(snapshotData: CreateSnapshotDto): Promise<ProcessedSnapshot> {
        const id = this.generateId();
        const receivedAt = new Date().toISOString();

        // Вычисляем контрольную хэш-сумму для данных страницы
        const checksum = this.calculateChecksum(snapshotData);

        // Логирование полученных данных
        this.logger.log(`Получен снимок страницы: ${snapshotData.content.url}`);
        this.logger.debug(`ID: ${id}`);
        this.logger.debug(`Заголовок: ${snapshotData.content.title}`);
        this.logger.debug(`Размер HTML: ${snapshotData.content.html.length} символов`);
        this.logger.debug(`User Agent: ${snapshotData.userAgent}`);
        this.logger.debug(`Временная метка: ${snapshotData.content.timestamp}`);
        this.logger.debug(`Контрольная сумма: ${checksum}`);

        // Сохранение данных в файлы
        await this.saveSnapshotToFiles(snapshotData, id, checksum);

        // TODO: Здесь будет обработка HTML контента
        // await this.processHtmlContent(snapshotData.content.html);

        // TODO: Здесь будет извлечение метаданных
        // const metadata = await this.extractMetadata(snapshotData);

        return {
            id,
            receivedAt,
            checksum
        };
    }

    private generateId(): string {
        // Генерируем уникальный ID для снимка
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `snapshot_${timestamp}_${random}`;
    }

    private calculateChecksum(snapshotData: CreateSnapshotDto): string {
        // Создаем строку для хэширования из всех важных данных
        const dataToHash = JSON.stringify({
            html: snapshotData.content.html,
            url: snapshotData.content.url
        });

        // Вычисляем SHA-256 хэш
        return crypto.createHash('sha256').update(dataToHash, 'utf8').digest('hex');
    }

    private async saveSnapshotToFiles(snapshotData: CreateSnapshotDto, id: string, checksum: string): Promise<void> {
        try {
            // Получаем путь к папке сохранения из переменной окружения
            const storagePath = this.configService.get<string>('SNAPSHOT_STORAGE_PATH', './storage/snapshots');

            // Создаем папку, если она не существует
            await this.ensureDirectoryExists(storagePath);

            // Проверяем, нужно ли обновлять файлы
            const shouldUpdate = await this.shouldUpdateSnapshot(storagePath, checksum);

            if (shouldUpdate) {
                // Сохраняем HTML файл
                const htmlPath = path.join(storagePath, 'index.html');
                await fs.promises.writeFile(htmlPath, snapshotData.content.html, 'utf8');

                // Создаем объект с метаданными (без HTML)
                const metadata = {
                    id,
                    url: snapshotData.content.url,
                    title: snapshotData.content.title,
                    timestamp: snapshotData.content.timestamp,
                    userAgent: snapshotData.userAgent,
                    checksum,
                    receivedAt: new Date().toISOString(),
                    htmlSize: snapshotData.content.html.length
                };

                // Сохраняем JSON файл с метаданными
                const jsonPath = path.join(storagePath, 'data.json');
                await fs.promises.writeFile(jsonPath, JSON.stringify(metadata, null, 2), 'utf8');

                this.logger.log(`Снимок сохранен: ${storagePath}`);
                this.logger.debug(`HTML файл: ${htmlPath}`);
                this.logger.debug(`JSON файл: ${jsonPath}`);
            } else {
                this.logger.log(`Снимок не изменился, пропускаем сохранение: ${storagePath}`);
            }

        } catch (error) {
            this.logger.error(`Ошибка сохранения снимка: ${error.message}`);
            throw new Error(`Не удалось сохранить снимок: ${error.message}`);
        }
    }

    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fs.promises.access(dirPath);
        } catch {
            // Папка не существует, создаем её
            await fs.promises.mkdir(dirPath, { recursive: true });
            this.logger.debug(`Создана папка: ${dirPath}`);
        }
    }

    private async shouldUpdateSnapshot(snapshotDir: string, newChecksum: string): Promise<boolean> {
        try {
            const jsonPath = path.join(snapshotDir, 'data.json');
            const jsonData = await fs.promises.readFile(jsonPath, 'utf8');
            const existingData = JSON.parse(jsonData);

            // Сравниваем контрольные суммы
            return existingData.checksum !== newChecksum;
        } catch {
            // Файл не существует или ошибка чтения - нужно создать
            return true;
        }
    }

    // TODO: Методы для будущей реализации
    // private async processHtmlContent(html: string): Promise<void> {
    //   // Обработка HTML контента
    // }

    // private async extractMetadata(data: SnapshotData): Promise<any> {
    //   // Извлечение метаданных из HTML
    // }
}
