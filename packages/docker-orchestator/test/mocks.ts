import { vi } from 'vitest';

export const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
};

export const mockNetwork = {
    stop: vi.fn()
};

export const mockExec = vi.fn();

export const mockContainer = {
    stop: vi.fn(),
    exec: mockExec,
};

export const mockContainerBuilder = {
    withCommand: vi.fn().mockReturnThis(),
    withExposedPorts: vi.fn().mockReturnThis(),
    withEnvironment: vi.fn().mockReturnThis(),
    withNetwork: vi.fn().mockReturnThis(),
    withNetworkAliases: vi.fn().mockReturnThis(),
    withBindMounts: vi.fn().mockReturnThis(),
    start: vi.fn()
};

export const mockSocatContainer = {
    stop: vi.fn(),
    getMappedPort: vi.fn(),
    getHost: vi.fn()
};

export const mockSocatContainerBuilder = {
    withNetwork: vi.fn().mockReturnThis(),
    withTarget: vi.fn().mockReturnThis(),
    start: vi.fn()
};

export const networkStartMock = vi.fn();

export const pathValidationMock = {
    validate: vi.fn()
};

export const dockerServiceValidator = {
    validateSerivces: vi.fn().mockReturnValue([
        { valid: true }
    ])
};

export const mockPathJoin = vi.fn().mockImplementation((...args: string[]) => args[args.length - 1]);
