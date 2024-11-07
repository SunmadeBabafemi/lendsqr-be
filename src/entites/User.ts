export interface User {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	phone_number: string;
	bvn: string;
	nin: string;
	password: string;
	accessToken: string;
	wallet_id: string;
	is_verified: boolean;
	profile_image?: string;
	created_at?: Date;
	updated_at?: Date;
}
