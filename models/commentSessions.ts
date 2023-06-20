import { isDBready, knex } from "./__init__";

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

export const commentSessionsTable = (table:any) => {
    table.increments("id").primary();
    table.text('name');
    table.timestamp('start').defaultTo(knex.fn.now(0));
    table.timestamp('expires');
    table.integer('mapId').unsigned().nullable();
    table.foreign('mapId').references('id').inTable('maps').onDelete('CASCADE').onUpdate('CASCADE');
}

const CommentSessions = {
    getById: async (id: number): Promise<CommentSessionDoc | false> => {
        if(!isDBready) return false;
        
        try {
            const result = await knex('commentsessions')
                .where('id', id)
                .first();

            return result ? {...result,
                start: convertDatetime(result.start.toLocaleString()),
                expires: convertDatetime(result.expires.toLocaleString()),
            } : false
        } catch (e) {
            console.log(e);
            return false;
        }
    },

    get: async (query: Partial<CommentSessionDoc> = {}): Promise<CommentSessionDoc[]> => {
        if(!isDBready) return [];

        try {
            const result = await knex('commentsessions')
                .where(query);

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

    delete: async (id:number): Promise<boolean> => {
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