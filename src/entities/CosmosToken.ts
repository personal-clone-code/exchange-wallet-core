import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('cosmos_token')
export class CosmosToken {
  @PrimaryColumn({ name: 'symbol', nullable: false })
  public symbol: string;

  @Column({ name: 'code', nullable: false })
  public code: string;

  @Column({ name: 'scale', nullable: false })
  public scale: number;

  @Column({ name: 'network', nullable: false })
  public network: string;
}
