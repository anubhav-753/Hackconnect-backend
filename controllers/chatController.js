const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const Connection = require("../models/connectionModel");

/**
 * @desc    Access or create a one-on-one chat
 * @route   POST /api/chat
 * @access  Protected
 */
const accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        res.status(400);
        throw new Error("UserId param not sent with request");
    }

    // Check if users are connected
    // Check if users are connected (Option 1: Connection model)
    const connection = await Connection.findOne({
        $or: [
            { sender: req.user._id, recipient: userId, status: "accepted" },
            { sender: userId, recipient: req.user._id, status: "accepted" },
        ],
    });

    // Check if users are connected (Option 2: User.friends array)
    const currentUser = await User.findById(req.user._id);
    const areFriends = currentUser.friends && currentUser.friends.includes(userId);

    if (!connection && !areFriends) {
        res.status(403);
        throw new Error("You must be connected via friend request to start a chat.");
    }

    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: req.user._id } } },
            { users: { $elemMatch: { $eq: userId } } },
        ],
    })
        .populate("users", "-password")
        .populate("latestMessage");

    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name email avatar",
    });

    if (isChat.length > 0) {
        res.send(isChat[0]);
    } else {
        var chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [req.user._id, userId],
        };

        try {
            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                "users",
                "-password"
            );
            res.status(200).json(FullChat);
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
});

/**
 * @desc    Fetch all chats for a user
 * @route   GET /api/chat
 * @access  Protected
 */
const fetchChats = asyncHandler(async (req, res) => {
    try {
        Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .populate("hackathon", "name description")
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "name email avatar",
                });
                res.status(200).send(results);
            });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

/**
 * @desc    Create a group chat
 * @route   POST /api/chat/group
 * @access  Protected
 */
const createGroupChat = asyncHandler(async (req, res) => {
    if (!req.body.users || !req.body.name) {
        return res.status(400).send({ message: "Please fill all the fields" });
    }

    var users = JSON.parse(req.body.users);

    if (users.length < 2) {
        return res
            .status(400)
            .send("More than 2 users are required to form a group chat");
    }

    users.push(req.user);

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user,
            hackathon: req.body.hackathonId || undefined, // Optional hackathon link
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

/**
 * @desc    Rename a group chat
 * @route   PUT /api/chat/rename
 * @access  Protected
 */
const renameGroup = asyncHandler(async (req, res) => {
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName: chatName,
        },
        {
            new: true,
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!updatedChat) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(updatedChat);
    }
});

/**
 * @desc    Add user to group
 * @route   PUT /api/chat/groupadd
 * @access  Protected
 */
const addToGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    // Check if requester is admin (optional, for now allow anyone in group to add?)
    // Usually only admins can add, let's stick to that or check logic later.
    // For simplicity, let's assume anyone can add or stick to admin check if strict.
    // We'll check if the chat exists first.

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: { users: userId },
        },
        {
            new: true,
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!added) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(added);
    }
});

/**
 * @desc    Remove user from group
 * @route   PUT /api/chat/groupremove
 * @access  Protected
 */
const removeFromGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: { users: userId },
        },
        {
            new: true,
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!removed) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(removed);
    }
});

/**
 * @desc    Fetch a single chat by ID
 * @route   GET /api/chats/:id
 * @access  Protected
 */
const getChatById = asyncHandler(async (req, res) => {
    try {
        const chat = await Chat.findOne({
            _id: req.params.id,
            users: { $elemMatch: { $eq: req.user._id } },
        })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .populate("hackathon", "name description"); // Populate hackathon info if available

        if (!chat) {
            res.status(404);
            throw new Error("Chat not found or you are not a participant");
        }

        const fullChat = await User.populate(chat, {
            path: "latestMessage.sender",
            select: "name email avatar",
        });

        res.json(fullChat);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

module.exports = {
    accessChat,
    fetchChats,
    getChatById,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
};
