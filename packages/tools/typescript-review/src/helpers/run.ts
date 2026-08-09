import { main } from './main.js';

export async function run(): Promise<void> {
    try {
        await main();
    } catch (error: unknown) {
        console.error('Error running TypeScript review:', error);
        process.exitCode = 1;
    }
}
