export declare class KmsDataKey {
    id: number;
    cmkId: string;
    encryptedDataKey: string;
    isEnabled: number;
    createdAt: number;
    updatedAt: number;
    updateCreateDates(): void;
    updateUpdateDates(): void;
}
