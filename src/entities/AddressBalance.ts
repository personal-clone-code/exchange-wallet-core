import { Entity, PrimaryColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Utils } from 'sota-common';

@Entity('address_balance')
export class AddressBalance {
  @PrimaryColumn({ name: 'wallet_id' })
  public walletId: number;

  @PrimaryColumn({ name: 'currency' })
  public currency: string;

  @PrimaryColumn({ name: 'address' })
  public address: string;

  @Column({ name: 'balance', nullable: false })
  public balance: string;

  @Column({ name: 'created_at', type: 'bigint' })
  public createdAt: number;

  @Column({ name: 'updated_at', type: 'bigint' })
  public updatedAt: number;

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
