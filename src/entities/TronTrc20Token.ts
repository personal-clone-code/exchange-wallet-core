import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('tron_trc20_token')
export class TronTrc20Token {
  @PrimaryColumn({ name: 'symbol', nullable: false })
  public symbol: string;

  @Column({ name: 'name', nullable: false })
  public name: string;

  @Column({ name: 'contract_address', nullable: false })
  public contractAddress: string;

  @Column({ name: 'decimal', nullable: false })
  public decimal: number;

  @Column({ name: 'total_supply', nullable: false })
  public totalSupple: string;

  @Column({ name: 'network', nullable: false })
  public network: string;
}
