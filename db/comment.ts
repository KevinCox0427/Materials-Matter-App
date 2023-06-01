import { isDBready, knex } from "./__init";

declare global {
    interface CommentType {
        content: string,
        x: number | null,
        y: number | null,
        userId: number,
        commentsessionId: number,
        replyId: number | null
    } 

    interface CommentDoc extends CommentType {
        id: number,
        timestamp: string
    }
}

export const commentTable = (table:any) => {
    table.increments("id").primary();
    table.timestamp('timestamp').defaultTo(knex.fn.now(0));
    table.text('content');
    table.integer('x').unsigned().nullable();
    table.integer('y').unsigned().nullable();
    table.integer('userId').unsigned().nullable();
    table.foreign('userId').references('id').inTable('user').onDelete('CASCADE').onUpdate('CASCADE');
    table.integer('commentsessionId').unsigned().nullable();
    table.foreign('commentsessionId').references('id').inTable('commentsession').onDelete('CASCADE').onUpdate('CASCADE');
    table.integer('replyId').unsigned().nullable();
    table.foreign('replyId').references('id').inTable('comment').onDelete('CASCADE').onUpdate('CASCADE');
}

const Comment = {
    getById: async (id: number): Promise<CommentDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('comment')
            .where('id', id)
            .first();

        if(result) return result;
        else return false;
    },

    get: async (query: Partial<CommentDoc> = {}): Promise<CommentDoc[]> => {
        if(!isDBready) return [];

        const result = await knex('comment')
            .where(query);

        return result;
    },

    create: async (data: CommentType): Promise<CommentDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('comment')
            .returning('*')
            .insert(data);

        if(result[0]) return result[0];
        else return false;
    },

    update: async (id:number, data: Partial<CommentType>): Promise<CommentDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('comment')
            .where('id', id)
            .returning('*')
            .update(data);

        if(result[0]) return result[0];
        else return false;
    },

    delete: async (id:number): Promise<boolean> => {
        if(!isDBready) return false;

        const result = await knex('comment')
            .where('id', id)
            .del();

        if(result === 0) return false;
        else return true;
    }
}

export default Comment;