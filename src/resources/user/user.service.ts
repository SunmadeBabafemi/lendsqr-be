import { comparePassword, createToken } from "../../common/helpers/token";

// import logger from "@/utils/logger";
import { CreateUserDto, UserLoginDto } from "./user.dto";
import { hashPassword } from "../../common/helpers/token";
import {
	OrderStatus,
	OtpPurposeOptions,
	StatusMessages,
	Timeline,
	UserTypes,
} from "../../common/enums";
import ResponseData from "../../common/interfaces/responseData.interface";
import { HttpCodes } from "../../common/constants/httpcode";
import { User } from "../../entites/User";

import { v4 as uuid } from "uuid";
import { Knex } from "knex";
import { Wallet } from "../../entites/Wallet";
import { HttpCodesEnum } from "../../common/enums/httpCodes.enum";
import { requestProp } from "../../common/interfaces/base.interface";
import envConfig from "../../../env.config";
import { axiosRequestFunction } from "../../common/helpers";

class UserService {
	private readonly Usermodel: Knex.QueryBuilder;
	private readonly Walletmodel: Knex.QueryBuilder;

	constructor(private readonly knex: Knex) {
		this.Usermodel = this.knex<User>("users");
		this.Walletmodel = this.knex<Wallet>("wallets");
	}

	public async createUser(createUserDto: CreateUserDto): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodesEnum.HTTP_OK,
			message: "User Created Successfully, awaiting verification",
		};
		try {
			const userExist = await this.Usermodel.select(["email", "phone_number"])
				.where("email", createUserDto.email.toLowerCase())
				.orWhere("phone_number", createUserDto.phone_number);

			if (userExist.length > 0) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "User With These Details Already Exists",
				};
				return responseData;
			}
			const user_id = uuid();

			const hashedPassword = await hashPassword(createUserDto.password);
			const accessToken = createToken(user_id);
			await this.Usermodel.insert({
				id: user_id,
				first_name: createUserDto.first_name.toLowerCase(),
				last_name: createUserDto.last_name.toLowerCase(),
				email: createUserDto.email.toLowerCase(),
				phone_number: createUserDto.phone_number,
				accessToken,
				bvn: createUserDto.bvn,
				nin: createUserDto.nin,
				password: hashedPassword,
				wallet_id: "user_id",
			}).then((created) => {
				console.log("🚀 ~USER CREATED SUCCESSFULLY:", created);
			});

			const walletUser = (await this.createUserWallet(user_id)).data;
			const user = await this.knex("users")
				.where("id", user_id)
				.select("*")
				.first();
			responseData.data = {
				...user,
				wallet: {
					...walletUser,
					current_balance: Number(walletUser.current_balance),
					previous_balance: Number(walletUser.previous_balance),
				},
			};

			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async createUserWallet(user_id: string): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodesEnum.HTTP_OK,
			message: "Wallet Created Successfully, awaiting verification",
		};
		try {
			const walletExist = await this.Walletmodel.select("*").where(
				"user_id",
				user_id
			);

			if (walletExist.length > 0) {
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "User Wallet Already Exists",
					data: walletExist[0],
				};
				return responseData;
			}
			const wallet_id = uuid();

			await this.Walletmodel.insert({
				id: wallet_id,
				user_id,
			}).then((created) => {
				console.log("🚀 ~Wallet CREATED SUCCESSFULLY:", created);
			});

			let updatedUser;
			await this.knex("users")
				.where("id", user_id)
				.update({ wallet_id })
				.then((update) => {
					updatedUser = update;
				});

			const createdWallet = await this.knex("wallets")
				.where("user_id", user_id)
				.select("*")
				.first();

			responseData.data = createdWallet;

			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async userLogin(payload: UserLoginDto): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodesEnum.HTTP_BAD_REQUEST,
			message: "Wallet Created Successfully, awaiting verification",
		};
		try {
			const { email_or_phone_number, password } = payload;
			const userExists = await this.knex("users")
				.where("email", email_or_phone_number.toLowerCase())
				.orWhere("phone_number", email_or_phone_number)
				.select("*")
				.first();

			if (!userExists) {
				responseData.message = "User Not Found";
				return responseData;
			}
			const isPasswordCorrect = await comparePassword(
				password,
				userExists.password
			);
			if (isPasswordCorrect !== true) {
				responseData.message = "Incorrect Password";
				return responseData;
			}

			const accessToken = await createToken(userExists);

			await this.knex("users")
				.where("id", userExists.id)
				.update({ accessToken });
			const loggedInUser = await this.knex("users")
				.where("id", userExists.id)
				.orWhere("phone_number", email_or_phone_number)
				.select("*")
				.first();

			const wallet = await this.knex("wallets")
				.where("user_id", userExists.id)
				.select("*")
				.first();

			responseData.data = {
				...loggedInUser,
				wallet,
			};
			responseData.message = "user logged in successfully";
			responseData.status = StatusMessages.success;
			responseData.code = HttpCodesEnum.HTTP_OK;

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ createUserWallet ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async karmaBlacklistCheck(
		payload: UserLoginDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodesEnum.HTTP_OK,
			message: "User Onboarding Allowed",
		};
		try {
			const { email_or_phone_number, password } = payload;
			const axiosConfig: requestProp = {
				url: envConfig.PAYSTACK_BASE_URL + "/transaction/initialize",
				method: "POST",
				body: payload,
				headers: {
					authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
				},
			};
			const karmaCheckRequest = await axiosRequestFunction(axiosConfig);
			responseData = karmaCheckRequest;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ createUserWallet ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
}

export default UserService;
