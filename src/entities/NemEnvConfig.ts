import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('nem_env_config')
export class NemEnvConfig {
  @PrimaryColumn({ name: 'key' })
  public key: string;

  @Column({ name: 'value' })
  public value: string;
}
