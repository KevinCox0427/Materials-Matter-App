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

export const rowsTable = (table:any) => {
    table.increments("id").primary();
    table.string('name');
    table.integer('index').unsigned();
    table.integer('mapId').unsigned().nullable();
    table.foreign('mapId').references('id').inTable('maps').onDelete('CASCADE').onUpdate('CASCADE');
}

const Rows = {
    getById: async (id: number): Promise<RowDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('rows')
            .where('id', id)
            .first();

        if(result) return result;
        else return false;
    },
    
    get: async (query: Partial<RowDoc> = {}): Promise<RowDoc[]> => {
        if(!isDBready) return [];

        const result = await knex('rows')
            .where(query);

        return result;
    },

    create: async (data: RowType): Promise<number | false> => {
        if(!isDBready) return false;

        const result = await knex('rows')
            .insert(data);

        return result[0] ? result[0] : false;
    },

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

    delete: async (id:number): Promise<boolean> => {
        if(!isDBready) return false;

        const result = await knex('rows')
            .where('id', id)
            .del();

        return result !== 0;
    }
}

export default Rows;