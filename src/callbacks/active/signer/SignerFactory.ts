import { LocalTx } from '../../../entities';
import { BaseSigner } from './BaseSigner';
import { CollectingSigner } from './CollectingSigner';
import { WithdrawalSigner } from './WithdrawalSigner';
import { SeedingSigner } from './SeedingSigner';
import { WithdrawalCollectSigner } from './WithdrawalCollectSigner';

export class SignerFactory {
  public static getSigner(localTx: LocalTx): BaseSigner {
    if (localTx.isSeedTx()) {
      return new SeedingSigner(localTx);
    } else if (localTx.isWithdrawal()) {
      return new WithdrawalSigner(localTx);
    } else if (localTx.isCollectTx()) {
      return new CollectingSigner(localTx);
    } else if (localTx.isWithdrawalCollect) {
      return new WithdrawalCollectSigner(localTx);
    }
    throw new Error('Not support signer for localTxType: ' + localTx.type);
  }
}
