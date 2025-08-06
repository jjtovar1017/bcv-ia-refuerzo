import 'dotenv/config';
import { webSearchService } from '../services/webSearchService.ts';

// Mock localStorage for Node.js environment
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: function(key) {
      return null;
    },
    setItem: function(key, value) {},
    removeItem: function(key) {},
    clear: function() {},
    length: 0,
    key: function(index) { return null; }
  };
}

async function testWebSearch() {
  try {

    console.log('Testing WebSearchService with query: "Banco Central de Venezuela"');
    const results = await webSearchService.searchWeb('Banco Central de Venezuela', 3);

    if (results.length > 0) {
      console.log('Search Results:');
      results.forEach((result, index) => {
        console.log(`-- Result ${index + 1} --`);
        console.log(`Title: ${result.title}`);
        console.log(`URL: ${result.url}`);
        console.log(`Snippet: ${result.snippet}`);
        console.log('--------------------');
      });
    } else {
      console.log('No search results found.');
    }
  } catch (error) {
    console.error('Error during WebSearchService test:', error);
  }
}

testWebSearch();
