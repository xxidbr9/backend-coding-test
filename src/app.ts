import express from "express";
import bodyParser from "body-parser";
import { Database } from "sqlite3";
import { StatusCodes } from "http-status-codes";
import log from "./utils/libs/log";
import validator from 'validator'

import respOk from './infrastructure/transport/http/respOk'
import { Query } from "./infrastructure/db/Query";

const app = express();
const jsonParser = bodyParser.json();

const buildAppWithDb = (db: Database) => {
  const sqlQuery = new Query(db)

  app.get("/health", (req, res) => res.send("Healthy"));

  app.get("/rides", (req, res) => {

    let page = Number(req.query.page)
    let limit = Number(req.query.limit)

    if (limit && !validator.isInt(limit.toString(), { min: 1 })) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error_code: "VALIDATION_ERROR",
        message: 'limit need to be a number greater than 1',
      });
    }

    if (page && !validator.isInt(page.toString(), { min: 0 })) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error_code: "VALIDATION_ERROR",
        message: 'limit need to be a number greater than 0',
      });
    }

    const offset = ((page - 1) * limit)

    db.all(`SELECT * FROM Rides LIMIT ? OFFSET ?`, [limit, offset], async (err, rows) => {
      if (err) {
        log.error(err)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          error_code: "SERVER_ERROR",
          message: "Unknown error",
        });
      }

      if (rows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error_code: "RIDES_NOT_FOUND_ERROR",
          message: "Could not find any rides",
        });
      }

      const result = await sqlQuery.find("SELECT COUNT(*) FROM Rides")
      const total = result.results[0]['COUNT(*)']
      const resp = {
        total,
        has_next: (page * limit) < total,
        rides: rows
      }

      res.status(StatusCodes.OK).json(respOk("success", resp));
    });
  });

  app.get("/rides/:id", (req, res) => {
    db.all(
      `SELECT * FROM Rides WHERE rideID='${req.params.id}'`,
      (err, rows) => {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error_code: "SERVER_ERROR",
            message: "Unknown error",
          });
        }

        if (rows.length === 0) {
          return res.status(StatusCodes.NOT_FOUND).json({
            error_code: "RIDES_NOT_FOUND_ERROR",
            message: "Could not find any rides",
          });
        }

        res.status(StatusCodes.OK).json(rows);
      }
    );
  });

  app.post("/rides", jsonParser, (req, res) => {
    const startLatitude = Number(req.body.start_lat);
    const startLongitude = Number(req.body.start_long);
    const endLatitude = Number(req.body.end_lat);
    const endLongitude = Number(req.body.end_long);
    const riderName = req.body.rider_name;
    const driverName = req.body.driver_name;
    const driverVehicle = req.body.driver_vehicle;

    const isStartValid =
      startLatitude < -90 ||
      startLatitude > 90 ||
      startLongitude < -180 ||
      startLongitude > 180;
    if (isStartValid) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error_code: "VALIDATION_ERROR",
        message:
          "Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively",
      });
    }

    if (
      endLatitude < -90 ||
      endLatitude > 90 ||
      endLongitude < -180 ||
      endLongitude > 180
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error_code: "VALIDATION_ERROR",
        message:
          "End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively",
      });
    }

    if (typeof riderName !== "string" || riderName.length < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error_code: "VALIDATION_ERROR",
        message: "Rider name must be a non empty string",
      });
    }

    if (typeof driverName !== "string" || driverName.length < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error_code: "VALIDATION_ERROR",
        message: "Rider name must be a non empty string",
      });
    }

    if (typeof driverVehicle !== "string" || driverVehicle.length < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error_code: "VALIDATION_ERROR",
        message: "Rider name must be a non empty string",
      });
    }

    const values = [
      req.body.start_lat,
      req.body.start_long,
      req.body.end_lat,
      req.body.end_long,
      req.body.rider_name,
      req.body.driver_name,
      req.body.driver_vehicle,
    ];

    db.run(
      "INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)",
      values,
      function (err: any) {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error_code: "SERVER_ERROR",
            message: "Unknown error",
          });
        }

        db.all(
          "SELECT * FROM Rides WHERE rideID = ?",
          this.lastID,
          (errSelect, rows) => {
            if (errSelect) {
              return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error_code: "SERVER_ERROR",
                message: "Unknown error",
              });
            }

            res.status(StatusCodes.OK).json(rows);
          }
        );
      }
    );
  });

  return app;
};

export default buildAppWithDb;
