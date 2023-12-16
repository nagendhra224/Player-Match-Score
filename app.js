const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const app = express();
app.use(express.json());

const databasePath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server is Running"));
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    totalScore: dbObject.totalScore,
    totalFours: dbObject.totalFours,
    totalSixes: dbObject.totalSixes,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersList = `
    select * from player_details;`;
  const playerArray = await db.all(getPlayersList);
  response.send(
    playerArray.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
  select * from player_details
  where player_id=${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  update player_details
  set
  player_name="${playerName}"
  where 
  player_id=${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    select * from 
    match_details
    where 
    match_id=${matchId};`;
  const matchDetails = await db.get(matchDetailsQuery);
  response.send(convertDbObjectToResponseObject(matchDetails));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    select match_id,match,year from 
    player_match_score 
    natural join match_details
    where player_id=${playerId};`;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) => convertDbObjectToResponseObject(eachMatch))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    select player_id,player_name from 
    player_match_score 
    natural join player_details
    where match_id=${matchId};`;
  const playerArray = await db.all(getMatchPlayersQuery);
  response.send(
    playerArray.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
  select player_id as playerId,
  player_name as playerName,
  sum(score) as totalScore,
  sum(fours) as totalFours,
  sum(sixes) as totalSixes
  from player_match_score 
  natural join player_details
  where player_id=${playerId};`;
  const playerMatchDetails = await db.get(getPlayerQuery);
  response.send(playerMatchDetails);
});
module.exports = app;
