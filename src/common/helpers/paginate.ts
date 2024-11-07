import knex from "../../db/knex";

export interface PaginatePayload {
	table_name: string;
	limit: number;
	page: number;
	filter?: any;
}

export const paginateRecords = async (payload: PaginatePayload) => {
	try {
		var { table_name, limit = 10, page = 1, filter } = payload;
		const maxLimit = Math.min(limit, 100);
		const offset = (page - 1) * limit;
		const [{ total }] = await knex(table_name)
			.where(filter)
			.count("* as total");

		const data = await knex(table_name)
			.where(filter)
			.select("*")
			.orderBy("created_at", "desc")
			.limit(limit)
			.offset(offset);
		const totalCount = Number(total);

		const response = {
			data,
			pagination: {
				pageSize: maxLimit,
				totalCount: totalCount,
				pageCount: Math.ceil(totalCount / maxLimit),
				currentPage: page,
				hasNext: page * maxLimit < totalCount,
			},
		};
		return response;
	} catch (error) {
		console.error("🚀 ~ paginateRecords ~ error:", error);
	}
};
