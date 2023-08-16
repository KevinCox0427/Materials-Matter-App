import { isDBready, knex } from "./__init__";

/**
 * Declaring the types for a Tag schema globally.
 */
declare global {
    interface NodesToTags {
        nodeId: number,
        tagId: number
    }

    interface NodesToTagsDoc extends NodesToTags {
        id: number
    }
}

/**
 * A function to create the SQL schema if not done so.
 * This will be run in __init__.ts
 */
export const nodesToTagsTable = (table:any) => {
    table.increments("id").primary();
    table.integer('tagId').unsigned().nullable();
    table.foreign('tagId').references('id').inTable('tags').onDelete('CASCADE').onUpdate('CASCADE');
    table.integer('nodeId').unsigned().nullable();
    table.foreign('nodeId').references('id').inTable('nodes').onDelete('CASCADE').onUpdate('CASCADE');
}

/**
 * A link table that links a many-to-many relationship with nodes and tags.
 */
const NodesToTags = {
    /**
     * A create operation for a nodeToTag.
     * @param data The data to create the nodeToTag with.
     * @returns The id of the newly created nodeToTag, or false upon failure
     */
    create: async (data: NodesToTags[]): Promise<number | false> => {
        if(!isDBready) return false;

        try {
            const result = await knex('nodesToTags')
                .insert(data);

            return result[0] ? result[0] : false;
        }
        catch(e) {
            console.log(e);
            return false;
        }
    },

    /**
     * A delete operation for the nodeToTags specified by the id.
     * @param id The id of the nodeToTags
     * @returns a boolean representing the success of the operation.
     */
    delete: async (nodesToTags: NodesToTags[]): Promise<boolean> => {
        if(!isDBready) return false;

        try {
            const result = await knex('nodesToTags')
                .whereIn(['nodeId', 'tagId'], nodesToTags.map(nodeToTag => [nodeToTag.nodeId, nodeToTag.tagId]))
                .del();
            
            return true;
        }
        catch(e) {
            console.log(e);
            return false;
        }   
    }
}

export default NodesToTags;