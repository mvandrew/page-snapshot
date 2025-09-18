import { Injectable, Logger } from '@nestjs/common';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { FileStorageService } from '../shared/services/file-storage.service';
import * as crypto from 'crypto';

export interface ProcessedSnapshot {
    id: string;
    receivedAt: string;
    checksum: string;
}

@Injectable()
export class SnapshotService {
    private readonly logger = new Logger(SnapshotService.name);

    constructor(private readonly fileStorageService: FileStorageService) { }

    async processSnapshot(snapshotData: CreateSnapshotDto): Promise<ProcessedSnapshot> {
        console.log('=== ОБРАБОТКА СНИМКА В СЕРВИСЕ ===');

        const id = this.generateId();
        const receivedAt = new Date().toISOString();

        console.log('Сгенерированный ID:', id);
        console.log('Время получения:', receivedAt);

        // Вычисляем контрольную хэш-сумму для данных страницы
        const checksum = this.calculateChecksum(snapshotData);
        console.log('Вычисленная контрольная сумма:', checksum);

        // Логирование полученных данных
        this.logger.log(`Получен снимок страницы: ${snapshotData.content.url}`);
        this.logger.debug(`ID: ${id}`);
        this.logger.debug(`Заголовок: ${snapshotData.content.title}`);
        this.logger.debug(`Размер HTML: ${snapshotData.content.html.length} символов`);
        this.logger.debug(`User Agent: ${snapshotData.userAgent}`);
        this.logger.debug(`Временная метка: ${snapshotData.content.timestamp}`);
        this.logger.debug(`Контрольная сумма: ${checksum}`);

        console.log('Данные для сохранения:', {
            url: snapshotData.content.url,
            title: snapshotData.content.title,
            htmlLength: snapshotData.content.html.length,
            userAgent: snapshotData.userAgent,
            timestamp: snapshotData.content.timestamp
        });

        // Сохранение данных в файлы
        console.log('Начинаем сохранение в файлы...');
        await this.saveSnapshotToFiles(snapshotData, id, checksum);
        console.log('Сохранение в файлы завершено');

        // TODO: Здесь будет обработка HTML контента
        // await this.processHtmlContent(snapshotData.content.html);

        // TODO: Здесь будет извлечение метаданных
        // const metadata = await this.extractMetadata(snapshotData);

        const result = {
            id,
            receivedAt,
            checksum
        };

        console.log('=== ОБРАБОТКА СНИМКА ЗАВЕРШЕНА ===');
        console.log('Результат:', result);

        return result;
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
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Попытка сохранения ${attempt}/${maxRetries}`);

                // Получаем путь к папке сохранения
                const storagePath = this.fileStorageService.getStoragePath();

                // Создаем папку, если она не существует
                await this.fileStorageService.ensureDirectoryExists(storagePath);

                // Проверяем, нужно ли обновлять файлы
                const shouldUpdate = await this.shouldUpdateSnapshot(checksum);

                if (shouldUpdate) {
                    // Сохраняем HTML файл
                    const htmlPath = this.fileStorageService.createFilePath('index.html');
                    await this.fileStorageService.writeFile(htmlPath, snapshotData.content.html);

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
                    const jsonPath = this.fileStorageService.createFilePath('data.json');
                    await this.fileStorageService.writeFile(jsonPath, JSON.stringify(metadata, null, 2));

                    this.logger.log(`Снимок сохранен: ${storagePath}`);
                    this.logger.debug(`HTML файл: ${htmlPath}`);
                    this.logger.debug(`JSON файл: ${jsonPath}`);
                } else {
                    this.logger.log(`Снимок не изменился, пропускаем сохранение: ${storagePath}`);
                }

                // Если дошли сюда, значит сохранение прошло успешно
                return;

            } catch (error) {
                lastError = error;
                console.error(`Ошибка сохранения снимка (попытка ${attempt}/${maxRetries}):`, error.message);

                // Если это последняя попытка, выбрасываем ошибку
                if (attempt === maxRetries) {
                    this.logger.error(`Ошибка сохранения снимка после ${maxRetries} попыток: ${error.message}`);
                    throw new Error(`Не удалось сохранить снимок после ${maxRetries} попыток: ${error.message}`);
                }

                // Ждем перед следующей попыткой (экспоненциальная задержка)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`Ждем ${delay}ms перед следующей попыткой...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    private async shouldUpdateSnapshot(newChecksum: string): Promise<boolean> {
        try {
            const jsonPath = this.fileStorageService.createFilePath('data.json');
            const jsonData = await this.fileStorageService.readFile(jsonPath);
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
