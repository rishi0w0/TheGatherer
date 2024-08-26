const fs = require('fs');
const path = require('path');
const { saveData, loadData } = require('../../src/data/DataHandler');

jest.mock('fs');

describe('DataHandler', () => {
  const fileName = 'test_data';
  const data = { key: 'value' };
  const filePath = path.resolve(__dirname, `../../src/data/${fileName}.json`);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save data to a file', () => {
    saveData(fileName, data);
    expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, JSON.stringify(data, null, 2));
  });

  it('should load data from a file', () => {
    fs.readFileSync.mockReturnValue(JSON.stringify(data));
    const loadedData = loadData(fileName);
    expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8');
    expect(loadedData).toEqual(data);
  });

  it('should handle errors when loading data', () => {
    fs.readFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });
    const loadedData = loadData(fileName);
    expect(loadedData).toBeNull();
  });
});
