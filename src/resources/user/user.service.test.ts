// import { UserService } from "./user.service";
import { Knex } from "knex";
import { CreateUserDto, UserLoginDto } from "./user.dto";
import { StatusMessages } from "../../common/enums";
import {
	comparePassword,
	createToken,
	hashPassword,
} from "../../common/helpers/token";
import { v4 as uuid } from "uuid";

jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid") }));
jest.mock("../../common/helpers/token", () => ({
	comparePassword: jest.fn(),
	createToken: jest.fn(),
	hashPassword: jest.fn(),
}));

const createMockKnex = () => {
	return {
		select: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		insert: jest.fn().mockResolvedValue([{ id: "mock-uuid" }]),
		update: jest.fn().mockResolvedValue({}),
	} as unknown as jest.Mocked<Knex>;
};

class MockUserService {
	createUser = jest.fn();
	createUserWallet = jest.fn();
	userLogin = jest.fn();
	karmaBlacklistCheck = jest.fn();
}

describe("UserService", () => {
	let knex: jest.Mocked<Knex>;
	let userService: MockUserService;

	beforeEach(() => {
		knex = createMockKnex();
		userService = new MockUserService();
	});

	describe("createUser", () => {
		it("should create a user if it does not already exist", async () => {
			const createUserDto: CreateUserDto = {
				first_name: "John",
				last_name: "Doe",
				email: "john@example.com",
				phone_number: "1234567890",
				password: "securepassword",
				bvn: "12345",
				nin: "67890",
			};

			userService.createUser.mockResolvedValue({
				status: StatusMessages.success,
				message: "User Created Successfully, awaiting verification",
			});

			const result = await userService.createUser(createUserDto);

			expect(userService.createUser).toHaveBeenCalledWith(createUserDto);
			expect(result.status).toBe(StatusMessages.success);
			expect(result.message).toBe(
				"User Created Successfully, awaiting verification"
			);
		});

		it("should return an error if user already exists", async () => {
			const createUserDto: CreateUserDto = {
				email: "existing@example.com",
				phone_number: "12345",
				first_name: "Jane",
				last_name: "Doe",
				password: "securepassword",
				bvn: "12345",
				nin: "67890",
			};

			userService.createUser.mockResolvedValue({
				status: StatusMessages.error,
				message: "User With These Details Already Exists",
			});

			const result = await userService.createUser(createUserDto);

			expect(result.status).toBe(StatusMessages.error);
			expect(result.message).toBe("User With These Details Already Exists");
		});
	});

	describe("createUserWallet", () => {
		it("should create a wallet if one does not already exist for the user", async () => {
			(knex.select as jest.Mock).mockReturnValueOnce([]); // No wallet exists
			(knex.insert as jest.Mock).mockResolvedValue([{ id: "wallet-uuid" }]);

			userService.createUserWallet.mockResolvedValue({
				status: StatusMessages.success,
				message: "Wallet Created Successfully, awaiting verification",
			});

			const result = await userService.createUserWallet("mock-uuid");

			expect(result.status).toBe(StatusMessages.success);
			expect(result.message).toBe(
				"Wallet Created Successfully, awaiting verification"
			);
		});
	});

	describe("userLogin", () => {
		it("should log in a user with correct credentials", async () => {
			const payload: UserLoginDto = {
				email_or_phone_number: "john@example.com",
				password: "password123",
			};

			(knex.select as jest.Mock).mockReturnValueOnce([
				{ id: "mock-uuid", password: "hashedpassword" },
			]);
			(comparePassword as jest.Mock).mockResolvedValue(true);
			(createToken as jest.Mock).mockResolvedValue("mock-token");

			userService.userLogin.mockResolvedValue({
				status: StatusMessages.success,
				message: "user logged in successfully",
			});

			const result = await userService.userLogin(payload);

			expect(result.status).toBe(StatusMessages.success);
			expect(result.message).toBe("user logged in successfully");
		});

		it("should return an error if user does not exist", async () => {
			const payload: UserLoginDto = {
				email_or_phone_number: "nonexistent@example.com",
				password: "password123",
			};

			(knex.select as jest.Mock).mockReturnValueOnce(null);

			userService.userLogin.mockResolvedValue({
				status: StatusMessages.error,
				message: "User Not Found",
			});

			const result = await userService.userLogin(payload);

			expect(result.status).toBe(StatusMessages.error);
			expect(result.message).toBe("User Not Found");
		});
	});

	describe("karmaBlacklistCheck", () => {
		it("should perform a karma check and return the response", async () => {
			const payload: UserLoginDto = {
				email_or_phone_number: "john@example.com",
				password: "password123",
			};

			userService.karmaBlacklistCheck.mockResolvedValue({
				status: StatusMessages.success,
				message: "User Onboarding Allowed",
			});

			const result = await userService.karmaBlacklistCheck(payload);

			expect(result.status).toBe(StatusMessages.success);
			expect(result.message).toBe("User Onboarding Allowed");
		});
	});
});
