import { runPlaywrightServerTest } from './playwrightServerTest.js';


function main(): void {
    runPlaywrightServerTest()
        .then(() => {
            console.log('Playwright server test completed successfully.');
        })
        .catch((error) => {
            console.error('Error during Playwright server test:', error);
        });
}

main();