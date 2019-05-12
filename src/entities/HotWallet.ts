import { Utils } from 'sota-common';
import { Entity, Column, PrimaryColumn, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('hot_wallet')
export class HotWallet {
  @Column('int', { name: 'user_id', nullable: false })
  public userId: number;

  @Column('int', { name: 'wallet_id', nullable: false })
  public walletId: number;

  @PrimaryColumn({ name: 'address', nullable: false })
  public address: string;

  @Column({ name: 'currency', nullable: false })
  public currency: string;

  @Column({ name: 'type' })
  public type: string;

  @Column({ name: 'secret', nullable: false })
  public secret: string;

  @Column({ name: 'balance', nullable: false, precision: 40, scale: 8 })
  public balance: string;

  @Column({ type: 'tinyint', name: 'is_external', nullable: false })
  public isExternal: boolean;

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
