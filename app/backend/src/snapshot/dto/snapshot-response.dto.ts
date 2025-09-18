export class SnapshotResponseDto {
    success: boolean;
    message: string;
    data?: {
        id: string;
        receivedAt: string;
    };
}
