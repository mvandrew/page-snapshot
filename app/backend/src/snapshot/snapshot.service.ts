import { Injectable, Logger } from '@nestjs/common';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { SnapshotDomainService, ProcessedSnapshot } from './services/snapshot-domain.service';

/**
 * Фасадный сервис для работы со снимками страниц
 * Предоставляет упрощенный интерфейс для контроллера
 */
@Injectable()
export class SnapshotService {
    private readonly logger = new Logger(SnapshotService.name);

    constructor(private readonly snapshotDomainService: SnapshotDomainService) { }

    /**
     * Обрабатывает снимок страницы
     * @param snapshotData - Данные снимка для обработки
     * @returns Результат обработки снимка
     */
    async processSnapshot(snapshotData: CreateSnapshotDto): Promise<ProcessedSnapshot> {
        this.logger.log(`Получен запрос на обработку снимка: ${snapshotData.content.url}`);

        try {
            const result = await this.snapshotDomainService.processSnapshot(snapshotData);
            this.logger.log(`Снимок успешно обработан с ID: ${result.id}`);
            return result;
        } catch (error) {
            this.logger.error(`Ошибка обработки снимка: ${error.message}`, error.stack);
            throw error;
        }
    }
}
