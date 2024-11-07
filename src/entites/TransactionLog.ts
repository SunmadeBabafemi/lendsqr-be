export interface TransactionLog {
	id: string;
	user_id: string;
	reference: string;
	type: string;
	status: string;
	narration_type: string;
	receipient_id: string;
	sender_id: string;
	amount: number;
	created_at?: Date;
	updated_at?: Date;
}
