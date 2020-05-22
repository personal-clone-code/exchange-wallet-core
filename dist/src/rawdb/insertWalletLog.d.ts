import { EntityManager } from 'typeorm';
import { WalletLog } from '../entities';
export declare function insertWalletLog(manager: EntityManager, data: WalletLog): Promise<void>;
export default insertWalletLog;
