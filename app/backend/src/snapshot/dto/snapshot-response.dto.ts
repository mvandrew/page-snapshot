import { ApiProperty } from '@nestjs/swagger';

export class SnapshotDataDto {
    @ApiProperty({
        description: 'Уникальный идентификатор снимка',
        example: 'snapshot_abc123_def456'
    })
    id: string;

    @ApiProperty({
        description: 'Время получения снимка сервером',
        example: '2024-01-01T12:00:01.000Z',
        format: 'date-time'
    })
    receivedAt: string;

    @ApiProperty({
        description: 'SHA-256 контрольная сумма снимка',
        example: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'
    })
    checksum: string;
}

export class SnapshotResponseDto {
    @ApiProperty({
        description: 'Статус выполнения операции',
        example: true
    })
    success: boolean;

    @ApiProperty({
        description: 'Сообщение о результате операции',
        example: 'Снимок страницы успешно получен'
    })
    message: string;

    @ApiProperty({
        description: 'Данные о созданном снимке',
        type: SnapshotDataDto,
        required: false
    })
    data?: SnapshotDataDto;
}
