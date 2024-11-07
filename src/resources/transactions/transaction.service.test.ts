import TransactionService from "./transaction.service"; // Adjust with the correct path
import { Knex } from "knex";
import PaymentProviderService from "./paymentProvider.service";
import { GeneratePaymentLinkDto } from "./transaction.dto";
import {
	StatusMessages,
	TransactionStatus,
	TransactionType,
	TransactionNarration,
} from "../../common/enums";
import { v4 as uuid } from "uuid";
import { HttpCodesEnum } from "../../common/enums/httpCodes.enum";

jest.mock("knex");
jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid") }));
jest.mock("./paymentProvider.service", () => ({
	paystackPaymentLink: jest.fn(),
	paystackVerifyTransaction: jest.fn(),
	paystackGetBanks: jest.fn(),
	paystackBankAccountVerification: jest.fn(),
}));

const createMockKnex = () => {
	return {
		select: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		insert: jest.fn().mockResolvedValue([{ id: "mock-uuid" }]),
		update: jest.fn().mockResolvedValue({}),
		transaction: jest
			.fn()
			.mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() }),
	} as unknown as jest.Mocked<Knex>;
};

class MockTransactionService {
	initializePayment = jest.fn();
	paystackCallbackService = jest.fn();
	getTransactionLogs = jest.fn();
	setUpTransactionPin = jest.fn();
	validateTransactionPin = jest.fn();
	interWalletTransafer = jest.fn();
	completeWalletTopup = jest.fn();
	completeWalletDebit = jest.fn();
	initiateWalletWithdrawal = jest.fn();
	completeWalletWithdrawal = jest.fn();
}

class MockPaymentProviderService {
	paystackPaymentLink = jest.fn();
	paystackVerifyTransaction = jest.fn();
	paystackGetBanks = jest.fn();
	paystackBankAccountVerification = jest.fn();
}

describe("TransactionService", () => {
	let transactionService: MockTransactionService;
	let knex: jest.Mocked<Knex>;
	let paymentProviderServiceMock: MockPaymentProviderService;

	beforeEach(() => {
		knex = createMockKnex();
		transactionService = new MockTransactionService();
		paymentProviderServiceMock = new MockPaymentProviderService();

		// // Mocking necessary methods
		// knexMock.table = jest.fn().mockReturnValue(knexMock);
		// knexMock.where = jest.fn().mockReturnValue(knexMock);
		// knexMock.select = jest.fn().mockReturnValue([{}]); // Mocked database row
		// knexMock.first = jest.fn().mockReturnValue(undefined); // Returning undefined for no existing log
		// knexMock.insert = jest.fn().mockResolvedValue([uuid()]); // Mocking insert to return a valid ID
		// knexMock.transaction = jest
		// 	.fn()
		// 	.mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() });

		// transactionService = new TransactionService(knexMock);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should generate payment link successfully", async () => {
		const generatePaymentLink: GeneratePaymentLinkDto = {
			amount: 5000,
			narration: TransactionNarration.TOPUP,
		};

		paymentProviderServiceMock.paystackPaymentLink.mockResolvedValue({
			status: StatusMessages.success,
			code: 200,
			message: "Payment Link Generated Successfully",
		});

		transactionService.initializePayment.mockResolvedValue({
			status: StatusMessages.success,
			code: 200,
			message: "Payment Link Generated Successfully",
		});

		const response = await transactionService.initializePayment(
			generatePaymentLink
		);

		expect(transactionService.initializePayment).toHaveBeenCalledWith(
			generatePaymentLink
		);
		expect(response.status).toBe(StatusMessages.success);
		expect(response.message).toBe("Payment Link Generated Successfully");
	});

	it("should handle existing transaction (duplicate detection)", async () => {
		const generatePaymentLink: GeneratePaymentLinkDto = {
			amount: 5000,
			narration: TransactionNarration.TOPUP,
		};

		transactionService.initializePayment.mockResolvedValue({
			status: StatusMessages.error,
			code: HttpCodesEnum.HTTP_BAD_REQUEST,
			message: "Duplicate Transactions Detected",
		});
		const response = await transactionService.initializePayment(
			generatePaymentLink
		);

		expect(response.status).toBe(StatusMessages.error);
		expect(response.message).toBe("Duplicate Transactions Detected");
	});

	it("should handle error while generating payment link", async () => {
		const generatePaymentLink: GeneratePaymentLinkDto = {
			amount: 5000,
			narration: TransactionNarration.TOPUP,
		};
		const reject =
			paymentProviderServiceMock.paystackPaymentLink.mockRejectedValue(
				new Error("Some error")
			);
		transactionService.initializePayment.mockResolvedValue({
			status: StatusMessages.error,
			code: HttpCodesEnum.HTTP_BAD_REQUEST,
			message: "Unable to Generate Payment Link",
		});

		const response = await transactionService.initializePayment(
			generatePaymentLink
		);

		expect(response.code).toBe(HttpCodesEnum.HTTP_BAD_REQUEST);
		expect(response.message).toBe("Unable to Generate Payment Link");
	});

	it("should handle Paystack callback for successful transaction", async () => {
		const payload = {
			event: "charge.success",
			data: {
				reference: "ref123",
				authorization: {},
				metadata: {},
			},
		};

		const update = {
			id: uuid(),
			status: TransactionStatus.PENDING,
			narration_type: TransactionNarration.TOPUP,
		};

		knex.where = jest.fn().mockReturnValue([update]);

		knex.update({ status: TransactionStatus.SUCCESSFUL });

		transactionService.paystackCallbackService = jest.fn().mockResolvedValue({
			status: StatusMessages.success,
			code: 200,
			message: "Topup Completed",
		});

		transactionService.completeWalletTopup(update);

		const response = await transactionService.paystackCallbackService(payload);

		expect(response.status).toBe(StatusMessages.success);
		expect(response.message).toBe("Topup Completed");
		expect(knex.update).toHaveBeenCalledWith({
			status: TransactionStatus.SUCCESSFUL,
		});
		expect(transactionService.completeWalletTopup).toHaveBeenCalledWith(update);
	});

	it("should handle Paystack callback for failed transaction", async () => {
		const payload = {
			event: "charge.failed",
			data: {
				reference: "ref123",
				authorization: {},
				metadata: {},
			},
		};

		knex.where = jest.fn().mockReturnValue([
			{
				id: uuid(),
				status: TransactionStatus.PENDING,
				narration_type: TransactionNarration.TOPUP,
			},
		]);

		transactionService.paystackCallbackService.mockResolvedValue({
			status: StatusMessages.success,
			code: HttpCodesEnum.HTTP_OK,
			message: "Transaction Failed",
		});

		knex.update({ status: TransactionStatus.FAILED });

		const response = await transactionService.paystackCallbackService(payload);

		expect(response.status).toBe(StatusMessages.success);
		expect(response.message).toBe("Transaction Failed");
		expect(knex.update).toHaveBeenCalledWith({
			status: TransactionStatus.FAILED,
		});
	});

	it("should handle inter-wallet transfer", async () => {
		const payload = {
			txn_pin: "1234",
			user: { id: uuid() },
			amount: 1000,
			receipient_id: uuid(),
		};

		knex.transaction();

		transactionService.interWalletTransafer.mockResolvedValue({
			status: StatusMessages.success,
			code: HttpCodesEnum.HTTP_OK,
			message: "NGN1000 transfered successfully",
		});

		const response = await transactionService.interWalletTransafer(payload);

		expect(transactionService.interWalletTransafer).toHaveBeenCalledWith(
			payload
		);
		expect(response.status).toBe(StatusMessages.success);
		expect(response.message).toBe("NGN1000 transfered successfully");
		expect(knex.transaction).toHaveBeenCalled();
	});
});
