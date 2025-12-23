import Joi from "joi";


export class VacationModel {
    id?: number;
    destination: string;
    start_date: Date;
    end_date: Date;
    price: number;
    description: string;
    image: string;


    constructor(
        user: VacationModel
    ) {
        this.id = user.id;
        this.destination = user.destination;
        this.start_date = user.start_date;
        this.end_date = user.end_date;
        this.price = user.price;
        this.image = user.image;
    }
}