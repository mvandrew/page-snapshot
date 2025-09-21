import { CreateSnapshotDto } from '../dto/create-snapshot.dto';

/**
 * Интерфейс для валидации данных снимков страниц
 */
export interface ISnapshotValidator {
    /**
     * Валидирует данные снимка страницы
     * @param data - Данные снимка для валидации
     * @throws Error если данные невалидны
     */
    validateSnapshotData(data: CreateSnapshotDto): void;
}
