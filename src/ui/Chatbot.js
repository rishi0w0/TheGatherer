const readline = require('readline');
const { scrapeTwitter } = require('../agents/TwitterScraperAgent');
const { scrapeInstagram } = require('../agents/InstagramScraperAgent');
const { scrapeFacebook } = require('../agents/FacebookScraperAgent');
const { scrapeTikTok } = require('../TikTokScraperAgent');
const { logEvent } = require('./EventLogger');
const { askOpenAI } = require('../utils/OpenAIUtils');
const { saveData, loadData } = require('../data/DataHandler');
const { visualizeData } = require('../visualization/DataVisualizer');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function startChatbot() {
    logEvent('Welcome to TheGatherer AI Web Scraping Agency! Type "help" at any time for a list of commands.');

    while (true) {
        try {
            const platform = await askQuestion('Select the platform (Twitter, Instagram, Facebook, TikTok): ');
            if (platform.toLowerCase() === 'help') {
                displayHelp();
                continue;
            }
            if (!['twitter', 'instagram', 'facebook', 'tiktok'].includes(platform.toLowerCase())) {
                logEvent('Unsupported platform! Please try again.', 'warning');
                continue;
            }

            const username = await askQuestion('Enter your username: ');
            const password = await askQuestion('Enter your password: ');
            const targetProfile = await askQuestion('Enter the target profile: ');
            const dateRange = await askQuestion('Enter the date range (dd-mm-yyyy to dd-mm-yyyy): ');

            logEvent(`Starting the scraping process for ${platform} profile ${targetProfile} from ${dateRange}...`);
            logEvent('Please wait for the process to be completed.');

            let scrapeFunction;
            if (platform.toLowerCase() === 'twitter') {
                scrapeFunction = scrapeTwitter;
            } else if (platform.toLowerCase() === 'instagram') {
                scrapeFunction = scrapeInstagram;
            } else if (platform.toLowerCase() === 'facebook') {
                scrapeFunction = scrapeFacebook;
            } else if (platform.toLowerCase() === 'tiktok') {
                scrapeFunction = scrapeTikTok;
            }

            const data = await scrapeFunction(username, password, targetProfile, dateRange);
            logEvent('Scraping completed successfully.');
            logEvent('Data saved. You can now download the scraped data or upload previously downloaded files for analysis.');

            await offerDownloadUploadOptions(data);
            break;
        } catch (error) {
            logEvent(`Error: ${error.message}`, 'error');
            const retry = await askQuestion('Do you want to retry? (yes/no): ');
            if (retry.toLowerCase() !== 'yes') {
                break;
            }
        }
    }

    rl.close();
}

function displayHelp() {
    logEvent('Available commands:');
    logEvent('1. help - Display this help message.');
    logEvent('2. Select the platform - Choose from Twitter, Instagram, Facebook, or TikTok.');
    logEvent('3. Enter your username - Provide your social media username.');
    logEvent('4. Enter your password - Provide your social media password.');
    logEvent('5. Enter the target profile - Specify the profile to scrape.');
    logEvent('6. Enter the date range - Specify the date range for scraping (dd-mm-yyyy to dd-mm-yyyy).');
    logEvent('7. Select an analysis option - Choose from displaying raw data, performing sentiment analysis, categorizing data, asking questions about the data, or exiting.');
    logEvent('8. exit - Exit the chatbot.');
}

async function offerDownloadUploadOptions(data) {
    logEvent('Options:');
    logEvent('1. Download scraped data');
    logEvent('2. Upload previously downloaded data file');
    logEvent('3. Exit');

    const choice = await askQuestion('Select an option (1-3): ');
    switch (choice) {
        case '1':
            await offerDownloadOptions(data);
            break;
        case '2':
            await handleDataUpload();
            break;
        case '3':
            logEvent('Exiting...');
            break;
        default:
            logEvent('Invalid option! Please try again.', 'warning');
            await offerDownloadUploadOptions(data);
    }
}

async function offerDownloadOptions(data) {
    const fileName = await askQuestion('Enter the file name to save the data (without extension): ');
    saveData(fileName, data);
    logEvent(`Data saved as ${fileName}.json.`);
    logEvent('You can now analyze and visualize the data.');
    await offerDataAnalysisOptions(data);
}

async function handleDataUpload() {
    const fileName = await askQuestion('Enter the file name to load the data (without extension): ');
    const data = loadData(fileName);
    if (data) {
        logEvent(`Data loaded from ${fileName}.json.`);
        await offerDataAnalysisOptions(data);
    } else {
        logEvent('Failed to load data. Please make sure the file exists and is a valid data file.', 'error');
        await offerDownloadUploadOptions();
    }
}

async function offerDataAnalysisOptions(data) {
    logEvent('Data analysis options:');
    logEvent('1. Display raw data');
    logEvent('2. Perform sentiment analysis');
    logEvent('3. Categorize data');
    logEvent('4. Trend analysis');
    logEvent('5. Keyword extraction');
    logEvent('6. Visualize data');
    logEvent('7. Exit');

    const choice = await askQuestion('Select an option (1-7): ');
    switch (choice) {
        case '1':
            logEvent('Displaying raw data:');
            console.log(JSON.stringify(data, null, 2));
            break;
        case '2':
            logEvent('Performing sentiment analysis...');
            await performSentimentAnalysis(data);
            break;
        case '3':
            logEvent('Categorizing data...');
            await categorizeData(data);
            break;
        case '4':
            logEvent('Performing trend analysis...');
            await performTrendAnalysis(data);
            break;
        case '5':
            logEvent('Extracting keywords...');
            await extractKeywords(data);
            break;
        case '6':
            logEvent('Visualizing data...');
            await visualizeData(data);
            break;
        case '7':
            logEvent('Exiting...');
            break;
        default:
            logEvent('Invalid option! Please try again.', 'warning');
            await offerDataAnalysisOptions(data);
    }
}

async function performSentimentAnalysis(data) {
    logEvent('Performing sentiment analysis...');
    const sentimentResults = data.posts.map(post => {
        const sentiment = post.content.includes('good') || post.content.includes('great') ? 'Positive' :
                          post.content.includes('bad') || post.content.includes('terrible') ? 'Negative' : 'Neutral';
        return {
            date: post.date,
            content: post.content,
            sentiment: sentiment
        };
    });

    logEvent('Sentiment analysis results:');
    console.log(JSON.stringify(sentimentResults, null, 2));
}

async function categorizeData(data) {
    logEvent('Categorizing data...');
    const categorizedData = {
        positive: [],
        negative: [],
        neutral: []
    };

    data.posts.forEach(post => {
        if (post.content.includes('good') || post.content.includes('great')) {
            categorizedData.positive.push(post);
        } else if (post.content.includes('bad') || post.content.includes('terrible')) {
            categorizedData.negative.push(post);
        } else {
            categorizedData.neutral.push(post);
        }
    });

    logEvent('Categorized data:');
    console.log(JSON.stringify(categorizedData, null, 2));
}

async function performTrendAnalysis(data) {
    logEvent('Performing trend analysis...');
    const trends = {};
    data.posts.forEach(post => {
        const date = post.date.split('T')[0]; // Consider date without time
        if (!trends[date]) {
            trends[date] = { positive: 0, negative: 0, neutral: 0 };
        }
        if (post.content.includes('good') || post.content.includes('great')) {
            trends[date].positive += 1;
        } else if (post.content.includes('bad') || post.content.includes('terrible')) {
            trends[date].negative += 1;
        } else {
            trends[date].neutral += 1;
        }
    });

    logEvent('Trend analysis results:');
    console.log(JSON.stringify(trends, null, 2));
}

async function extractKeywords(data) {
    logEvent('Extracting keywords...');
    const keywordFrequency = {};

    data.posts.forEach(post => {
        const words = post.content.split(/\s+/);
        words.forEach(word => {
            const cleanedWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanedWord) {
                if (!keywordFrequency[cleanedWord]) {
                    keywordFrequency[cleanedWord] = 0;
                }
                keywordFrequency[cleanedWord] += 1;
            }
        });
    });

    logEvent('Keyword extraction results:');
    console.log(JSON.stringify(keywordFrequency, null, 2));
}

async function visualizeData(data) {
    logEvent('Visualizing data...');
    console.log('Data visualization:', JSON.stringify(data, null, 2));

    const saveOption = await askQuestion('Do you want to download the visualization as PDF or Word? (pdf/word): ');
    if (saveOption.toLowerCase() === 'pdf') {
        await saveAsPDF(data);
    } else if (saveOption.toLowerCase() === 'word') {
        await saveAsWord(data);
    } else {
        logEvent('Invalid option. Skipping download.', 'warning');
    }
}

module.exports = { startChatbot, askQuestion };
