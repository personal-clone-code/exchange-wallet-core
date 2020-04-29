import { EntityManager } from 'typeorm';
import { WebhookType, WithdrawalEvent, DepositEvent } from '../Enums';
export declare function insertWebhookProgress(manager: EntityManager, userId: number, type: WebhookType, refId: number, event: DepositEvent | WithdrawalEvent): Promise<void>;
export default insertWebhookProgress;
