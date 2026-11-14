import { readProfile } from './readProfile.js';

export async function buildReviewInstructions(): Promise<string> {
    return readProfile();
}
