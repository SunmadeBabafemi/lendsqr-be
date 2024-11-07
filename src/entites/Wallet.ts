export interface Wallet {
	id: string;
	user_id: string;
	current_balance: number;
	previous_balance: number;
	created_at?: Date;
	updated_at?: Date;
}
