const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const Twitter = require('twitter');
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

async function fetchTwitterDataWithAPI(client, targetProfile, dateRange) {
    try {
        logEvent('Fetching data using Twitter Developer API...');
        
        const profileData = await client.get('users/show', { screen_name: targetProfile });
        const tweetsData = await client.get('statuses/user_timeline', { screen_name: targetProfile, count: 200 });

        const filteredTweets = tweetsData.filter(tweet => {
            const tweetDate = new Date(tweet.created_at);
            const [startDate, endDate] = dateRange.split(' to ').map(date => new Date(date));
            return tweetDate >= startDate && tweetDate <= endDate;
        });

        const structuredData = {
            profile: {
                username: profileData.screen_name,
                followers: profileData.followers_count,
                following: profileData.friends_count,
                bio: profileData.description
            },
            tweets: filteredTweets.map(tweet => ({
                date: formatDate(tweet.created_at),
                content: tweet.text,
                media: tweet.entities.media ? tweet.entities.media.map(media => media.media_url) : [],
                retweets: tweet.retweet_count,
                likes: tweet.favorite_count,
                replies: tweet.reply_count || 0 // API may not provide reply count
            }))
        };

        logEvent('Data fetched successfully using Twitter Developer API.');
        return structuredData;

    } catch (error) {
        logEvent(`Error fetching data using Twitter Developer API: ${error.message}`, 'error');
        throw error;
    }
}

async function scrapeTwitter(username, password, targetProfile, dateRange) {
    // Check if Twitter Developer API credentials are provided
    if (config.twitterApiKey && config.twitterApiSecretKey && config.twitterAccessToken && config.twitterAccessTokenSecret) {
        try {
            const client = new Twitter({
                consumer_key: config.twitterApiKey,
                consumer_secret: config.twitterApiSecretKey,
                access_token_key: config.twitterAccessToken,
                access_token_secret: config.twitterAccessTokenSecret
            });

            const data = await fetchTwitterDataWithAPI(client, targetProfile, dateRange);
            saveData('Twitter', data);
            return data;
        } catch (error) {
            logEvent('Falling back to Puppeteer scraping due to API error.', 'warning');
        }
    }

    // Fallback to Puppeteer scraping if API credentials are not provided or API request fails
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await retryOperation(async () => {
            await login(page, username, password);
            const profileData = await scrapeProfile(page, targetProfile);
            const tweetsData = await scrapeTweets(page, dateRange);

            logEvent('Scraping completed.');
            await browser.close();

            // Save data in structured format
            const structuredData = {
                profile: profileData,
                tweets: tweetsData.map(tweet => ({
                    date: formatDate(tweet.date),
                    content: tweet.text,
                    media: tweet.media,
                    retweets: tweet.retweets,
                    likes: tweet.likes,
                    replies: tweet.replies
                }))
            };
            saveData('Twitter', structuredData);

            logEvent('Data saved successfully.');
            return structuredData;
        }, 3, 5000); // Retry operation up to 3 times with a 5-second delay between attempts
    } catch (error) {
        logEvent(`Error: ${error.message}`, 'error');
        await browser.close();
    }
}

async function login(page, username, password) {
    logEvent('Navigating to Twitter login page...');
    await page.goto('https://twitter.com/login');
    await page.waitForTimeout(1000 + Math.random() * 2000);

    logEvent('Identifying username input field...');
    const usernameSelector = await identifySelector(page, 'username input field on Twitter login page');
    logEvent('Identifying password input field...');
    const passwordSelector = await identifySelector(page, 'password input field on Twitter login page');
    logEvent('Identifying login button...');
    const loginButtonSelector = await identifySelector(page, 'login button on Twitter login page');

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
    await page.goto(`https://twitter.com/${targetProfile}`);
    await page.waitForTimeout(1000 + Math.random() * 2000);

    logEvent('Scraping profile information...');
    const profileData = await page.evaluate(() => {
        try {
            return {
                username: document.querySelector('div[data-testid="UserName"]')?.innerText || '',
                followers: document.querySelector('a[href$="/followers"] > span > span')?.innerText || '',
                following: document.querySelector('a[href$="/following"] > span > span')?.innerText || '',
                bio: document.querySelector('div[data-testid="UserDescription"]')?.innerText || ''
            };
        } catch (error) {
            logEvent(`Error scraping profile information: ${error.message}`, 'error');
            return {};
        }
    });
    logEvent('Profile information scraped successfully.');
    return profileData;
}

async function scrapeTweets(page, dateRange) {
    logEvent('Starting to scrape tweets...');
    const tweetsData = [];
    let lastTweetDate = new Date();

    while (lastTweetDate >= new Date(dateRange.split(' to ')[0])) {
        await randomScroll(page);
        await randomClick(page);

        const tweets = await page.evaluate(() => {
            try {
                const tweetElements = document.querySelectorAll('article');
                const tweetArray = [];
                tweetElements.forEach(tweet => {
                    const tweetText = tweet.querySelector('div[lang]')?.innerText || '';
                    const tweetDate = tweet.querySelector('time')?.getAttribute('datetime') || '';
                    const mediaElements = tweet.querySelectorAll('img, video');
                    const mediaURLs = Array.from(mediaElements).map(media => media.src || media.poster);
                    const retweets = tweet.querySelector('div[data-testid="retweet"] span')?.innerText || '0';
                    const likes = tweet.querySelector('div[data-testid="like"] span')?.innerText || '0';
                    const replies = tweet.querySelector('div[data-testid="reply"] span')?.innerText || '0';
                    tweetArray.push({ text: tweetText, date: tweetDate, media: mediaURLs, retweets, likes, replies });
                });
                return tweetArray;
            } catch (error) {
                logEvent(`Error scraping tweets: ${error.message}`, 'error');
                return [];
            }
        });

        tweetsData.push(...tweets);
        lastTweetDate = new Date(tweets[tweets.length - 1].date);

        logEvent('Scrolling to load more tweets...');
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(2000 + Math.random() * 2000); // Randomized delay
    }

    logEvent('Tweets scraped successfully.');
    return tweetsData;
}

module.exports = { scrapeTwitter };
