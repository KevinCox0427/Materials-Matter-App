import { isDBready, knex } from "./__init__";

/**
 * Declaring the types for a node schema globally.
 */
declare global {
    interface NodeType {
        name: string,
        index: number,
        rowId: number,
        gallery: string[],
        htmlContent: string
    } 

    interface NodeDoc extends NodeType {
        id: number
    }
}

/**
 * A function to create the SQL schema if not done so.
 * This will be run in __init__.ts
 */
export const nodesTable = (table:any) => {
    table.increments("id").primary();
    table.string('name');
    table.integer('index').unsigned();
    table.text('htmlContent');
    table.text('gallery');
    table.integer('rowId').unsigned().nullable();
    table.foreign('rowId').references('id').inTable('rows').onDelete('CASCADE').onUpdate('CASCADE');
}

/**
 * A nodes model to implement CRUD operations.
 */
const Nodes = {
    /**
     * A get operation using the id as the parameter.
     * @param id the id of the comment.
     * @returns If successful, returns the node. Otherwise returns false.
     */
    getById: async (id: number): Promise<NodeDoc | false> => {
        if(!isDBready) return false;

        try {
            const result = await knex('nodes')
                .where('id', id)
                .first();

            // Parsing the gallery as an array.
            return result ? {...result,
                gallery: JSON.parse(result.gallery)
            } : false;
        } 
        catch (e) {
            console.log(e);
            return false;
        }
    },
    
    /**
     * A get query using any amount of supplied information.
     * @param query (optional) Any data to query with.
     * @returns An array of found nodes. Returns empty array if none found.
     */
    get: async (query: Partial<NodeDoc> = {}): Promise<NodeDoc[]> => {
        if(!isDBready) return [];

        try {
            const result = await knex('nodes')
                .where(query);

            // parsing the gallery as an array
            return result.map((node:any) => {
                return {...node,
                    gallery: JSON.parse(node.gallery)
                }
            });
        }
        catch(e) {
            console.log(e);
            return [];
        }
    },

    /**
     * A create operation for a node.
     * @param data The data to create the node with.
     * @returns The id of the newly created node, or false upon failure
     */
    create: async (data: NodeType): Promise<boolean> => {
        if(!isDBready) return false;

        try {
            const result = await knex('nodes')
                .insert({...data,
                    gallery: JSON.stringify(data.gallery)
                });

            return result[0] ? true : false;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    },

    /**
     * An update operation for a node that overwrites any data at the given id.
     * @param id The id of the node being overwritten
     * @param data The data to overwrite with.
     * @returns A boolean representing the success of the operation
     */
    update: async (id:number, data: Partial<NodeType>): Promise<boolean> => {
        if(!isDBready) return false;

        try{ 
            const result = await knex('nodes')
                .where('id', id)
                .update({...data,
                    gallery: JSON.stringify(data.gallery)
                });

            return result === 1;
        } catch (e) {
            console.log(e);
            return false;
        }
    }, 

    /**
     * A delete operation for node(s) specified by the id.
     * @param id The id of the node(s).
     * @returns a boolean representing the success of the operation.
     */
    delete: async (id:number | number[]): Promise<boolean> => {
        if(!isDBready) return false;

        try { 
            const result = await knex('nodes')
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

export default Nodes;