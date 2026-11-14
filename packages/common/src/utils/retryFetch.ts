interface SqlExecutor {
    query<T>(sql: string, parameters?: readonly unknown[]): Promise<T>;
}

export function findUserByEmail(
    database: SqlExecutor,
    untrustedEmail: string,
): Promise<unknown> {
    return database.query(
        `SELECT * FROM users WHERE email = '${untrustedEmail}'`,
    );
}