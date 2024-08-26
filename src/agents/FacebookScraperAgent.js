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

    logEvent('Waiting for username input field...');
    const usernameSelector = await identifySelector(page, 'username input field on Facebook login page');
    await page.waitForSelector(usernameSelector, { timeout: 10000 });

    logEvent('Waiting for password input field...');
    const passwordSelector = await identifySelector(page, 'password input field on Facebook login page');
    await page.waitForSelector(passwordSelector, { timeout: 10000 });

    logEvent('Waiting for login button...');
    const loginButtonSelector = await identifySelector(page, 'login button on Facebook login page');
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

    logEvent('Waiting for profile information to load...');
    const usernameSelector = 'h1'; // Adjust the selector as needed
    await page.waitForSelector(usernameSelector, { timeout: 10000 });

    logEvent('Scraping profile information...');
    const profileData = await page.evaluate(() => {
        try {
            return {
                username: document.querySelector('h1')?.innerText.trim() || '',
                friends: document.querySelector('a[href*="friends"] span')?.innerText.trim() || '',
                bio: document.querySelector('div[data-testid="profile_bio"]')?.innerText.trim() || ''
            };
        } catch (error) {
            console.error(`Error scraping profile information: ${error.message}`);
            return {};
        }
    });
    logEvent('Profile information scraped successfully.');
    return profileData;
}

async function scrapePosts(page, dateRange) {
    logEvent('Starting to scrape posts...');
    const postsData = [];
    const [startDateStr, endDateStr] = dateRange.split(' to ').map(str => str.trim());
    const startDate = new Date(startDateStr);
    let lastPostDate = new Date();

    while (lastPostDate >= startDate) {
        const previousHeight = await page.evaluate('document.body.scrollHeight');

        await randomScroll(page);
        await randomClick(page);

        await page.waitForTimeout(2000 + Math.random() * 2000);

        const newPosts = await page.evaluate(() => {
            try {
                const postElements = document.querySelectorAll('div[data-ad-comet-preview="message"]');
                const postArray = [];
                postElements.forEach(post => {
                    const postText = post.innerText.trim() || '';
                    const postDateText = post.closest('abbr')?.getAttribute('data-utime').trim() || '';
                    const mediaElements = post.querySelectorAll('img, video');
                    const mediaURLs = Array.from(mediaElements).map(media => media.src || media.poster);
                    postArray.push({ text: postText, date: postDateText, media: mediaURLs });
                });
                return postArray;
            } catch (error) {
                console.error(`Error scraping posts: ${error.message}`);
                return [];
            }
        });

        const validPosts = newPosts.filter(post => post.text && post.date);
        postsData.push(...validPosts);

        if (validPosts.length > 0) {
            const lastPost = validPosts[validPosts.length - 1];
            lastPostDate = new Date(lastPost.date);
        } else {
            logEvent('No valid posts found, stopping scraping.', 'info');
            break;
        }

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
