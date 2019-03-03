import { Utils } from 'sota-common';
import { Entity, Column, PrimaryColumn, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('hot_wallet')
export class HotWallet {
  @Column('int', { name: 'user_id', nullable: false })
  public userId: number;

  @PrimaryColumn('varchar', {
    length: 100,
    name: 'address',
    nullable: false,
    primary: true,
  })
  public address: string;

  @Column('varchar', {
    length: 20,
    name: 'type',
    nullable: false,
  })
  public type: string;

  @Column('varchar', {
    length: 100,
    name: 'currency',
    nullable: false,
  })
  public currency: string;

  @Column('int', {
    default: '0',
    name: 'kms_data_key_id',
    nullable: false,
  })
  public kms_data_key_id: number;

  @Column('decimal', {
    default: '0',
    name: 'balance',
    nullable: false,
    precision: 32,
    scale: 0,
  })
  public balance: string;

  @Column('varchar', {
    length: 255,
    name: 'coin_keys',
    nullable: false,
  })
  public coinKeys: string;

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
