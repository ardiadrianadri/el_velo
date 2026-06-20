import fs from 'node:fs';
import { promisify } from 'node:util';

export class PathValidation {
    private checkPath = promisify(fs.access);

    private async pathExist(path: string): Promise<boolean> {
        try {
            await this.checkPath(path);

            return true;
        }
        catch {
            return false;
        }
    }


    public async validate(path: string, local = true): Promise<boolean> {
        if (typeof path !== 'string') {
            return false;
        }
        
        if (path.length === 0) {
            return false;
        }

        if (path.includes('\0')) {
            return false;
        }

        if (local) {
            return await this.pathExist(path);
        }

        return true;
    } 
}