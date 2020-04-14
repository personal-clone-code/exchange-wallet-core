import { BaseHotWalletSigner } from './BaseHotWalletSigner';
import { Deposit } from '../../../entities';
import { CollectStatus } from '../../../Enums';

export class SeedingSigner extends BaseHotWalletSigner {
  protected async updateRelatedTables(): Promise<void> {
    this.manager.getRepository(Deposit).update(
      {
        seedLocalTxId: this.localTx.id,
      },
      {
        collectStatus: CollectStatus.SEED_SIGNED,
        seededTxid: this.signedTx.txid,
      }
    );
  }
}
