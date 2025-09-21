import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

/**
 * Валидатор для проверки корректности URL
 */
@ValidatorConstraint({ name: 'isValidUrl', async: false })
export class IsValidUrlConstraint implements ValidatorConstraintInterface {
    /**
     * Проверяет, является ли строка валидным URL
     * @param value - Строка для проверки
     * @returns true если URL валиден, false в противном случае
     */
    validate(value: string): boolean {
        if (typeof value !== 'string') {
            return false;
        }

        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Возвращает сообщение об ошибке валидации
     * @returns Сообщение об ошибке
     */
    defaultMessage(): string {
        return 'URL должен быть в корректном формате';
    }
}

/**
 * Декоратор для валидации URL
 * @param validationOptions - Опции валидации
 * @returns Декоратор валидации
 */
export function IsValidUrl(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidUrlConstraint,
        });
    };
}
