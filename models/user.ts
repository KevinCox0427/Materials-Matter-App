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
 * The function for creating the table schema based on the typings above.
 */
export const userTable = (table:any) => {
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
const User = {
    /**
     * A get operation using an id as a parameter.
     * 
     * @param id the id of the datatype.
     * @returns If successful, returns the datatype found. Otherwise returns false.
     */
    getByID: async (id:number): Promise<UserDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('user')
            .where('id', id)
            .first();

        if(result) return result
        else return false;
    },

    /**
     * A get query using any amount of supplied information.
     * 
     * @param query The supplied information to query with.
     * @returns An array of found datatypes. Returns empty array if none found.
     */
    get: async (query: Partial<UserDoc> = {}): Promise<UserDoc[]> => {
        if(!isDBready) return [];
        
        const result = await knex('user')
            .where(query);

        return result;
    },


    /**
     * A create operation for a user.
     * 
     * @param newUser The datatype to be created. Must be a full data structure (no Id need, created by SQL).
     * 
     * @returns If successful, return the Id(primary key). Otherwise return false.
     */
    create: async (newUser:UserType): Promise<UserDoc | false> => {
        if(!isDBready) return false;

        const createResult = await knex('user')
            .returning('*')
            .insert(newUser);

        if(createResult[0]) return createResult[0];
        else return false;
    },

    /**
     * An update operation for the data type.
     * Overwrites the data type with the supplied Id with any amount of supplied information.
     * 
     * @param id The id of the data type being overwritten
     * @param userData The pieces of data to overwrite with.
     * @returns If sucessful, returns the new data type that's been edited. Otherwise return false.
     */

    update: async(id:number, userData:Partial<UserType>): Promise<UserDoc | false> => {
        if(!isDBready) return false;

        const updateResult = await knex('user')
            .where('id', id)
            .returning('*')
            .update(userData);

        if(updateResult[0]) return updateResult[0];
        else return false;
    },

    /**
     * A delete operation for the data type specified by the Id.
     * 
     * @param id The id of the user.
     * @returns Boolean representing if it was successful.
     */
    delete: async(id: number[]): Promise<boolean> => {
        if(!isDBready) return false;

        const deletedUser = await knex('user')
            .where('id', id)
            .del();
        
        if(deletedUser === 0) return false;
        else return true;
    }
}

export default User;