import { FullPaymentLinkDto } from "./transaction.dto";
import envConfig from "../../../env.config";
import ResponseData from "../../common/interfaces/responseData.interface";
import { requestProp } from "../../common/interfaces/base.interface";
import { StatusMessages } from "../../common/enums";
import { HttpCodes } from "../../common/constants/httpcode";
import { axiosRequestFunction, convertNairaToKobo } from "../../common/helpers";
import { HttpCodesEnum } from "../../common/enums/httpCodes.enum";

class PaymentProviderService {
	public async paystackPaymentLink(
		payload: FullPaymentLinkDto
	): Promise<ResponseData> {
		console.log("🚀 ~ PaymentProviderService ~ payload:", payload);
		let responseData: ResponseData;
		try {
			const paystackPayload = {
				amount: convertNairaToKobo(payload.amount),
				email: payload.user.email,
				currency: "NGN",
				reference: payload.txnRef,
				metadata: {
					customer_id: payload.user.id,
					narration: payload.narration,
					name: payload.user.first_name + " " + payload.user.last_name,
					email: payload.user.email,
					phone_number: payload.user.phone_number,
				},
			};

			const axiosConfig: requestProp = {
				url: envConfig.PAYSTACK_BASE_URL + "/transaction/initialize",
				method: "POST",
				body: paystackPayload,
				headers: {
					authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
				},
			};
			const initializeTransaction = await axiosRequestFunction(axiosConfig);
			if (
				Number(initializeTransaction?.status) < 400 &&
				initializeTransaction?.data
			) {
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Link Generated Succcessfully",
					data: {
						link: initializeTransaction?.data?.authorization_url,
						txRef: initializeTransaction?.data?.reference,
					},
				};
				return responseData;
			} else {
				return initializeTransaction;
			}
		} catch (error: any) {
			console.log("🚀 ~ PaymentProviderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async paystackVerifyTransaction(ref: string): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const axiosConfig: requestProp = {
				url: envConfig.PAYSTACK_BASE_URL + `/transaction/verify/${ref}`,
				method: "GET",
				headers: {
					authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
				},
			};
			const verify = await axiosRequestFunction(axiosConfig);
			return verify;
		} catch (error: any) {
			console.log("🚀 ~ PaymentProviderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async paystackGetBanks(
		page?: string,
		limit?: string
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const params = {
				country: "nigeria",
				page: Number(page),
				perPage: Number(limit),
			};
			console.log("🚀 ~ PaymentProviderService ~ params:", params);
			const axiosConfig: requestProp = {
				url: envConfig.PAYSTACK_BASE_URL + `/bank`,
				method: "GET",
				params,
				headers: {
					authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
				},
			};
			const banks = await axiosRequestFunction(axiosConfig);
			responseData = {
				code: banks.code,
				status: banks.status,
				message: banks.message,
				data: banks.data?.data,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ PaymentProviderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async paystackBankAccountVerification(
		account_number?: string,
		bank_code?: string
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const params = {
				account_number,
				bank_code,
			};
			console.log("🚀 ~ PaymentProviderService ~ params:", params);
			const axiosConfig: requestProp = {
				url: envConfig.PAYSTACK_BASE_URL + `/bank/resolve`,
				method: "GET",
				params,
				headers: {
					authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
				},
			};
			const banks = await axiosRequestFunction(axiosConfig);
			responseData = {
				code: banks.code,
				status: banks.status,
				message: banks.message,
				data: banks.data?.data,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ PaymentProviderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async paystackTransfer(payload: any): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const {
				account_number,
				account_name,
				bank_code,
				amount,
				currency = "NGN",
				reference,
				narration,
			} = payload;

			const axiosConfig: requestProp = {
				url: envConfig.PAYSTACK_BASE_URL + `/transferrecipient`,
				method: "POST",
				body: {
					type: "nuban",
					name: account_name,
					account_number,
					bank_code,
					currency,
				},
				headers: {
					authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
				},
			};
			const transferRecipient = await axiosRequestFunction(axiosConfig);
			if (transferRecipient.status === StatusMessages.error) {
				return transferRecipient;
			}
			const recipient_code = transferRecipient.data?.data?.recipient_code;
			const axiosConfigT: requestProp = {
				url: envConfig.PAYSTACK_BASE_URL + `/transfer`,
				method: "POST",
				body: {
					source: "balance",
					amount: convertNairaToKobo(amount),
					reference: reference,
					recipient: recipient_code,
					reason: narration,
				},
				headers: {
					authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
				},
			};
			const initiateTransferRequest = await axiosRequestFunction(axiosConfigT);
			if (initiateTransferRequest.status === StatusMessages.error) {
				return initiateTransferRequest;
			}
			responseData = {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message: `Withdrawal Of NGN${amount} Initiated Successfully`,
				data:
					initiateTransferRequest.data?.data || initiateTransferRequest.data,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ PaymentProviderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async completePaystackTransfer(payload: any): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const { transfer_code, otp } = payload;

			const axiosConfig: requestProp = {
				url: envConfig.PAYSTACK_BASE_URL + `/transfer/finalize_transfer`,
				method: "POST",
				body: {
					transfer_code,
					otp,
				},
				headers: {
					authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
				},
			};
			const completeTransferR = await axiosRequestFunction(axiosConfig);
			if (completeTransferR.status === StatusMessages.error) {
				return completeTransferR;
			}

			responseData = {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message:
					completeTransferR.data?.message ||
					`Withdrawal Initiated Successfully`,
				data: completeTransferR.data?.data || completeTransferR.data,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ PaymentProviderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
}

export default PaymentProviderService;
