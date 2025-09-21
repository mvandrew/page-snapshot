import { Module } from '@nestjs/common';
import { MarkdownController } from './markdown.controller';
import { MarkdownService } from './markdown.service';
import { MarkdownDomainService } from './services/markdown-domain.service';
import { FileReaderService } from './services/file-reader.service';
import { PluginLoaderService } from './services/plugin-loader.service';
import { MarkdownConverterService } from './services/markdown-converter.service';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    controllers: [MarkdownController],
    providers: [
        MarkdownService,
        MarkdownDomainService,
        FileReaderService,
        PluginLoaderService,
        MarkdownConverterService
    ],
    exports: [MarkdownService]
})
export class MarkdownModule { }
