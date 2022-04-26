import Sinon from 'sinon';
import sqliteBase, { Database, Statement } from 'sqlite3'
import buildSchemas from '../schemas';
import assert from 'assert'
import { Query } from '../infrastructure/db/Query';

const sqlite3 = sqliteBase.verbose()
const db = new sqlite3.Database(':memory:');
const dbEach = db.each
describe("Checking DB infrastructure", () => {
  describe("Find query or select", () => {
    beforeEach((done) => {
      db.serialize(() => {
        buildSchemas(db);
        db.each = dbEach
        done()
      });
    })
  
    afterEach((done) => {
      return db.run("DROP TABLE Rides", done)
    })

    it("Mock if DB rejected", async (data: Mocha.Done) => {
      const each = Sinon.stub(db, "each")
      each.yieldsRight(new Error("this is error callbackError"))
      const sqlQuery = new Query(db)
      assert.rejects(sqlQuery.find("SELECT COUNT(*) FROM Rides"), "")
      data()
    })

    it("Mock if DB rejected in callback", async (data: Mocha.Done) => {
      const each = Sinon.stub(db, "each")
      each.callsFake((_sql, _paramsÎ, callback) => {
        return callback(new Error("error each"), null);
      })
      const sqlQuery = new Query(db)
      assert.rejects(sqlQuery.find("SELECT COUNT(*) FROM Rides"), "")
      data()
    })

    it("DB return result", (data: Mocha.Done) => {
      const values = [
        80,
        80,
        70,
        85,
        "Barnando",
        "Josh",
        "car"
      ];

      db.run("INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)", values, async () => {
        const sqlQuery = new Query(db)
        const result = await sqlQuery.find("SELECT COUNT(*) FROM Rides")
        const keys = Object.keys(result.results[0])
        assert.equal(keys[0], 'COUNT(*)')
        data()
      })
    })
  })

})