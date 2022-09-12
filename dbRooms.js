import mongoose from "mongoose";

const roomSchema = mongoose.Schema({
    roomName: String,
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "messageContents"
    }]
});

export default mongoose.model('room', roomSchema);