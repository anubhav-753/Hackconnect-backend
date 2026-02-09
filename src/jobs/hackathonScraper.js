const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const Hackathon = require('../../models/hackathonModel');
const Notification = require('../../models/notificationModel');
const User = require('../../models/userModel');

const scrapeDevpost = async (io) => {
  console.log('--- Starting Hackathon Scrape (Resilient Mode) ---');
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    console.log('Navigating to Devpost...');
    await page.goto('https://devpost.com/hackathons', { waitUntil: 'networkidle2' });

    // --- FINAL FIX: Wait for the individual tile selector ---
    const selector = '.hackathon-tile';
    console.log(`Waiting for selector "${selector}" to load...`);
    await page.waitForSelector(selector);
    console.log('Individual hackathon tiles loaded.');

    const hackathons = await page.evaluate((sel) => {
      const hackathonList = [];
      const tiles = document.querySelectorAll(sel);

      tiles.forEach(tile => {
        const title = tile.querySelector('h3')?.innerText.trim();
        const description = tile.querySelector('p.leadin')?.innerText.trim();

        const startDate = new Date();
        const endDate = new Date(new Date().setDate(new Date().getDate() + 7));

        if (title && description) {
          hackathonList.push({ title, description, startDate, endDate });
        }
      });
      return hackathonList;
    }, selector);

    console.log(`Successfully scraped ${hackathons.length} hackathons from the page.`);

    if (hackathons.length > 0) {
      for (const hackathonData of hackathons) {
        const result = await Hackathon.updateOne({ title: hackathonData.title }, { $set: hackathonData }, { upsert: true });

        // If a new hackathon was created (upserted)
        if (result.upsertedCount > 0) {
          const newHackathon = await Hackathon.findOne({ title: hackathonData.title });

          // Find an admin or any user to act as sender (System)
          const systemUser = await User.findOne({ isAdmin: true }) || await User.findOne({});
          const senderId = systemUser ? systemUser._id : null;

          if (senderId) {
            const users = await User.find({}, '_id');
            const notifications = users.map(user => ({
              recipient: user._id,
              sender: senderId,
              type: 'hackathon_alert',
              message: `New Hackathon Alert: ${hackathonData.title}`,
              isRead: false,
            }));

            if (notifications.length > 0) {
              await Notification.insertMany(notifications);
            }
          }

          if (io) {
            io.emit('newNotification', {
              type: 'hackathon_alert',
              message: `New Hackathon Alert: ${hackathonData.title}`,
              hackathonId: newHackathon ? newHackathon._id : null,
            });
          }
        }
      }
      console.log('Hackathon data saved/updated in the database.');

      if (io) {
        const updatedHackathons = await Hackathon.find({}).sort({ startDate: 'asc' });
        io.emit('hackathons-updated', updatedHackathons);
        console.log('Sent real-time update to clients.');
      }
    }

  } catch (error) {
    console.error('An error occurred during scraping:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log('--- Hackathon Scrape Finished ---');
  }
};

module.exports = scrapeDevpost;