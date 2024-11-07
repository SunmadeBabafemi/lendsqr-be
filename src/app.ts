import express, { Application, Request, Response } from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import Controller from "./common/interfaces/controller.interface";
import ErrorMiddleware from "./common/middleware/error.middleware";
import knex from "./db/knex";

class App {
	public express: Application;
	public port: number;

	constructor(controllers: Controller[], port: number) {
		this.express = express();
		this.port = port;
		this.initializeMiddleware();
		this.initializeControllers(controllers);
		this.initializeDefaultRoute();
		this.initializeErrorHandling();
		this.initializeDB();
	}

	private initializeMiddleware(): void {
		this.express.use(helmet());
		this.express.use(cors());
		this.express.use(morgan("dev"));
		this.express.use(express.json());
		this.express.use(express.urlencoded({ extended: false }));
		this.express.use(compression());
	}

	private initializeControllers(controllers: Controller[]): void {
		controllers.forEach((controller: Controller) => {
			this.express.use("/lendsqr/v1", controller.router);
		});
	}

	private initializeDefaultRoute(): void {
		this.express.get("/", (req: Request, res: Response) => {
			res.status(200).send("Welcome to the LendSQR API!"); // You can customize this message
		});
	}

	private initializeErrorHandling(): void {
		this.express.use(ErrorMiddleware);
	}

	private initializeDB(): void {
		knex
			.raw("SELECT 1")
			.then(() => console.log("Database connected successfully"))
			.catch((error) => {
				console.error("Database connection failed:", error);
				process.exit(1);
			});
	}

	public listen(): void {
		this.express.listen(this.port, () => {
			console.log(`server runing on port ${this.port}`);
		});
	}
}

export default App;
