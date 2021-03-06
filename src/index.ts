import sqlite3 from 'sqlite3'
import buildSchemas from './schemas';
import buildAppWithDb from './app';
import log from './utils/libs/log'

const sqlite = sqlite3.verbose()
const db = new sqlite.Database(':memory:');

const port = 8010;
db.serialize(() => {
  buildSchemas(db);
  const app = buildAppWithDb(db);

  app.listen(port, () => {
    const message = `App started and listening on port ${port}`
    log.info(message)
    console.log(message)
  });
});


