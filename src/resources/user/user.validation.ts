import {
	OtpPurposeOptions,
	SignupChannels,
	Timeline,
	UserTypes,
} from "../../common/enums";
import { email } from "envalid";
import Joi from "joi";

const updateFcm = Joi.object({
	token: Joi.string().required(),
});

const signupSchema = Joi.object({
	first_name: Joi.string().required(),
	last_name: Joi.string().required(),
	password: Joi.string().required(),
	email: Joi.string().required(),
	phone_number: Joi.string().required(),
	bvn: Joi.string().required(),
	nin: Joi.string().required(),
});

const loginSchema = Joi.object({
	password: Joi.string().required(),
	email_or_phone_number: Joi.string().required(),
});

export default {
	updateFcm,
	signupSchema,
	loginSchema,
};
