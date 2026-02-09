const mongoose = require("mongoose");

const chatSchema = mongoose.Schema(
    {
        chatName: { type: String, trim: true },
        isGroupChat: { type: Boolean, default: false },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        latestMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        groupAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        // Optional: Link to a hackathon if this is a team discussion
        hackathon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hackathon",
        },
    },
    {
        timestamps: true,
    }
);

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
