const axios = require("axios");
const xml2js = require("xml2js");
const express = require("express");
const cors = require("cors");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: "*", // Replace with your allowed origin(s)
};

app.use(cors(corsOptions));

const client_id = process.env.DB_CLIENT_ID;
const secret = process.env.DB_SECRET;
const customHeaders = {
  "DB-Client-Id": client_id,
  "DB-Api-Key": secret,
};

app.get("/", (req, res) => {
  res.send("ready");
});

app.get("/station/eva/:station", async (req, res) => {
  const station = req.params.station;
  const eva = await getStationEva(station);
  res.send(eva);
});

app.get("/station/:eva/trains/:day/:hour", async (req, res) => {
  console.log("eva", req.params.eva);
  console.log("day", req.params.day);
  console.log("hour", req.params.hour);
  const eva = req.params.eva;
  const day = req.params.day;
  const hour = req.params.hour;
  const timetable = await getStationTimetable(eva, day, hour);
  res.send(timetable);
});

app.get("/station/:eva/train/:trainId/planned/:day/:hour", async (req, res) => {
  const eva = req.params.eva;
  const day = req.params.day;
  const hour = req.params.hour;
  const trainId = req.params.trainId;
  const timetable = await getStationTimetable(eva, day, hour);
  const train = timetable.filter((train) => train.id === trainId);
  res.send(train);
});

app.get("/station/:eva/train/:trainId/changes/recent", async (req, res) => {
  const eva = req.params.eva;
  const trainId = req.params.trainId;
  const changes = await getChanges(eva, trainId, false);
  res.send(changes);
});

app.get("/station/:eva/train/:trainId/changes/full", async (req, res) => {
  const eva = req.params.eva;
  const trainId = req.params.trainId;
  const changes = await getChanges(eva, trainId, true);
  res.send(changes);
});

app.listen(port, () => {
  console.log("server is running on port " + port);
});

async function getStationEva(name) {
  const apiUrl =
    "https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1/station/";

  try {
    const response = await axios.get(apiUrl + name, {
      headers: customHeaders,
    });

    const xmlData = response.data;
    const parser = xml2js.Parser();

    return new Promise((resolve, reject) => {
      parser.parseString(xmlData, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const stations = result.stations.station;

          if (stations && stations.length > 0) {
            const station = stations[0]["$"];
            const eva = station.eva;
            if (!eva) {
              reject(eva);
            } else {
              resolve(eva);
            }
          } else {
            resolve("");
          }
        }
      });
    });
  } catch (err) {
    throw err;
  }
}

function dateStringToDate(dateString) {
  // Extract date and time components
  const year = parseInt(dateString.substr(0, 2), 10) + 2000;
  const month = parseInt(dateString.substr(2, 2), 10);
  const day = parseInt(dateString.substr(4, 2), 10);
  const hour = parseInt(dateString.substr(6, 2), 10);
  const minute = parseInt(dateString.substr(8, 2), 10);

  // Create a JavaScript Date object
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

async function getStationTimetable(eva, day, hour) {
  const apiUrl =
    "https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1/plan/";

  try {
    const response = await axios.get(apiUrl + eva + "/" + day + "/" + hour, {
      headers: customHeaders,
    });

    const xmlData = response.data;
    const parser = xml2js.Parser();

    return new Promise((resolve, reject) => {
      parser.parseString(xmlData, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const timetable = result.timetable.s.map((train) => {
            const arriving = train.ar.map((ar) => {
              return {
                id: train.$.id,
                line: ar.$.l,
                path: ar.$.ppth.split("|"),
                platform: ar.$.pp,
                time: dateStringToDate(ar.$.pt),
              };
            });
            return arriving;
          });

          flattenedTimetable = [].concat(...timetable);
          resolve(flattenedTimetable);
        }
      });
    });
  } catch (err) {
    throw err;
  }
}

async function getChanges(eva, trainId, fullChanges) {
  let apiUrl;

  if (fullChanges) {
    apiUrl =
      "https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1/fchg/";
  } else {
    apiUrl =
      "https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1/rchg/";
  }

  try {
    const result = await axios.get(apiUrl + eva, {
      headers: customHeaders,
    });

    const xmlData = result.data;
    const parser = xml2js.Parser();

    return new Promise((resolve, reject) => {
      parser.parseString(xmlData, (err, result) => {
        if (err) {
          reject(err);
        } else {
          if (result.timetable.s) {
            const changes = result.timetable.s
              .map((change) => {
                return {
                  id: change.$.id,
                  arriving: {
                    line: change.ar[0].$.l,
                    changedTime: change.ar[0].$.ct,
                    changedPlatform: change.ar[0].$.cp,
                  },
                };
              })
              .filter((change) => change.id === trainId);

            resolve(changes);
          } else {
            reject("no changes");
          }
        }
      });
    });
  } catch (err) {
    throw err;
  }
}
