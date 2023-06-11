import { isDBready, knex } from "./__init__";

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

export const nodeTable = (table:any) => {
    table.increments("id").primary();
    table.string('name');
    table.integer('index').unsigned();
    table.text('htmlContent');
    table.integer('rowId').unsigned().nullable();
    table.foreign('rowId').references('id').inTable('row').onDelete('CASCADE').onUpdate('CASCADE');
}

const Node = {
    getById: async (id: number): Promise<NodeDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('node')
            .where('id', id)
            .first();

        if(result) return result;
        else return false;
    },
    
    get: async (query: Partial<NodeDoc> = {}): Promise<NodeDoc[]> => {
        if(!isDBready) return [];

        const result = await knex('node')
            .where(query);

        return result;
    },

    create: async (data: NodeType): Promise<NodeDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('node')
            .returning('*')
            .insert(data);

        if(result[0]) return result[0];
        else return false;
    },

    update: async (id:number, data: Partial<NodeType>): Promise<NodeDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('node')
            .where('id', id)
            .returning('*')
            .update(data);

        if(result[0]) return result[0];
        else return false;
    },

    delete: async (id:number): Promise<boolean> => {
        if(!isDBready) return false;

        const result = await knex('node')
            .where('id', id)
            .del();

        if(result === 0) return false;
        else return true;
    }
}

export default Node;