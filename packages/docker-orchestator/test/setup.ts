// File with the setup for the tests of the docker-orchestrator package
import { vi, beforeEach } from 'vitest';

import {
    networkStartMock,
    mockContainerBuilder,
    mockNetwork,
    mockContainer,
    mockExec
} from './mocks.js';

function factoryMockContainerBuilder (): any {
    return mockContainerBuilder;
}

vi.mock('testcontainers', () => ({
    Network: class { start = networkStartMock; },
    GenericContainer: factoryMockContainerBuilder
}));

beforeEach(() => {
    vi.clearAllMocks();
    networkStartMock.mockResolvedValue(mockNetwork);
    mockNetwork.stop.mockResolvedValue(undefined);
    mockContainer.stop.mockResolvedValue(undefined);

    mockExec.mockResolvedValue({
        exitCode: 0,
        stdout: 'ok',
        stderr: ''
    });

    mockContainerBuilder.start.mockResolvedValue(mockContainer);
});