import { isDBready, knex } from "./__init__";

/**
 * Declaring the types for a row schema globally.
 */
declare global {
    interface RowType {
        name: string,
        index: number,
        mapId: number
    } 

    interface RowDoc extends RowType {
        id: number
    }

    interface FullRowDoc extends RowDoc {
        nodes: NodeDoc[]
    }
}

/**
 * A function to create the SQL schema if not done so.
 * This will be run in __init__.ts
 */
export const rowsTable = (table:any) => {
    table.increments("id").primary();
    table.string('name');
    table.integer('index').unsigned();
    table.integer('mapId').unsigned().nullable();
    table.foreign('mapId').references('id').inTable('maps').onDelete('CASCADE').onUpdate('CASCADE');
}

/**
 * A rows model to implement CRUD operations.
 */
const Rows = {
    /**
     * A get operation using the id as the parameter.
     * @param id the id of the comment.
     * @returns If successful, returns the comment. Otherwise returns false.
     */
    getById: async (id: number): Promise<RowDoc | false> => {
        if(!isDBready) return false;
        
        try {
            const result = await knex('rows')
                .where('id', id)
                .first();

            return result ? result : false;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    
    /**
     * A get query using any amount of supplied information.
     * @param query (optional) Any data to query with.
     * @returns An array of found rows. Returns empty array if none found.
     */
    get: async (query: Partial<RowDoc> = {}): Promise<RowDoc[]> => {
        if(!isDBready) return [];

        try {
            const result = await knex('rows')
                .where(query);

            return result;
        }
        catch (e) {
            console.log(e);
            return [];
        }
    },

    /**
     * A create operation for a row.
     * @param data The data to create the row with.
     * @returns The id of the newly created row, or false upon failure
     */
    create: async (data: RowType): Promise<number | false> => {
        if(!isDBready) return false;

        try {
            const result = await knex('rows')
                .insert(data);

            return result[0] ? result[0] : false;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    },

    /**
     * An update operation for a row that overwrites any data at the given id.
     * @param id The id of the row being overwritten
     * @param data The data to overwrite with.
     * @returns A boolean representing the success of the operation
     */
    update: async (id:number, data: Partial<RowType>): Promise<boolean> => {
        if(!isDBready) return false;

        try {
            const result = await knex('rows')
                .where('rows.id', id)
                .update(data);
            
            return result === 1;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    },
    
    /**
     * A delete operation for row(s) specified by the id.
     * @param id The id of the row(s).
     * @returns a boolean representing the success of the operation.
     */
    delete: async (id:number | number[]): Promise<boolean> => {
        if(!isDBready) return false;

        try{ 
            const result = await knex('rows')
                .where('id', id)
                .del();

            return result !== 0;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    }
}

export default Rows;