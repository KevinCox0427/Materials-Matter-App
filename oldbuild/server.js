var express = require("express");
var session = require("express-session");
var resolve = require("path").resolve;
var bodyParser = require("body-parser");
var cors = require("cors");
var AWS = require('aws-sdk');
var { OAuth2Client } = require('google-auth-library');



var s3Client = new AWS.S3({
    region: "",
    accessKeyId: '',
    secretAccessKey: ''
});
//For Bing
/*
var googleConfig = {
  clientId: '',
  clientSecret: '',
  redirect: 'https://materialsmattertest.herokuapp.com/Menu'
};
*/

//For personal
var googleConfig = {
    clientId: '',
    clientSecret: '',
    redirect: 'https://teachingappdemo.herokuapp.com/callback'
};

const OAuth = new OAuth2Client(googleConfig.clientId);
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
var app = express();
app.disable("etag");


class Comment {
    constructor(session, user, message, position, id){
        this.session = session;
        this.user = user;
        this.message = message;
        this.position = position;
        this.id = id;
        this.replyLength = 0;
        this.replies = [];
    }
    
    export() {
        var exportObject = {
            'session': this.session,
            'user': this.user,
            'message': this.message,
            'position': this.position,
            'id': this.id,
            'replyLength': this.replyLength,
            'replies': []
        };
        for(var i = 0; i < this.replies.length; i++){
            exportObject.replies.push(this.replies[i].export());
        }
        return exportObject;
    }
}

class Session {
    constructor(mapID, date){
        this.mapID = mapID;
        this.date = date;
        this.id = this.mapID + '-' + this.date;
        this.replyLength = 0;
        this.replies = [];
    }
    
    export() {
        var exportObject = {
            'mapID': this.mapID,
            'date': this.date,
            'id': this.id,
            'replyLength': this.replyLength,
            'replies': []
        }
        for(var i = 0; i < this.replies.length; i++){
            exportObject.replies.push(this.replies[i].export());
        }
        return exportObject;
    }
}

hasNewComments = [];
Timer = -10, commentBuffer = [];
setCommentTimer(10);



passport.use(new GoogleStrategy({
        clientID:     googleConfig.clientId,
        clientSecret: googleConfig.clientSecret,
        callbackURL: "https://teachingappdemo.herokuapp.com/callback",
        passReqToCallback   : true
    },
    function(request, accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
)); 
passport.serializeUser(async function(user, done){
    done(null, user);
});
passport.deserializeUser(function(user, done){
    done(null, user);
});

app.use('/static', express.static("public"));
app.use(bodyParser.json({limit: "10mb"}));
app.use(bodyParser.urlencoded({limit: "10mb", extended: true, parameterLimit:10000}));
app.use(cors());
app.use(function (req, res, next) {
    res.removeHeader('X-Content-Security-Policy');
    res.removeHeader('X-Content-Type-Options');
    res.removeHeader('Content-Security-Policy');
    res.setHeader(
        'Content-Security-Policy',
        "style-src 'self' 'unsafe-inline'; default-src 'self' https://testmaterialsmatter.s3.us-east-2.amazonaws.com/* https://accounts.google.com/* https:;"
    );
  next();
});
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}))
app.use(passport.initialize());
app.use(passport.session());



app.get('/', 
    passport.authenticate('google', {scope: ['email', 'profile']
}));

app.get('/callback',
    passport.authenticate( 'google', {
        successRedirect: '/MainMenu',
        failureRedirect: '/failure'
}));

app.get('/failure', async (req, res) => {
    res.status(401).send("Your google account hasn't been added. :( Please contact support.");
});

app.get('/MainMenu/editor:ID', async (req, res) => {
    var validUser = verify(req);
    if(validUser){
        res.sendFile(resolve('public/Main.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/MainMenu', async (req, res) => {
    var validUser = verify(req);
    if(validUser){
        res.sendFile(resolve('public/Menu.html'));
    } else {
        res.redirect('/');
    }
});



app.get('/Login.css', async (req, res) => {
    res.sendFile(resolve('public/Login.css'));
});

app.get('/Login.js', async (req, res) => {
    res.sendFile(resolve('public/Login.js'));
});

app.get('*/main.css', async (req, res) => {
    res.sendFile(resolve('public/main.css'));
});

app.get('*/main.js', async (req, res) => {
    res.sendFile(resolve('public/main.js'));
});

app.get('/Menu.js', async (req, res) => {
    res.sendFile(resolve('public/Menu.js'));
});

app.get('/Menu.css', async (req, res) => {
    res.sendFile(resolve('public/Menu.css'));
});



app.post('*/saveMap', isLoggedin, async (req, res) =>{
    s3Client.upload({
        Bucket: "testmaterialsmatter",
        Key: 'Maps/' + req.body.id + '.json',
        Body: JSON.stringify(req.body)
    }, async function(err, data) {
        if (err) {
            res.send(err);
        }
    });
    await addToKey(req.body.id, req.body.name);
});

app.delete('*/deleteMap:ID', isLoggedin, async (req, res) =>{
    s3Client.deleteObject({
        Bucket: "testmaterialsmatter",
        Key: 'Maps/' + req.params.ID.substring(1) + '.json',
    }, async function(err, data) {
        if (err) {
            console.log(err);
        } else {
            await removeFromKey(req.params.ID.substring(1));
            res.send(data);
        }
    });
});



app.post('*/uploadContent', isLoggedin, async(req, res) =>{
    var buf = Buffer.from(req.body.file.replace(/^data:image\/\w+;base64,/, ""),'base64');
    s3Client.upload({
        Bucket: "testmaterialsmatter",
        Key: 'Content/' + req.body.name,
        Body: buf,
        ContentEncoding: 'base64',
        ContentType: req.body.type
    }, async function(err, data) {
        if (err) {
            res.send(err);
        } else {
            res.send(true);
        }
    });
});



app.post('*/addComment', isLoggedin, async(req, res) => {
    commentBuffer.push({
        'session': req.body.session,
        'user': req.body.user,
        'message': req.body.message,
        'position': req.body.position,
        'replyTo': req.body.replyTo
    });
});

app.post('*/createSession:ID', isLoggedin, async(req, res) => {
    var returnObject = await new Promise(async (resolve, reject) =>{
        s3Client.getObject({
            Bucket: "testmaterialsmatter",
            Key: "Comments/key.json"
        }, async function(err, data) {
            if(err){
                resolve({'id':null});
            } else {
                var body = JSON.parse(data.Body.toString());
                var today = new Date();
                today = "" + String(today.getDate()).padStart(2, '0') + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getFullYear()).substring(2);
                var newSession = new Session(req.params.ID.substring(1), today);
                var isMade = -1;
                console.log(body.current);
                for(var i = 0; i < body.current.length; i++){
                    if((req.params.ID.substring(1)+"-"+today) == body.current[i]){
                        resolve({'id':null});
                        return;
                    }
                    if(req.params.ID.substring(1) == body.current[i].substring(0,32) && body.current[i].substring(33) != today){
                        isMade = i;
                    }
                }
                if(isMade >= 0){
                    body.previous.push(body.current[isMade]);
                    body.current.splice(isMade, 1);
                    body.current.push(newSession.id);
                } else {
                    body.current.push(newSession.id);
                }
                var tempObject = await new Promise(async (resolve, reject) =>{
                    s3Client.upload({
                        Bucket: "testmaterialsmatter",
                        Key: 'Comments/key.json',
                        Body: JSON.stringify(body)
                    }, function(err, data) {
                        if (err) {
                            console.log(err);
                            resolve({'id':null});
                        }
                    });
                    s3Client.upload({
                        Bucket: "testmaterialsmatter",
                        Key: 'Comments/' + newSession.id + '.json',
                        Body: JSON.stringify(newSession.export())
                    }, function(err, data) {
                        if (err) {
                            console.log(err);
                            resolve({'id':null});
                        } else {
                            resolve(newSession.export());
                        }
                    });
                });
                resolve(tempObject);
            }
        });
    });
    res.send(JSON.stringify(returnObject));
});

app.get('*/getComments:ID', isLoggedin, async(req, res) => {
    s3Client.getObject({
        Bucket: "testmaterialsmatter",
        Key: "Comments/" + req.params.ID.substring(1) + ".json"
    }, function(err, data) {
        if(err){
            console.log(err);
            res.send("error: " + err);
        } else {
            res.send(data.Body.toString());
        }
    });
});

app.get('*/getRefreshComments:ID', isLoggedin, async(req, res) => {
    var newComments = false;
    for(let i = 0; i < hasNewComments.length; i++){
        if(hasNewComments[i] == req.params.ID.substring(1)){
            newComments = true;
        }
    }
    
    if(newComments){
        s3Client.getObject({
            Bucket: "testmaterialsmatter",
            Key: "Comments/" + req.params.ID.substring(1) + ".json"
        }, function(err, data) {
            if(err){
                console.log(err);
                res.send("error: " + err);
            } else {
                res.send(data.Body.toString());
            }
        });
    } else {
        res.send(JSON.stringify({'id':null}));
    }
});

app.get('*/getSessionKey:MapID', isLoggedin, async(req, res) => {
    s3Client.getObject({
        Bucket: "testmaterialsmatter",
        Key: "Comments/key.json"
    }, async (err, data) => {
        if(err){
            console.log(err);
        } else {
            var returnObject = {'current':[], 'previous':[]};
            var body = JSON.parse(data.Body.toString());
            for(var i = 0; i < body.current.length; i++){
                console.log(body.current[i]);
                if(body.current[i].split("-")[0] == req.params.MapID.substring(1)){
                   returnObject.current.push(body.current[i]);
                }
            }
            for(var i = 0; i < body.previous.length; i++){
                if(body.previous[i].split("-")[0] == req.params.MapID.substring(1)){
                   returnObject.previous.push(body.previous[i]);
                }
            }
            res.send(JSON.stringify(returnObject));
        }
    });
});



app.get('*/getKey', isLoggedin, async (req, res) => {
    s3Client.getObject({
        Bucket: "testmaterialsmatter",
        Key: "key.json"
    }, function(err, data) {
        if(err){
            res.send("error:" + err);
        } else {
            res.send(data.Body.toString());
        }
    });
});

app.get('*/getMap:ID', isLoggedin, async (req, res) => {
    s3Client.getObject({
        Bucket: "testmaterialsmatter",
        Key: "Maps/" + req.params.ID.substring(1) + ".json"
    }, function(err, data) {
        if(err){
            console.log(err);
            res.send("error: " + err);
        } else {
            res.send(data.Body.toString());
        }
    });
});



app.get('*/username', async (req, res) => {
    if(req.user){
        res.send({
            'username': req.user.name
        });
    }
    res.send(false);
});



app.use(function(req, res, next) {
    res.status(404).send("Sorry, that route doesn't exist. Have a nice day :)");
});

app.listen((process.env.PORT || 3000),  () => {
    console.log('App is listening on port 3000.');
});



async function addToKey(mapID, mapName){
    s3Client.getObject({
        Bucket: "testmaterialsmatter",
        Key: "key.json"
    }, function(err, data) {
        if(err){
            res.send("error:" + err);
        } else {
            var exists = -1, body = JSON.parse(data.Body.toString());
            for(var i = 0; i < body.maps.length; i++){
                if(body.maps[i].id == mapID){
                    exists = i;
                }
            }
            if(exists >= 0){
                body.maps.splice(exists,1);
                body.maps.splice(exists, 0, {
                    "id" : mapID,
                    "name": mapName
                });
            } else {
                body.maps.push({
                    "id" : mapID,
                    "name": mapName
                })
            }
            s3Client.upload({
                Bucket: "testmaterialsmatter",
                Key: 'key.json',
                Body: JSON.stringify(body)
            }, function(err, data) {
                if (err) {
                    console.log(err);
                    res.send(err);
                }
            });
        }
    });
}

async function removeFromKey(mapID) {
    s3Client.getObject({
        Bucket: "testmaterialsmatter",
        Key: "key.json"
    }, function(err, data) {
        if(err){
            res.send(err);
        } else {
            var body = JSON.parse(data.Body.toString());
            for(var i = 0; i < body.maps.length; i++){
                if(body.maps[i].id == mapID){
                    body.maps.splice(i, 1);
                }
            }
            s3Client.upload({
                Bucket: "testmaterialsmatter",
                Key: 'key.json',
                Body: JSON.stringify(body)
            }, function(err, data) {
                if (err) {
                    console.log(err);
                    res.send(err);
                }
            });
        }
    });
    s3Client.getObject({
        Bucket: "testmaterialsmatter",
        Key: "Comments/key.json"
    }, function(err, data) {
        if(err){
            res.send(err);
        } else {
            var body = JSON.parse(data.Body.toString());
            for(var i = 0; i < body.current.length; i++){
                if(body.current[i].substring(0,32) == mapID){
                    s3Client.deleteObject({
                        Bucket: "testmaterialsmatter",
                        Key: 'Comments/' + body.current[i] + '.json',
                    }, async function(err, data) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    body.current.splice(i, 1);
                }
            }
            for(var i = 0; i < body.previous.length; i++){
                if(body.previous[i].substring(0,32) == mapID){
                    body.previous.splice(i, 1);
                }
            }
            s3Client.upload({
                Bucket: "testmaterialsmatter",
                Key: 'Comments/key.json',
                Body: JSON.stringify(body)
            }, function(err, data) {
                if (err) {
                    console.log(err);
                    res.send(err);
                }
            });
        }
    });
}

async function verify(req) {
    if(req.user){
        if(req.user.email_verified){
            return true;
        }
    }
    return false;
}

function isLoggedin(req, res, next){
    if(req.user){
        if(req.user.email_verified){
            next();
        } else {
            res.status(401).send("Your google account hasn't been added to the Pipe Dream Administrator website. :( Please contact support.");
        }
    } else {
        res.status(401).send("Your google account hasn't been added to the Pipe Dream Administrator website. :( Please contact support.");
    }
}

async function setCommentTimer(interval) {
    Timer += interval;
    hasNewComments = [];
    if(commentBuffer.length > 0){
        for(let i = 0; i < commentBuffer.length; i++){
            let toAdd = true;
            for(let j = 0; j < hasNewComments.length; j++){
                if(commentBuffer[i].session == hasNewComments[j]){
                    toAdd = false;
                }  
            }
            if(toAdd){
                hasNewComments.push(commentBuffer[i].session);
            }
        }
        var sessions = await getSessions();
        clearCommentBuffer();
    }
    
    setTimeout(() => {
        setCommentTimer(interval);
    }, interval*1000);
    
    
    
    async function clearCommentBuffer() {
        var uploadBuffer = commentBuffer;
        commentBuffer = [];
        
        for(let i = 0; i < uploadBuffer.length; i++){
            for(let j = 0; j < sessions.length; j++){
                if(uploadBuffer[i].session == sessions[j].id){
                    if(uploadBuffer[i].replyTo == null){
                        sessions[j].replyLength++;
                        sessions[j].replies.push(new Comment(uploadBuffer[i].session, uploadBuffer[i].user, uploadBuffer[i].message, uploadBuffer[i].position, "" + sessions[j].replies.length));
                    } else {
                        var location = uploadBuffer[i].replyTo.split('-');
                        addLegalComment(location, sessions[j], uploadBuffer[i]);    
                    }
                }
            }
        }
        
        for(let i = 0; i < sessions.length; i++){
            var body = await JSON.stringify(sessions[i].export());
            s3Client.upload({
                Bucket: "testmaterialsmatter",
                Key: 'Comments/' + sessions[i].id + ".json",
                Body: body
            }, async function(err, data) {
                if (err) {
                    console.log(err);
                }
            });
        }
        
        function addLegalComment(id, session, uploadObject){
            var focusedComments = session;
            
            for(let i = 0; i < id.length; i++){
                if(parseInt(id[i]) > focusedComments.replies.length){
                    return;
                } else {
                    focusedComments = focusedComments.replies[parseInt(id[i])];
                }
            }
            focusedComments = session;
            for(let i = 0; i < id.length; i++){
                focusedComments.replyLength++;
                focusedComments = focusedComments.replies[parseInt(id[i])];
            }
            focusedComments.replyLength++;
            focusedComments.replies.push(new Comment(uploadObject.session, uploadObject.user, uploadObject.message, uploadObject.position, id.join('-') + ('-' + focusedComments.replies.length)));
        }
    }
    
    async function getSessions(){
        var tempSessions = await new Promise((resolve, reject) => {
            s3Client.getObject({
                Bucket: "testmaterialsmatter",
                Key: "Comments/key.json"
            }, async (err, data) => {
                if(err){
                    console.log(err);
                } else {
                    var newSessions = [];
                    var body = JSON.parse(data.Body.toString());
                    
                    for(let i = 0; i < hasNewComments.length; i++){
                        var toRemove = true;
                        for(let j = 0; j < body.current.length; j++){
                            if(hasNewComments[i] == body.current[j]){
                                toRemove = false;
                            }
                        }
                        if(toRemove){
                            hasNewComments.splice(i, 1);
                        }
                    }
                    
                    for(let i = 0; i < body.current.length; i++){
                        for(let j = 0; j < hasNewComments.length; j++){
                            if(body.current[i] == hasNewComments[j]){
                                var tempSession = await new Promise ((resolve, reject) => {
                                   s3Client.getObject({
                                        Bucket: "testmaterialsmatter",
                                        Key: "Comments/" + body.current[i] + ".json"
                                    }, async (err, data) => {
                                        if(err){
                                            console.log(err);
                                        } else {
                                            var sessionBody = JSON.parse(data.Body.toString());
                                            var newSession = new Session(sessionBody.mapID, sessionBody.date);
                                            for(let j = 0; j < sessionBody.replies.length; j++){
                                                newSession.replies = getComments(sessionBody.replies);
                                                for(let k = 0; k < newSession.replies.length; k++){
                                                    newSession.replyLength += newSession.replies[k].replyLength;
                                                }
                                            }
                                            resolve(newSession);
                                        }
                                    });   
                                });
                                newSessions.push(tempSession);
                            }
                        }
                    }
                    resolve(newSessions);
                }
            });
        });
        return tempSessions;
        
        function getComments(commentArray) {
            var returnComments = [];
            for(let i = 0; i < commentArray.length; i++){
                var newComment = new Comment(commentArray[i].session, commentArray[i].user, commentArray[i].message, commentArray[i].position, commentArray[i].id);
                if(commentArray[i].replies != undefined){
                    newComment.replies = getComments(commentArray[i].replies);
                    for(let j = 0; j < newComment.replies.length; j++){
                        newComment.replyLength += newComment.replies[j].replyLength;
                    }
                    newComment.replyLength += newComment.replies.length;
                }
                returnComments.push(newComment);
            }
            return returnComments;
        }
    }
}


