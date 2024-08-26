const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { logEvent } = require('../ui/EventLogger');
const { typeWithHumanDelay, randomScroll, randomClick } = require('../utils/HumanInteractions');
const { saveData } = require('../data/DataHandler');
const { formatDate } = require('../utils/DateFormatter');
const { promptUserIntervention } = require('../utils/UserIntervention');
const { solveCaptcha } = require('../utils/CaptchaSolver.');
const { retryOperation } = require('../utils/RetryUtils');
const { identifySelector } = require('../utils/OpenAIUtils');
const config = require('../config/config');

puppeteer.use(StealthPlugin());

async function login(page, username, password) {
    logEvent('Navigating to Facebook login page...');
    await page.goto('https://www.facebook.com/login/');
    await page.waitForTimeout(1000 + Math.random() * 2000);

    logEvent('Identifying username input field...');
    const usernameSelector = await identifySelector(page, 'username input field on Facebook login page');
    logEvent('Identifying password input field...');
    const passwordSelector = await identifySelector(page, 'password input field on Facebook login page');
    logEvent('Identifying login button...');
    const loginButtonSelector = await identifySelector(page, 'login button on Facebook login page');

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
    await page.goto(`https://www.facebook.com/${targetProfile}`);
    await page.waitForTimeout(1000 + Math.random() * 2000);

    logEvent('Scraping profile information...');
    const profileData = await page.evaluate(() => {
        try {
            return {
                username: document.querySelector('h1')?.innerText || '',
                friends: document.querySelector('a[href*="friends"] span')?.innerText || '',
                bio: document.querySelector('div[data-testid="profile_bio"]')?.innerText || ''
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
                const postElements = document.querySelectorAll('div[data-ad-comet-preview="message"]');
                const postArray = [];
                postElements.forEach(post => {
                    const postText = post.innerText;
                    const postDate = post.closest('abbr')?.getAttribute('data-utime') || '';
                    const mediaElements = post.querySelectorAll('img, video');
                    const mediaURLs = Array.from(mediaElements).map(media => media.src || media.poster);
                    postArray.push({ text: postText, date: postDate, media: mediaURLs });
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

async function scrapeFacebook(username, password, targetProfile, dateRange) {
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
            saveData('Facebook', structuredData);

            logEvent('Data saved successfully.');
            return structuredData;
        }, 3, 5000); // Retry operation up to 3 times with a 5-second delay between attempts
    } catch (error) {
        logEvent(`Error: ${error.message}`, 'error');
        await browser.close();
}
module.exports = { scrapeFacebook };
}