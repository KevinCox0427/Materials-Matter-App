import { isDBready, knex } from "./__init__";
import { convertDatetime } from "./commentSessions";

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
    table.foreign('userId').references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE');
    table.integer('commentsessionId').unsigned().nullable();
    table.foreign('commentsessionId').references('id').inTable('commentsessions').onDelete('CASCADE').onUpdate('CASCADE');
    table.integer('replyId').unsigned().nullable();
    table.foreign('replyId').references('id').inTable('comments').onDelete('CASCADE').onUpdate('CASCADE');
}

const Comments = {
    getById: async (id: number): Promise<CommentDoc | false> => {
        if(!isDBready) return false;

        try {
            /**
             * Left joining user information to comment
             */
            const result = await knex('comments')
                .select('comments.*', 'users.firstName', 'users.lastName', 'users.image')
                .leftJoin('users', 'comments.userId', 'users.id')
                .where('comments.id', id)
                .first();

            return result ? {...result,
                timestamp: convertDatetime(result.timestamp.toLocaleString())
            } : false;
        }
        catch(e) {
            console.log(e);
            return false;
        }
    },

    get: async (query: Partial<CommentDoc> = {}, options?: {
        orderBy: string
    }): Promise<CommentDoc[]> => {
        if(!isDBready) return [];

        try {
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

            return result.map((comment:CommentDoc) => {
                return {...comment,
                    timestamp: convertDatetime(comment.timestamp.toLocaleString())
                }
            });
        }
        catch(e) {
            console.log(e);
            return [];
        }
    },

    create: async (data: CommentType): Promise<number | false> => {
        if(!isDBready) return false;

        try {
            const result = await knex('comments')
                .insert(data);

            return result[0] ? result[0] : false;
        }
        catch(e) {
            console.log(e);
            return false;
        }
    },

    update: async (id:number, data: Partial<CommentType>): Promise<boolean> => {
        if(!isDBready) return false;

        try{ 
            const result = await knex('comments')
                .where('id', id)
                .update(data);

            return result === 1;
        }
        catch(e) {
            console.log(e);
            return false;
        }
    },

    delete: async (id:number): Promise<boolean> => {
        if(!isDBready) return false;

        try {
            const result = await knex('comments')
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

export default Comments;