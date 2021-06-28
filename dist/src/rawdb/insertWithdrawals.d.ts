import { EntityManager } from "typeorm";
import { Deposit } from "../entities";
import { BigNumber } from "sota-common";
export declare function insertWithdrawals(manager: EntityManager, records: Deposit[], toAddress: string, userId: number): Promise<Map<number, number>>;
export declare function insertWithdrawal(manager: EntityManager, records: Deposit[], toAddress: string, userId: number, amount: BigNumber): Promise<Map<number, number>>;
