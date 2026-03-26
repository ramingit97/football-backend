import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Team } from './team.entity';

@Entity('team_join_requests')
export class TeamJoinRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    teamId: string;

    @Column()
    userId: string;

    @Column({ default: 'pending' })
    status: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Team)
    @JoinColumn({ name: 'teamId' })
    team: Team;
}
