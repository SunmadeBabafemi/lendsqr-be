import { StatusMessages } from "../enums";
import { HttpCodesEnum } from "../enums/httpCodes.enum";

interface ResponseData extends Object {
	status: StatusMessages;
	code: HttpCodesEnum;
	message: string;
	data?: Object | any;
}

export default ResponseData;
