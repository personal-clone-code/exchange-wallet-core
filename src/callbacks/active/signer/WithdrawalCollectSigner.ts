import { BaseHotWalletSigner } from './BaseHotWalletSigner';
import { Withdrawal, Address } from '../../../entities';
import { LocalTxStatus, WithdrawalEvent } from '../../../Enums';
import * as rawdb from '../../../rawdb';
import { BaseSigner } from './BaseSigner';

export class WithdrawalCollectSigner extends BaseSigner {
  protected address: Address;

  protected async prepare(): Promise<void> {
    this.address = await rawdb.getOneAddress(this.manager, this.currency.platform, this.localTx.fromAddress);
  }

  protected async isBusy(): Promise<boolean> {
    return rawdb.checkAddressIsBusy(
      this.manager,
      this.address,
      [LocalTxStatus.SIGNED, LocalTxStatus.SENT],
      this.currency.platform
    );
  }

  protected async signTx(): Promise<void> {
    const rawPrivateKey = await this.address.extractRawPrivateKey();
    this.signedTx = await this.gateway.signRawTransaction(this.localTx.unsignedRaw, rawPrivateKey);
  }

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
