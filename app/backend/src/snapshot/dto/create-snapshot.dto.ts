import { IsString, IsObject, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ContentDto {
    @IsString()
    @IsNotEmpty()
    html: string;

    @IsString()
    @IsNotEmpty()
    url: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    timestamp: string;
}

export class CreateSnapshotDto {
    @IsObject()
    @ValidateNested()
    @Type(() => ContentDto)
    content: ContentDto;

    @IsString()
    @IsNotEmpty()
    userAgent: string;
}
