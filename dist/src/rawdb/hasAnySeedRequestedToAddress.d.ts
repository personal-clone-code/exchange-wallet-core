import { EntityManager } from 'typeorm';
export declare function hasAnySeedRequestedToAddress(manager: EntityManager, address: string): Promise<boolean>;
export declare function seedRecordToAddressIsExist(manager: EntityManager, address: string): Promise<boolean>;
