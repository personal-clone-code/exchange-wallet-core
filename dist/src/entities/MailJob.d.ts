export declare class MailJob {
    id: number;
    senderName: string;
    senderAddress: string;
    recipientAddress: string;
    title: string;
    templateName: string;
    content: string;
    isSent: boolean;
    retryCount: number;
    createdAt: number;
    updatedAt: number;
    updateCreateDates(): void;
    updateUpdateDates(): void;
}
