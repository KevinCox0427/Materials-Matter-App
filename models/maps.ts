import { isDBready, knex } from "./__init__";

/**
 * Declaring the types for a map schema globally.
 * Also declaring the type for a join SQL table with its nodes and rows, along with a nested object version.
 */
declare global {
    interface MapType {
        name: string
    } 

    interface MapDoc extends MapType {
        id: number,
        tags: TagDoc[]
    }

    interface FullMapDoc extends MapDoc {
        rows: FullRowDoc[]
    }
}

/**
 * A function to create the SQL schema if not done so.
 * This will be run in __init__.ts
 */
export const mapsTable = (table:any) => {
    table.increments("id").primary();
    table.string('name');
}

/**
 * A map model to implement CRUD operations.
 */
const Maps = {
    /**
     * A get operation using the id as the parameter.
     * @param id the id of the map.
     * @returns If successful, returns the joined SQL map table with its nodes and rows. Otherwise returns false.
     */
    getById: async (id: number): Promise<FullMapDoc | false> => {
        if(!isDBready) return false;

        try {
            const result = await knex.raw(`
                SELECT
                    m.id,
                    m.name,
                    IFNULL((
                        WITH tagData AS (
                            SELECT 
                                t.id,
                                t.name,
                                t.mapId,
                                IF(COUNT(n2.id) = 0, JSON_ARRAY(), JSON_ARRAYAGG(n2.id)) as 'nodeIds'
                            FROM \`tags\` t
                            LEFT JOIN \`nodesToTags\` nt ON nt.tagId = t.id
                            LEFT JOIN \`nodes\` n2 ON n2.id = nt.nodeId
                            GROUP BY t.id
                        )
                        SELECT JSON_ARRAYAGG(JSON_OBJECT(
                            'id', t.id,
                            'name', t.name,
                            'mapId', t.mapId,
                            'nodeIds', t.nodeIds
                        ))
                        FROM \`tagData\` t
                        WHERE t.mapId = m.id
                    ), JSON_ARRAY()) as 'tags',
                    IFNULL((
                        WITH rowData AS (
                            SELECT
                                r.id, r.name, r.index, r.mapId,
                                ROW_NUMBER() OVER(PARTITION BY r.index ORDER BY r.index) AS array_index
                            FROM \`rows\` r
                            WHERE r.mapId = ?
                        )
                        SELECT JSON_ARRAYAGG(
                            JSON_INSERT(
                                JSON_OBJECT(
                                    'id', r.id,
                                    'name', r.name,
                                    'index', r.index,
                                    'mapId', r.mapId
                                ),
                                '$.nodes',
                                IFNULL ((
                                    WITH
                                        nodeData as (
                                            SELECT
                                                n.id,
                                                n.name,
                                                n.index,
                                                n.rowId,
                                                n.gallery,
                                                n.htmlContent,
                                                n.action,
                                                n.filter,
                                                ROW_NUMBER() OVER(PARTITION BY n.index ORDER BY n.index) AS array_index
                                            FROM \`nodes\` n
                                            WHERE n.rowId = r.id
                                            GROUP BY n.id
                                        )
                                    SELECT 
                                        JSON_ARRAYAGG(JSON_OBJECT(
                                            'id', n.id,
                                            'name', n.name,
                                            'index', n.index,
                                            'rowId', r.id,
                                            'gallery', n.gallery,
                                            'htmlContent', n.htmlContent,
                                            'action', n.action,
                                            'filter', n.filter
                                        )) as 'nodes'
                                    FROM \`nodeData\` n
                                    WHERE n.rowId = r.id
                                    GROUP BY n.rowId
                                    ORDER BY n.array_index
                                ), JSON_ARRAY())
                            )
                        ) as 'rows'
                        FROM \`rowData\` r
                        WHERE r.mapId = ?
                        GROUP BY r.mapId
                        ORDER BY r.array_index
                    ), JSON_ARRAY()) as 'rows'
                FROM \`maps\` m
                WHERE m.id = ?
                GROUP BY m.id
                LIMIT 1
            `, [id, id, id]);
            
            if(result[0].length === 0) {
                return false;
            }

            const parseResult = {...result[0][0],
                rows: JSON.parse(result[0][0].rows),
                tags: JSON.parse(result[0][0].tags)
            };

            return parseResult;
        } catch(e) {
            console.log(e);
            return false;
        }
    },

    /**
     * A get query using any amount of supplied information.
     * @param query (optional) Any data to query with.
     * @param options (optional) Can specify any amount of further options for the GET query.
     * Options include:
     *      amount: number  -  The number of users to return. Defaults to 20.
     *      offset: number  -  An offset amount to start the query. Defaults to 0.
     * @returns An array of found maps. Returns empty array if none found.
     */
    get: async (query: Partial<MapDoc> = {}, options?: Partial<{
        amount: number,
        offset: number
    }>): Promise<MapDoc[]> => {
        if(!isDBready) return [];

        try {
            const getResult = await knex('maps')
                .where(query)
                /**
                 * A function to conditionally add SQL clauses to the query.
                 * This will be used to add our "options".
                 */
                .modify((queryBuilder: any) => {
                    if(options?.amount) {
                        queryBuilder.limit(1);
                    }
                    if(options?.offset) {
                        queryBuilder.offset(1);
                    }
                });

            return getResult;
        }
        catch(e) {
            console.log(e);
            return [];
        }
    },

    /**
     * A create operation for a map.
     * @param data The data to create the map with.
     * @returns The id of the newly created map, or false upon failure
     */
    create: async (data: MapType): Promise<number | false> => {
        if(!isDBready) return false;

        try {
            const createResult = await knex('maps')
                .insert(data);

            return createResult[0] ? createResult[0] : false;
        }
        catch(e) {
            console.log(e);
            return false;
        }
    },

    /**
     * An update operation for a map that overwrites any data at the given id.
     * @param id The id of the map being overwritten
     * @param data The data to overwrite with.
     * @returns A boolean representing the success of the operation
     */
    update: async (id:number, data: Partial<MapType>): Promise<boolean> => {
        if(!isDBready) return false;

        try {
            const result = await knex('maps')
                .where('id', id)
                .update(data);

            return result === 1;
        }
        catch(e) {
            console.log(e);
            return false;
        }
    },

    /**
     * A delete operation for map(s) specified by the id.
     * @param id The id of the map(s).
     * @returns a boolean representing the success of the operation.
     */
    delete: async (id:number | number[]): Promise<boolean> => {
        if(!isDBready) return false;

        try {
            const result = await knex('maps')
                .where('id', id)
                .del();

            return result !== 0;
        }
        catch(e) {
            console.log(e);
            return false;
        }
    }
}

export default Maps;