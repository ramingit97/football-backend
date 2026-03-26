import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('no_shows')
export class NoShow {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    gameId: string;

    @Column()
    userId: string;

    @Column({ nullable: true })
    userName: string;

    @Column()
    reportedByUserId: string;

    @Column({ nullable: true })
    gameDate: string;

    @CreateDateColumn()
    createdAt: Date;
}
