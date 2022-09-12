import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import Messages from './dbMessages.js';
import Rooms from './dbRooms.js';
import Pusher from 'pusher';
import Cors from 'cors';
import auth from './firebase.js';
import jwt from 'jsonwebtoken';

// app config
const app = express();
const port = process.env.PORT || 8000;
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: "us2",
    useTLS: true
  });

// middlewares
app.use(express.json());
app.use(Cors()); // security


// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next();
// });

// DB config
const connection_url = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.zraozdt.mongodb.net/whatappsdb?retryWrites=true&w=majority`;
mongoose.connect(connection_url);

const db = mongoose.connection;

db.once('open', () => {
    console.log('db is connected');

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    const roomCollection = db.collection('rooms');
    const changeStreamRoom = roomCollection.watch();

    changeStream.on('change', (change) => {
        // console.log("A change occured", change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;

            pusher.trigger('message', 'inserted', 
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });
        } else {
            console.log("Error triggering Pusher");
        }
    });

    changeStreamRoom.on('change', (change) => {
        if (change.operationType === 'insert') {
            const roomDetails = change.fullDocument;

            pusher.trigger('room', 'inserted', 
            {   
                _id: roomDetails._id,
                roomName: roomDetails.roomName
            });
        } else {
            console.log("Error triggering Pusher");
        }
    })
})

// API routes
app.get('/', (req, res) => res.status(200).send("Welcome to whatsapp backend!"));

// authentication
app.post('/authenticate', (req, res) => {
    const idToken = req.headers['authorization'];
    auth.verifyIdToken(idToken).then(decodedToken => {
        let jwtSecretkey = process.env.JWT_SECRET_KEY;
        let data = {
            uid: decodedToken.uid
        }
        const token = jwt.sign(data, jwtSecretkey, { expiresIn: '1h' });
        res.send(token);
    }).catch(err => res.status(500).send(err));
});

// get messages from a room
app.get('/messages/sync', (req, res) => {
    const token = req.headers['authorization'];
    // const decodedToken = jwt.decode(token, {
    //     complete: true
    // });
    
    const verified = jwt.verify(String(token), process.env.JWT_SECRET_KEY);

    if (verified) {
        Messages.find((err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    } else {
        res.status(401).send(err);
    }
});

// post a new message
app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;
    const token = req.headers['authorization'];
    const verified = jwt.verify(String(token), process.env.JWT_SECRET_KEY);

    if (verified) {
        Messages.create(dbMessage, (err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(201).send(data);
            }
        });
    } else {
        res.status(401).send(err);
    }
    
});

// get rooms
app.get('/rooms/sync', (req, res) => {
    const token = req.headers['authorization'];
    const verified = jwt.verify(String(token), process.env.JWT_SECRET_KEY);

    if (verified) {
        Rooms.find((err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        })
    } else {
        res.status(401).send(err);
    }
});

// find room by id
app.get('/rooms/sync/:roomId', (req, res) => {
    const token = req.headers['authorization'];
    const verified = jwt.verify(String(token), process.env.JWT_SECRET_KEY);

    const roomId = req.params.roomId;

    if (verified) {
        Rooms.findById(roomId, (err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    } else {
        res.status(401).send(err);
    }
});

// add a chat room
app.post('/rooms/new', (req, res) => {
    const token = req.headers['authorization'];
    const verified = jwt.verify(String(token), process.env.JWT_SECRET_KEY);
    const dbRoom = req.body;
    
    if (verified) {
        Rooms.create(dbRoom, (err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(201).send(data);
            }
        });
    } else {
        res.status(401).send(err);
    }
});

// listener
app.listen(port, () => console.log("listening on port localhost:" + port))