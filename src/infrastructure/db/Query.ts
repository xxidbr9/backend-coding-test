import { Database } from "sqlite3";


export class Query {
  constructor(private db: Database) {
    this.db = db
  }

  find(query: string, params?: any[]): Promise<{ results: any[], count: number }> {
    const results: any[] = [];
    return new Promise((resolve, reject) => {
      this.db.each(query, params, (err, row) => {
        if (err) return reject(err);
        results.push(row);
      }, (callbackError, count) => {
        if (callbackError) return reject(callbackError);
        return resolve({ results, count });
      });
    });
  };
}
