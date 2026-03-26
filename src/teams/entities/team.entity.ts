import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('teams')
export class Team {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    logo: string;

    @Column()
    captainId: string;

    @Column('simple-array')
    playerIds: string[];

    @Column({ default: 0 })
    wins: number;

    @Column({ default: 0 })
    losses: number;

    @Column({ default: 0 })
    draws: number;

    @Column({ default: 1000 })
    rating: number;

    @Column({ default: 0 })
    gamesPlayed: number;

    @Column('simple-array', { nullable: true })
    reservePlayerIds: string[];

    @Column('simple-json', { nullable: true })
    formation: { playerId: string; position: string; x: number; y: number }[];

    @Column('simple-json', { nullable: true })
    formations: {
        [format: string]: {
            formationString: string;
            players: { playerId: string; position: string; x: number; y: number }[];
        }
    };

    @Column({ nullable: true })
    flag: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
