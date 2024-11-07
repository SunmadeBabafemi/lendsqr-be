import { email } from "envalid";
import Joi from "joi";
import { TransactionNarration, TransactionStatus } from "../../common/enums";

const generatePaymentLinkSchema = Joi.object({
	amount: Joi.number().positive().required(),
	card_id: Joi.string().optional(),
	narration_id: Joi.string().optional(),
	narration: Joi.string()
		.valid(
			TransactionNarration.TOPUP,
			TransactionNarration.PAYOUT,
			TransactionNarration.REFUND,
			TransactionNarration.WITHDRAWAL
		)
		.required(),
});

const getTxnLogsSchema = Joi.object({
	limit: Joi.number().positive().optional(),
	page: Joi.number().positive().optional(),
	card_id: Joi.string().optional(),
	status: Joi.string()
		.valid(
			TransactionStatus.FAILED,
			TransactionStatus.PENDING,
			TransactionStatus.SUCCESSFUL,
			TransactionStatus.REVERSAL
		)
		.optional(),
	narration: Joi.string()
		.valid(
			TransactionNarration.TOPUP,
			TransactionNarration.PAYOUT,
			TransactionNarration.REFUND,
			TransactionNarration.WITHDRAWAL
		)
		.optional(),
});

const pinSetupSchema = Joi.object({
	pin: Joi.string().min(6).max(6).required(),
});

const interwalletTransferSchema = Joi.object({
	receipient_id: Joi.string().required(),
	txn_pin: Joi.string().required(),
	amount: Joi.number().min(100).required(),
});

const verifyAccountSchema = Joi.object({
	account_number: Joi.string().required(),
	bank_code: Joi.string().required(),
});

const initiateWithdrawalSchema = Joi.object({
	account_number: Joi.string().required(),
	bank_code: Joi.string().required(),
	txn_pin: Joi.string().required(),
	amount: Joi.number().min(100).required(),
});

const completeWithdrawalSchema = Joi.object({
	transfer_code: Joi.string().required(),
	otp: Joi.string().required(),
});

export default {
	generatePaymentLinkSchema,
	getTxnLogsSchema,
	pinSetupSchema,
	interwalletTransferSchema,
	verifyAccountSchema,
	initiateWithdrawalSchema,
	completeWithdrawalSchema,
};
