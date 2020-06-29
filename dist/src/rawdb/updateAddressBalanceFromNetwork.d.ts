import { EntityManager } from 'typeorm';
export declare function updateAddressBalanceFromNetwork(manager: EntityManager, walletId: number, currency: string, address: string): Promise<void>;
