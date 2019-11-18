import { Utils } from 'sota-common';
import { Entity, BeforeInsert, BeforeUpdate, PrimaryColumn, Column } from 'typeorm';

@Entity('wallet_balance')
export class WalletBalance {
  @PrimaryColumn({ name: 'wallet_id', nullable: false })
  public walletId: number;

  @PrimaryColumn({ name: 'currency', nullable: false })
  public currency: string;

  @Column({ name: 'created_at', type: 'bigint' })
  public createdAt: number;

  @Column({ name: 'updated_at', type: 'bigint' })
  public updatedAt: number;

  @Column({ name: 'balance', nullable: false })
  public balance: string;

  @BeforeInsert()
  public updateCreateDates() {
    this.createdAt = Utils.nowInMillis();
    this.updatedAt = Utils.nowInMillis();
  }

  @BeforeUpdate()
  public updateUpdateDates() {
    this.updatedAt = Utils.nowInMillis();
  }
}
