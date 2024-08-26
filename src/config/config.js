require('dotenv').config();

module.exports = {
    openaiApiKey: process.env.OPENAI_API_KEY,
    twitterUsername: process.env.TWITTER_USERNAME,
    twitterPassword: process.env.TWITTER_PASSWORD,
    twitterApiKey: process.env.TWITTER_API_KEY,
    twitterApiSecretKey: process.env.TWITTER_API_SECRET_KEY,
    twitterAccessToken: process.env.TWITTER_ACCESS_TOKEN,
    twitterAccessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    logLevel: process.env.LOG_LEVEL || 'info'
};
