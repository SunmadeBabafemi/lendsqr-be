import { Knex } from "knex";
import { TransactionStatus } from "../../common/enums";

export async function up(knex: Knex): Promise<void> {
	await knex.schema
		.createTable("users", (table) => {
			table.uuid("id").primary().notNullable();
			table.string("first_name").notNullable();
			table.string("last_name").notNullable();
			table.string("email").unique().notNullable();
			table.string("phone_number").unique().notNullable();
			table.string("bvn").unique().notNullable();
			table.string("nin").unique().notNullable();
			table.string("password").notNullable();
			table.string("accessToken").nullable();
			table.string("wallet_id").unique();
			table.boolean("is_verified").defaultTo(false);
			table.string("profile_image").nullable();
			table.timestamps(true, true);
		})
		.createTable("wallets", (table) => {
			table.uuid("id").primary().notNullable();
			table
				.uuid("user_id")
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");
			table.decimal("current_balance", 14, 2).notNullable().defaultTo(0.0);
			table.decimal("previous_balance", 14, 2).notNullable().defaultTo(0.0);
			table.timestamps(true, true);
		})
		.createTable("transaction_logs", (table) => {
			table.uuid("id").primary().notNullable();
			table
				.uuid("user_id")
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");
			table.string("reference");
			table.decimal("amount", 14, 2).notNullable();
			table.string("type").notNullable();
			table.string("status").defaultTo(TransactionStatus.PENDING);
			table.string("narration_type").nullable();
			table.string("receipient_id").nullable();
			table.string("sender_id").nullable();
			table.timestamps(true, true);
		})
		.createTable("pins", (table) => {
			table.uuid("id").primary().notNullable();
			table
				.uuid("user_id")
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");
			table.string("pin").notNullable();
			table.timestamps(true, true);
		});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema
		.dropTableIfExists("pins")
		.dropTableIfExists("transaction_logs")
		.dropTableIfExists("wallets")
		.dropTableIfExists("users");
}
