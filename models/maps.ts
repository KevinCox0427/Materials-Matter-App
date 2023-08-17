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
                    CASE WHEN COUNT(t1.id) > 0 THEN JSON_ARRAYAGG(JSON_OBJECT(
                        'id', t1.id,
                        'name', t1.name,
                        'mapId', t1.mapId
                    )) ELSE JSON_ARRAY() END as 'tags',
                    IFNULL((
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
                                    SELECT 
                                        JSON_ARRAYAGG(JSON_OBJECT(
                                            'id', n.id,
                                            'name', n.name,
                                            'index', n.index,
                                            'rowId', r.id,
                                            'thumbnail', n.thumbnail,
                                            'htmlContent', n.htmlContent,
                                            'action', n.action,
                                            'filter', n.filter,
                                            'tags', n.tags
                                        )) as 'nodes'
                                    FROM (
                                        SELECT
                                            n2.id,
                                            n2.name,
                                            n2.index,
                                            n2.rowId,
                                            n2.thumbnail,
                                            n2.htmlContent,
                                            n2.action,
                                            n2.filter,
                                            CASE WHEN COUNT(t2.id) > 0 THEN JSON_ARRAYAGG(JSON_OBJECT(
                                                'id', t2.id,
                                                'name', t2.name,
                                                'mapId', t2.mapId
                                            )) ELSE JSON_ARRAY() END as 'tags',
                                            ROW_NUMBER() OVER(PARTITION BY n2.index ORDER BY n2.index) AS array_index
                                        FROM \`nodes\` n2
                                        LEFT JOIN \`nodesToTags\` nt ON nt.nodeId = n2.id
                                        LEFT JOIN \`tags\` t2 ON t2.id = nt.tagId
                                        WHERE n2.rowId = r.id
                                        GROUP BY n2.id
                                    ) n
                                    GROUP BY n.rowId
                                    ORDER BY n.array_index
                                ), JSON_ARRAY())
                            )
                        ) as 'rows'
                        FROM (
                            SELECT
                                r2.id, r2.name, r2.index, r2.mapId,
                                ROW_NUMBER() OVER(PARTITION BY r2.index ORDER BY r2.index) AS array_index
                            FROM \`rows\` r2
                            WHERE r2.mapId = ?
                        ) r
                        GROUP BY r.mapId
                        ORDER BY r.array_index
                    ), JSON_ARRAY()) as 'rows'
                FROM \`maps\` m
                LEFT JOIN \`tags\` t1 ON t1.mapId = m.id
                WHERE m.id = ?
                LIMIT 1;
            `, [id, id]);
            
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

            return true;
        }
        catch(e) {
            console.log(e);
            return false;
        }
    }
}

export default Maps;