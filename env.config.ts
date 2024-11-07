import dotenv from "dotenv";
import {
	CloudUploadOption,
	MailSendingOptions,
	PaymentProvider,
} from "./src/common/enums";
import validateEnv from "./src/common/helpers/validateEnv";

dotenv.config();
validateEnv();

export default {
	NODE_PORT: process.env.NODE_PORT || 3000,
	NODE_ENV: process.env.NODE_ENV || 3000,
	ACCESS_SECRET: process.env.ACCESS_SECRET || "3000",
	ACCESS_TIME: process.env.ACCESS_TIME || "365d",
	CLOUDINARY_NAME: process.env.CLOUDINARY_NAME || 3000,
	CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 3000,
	CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 3000,
	CLOUD_UPLOAD_OPTION:
		process.env.CLOUD_UPLOAD_OPTION || CloudUploadOption.CLOUDINARY,
	DATABASE_NAME: process.env.DATABASE_NAME || CloudUploadOption.CLOUDINARY,
	DATABASE_PORT: process.env.DATABASE_PORT || CloudUploadOption.CLOUDINARY,
	DATABASE_HOST: process.env.DATABASE_HOST || CloudUploadOption.CLOUDINARY,
	DATABASE_PASSWORD:
		process.env.DATABASE_PASSWORD || CloudUploadOption.CLOUDINARY,
	DATABASE_USERNAME:
		process.env.DATABASE_USERNAME || CloudUploadOption.CLOUDINARY,
	DATABASE_URL: process.env.DATABASE_URL || CloudUploadOption.CLOUDINARY,
	MAIL_SENDER: process.env.MAIL_SENDER || MailSendingOptions.GMAIL,
	MAIL_AUTH_PASS: process.env.MAIL_AUTH_PASS || MailSendingOptions.GMAIL,
	MAIL_AUTH_USER: process.env.MAIL_AUTH_USER || MailSendingOptions.GMAIL,
	MAIL_HOST: process.env.MAIL_HOST || MailSendingOptions.GMAIL,
	SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || MailSendingOptions.GMAIL,
	MAILGUN_API_KEY: process.env.MAILGUN_API_KEY || MailSendingOptions.GMAIL,
	MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN || MailSendingOptions.GMAIL,
	MAILTRAP_URL: process.env.MAILTRAP_URL || MailSendingOptions.GMAIL,
	MAILTRAP_API_TOKEN:
		process.env.MAILTRAP_API_TOKEN || MailSendingOptions.GMAIL,
	MAILTRAP_DOMAIN: process.env.MAILTRAP_DOMAIN || MailSendingOptions.GMAIL,
	MAIL_TRAP_JWT: process.env.MAIL_TRAP_JWT || MailSendingOptions.GMAIL,
	MAIL_TRAP_HOST: process.env.MAIL_TRAP_HOST || MailSendingOptions.GMAIL,
	MAIL_TRAP_PORT: process.env.MAIL_TRAP_PORT || MailSendingOptions.GMAIL,
	MAIL_TRAP_USERNAME:
		process.env.MAIL_TRAP_USERNAME || MailSendingOptions.GMAIL,
	MAIL_TRAP_PASSWORD:
		process.env.MAIL_TRAP_PASSWORD || MailSendingOptions.GMAIL,
	MAIL_TRAP_STARTTLS:
		process.env.MAIL_TRAP_STARTTLS || MailSendingOptions.GMAIL,
	BREVO_API_KEY: process.env.BREVO_API_KEY || MailSendingOptions.GMAIL,
	BREVO_USERNAME: process.env.BREVO_USERNAME || MailSendingOptions.GMAIL,
	BREVO_MAIL_HOST: process.env.BREVO_MAIL_HOST || MailSendingOptions.GMAIL,
	BREVO_MAIL_PORT: process.env.BREVO_MAIL_PORT || MailSendingOptions.GMAIL,
	BREVO_MAIL_PASSWORD:
		process.env.BREVO_MAIL_PASSWORD || MailSendingOptions.GMAIL,
	PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || PaymentProvider.PAYSTACK,
	PAYSTACK_PUBLIC_KEY:
		process.env.PAYSTACK_PUBLIC_KEY || PaymentProvider.PAYSTACK,
	PAYSTACK_CALLBACK_URL:
		process.env.PAYSTACK_CALLBACK_URL || PaymentProvider.PAYSTACK,
	PAYSTACK_BASE_URL: process.env.PAYSTACK_BASE_URL || PaymentProvider.PAYSTACK,
	PAYSTACK_SECRET_KEY:
		process.env.PAYSTACK_SECRET_KEY || PaymentProvider.PAYSTACK,
	TERMINAL_AFRICA_PUBLIC_KEY:
		process.env.TERMINAL_AFRICA_PUBLIC_KEY || PaymentProvider.PAYSTACK,
	TERMINAL_AFRICA_SECRET_KEY:
		process.env.TERMINAL_AFRICA_SECRET_KEY || PaymentProvider.PAYSTACK,
	TERMINAL_AFRICA_BASE_URL:
		process.env.TERMINAL_AFRICA_BASE_URL || PaymentProvider.PAYSTACK,
	LENDSQR_BASE_URL: process.env.LENDSQR_BASE_URL || PaymentProvider.PAYSTACK,
	LENDSQR_API_SEC_KEY:
		process.env.LENDSQR_API_SEC_KEY || PaymentProvider.PAYSTACK,
	LENDSQR_API_ID: process.env.LENDSQR_API_ID || PaymentProvider.PAYSTACK,
};
