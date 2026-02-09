const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/userModel');
const Chat = require('./models/chatModel');
const Message = require('./models/messageModel');

dotenv.config();

const diagnose = async () => {
    await connectDB();
    console.log("Connected to DB");

    // 1. Find the user "Larry" or "Anubhav"
    const larry = await User.findOne({ email: { $regex: "larry", $options: "i" } }); // Guessing email part or name
    // actually let's just dump all users to find IDs
    const users = await User.find({}).select("name email");
    console.log("Users:", users);

    if (users.length < 2) {
        console.log("Not enough users to diagnose.");
        process.exit();
    }

    // 2. Find chats
    const chats = await Chat.find({})
        .populate("users", "name")
        .populate({
            path: "latestMessage",
            match: {} // populate regardless
        });

    console.log(`Found ${chats.length} chats.`);

    for (const chat of chats) {
        console.log(`\nChat ID: ${chat._id}`);
        console.log(`Users: ${chat.users.map(u => u.name).join(", ")}`);
        console.log(`Latest Message: ${chat.latestMessage ? chat.latestMessage.content : "NULL"}`);

        // 3. Find messages for this chat
        const messages = await Message.find({ chat: chat._id });
        console.log(`Messages count in DB for this chat: ${messages.length}`);
        if (messages.length > 0) {
            console.log("Sample Message:", JSON.stringify(messages[0], null, 2));
        }
    }

    process.exit();
};

diagnose();
