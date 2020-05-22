import { ICurrency } from 'sota-common';
import { EntityManager } from 'typeorm';
export declare function filterWatchingAddresses(manager: EntityManager, c: ICurrency, addresses: string[]): Promise<string[]>;
export default filterWatchingAddresses;
