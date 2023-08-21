import { Server } from 'socket.io';
import http from 'http';
import { app, session } from '../server';
import passport from 'passport';
import { Session } from 'express-session';
import RegexTester from "../utils/regexTester";
import CommentSessions from "../models/commentSessions";
import Comments from "../models/comments";
import { regexStrings } from './map';

/**
 * Declaration merging the incoming requests to include express's sessions and passport's user objects.
 */
declare module "http" {
    interface IncomingMessage {
        session: Session,
        user?: UserDoc
    }
}

/**
 * Intantiating our Socket.io server and the http server to use it with.
 */
export const server = http.createServer(app);
export const io = new Server(server, {
    cors: {
        origin: process.env.originURL || "localhost:3000",
        methods: ["GET", "POST"]
    }
});

/**
 * Using the express session and passport sessions as middleware functions in Socket.io
 */
io.engine.use(session);
io.engine.use(passport.initialize());
io.engine.use(passport.session());

/**
 * Only allowing authenticated users to use the socket.io server.
 */
io.use((socket, next) => {
    if(socket.request.user) next();
    else next(new Error('Unauthenticated'));
});

/**
 * Creating a socket.io connection to post and recieve comments.
 */
io.on("connect", (socket) => {
    /**
     * Socket for posting a new comment
     */
    socket.on("postComment", async (requestData) => {
        const newComment = await createComment(requestData);

        if(typeof newComment === 'string') socket.emit("recieveComment", newComment);
        else io.emit("recieveComment", newComment);
    });

    /**
     * Socket for saving a new session
     */
    socket.on("saveSession", async (requestData) => {
        console.log(requestData)
        const newSession = await editSession(requestData);

        if(typeof newSession === 'string') socket.emit("recieveSession", newSession);
        else io.emit("recieveSession", newSession);
    });

    /**
     * Socket for deleting sesions.
     */
    socket.on("deleteSession", async (requestData) => {
        if(typeof requestData !== 'number') {
            socket.emit("recieveDeleteSession", 'Comment session id must be a number.');
            return;
        }

        const deleteResult = await CommentSessions.delete(requestData);
        if(deleteResult) io.emit("recieveDeleteSession", requestData);
        else socket.emit("recieveDeleteSession", 'Invalid comment session id.');
    })
});

/**
 * A utility class to test the incoming request objects against an object of regex.
 * See utils/regexTester.ts for more info.
 */
const commentRegex = new RegexTester({
    content: regexStrings.text,
    x: regexStrings.id,
    y: regexStrings.id,
    userId: regexStrings.number,
    commentsessionId: regexStrings.number,
    replyId: /^[\-0-9]{1,6}|^null/
});

const sessionRegex = new RegexTester({
    id: regexStrings.id,
    mapId: regexStrings.number,
    name: regexStrings.text,
    start: regexStrings.date,
    expires: regexStrings.date,
});

/**
 * Function to create a comment from a Socket.io request.
 * @param requestData The request recieved in socket.io
 * @returns The new comment object that was just created
 */
async function createComment(requestData:any) {
    // Running the regex test to make sure its valid data.
    const regexResult = commentRegex.runTest(requestData);
    if(typeof regexResult === 'string') return regexResult;
    
    const parsedData = requestData as CommentType;

    // Checking the session to see if it's still active.
    const sessionResult = await CommentSessions.getById(parsedData.commentsessionId);

    if(!sessionResult) return 'Comment Session not found.';
    if(new Date() > new Date(sessionResult.expires)) return 'Comment Session has expired.';
    if(new Date() < new Date(sessionResult.start)) return 'Comment Session hasn\'t started';

    // Creating the comment in the db.
    const createResult = await Comments.create(parsedData);

    // Returning the results.
    if(!createResult) return 'Comment failed to be inserted into the database';

    const newComment = await Comments.getById(createResult);
    return newComment ? newComment : 'Comment failed to be retrieved from the database';
}

/**
 * A function to edit a session from a socket.io request.
 * @param requestData The request from socket.io.
 * @returns The new session object just editted.
 */
async function editSession(requestData: any) {
    // Running a regex test to make sure the data is valid.
    const regexResult = sessionRegex.runTest(requestData);
    if(typeof regexResult === 'string') return regexResult;

    // If the session's id is -1, that means it's a new session and must be created in the db.
    if(regexResult.id === -1) {
        // Creating in db.
        const createResult = await CommentSessions.create({
            mapId: regexResult.mapId,
            name: regexResult.name,
            start: regexResult.start,
            expires: regexResult.expires,
        });
        
        // Returning the result.
        if(!createResult) return 'Failed to create comment session.';
        const getResult = await CommentSessions.getById(createResult);
        return getResult ? getResult : 'Failed to retrieve new comment session.'
    }
    // Otherwise if it has an id, that means it must be updated.
    else {
        // Updating in db.
        const updateResult = await CommentSessions.update(regexResult.id, {
            mapId: regexResult.mapId,
            name: regexResult.name,
            start: regexResult.start,
            expires: regexResult.expires,
        });

        // Returning the result.
        if(!updateResult) return 'Failed to update comment session.';
        const getResult = await CommentSessions.getById(regexResult.id);
        return getResult ? getResult : 'Failed to retrieve updated comment session.'
    }
}