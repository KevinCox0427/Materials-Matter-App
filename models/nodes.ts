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

export const nodesTable = (table:any) => {
    table.increments("id").primary();
    table.string('name');
    table.integer('index').unsigned();
    table.text('htmlContent');
    table.text('gallery');
    table.integer('rowId').unsigned().nullable();
    table.foreign('rowId').references('id').inTable('rows').onDelete('CASCADE').onUpdate('CASCADE');
}

const Nodes = {
    getById: async (id: number): Promise<NodeDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('nodes')
            .where('id', id)
            .first();

        if(result) return {...result,
            gallery: JSON.parse(result.gallery)
        };
        else return false;
    },
    
    get: async (query: Partial<NodeDoc> = {}): Promise<NodeDoc[]> => {
        if(!isDBready) return [];

        const result = await knex('nodes')
            .where(query);

        return result.map((node:any) => {
            return {...node,
                gallery: JSON.parse(node.gallery)
            }
        });
    },

    create: async (data: NodeType): Promise<boolean> => {
        if(!isDBready) return false;

        const result = await knex('nodes')
            .insert({...data,
                gallery: JSON.stringify(data.gallery)
            });

        return result[0] ? true : false;
    },

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

    delete: async (id:number): Promise<boolean> => {
        if(!isDBready) return false;

        const result = await knex('nodes')
            .where('id', id)
            .del();

        return result !== 0;
    }
}

export default Nodes;