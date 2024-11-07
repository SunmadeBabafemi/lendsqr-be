import { User } from "../../entites/User";

export interface CreateUserDto {
	first_name: string;
	last_name: string;
	email: string;
	phone_number: string;
	bvn: string;
	nin: string;
	password: string;
	is_verified?: boolean;
}

export interface UserLoginDto {
	user?: User;
	email_or_phone_number: string;
	password: string;
}
