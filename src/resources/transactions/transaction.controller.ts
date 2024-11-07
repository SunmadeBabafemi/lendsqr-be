import {
	Request,
	Response,
	NextFunction,
	Router,
	RequestHandler,
} from "express";
import Controller from "../../common/interfaces/controller.interface";
import HttpException from "../../common/exceptions/http.exception";
import validationMiddleware from "../../common/middleware/validation.middleware";
import TransactionService from "./transaction.service";
import validate from "./transaction.validation";
import { responseObject } from "../../common/helpers/http.response";
import { HttpCodes } from "../../common/constants/httpcode";
import {
	GeneratePaymentLinkDto,
	GetTransactionsDto,
	InterwalletTransferDto,
} from "./transaction.dto";
import knex from "../../db/knex";
import authenticatedMiddleware from "../../common/middleware/authenticated.middleware";
import PaymentProviderService from "./paymentProvider.service";
import { RequestData } from "../../common/enums";

class TransactionController implements Controller {
	public path = "/transaction";
	public router = Router();
	private transactionService = new TransactionService(knex);
	private paymentProviderService = new PaymentProviderService();

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.post(
			`${this.path}/generate-payment-link`,
			authenticatedMiddleware,
			validationMiddleware(validate.generatePaymentLinkSchema),
			this.generatePaymentLink as RequestHandler
		);

		this.router.post(
			`${this.path}/paystack/callback`,
			this.paystackCallbackService as RequestHandler
		);

		this.router.get(
			`${this.path}/logs`,
			authenticatedMiddleware,
			validationMiddleware(validate.getTxnLogsSchema),
			this.getTransactionLogs as RequestHandler
		);

		this.router.post(
			`${this.path}/setup-pin`,
			authenticatedMiddleware,
			validationMiddleware(validate.pinSetupSchema),
			this.setUpTransactionPin as RequestHandler
		);

		this.router.post(
			`${this.path}/wallet-transfer`,
			authenticatedMiddleware,
			validationMiddleware(validate.interwalletTransferSchema),
			this.interWalletTransafer as RequestHandler
		);

		this.router.get(
			`${this.path}/banks`,
			authenticatedMiddleware,
			validationMiddleware(validate.getTxnLogsSchema, RequestData.query),
			this.getBanks as RequestHandler
		);

		this.router.get(
			`${this.path}/verify-account`,
			authenticatedMiddleware,
			validationMiddleware(validate.verifyAccountSchema, RequestData.query),
			this.verifyAccountDetails as RequestHandler
		);

		this.router.post(
			`${this.path}/initiate-wallet-withdrawal`,
			authenticatedMiddleware,
			validationMiddleware(validate.initiateWithdrawalSchema),
			this.initiateWalletWithdrawal as RequestHandler
		);

		this.router.post(
			`${this.path}/complete-wallet-withdrawal`,
			authenticatedMiddleware,
			validationMiddleware(validate.completeWithdrawalSchema),
			this.completeWalletWithdrawal as RequestHandler
		);
	}

	private generatePaymentLink = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: GeneratePaymentLinkDto = req.body;
			const user = req.user;
			const { status, code, message, data } =
				await this.transactionService.initializePayment(body, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private paystackCallbackService = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: any = req.body;
			const { status, code, message, data } =
				await this.transactionService.paystackCallbackService(body);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getTransactionLogs = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: GetTransactionsDto = {
				user: req.user,
				limit: Number(req.query.limit),
				page: Number(req.query.page),
				...(req.query.narration && {
					narration: String(req.query.narration),
				}),
				...(req.query.status && {
					status: String(req.query.status),
				}),
			};
			const { status, code, message, data } =
				await this.transactionService.getTransactionLogs(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private setUpTransactionPin = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const pin = req.body.pin;
			const { status, code, message, data } =
				await this.transactionService.setUpTransactionPin(pin, req.user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private interWalletTransafer = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: InterwalletTransferDto = {
				user: req.user,
				amount: req.body.amount,
				txn_pin: req.body.txn_pin,
				receipient_id: req.body.receipient_id,
			};
			const { status, code, message, data } =
				await this.transactionService.interWalletTransafer(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getBanks = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const { status, code, message, data } =
				await this.paymentProviderService.paystackGetBanks(
					String(req.query?.page),
					String(req.query?.limit)
				);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private verifyAccountDetails = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const { status, code, message, data } =
				await this.paymentProviderService.paystackBankAccountVerification(
					String(req.query?.account_number),
					String(req.query?.bank_code)
				);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private initiateWalletWithdrawal = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload = {
				user: req.user,
				amount: req.body.amount,
				account_number: req.body.account_number,
				account_bank: req.body.bank_code,
				txn_pin: req.body.txn_pin,
			};
			const { status, code, message, data } =
				await this.transactionService.initiateWalletWithdrawal(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private completeWalletWithdrawal = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload = {
				user: req.user,
				transfer_code: req.body.transfer_code,
				otp: req.body.otp,
			};
			const { status, code, message, data } =
				await this.transactionService.completeWalletWithdrawal(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default TransactionController;
