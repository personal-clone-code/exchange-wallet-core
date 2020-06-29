import { EntityManager } from 'typeorm';
import { Withdrawal } from '../entities';
import { BlockchainPlatform as Platform } from 'sota-common';
export declare function getNextPickedWithdrawals(manager: EntityManager, platform: Platform): Promise<Withdrawal[]>;
