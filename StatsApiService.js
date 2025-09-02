// Stats API Service - JavaScript Version
// This service fetches match stats, shots, fouls, saves, incidents, and summary from SofaScore API.

class StatsApiService {
  constructor() {
    this.baseUrl = "https://www.sofascore.com/api/v1/event";
  }

  async getShots(matchId) {
    if (!matchId) return [];
    const shotsUrl = `${this.baseUrl}/${matchId}/shotmap`;

    try {
      const response = await fetch(shotsUrl);
      const jsonString = await response.text();
      const jsonObject = JSON.parse(jsonString || '{}');
      const shotArray = jsonObject.shotmap || [];
      const playerStats = await this.getPlayerStats(matchId);
      const playersWithAssists = playerStats.filter(p => p.goalAssist > 0);

      return shotArray.map(shot => {
        const playerInfo = shot.player || {};
        const player = {
          userCount: playerInfo.userCount || 0,
          name: playerInfo.name || "",
          jerseyNumber: shot.jerseyNumber || "",
          position: playerInfo.position || "",
          id: playerInfo.id || 0,
          shortName: playerInfo.shortName || "",
          slug: playerInfo.slug || ""
        };
        const isHome = shot.isHome || false;
        const isGoal = shot.shotType === "goal";
        let hasAssist = false, assistPlayer = null, assistDescription = null;
        if (isGoal && playersWithAssists.length) {
          const teamAssists = playersWithAssists.filter(a => a.teamFromLineup === (isHome ? "home" : "away"));
          if (teamAssists.length) {
            assistPlayer = teamAssists[0].player;
            hasAssist = true;
            assistDescription = `Asistencia de ${assistPlayer.name}`;
          }
        }
        return {
          player,
          time: shot.time || 0,
          teamId: shot.teamId || 0,
          isHome,
          shotType: shot.shotType || "",
          situation: shot.situation || "",
          bodyPart: shot.bodyPart || "",
          goalType: isGoal ? shot.goalType : null,
          xg: shot.xg || 0.0,
          x: shot.x || 0.0,
          y: shot.y || 0.0,
          hasAssist,
          assistPlayer,
          assistDescription
        };
      }).sort((a, b) => b.time - a.time);
    } catch (e) {
      throw new Error(`Error fetching shots: ${e.message}`);
    }
  }

  async getPlayerStats(matchId) {
    const url = `${this.baseUrl}/${matchId}/lineups`;
    try {
      const response = await fetch(url);
      const jsonString = await response.text();
      const jsonObject = JSON.parse(jsonString || '{}');
      const playersStats = [];
      ["home", "away"].forEach(team => {
        const teamObject = jsonObject[team];
        if (teamObject && Array.isArray(teamObject.players)) {
          teamObject.players.forEach(playerObject => {
            const playerInfo = playerObject.player || {};
            const stats = playerObject.statistics || {};
            const player = {
              userCount: playerInfo.userCount || 0,
              name: playerInfo.name || "",
              jerseyNumber: playerObject.jerseyNumber || "",
              position: playerObject.position || "",
              id: playerInfo.id || 0,
              shortName: playerInfo.shortName || "",
              slug: playerInfo.slug || ""
            };
            playersStats.push({
              player,
              fouls: stats.fouls || 0,
              totalPass: stats.totalPass || 0,
              accuratePass: stats.accuratePass || 0,
              minutesPlayed: stats.minutesPlayed || 0,
              rating: stats.rating || null,
              teamId: playerObject.teamId || 0,
              position: playerObject.position || "",
              totalLongBalls: stats.totalLongBalls || 0,
              accurateLongBalls: stats.accurateLongBalls || 0,
              goalAssist: stats.goalAssist || 0,
              totalCross: stats.totalCross || 0,
              aerialLost: stats.aerialLost || 0,
              aerialWon: stats.aerialWon || 0,
              duelLost: stats.duelLost || 0,
              duelWon: stats.duelWon || 0,
              challengeLost: stats.challengeLost || 0,
              dispossessed: stats.dispossessed || 0,
              bigChanceMissed: stats.bigChanceMissed || 0,
              onTargetScoringAttempt: stats.onTargetScoringAttempt || 0,
              blockedScoringAttempt: stats.blockedScoringAttempt || 0,
              totalClearance: stats.totalClearance || 0,
              totalTackle: stats.totalTackle || 0,
              touches: stats.touches || 0,
              possessionLostCtrl: stats.possessionLostCtrl || 0,
              keyPass: stats.keyPass || 0,
              teamFromLineup: team,
              saves: stats.saves || 0,
              savedShotsFromInsideTheBox: stats.savedShotsFromInsideTheBox || 0,
              goodHighClaim: stats.goodHighClaim || 0,
              totalKeeperSweeper: stats.totalKeeperSweeper || 0,
              accurateKeeperSweeper: stats.accurateKeeperSweeper || 0
            });
          });
        }
      });
      return playersStats;
    } catch (e) {
      throw new Error(`Error fetching player stats: ${e.message}`);
    }
  }

  async getPlayerTeamMap(matchId) {
    const playerTeamMap = {};
    try {
      const shots = await this.getShots(matchId);
      shots.forEach(shot => {
        const team = shot.isHome ? "home" : "away";
        playerTeamMap[shot.player.id] = team;
      });
      const stats = await this.getPlayerStats(matchId);
      stats.forEach(playerStat => {
        if (!playerTeamMap[playerStat.player.id]) {
          playerTeamMap[playerStat.player.id] = playerStat.teamFromLineup;
        }
      });
    } catch (e) {
      // Silent error for fallback
    }
    return playerTeamMap;
  }

  async getPlayerFoulsFromStats(matchId) {
    try {
      const currentStats = await this.getPlayerStats(matchId);
      const playerFouls = [];
      const playerTeamMap = await this.getPlayerTeamMap(matchId);

      currentStats.forEach(playerStat => {
        for (let foulIndex = 0; foulIndex < playerStat.fouls; foulIndex++) {
          let estimatedMinute;
          if (playerStat.fouls === 1) {
            estimatedMinute = Math.floor(playerStat.minutesPlayed / 2);
          } else {
            const interval = playerStat.minutesPlayed / playerStat.fouls;
            estimatedMinute = Math.floor((foulIndex + 1) * interval);
          }
          const team = playerTeamMap[playerStat.player.id] || "unknown";
          if (team !== "unknown") {
            playerFouls.push({
              playerId: playerStat.player.id,
              playerName: playerStat.player.name,
              shirtNumber: parseInt(playerStat.player.jerseyNumber) || 0,
              team,
              time: estimatedMinute,
              timeSeconds: estimatedMinute * 60,
              foulType: "Falta",
              description: `Falta de ${playerStat.player.name}`,
              incidentId: `${playerStat.player.id}_foul_${foulIndex + 1}`
            });
          }
        }
      });
      return playerFouls.sort((a, b) => b.timeSeconds - a.timeSeconds);
    } catch (e) {
      throw new Error(`Error generating fouls from stats: ${e.message}`);
    }
  }

  async getMatchIncidents(matchId) {
    try {
      const url = `${this.baseUrl}/${matchId}/incidents`;
      const response = await fetch(url);
      const jsonString = await response.text();
      const jsonObject = JSON.parse(jsonString || '{"incidents":[]}');
      return jsonObject.incidents || [];
    } catch (e) {
      throw new Error(`Error fetching match incidents: ${e.message}`);
    }
  }

  async getPlayerFouls(matchId) {
    try {
      const playerFouls = [];
      const incidents = await this.getMatchIncidents(matchId);
      const cardIncidents = incidents.filter(i => i.incidentType === "card" && i.player);
      const statsBasedFouls = await this.getPlayerFoulsFromStats(matchId);
      const playerTeamMap = await this.getPlayerTeamMap(matchId);

      const playerYellowCards = {};
      const processedFouls = new Set();

      for (const incident of cardIncidents) {
        const player = incident.player;
        const currentYellowCards = playerYellowCards[player.id] || 0;
        let cardType, isSecondYellow;
        switch (incident.cardType) {
          case "yellow":
            playerYellowCards[player.id] = currentYellowCards + 1;
            cardType = "Tarjeta amarilla"; isSecondYellow = false; break;
          case "red":
            cardType = "Tarjeta roja"; isSecondYellow = false; break;
          case "yellowRed":
            cardType = "Tarjeta roja (doble amarilla)"; isSecondYellow = true; break;
          default:
            cardType = "Tarjeta amarilla"; isSecondYellow = false;
        }
        const team = incident.teamSide || playerTeamMap[player.id] || "unknown";
        if (team !== "unknown") {
          const nearbyFoul = statsBasedFouls.find(foul =>
            foul.playerId === player.id &&
            Math.abs(foul.time - incident.time) <= 2 &&
            !processedFouls.has(foul.incidentId)
          );
          if (nearbyFoul) {
            let combinedType;
            if (isSecondYellow) combinedType = "Falta + Tarjeta roja (doble amarilla)";
            else if (cardType.includes("roja")) combinedType = "Falta + Tarjeta roja";
            else combinedType = `Falta + ${cardType}`;
            playerFouls.push({
              playerId: player.id,
              playerName: player.name,
              shirtNumber: parseInt(player.jerseyNumber) || 0,
              team,
              time: incident.time,
              timeSeconds: incident.time * 60,
              foulType: combinedType,
              description: `Falta de ${player.name} - ${cardType}`,
              incidentId: incident.id
            });
            processedFouls.add(nearbyFoul.incidentId);
          } else {
            let cardOnlyType = isSecondYellow ? "Tarjeta roja (doble amarilla)" : cardType;
            playerFouls.push({
              playerId: player.id,
              playerName: player.name,
              shirtNumber: parseInt(player.jerseyNumber) || 0,
              team,
              time: incident.time,
              timeSeconds: incident.time * 60,
              foulType: cardOnlyType,
              description: `${cardType} para ${player.name}`,
              incidentId: incident.id
            });
          }
        }
      }

      const remainingFouls = statsBasedFouls.filter(foul => !processedFouls.has(foul.incidentId));
      playerFouls.push(...remainingFouls);

      return playerFouls.sort((a, b) => b.timeSeconds - a.timeSeconds);
    } catch (e) {
      throw new Error(`Error fetching player fouls: ${e.message}`);
    }
  }

  async getPlayerSaves(matchId) {
    try {
      const playerStats = await this.getPlayerStats(matchId);
      const playerTeamMap = await this.getPlayerTeamMap(matchId);
      const playerSaves = [];
      for (const playerStat of playerStats) {
        if (playerStat.position === "G" && playerStat.saves > 0) {
          const team = playerTeamMap[playerStat.player.id] || "unknown";
          if (team !== "unknown") {
            for (let saveIndex = 0; saveIndex < playerStat.saves; saveIndex++) {
              let estimatedMinute;
              if (playerStat.saves === 1)
                estimatedMinute = Math.floor(playerStat.minutesPlayed / 2);
              else {
                const interval = playerStat.minutesPlayed / playerStat.saves;
                estimatedMinute = Math.floor((saveIndex + 1) * interval);
              }
              playerSaves.push({
                playerId: playerStat.player.id,
                playerName: playerStat.player.name,
                shirtNumber: parseInt(playerStat.player.jerseyNumber) || 1,
                team,
                time: estimatedMinute,
                timeSeconds: estimatedMinute * 60,
                saveType: "Parada",
                description: `Parada de ${playerStat.player.name}`,
                shotBlocked: true
              });
            }
          }
        }
      }
      return playerSaves.sort((a, b) => b.timeSeconds - a.timeSeconds);
    } catch (e) {
      throw new Error(`Error fetching player saves: ${e.message}`);
    }
  }

  async getMatchSummary(matchId) {
    try {
      const shots = await this.getShots(matchId);
      const fouls = await this.getPlayerFouls(matchId);
      const saves = await this.getPlayerSaves(matchId);
      return {
        shots,
        fouls,
        saves
      };
    } catch (e) {
      throw new Error(`Error fetching match summary: ${e.message}`);
    }
  }
}

export default StatsApiService;