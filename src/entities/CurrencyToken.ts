import { Utils } from 'sota-common';
import { Entity, BeforeInsert, BeforeUpdate, PrimaryColumn, Column } from 'typeorm';

@Entity('currency')
export class CurrencyToken {
  @PrimaryColumn({ name: 'symbol', nullable: false })
  public symbol: string;

  @Column({ name: 'network_symbol', nullable: false })
  public networkSymbol: string;

  @PrimaryColumn({ name: 'name', nullable: false })
  public name: string;

  @Column({ name: 'created_at', type: 'bigint' })
  public createdAt: number;

  @Column({ name: 'updated_at', type: 'bigint' })
  public updatedAt: number;

  @Column({ name: 'type', nullable: false })
  public type: string;

  @Column({ name: 'family', nullable: false })
  public family: string;

  @Column({ name: 'has_memo', nullable: false })
  public hasMemo: number;

  @Column({ name: 'network', nullable: false })
  public network: string;

  @Column({ name: 'total_supply', nullable: false })
  public totalSupply: string;

  @Column({ name: 'minimum_deposit', nullable: false })
  public minimumDeposit: string;

  @Column({ name: 'decimal', nullable: false })
  public decimal: number;

  @Column({ name: 'precision', nullable: false })
  public precision: number;

  @Column({ name: 'contract_address', nullable: false })
  public contractAddress: string;

  @Column({ name: 'subversion_name', nullable: false })
  public subversionName: string;

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
