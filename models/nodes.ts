import { isDBready, knex } from "./__init__";

/**
 * Declaring the types for a node schema globally.
 */
declare global {
    interface NodeType {
        name: string,
        index: number,
        rowId: number,
        thumbnail: string,
        htmlContent: string,
        action: 'filter' | 'content',
        filter: number | null
    } 

    interface NodeDoc extends NodeType {
        id: number
    }

    interface FullNodeDoc extends NodeDoc {
        tags: TagDoc[]
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
    table.json('gallery');
    table.integer('rowId').unsigned().nullable();
    table.foreign('rowId').references('id').inTable('rows').onDelete('CASCADE').onUpdate('CASCADE');
    table.string('action').defaultTo('content');
    table.integer('filter').unsigned().nullable();
    table.foreign('filter').references('id').inTable('tags').onDelete('SET_NULL').onUpdate('SET_NULL');
}

/**
 * A nodes model to implement CRUD operations.
 */
const Nodes = {
    /**
     * A create operation for many nodes.
     * @param data The data to create the nodes with.
     * @returns The id of the first node (because MySQL is so awesome), or false upon failure
     */
    create: async (nodes: NodeType[]): Promise<number | false> => {
        if(!isDBready) return false;

        try {
            const result = await knex('nodes')
                .insert(nodes);

            return result[0] ? result[0] : false;
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
    update: async (id:number, data: Partial<NodeDoc>): Promise<boolean> => {
        if(!isDBready) return false;

        try{ 
            const result = await knex('nodes')
                .where('id', id)
                .update(data);

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
    delete: async (id:number[]): Promise<boolean> => {
        if(!isDBready) return false;

        try { 
            const result = await knex('nodes')
                .whereIn('id', id)
                .del();

            return true;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    }
}

export default Nodes;