// Debug script to test search functionality
// Copy and paste this into the browser console to test search

console.log('🔍 Testing RPG Scribe Search Functionality...');

// Test the search queries that were failing
const testQueries = [
  'Recent campaign events',
  'Show me all characters',
  'characters',
  'events',
  'dragon',
  'goblin'
];

// Function to test a single query
async function testQuery(query) {
  console.log(`\n🔍 Testing query: "${query}"`);

  try {
    // Import the search service (adjust path as needed)
    const { aiSearchService } = await import('./src/services/search/AISearchService.js');

    // Initialize if needed
    await aiSearchService.initialize();

    // Perform search
    const results = await aiSearchService.search(query);

    console.log(`✅ Found ${results.length} results for "${query}":`, results);

    if (results.length === 0) {
      console.warn(`⚠️ No results found for "${query}"`);
    } else {
      results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.name} (${result.type}) - Confidence: ${result.confidence}`);
      });
    }

    return results;
  } catch (error) {
    console.error(`❌ Search failed for "${query}":`, error);
    return [];
  }
}

// Test all queries
async function runAllTests() {
  console.log('🚀 Starting comprehensive search tests...');

  for (const query of testQueries) {
    await testQuery(query);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  console.log('\n✅ All search tests completed!');
}

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
});

// Also test suggestions
console.log('\n💡 Testing search suggestions...');
// This would need to be tested in the actual app context
