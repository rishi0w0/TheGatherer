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

async function login(page, username, password) {
    logEvent('Navigating to Facebook login page...');
    await page.goto('https://www.facebook.com/login/', { waitUntil: 'networkidle2' });
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
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const captchaSolved = await solveCaptcha(page);
    if (!captchaSolved) {
        logEvent('Captcha not solved by AI/ML. Pausing for human intervention...');
        await promptUserIntervention('Please solve the captcha in the live Puppeteer browser.');
    }
}

async function scrapeProfile(page, targetProfile) {
    logEvent(`Navigating to target profile: ${targetProfile}...`);
    await page.goto(`https://www.facebook.com/${targetProfile}`, { waitUntil: 'networkidle2' });
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

async function scrapePostDetails(postElement) {
    try {
        const postText = postElement.innerText || '';
        const postDate = postElement.closest('abbr')?.getAttribute('data-utime') || '';
        const mediaElements = postElement.querySelectorAll('img, video');
        const mediaURLs = Array.from(mediaElements).map(media => media.src || media.poster);
        return { text: postText, date: postDate, media: mediaURLs };
    } catch (error) {
        logEvent(`Error scraping post details: ${error.message}`, 'error');
        return null;
    }
}

async function scrapePosts(page, dateRange) {
    logEvent('Starting to scrape posts...');
    const postsData = [];
    let lastPostDate = new Date();

    while (lastPostDate >= new Date(dateRange.split(' to ')[0])) {
        let previousHeight = await page.evaluate('document.body.scrollHeight');
        await randomScroll(page);
        await randomClick(page);

        const posts = await page.evaluate(() => {
            try {
                const postElements = document.querySelectorAll('div[data-ad-comet-preview="message"]');
                return Array.from(postElements).map(postElement => {
                    const postText = postElement.innerText || '';
                    const postDate = postElement.closest('abbr')?.getAttribute('data-utime') || '';
                    const mediaElements = postElement.querySelectorAll('img, video');
                    const mediaURLs = Array.from(mediaElements).map(media => media.src || media.poster);
                    return { text: postText, date: postDate, media: mediaURLs };
                });
            } catch (error) {
                logEvent(`Error scraping posts: ${error.message}`, 'error');
                return [];
            }
        });

        postsData.push(...posts.filter(post => post.text && post.date)); // Enhanced data validation
        if (posts.length > 0) {
            lastPostDate = new Date(posts[posts.length - 1].date);
        } else {
            logEvent('No more posts found, stopping scraping.', 'info');
            break;
        }

        let newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === previousHeight) break; // No more posts to load

        logEvent('Scrolling to load more posts...');
        await page.waitForTimeout(2000 + Math.random() * 2000);
    }

    logEvent(`Scraped a total of ${postsData.length} posts.`);
    return postsData;
}

async function scrapeFacebook(username, password, targetProfile, dateRange) {
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
        }, 3, 5000);
    } catch (error) {
        logEvent(`Error: ${error.message}`, 'error');
        await browser.close();
    }
}

module.exports = { scrapeFacebook };
