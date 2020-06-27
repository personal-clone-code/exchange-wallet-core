import { EntityManager, ObjectType } from 'typeorm';
interface IEntity {
    updatedAt: number;
}
export declare function updateRecordsTimestamp(manager: EntityManager, entityClass: ObjectType<IEntity>, ids: number[]): Promise<void>;
export default updateRecordsTimestamp;
