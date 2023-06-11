import { isDBready, knex } from "./__init__";

declare global {
    interface MapType {
        name: string
    } 

    interface MapDoc extends MapType {
        id: number
    }

    interface FullMapDoc extends MapDoc {
        rows: FullRowDoc[]
    }
}

export const mapTable = (table:any) => {
    table.increments("id").primary();
    table.string('name');
}

const Map = {
    getById: async (id: number): Promise<MapDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('map')
            .where('id', id)
            .first();

        if(result) return result;
        else return false;
    },

    get: async (query: Partial<MapDoc> = {}): Promise<MapDoc[]> => {
        if(!isDBready) return [];

        const result = await knex('map')
            .where(query);

        return result;
    },

    create: async (data: MapType): Promise<MapDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('map')
            .returning('*')
            .insert(data);

        if(result[0]) return result[0];
        else return false;
    },

    update: async (id:number, data: Partial<MapType>): Promise<MapDoc | false> => {
        if(!isDBready) return false;

        const result = await knex('map')
            .where('id', id)
            .returning('*')
            .update(data);

        if(result[0]) return result[0];
        else return false;
    },

    delete: async (id:number): Promise<boolean> => {
        if(!isDBready) return false;

        const result = await knex('map')
            .where('id', id)
            .del();

        if(result === 0) return false;
        else return true;
    }
}

export default Map;