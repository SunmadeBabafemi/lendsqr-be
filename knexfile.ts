import envConfig from "./env.config";
import { Knex } from "knex";
import * as fs from "fs";

const connectionOptions = {
	host: envConfig.DATABASE_HOST,
	user: envConfig.DATABASE_USERNAME,
	password: envConfig.DATABASE_PASSWORD,
	port: Number(envConfig.DATABASE_PORT),
	database: envConfig.DATABASE_NAME,
	ssl: {
		rejectUnauthorized: false,
		ca: fs.readFileSync("./ca.pem"),
	},
	connectTimeout: 10000,
};

const connectionOptionsWithString = {
	connectionString: envConfig.DATABASE_URL,
};

const knexConfig: { [key: string]: Knex.Config } = {
	development: {
		client: "mysql2",
		connection: connectionOptionsWithString.connectionString,
		migrations: {
			directory: "./src/db/migrations",
		},
		seeds: {
			directory: "./src/db/seeds",
		},
	},
	production: {
		client: "mysql2",
		connection: {
			connectionString: envConfig.DATABASE_URL,
			ssl: {
				rejectUnauthorized: true,
			},
		},
		migrations: {
			directory: "./src/db/migrations",
		},
		seeds: {
			directory: "./src/db/seeds",
		},
	},
};

export default knexConfig;
