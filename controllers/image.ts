import express from "express";
import { isAuth } from "../utils/authentication";
import RegexTester from "../utils/regexTester";
import Image from "../models/images";

const image = express.Router();

/**
 * A Utility class that will run regex tests on a structure object.
 * See utils/regexTester.ts for more info.
 */
const postRegex = new RegexTester({
    image: /^data:image\/(?:jpg|png|jpeg|webp)(?:;charset=utf-8)?;base64,(?:[A-Za-z0-9+\/])+={0,2}/,
    nodeId: /^[0-9]{1,10}/
});

const deleteRegex = new RegexTester({
    urls: new RegExp(`${process.env.awsUrl}[0-9]{1,10}.(jpg|jpeg|png|gif|webp|svg)`)
})

image.route('/')
    .post(isAuth, async (req, res) => {
        // Parsing the incoming request with regex.
        const parsedReq = postRegex.runTest(req.body);

        // If it returns a string, it's an error message and we can return it.
        if(typeof parsedReq === 'string') {
            res.status(400).send({
                error: parsedReq,
                success: false
            });
            return;
        }

        const typedReq = parsedReq as {
            image: string,
            nodeId: number
        }

        // Inserting the info into the database.
        const newImage = await Image.create(typedReq.image, typedReq.nodeId);

        // If it fails, return an error message.
        if(!newImage) {
            res.status(400).send({
                error: 'Server failed to create image.',
                success: false
            });
            return;
        }

        // Returning the url if successful.
        res.status(200).send({
            url: newImage,
            success: true
        });
    })
    .delete(isAuth, async (req, res) => {
        // Parsing the incoming request with regex.
        const parsedReq = deleteRegex.runTest(req.body);

        // If it returns a string, it's an error message and we can return it.
        if(typeof parsedReq === 'string') {
            res.status(400).send({
                error: parsedReq,
                success: false
            });
            return;
        }

        const typedReq = parsedReq as {
            urls: string[]
        }

        // Inserting the info into the database.
        const result = await Image.delete(typedReq.urls);

        // Returning the url if successful.
        res.status(200).send({
            success: result
        });
    })

export default image;