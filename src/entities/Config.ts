import { Entity, BeforeInsert, BeforeUpdate, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Utils } from 'sota-common';

@Entity('config')
export class Config {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: 'currency', nullable: false })
  public currency: string;

  @Column({ name: 'network', nullable: false })
  public network: string;

  @Column({ name: 'chain_name', nullable: false })
  public chainName: string;

  @Column({ name: 'chain_id', nullable: false })
  public chainId: string;

  @Column({ name: 'average_block_time', nullable: false })
  public averageBlockTime: number;

  @Column({ name: 'api_endpoint', nullable: false })
  public apiEndpoint: string;

  @Column({ name: 'explorer_endpoint', nullable: false })
  public explorerEndpoint: string;

  @Column({ name: 'rpc', nullable: false })
  public rpc: string;

  @Column({ name: 'required_confirmations', nullable: false })
  public requiredConfirmations: number;

  @Column({ name: 'fee_unit', type: 'bigint' })
  public feeUnit: number;

  @Column({ name: 'start_crawl_block', nullable: false })
  public startCrawlBlock: number;

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
