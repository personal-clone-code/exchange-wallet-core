import { ICurrency } from 'sota-common';
import { XDeposit } from '../entities';
export declare const CurrencyDepositFactory: {
    register(currency: ICurrency, callback: () => XDeposit): void;
    create(currency: ICurrency): XDeposit;
};
export default CurrencyDepositFactory;
