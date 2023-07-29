import { isDBready, knex } from "./__init__";

/**
 * Declaring the types for a Tag schema globally.
 */
declare global {
    interface NodesToTags {
        nodeId: number
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
     * A get operation using the id as the parameter.
     * @param id the id of the nodeToTag link.
     * @returns If successful, returns the nodeToTag link. Otherwise returns false.
     */
    getById: async (id: number): Promise<NodesToTagsDoc | false> => {
        if(!isDBready) return false;
        
        try {
            const result = await knex('nodetotags')
                .where('id', id)
                .first();

            return result ? result : false;
        } catch (e) {
            console.log(e);
            return false;
        }
    },

    /**
     * A GET operation for querying tags based on if the fields are equal to the query object
     * @param query Any amount of fields to query against.
     * @returns An array of tags.
     */
    get: async (query: Partial<NodesToTagsDoc>): Promise<NodesToTagsDoc[]> => {
        if(!isDBready) return [];

        try {
            const result = await knex('nodetotags').where(query);
            return result;
        }
        catch(e) {
            console.log(e);
            return [];
        }
    },

    /**
     * A create operation for a tag.
     * @param data The data to create the tag with.
     * @returns The id of the newly created tag, or false upon failure
     */
    create: async (data: NodesToTags): Promise<number | false> => {
        if(!isDBready) return false;

        try {
            const result = await knex('nodetotags')
                .insert(data);

            return result[0] ? result[0] : false;
        }
        catch(e) {
            console.log(e);
            return false;
        }
    },

    /**
     * An update operation for a tag that overwrites any data at the given id.
     * @param id The id of the tag being overwritten
     * @param data The data to overwrite with.
     * @returns A boolean representing the success of the operation
     */
    update: async (id:number, data: Partial<NodesToTags>): Promise<boolean> => {
        if(!isDBready) return false;

        try{ 
            const result = await knex('nodetotags')
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
     * A delete operation for the tags specified by the id.
     * @param id The id of the tags
     * @returns a boolean representing the success of the operation.
     */
    delete: async (id:number | number[]): Promise<boolean> => {
        if(!isDBready) return false;

        try {
            const result = await knex('nodetotags')
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