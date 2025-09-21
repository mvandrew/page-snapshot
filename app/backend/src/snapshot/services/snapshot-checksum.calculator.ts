import { Injectable } from '@nestjs/common';
import { CreateSnapshotDto } from '../dto/create-snapshot.dto';
import * as crypto from 'crypto';

/**
 * Сервис для вычисления контрольных сумм снимков
 */
@Injectable()
export class SnapshotChecksumCalculator {
    /**
     * Вычисляет SHA-256 контрольную сумму для данных снимка
     * Использует HTML контент и URL для определения уникальности
     * @param snapshotData - Данные снимка для вычисления контрольной суммы
     * @returns SHA-256 хэш в шестнадцатеричном формате
     */
    calculateChecksum(snapshotData: CreateSnapshotDto): string {
        const dataToHash = JSON.stringify({
            html: snapshotData.content.html,
            url: snapshotData.content.url
        });

        return crypto.createHash('sha256').update(dataToHash, 'utf8').digest('hex');
    }
}
