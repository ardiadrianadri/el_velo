import { readdir } from 'node:fs/promises';

export function readYamlFilesInDirectory(directoryPath: string): Promise<string[]> {
    return readdir(directoryPath, { withFileTypes: true })
        .then((dirents) => {
            const yamlFiles = dirents
                .filter((dirent) => dirent.isFile() && (dirent.name.endsWith('.yaml') || dirent.name.endsWith('.yml')))
                .map((dirent) => `${directoryPath}/${dirent.name}`);
            return yamlFiles;
        });
}