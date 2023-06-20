import { isDBready, knex } from "./__init__";

/**
 * Declaring the typing on the data structure for a comment session.
 * Also delcaring a type for a nested object representation of a comment session joined with its comments.
 */
declare global {
    interface CommentSessionType {
        name: string,
        start: string,
        expires: string,
        mapId: number
    } 

    interface CommentSessionDoc extends CommentSessionType {
        id: number
    }

    interface FullSessionDoc extends CommentSessionDoc {
        comments: {
            [replyId: string]: CommentDoc[]
        }
    }
}

/**
 * A helper function to convert HH:MM:SS AM/PM to HH:MM:SS
 * @param time The inputted time string
 */
export function convertDatetime(datetime:string) {
    const dateArray = datetime.split(', ')[0].split('/');
    dateArray.unshift(dateArray.pop()!);
    const dateString = dateArray.map(value => value.padStart(2, '0')).join('-');

    const time = datetime.split(', ')[1];
    const timeString = time.split(':').map((timeSection, i) => (parseInt(timeSection) + (i == 0 && time.slice(-2) === 'PM' ? 12 : 0) - (parseInt(timeSection) === 12 ? 12 : 0)).toString().padStart(2, '0')).join(':');

    return `${dateString} ${timeString}`;
}

/**
 * A function to create the SQL schema if not done so.
 * This will be run in __init__.ts
 */
export const commentSessionsTable = (table:any) => {
    table.increments("id").primary();
    table.text('name');
    table.timestamp('start').defaultTo(knex.fn.now(0));
    table.timestamp('expires');
    table.integer('mapId').unsigned().nullable();
    table.foreign('mapId').references('id').inTable('maps').onDelete('CASCADE').onUpdate('CASCADE');
}

/**
 * A comment sessions model to implement CRUD operations.
 */
const CommentSessions = {
    /**
     * A get operation using the id as the parameter.
     * @param id the id of the comment session.
     * @returns If successful, returns the comment session. Otherwise returns false.
     */
    getById: async (id: number): Promise<CommentSessionDoc | false> => {
        if(!isDBready) return false;
        
        try {
            const result = await knex('commentsessions')
                .where('id', id)
                .first();

            // Converting the timestamps so they're usuable on the front-end.
            return result ? {...result,
                start: convertDatetime(result.start.toLocaleString()),
                expires: convertDatetime(result.expires.toLocaleString()),
            } : false
        } catch (e) {
            console.log(e);
            return false;
        }
    },

    /**
     * A get query using any amount of supplied information.
     * @param query (optional) Any data to query with.
     * @returns An array of found comment sessions. Returns empty array if none found.
     */
    get: async (query: Partial<CommentSessionDoc> = {}): Promise<CommentSessionDoc[]> => {
        if(!isDBready) return [];

        try {
            const result = await knex('commentsessions')
                .where(query);

            // Converting the timestamps so they're usuable on the front-end.
            return result.map((session:CommentSessionDoc) => {
                return {...session,
                    start: convertDatetime(session.start.toLocaleString()),
                    expires: convertDatetime(session.expires.toLocaleString()),
                }
            });
        }
        catch (e) {
            console.log(e);
            return [];
        }
    },

    /**
     * A create operation for a comment session.
     * @param data The data to create the comment session with.
     * @returns The id of the newly created comment session, or false upon failure
     */
    create: async (data: CommentSessionType): Promise<number | false> => {
        if(!isDBready) return false;
        
        try {
            const result = await knex('commentsessions')
                .insert(data);

            return result[0] ? result[0] : false;
        }
        catch(e) {
            console.log(e);
            return false;
        }
    },

    /**
     * An update operation for a comment session that overwrites any data at the given id.
     * @param id The id of the comment session being overwritten
     * @param data The data to overwrite with.
     * @returns A boolean representing the success of the operation
     */
    update: async (id:number, data: Partial<CommentSessionType>): Promise<boolean> => {
        if(!isDBready) return false;
        
        try {
            const result = await knex('commentsessions')
                .where('id', id)
                .update(data);

            return result === 1;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    },

    /**
     * A delete operation for comment session(s) specified by the id.
     * @param id The id of the comment session(s).
     * @returns a boolean representing the success of the operation.
     */
    delete: async (id:number | number[]): Promise<boolean> => {
        if(!isDBready) return false;

        try {
            const result = await knex('commentsessions')
                .where('id', id)
                .del();

            return result !== 0;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    }
}

export default CommentSessions;