import { IsString, IsObject, IsNotEmpty, ValidateNested, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IsValidUrl } from '../validators/url.validator';
import { IsValidTimestamp } from '../validators/timestamp.validator';

export class ContentDto {
    @IsString({ message: 'HTML контент должен быть строкой' })
    @IsNotEmpty({ message: 'HTML контент не может быть пустым' })
    @MinLength(1, { message: 'HTML контент не может быть пустым' })
    html: string;

    @IsString({ message: 'URL должен быть строкой' })
    @IsNotEmpty({ message: 'URL не может быть пустым' })
    @IsValidUrl({ message: 'URL должен быть в корректном формате' })
    url: string;

    @IsString({ message: 'Title должен быть строкой' })
    @IsNotEmpty({ message: 'Title не может быть пустым' })
    @MinLength(1, { message: 'Title не может быть пустым' })
    @MaxLength(500, { message: 'Title не может быть длиннее 500 символов' })
    title: string;

    @IsString({ message: 'Timestamp должен быть строкой' })
    @IsNotEmpty({ message: 'Timestamp не может быть пустым' })
    @IsValidTimestamp({ message: 'Timestamp должен быть в корректном формате даты' })
    timestamp: string;
}

export class CreateSnapshotDto {
    @IsObject({ message: 'Content должен быть объектом' })
    @ValidateNested({ message: 'Content должен быть валидным объектом' })
    @Type(() => ContentDto)
    content: ContentDto;

    @IsString({ message: 'User Agent должен быть строкой' })
    @IsNotEmpty({ message: 'User Agent не может быть пустым' })
    @MinLength(1, { message: 'User Agent не может быть пустым' })
    @MaxLength(1000, { message: 'User Agent не может быть длиннее 1000 символов' })
    userAgent: string;
}
