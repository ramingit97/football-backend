import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('metro_stations')
export class MetroStation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    city: string;

    @Column({ nullable: true })
    line: string;
}
