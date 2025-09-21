import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

/**
 * Валидатор для проверки корректности временной метки
 */
@ValidatorConstraint({ name: 'isValidTimestamp', async: false })
export class IsValidTimestampConstraint implements ValidatorConstraintInterface {
    /**
     * Проверяет, является ли строка валидной временной меткой
     * @param value - Строка для проверки
     * @returns true если timestamp валиден, false в противном случае
     */
    validate(value: string): boolean {
        if (typeof value !== 'string') {
            return false;
        }

        try {
            const date = new Date(value);
            return !isNaN(date.getTime());
        } catch {
            return false;
        }
    }

    /**
     * Возвращает сообщение об ошибке валидации
     * @returns Сообщение об ошибке
     */
    defaultMessage(): string {
        return 'Timestamp должен быть в корректном формате даты';
    }
}

/**
 * Декоратор для валидации временной метки
 * @param validationOptions - Опции валидации
 * @returns Декоратор валидации
 */
export function IsValidTimestamp(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidTimestampConstraint,
        });
    };
}
