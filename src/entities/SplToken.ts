import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('spl_token')
export class SplToken {
  @PrimaryColumn({ name: 'symbol', nullable: false })
  public symbol: string;

  @Column({ name: 'name', nullable: false })
  public name: string;

  @Column({ name: 'program_id', nullable: false })
  public programId: string;

  @Column({ name: 'decimal', nullable: false })
  public decimal: number;

  @Column({ name: 'total_supply', nullable: false })
  public totalSupple: string;

  @Column({ name: 'network', nullable: false })
  public network: string;
}
