import { Controller, Post, Body, HttpCode, HttpStatus, HttpException, UseFilters } from '@nestjs/common';
import { SnapshotService } from './snapshot.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { SnapshotResponseDto } from './dto/snapshot-response.dto';
import { SnapshotValidatorService } from './services/snapshot-validator.service';
import { ValidationExceptionFilter } from '../shared/filters/validation-exception.filter';

@Controller('api/snapshot')
@UseFilters(ValidationExceptionFilter)
export class SnapshotController {
    constructor(
        private readonly snapshotService: SnapshotService,
        private readonly snapshotValidator: SnapshotValidatorService
    ) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async createSnapshot(@Body() snapshotData: CreateSnapshotDto): Promise<SnapshotResponseDto> {
        console.log('=== ПОЛУЧЕН ЗАПРОС НА СОЗДАНИЕ СНИМКА ===');
        console.log('Время запроса:', new Date().toISOString());
        console.log('Размер payload:', JSON.stringify(snapshotData).length, 'байт');

        try {
            // Валидация входящих данных
            await this.snapshotValidator.validateSnapshotData(snapshotData);

            // Обработка данных (пока только логирование)
            const result = await this.snapshotService.processSnapshot(snapshotData);

            console.log('=== СНИМОК УСПЕШНО ОБРАБОТАН ===');
            console.log('Результат:', result);

            return {
                success: true,
                message: 'Снимок страницы успешно получен',
                data: {
                    id: result.id,
                    receivedAt: result.receivedAt,
                    checksum: result.checksum
                }
            };
        } catch (error) {
            console.error('=== ОШИБКА ПРИ ОБРАБОТКЕ СНИМКА ===');
            console.error('Тип ошибки:', error.constructor.name);
            console.error('Сообщение ошибки:', error.message);
            console.error('Стек ошибки:', error.stack);

            // Если ошибка связана с сохранением файлов, возвращаем 500
            if (error.message.includes('Не удалось сохранить снимок')) {
                console.error('Ошибка сохранения файлов, возвращаем 500');
                throw new HttpException(
                    {
                        success: false,
                        message: error.message
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            // Для других ошибок возвращаем 400
            console.error('Ошибка валидации, возвращаем 400');
            throw new HttpException(
                {
                    success: false,
                    message: `Ошибка обработки снимка: ${error.message}`
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

}
