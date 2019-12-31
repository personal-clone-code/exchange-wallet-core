import { BaseHotWalletSigner } from './BaseHotWalletSigner';
import { Withdrawal } from '../../../entities';
import { LocalTxStatus, WithdrawalEvent } from '../../../Enums';
import * as rawdb from '../../../rawdb';

export class WithdrawalSigner extends BaseHotWalletSigner {
  protected async updateRelatedTables(): Promise<void> {
    await this.manager.getRepository(Withdrawal).update(
      { withdrawalTxId: this.localTx.id },
      {
        status: LocalTxStatus.SIGNED,
        txid: this.signedTx.txid,
      }
    );

    const withdrawals = await this.manager.getRepository(Withdrawal).find({ withdrawalTxId: this.localTx.id });
    await rawdb.insertWithdrawalLogs(
      this.manager,
      withdrawals.map(w => w.id),
      WithdrawalEvent.SIGNED,
      this.localTx.id,
      this.localTx.txid
    );
  }
}
