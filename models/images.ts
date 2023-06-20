import { isDBready, knex } from "./__init__";
import { S3, PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config();

/**
 * Declaring the type for an image schema globally.
 */
declare global {
    interface ImageDoc {
        extension: string,
        id: number
    }
}

/**
 * Creating the s3 client to upload to aws.
 */
const s3Client = new S3({
    region: process.env.awsRegion,
    credentials:{
        accessKeyId: process.env.awsKey || '',
        secretAccessKey: process.env.awsSecret || ''
    }
});

/**
 * A function to create the SQL schema if not done so.
 * This will be run in __init__.ts
 */
export const imagesTable = (table:any) => {
    table.increments("id").primary();
    table.string("extension");
}

/**
 * An image model to implement CRUD operations.
 */
const Images = {
    /**
     * A get operation using the id as the parameter.
     * @param id the id of the datatype.
     * @returns If successful, returns the datatype found. Otherwise returns false.
     */
    getById: async (id: number): Promise<ImageDoc | false> => {
        if(!isDBready) return false;

        try {
            const result = await knex('images')
                .where('id', id)
                .first();

            return result ? result : false;
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
     *      amount: number  -  The number of users to return. Defaults to 20.
     *      offset: number  -  An offset amount to start the query. Defaults to 0.
     * @returns An array of found images. Returns empty array if none found.
     */
    get: async (query: Partial<ImageDoc> = {}, options?: Partial<{
        amount: number,
        offset: number
    }>): Promise<ImageDoc[]> => {
        if(!isDBready) return [];

        try {
            const result = await knex('images')
                .where(query)
                /**
                 * A function to conditionally add SQL clauses to the query.
                 * This will be used to add our "options".
                 */
                .modify((queryBuilder: any) => {
                    if(options?.amount) {
                        queryBuilder.limit(1);
                    }
                    if(options?.offset) {
                        queryBuilder.offset(1);
                    }
                });

            return result;
        }
        catch(e) {
            console.log(e);
            return [];
        }
    },

    /**
     * A create operation for a user.
     * This will upload the image to the S3 bucket and use its id as the name.
     * @param newImage The metadata to create the image with.
     * @param base64 The base64 encoded image data.
     * @returns The url of the new image. Otherwise return false.
     */
    create: async (base64:string): Promise<string | false> => {
        if(!isDBready) return false;

        const extension = base64.split(';base64,')[0].split('data:image/')[1];
        const base64Data = base64.split(';base64,')[1];

        if(!(extension && base64Data)) return false;

        try{ 
            const createResult = await knex('images')
                .insert({
                    extension: extension
                });

            if(!createResult[0]) return false;
            
            try {
                await s3Client.send(new PutObjectCommand({
                    Bucket: process.env.awsBucket || '',
                    Key: `${createResult[0]}.${extension}`,
                    Body: Buffer.from(base64Data, 'base64')
                }));
            }
            catch(e) {
                console.log(e);
                await Images.delete(createResult[0]);
                return false;
            }

            return `${process.env.awsUrl || ''}${createResult[0]}.${extension}`;
        }
        catch(e:any) {
            console.log(e);
            return false;
        }
    },

    /**
     * A delete operation for image(s) specified by the id.
     * @param urls The url(s) of the image(s).
     * @returns a boolean representing the success of the operation.
     */
    delete: async (urls:string[]): Promise<boolean> => {
        if(!isDBready) return false;

        try {
            /**
             * Deleting the file from aws.
             */
            await s3Client.send(new DeleteObjectsCommand({
                Bucket: process.env.awsBucket || '',
                Delete: {
                    Objects: urls.map(url => {
                        return {
                            Key: url.split(process.env.awsUrl || '')[1],
                        }
                    })
                }
            }));

            const result = await knex('images')
                .whereIn('id', urls.map(url => parseInt(url.split(process.env.awsUrl || '')[1].split('.')[0])))
                .del();

            return result !== 0;
        }
        /**
         * If aws fails, return false.
         */
        catch(e) {
            console.log(e);
            return false;
        }
    }
}

export default Images;