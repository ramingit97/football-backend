import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('districts')
export class District {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    city: string;
}
