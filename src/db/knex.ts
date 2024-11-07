import Knex from "knex";
import knexConfig from "../../knexfile";

const environment = process.env.NODE_ENV || "development";
console.log("🚀 ~ environment:", environment);
const knex = Knex(knexConfig[environment]);

export default knex;
