require('dotenv').config();

module.exports = {
    openaiApiKey: process.env.OPENAI_API_KEY,
    twitterUsername: process.env.TWITTER_USERNAME,
    twitterPassword: process.env.TWITTER_PASSWORD,
    logLevel: process.env.LOG_LEVEL || 'info'
};
