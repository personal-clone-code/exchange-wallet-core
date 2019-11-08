import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { LocalTx, WithdrawalTx, UserCurrency } from '../entities';
import { LocalTxType } from '../Enums';
import { Utils, getLogger, CurrencyRegistry } from 'sota-common';

const logger = getLogger('doRestoreLocalWithdrawalTx');

const maxItemsPerTime = 50;
export async function doRestoreLocalWithdrawalTx(): Promise<void> {
  await getConnection().transaction(async manager => {
    const maxItems = await manager.getRepository(WithdrawalTx).count();
    const maxPage = Math.ceil(maxItems / maxItemsPerTime);
    const pages: number[] = [];
    // generate sequential array
    for (let i = 0; i < maxPage; i++) {
      pages.push(i);
    }
    for (const page of pages) {
      const withdrawalTxs = await manager.getRepository(WithdrawalTx).find({
        take: maxItemsPerTime,
        skip: page * maxItemsPerTime,
      });
      await _execute(manager, withdrawalTxs);
    }
  });
  process.exit(0);
}

async function _execute(manager: EntityManager, withdrawalTxs: WithdrawalTx[]): Promise<void> {
  const tasks = withdrawalTxs.map(async withdrawalTx => {
    // check transaction has existsed in local tx table
    const localTx = await manager.getRepository(LocalTx).findOne({
      txid: withdrawalTx.txid,
    });
    if (localTx) {
      logger.debug(`Tx ${withdrawalTx.txid} has already existsed in local tx, will not write to db.`);
      return null;
    }
    const currency = CurrencyRegistry.getOneCurrency(withdrawalTx.currency);
    const nativeCurrency = CurrencyRegistry.getOneCurrency(currency.platform);
    const userCurrency = await manager.findOne(UserCurrency, {
      userId: withdrawalTx.userId,
      systemSymbol: withdrawalTx.currency,
    });

    const newLocalTx = new LocalTx();
    newLocalTx.userId = withdrawalTx.userId;
    newLocalTx.walletId = withdrawalTx.walletId;
    newLocalTx.fromAddress = withdrawalTx.hotWalletAddress;
    newLocalTx.toAddress = '';
    newLocalTx.currency = withdrawalTx.currency;
    newLocalTx.currencySymbol = userCurrency ? userCurrency.customSymbol : withdrawalTx.currency;
    newLocalTx.amount = '0';
    newLocalTx.type = LocalTxType.WITHDRAWAL_NORMAL;
    newLocalTx.refCurrency = withdrawalTx.currency;
    newLocalTx.refCurrencySymbol = userCurrency ? userCurrency.customSymbol : withdrawalTx.currency;
    newLocalTx.refTable = 'withdrawal';
    newLocalTx.refId = 0;
    newLocalTx.note = '';
    newLocalTx.status = withdrawalTx.status;
    newLocalTx.txid = withdrawalTx.txid;
    newLocalTx.unsignedRaw = withdrawalTx.unsignedRaw;
    newLocalTx.unsignedTxid = withdrawalTx.unsignedTxid;
    newLocalTx.feeAmount = withdrawalTx.feeAmount;
    newLocalTx.feeCurrency = nativeCurrency.symbol;
    newLocalTx.createdAt = Utils.nowInMillis();
    newLocalTx.updatedAt = Utils.nowInMillis();

    return newLocalTx;
  });

  let localTxs = await Utils.PromiseAll(tasks);
  localTxs = _.compact(localTxs);
  // insert into db
  if (localTxs && localTxs.length !== 0) {
    await manager.getRepository(LocalTx).insert(localTxs);
  }
  return;
}
