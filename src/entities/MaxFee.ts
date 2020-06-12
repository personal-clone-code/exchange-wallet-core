import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from "typeorm";
import { Utils } from 'sota-common';

@Entity('max_fee')
export class MaxFee {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  public id: number;

  @Column({ name: 'currency', type: 'varchar', nullable: false })
  public currency: string;

  @Column({
    name: 'price_by_usd',
    type: 'decimal',
    precision: 20,
    scale: 8,
    nullable: false,
  })
  public priceByUsd: string;

  @Column({
    name: 'estimate_fee',
    type: 'decimal',
    precision: 40,
    scale: 8,
    nullable: false,
  })
  public estimateFee: string;

  @Column({
    name: 'fee_by_usd',
    type: 'decimal',
    precision: 20,
    scale: 8,
    nullable: false,
    comment: 'calculated according to the formula: price_by_usd * (estimate_fee/decimal)'
  })
  public feeByUsd: string;

  @Column({ name: 'created_at', type: 'bigint', nullable: true })
  public createdAt: number;

  @Column({ name: 'updated_at', type: 'bigint', nullable: true })
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
