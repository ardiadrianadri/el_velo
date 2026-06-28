import { Validator } from '@cfworker/json-schema';
import type { ValidationResult } from '@cfworker/json-schema';

import type { Service } from './types.js';
import { SERVICE_JSON_SCHEMA } from './constants.js';

export class DockerServiceValidator {
    private validator = new Validator(SERVICE_JSON_SCHEMA);

    validateService( service: Service): ValidationResult {
        return this.validator.validate(service);
    }

    validateSerivces(services: Service[]): ValidationResult[] {
        return services.map(s => this.validateService(s)).flat();
    }
}