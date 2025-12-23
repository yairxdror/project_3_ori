export class UserModel {
    id?: number;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    is_admin: boolean;

    constructor(
        user: UserModel
    ) {
        this.id = user.id;
        this.first_name = user.first_name;
        this.last_name = user.last_name;
        this.email = user.email;
        this.password = user.password;
        this.is_admin = user.is_admin;
    }
}

export class CredentialsModel {
    email: string;
    password: string;

    constructor(
        user: CredentialsModel
    ) {
        this.email = user.email;
        this.password = user.password;
    }
}