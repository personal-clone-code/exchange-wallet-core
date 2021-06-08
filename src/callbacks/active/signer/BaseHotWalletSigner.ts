import { BaseSigner } from './BaseSigner';
import { HotWallet, LocalTx } from '../../../entities';
import * as rawdb from '../../../rawdb';
import { LocalTxStatus } from '../../../Enums';
import { HotWalletType } from 'sota-common';

export abstract class BaseHotWalletSigner extends BaseSigner {
  protected hotWallet: HotWallet;

  protected async prepare(): Promise<void> {
    const platform = this.currency.family || this.currency.platform;
    this.hotWallet = await rawdb.getOneHotWallet(this.manager, platform, this.localTx.fromAddress);
    if (this.hotWallet.type !== HotWalletType.Normal && this.hotWallet.type !== HotWalletType.Seed) {
      throw new Error('Only support normal or seed hotWallet, but current type: ' + this.hotWallet.type);
    }
  }

  protected async isBusy(): Promise<boolean> {
    return rawdb.checkHotWalletIsBusy(
      this.manager,
      this.hotWallet,
      [LocalTxStatus.SIGNED, LocalTxStatus.SENT],
      this.currency.platform
    );
  }

  protected async signTx(): Promise<void> {
    const rawPrivateKey = await this.hotWallet.extractRawPrivateKey();
    this.signedTx = await this.gateway.signRawTransaction(this.localTx.unsignedRaw, rawPrivateKey);
  }
}
