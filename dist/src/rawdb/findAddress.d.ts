import { Address } from '../entities';
import { EntityManager } from 'typeorm';
export declare function findAddresses(manager: EntityManager, addresses: string[]): Promise<Address[]>;
export declare function findAddress(manager: EntityManager, address: string): Promise<Address>;
export declare function checkAddressBusy(manager: EntityManager, address: string): Promise<boolean>;
export declare function checkAddressIsBusy(manager: EntityManager, hotWallet: Address, pendingStatuses: string[], platform: string): Promise<boolean>;
