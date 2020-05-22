import AWS from 'aws-sdk';
export declare class Kms {
    static getInstance(): Kms;
    private connection;
    constructor();
    getMasterKey(cmkId: string): Promise<import("aws-sdk/lib/request").PromiseResult<AWS.KMS.DescribeKeyResponse, AWS.AWSError>>;
    generateDataKey(cmkId: string): Promise<{
        plain: string;
        cipher: string;
    }>;
    getDataKey(dataKeyId: number): Promise<string>;
    encrypt(plainText: string, dataKeyId: number): Promise<string>;
    decrypt(cipherText: string, dataKeyId: number): Promise<string>;
    hash(plainText: string, dataKeyId: number): Promise<string>;
    verify(plainText: string, hash: string, dataKeyId: number): Promise<boolean>;
    hashWithdrawal(wPayload: any): Promise<string>;
    verifyWithdrawal(withdrawal: any): Promise<boolean>;
    private getCachedRecordById;
    private getKMSInstanceByKeyId;
    private combineData;
}
export default Kms;
