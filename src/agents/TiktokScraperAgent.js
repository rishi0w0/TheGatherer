const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { logEvent } = require('../ui/EventLogger');
const { typeWithHumanDelay, randomScroll, randomClick } = require('../utils/HumanInteractions');
const { saveData } = require('../data/DataHandler');
const { formatDate } = require('../utils/DateFormatter');
const { promptUserIntervention } = require('../utils/UserIntervention');
const { solveCaptcha } = require('../utils/CaptchaSolver');
const { retryOperation } = require('../utils/RetryUtils');
const { identifySelector } = require('../utils/OpenAIUtils');
const randomUserAgent = require('random-useragent');

puppeteer.use(StealthPlugin());

/**
 * Logs into TikTok using provided credentials.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {string} username - The TikTok username.
 * @param {string} password - The TikTok password.
 */
async function login(page, username, password) {
    logEvent('Navigating to TikTok login page...');
    await page.goto('https://www.tiktok.com/login/', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000 + Math.random() * 2000);

    logEvent('Waiting for username input field...');
    const usernameSelector = await identifySelector(page, 'username input field on TikTok login page');
    await page.waitForSelector(usernameSelector, { timeout: 10000 });

    logEvent('Waiting for password input field...');
    const passwordSelector = await identifySelector(page, 'password input field on TikTok login page');
    await page.waitForSelector(passwordSelector, { timeout: 10000 });

    logEvent('Waiting for login button...');
    const loginButtonSelector = await identifySelector(page, 'login button on TikTok login page');
    await page.waitForSelector(loginButtonSelector, { timeout: 10000 });

    logEvent('Entering credentials...');
    await typeWithHumanDelay(page, usernameSelector, username);
    await typeWithHumanDelay(page, passwordSelector, password);

    logEvent('Clicking login button...');
    await page.click(loginButtonSelector);

    logEvent('Waiting for navigation after login...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(err => {
        logEvent(`Navigation after login failed: ${err.message}`, 'error');
    });

    await page.waitForTimeout(1000 + Math.random() * 2000);

    // Check for captcha or human verification
    const captchaSolved = await solveCaptcha(page);
    if (!captchaSolved) {
        logEvent('Captcha not solved by AI/ML. Pausing for human intervention...');
        await promptUserIntervention('Please solve the captcha in the live Puppeteer browser.');
    }
}

/**
 * Scrapes profile information from a TikTok user page.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {string} targetProfile - The TikTok username to scrape.
 * @returns {object} - The scraped profile data.
 */
async function scrapeProfile(page, targetProfile) {
    logEvent(`Navigating to target profile: ${targetProfile}...`);
    await page.goto(`https://www.tiktok.com/@${targetProfile}`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000 + Math.random() * 2000);

    logEvent('Waiting for profile information to load...');
    const usernameSelector = 'h2[data-e2e="user-title"]'; // Example selector, may need adjustment
    await page.waitForSelector(usernameSelector, { timeout: 10000 });

    logEvent('Scraping profile information...');
    const profileData = await page.evaluate(() => {
        try {
            return {
                username: document.querySelector('h2[data-e2e="user-title"]')?.innerText.trim() || '',
                followers: document.querySelector('strong[data-e2e="followers-count"]')?.innerText.trim() || '',
                following: document.querySelector('strong[data-e2e="following-count"]')?.innerText.trim() || '',
                bio: document.querySelector('h1[data-e2e="user-bio"]')?.innerText.trim() || ''
            };
        } catch (error) {
            console.error(`Error scraping profile information: ${error.message}`);
            return {};
        }
    });
    logEvent('Profile information scraped successfully.');
    return profileData;
}

/**
 * Scrapes posts from a TikTok user page within a specified date range.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {string} dateRange - The date range in format "YYYY-MM-DD to YYYY-MM-DD".
 * @returns {Array} - An array of scraped posts.
 */
async function scrapePosts(page, dateRange) {
    logEvent('Starting to scrape posts...');
    const postsData = [];
    const [startDateStr, endDateStr] = dateRange.split(' to ').map(str => str.trim());
    const startDate = new Date(startDateStr);
    let lastPostDate = new Date();

    while (lastPostDate >= startDate) {
        const previousHeight = await page.evaluate('document.body.scrollHeight');

        // Scroll and wait
        await randomScroll(page);
        await randomClick(page);

        // Wait for new posts to load
        await page.waitForTimeout(2000 + Math.random() * 2000);

        // Scrape posts
        const newPosts = await page.evaluate(() => {
            try {
                const postElements = document.querySelectorAll('div[data-e2e="user-post-item"]');
                const postArray = [];
                postElements.forEach(post => {
                    const postText = post.querySelector('h3')?.innerText.trim() || '';
                    const postDateText = post.querySelector('span[data-e2e="create-time"]')?.innerText.trim() || '';
                    const mediaURL = post.querySelector('img')?.src || '';
                    const likes = post.querySelector('strong[data-e2e="like-count"]')?.innerText.trim() || '0';
                    const comments = post.querySelector('strong[data-e2e="comment-count"]')?.innerText.trim() || '0';
                    postArray.push({ text: postText, date: postDateText, media: mediaURL, likes, comments });
                });
                return postArray;
            } catch (error) {
                console.error(`Error scraping posts: ${error.message}`);
                return [];
            }
        });

        // Validate and add posts
        const validPosts = newPosts.filter(post => post.text && post.date);
        postsData.push(...validPosts);

        if (validPosts.length > 0) {
            const lastPost = validPosts[validPosts.length - 1];
            const parsedDate = new Date(lastPost.date);
            if (isNaN(parsedDate)) {
                logEvent(`Invalid date format encountered: ${lastPost.date}`, 'error');
                break;
            }
            lastPostDate = parsedDate;
        } else {
            logEvent('No valid posts found, stopping scraping.', 'info');
            break;
        }

        // Check if we've reached the end of available posts
        const newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === previousHeight) {
            logEvent('No more posts to load, stopping scraping.', 'info');
            break;
        }

        logEvent('Scrolling to load more posts...');
    }

    logEvent(`Scraped a total of ${postsData.length} posts.`);
    return postsData;
}

/**
 * Scrapes TikTok profile and posts data.
 * @param {string} username - TikTok username for login.
 * @param {string} password - TikTok password for login.
 * @param {string} targetProfile - The TikTok profile to scrape.
 * @param {string} dateRange - The date range for scraping posts.
 */
async function scrapeTikTok(username, password, targetProfile, dateRange) {
    const proxyUrl = process.env.PROXY_URL || '';

    const browser = await puppeteer.launch({
        headless: false,
        args: proxyUrl ? [`--proxy-server=${proxyUrl}`] : [],
        defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    const userAgent = randomUserAgent.getRandom();
    await page.setUserAgent(userAgent);

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
                    media: post.media,
                    likes: post.likes,
                    comments: post.comments
                }))
            };
            saveData('TikTok', structuredData);

            logEvent('Data saved successfully.');
            return structuredData;
        }, 3, 5000); // Retry operation up to 3 times with a 5-second delay between attempts
    } catch (error) {
        logEvent(`Error: ${error.message}`, 'error');
        await browser.close();
    }
}

module.exports = { scrapeTikTok };
