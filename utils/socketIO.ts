import { Server } from 'socket.io';
import http from 'http';
import { app, session } from '../server';
import passport from 'passport';
import { Session } from 'express-session';

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
        origin: "localhost:3000",
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
})