import { Injectable, Logger } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateSnapshotDto } from '../dto/create-snapshot.dto';
import { ISnapshotValidator } from '../interfaces/snapshot-validator.interface';

/**
 * Сервис для валидации данных снимков страниц
 * Использует class-validator для декларативной валидации
 */
@Injectable()
export class SnapshotValidatorService implements ISnapshotValidator {
    private readonly logger = new Logger(SnapshotValidatorService.name);

    /**
     * Валидирует данные снимка страницы
     * @param data - Данные снимка для валидации
     * @throws Error если данные невалидны
     */
    async validateSnapshotData(data: CreateSnapshotDto): Promise<void> {
        this.logger.debug('Начало валидации данных снимка', {
            hasData: !!data,
            dataKeys: data ? Object.keys(data) : 'N/A'
        });

        // Преобразуем plain object в класс для валидации
        const snapshotDto = plainToClass(CreateSnapshotDto, data);

        // Выполняем валидацию
        const errors: ValidationError[] = await validate(snapshotDto, {
            whitelist: true,
            forbidNonWhitelisted: true
        });

        if (errors.length > 0) {
            this.logger.error('Ошибки валидации данных снимка', {
                errorCount: errors.length,
                errors: this.formatValidationErrors(errors)
            });

            throw new Error(this.formatValidationErrors(errors).join('; '));
        }

        this.logger.debug('Валидация данных снимка прошла успешно');
    }

    /**
     * Форматирует ошибки валидации в читаемый вид
     * @param errors - Массив ошибок валидации
     * @returns Массив строк с описанием ошибок
     */
    private formatValidationErrors(errors: ValidationError[]): string[] {
        const formattedErrors: string[] = [];

        for (const error of errors) {
            if (error.constraints) {
                // Ошибки на уровне поля
                const fieldErrors = Object.values(error.constraints);
                formattedErrors.push(...fieldErrors);
            }

            if (error.children && error.children.length > 0) {
                // Рекурсивно обрабатываем вложенные ошибки
                const childErrors = this.formatValidationErrors(error.children);
                formattedErrors.push(...childErrors);
            }
        }

        return formattedErrors;
    }
}
