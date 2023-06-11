import { isDBready, knex } from "./__init__";

declare global {
    interface ImageType {
        index: number,
        nodeId: number,
    } 

    interface ImageDoc extends ImageType {
        id: number
    }
}

export const imageTable = (table:any) => {
    table.increments("id").primary();
    table.integer("index").unsigned();
    table.integer('nodeId').unsigned().nullable();
    table.foreign('nodeId').references('id').inTable('node').onDelete('CASCADE').onUpdate('CASCADE');
}

const Image = {
    getById: async (id: number): Promise<ImageDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('image')
            .where('id', id)
            .first();

        if(result) return result;
        else return false;
    },
    
    get: async (query: Partial<ImageDoc> = {}): Promise<ImageDoc[]> => {
        if(!isDBready) return [];

        const result = await knex('image')
            .where(query);

        return result;
    },

    create: async (data: ImageType): Promise<ImageDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('image')
            .returning('*')
            .insert(data);

        if(result[0]) return result[0];
        else return false;
    },

    update: async (id:number, data: Partial<ImageType>): Promise<ImageDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('image')
            .where('id', id)
            .returning('*')
            .update(data);

        if(result[0]) return result[0];
        else return false;
    },

    delete: async (id:number): Promise<boolean> => {
        if(!isDBready) return false;

        const result = await knex('image')
            .where('id', id)
            .del();

        if(result === 0) return false;
        else return true;
    }
}

export default Image;