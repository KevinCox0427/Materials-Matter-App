import { commentsTable } from "./comments";
import { commentSessionsTable } from "./commentSessions";
import { imagesTable } from "./images";
import { mapsTable } from "./maps";
import { nodesTable } from "./nodes";
import { nodesToTagsTable } from "./nodesToTags";
import { rowsTable } from "./rows";
import { tagsTable } from "./tags";
import { usersTable } from "./users";

/**
 * Initalizing the conneciton to the mysql database.
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
 * Reference to db start since its connection is asynchronous
 */
export let isDBready = false;

/**
 * Table schemas with their table names.
 */
const tableSchemas = {
    users: usersTable,
    maps: mapsTable,
    rows: rowsTable,
    nodes: nodesTable,
    tags: tagsTable,
    nodesToTags: nodesToTagsTable,
    images: imagesTable,
    commentsessions: commentSessionsTable,
    comments: commentsTable
}

/**
 * An asynchronous function that's called on boat to see if any tables are missing from the database.
 * It will create all tables necessary for the application.
 * @returns A boolean representing whether the success of the operation.
 */
const initializeTableSchemas = async () => {
    /**
     * Checking to see if all schemas table exists. If not, create them with the imported schemas.
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

initializeTableSchemas();