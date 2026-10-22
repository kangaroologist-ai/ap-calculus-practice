import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import type {
  D1Like,
  D1PreparedStatement,
  D1Result,
} from "../../functions/_lib/d1";

type Row = Record<string, unknown>;
type SqlValue = string | number | bigint | null | Uint8Array;

class SqliteStatement implements D1PreparedStatement {
  private values: SqlValue[] = [];

  constructor(
    private readonly db: DatabaseSync,
    private readonly sql: string,
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    this.values = values as SqlValue[];
    return this;
  }

  async first<T = Row>(column?: string): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...this.values) as Row | undefined;
    if (row === undefined) return null;
    if (column !== undefined) return row[column] as unknown as T;
    return { ...row } as unknown as T;
  }

  async all<T = Row>(): Promise<D1Result<T>> {
    const rows = this.db.prepare(this.sql).all(...this.values) as Row[];
    return {
      results: rows.map((row) => ({ ...row }) as unknown as T),
      success: true,
      meta: { changes: 0 },
    };
  }

  async run(): Promise<D1Result> {
    const result = this.db.prepare(this.sql).run(...this.values);
    return {
      results: [],
      success: true,
      meta: { changes: Number(result.changes) },
    };
  }
}

export interface TestD1 extends D1Like {
  exec(sql: string): void;
}

export function createTestD1(): TestD1 {
  const db = new DatabaseSync(":memory:");
  db.exec(
    readFileSync(
      new URL("../../migrations/0001_accounts.sql", import.meta.url),
      "utf8",
    ),
  );
  return {
    prepare: (sql: string) => new SqliteStatement(db, sql),
    batch: async (statements: D1PreparedStatement[]) => {
      const results: D1Result[] = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    },
    exec: (sql: string) => db.exec(sql),
  };
}
