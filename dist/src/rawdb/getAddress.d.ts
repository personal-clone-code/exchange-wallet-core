import { EntityManager } from 'typeorm';
import { Address, HotWallet } from '../entities';
export declare function getAllAddress(manager: EntityManager): Promise<Address[]>;
export declare function getAllHotWalletAddress(manager: EntityManager): Promise<HotWallet[]>;
export declare function updateAddresses(manager: EntityManager, addresses: Address[]): Promise<void>;
export declare function updateAllHotWalletAddresses(manager: EntityManager, addresses: HotWallet[]): Promise<void>;
export declare function getOneAddress(manager: EntityManager, currency: string, address: string): Promise<Address>;
