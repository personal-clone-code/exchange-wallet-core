export declare class WebhookProgress {
    id: number;
    webhookId: number;
    type: string;
    refId: number;
    event: string;
    isProcessed: boolean;
    createdAt: number;
    updatedAt: number;
    updateCreateDates(): void;
    updateUpdateDates(): void;
}
