import { Entity, BeforeInsert, BeforeUpdate, Column, PrimaryColumn } from 'typeorm';
import { Utils } from 'sota-common';

@Entity('currency')
export class Currency {
  @Column('int', { name: 'user_id', nullable: false })
  public userId: number;

  @Column('int', { name: 'wallet_id', nullable: false })
  public walletId: number;

  @Column({ name: 'symbol', nullable: false })
  public symbol: string;

  @Column({
    name: 'minimum_withdrawal',
    type: 'decimal',
    precision: 40,
    scale: 8,
    nullable: false,
  })
  public minimumWithdrawal: string;

  @Column({
    name: 'minimum_collect_amount',
    type: 'decimal',
    precision: 40,
    scale: 8,
    nullable: false,
  })
  public minimumCollectAmount: string;

  @Column({
    name: 'lower_threshold',
    type: 'decimal',
    precision: 40,
    scale: 8,
    nullable: false,
  })
  public lowerThreshold: string;

  @Column({
    name: 'upper_threshold',
    type: 'decimal',
    precision: 40,
    scale: 8,
    nullable: false,
  })
  public upperThreshold: string;

  @Column({
    name: 'middle_threshold',
    type: 'decimal',
    precision: 40,
    scale: 8,
    nullable: true,
  })
  public middleThreshold: string;

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
