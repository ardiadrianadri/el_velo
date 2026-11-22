import { 
    Logger,
    VeloError,
    type VTSTestDefinition,
    type VTSPluginConfig,
    type VTSTestPlan,
    type VTSExpectation,
    type VTSContext,
    type VTSStepGroup,
    type VTSStep,
    type VTSResource
} from '@el_velo/common';
import { stat, readdir, access, constants, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from'js-yaml';

import { CODES } from './config.js';

export class VTSParser {
    private fullVTSFolder = '';
    private vtsTestPlans: VTSTestPlan[] = [];
    private vtsPluginConfigs: VTSPluginConfig[] = [];
    private vtsTestDefinitions: VTSTestDefinition[] = [];
    private vtsExpectations: VTSExpectation[] = [];
    private vtsContexts: VTSContext[] = [];
    private vtsStepGroups: VTSStepGroup[] = [];
    private vtsSteps: VTSStep[] = [];

    constructor(vtsFolder: string, private logger: Logger = new Logger()) {
        const methodName = 'constructor';
        this.logger.info(VTSParser.name, methodName, 'Starting VTS files parser');

        this.fullVTSFolder = join(process.cwd(), vtsFolder);
    }


    private async validateVTSFolder(directory: string): Promise<boolean> {
        const methodName = 'validateVTSFolder';
        this.logger.debug(VTSParser.name, methodName, 'Validating VTS folder');
        try {
            if (!directory) {
                return false;
            }

            await access(directory, constants.R_OK);
            const stats = await stat(directory);

            return stats.isDirectory();
        }
        catch {
            return false;
        }
    }

    private async getVTSFiles(directory: string): Promise<string[]> {
        const methodName = 'getVTSFiles';
        this.logger.debug(VTSParser.name, methodName, 'Getting the list of VTS files');

        const isValidFolder = await this.validateVTSFolder(directory);
        if (!isValidFolder) {
            const error = new VeloError(CODES.CANT_ACCESS_VTS_FOLDER, `The folder ${directory} is not valid`);
            this.logger.error(VTSParser.name, methodName, error);
            throw error;
        }

        try {
            const folders = await readdir(directory, { withFileTypes: true});

            if (!folders.length) {
                const error = new VeloError(CODES.VTS_FILES_NOT_FOUND, 'No VTS files were found in the folder');
                this.logger.error(VTSParser.name, methodName, error);
                throw error;
            }

            return folders.filter((file) => file.isFile() && ((file.name.endsWith('.yaml') || file.name.endsWith('.yml'))))
                .map((file) => join(directory, file.name));
        }
        catch (e: unknown) {
            let error;

            if (e instanceof Error) {
                error = e;
                this.logger.error(VTSParser.name, methodName, error, CODES.ERROR_READING_VTS_FOLDER);
            } else {
                error = new VeloError(CODES.ERROR_READING_VTS_FOLDER, `Error reading folder ${directory}`);
                this.logger.error(VTSParser.name, methodName, error);
            }

            throw error;
        }
    }

    private async getVTSResources(yamlFiles: string[]): Promise<VTSResource[]> {
        const vtsResources =  await Promise.all(
            yamlFiles.map(async (file) => {
                const content = await readFile(file, 'utf-8');

                return load(content, { filename: file }) as VTSResource;
            })
        );

        return vtsResources;
    }
}