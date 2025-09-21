import { Injectable, Logger } from '@nestjs/common';
import { CreateSnapshotDto } from '../dto/create-snapshot.dto';
import { SnapshotRepository } from './snapshot.repository';
import { SnapshotIdGenerator } from './snapshot-id.generator';
import { SnapshotChecksumCalculator } from './snapshot-checksum.calculator';

/**
 * Интерфейс для результата обработки снимка
 */
export interface ProcessedSnapshot {
    id: string;
    receivedAt: string;
    checksum: string;
}

/**
 * Доменный сервис для обработки снимков страниц
 * Отвечает за бизнес-логику обработки снимков
 */
@Injectable()
export class SnapshotDomainService {
    private readonly logger = new Logger(SnapshotDomainService.name);

    constructor(
        private readonly snapshotRepository: SnapshotRepository,
        private readonly idGenerator: SnapshotIdGenerator,
        private readonly checksumCalculator: SnapshotChecksumCalculator
    ) { }

    /**
     * Обрабатывает снимок страницы согласно бизнес-правилам
     * @param snapshotData - Данные снимка для обработки
     * @returns Результат обработки снимка
     */
    async processSnapshot(snapshotData: CreateSnapshotDto): Promise<ProcessedSnapshot> {
        this.logger.log(`Начинаем обработку снимка страницы: ${snapshotData.content.url}`);

        const id = this.idGenerator.generateId();
        const receivedAt = new Date().toISOString();
        const checksum = this.checksumCalculator.calculateChecksum(snapshotData);

        this.logger.debug(`Сгенерированный ID: ${id}`);
        this.logger.debug(`Время получения: ${receivedAt}`);
        this.logger.debug(`Контрольная сумма: ${checksum}`);

        // Проверяем, нужно ли обновлять существующий снимок
        const shouldUpdate = await this.shouldUpdateSnapshot(checksum);

        if (shouldUpdate) {
            await this.snapshotRepository.saveSnapshot(snapshotData, id, checksum);
            this.logger.log(`Снимок сохранен с ID: ${id}`);
        } else {
            this.logger.log(`Снимок не изменился, пропускаем сохранение`);
        }

        return {
            id,
            receivedAt,
            checksum
        };
    }

    /**
     * Проверяет, нужно ли обновлять существующий снимок
     * @param newChecksum - Новая контрольная сумма
     * @returns true если нужно обновить, false если снимок не изменился
     */
    private async shouldUpdateSnapshot(newChecksum: string): Promise<boolean> {
        try {
            const existingChecksum = await this.snapshotRepository.getExistingChecksum();
            return existingChecksum !== newChecksum;
        } catch {
            // Если не удалось получить существующую контрольную сумму, 
            // значит снимка еще нет - нужно создать
            return true;
        }
    }
}
