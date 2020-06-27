import { Setting } from '../entities/Setting';
import { EntityManager } from 'typeorm';
export declare function findSettingByKey(manager: EntityManager, key: string): Promise<Setting>;
