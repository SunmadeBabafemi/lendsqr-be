const status = {
	ACTIVE: "ACTIVE",
	PENDING: "PENDING",
	FAILED: "FAILED",
	SUCCESS: "SUCCESS",
	INACTIVE: "INACTIVE",
	BLOCKED: "BLOCKED",
	APPROVE: "APPROVE",
	DECLINED: "DECLINED",
};

const currency = {
	NGN: "NGN",
	USD: "USD",
};

const cardType = {
	VIRTUAL: "VIRTUAL",
	PHYSICAL: "PHYSICAL",
};

const httpStatusMessage = {
	success: "success",
	error: "error",
};

export const tableNames = {
	users: "users",
	wallets: "wallets",
	transaction_logs: "transaction_logs",
	pins: "pins",
};

export default { status, currency, cardType, httpStatusMessage, tableNames };
