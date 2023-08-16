import { isDBready, knex } from "./__init__";

/**
 * Declaring the types for a Tag schema globally.
 */
declare global {
    interface Tag {
        name: string,
        mapId: number
    }

    interface TagDoc extends Tag {
        id: number
    }
}

/**
 * A function to create the SQL schema if not done so.
 * This will be run in __init__.ts
 */
export const tagsTable = (table:any) => {
    table.increments("id").primary();
    table.string('name');
    table.integer('mapId').unsigned().nullable();
    table.foreign('mapId').references('id').inTable('maps').onDelete('CASCADE').onUpdate('CASCADE');
}

/**
 * A tags model to implement CRUD operations.
 */
const Tags = {
    /**
     * A create operation for a tag.
     * @param data The data to create the tag with.
     * @returns The id of the newly created tag, or false upon failure
     */
    create: async (data: Tag[]): Promise<number | false> => {
        if(!isDBready) return false;

        try {
            const result = await knex('tags')
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
    update: async (id:number, data: Partial<Tag>): Promise<boolean> => {
        if(!isDBready) return false;

        try{ 
            const result = await knex('tags')
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
    delete: async (id: number[]): Promise<boolean> => {
        if(!isDBready) return false;

        try {
            const result = await knex('tags')
                .whereIn('id', id)
                .del();
            
            return true;
        }
        catch(e) {
            console.log(e);
            return false;
        }   
    }
}

export default Tags;