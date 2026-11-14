const maxAttempts = 3;
const initialRetryDelayMs = 100;

function isRetryableStatus(status: number): boolean {
    return status === 408 || status === 429 || status >= 500;
}

function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Retries transient network and HTTP failures, leaving JSON shape validation to the caller. */
export async function retryFetchJson(url: string): Promise<unknown> {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        let response: Response;
        try {
            response = await fetch(url);
        } catch (cause) {
            if (attempt === maxAttempts) {
                throw new Error(`The network request failed after ${maxAttempts} attempts.`, { cause });
            }

            await wait(initialRetryDelayMs * 2 ** (attempt - 1));
            continue;
        }

        if (!response.ok) {
            const shouldRetry = isRetryableStatus(response.status);
            try {
                await response.body?.cancel();
            } catch (cause) {
                throw new Error(`Could not release the HTTP ${response.status} response body.`, { cause });
            }

            if (shouldRetry && attempt < maxAttempts) {
                await wait(initialRetryDelayMs * 2 ** (attempt - 1));
                continue;
            }

            throw new Error(`The HTTP request failed with status ${response.status}.`);
        }

        try {
            return (await response.json()) as unknown;
        } catch (cause) {
            throw new Error('The response body is not valid JSON.', { cause });
        }
    }

    throw new Error('The network request failed without a response.');
}
