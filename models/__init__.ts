import { commentsTable } from "./comments";
import { commentSessionsTable } from "./commentSessions";
import { imagesTable } from "./images";
import { mapsTable } from "./maps";
import { nodesTable } from "./nodes";
import { rowsTable } from "./rows";
import { usersTable } from "./users";

/**
 * Initalizing the conneciton to the postgres database.
 */
export const knex = require('knex')({
    client: 'mysql',
    connection: {
        host: process.env.sqlHost,
        port: process.env.sqlPort,
        user: process.env.sqlUser,
        password: process.env.sqlPass,
        database: process.env.sqlDatabase
    }
});

/**
 * A function to see if any tables are missing from the database.
 * If so, it will create all the tables necessary for the application.
 * 
 * @returns A boolean representing whether the operation of creating / checking the tables are a success.
 */
const initializeTableSchemas = async () => {
    /**
     * Checking to see if the table exists. If not, create it with the provided schema.
     */
    const createAllTables = (await Promise.all(Object.keys(tableSchemas).map(tableName => { 
        return new Promise<boolean>(async (resolve) => {
            if(!(await knex.schema.hasTable(tableName) as boolean)) {
                resolve(knex.schema.createTable(tableName, tableSchemas[tableName as keyof typeof tableSchemas]) as boolean);
            } else {
                resolve(true);
            }
        });
    }))).every(success => success);

    isDBready = true;

    /**
     * Returning the success of the operation.
     */
    return createAllTables;
}

/**
 * Table schemas with their table names.
 */
const tableSchemas = {
    users: usersTable,
    maps: mapsTable,
    rows: rowsTable,
    nodes: nodesTable,
    images: imagesTable,
    comments: commentsTable,
    commentsessions: commentSessionsTable
} 

export let isDBready = false;
initializeTableSchemas();