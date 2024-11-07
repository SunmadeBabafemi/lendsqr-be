import { TransactionNarration } from "../../common/enums";
import { User } from "../../entites/User";

export interface GeneratePaymentLinkDto {
	amount: number;
	card_id?: string;
	narration_id?: string;
	narration: TransactionNarration;
}

export interface FullPaymentLinkDto extends GeneratePaymentLinkDto {
	user: any;
	txnRef?: string;
}

export interface GetTransactionsDto {
	user?: User;
	limit: number;
	page: number;
	narration?: TransactionNarration | string;
	status?: string;
}

export interface InterwalletTransferDto {
	user: User;
	amount: number;
	receipient_id: string;
	txn_pin: string;
}

export interface MakeWalletWithdrawalDto {
	user: User;
	amount: number;
	account_number: string;
	currency?: string;
	account_bank: string;
	txn_pin: string;
}

export interface CompleteWalletWithdrawalDto {
	user: User;
	transfer_code: string;
	otp: string;
}
