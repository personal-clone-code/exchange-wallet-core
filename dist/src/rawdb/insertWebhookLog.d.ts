import { EntityManager } from 'typeorm';
export declare function insertWebhookLog(manager: EntityManager, progressId: number, url: string, params: string, status: number, msg: string): Promise<void>;
