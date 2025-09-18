import { Controller, Post, Body, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { SnapshotService } from './snapshot.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { SnapshotResponseDto } from './dto/snapshot-response.dto';

@Controller('api/snapshot')
export class SnapshotController {
    constructor(private readonly snapshotService: SnapshotService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async createSnapshot(@Body() snapshotData: CreateSnapshotDto): Promise<SnapshotResponseDto> {
        try {
            // Валидация входящих данных
            this.validateSnapshotData(snapshotData);

            // Обработка данных (пока только логирование)
            const result = await this.snapshotService.processSnapshot(snapshotData);

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
            // Если ошибка связана с сохранением файлов, возвращаем 500
            if (error.message.includes('Не удалось сохранить снимок')) {
                throw new HttpException(
                    {
                        success: false,
                        message: error.message
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            
            // Для других ошибок возвращаем 400
            throw new HttpException(
                {
                    success: false,
                    message: `Ошибка обработки снимка: ${error.message}`
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    private validateSnapshotData(data: CreateSnapshotDto): void {
        if (!data) {
            throw new Error('Данные снимка не предоставлены');
        }

        if (!data.content || typeof data.content !== 'object') {
            throw new Error('Неверная структура данных content');
        }

        if (!data.content.html || typeof data.content.html !== 'string') {
            throw new Error('HTML контент не предоставлен или неверного типа');
        }

        if (!data.content.url || typeof data.content.url !== 'string') {
            throw new Error('URL страницы не предоставлен или неверного типа');
        }

        if (!data.userAgent || typeof data.userAgent !== 'string') {
            throw new Error('User Agent не предоставлен или неверного типа');
        }

        // Валидация URL
        try {
            new URL(data.content.url);
        } catch {
            throw new Error('Неверный формат URL');
        }

        // Валидация timestamp
        const timestamp = new Date(data.content.timestamp);
        if (isNaN(timestamp.getTime())) {
            throw new Error('Неверный формат временной метки');
        }
    }
}
