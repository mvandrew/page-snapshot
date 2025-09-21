import { Injectable, Logger } from '@nestjs/common';
import { CreateSnapshotDto } from '../dto/create-snapshot.dto';
import { FileStorageService } from '../../shared/services/file-storage.service';

/**
 * Репозиторий для работы с данными снимков
 * Инкапсулирует логику сохранения и получения снимков
 */
@Injectable()
export class SnapshotRepository {
    private readonly logger = new Logger(SnapshotRepository.name);

    constructor(private readonly fileStorageService: FileStorageService) { }

    /**
     * Сохраняет снимок в файловую систему с повторными попытками
     * @param snapshotData - Данные снимка для сохранения
     * @param id - Уникальный идентификатор снимка
     * @param checksum - Контрольная сумма снимка
     */
    async saveSnapshot(snapshotData: CreateSnapshotDto, id: string, checksum: string): Promise<void> {
        const maxRetries = 3;
        let lastError: Error;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.logger.debug(`Попытка сохранения снимка ${attempt}/${maxRetries}`);

                await this.performSave(snapshotData, id, checksum);
                this.logger.log(`Снимок успешно сохранен с ID: ${id}`);
                return;

            } catch (error) {
                lastError = error as Error;
                this.logger.error(`Ошибка сохранения снимка (попытка ${attempt}/${maxRetries}): ${error.message}`);

                if (attempt === maxRetries) {
                    this.logger.error(`Не удалось сохранить снимок после ${maxRetries} попыток`);
                    throw new Error(`Не удалось сохранить снимок после ${maxRetries} попыток: ${error.message}`);
                }

                // Экспоненциальная задержка между попытками
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                this.logger.debug(`Ожидание ${delay}ms перед следующей попыткой`);
                await this.delay(delay);
            }
        }
    }

    /**
     * Получает контрольную сумму существующего снимка
     * @returns Контрольная сумма или null если снимок не существует
     */
    async getExistingChecksum(): Promise<string | null> {
        try {
            const jsonPath = this.fileStorageService.createFilePath('data.json');
            const jsonData = await this.fileStorageService.readFile(jsonPath);
            const existingData = JSON.parse(jsonData);
            return existingData.checksum || null;
        } catch {
            return null;
        }
    }

    /**
     * Выполняет фактическое сохранение снимка
     * @param snapshotData - Данные снимка
     * @param id - Идентификатор снимка
     * @param checksum - Контрольная сумма
     */
    private async performSave(snapshotData: CreateSnapshotDto, id: string, checksum: string): Promise<void> {
        const storagePath = this.fileStorageService.getStoragePath();
        await this.fileStorageService.ensureDirectoryExists(storagePath);

        // Сохраняем HTML файл
        const htmlPath = this.fileStorageService.createFilePath('index.html');
        await this.fileStorageService.writeFile(htmlPath, snapshotData.content.html);

        // Создаем и сохраняем метаданные
        const metadata = this.createMetadata(snapshotData, id, checksum);
        const jsonPath = this.fileStorageService.createFilePath('data.json');
        await this.fileStorageService.writeFile(jsonPath, JSON.stringify(metadata, null, 2));

        this.logger.debug(`HTML файл сохранен: ${htmlPath}`);
        this.logger.debug(`JSON файл сохранен: ${jsonPath}`);
    }

    /**
     * Создает объект метаданных для снимка
     * @param snapshotData - Данные снимка
     * @param id - Идентификатор снимка
     * @param checksum - Контрольная сумма
     * @returns Объект метаданных
     */
    private createMetadata(snapshotData: CreateSnapshotDto, id: string, checksum: string) {
        return {
            id,
            url: snapshotData.content.url,
            title: snapshotData.content.title,
            timestamp: snapshotData.content.timestamp,
            userAgent: snapshotData.userAgent,
            checksum,
            receivedAt: new Date().toISOString(),
            htmlSize: snapshotData.content.html.length
        };
    }

    /**
     * Создает задержку на указанное количество миллисекунд
     * @param ms - Количество миллисекунд для задержки
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
