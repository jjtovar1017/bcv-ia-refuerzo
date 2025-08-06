import { webSearchService } from './webSearchService';

describe('WebSearchService', () => {
  it('should return fallback results when no API keys are provided', async () => {
    const results = await webSearchService.searchWeb('test');
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].source).toBe('BCV Oficial');
  });
});
