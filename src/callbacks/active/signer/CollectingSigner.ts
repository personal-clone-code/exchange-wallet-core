import { BaseSigner } from './BaseSigner';
import * as rawdb from '../../../rawdb';
import { Address, Deposit } from '../../../entities';
import { CollectStatus } from '../../../Enums';

export class CollectingSigner extends BaseSigner {
  protected signingAddresses: Address[];
  protected deposits: Deposit[];

  protected async prepare(): Promise<void> {
    this.deposits = await rawdb.findDepositsInCollectingTx(this.manager, this.localTx.id);
    this.signingAddresses = await rawdb.findAddresses(this.manager, this.deposits.map(e => e.toAddress));
  }

  protected async isBusy(): Promise<boolean> {
    for (let i = 0, len = this.signingAddresses.length; i < len; i++) {
      if (await rawdb.checkAddressBusy(this.manager, this.signingAddresses[i].address)) {
        return true;
      }
    }
    return false;
  }

  protected async signTx(): Promise<void> {
    const rawPrivateKeys = await Promise.all(this.signingAddresses.map(sa => sa.extractRawPrivateKey()));
    if (this.currency.isUTXOBased) {
      this.signedTx = await this.gateway.signRawTransaction(this.localTx.unsignedRaw, rawPrivateKeys);
    } else {
      this.signedTx = await this.gateway.signRawTransaction(this.localTx.unsignedRaw, rawPrivateKeys[0]);
    }
  }

  protected async updateRelatedTables(): Promise<void> {
    await Promise.all(
      this.deposits.map(deposit => {
        this.manager.getRepository(Deposit).update(
          {
            id: deposit.id,
          },
          {
            collectStatus: CollectStatus.COLLECTING,
            collectedTxid: this.signedTx.txid,
          }
        );
      })
    );
  }
}
