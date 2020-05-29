import { Setting } from '../entities/Setting';
import { EntityManager } from 'typeorm';

export async function findSettingByKey(
  manager: EntityManager,
  key: string,
): Promise<Setting> {
  return await manager.findOne(Setting, {
    where: { key },
  });
}