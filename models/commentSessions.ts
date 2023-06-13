import { isDBready, knex } from "./__init__";

declare global {
    interface CommentSessionType {
        start: string,
        expires: string,
        mapId: number
    } 

    interface CommentSessionDoc extends CommentSessionType {
        id: number
    }

    interface FullSessionDoc extends CommentSessionDoc {
        comments: CommentDoc[]
    }
}

export const commentSessionsTable = (table:any) => {
    table.increments("id").primary();
    table.timestamp('start').defaultTo(knex.fn.now(0));
    table.timestamp('expires');
    table.integer('mapId').unsigned().nullable();
    table.foreign('mapId').references('id').inTable('map').onDelete('CASCADE').onUpdate('CASCADE');
}

const CommentSessions = {
    getById: async (id: number): Promise<CommentSessionDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('commentsessions')
            .where('id', id)
            .first();

        if(result) return result;
        else return false;
    },

    get: async (query: Partial<CommentSessionDoc> = {}): Promise<CommentSessionDoc[]> => {
        if(!isDBready) return [];

        const result = await knex('commentsessions')
            .where(query);

        return result;
    },

    create: async (data: CommentSessionType): Promise<CommentSessionDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('commentsessions')
            .returning('*')
            .insert(data);

        if(result[0]) return result[0];
        else return false;
    },

    update: async (id:number, data: Partial<CommentSessionType>): Promise<CommentSessionDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('commentsessions')
            .where('id', id)
            .returning('*')
            .update(data);

        if(result[0]) return result[0];
        else return false;
    },

    delete: async (id:number): Promise<boolean> => {
        if(!isDBready) return false;

        const result = await knex('commentsessions')
            .where('id', id)
            .del();

        if(result === 0) return false;
        else return true;
    }
}

export default CommentSessions;