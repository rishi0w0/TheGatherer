const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { logEvent } = require('../ui/EventLogger');
const { typeWithHumanDelay, randomScroll, randomClick } = require('../utils/HumanInteractions');
const { saveData } = require('../data/DataHandler');
const { formatDate } = require('../utils/DateFormatter');
const { promptUserIntervention } = require('../utils/UserIntervention');
const { solveCaptcha } = require('../src/utils/CaptchaSolver');
const { retryOperation } = require('../utils/RetryUtils');
const { identifySelector } = require('../utils/OpenAIUtils');
const config = require('../config/config');

puppeteer.use(StealthPlugin());

async function login(page, username, password) {
    logEvent('Navigating to Instagram login page...');
    await page.goto('https://www.instagram.com/accounts/login/');
    await page.waitForTimeout(1000 + Math.random() * 2000);

    logEvent('Identifying username input field...');
    const usernameSelector = await identifySelector(page, 'username input field on Instagram login page');
    logEvent('Identifying password input field...');
    const passwordSelector = await identifySelector(page, 'password input field on Instagram login page');
    logEvent('Identifying login button...');
    const loginButtonSelector = await identifySelector(page, 'login button on Instagram login page');

    logEvent('Entering credentials...');
    await typeWithHumanDelay(page, usernameSelector, username);
    await typeWithHumanDelay(page, passwordSelector, password);
    await page.click(loginButtonSelector);
    await page.waitForNavigation();
    await page.waitForTimeout(1000 + Math.random() * 2000);

    // Check for captcha or human verification
    const captchaSolved = await solveCaptcha(page);
    if (!captchaSolved) {
        logEvent('Captcha not solved by AI/ML. Pausing for human intervention...');
        await promptUserIntervention('Please solve the captcha in the live Puppeteer browser.');
    }
}

async function scrapeProfile(page, targetProfile) {
    logEvent('Navigating to target profile...');
    await page.goto(`https://www.instagram.com/${targetProfile}/`);
    await page.waitForTimeout(1000 + Math.random() * 2000);

    logEvent('Scraping profile information...');
    const profileData = await page.evaluate(() => {
        try {
            return {
                username: document.querySelector('header section h2')?.innerText || '',
                followers: document.querySelector('a[href$="/followers/"] span')?.title || '',
                following: document.querySelector('a[href$="/following/"] span')?.innerText || '',
                bio: document.querySelector('header section div.-vDIg')?.innerText || ''
            };
        } catch (error) {
            logEvent(`Error scraping profile information: ${error.message}`, 'error');
            return {};
        }
    });
    logEvent('Profile information scraped successfully.');
    return profileData;
}

async function scrapePosts(page, dateRange) {
    logEvent('Starting to scrape posts...');
    const postsData = [];
    let lastPostDate = new Date();

    while (lastPostDate >= new Date(dateRange.split(' to ')[0])) {
        await randomScroll(page);
        await randomClick(page);

        const posts = await page.evaluate(() => {
            try {
                const postElements = document.querySelectorAll('article > div > div > div > div > a');
                const postArray = [];
                postElements.forEach(post => {
                    const postText = post.querySelector('img')?.alt || '';
                    const postDate = post.querySelector('time')?.getAttribute('datetime') || '';
                    const mediaURL = post.querySelector('img')?.src || '';
                    postArray.push({ text: postText, date: postDate, media: mediaURL });
                });
                return postArray;
            } catch (error) {
                logEvent(`Error scraping posts: ${error.message}`, 'error');
                return [];
            }
        });

        postsData.push(...posts);
        lastPostDate = new Date(posts[posts.length - 1].date);

        logEvent('Scrolling to load more posts...');
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(2000 + Math.random() * 2000); // Randomized delay
    }

    logEvent('Posts scraped successfully.');
    return postsData;
}

async function scrapeInstagram(username, password, targetProfile, dateRange) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await retryOperation(async () => {
            await login(page, username, password);
            const profileData = await scrapeProfile(page, targetProfile);
            const postsData = await scrapePosts(page, dateRange);

            logEvent('Scraping completed.');
            await browser.close();

            // Save data in structured format
            const structuredData = {
                profile: profileData,
                posts: postsData.map(post => ({
                    date: formatDate(post.date),
                    content: post.text,
                    media: post.media
                }))
            };
            saveData('Instagram', structuredData);

            logEvent('Data saved successfully.');
            return structuredData;
        }, 3, 5000); // Retry operation up to 3 times with a 5-second delay between attempts
    } catch (error) {
        logEvent(`Error: ${error.message}`, 'error');
        await browser.close();
    }
}

module.exports = { scrapeInstagram };
