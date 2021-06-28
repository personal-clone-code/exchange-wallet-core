import { EntityManager } from 'typeorm';
import { WithdrawalStatus } from '../Enums';
export declare function hasAnyCollectFromAddressToAddress(manager: EntityManager, currency: string, withdrawalStatuses: WithdrawalStatus[], toAddress: string, fromAddress?: string): Promise<boolean>;
