import { isDBready, knex } from "./__init__";

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
        timestamp: string,
        firstName: string,
        lastName: string,
        image: string
    }
}

export const commentsTable = (table:any) => {
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

const Comments = {
    getById: async (id: number): Promise<CommentDoc | false> => {
        if(!isDBready) return false;

        /**
         * Left joining user information to comment
         */
        const result = await knex('comments')
            .select('comments.*', 'users.firstName', 'users.lastName', 'users.image')
            .leftJoin('users', 'comments.userId', 'users.id')
            .where('comments.id', id)
            .first();

        if(result) return result;
        else return false;
    },

    get: async (query: Partial<CommentDoc> = {}, options?: {
        orderBy: string
    }): Promise<CommentDoc[]> => {
        if(!isDBready) return [];

        /**
         * Left joining user information to comment
         */
        const result = await knex('comments')
            .select('comments.*', 'users.firstName', 'users.lastName', 'users.image')
            .leftJoin('users', 'comments.userId', 'users.id')
            .where(query)
            .modify((queryBuilder:any) => {
                if(options?.orderBy) {
                    queryBuilder.orderBy(options.orderBy)
                }
            })

        return result;
    },

    create: async (data: CommentType): Promise<number | false> => {
        if(!isDBready) return false;

        const result = await knex('comments')
            .insert(data);

        return result[0] ? result[0] : false;
    },

    update: async (id:number, data: Partial<CommentType>): Promise<number | false> => {
        if(!isDBready) return false;

        const result = await knex('comments')
            .where('id', id)
            .update(data);

        return result[0] ? result[0] : false;
    },

    delete: async (id:number): Promise<boolean> => {
        if(!isDBready) return false;

        const result = await knex('comments')
            .where('id', id)
            .del();

        return result === 0 ? false : true;
    }
}

export default Comments;