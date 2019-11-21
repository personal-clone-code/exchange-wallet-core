import { BaseHotWalletSigner } from './BaseHotWalletSigner';

export class SeedingSigner extends BaseHotWalletSigner {
  protected async updateRelatedTables(): Promise<void> {
    // do nothing
  }
}
