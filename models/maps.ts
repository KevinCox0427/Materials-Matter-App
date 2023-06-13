import { isDBready, knex } from "./__init__";

/**
 * Declaring the types for a map schema globally.
 */
declare global {
    interface MapType {
        name: string
    } 

    interface MapDoc extends MapType {
        id: number
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
     * 
     * @param id the id of the map.
     * @returns If successful, returns the map found. Otherwise returns false.
     */
    getById: async (id: number): Promise<FullMapDoc | false> => {
        if(!isDBready) return false;

        try {
            /**
             * Left joining all the rows and nodes to this map.
             */
            const getResult = await knex('maps')
                .select('maps.*',
                    'rows.id as rowId',
                    'rows.name as rowName',
                    'rows.index as rowIndex',
                    'nodes.id as nodeId',
                    'nodes.index as nodeIndex',
                    'nodes.name as nodeName',
                    'nodes.htmlContent as nodeHtmlContent',
                    'nodes.gallery as nodeGallery'
                )
                .where('maps.id', id)
                .leftJoin('rows', 'rows.mapId', 'maps.id')
                .leftJoin('nodes', 'nodes.rowId', 'rows.id')

            if(!getResult || getResult.length < 1) return false;

            /**
             * Now we'll structure all these SQL rows into a JSON object.
             */
            let map:FullMapDoc = {
                id: getResult[0].id,
                name: getResult[0].name,
                rows: []
            }

            /**
             * Looping through each node and adding it to the correct row.
             */
            getResult.forEach((node:any) => {
                /**
                 * If the row doesn't exist, then we have to add it.
                 */
                if(!map.rows[node.rowIndex]) map.rows.push({
                    id: node.rowId,
                    mapId: node.id,
                    index: node.rowIndex,
                    name: node.rowName,
                    nodes: []
                });

                /**
                 * Pushing the node into the row if it exists.
                 */
                if(node.nodeId) map.rows[node.rowIndex].nodes.push({
                    id: node.nodeId,
                    rowId: node.rowId,
                    index: node.nodeIndex,
                    name: node.nodeName,
                    htmlContent: node.nodeHtmlContent,
                    gallery: JSON.parse(node.nodeGallery)
                })
            });

            return map;
        }
        catch(e) {
            console.log(e);
            return false;
        }
    },

    /**
     * A get query using any amount of supplied information.
     * 
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
     * 
     * @param data The data to create the map with.
     * @returns A boolean representing the success of the operation.
     */
    create: async (data: MapType): Promise<number | boolean> => {
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
     * An update operation for a map.
     * Overwrites the data at the supplied id.
     * 
     * @param id The id of the map being overwritten
     * @param data The pieces of data to overwrite with.
     * @returns Boolean representing the success of the operation
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
     * 
     * @param id The id of the map(s).
     * @returns a boolean representing the success of the operation.
     */
    delete: async (id:number): Promise<boolean> => {
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