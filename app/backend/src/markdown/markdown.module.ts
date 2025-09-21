import { Module } from '@nestjs/common';
import { MarkdownController } from './markdown.controller';
import { MarkdownService } from './markdown.service';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    controllers: [MarkdownController],
    providers: [MarkdownService],
    exports: [MarkdownService]
})
export class MarkdownModule { }
