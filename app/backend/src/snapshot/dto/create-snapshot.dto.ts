import { IsString, IsObject, IsNotEmpty, ValidateNested, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidUrl } from '../validators/url.validator';
import { IsValidTimestamp } from '../validators/timestamp.validator';

export class ContentDto {
    @ApiProperty({
        description: 'Полный HTML код страницы',
        example: '<!doctype html><html><head><title>Example Page</title></head><body><h1>Hello World</h1></body></html>',
        minLength: 1
    })
    @IsString({ message: 'HTML контент должен быть строкой' })
    @IsNotEmpty({ message: 'HTML контент не может быть пустым' })
    @MinLength(1, { message: 'HTML контент не может быть пустым' })
    html: string;

    @ApiProperty({
        description: 'URL страницы',
        example: 'https://example.com/page',
        format: 'uri'
    })
    @IsString({ message: 'URL должен быть строкой' })
    @IsNotEmpty({ message: 'URL не может быть пустым' })
    @IsValidUrl({ message: 'URL должен быть в корректном формате' })
    url: string;

    @ApiProperty({
        description: 'Заголовок страницы',
        example: 'Example Page Title',
        minLength: 1,
        maxLength: 500
    })
    @IsString({ message: 'Title должен быть строкой' })
    @IsNotEmpty({ message: 'Title не может быть пустым' })
    @MinLength(1, { message: 'Title не может быть пустым' })
    @MaxLength(500, { message: 'Title не может быть длиннее 500 символов' })
    title: string;

    @ApiProperty({
        description: 'Временная метка создания снимка в формате ISO 8601',
        example: '2024-01-01T12:00:00.000Z',
        format: 'date-time'
    })
    @IsString({ message: 'Timestamp должен быть строкой' })
    @IsNotEmpty({ message: 'Timestamp не может быть пустым' })
    @IsValidTimestamp({ message: 'Timestamp должен быть в корректном формате даты' })
    timestamp: string;
}

export class CreateSnapshotDto {
    @ApiProperty({
        description: 'Данные содержимого страницы',
        type: ContentDto
    })
    @IsObject({ message: 'Content должен быть объектом' })
    @ValidateNested({ message: 'Content должен быть валидным объектом' })
    @Type(() => ContentDto)
    content: ContentDto;

    @ApiProperty({
        description: 'User Agent браузера',
        example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        minLength: 1,
        maxLength: 1000
    })
    @IsString({ message: 'User Agent должен быть строкой' })
    @IsNotEmpty({ message: 'User Agent не может быть пустым' })
    @MinLength(1, { message: 'User Agent не может быть пустым' })
    @MaxLength(1000, { message: 'User Agent не может быть длиннее 1000 символов' })
    userAgent: string;
}
