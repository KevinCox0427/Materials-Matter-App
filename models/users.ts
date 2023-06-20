import { isDBready, knex } from './__init__';

/**
 * Declaring the typing on the data structure for a user.
 */
declare global {
    interface UserType  {
        firstName: string,
        lastName: string
        email: string,
        image: string
        admin: boolean
    }

    interface UserDoc extends UserType {
        id:number,
        distance?: number
    }
}

/**
 * A function to create the SQL schema if not done so.
 * This will be run in __init__.ts
 */
export const usersTable = (table:any) => {
    table.increments("id").primary();
    table.string('firstName');
    table.string('lastName');
    table.string('image');
    table.string('email');
    table.boolean('admin');
}; 

/**
 * An abstracted object to interact with the User's data.
 */
const Users = {
    /**
     * A get operation using an id as a parameter.
     * 
     * @param id the id of the datatype.
     * @returns If successful, returns the datatype found. Otherwise returns false.
     */
    getByID: async (id:number): Promise<UserDoc | false> => {
        if(!isDBready) return false;

        try {
            const result = await knex('users')
                .where('id', id)
                .first();

            return result ? result : false;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    },

    /**
     * A get query using any amount of supplied information.
     * 
     * @param query The supplied information to query with.
     * @returns An array of found datatypes. Returns empty array if none found.
     */
    get: async (query: Partial<UserDoc> = {}): Promise<UserDoc[]> => {
        if(!isDBready) return [];
        
        try {
            const result = await knex('users')
                .where(query);

            return result;
        }
        catch (e) {
            console.log(e);
            return [];
        }
    }, 


    /**
     * A create operation for a user.
     * @param newUser The datatype to be created. Must be a full data structure (no Id need, created by SQL).
     * @returns If successful, return the Id. Otherwise return false.
     */
    create: async (newUser:UserType): Promise<number | false> => {
        if(!isDBready) return false;

        try { 
            const createResult = await knex('users')
                .insert(newUser);

            return createResult[0] ? createResult[0] : false;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    },

    /**
     * An update operation for a user that overwrites any data at the given id.
     * @param id The id of the user being overwritten
     * @param data The data to overwrite with.
     * @returns A boolean representing the success of the operation
     */
    update: async(id:number, userData:Partial<UserType>): Promise<boolean> => {
        if(!isDBready) return false;

        try{
            const updateResult = await knex('users')
                .where('id', id)
                .update(userData);

            return updateResult === 1;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    },

    /**
     * A delete operation for the data type specified by the Id.
     * @param id The id of the user.
     * @returns Boolean representing if it was successful.
     */
    delete: async(id:number | number[]): Promise<boolean> => {
        if(!isDBready) return false;

        try { 
            const deletedUser = await knex('users')
                .where('id', id)
                .del();
            
            return deletedUser !== 0;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    }
}

export default Users;