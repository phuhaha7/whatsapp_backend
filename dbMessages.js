import mongoose from "mongoose";

const messageSchema = mongoose.Schema({
    message: String,
    name: String,
    timestamp: String,
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "rooms"
    }
});

export default mongoose.model('messagecontents', messageSchema);