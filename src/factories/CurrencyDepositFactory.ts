import { Currency } from 'sota-common';
import { XDeposit } from '../entities';

/**
 * To instantiate XxxDeposit entity
 */

const registry = new Map<Currency, () => XDeposit>();

export const CurrencyDepositFactory = {
  register(currency: Currency, callback: () => XDeposit) {
    registry.set(currency, callback);
  },

  create(currency: Currency): XDeposit {
    const callback = registry.get(currency);
    if (!callback) {
      throw new Error(`Callback for currency ${currency} wasn't set yet.`);
    }

    return callback();
  },
};

export default CurrencyDepositFactory;
