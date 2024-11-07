import {
	CompleteWalletWithdrawalDto,
	FullPaymentLinkDto,
	GeneratePaymentLinkDto,
	GetTransactionsDto,
	InterwalletTransferDto,
	MakeWalletWithdrawalDto,
} from "./transaction.dto";
import {
	PaymentProvider,
	PaystackWebHookEvents,
	PaystackWebHookEventsStatus,
	StatusMessages,
	TransactionNarration,
	TransactionStatus,
	TransactionType,
} from "../../common/enums";
import ResponseData from "../../common/interfaces/responseData.interface";
import { HttpCodes } from "../../common/constants/httpcode";
import { User } from "../../entites/User";
import { v4 as uuid } from "uuid";
import { Knex } from "knex";
import { tableNames } from "../../common/constants";
import { HttpCodesEnum } from "../../common/enums/httpCodes.enum";
import { getRandomRef } from "../../common/helpers";
import envConfig from "../../../env.config";
import PaymentProviderService from "./paymentProvider.service";
import {
	PaginatePayload,
	paginateRecords,
} from "../../common/helpers/paginate";

class TransactionService {
	private paymentProviderService = new PaymentProviderService();

	constructor(private readonly knex: Knex) {}

	public async initializePayment(
		generatePaymentLink: GeneratePaymentLinkDto,
		user?: User
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodesEnum.HTTP_OK,
			message: "Payment Link Generated Successfully",
		};
		try {
			const ref = getRandomRef();
			const existingLog = await this.knex(tableNames.transaction_logs)
				.where("reference", ref)
				.select("*")
				.first();

			if (existingLog) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Duplicate Transactions Detected",
				};
				return responseData;
			}
			const linkPayload: FullPaymentLinkDto = {
				...generatePaymentLink,
				user: user,
				txnRef: ref,
			};
			const txnLog_id = uuid();

			await this.knex(tableNames.transaction_logs).insert({
				id: txnLog_id,
				reference: ref,
				...(user?.id && {
					user_id: user.id,
				}),
				amount: generatePaymentLink.amount,
				type: TransactionType.CREDIT,
				narration_type: generatePaymentLink.narration,
				status: TransactionStatus.PENDING,
			});

			switch (envConfig.PAYMENT_PROVIDER) {
				case PaymentProvider.PAYSTACK:
					responseData = await this.paymentProviderService.paystackPaymentLink(
						linkPayload
					);

					break;

				default:
					responseData = await this.paymentProviderService.paystackPaymentLink(
						linkPayload
					);
					break;
			}

			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ TransactionService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async paystackCallbackService(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Transaction Successful",
		};
		try {
			const { event, data } = payload;
			const authorization = data?.authorization;
			const metadata = data?.metadata;

			const { reference, txRef, tx_ref } = data;
			const ref = reference || txRef || tx_ref;
			const ongoningTransaction = await this.knex(tableNames.transaction_logs)
				.where({
					reference: ref,
				})
				.select("*")
				.first();
			if (!ongoningTransaction) {
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Ongoing Transaction Not Found",
				};
				return responseData;
			}
			if (
				ongoningTransaction &&
				ongoningTransaction.status === TransactionStatus.SUCCESSFUL
			) {
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Transaction Already Completed",
				};
				return responseData;
			}
			const narration =
				ongoningTransaction?.narration_type || ongoningTransaction?.narration;

			const narration_id = ongoningTransaction.narration_id || "";
			const eventType = String(event).split(".")[0];
			const eventStatus = String(event).split(".")[1];
			switch (eventType) {
				case PaystackWebHookEvents.CHARGE:
					switch (eventStatus) {
						case PaystackWebHookEventsStatus.SUCCESS:
							await this.knex(tableNames.transaction_logs)
								.where("id", ongoningTransaction.id)
								.update({ status: TransactionStatus.SUCCESSFUL });
							switch (narration) {
								case TransactionNarration.TOPUP:
									const completeTopup = await this.completeWalletTopup(
										ongoningTransaction
									);
									responseData = completeTopup;
									break;
								default:
									break;
							}
							break;
						default:
							await this.knex(tableNames.transaction_logs)
								.where("id", ongoningTransaction.id)
								.update({ status: TransactionStatus.FAILED });
							responseData.message = "Transaction Failed";
							break;
					}

					break;
				case PaystackWebHookEvents.TRANSFER:
					switch (eventStatus) {
						case PaystackWebHookEventsStatus.SUCCESS:
							await this.knex(tableNames.transaction_logs)
								.where("id", ongoningTransaction.id)
								.update({ status: TransactionStatus.SUCCESSFUL });
							break;
						default:
							await this.knex(tableNames.transaction_logs)
								.where("id", ongoningTransaction.id)
								.update({ status: TransactionStatus.FAILED });
							const reversal = await this.completeWalletTopup(
								ongoningTransaction
							);
							responseData = reversal;
							break;
					}
					break;

				default:
					break;
			}

			return responseData;
		} catch (error: any) {
			console.error(
				"🚀 ~ TransactionService ~ paystackCallbackService ~ error:",
				error
			);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getTransactionLogs(
		payload: GetTransactionsDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Records fectched Successfully",
		};
		try {
			const { user, limit, page, narration, status } = payload;
			const filter = {
				...(user && {
					user_id: user.id,
				}),
				...(narration && { narration_type: narration }),
				...(status && { status }),
			};

			const paginatePayload: PaginatePayload = {
				table_name: tableNames.transaction_logs,
				limit: limit ? Number(limit) : 10,
				page: page ? Number(page) : 1,
				filter,
			};

			const records = await paginateRecords(paginatePayload);

			responseData.data = records;
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ TransactionService ~ completeTopup ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async setUpTransactionPin(
		pin: string,
		user: User
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Pin Setup Successfully",
		};
		try {
			const alreadySetupPin = await this.knex(tableNames.pins)
				.where("user_id", user.id)
				.select("*")
				.first();

			if (alreadySetupPin) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Pin Already Setup",
				};
				return responseData;
			}

			const pin_id = uuid();
			await this.knex(tableNames.pins).insert({
				id: pin_id,
				user_id: user.id,
				pin,
			});

			const pinSetup = await this.knex(tableNames.pins)
				.where("id", pin_id)
				.select("*")
				.first();

			responseData.data = pinSetup;
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ TransactionService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async validateTransactionPin(
		pin: string,
		user: User
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Pin validated Successfully",
		};
		try {
			const alreadySetupPin = await this.knex(tableNames.pins)
				.where("user_id", user.id)
				.select("*")
				.first();

			if (!alreadySetupPin) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Pin Yet To Be Setup",
				};
				return responseData;
			}

			if (pin !== alreadySetupPin.pin) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Incorrect Pin",
				};
				return responseData;
			}

			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ TransactionService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async interWalletTransafer(
		payload: InterwalletTransferDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: `NGN${payload.amount} transfered successfully`,
		};
		try {
			const validatePin = await this.validateTransactionPin(
				payload.txn_pin,
				payload.user
			);
			if (validatePin.status === StatusMessages.error) {
				return validatePin;
			}
			const userWallet = await this.knex(tableNames.wallets)
				.where("user_id", payload.user.id)
				.select("*")
				.first();

			if (!userWallet) {
				responseData.message = "Wallet Not Found";
				return responseData;
			}

			const receiepientWallet = await this.knex(tableNames.wallets)
				.where("user_id", payload.receipient_id)
				.select("*")
				.first();

			if (!receiepientWallet) {
				responseData.message = "receipient Wallet Not Found";
				return responseData;
			}
			const amount = Number(payload.amount);
			const sender_current_balance = Number(userWallet.current_balance);
			if (sender_current_balance < amount) {
				responseData.message = "Insufficient Balance";
				return responseData;
			}

			const senderTxnLog = {
				id: uuid(),
				user_id: userWallet.user_id,
				reference: getRandomRef(),
				amount,
				narration_type: TransactionNarration.INTERWALLET_TRANSFER,
				status: TransactionStatus.SUCCESSFUL,
				type: TransactionType.DEBIT,
				receipient_id: payload.receipient_id,
			};

			const receiverTxnLog = {
				id: uuid(),
				user_id: payload.receipient_id,
				reference: getRandomRef(),
				amount,
				narration_type: TransactionNarration.INTERWALLET_TRANSFER,
				status: TransactionStatus.SUCCESSFUL,
				type: TransactionType.CREDIT,
				sender_id: userWallet.id,
			};

			await this.knex(tableNames.transaction_logs)
				.insert(senderTxnLog)
				.then(async () => {
					await this.completeWalletDebit({
						user_id: payload.user.id,
						amount,
					});
				});

			await this.knex(tableNames.transaction_logs)
				.insert(receiverTxnLog)
				.then(async () => {
					await this.completeWalletTopup({
						user_id: payload.receipient_id,
						amount,
					});
				});
			responseData.status = StatusMessages.success;
			responseData.code = HttpCodesEnum.HTTP_OK;

			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ TransactionService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async completeWalletTopup(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Topup Successful",
		};
		try {
			const { user_id, amount } = payload;
			const wallet = await this.knex(tableNames.wallets)
				.where("user_id", user_id)
				.select("*")
				.first();

			if (!wallet) {
				responseData.status = StatusMessages.error;
				responseData.code = HttpCodesEnum.HTTP_BAD_REQUEST;
				responseData.message = "Wallet Not Found";
				console.log(
					"🚀 ~ TransactionService ~ completeWalletTopup ~ responseData:",
					responseData
				);

				return responseData;
			}

			const current_balance = Number(wallet.current_balance);
			const new_balance = current_balance + Number(amount);

			await this.knex(tableNames.wallets).where("id", wallet.id).update({
				current_balance: new_balance,
				previous_balance: current_balance,
			});

			const toppedUpWallet = await this.knex(tableNames.wallets)
				.where("id", wallet.id)
				.select("*");
			responseData.data = toppedUpWallet;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ TransactionService ~ completeTopup ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async completeWalletDebit(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Debit Successful",
		};
		try {
			const { user_id, amount } = payload;
			const wallet = await this.knex(tableNames.wallets)
				.where("user_id", user_id)
				.select("*")
				.first();

			if (!wallet) {
				responseData.status = StatusMessages.error;
				responseData.code = HttpCodesEnum.HTTP_BAD_REQUEST;
				responseData.message = "Wallet Not Found";
				return responseData;
			}

			const current_balance = Number(wallet.current_balance);
			const new_balance = current_balance - Number(amount);

			await this.knex(tableNames.wallets).where("id", wallet.id).update({
				current_balance: new_balance,
				previous_balance: current_balance,
			});

			const toppedUpWallet = await this.knex(tableNames.wallets)
				.where("id", wallet.id)
				.select("*");
			responseData.data = toppedUpWallet;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ TransactionService ~ completeTopup ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async initiateWalletWithdrawal(
		payload: MakeWalletWithdrawalDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Withdrawal Processed Successfully",
		};
		try {
			const { user, account_bank, account_number, amount, txn_pin } = payload;
			const narration = TransactionNarration.WITHDRAWAL;

			const validateAccount =
				await this.paymentProviderService.paystackBankAccountVerification(
					account_number,
					account_bank
				);
			if (validateAccount.status === StatusMessages.error) {
				return validateAccount;
			}

			const pinValidation = await this.validateTransactionPin(txn_pin, user);
			if (pinValidation.status === StatusMessages.error) {
				return pinValidation;
			}

			const wallet = await this.knex(tableNames.wallets)
				.where("user_id", user.id)
				.select("*")
				.first();

			if (!wallet) {
				responseData.status = StatusMessages.error;
				responseData.code = HttpCodesEnum.HTTP_BAD_REQUEST;
				responseData.message = "Wallet Not Found";
				return responseData;
			}

			const current_balance = Number(wallet.current_balance);

			if (current_balance < amount) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: `Insufficient Balance`,
				};
			}
			const reference = getRandomRef();
			const details = {
				account_number,
				account_name: validateAccount.data?.account_name,
				bank_code: account_bank,
				amount,
				currency: "NGN",
				reference,
				narration,
			};
			const log_id = uuid();
			const logData = {
				id: log_id,
				user_id: user.id,
				status: TransactionStatus.PENDING,
				type: TransactionType.DEBIT,
				narration_type: narration,
				reference,
				amount,
			};
			await this.knex(tableNames.transaction_logs)
				.insert(logData)
				.then(async () => {
					await this.completeWalletDebit({ user_id: user.id, amount });
				});

			const paystackTransfer =
				await this.paymentProviderService.paystackTransfer(details);
			if (paystackTransfer.status === StatusMessages.error) {
				//reverse the debited amount
				await this.completeWalletTopup({ user_id: user.id, amount });
				await this.knex(tableNames.transaction_logs)
					.where("id", log_id)
					.update({
						status: TransactionStatus.REVERSAL,
					});
				return paystackTransfer;
			}

			responseData = paystackTransfer;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ TransactionService ~ completeTopup ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async completeWalletWithdrawal(
		payload: CompleteWalletWithdrawalDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Withdrawal Processed Successfully",
		};
		try {
			const { user, transfer_code, otp } = payload;
			const finalize_transfer =
				await this.paymentProviderService.completePaystackTransfer({
					transfer_code,
					otp,
				});

			responseData = finalize_transfer;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ TransactionService ~ completeTopup ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
}

export default TransactionService;
