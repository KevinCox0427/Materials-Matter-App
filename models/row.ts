import { isDBready, knex } from "./__init__";

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

export const rowTable = (table:any) => {
    table.increments("id").primary();
    table.string('name');
    table.integer('index').unsigned();
    table.integer('mapId').unsigned().nullable();
    table.foreign('mapId').references('id').inTable('map').onDelete('CASCADE').onUpdate('CASCADE');
}

const Row = {
    getById: async (id: number): Promise<RowDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('row')
            .where('id', id)
            .first();

        if(result) return result;
        else return false;
    },
    
    get: async (query: Partial<RowDoc> = {}): Promise<RowDoc[]> => {
        if(!isDBready) return [];

        const result = await knex('row')
            .where(query);

        return result;
    },

    create: async (data: RowType): Promise<RowDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('row')
            .returning('*')
            .insert(data);

        if(result[0]) return result[0];
        else return false;
    },

    update: async (id:number, data: Partial<RowType>): Promise<RowDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('row')
            .where('id', id)
            .returning('*')
            .update(data);

        if(result[0]) return result[0];
        else return false;
    },

    delete: async (id:number): Promise<boolean> => {
        if(!isDBready) return false;

        const result = await knex('row')
            .where('id', id)
            .del();

        if(result === 0) return false;
        else return true;
    }
}

export default Row;