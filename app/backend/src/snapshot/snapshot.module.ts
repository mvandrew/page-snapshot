import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { SnapshotController } from './snapshot.controller';
import { SnapshotService } from './snapshot.service';
import { SnapshotValidatorService } from './services/snapshot-validator.service';
import { SnapshotDomainService } from './services/snapshot-domain.service';
import { SnapshotRepository } from './services/snapshot.repository';
import { SnapshotIdGenerator } from './services/snapshot-id.generator';
import { SnapshotChecksumCalculator } from './services/snapshot-checksum.calculator';

@Module({
    imports: [SharedModule],
    controllers: [SnapshotController],
    providers: [
        SnapshotService,
        SnapshotValidatorService,
        SnapshotDomainService,
        SnapshotRepository,
        SnapshotIdGenerator,
        SnapshotChecksumCalculator
    ],
    exports: [SnapshotService, SnapshotValidatorService],
})
export class SnapshotModule { }
