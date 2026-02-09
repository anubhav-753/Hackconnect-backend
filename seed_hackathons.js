const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Hackathon = require('./models/hackathonModel');
const User = require('./models/userModel');

dotenv.config();

const seedHackathons = async () => {
    await connectDB();
    console.log("Connected to DB");

    const user = await User.findOne({});
    if (!user) {
        console.log("No user found to assign as creator. Please create a user first.");
        process.exit();
    }

    await Hackathon.deleteMany({});
    console.log("Cleared existing hackathons.");

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    const hackathons = [
        {
            title: "Future Tech Hackathon 2025 (Upcoming, starts in 7 days)",
            description: "Join us to build the future of technology.",
            startDate: new Date(now.getTime() + 7 * oneDay),
            endDate: new Date(now.getTime() + 9 * oneDay),
            location: "Online",
            themes: ["AI", "Blockchain"],
            createdBy: user._id,
            status: "upcoming"
        },
        {
            title: "CodeSprint 2024 (Ongoing, started yesterday)",
            description: "A 48-hour coding sprint.",
            startDate: new Date(now.getTime() - 1 * oneDay),
            endDate: new Date(now.getTime() + 1 * oneDay),
            location: "Hybrid - Bangalore",
            themes: ["Web Dev", "App Dev"],
            createdBy: user._id,
            status: "ongoing"
        },
        {
            title: "Retro Hack 2023 (Past, ended 1 month ago)",
            description: "Building retro games.",
            startDate: new Date(now.getTime() - 32 * oneDay),
            endDate: new Date(now.getTime() - 30 * oneDay),
            location: "San Francisco",
            themes: ["Game Dev"],
            createdBy: user._id,
            status: "completed"
        }
    ];

    await Hackathon.insertMany(hackathons);
    console.log("Seeded 3 hackathons: 1 Upcoming, 1 Ongoing, 1 Past.");
    process.exit();
};

seedHackathons();
