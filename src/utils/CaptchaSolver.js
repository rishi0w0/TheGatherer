const { logEvent } = require('../ui/EventLogger');
const { askOpenAI } = require('./OpenAIUtils');

async function solveCaptcha(page) {
    try {
        logEvent('Attempting to solve captcha using AI/ML models...');

        const captchaElement = await page.$('input[name="captcha"]');
        if (!captchaElement) {
            logEvent('No captcha found on the page.');
            return true;
        }

        const captchaImage = await captchaElement.screenshot({ encoding: 'base64' });
        const prompt = `Solve this captcha: ${captchaImage}`;
        const solution = await askOpenAI(prompt);

        if (solution) {
            await page.type('input[name="captcha"]', solution);
            await page.click('button[type="submit"]');
            await page.waitForNavigation();
            logEvent('Captcha solved using AI/ML models.');
            return true;
        } else {
            logEvent('Failed to solve captcha using AI/ML models.');
            return false;
        }
    } catch (error) {
        logEvent(`Error while solving captcha: ${error.message}`, 'error');
        return false;
    }
}

module.exports = { solveCaptcha };
