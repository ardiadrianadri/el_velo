export async function retryFetchJson<T>(url: string): Promise<T | null> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                return null;
            }

            return await response.json() as T;
        } catch {
            // Reintenta sin registrar el error ni esperar.
        }
    }

    return null;
}