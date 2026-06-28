import { describe, expect, it, beforeEach } from 'vitest';

import { DockerServiceValidator } from '../src/validator.js';
import type { Service } from '../src/types.js';

describe('Validator', () => {
    const validator = new DockerServiceValidator();
    let service: Service;

    beforeEach(() => {
        service = {
            image: 'test-image',
            name: 'test-servce'
        };
    });

    it('should return a not valid object if the service does not have a name', () => {
        const service = {
            image: 'test-image'
        };

        const result = validator.validateService(service as any);

        expect(result.valid).toBe(false);
        expect(result.errors[0].error).toBe('Instance does not have required property "name".');
    });

    it('should return a not valid object if the service does not have a image', () => {
        const service = {
            name: 'test-service'
        };

        const result = validator.validateService(service as any);

        expect(result.valid).toBe(false);
        expect(result.errors[0].error).toBe('Instance does not have required property "image".');
    });

    it('should return a not valid object if the service name is not a string', () => {
        const service = {
            name: 1234,
            image: 'test-image'
        };

        const result = validator.validateService(service as any);
        expect(result.valid).toBe(false);
        expect(result.errors[0].error).toBe('Property "name" does not match schema.');
    });

    it('should return a not valid object if the service image is not a string', () => {
        const service = {
            name: 'test-service',
            image: 1234
        };

        const result = validator.validateService(service as any);
        expect(result.valid).toBe(false);
        expect(result.errors[0].error).toBe('Property "image" does not match schema.');
    });

    it('should return a valid object if the service has a valid name and image', () => {
        const result = validator.validateService(service);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    it('should return an invalid object if the service has an empty environment configuration', () => {
        service.environment = {};

        const result = validator.validateService(service);
        expect(result.valid).toBe(false);
        expect(result.errors[0].error).toBe('Property "environment" does not match schema.');
    });

    it('should return a valid object if the service has a non empty environment configuratio', () => {
        service.environment = { TEST_VAR: 'TEST_VALUE' };

        const result = validator.validateService(service);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    it('should return an invalid object if the service has an empty command', () => {
        service.command = [];

        const result = validator.validateService(service);
        expect(result.valid).toBe(false);
        expect(result.errors[0].error).toBe('Property "command" does not match schema.');
    });

    it('should return a valid object if the service has a non empty command', () => {
        service.command = ['ls', '-l'];

        const result = validator.validateService(service);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    it('should return an invalid object if the service has a wrong value as exposed port', () => {
        service.exposePorts = ['-1'];

        const result = validator.validateService(service);
        expect(result.valid).toBe(false);
        expect(result.errors[0].error).toBe('Property "exposePorts" does not match schema.');
    });

    it('should return a valid object if the service has a list of valid values as exposed ports', () => {
        service.exposePorts = ['80', '8080', '443'];

        const result = validator.validateService(service);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    it('should return an invalid object if the service has a wrong schema in portsMapping', () => {
        service.portsMapping = ['-1:0'];

        const result = validator.validateService(service);
        expect(result.valid).toBe(false);
        expect(result.errors[0].error).toBe('Property "portsMapping" does not match schema.');
    });

    it('should return a valid object if the service has a right expression to set the ports mapping', () => {
        service.portsMapping = ['8080:80'];

        const result = validator.validateService(service);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    it('should return an invalid object if the service has a wrong mode for volumes mapping', () => {
        service.volumes = ['/path/local/test:/path/docker/test:pp'];

        const result = validator.validateService(service);
        expect(result.valid).toBe(false);
        expect(result.errors[0].error).toBe('Property "volumes" does not match schema.');
    });

    it('should return a valid object if the service has a right mode for volumes mapping', () => {
        service.volumes = ['/path/local/test:/path/docker/test:ro'];

        const result = validator.validateService(service);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    it('should an array of validations if we pass an array of services', () => {
        const services = [service, service];

        const results = validator.validateSerivces(services);
        expect(results.length).toBe(services.length);
        expect(results.some(r => !r.valid)).toBe(false);
    });
});
