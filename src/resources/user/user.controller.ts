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
import UserService from "./user.service";
import validate from "./user.validation";
import { responseObject } from "../../common/helpers/http.response";
import { HttpCodes } from "../../common/constants/httpcode";
// import authenticatedMiddleware from "../../common/middleware/authenticated.middleware";
import { CreateUserDto, UserLoginDto } from "./user.dto";
import knex from "../../db/knex";

class UserController implements Controller {
	public path = "/users";
	public router = Router();
	private userService = new UserService(knex);

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.post(
			`${this.path}/signup`,
			validationMiddleware(validate.signupSchema),
			this.createUser as RequestHandler
		);

		this.router.post(
			`${this.path}/login`,
			validationMiddleware(validate.loginSchema),
			this.userLogin as RequestHandler
		);
	}

	private createUser = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: CreateUserDto = req.body;

			const { status, code, message, data } = await this.userService.createUser(
				body
			);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private userLogin = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: UserLoginDto = req.body;

			const { status, code, message, data } = await this.userService.userLogin(
				body
			);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default UserController;
