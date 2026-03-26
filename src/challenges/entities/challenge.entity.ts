import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('challenges')
export class Challenge {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    challengerTeamId: string;

    @Column()
    challengedTeamId: string;

    @Column()
    challengerName: string;

    @Column()
    challengedName: string;

    @Column()
    date: Date;

    @Column()
    time: string;

    @Column()
    location: string;

    @Column({ nullable: true })
    district: string;

    @Column({ default: '7x7' })
    format: string;

    @Column({ nullable: true })
    message: string;

    @Column({ default: 'pending' })
    status: string;

    @Column({ nullable: true })
    gameId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
