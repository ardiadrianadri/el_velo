// File with the setup for the tests of the docker-orchestrator package
import { vi, beforeEach } from 'vitest';

import {
    networkStartMock,
    mockContainerBuilder,
    mockNetwork,
    mockContainer,
    mockExec,
    mockSocatContainer,
    mockSocatContainerBuilder
} from './mocks.js';

function factoryMockContainerBuilder (): any {
    return mockContainerBuilder;
}

function factoryMockSocatContainerBuilder (): any {
    return mockSocatContainerBuilder;
}

vi.mock('testcontainers', () => ({
    Network: class { start = networkStartMock; },
    GenericContainer: factoryMockContainerBuilder,
    SocatContainer: factoryMockSocatContainerBuilder
}));

beforeEach(() => {
    vi.clearAllMocks();
    networkStartMock.mockResolvedValue(mockNetwork);
    mockNetwork.stop.mockResolvedValue(undefined);
    mockContainer.stop.mockResolvedValue(undefined);
    mockSocatContainer.stop.mockResolvedValue(undefined);

    mockExec.mockResolvedValue({
        exitCode: 0,
        stdout: 'ok',
        stderr: ''
    });

    mockContainerBuilder.start.mockResolvedValue(mockContainer);
    mockSocatContainerBuilder.start.mockResolvedValue(mockSocatContainer);
    mockSocatContainer.getMappedPort.mockReturnValue(8080);
    mockSocatContainer.getHost.mockReturnValue('localhost');
});
