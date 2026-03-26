import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type ReportType = 'no_show' | 'toxic_behavior' | 'cheating' | 'unsportsmanlike' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

@Entity('player_reports')
export class PlayerReport {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    reporterId: string;

    @Column({ nullable: true })
    reporterName: string;

    @Column()
    reportedUserId: string;

    @Column({ nullable: true })
    reportedUserName: string;

    @Column({ nullable: true })
    gameId: string;

    @Column({ type: 'varchar', default: 'other' })
    type: ReportType;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', default: 'pending' })
    status: ReportStatus;

    @Column({ type: 'text', nullable: true })
    adminNote: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
