import { cleanEnv, str, port } from "envalid";

function validateEnv(): void {
	cleanEnv(process.env, {
		NODE_ENV: str({
			choices: [
				"dev",
				"prod",
				"local",
				"",
				"development",
				"production",
				"test",
			],
		}),
		// MONGO_URI: str(),
		// JWT_SECRET: str(),
		// CLOUDWATCH_GROUP_NAME: str(),

		PORT: port({ default: 9012 }),
	});
}

export default validateEnv;
