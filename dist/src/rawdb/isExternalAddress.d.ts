import { EntityManager } from 'typeorm';
export declare function isExternalAddress(manager: EntityManager, address: string): Promise<boolean>;
