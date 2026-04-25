import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column('uuid')
    userId: string;

    @Index({ unique: true })
    @Column({ length: 64 })
    tokenHash: string;

    @Column({ type: 'timestamp' })
    expiresAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    revokedAt: Date | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    userAgent: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
