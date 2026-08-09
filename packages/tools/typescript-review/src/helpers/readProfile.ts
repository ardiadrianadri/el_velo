import { readFile } from 'node:fs/promises';

import { config } from '../config.js';

export function readProfile(): Promise<string> {
    return readFile(config.profilePath, 'utf-8');
}
