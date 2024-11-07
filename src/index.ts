import envConfig from "../env.config";
import App from "./app";
import TransactionController from "./resources/transactions/transaction.controller";
import UserController from "./resources/user/user.controller";

const app = new App(
	[new UserController(), new TransactionController()],
	Number(envConfig.NODE_PORT)
);
app.listen();
