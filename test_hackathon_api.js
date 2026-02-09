const axios = require('axios');

const API_URL = 'http://localhost:5000/api/hackathons';

async function testHackathonAPI() {
    try {
        console.log("Testing Hackathon API...");

        console.log("\n1. Fetching ALL:");
        const resAll = await axios.get(API_URL);
        console.log(`- Count: ${resAll.data.length}`);

        console.log("\n2. Fetching ONGOING:");
        const resOngoing = await axios.get(`${API_URL}?status=ongoing`);
        console.log(`- Count: ${resOngoing.data.length}`);
        if (resOngoing.data.length > 0) console.log(`- Sample: ${resOngoing.data[0].title}`);

        console.log("\n3. Fetching UPCOMING:");
        const resUpcoming = await axios.get(`${API_URL}?status=upcoming`);
        console.log(`- Count: ${resUpcoming.data.length}`);
        if (resUpcoming.data.length > 0) console.log(`- Sample: ${resUpcoming.data[0].title}`);

        console.log("\n4. Fetching PAST:");
        const resPast = await axios.get(`${API_URL}?status=past`);
        console.log(`- Count: ${resPast.data.length}`);
        if (resPast.data.length > 0) console.log(`- Sample: ${resPast.data[0].title}`);

    } catch (e) {
        console.error("Error:", e.message);
    }
}

testHackathonAPI();
