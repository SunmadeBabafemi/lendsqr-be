import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { verify } from "jsonwebtoken";
import axios from "axios";
import knex from "../../db/knex";
import { verifyToken } from "../helpers/token";
import { tableNames } from "../constants";
import Token from "../interfaces/token.interface";
import HttpException from "../exceptions/http.exception";
import { User } from "../../entites/User";

async function authenticatedMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const bearer = req.headers.authorization;
	if (!bearer || !bearer.startsWith("Bearer ")) {
		console.log("🚀 ~ NO bearer:", bearer);
		next(new HttpException(401, "Unauthorized"));
		return;
	}

	const accessToken = bearer.split("Bearer ")[1].trim();
	try {
		const payload: Token | jwt.JsonWebTokenError = await verifyToken(
			accessToken
		);
		if (payload instanceof jwt.JsonWebTokenError) {
			console.log("🚀 ~ JWT ERROR:", payload);
			next(new HttpException(401, "Unauthorized"));
			return;
		}

		const user = await knex(tableNames.users)
			.select(
				"users.id",
				"users.first_name",
				"users.last_name",
				"users.email",
				"users.phone_number",
				"users.accessToken",
				"users.phone_number",
				"wallets.current_balance as current_balance",
				"wallets.previous_balance as previous_balance"
			)
			.leftJoin("wallets", "users.wallet_id", "wallets.id")
			.where("users.id", payload.id)
			.first();

		if (!user) {
			console.log("🚀 ~ USER NOT FOUND:", user);
			next(new HttpException(401, "Unauthorized"));
			return;
		}

		req.user = user as User;
		next();
	} catch (error) {
		console.error("🚀 ~ error:", error);
		next(new HttpException(401, "Unauthorized"));
	}
}

export default authenticatedMiddleware;
