const { logEvent } = require('../ui/EventLogger');

async function typeWithHumanDelay(page, selector, text) {
    try {
        const element = await page.$(selector);
        for (let char of text) {
            await element.type(char, { delay: 100 + Math.random() * 100 });
        }
    } catch (error) {
        logEvent(`Error typing with human delay: ${error.message}`, 'error');
    }
}

async function randomScroll(page) {
    try {
        const scrollDistance = Math.floor(Math.random() * 1000) + 500;
        await page.evaluate((distance) => {
            window.scrollBy(0, distance);
        }, scrollDistance);
        await page.waitForTimeout(1000 + Math.random() * 2000);
    } catch (error) {
        logEvent(`Error performing random scroll: ${error.message}`, 'error');
    }
}

async function randomClick(page) {
    try {
        const clickableElements = await page.$$('a, button');
        if (clickableElements.length > 0) {
            const randomElement = clickableElements[Math.floor(Math.random() * clickableElements.length)];
            await randomElement.click();
            await page.waitForTimeout(1000 + Math.random() * 2000);
        }
    } catch (error) {
        logEvent(`Error performing random click: ${error.message}`, 'error');
    }
}

module.exports = { typeWithHumanDelay, randomScroll, randomClick };
