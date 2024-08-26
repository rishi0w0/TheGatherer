const { scrapeFacebook } = require('../../src/agents/FacebookScraperAgent');
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

describe('scrapeFacebook', () => {
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

  it('should scrape Facebook data using Puppeteer', async () => {
    page.evaluate.mockResolvedValueOnce({
      username: 'test_user',
      friends: '100',
      bio: 'This is a test bio'
    });
    page.evaluate.mockResolvedValueOnce([
      {
        text: 'Test post',
        date: '2022-01-01T00:00:00Z',
        media: ['test_media_url']
      }
    ]);

    await scrapeFacebook('username', 'password', 'targetProfile', '01-01-2021 to 01-01-2022');

    expect(saveData).toHaveBeenCalledWith('Facebook', {
      profile: {
        username: 'test_user',
        friends: '100',
        bio: 'This is a test bio'
      },
      posts: [
        {
          date: '2022-01-01',
          content: 'Test post',
          media: ['test_media_url']
        }
      ]
    });
    expect(browser.close).toHaveBeenCalled();
  });
});
