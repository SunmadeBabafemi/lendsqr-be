import axios, { AxiosRequestConfig, Method } from "axios";
import { requestProp } from "../interfaces/base.interface";
import ResponseData from "../interfaces/responseData.interface";
import { StatusMessages } from "../enums";
import { HttpCodes } from "../constants/httpcode";

export const getRandomRef = () => {
	const getRef = () => {
		var nums = "0123456789";
		var rand = "";
		for (var i = 0; i < 5; i++) {
			rand += nums[Math.floor(Math.random() * 10)];
		}
		return rand;
	};
	let randRef = "SOTO" + getRef() + Date.now();

	return randRef;
};

export const convertNairaToKobo = (amount: number) => {
	const koboValue = Number(amount) * 100;
	return koboValue;
};

export const axiosRequestFunction = async ({
	url,
	method,
	params,
	body,
	headers,
}: requestProp): Promise<ResponseData> => {
	let responseData: ResponseData = {
		status: StatusMessages.success,
		code: HttpCodes.HTTP_OK,
		message: "",
		data: null,
	};
	try {
		const config: AxiosRequestConfig = {
			method: method,
			url: url,
			...(body && { data: body }),
			...(params && { params: params }),
			...(headers && { headers: headers }),
		};

		await axios(config)
			.then((response) => {
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: response.statusText,
					data: response?.data,
				};
			})
			.catch((e) => {
				console.log("🚀 AXIOS CATCH ERROR", e);
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: e?.response?.data?.message || e.toString(),
					data: null,
				};
			});
		return responseData;
	} catch (error: any) {
		console.log("🚀 ~ error:", error);
		responseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: error.toString(),
			data: null,
		};
	}
	return responseData;
};
