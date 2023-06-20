import { isDBready, knex } from "./__init__";
import { convertDatetime } from "./commentSessions";

/**
 * Declaring the typing on the data structure for a comment.
 */
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

/**
 * A function to create the SQL schema if not done so.
 * This will be run in __init__.ts
 */
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

/**
 * A comments model to implement CRUD operations.
 */
const Comments = {
    /**
     * A get operation using the id as the parameter.
     * @param id the id of the comment.
     * @returns If successful, returns the comment joined with its user. Otherwise returns false.
     */
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

    /**
     * A get query using any amount of supplied information.
     * @param query (optional) Any data to query with.
     * @param options (optional) Can specify any amount of further options for the GET query.
     * Options include:
     *      orderBy: string  -  The way the commments are order. Default is by id.
     * @returns An array of found comments. Returns empty array if none found.
     */
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

    /**
     * A create operation for a comment.
     * @param data The data to create the comment with.
     * @returns The id of the newly created comment, or false upon failure
     */
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

    /**
     * An update operation for a comment that overwrites any data at the given id.
     * @param id The id of the comment being overwritten
     * @param data The data to overwrite with.
     * @returns A boolean representing the success of the operation
     */
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

    /**
     * A delete operation for comment(s) specified by the id.
     * @param id The id of the comment(s).
     * @returns a boolean representing the success of the operation.
     */
    delete: async (id:number | number[]): Promise<boolean> => {
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