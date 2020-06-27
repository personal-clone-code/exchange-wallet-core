import { BigNumber, ICurrency, BlockchainPlatform } from 'sota-common';
import { EntityManager } from 'typeorm';
import { HotWallet, LocalTx, Address } from '../entities';
export declare function checkUpperThreshold(manager: EntityManager, platform: BlockchainPlatform): Promise<void>;
export declare function upperThresholdHandle(manager: EntityManager, iCurrency: ICurrency, hotWallet: HotWallet): Promise<void>;
export declare function lowerThresholdHandle(manager: EntityManager, sentRecord: LocalTx): Promise<void>;
export declare function checkHotWalletIsSufficient(hotWallet: HotWallet, currency: ICurrency, amount: BigNumber): Promise<boolean>;
export declare function checkAddressIsSufficient(address: Address, currency: ICurrency, amount: BigNumber): Promise<boolean>;
export declare function _lowerThresholdHandle(manager: EntityManager, sentRecord: LocalTx, hotWallet: HotWallet, currency: string): Promise<void>;
