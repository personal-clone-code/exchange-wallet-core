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
    await rawdb.insertWithdrawalLogs(
      this.manager,
      [this.localTx.id],
      WithdrawalEvent.SIGNED,
      this.localTx.id,
      this.localTx.txid
    );
  }
}
