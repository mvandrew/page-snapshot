import { Injectable } from '@nestjs/common';

/**
 * Сервис для генерации уникальных идентификаторов снимков
 */
@Injectable()
export class SnapshotIdGenerator {
    /**
     * Генерирует уникальный ID для снимка
     * Использует комбинацию временной метки и случайного числа
     * @returns Уникальный идентификатор снимка
     */
    generateId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `snapshot_${timestamp}_${random}`;
    }
}
