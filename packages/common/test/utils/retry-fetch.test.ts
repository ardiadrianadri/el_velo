import { afterEach, describe, expect, it, vi } from 'vitest';

import { retryFetchJson } from '../../src/utils/retryFetch.js';

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('retryFetchJson', () => {
    it('retries network failures with exponential backoff and returns unvalidated JSON', async () => {
        vi.useFakeTimers();
        const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('Temporary network error'))
            .mockResolvedValueOnce(new Response('{"message":"ok"}', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const result = retryFetchJson('https://example.test/data');
        await vi.advanceTimersByTimeAsync(100);

        await expect(result).resolves.toEqual({ message: 'ok' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('retries transient HTTP statuses and throws for permanent HTTP failures', async () => {
        vi.useFakeTimers();
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
            .mockResolvedValueOnce(new Response('{"ready":true}', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const result = retryFetchJson('https://example.test/data');
        await vi.advanceTimersByTimeAsync(100);

        await expect(result).resolves.toEqual({ ready: true });
        expect(fetchMock).toHaveBeenCalledTimes(2);

        fetchMock.mockResolvedValueOnce(new Response('missing', { status: 404 }));
        await expect(retryFetchJson('https://example.test/missing')).rejects.toThrow('status 404');
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('preserves the final network error as the cause after exhausting retries', async () => {
        vi.useFakeTimers();
        const networkError = new TypeError('Connection refused');
        const fetchMock = vi.fn().mockRejectedValue(networkError);
        vi.stubGlobal('fetch', fetchMock);

        const result = retryFetchJson('https://example.test/data');
        const rejection = expect(result).rejects.toMatchObject({ cause: networkError });
        await vi.advanceTimersByTimeAsync(300);

        await rejection;
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('does not retry malformed JSON responses', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response('not-json', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        await expect(retryFetchJson('https://example.test/data')).rejects.toThrow('not valid JSON');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
