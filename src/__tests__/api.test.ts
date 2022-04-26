'use strict';
import request from 'supertest'
import sqliteBase from 'sqlite3'
import buildAppWithDb from '../app'
import buildSchemas from '../schemas'
import assert from 'assert'
import { StatusCodes } from 'http-status-codes';
import Sinon from 'sinon';

const sqlite3 = sqliteBase.verbose()
const db = new sqlite3.Database(':memory:');

const app = buildAppWithDb(db)
const dbAll = db.all

const fakeData = [
    [80, 80, 70, 85, "Barnando", "Josh", "car"],
    [80, 80, 70, 85, "Barnando", "Josh", "car"],
    [80, 80, 70, 85, "Barnando", "Josh", "car"],
    [80, 80, 70, 85, "Barnando", "Josh", "car"],
]

let fakeDataPlaceholder = fakeData.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(', ');
let flatData = [];
let fakeBulkQuery = "INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES " + fakeDataPlaceholder;
fakeData.forEach((arr) => { arr.forEach((item) => { flatData.push(item) }) });

describe('API tests', () => {
    describe('GET /health', () => {
        it('should return health', (done) => {
            request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(StatusCodes.OK, done);
        });
    });

    describe("Rides API test", () => {
        let isDBDeleted = true;
        const mockRequestBody = {
            "start_lat": 80,
            "start_long": 80,
            "end_lat": 70,
            "end_long": 85,
            "rider_name": "Barnando",
            "driver_name": "Josh",
            "driver_vehicle": "car"
        };

        describe("GET /rides", () => {
            beforeEach((done) => {
                db.serialize(() => {
                    buildSchemas(db);
                    isDBDeleted = false
                    done()
                });
            });

            afterEach((done) => {
                if (isDBDeleted) {
                    return done()
                }
                return db.run("DROP TABLE Rides", done)
            })

            it("should return SERVER_ERROR before initialize DB", (done) => {
                isDBDeleted = true
                db.run("DROP TABLE Rides", () => {
                    request(app)
                        .get('/rides')
                        .expect('Content-Type', /json/)
                        .expect(response => {
                            assert.equal(response.body.error_code, "SERVER_ERROR")
                            assert.equal(response.status, StatusCodes.INTERNAL_SERVER_ERROR)
                        })
                        .end(done)
                })
            })


            it("should return RIDES_NOT_FOUND_ERROR before adding new rides", (done) => {
                db.run("DELETE FROM Rides", () => {
                    request(app)
                        .get('/rides')
                        .query({ limit: 10, page: 1 })
                        .expect('Content-Type', /json/)
                        .expect(response => {
                            assert.equal(response.status, StatusCodes.NOT_FOUND)
                            assert.equal(response.body.error_code, "RIDES_NOT_FOUND_ERROR")
                        })
                        .end(done)
                })
            })

            it("invalid limit,should return VALIDATION_ERROR", done => {   
                db.run("INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)", fakeData[0], () => {
                    request(app)
                        .get('/rides')
                        .query({ limit: -1 })
                        .expect('Content-Type', /json/)
                        .expect(response => {
                            assert.equal(response.status, StatusCodes.BAD_REQUEST)
                            assert.equal(response.body.error_code, "VALIDATION_ERROR")
                        })
                        .end(done)
                })
            })

            it("invalid page, should return VALIDATION_ERROR ", done => {   
                db.run("INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)", fakeData[0], () => {
                    request(app)
                        .get('/rides')
                        .query({ page: -1 })
                        .expect('Content-Type', /json/)
                        .expect(response => {
                            assert.equal(response.status, StatusCodes.BAD_REQUEST)
                            assert.equal(response.body.error_code, "VALIDATION_ERROR")
                        })
                        .end(done)
                })
            })

            it("should return all Rides ", done => {   
                db.run("INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)", fakeData[0], () => {
                    request(app)
                        .get('/rides')
                        .query({ limit: 1, page: 1 })
                        .expect('Content-Type', /json/)
                        .expect(response => {
                            assert.equal(response.status, StatusCodes.OK)
                        })
                        .end(done)
                })
            })

        })

        describe("GET /rides/:rideID", () => {
            beforeEach((done) => {
                db.serialize(() => {
                    buildSchemas(db);
                    isDBDeleted = false
                    db.all = dbAll
                    done()
                });
            });
            afterEach((done) => {
                if (isDBDeleted) {
                    return done()
                }
                return db.run("DROP TABLE Rides", done)
            })

            it("should return SERVER_ERROR before initialize DB", (done) => {
                isDBDeleted = true
                db.run("DROP TABLE Rides", () => {
                    request(app)
                        .get('/rides/1')
                        .expect('Content-Type', /json/)
                        .expect(response => {
                            assert.equal(response.body.error_code, "SERVER_ERROR")
                            assert.equal(response.status, StatusCodes.INTERNAL_SERVER_ERROR)
                        })
                        .end(done)
                })
            })

            it("should return RIDES_NOT_FOUND_ERROR before adding new rides", (done) => {
                db.run("DELETE FROM Rides", () => {
                    request(app)
                        .get('/rides/1')
                        .expect('Content-Type', /json/)
                        .expect(response => {
                            assert.equal(response.status, StatusCodes.NOT_FOUND)
                            assert.equal(response.body.error_code, "RIDES_NOT_FOUND_ERROR")
                        })
                        .end(done)
                })
            })

            it("should return Rides ", done => {
                const values = [
                    80,
                    80,
                    70,
                    85,
                    "Barnando",
                    "Josh",
                    "car"
                ];

                db.run("INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)", values, () => {
                    request(app)
                        .get('/rides/1')
                        .expect('Content-Type', /json/)
                        .expect(response => {
                            assert.equal(response.status, StatusCodes.OK)
                        }).end(done)
                })
            })
        })



        describe("POST /rides", () => {

            beforeEach((done) => {
                db.serialize(() => {
                    buildSchemas(db);
                    isDBDeleted = false
                    db.all = dbAll
                    done()
                });
            });

            afterEach((done) => {
                if (isDBDeleted) {
                    return done()
                }
                db.all = dbAll
                return db.run("DROP TABLE Rides", done)
            })

            it("start latitude are not valid", (done) => {
                request(app)
                    .post("/rides")
                    .send({ ...mockRequestBody, start_lat: 91 })
                    .expect(response => {
                        assert.equal(response.status, StatusCodes.BAD_REQUEST)
                        assert.equal(response.body.error_code, "VALIDATION_ERROR")
                        assert.equal(response.body.message, "Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively")
                    })
                    .end(done)
            })

            it("start longitude are not valid", (done) => {
                request(app)
                    .post("/rides")
                    .send({ ...mockRequestBody, start_long: 181 })
                    .expect(response => {
                        assert.equal(response.status, StatusCodes.BAD_REQUEST)
                        assert.equal(response.body.error_code, "VALIDATION_ERROR")
                        assert.equal(response.body.message, "Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively")
                    })
                    .end(done)
            })

            it("end latitude are not valid", (done) => {
                request(app)
                    .post("/rides")
                    .send({ ...mockRequestBody, end_lat: 91 })
                    .expect(response => {
                        assert.equal(response.status, StatusCodes.BAD_REQUEST)
                        assert.equal(response.body.error_code, "VALIDATION_ERROR")
                        assert.equal(response.body.message, "End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively")
                    })
                    .end(done)
            })

            it("end longitude are not valid", (done) => {
                request(app)
                    .post("/rides")
                    .send({ ...mockRequestBody, end_long: 181 })
                    .expect(response => {
                        assert.equal(response.status, StatusCodes.BAD_REQUEST)
                        assert.equal(response.body.error_code, "VALIDATION_ERROR")
                        assert.equal(response.body.message, "End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively")
                    })
                    .end(done)
            })

            it("rider name are not valid", (done) => {
                request(app)
                    .post("/rides")
                    .send({ ...mockRequestBody, rider_name: "" })
                    .expect(response => {
                        assert.equal(response.status, StatusCodes.BAD_REQUEST)
                        assert.equal(response.body.error_code, "VALIDATION_ERROR")
                        assert.equal(response.body.message, "Rider name must be a non empty string")
                    })
                    .end(done)
            })

            it("driver name are not valid", (done) => {
                request(app)
                    .post("/rides")
                    .send({ ...mockRequestBody, driver_name: "" })
                    .expect('Content-Type', /json/)
                    .expect(response => {
                        assert.equal(response.status, StatusCodes.BAD_REQUEST)
                        assert.equal(response.body.error_code, "VALIDATION_ERROR")
                        assert.equal(response.body.message, "Rider name must be a non empty string")
                    })
                    .end(done)
            })

            it("driver vehicle are not valid", (done) => {
                request(app)
                    .post("/rides")
                    .send({ ...mockRequestBody, driver_vehicle: "" })
                    .expect('Content-Type', /json/)
                    .expect(response => {
                        assert.equal(response.status, StatusCodes.BAD_REQUEST)
                        assert.equal(response.body.error_code, "VALIDATION_ERROR")
                        assert.equal(response.body.message, "Rider name must be a non empty string")
                    })
                    .end(done)
            })

            it("should return SERVER_ERROR, because there is no DB", (done) => {
                isDBDeleted = true
                db.run("DROP TABLE Rides", () => {
                    request(app)
                        .post("/rides")
                        .send(mockRequestBody)
                        .expect('Content-Type', /json/)
                        .expect(response => {
                            assert.equal(response.body.error_code, "SERVER_ERROR")
                            assert.equal(response.status, StatusCodes.INTERNAL_SERVER_ERROR)
                        })
                        .end(done)
                })
            })

            it("should return SERVER_ERROR", (done) => {
                const all = Sinon.stub(db, 'all');
                all.yieldsRight(new Error());

                request(app)
                    .post("/rides")
                    .send(mockRequestBody)
                    .expect('Content-Type', /json/)
                    .expect(response => {
                        assert.equal(response.body.error_code, "SERVER_ERROR")
                        assert.equal(response.status, StatusCodes.INTERNAL_SERVER_ERROR)
                    })
                    .end(done)

            })

            it("should success add new rides", (done) => {
                request(app)
                    .post("/rides")
                    .send(mockRequestBody)
                    .expect('Content-Type', /json/)
                    .expect(response => {
                        assert.equal(response.status, StatusCodes.OK)
                    })
                    .end(done)
            })

        })
    })
});