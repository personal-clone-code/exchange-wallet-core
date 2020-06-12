import { Entity, PrimaryColumn, Column, BeforeInsert, BeforeUpdate } from "typeorm";
import { Utils } from 'sota-common';

@Entity('coinmarketcap_key')
export class CoinMarketCapKey {
  @PrimaryColumn({ name: 'id', type: 'int', nullable: false, unsigned: true })
  public id: number;

  @Column({ name: 'key', type: 'varchar', nullable: false })
  public key: string;

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
