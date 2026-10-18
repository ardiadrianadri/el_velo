import { TEST_VALIDATION } from './config.js';
import { runPlaywrightServerTest } from './playwrightServerTest.js';


async function main(): Promise<void> {
    const result = await runPlaywrightServerTest();
    const invalidResults = result.filter(dom => !dom.includes(TEST_VALIDATION));
    if (invalidResults.length > 0) {
        throw new Error('Test validation failed. Expected output not found.');
    }
    console.log('Playwright Server test completed successfully.');
}

main().then(() => {
    console.log('All tests completed successfully.');
}).catch((error) => {
    console.error('Error occurred while running tests.', error);
    process.exit(1);
});