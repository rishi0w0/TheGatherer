const { scrapeTwitter } = require('../../src/agents/TwitterScraperAgent');
const { saveData } = require('../../src/data/DataHandler');
const puppeteer = require('puppeteer-extra');

jest.mock('puppeteer-extra');
jest.mock('../../src/data/DataHandler');
jest.mock('../../src/utils/OpenAIUtils', () => ({
  identifySelector: jest.fn().mockResolvedValue('mockSelector')
}));
jest.mock('../../src/utils/HumanInteractions', () => ({
  typeWithHumanDelay: jest.fn(),
  randomScroll: jest.fn(),
  randomClick: jest.fn()
}));
jest.mock('../../src/utils/CaptchaSolver', () => ({
  solveCaptcha: jest.fn().mockResolvedValue(true)
}));
jest.mock('../../src/utils/UserIntervention', () => ({
  promptUserIntervention: jest.fn()
}));
jest.mock('../../src/ui/EventLogger', () => ({
  logEvent: jest.fn()
}));

describe('scrapeTwitter', () => {
  let browser;
  let page;

  beforeEach(() => {
    page = {
      goto: jest.fn(),
      waitForTimeout: jest.fn(),
      click: jest.fn(),
      waitForNavigation: jest.fn(),
      evaluate: jest.fn(),
      $: jest.fn()
    };
    browser = {
      newPage: jest.fn().mockResolvedValue(page),
      close: jest.fn()
    };
    puppeteer.launch.mockResolvedValue(browser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should scrape Twitter data using Puppeteer', async () => {
    page.evaluate.mockResolvedValueOnce({
      username: 'test_user',
      followers: '100',
      following: '50',
      bio: 'This is a test bio'
    });
    page.evaluate.mockResolvedValueOnce([
      {
        text: 'Test tweet',
        date: '2022-01-01T00:00:00Z',
        media: [],
        retweets: '10',
        likes: '5',
        replies: '2'
      }
    ]);

    await scrapeTwitter('username', 'password', 'targetProfile', '01-01-2021 to 01-01-2022');

    expect(saveData).toHaveBeenCalledWith('Twitter', {
      profile: {
        username: 'test_user',
        followers: '100',
        following: '50',
        bio: 'This is a test bio'
      },
      tweets: [
        {
          date: '2022-01-01',
          content: 'Test tweet',
          media: [],
          retweets: '10',
          likes: '5',
          replies: '2'
        }
      ]
    });
    expect(browser.close).toHaveBeenCalled();
  });
});
