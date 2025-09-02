// ==============================================
// TOURNAMENT API SERVICE
// ==============================================

document.getElementById('clear-cache-btn').addEventListener('click', () => {
  if (confirm('¿Estás seguro de que deseas limpiar la caché de torneos? Esto recargará todos los datos desde la API.')) {
    // Eliminar datos de caché
    localStorage.removeItem('cachedTournaments');
    localStorage.removeItem('cachedTournamentsTimestamp');
    
    // Mensaje de confirmación
    alert('Caché limpiada correctamente. La página se recargará para aplicar los cambios.');
    
    // Recargar la página para obtener datos frescos
    window.location.reload();
  }
});

function TournamentApiService() {
  this.baseUrl = "https://www.sofascore.com/api/v1/search/suggestions/unique-tournaments?sport=football";
}

TournamentApiService.prototype.getAllTournaments = async function() {
  try {
    console.log("Realizando solicitud a:", this.baseUrl);
    
    const response = await fetch(this.baseUrl);
    console.log("Estado de respuesta:", response.status);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const jsonString = await response.text();
    console.log("Longitud de respuesta:", jsonString.length);
    
    const jsonObject = JSON.parse(jsonString || '{"results":[]}');
    const results = jsonObject.results || [];
    console.log(`Recibidos ${results.length} resultados de la API`);

    console.log('results:', results);
    // Procesar según la estructura correcta
    const mappedResults = results.map(item => {
      // Los datos del torneo están en el objeto 'entity'
      if (item.entity && item.entity.name) {
        return {
          id: item.entity.id || `t-${Math.random().toString(36).substring(2, 8)}`,
          name: item.entity.name,
          slug: item.entity.slug || "",
          country: item.entity.category?.country?.name || "",
          countryCode: item.entity.category?.country?.alpha2 || "",
          primaryColor: item.entity.primaryColorHex || "#cccccc",
          secondaryColor: item.entity.secondaryColorHex || "#333333"
        };
      }
      return null;
    }).filter(Boolean); // Eliminar entradas nulas
    
    console.log(`Procesados ${mappedResults.length} torneos correctamente`);
    
    // Si no pudimos procesar ningún torneo, usar lista de respaldo
    if (mappedResults.length === 0) {
      console.warn("No se pudo procesar ningún torneo, usando lista de respaldo");
      return this.getBackupTournaments();
    }
    
    return mappedResults;
    
  } catch (e) {
    console.error("Error en API de torneos:", e);
    return this.getBackupTournaments();
  }
};

// Método para proporcionar torneos de respaldo
TournamentApiService.prototype.getBackupTournaments = function() {
  // Torneos populares como respaldo, incluyendo tus favoritos
  return [
    { id: "8", name: "LaLiga", slug: "laliga", country: "Spain", countryCode: "ES" },
    { id: "17", name: "Premier League", slug: "premier-league", country: "England", countryCode: "EN" },
    { id: "23", name: "Serie A", slug: "serie-a", country: "Italy", countryCode: "IT" },
    { id: "35", name: "Bundesliga", slug: "bundesliga", country: "Germany", countryCode: "DE" },
    { id: "34", name: "Ligue 1", slug: "ligue-1", country: "France", countryCode: "FR" },
    { id: "7", name: "Champions League", slug: "champions-league", country: "Europe", countryCode: "EU" },
    { id: "679", name: "LaLiga 2", slug: "laliga-2", country: "Spain", countryCode: "ES" },
    { id: "2955", name: "LigaPro Serie A, Primera Etapa", slug: "ligapro", country: "Ecuador", countryCode: "EC" }
  ];
};
// Método para proporcionar torneos de respaldo
TournamentApiService.prototype.getBackupTournaments = function() {
  // Torneos populares como respaldo
  return [
    { id: "8", name: "LaLiga", slug: "laliga" },
    { id: "17", name: "Premier League", slug: "premier-league" },
    { id: "23", name: "Serie A", slug: "serie-a" },
    { id: "35", name: "Bundesliga", slug: "bundesliga" },
    { id: "34", name: "Ligue 1", slug: "ligue-1" },
    { id: "7", name: "Champions League", slug: "champions-league" },
    { id: "679", name: "LaLiga 2", slug: "laliga-2" },
    { id: "2955", name: "LigaPro Serie A, Primera Etapa", slug: "ligapro" }
  ];
};


// ==============================================
// MATCH API SERVICE
// ==============================================
function MatchApiService() {
  this.matchesBaseUrl = "https://www.sofascore.com/api/v1/sport/football/scheduled-events";
  this.matchBaseUrl = "https://www.sofascore.com/api/v1/event";

  this.useLocalData = true;
  this.proxyUrl = ""; 
  this.cachedMatches = {};
  this.cachedMatchDetails = {};
}

MatchApiService.prototype.getMatches = async function(date) {
  try {
    const url = `${this.matchesBaseUrl}/${date}`;
    const response = await fetch(url);
    const jsonString = await response.text();
    const jsonObject = JSON.parse(jsonString || '{"events":[]}');
    return jsonObject.events || [];
  } catch (e) {
    throw new Error(`Error fetching matches: ${e.message}`);
  }
};

MatchApiService.prototype.getMatch = async function(matchId) {
  try {
    const url = `${this.matchBaseUrl}/${matchId}`;
    const response = await fetch(url);
    const jsonString = await response.text();
    const jsonObject = JSON.parse(jsonString || '{"event":{}}');
    return jsonObject.event;
  } catch (e) {
    throw new Error(`Error fetching match: ${e.message}`);
  }
};

// ==============================================
// STATS API SERVICE
// ==============================================
function StatsApiService() {
  this.baseUrl = "https://www.sofascore.com/api/v1/event";
}

StatsApiService.prototype.getShots = async function(matchId) {
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
        assistDescription,
        timeSeconds: (shot.time || 0) * 60
      };
    }).sort((a, b) => b.time - a.time);
  } catch (e) {
    throw new Error(`Error fetching shots: ${e.message}`);
  }
};

StatsApiService.prototype.getPlayerStats = async function(matchId) {
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
};

StatsApiService.prototype.getPlayerTeamMap = async function(matchId) {
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
};

StatsApiService.prototype.getPlayerFoulsFromStats = async function(matchId) {
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
};

StatsApiService.prototype.getMatchIncidents = async function(matchId) {
  try {
    const url = `${this.baseUrl}/${matchId}/incidents`;
    const response = await fetch(url);
    const jsonString = await response.text();
    const jsonObject = JSON.parse(jsonString || '{"incidents":[]}');
    return jsonObject.incidents || [];
  } catch (e) {
    throw new Error(`Error fetching match incidents: ${e.message}`);
  }
};

StatsApiService.prototype.getPlayerFouls = async function(matchId) {
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
};

StatsApiService.prototype.getPlayerSaves = async function(matchId) {
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
};

StatsApiService.prototype.getMatchSummary = async function(matchId) {
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
};

// ==============================================
// MAIN APPLICATION
// ==============================================
function FootStatsApp() {
  // Initialize API services
  this.tournamentApi = new TournamentApiService();
  this.matchApi = new MatchApiService();
  this.statsApi = new StatsApiService();

  // App state
  this.currentDate = this.formatDate(new Date());
  this.selectedTournamentId = null;
  this.selectedMatchId = null;
  this.tournaments = [];
  this.matches = [];
  this.currentMatchDetails = null;

  // UI references
  this.tournamentListElement = document.getElementById('tournament-list');
  this.matchesContainerElement = document.getElementById('matches-container');
  this.currentDateElement = document.getElementById('current-date');
  this.matchesView = document.getElementById('matches-view');
  this.matchDetailView = document.getElementById('match-detail-view');

  // Initialize the app
  this.init();
}

FootStatsApp.prototype.init = async function() {
  this.updateDateDisplay();
  this.registerEventListeners();
  
  try {
    // Verificar si hay un ID de partido en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get('matchId');
    
    if (matchId) {
      console.log("Restaurando partido desde URL:", matchId);
      
      // Mostrar un indicador de carga
      this.matchDetailView.innerHTML = `
        <div class="loading-spinner centered-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Cargando detalles del partido...</span>
        </div>
      `;
      
      // Mostrar la vista de detalle mientras carga
      this.showMatchDetailView();
      
      // Usar los métodos existentes de la clase para cargar el partido
      await this.loadMatchDetails(matchId);
    } else {
      // Flujo normal - cargar torneos y partidos
      await this.loadTournaments();
      await this.loadMatches(this.currentDate);
    }
  } catch (error) {
    console.error("Error en la inicialización:", error);
    // Mostrar un mensaje de error y cargar la vista normal como fallback
    this.showErrorMessage("Hubo un problema al cargar los datos. Mostrando partidos del día.");
    await this.loadTournaments();
    await this.loadMatches(this.currentDate);
  }
};

// Añadir método para mostrar errores
FootStatsApp.prototype.showErrorMessage = function(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `
    <i class="fas fa-exclamation-triangle"></i>
    <span>${message}</span>
  `;
  
  // Insertar al principio del contenedor principal
  const container = document.querySelector('#matches-container') || document.body;
  container.insertBefore(errorDiv, container.firstChild);
  
  // Eliminar después de 5 segundos
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
};

FootStatsApp.prototype.cacheTournaments = function(tournaments) {
  if (tournaments && tournaments.length > 0) {
    try {
      localStorage.setItem('cachedTournaments', JSON.stringify(tournaments));
      localStorage.setItem('cachedTournamentsTimestamp', Date.now().toString());
      console.log(`${tournaments.length} torneos guardados en caché`);
    } catch (e) {
      console.error("Error al guardar torneos en caché:", e);
    }
  }
};

FootStatsApp.prototype.registerEventListeners = function() {
  // Date navigation
  document.getElementById('prev-date').addEventListener('click', () => this.changeDate(-1));
  document.getElementById('next-date').addEventListener('click', () => this.changeDate(1));
  
  // Refresh button
  document.getElementById('refresh-btn').addEventListener('click', () => this.refreshData());
  
  // Tournament search
  document.getElementById('tournament-search').addEventListener('input', (e) => this.filterTournaments(e.target.value));
  
  // Match filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => this.filterMatches(e.target.dataset.filter));
  });
  
  // Back button in match details
  document.getElementById('back-to-matches').addEventListener('click', () => this.showMatchesView());
  
  // Tab navigation in match details
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
  });
};

// Date handling
FootStatsApp.prototype.formatDate = function(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

FootStatsApp.prototype.updateDateDisplay = function() {
  const [year, month, day] = this.currentDate.split('-');
  const date = new Date(year, month - 1, day);
  
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  this.currentDateElement.textContent = date.toLocaleDateString('es-ES', options);
};

FootStatsApp.prototype.changeDate = function(days) {
  const [year, month, day] = this.currentDate.split('-');
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  
  this.currentDate = this.formatDate(date);
  this.updateDateDisplay();
  this.loadMatches(this.currentDate);
};

// Data loading
FootStatsApp.prototype.loadTournaments = async function() {
  try {
    this.tournamentListElement.innerHTML = `
      <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Cargando torneos...</span>
      </div>
    `;
    
    // Comprobar primero si hay una caché reciente (menos de 24 horas)
    const cachedTimestamp = parseInt(localStorage.getItem('cachedTournamentsTimestamp') || '0');
    const cachedData = localStorage.getItem('cachedTournaments');
    const now = Date.now();
    const cacheAge = now - cachedTimestamp;
    const useCache = cachedData && cacheAge < 24 * 60 * 60 * 1000; // 24 horas
    if (useCache) {
      console.log("Usando torneos de caché local");
      this.tournaments = JSON.parse(cachedData);
      console.log(`Cargados ${this.tournaments.length} torneos desde caché`);
    } else {
      console.log("Solicitando torneos a la API...");
      this.tournaments = await this.tournamentApi.getAllTournaments();
      console.log(`Obtenidos ${this.tournaments.length} torneos de la API`);
      this.cacheTournaments(this.tournaments);
    }
    
    // Asegurar que siempre tenemos torneos de alguna forma
    if (!this.tournaments || this.tournaments.length === 0) {
      console.warn("No hay torneos disponibles, creando algunos por defecto");
      this.tournaments = [
        { id: "1", name: "LaLiga", slug: "laliga" },
        { id: "2", name: "Premier League", slug: "premier-league" },
        { id: "3", name: "LaLiga 2", slug: "laliga-2" }, // Uno de tus favoritos
        { id: "4", name: "LigaPro Serie A, Primera Etapa", slug: "ligapro" } // Otro favorito
      ];
    }
    
    this.debugFavorites();
    this.renderTournaments(this.tournaments);
    
  } catch (error) {
    console.error('Error detallado al cargar torneos:', error);
    this.tournamentListElement.innerHTML = `
      <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <span>Error al cargar los torneos. Intente nuevamente.</span>
          <button id="retry-load-tournaments" class="retry-btn">Reintentar</button>
      </div>
    `;
    
    document.getElementById('retry-load-tournaments')?.addEventListener('click', () => {
      this.loadTournaments();
    });
  }
};

FootStatsApp.prototype.loadMatches = async function(date) {
  try {
    this.matchesContainerElement.innerHTML = `
      <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Cargando partidos...</span>
      </div>
    `;
    
    this.matches = await this.matchApi.getMatches(date);
    this.renderMatches(this.matches);
  } catch (error) {
    console.error('Error loading matches:', error);
    this.matchesContainerElement.innerHTML = `
      <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <span>Error al cargar los partidos. Intente nuevamente.</span>
      </div>
    `;
  }
};

FootStatsApp.prototype.loadMatchDetails = async function(matchId) {
  try {
    // Get the match details
    const match = await this.matchApi.getMatch(matchId);
    const matchSummary = await this.statsApi.getMatchSummary(matchId);

    this.currentMatchDetails = {
      ...match,
      summary: matchSummary
    };

    // Actualizar la URL con el ID del partido
    const url = new URL(window.location);
    url.searchParams.set('matchId', matchId);
    window.history.replaceState({}, '', url);

    this.renderMatchDetails();
  } catch (error) {
    console.error('Error loading match details:', error);

    // Mostrar mensaje de error al usuario
    this.matchDetailView.innerHTML = `
      <div class="error-message centered-error">
        <i class="fas fa-exclamation-circle"></i>
        <span>Error al cargar los detalles del partido</span>
        <button id="back-to-matches-error" class="btn-secondary">Volver a la lista de partidos</button>
      </div>
    `;
    // Al hacer click, quitar los parámetros de la URL y recargar la página
    document.getElementById('back-to-matches-error')?.addEventListener('click', () => {
      const url = new URL(window.location);
      url.search = '';
      window.history.replaceState({}, '', url);
      window.location.reload();
    });
  }
};

// UI Rendering
FootStatsApp.prototype.renderTournaments = function(tournaments) {
  if (!tournaments || tournaments.length === 0) {
    this.tournamentListElement.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <span>No hay torneos disponibles</span>
      </div>
    `;
    return;
  }

  console.log('Torneos a renderizar:', tournaments);

  // Ordenar torneos: favoritos primero (alfabético), luego resto (alfabético)
  const sortedTournaments = this.getSortedTournaments(tournaments);
  
  let html = '';
  
  sortedTournaments.forEach(tournament => {
    const isFavorite = this.isFavoriteTournament(tournament.name);
    const activeClass = tournament.id === this.selectedTournamentId ? 'active' : '';
    const favoriteClass = isFavorite ? 'favorite' : '';
    
    html += `
      <div class="tournament-item ${activeClass} ${favoriteClass}" data-tournament-id="${tournament.id}">
        <div class="tournament-logo">
          ${tournament.name.substring(0, 1)}
        </div>
        <div class="tournament-name">${tournament.name}</div>
        <div class="tournament-favorite" data-tournament="${tournament.name}">
          <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
        </div>
      </div>
    `;
  });
  
  this.tournamentListElement.innerHTML = html;
  
  // Configurar event listeners
  const app = this;
  
  document.querySelectorAll('.tournament-item').forEach(item => {
    item.addEventListener('click', function(e) {
      // Procesar el clic solo si no fue en el icono de favorito
      if (!e.target.closest('.tournament-favorite')) {
        const tournamentId = this.dataset.tournamentId;
        app.selectTournament(tournamentId);
      }
    });
  });
  
  document.querySelectorAll('.tournament-favorite').forEach(icon => {
    icon.addEventListener('click', function(e) {
      e.stopPropagation();
      
      const tournamentName = this.getAttribute('data-tournament');
      const isFavorite = app.isFavoriteTournament(tournamentName);
      
      if (!isFavorite) {
        app.addFavoriteTournament(tournamentName);
        this.innerHTML = '<i class="fas fa-heart"></i>';
        this.closest('.tournament-item').classList.add('favorite');
      } else {
        app.removeFavoriteTournament(tournamentName);
        this.innerHTML = '<i class="far fa-heart"></i>';
        this.closest('.tournament-item').classList.remove('favorite');
      }
      
      // Re-renderizar para actualizar el orden
      app.renderTournaments(app.tournaments);
    });
  });
};

FootStatsApp.prototype.renderMatches = function(matches) {
  if (!matches || matches.length === 0) {
    this.matchesContainerElement.innerHTML = `
      <div class="empty-state">
          <i class="fas fa-futbol"></i>
          <span>No hay partidos disponibles para esta fecha</span>
      </div>
    `;
    return;
  }

  this.currentMatches = matches;

  // Ordenar todos los partidos por hora de inicio
  const sortedMatches = [...matches].sort((a, b) => {
    return a.startTimestamp - b.startTimestamp;
  });

  // Si torneo está seleccionado, filtrar partidos
  const filteredMatches = this.selectedTournamentId 
      ? sortedMatches.filter(match => match.tournament?.id === this.selectedTournamentId)
      : sortedMatches;

  if (filteredMatches.length === 0) {
    this.matchesContainerElement.innerHTML = `
      <div class="empty-state">
          <i class="fas fa-futbol"></i>
          <span>No hay partidos para el torneo seleccionado</span>
      </div>
    `;
    return;
  }

  // Diccionario de traducciones para torneos y países
  const tournamentTranslations = {
    // Europa
    "Premier League": "Premier League",
    "Championship": "Championship",
    "FA Cup": "Copa FA",
    "Carabao Cup": "Copa de la Liga Inglesa",
    "Community Shield": "Community Shield",

    "LaLiga": "LaLiga",
    "Copa del Rey": "Copa del Rey",
    "Supercopa de España": "Supercopa de España",

    "Serie A": "Serie A",
    "Coppa Italia": "Copa Italia",
    "Supercoppa Italiana": "Supercopa Italiana",

    "Bundesliga": "Bundesliga",
    "2. Bundesliga": "Segunda Bundesliga",
    "DFB Pokal": "Copa Alemana",
    "DFL Supercup": "Supercopa Alemana",

    "Ligue 1": "Ligue 1",
    "Coupe de France": "Copa de Francia",
    "Trophée des Champions": "Supercopa de Francia",

    "Primeira Liga": "Liga Portugal",
    "Taça de Portugal": "Copa de Portugal",
    "Supertaça Cândido de Oliveira": "Supercopa de Portugal",

    "Eredivisie": "Eredivisie",
    "KNVB Beker": "Copa de los Países Bajos",
    "Johan Cruijff Schaal": "Supercopa de los Países Bajos",

    "Belgian Pro League": "Liga Belga",
    "Scottish Premiership": "Liga Escocesa",
    "Turkish Super Lig": "Liga Turca",
    "Greek Super League": "Liga Griega",
    "Russian Premier League": "Liga Rusa",
    "Ukrainian Premier League": "Liga Ucraniana",

    // Competiciones UEFA
    "Champions League": "Liga de Campeones",
    "Europa League": "Europa League",
    "Conference League": "Conference League",
    "UEFA Super Cup": "Supercopa de Europa",
    "Euro Cup": "Eurocopa",
    "Nations League": "Liga de Naciones",

    // América
    "Copa Libertadores": "Copa Libertadores",
    "Copa Sudamericana": "Copa Sudamericana",
    "Recopa Sudamericana": "Recopa Sudamericana",
    "Brasileirão": "Brasileirao",
    "Copa do Brasil": "Copa de Brasil",
    "Supercopa do Brasil": "Supercopa de Brasil",
    "Liga Profesional Argentina": "Liga Argentina",
    "Copa de la Liga Profesional": "Copa de la Liga Argentina",
    "Major League Soccer": "MLS",
    "Leagues Cup": "Leagues Cup",
    "CONCACAF Champions Cup": "Liga de Campeones de la CONCACAF",
    "Gold Cup": "Copa Oro",

    // África
    "CAF Champions League": "Liga de Campeones CAF",
    "CAF Confederation Cup": "Copa Confederación CAF",
    "Africa Cup of Nations": "Copa África",

    // Asia
    "AFC Champions League": "Liga de Campeones AFC",
    "Asian Cup": "Copa de Asia",
    "J1 League": "Liga Japonesa",
    "K League": "Liga Coreana",
    "Chinese Super League": "Liga China",
    "Saudi Pro League": "Liga Saudí",
    "Qatar Stars League": "Liga de Qatar",

    // Internacional
    "World Cup": "Copa del Mundo",
    "Copa América": "Copa América",
    "Olympic Games": "Juegos Olímpicos"
  };

  const countryTranslations = {
    "England": "Inglaterra",
    "Spain": "España",
    "Italy": "Italia",
    "Germany": "Alemania",
    "France": "Francia",
    "Portugal": "Portugal",
    "Netherlands": "Países Bajos",
    "Europe": "Europa",
    "International": "Internacional"
  };

  // Mapeo de países a códigos para banderas
  const countryFlags = {
    // Reino Unido y regiones
    "England": '<img src="https://flagcdn.com/w80/gb-eng.png" alt="Inglaterra" class="flag-icon">',
    "Scotland": '<img src="https://flagcdn.com/w80/gb-sct.png" alt="Escocia" class="flag-icon">',
    "Wales": '<img src="https://flagcdn.com/w80/gb-wls.png" alt="Gales" class="flag-icon">',
    "United Kingdom": '<img src="https://flagcdn.com/w80/gb.png" alt="Reino Unido" class="flag-icon">',
    
    // Europa
    "Spain": '<img src="https://flagcdn.com/w80/es.png" alt="España" class="flag-icon">',
    "Italy": '<img src="https://flagcdn.com/w80/it.png" alt="Italia" class="flag-icon">',
    "Germany": '<img src="https://flagcdn.com/w80/de.png" alt="Alemania" class="flag-icon">',
    "France": '<img src="https://flagcdn.com/w80/fr.png" alt="Francia" class="flag-icon">',
    "Portugal": '<img src="https://flagcdn.com/w80/pt.png" alt="Portugal" class="flag-icon">',
    "Netherlands": '<img src="https://flagcdn.com/w80/nl.png" alt="Países Bajos" class="flag-icon">',
    "Belgium": '<img src="https://flagcdn.com/w80/be.png" alt="Bélgica" class="flag-icon">',
    "Ireland": '<img src="https://flagcdn.com/w80/ie.png" alt="Irlanda" class="flag-icon">',
    "Sweden": '<img src="https://flagcdn.com/w80/se.png" alt="Suecia" class="flag-icon">',
    "Norway": '<img src="https://flagcdn.com/w80/no.png" alt="Noruega" class="flag-icon">',
    "Denmark": '<img src="https://flagcdn.com/w80/dk.png" alt="Dinamarca" class="flag-icon">',
    "Finland": '<img src="https://flagcdn.com/w80/fi.png" alt="Finlandia" class="flag-icon">',
    "Switzerland": '<img src="https://flagcdn.com/w80/ch.png" alt="Suiza" class="flag-icon">',
    "Austria": '<img src="https://flagcdn.com/w80/at.png" alt="Austria" class="flag-icon">',
    "Poland": '<img src="https://flagcdn.com/w80/pl.png" alt="Polonia" class="flag-icon">',
    "Czech Republic": '<img src="https://flagcdn.com/w80/cz.png" alt="República Checa" class="flag-icon">',
    "Croatia": '<img src="https://flagcdn.com/w80/hr.png" alt="Croacia" class="flag-icon">',
    "Serbia": '<img src="https://flagcdn.com/w80/rs.png" alt="Serbia" class="flag-icon">',
    "Greece": '<img src="https://flagcdn.com/w80/gr.png" alt="Grecia" class="flag-icon">',
    "Turkey": '<img src="https://flagcdn.com/w80/tr.png" alt="Turquía" class="flag-icon">',
    "Russia": '<img src="https://flagcdn.com/w80/ru.png" alt="Rusia" class="flag-icon">',
    "Ukraine": '<img src="https://flagcdn.com/w80/ua.png" alt="Ucrania" class="flag-icon">',
    "Romania": '<img src="https://flagcdn.com/w80/ro.png" alt="Rumania" class="flag-icon">',
    "Hungary": '<img src="https://flagcdn.com/w80/hu.png" alt="Hungría" class="flag-icon">',
    "Bulgaria": '<img src="https://flagcdn.com/w80/bg.png" alt="Bulgaria" class="flag-icon">',
    "Slovakia": '<img src="https://flagcdn.com/w80/sk.png" alt="Eslovaquia" class="flag-icon">',
    "Slovenia": '<img src="https://flagcdn.com/w80/si.png" alt="Eslovenia" class="flag-icon">',
    "Bosnia": '<img src="https://flagcdn.com/w80/ba.png" alt="Bosnia" class="flag-icon">',
    "Montenegro": '<img src="https://flagcdn.com/w80/me.png" alt="Montenegro" class="flag-icon">',
    "Albania": '<img src="https://flagcdn.com/w80/al.png" alt="Albania" class="flag-icon">',
    "Moldova": '<img src="https://flagcdn.com/w80/md.png" alt="Moldavia" class="flag-icon">',
    "Georgia": '<img src="https://flagcdn.com/w80/ge.png" alt="Georgia" class="flag-icon">',
    "Armenia": '<img src="https://flagcdn.com/w80/am.png" alt="Armenia" class="flag-icon">',
    "Kazakhstan": '<img src="https://flagcdn.com/w80/kz.png" alt="Kazajistán" class="flag-icon">',
    "Israel": '<img src="https://flagcdn.com/w80/il.png" alt="Israel" class="flag-icon">',

    // América
    "Argentina": '<img src="https://flagcdn.com/w80/ar.png" alt="Argentina" class="flag-icon">',
    "Brazil": '<img src="https://flagcdn.com/w80/br.png" alt="Brasil" class="flag-icon">',
    "Uruguay": '<img src="https://flagcdn.com/w80/uy.png" alt="Uruguay" class="flag-icon">',
    "Chile": '<img src="https://flagcdn.com/w80/cl.png" alt="Chile" class="flag-icon">',
    "Colombia": '<img src="https://flagcdn.com/w80/co.png" alt="Colombia" class="flag-icon">',
    "Paraguay": '<img src="https://flagcdn.com/w80/py.png" alt="Paraguay" class="flag-icon">',
    "Peru": '<img src="https://flagcdn.com/w80/pe.png" alt="Perú" class="flag-icon">',
    "Ecuador": '<img src="https://flagcdn.com/w80/ec.png" alt="Ecuador" class="flag-icon">',
    "Venezuela": '<img src="https://flagcdn.com/w80/ve.png" alt="Venezuela" class="flag-icon">',
    "Mexico": '<img src="https://flagcdn.com/w80/mx.png" alt="México" class="flag-icon">',
    "United States": '<img src="https://flagcdn.com/w80/us.png" alt="Estados Unidos" class="flag-icon">',
    "Canada": '<img src="https://flagcdn.com/w80/ca.png" alt="Canadá" class="flag-icon">',
    "Costa Rica": '<img src="https://flagcdn.com/w80/cr.png" alt="Costa Rica" class="flag-icon">',
    "Honduras": '<img src="https://flagcdn.com/w80/hn.png" alt="Honduras" class="flag-icon">',
    "Panama": '<img src="https://flagcdn.com/w80/pa.png" alt="Panamá" class="flag-icon">',
    "USA": '<img src="https://flagcdn.com/w80/us.png" alt="Estados Unidos" class="flag-icon">',

    // África
    "Morocco": '<img src="https://flagcdn.com/w80/ma.png" alt="Marruecos" class="flag-icon">',
    "Algeria": '<img src="https://flagcdn.com/w80/dz.png" alt="Argelia" class="flag-icon">',
    "Tunisia": '<img src="https://flagcdn.com/w80/tn.png" alt="Túnez" class="flag-icon">',
    "Egypt": '<img src="https://flagcdn.com/w80/eg.png" alt="Egipto" class="flag-icon">',
    "South Africa": '<img src="https://flagcdn.com/w80/za.png" alt="Sudáfrica" class="flag-icon">',
    "Nigeria": '<img src="https://flagcdn.com/w80/ng.png" alt="Nigeria" class="flag-icon">',
    "Ghana": '<img src="https://flagcdn.com/w80/gh.png" alt="Ghana" class="flag-icon">',
    "Ivory Coast": '<img src="https://flagcdn.com/w80/ci.png" alt="Costa de Marfil" class="flag-icon">',
    "Cameroon": '<img src="https://flagcdn.com/w80/cm.png" alt="Camerún" class="flag-icon">',
    "Senegal": '<img src="https://flagcdn.com/w80/sn.png" alt="Senegal" class="flag-icon">',

    // Asia
    "Japan": '<img src="https://flagcdn.com/w80/jp.png" alt="Japón" class="flag-icon">',
    "South Korea": '<img src="https://flagcdn.com/w80/kr.png" alt="Corea del Sur" class="flag-icon">',
    "China": '<img src="https://flagcdn.com/w80/cn.png" alt="China" class="flag-icon">',
    "Saudi Arabia": '<img src="https://flagcdn.com/w80/sa.png" alt="Arabia Saudita" class="flag-icon">',
    "Qatar": '<img src="https://flagcdn.com/w80/qa.png" alt="Qatar" class="flag-icon">',
    "United Arab Emirates": '<img src="https://flagcdn.com/w80/ae.png" alt="EAU" class="flag-icon">',
    "Iran": '<img src="https://flagcdn.com/w80/ir.png" alt="Irán" class="flag-icon">',
    "India": '<img src="https://flagcdn.com/w80/in.png" alt="India" class="flag-icon">',
    "Australia": '<img src="https://flagcdn.com/w80/au.png" alt="Australia" class="flag-icon">',

    // Casos especiales - Continentes y organizaciones internacionales
    "Europe": '<img src="https://flagcdn.com/w80/eu.png" alt="Europa" class="flag-icon">',
    "International": '<img src="https://flagcdn.com/w80/un.png" alt="Internacional" class="flag-icon">',
    "World": '<img src="https://flagcdn.com/w80/un.png" alt="Mundial" class="flag-icon">',

    // Continentes adicionales
    "Africa": '<img src="https://flagcdn.com/w80/za.png" alt="África (Sudáfrica)" class="flag-icon">',
    "North America": '<img src="https://flagcdn.com/w80/us.png" alt="América del Norte (EE.UU.)" class="flag-icon">',
    "South America": '<img src="https://flagcdn.com/w80/br.png" alt="América del Sur (Brasil)" class="flag-icon">',
    "Central America": '<img src="https://flagcdn.com/w80/mx.png" alt="América Central (México)" class="flag-icon">',
    "America": '<img src="https://flagcdn.com/w80/un.png" alt="América" class="flag-icon">',
    "Asia": '<img src="https://flagcdn.com/w80/cn.png" alt="Asia (China)" class="flag-icon">',
    "Oceania": '<img src="https://flagcdn.com/w80/au.png" alt="Oceanía (Australia)" class="flag-icon">',
    "Antarctica": '<img src="https://flagcdn.com/w80/aq.png" alt="Antártida" class="flag-icon">',

    // Variantes de nombres para organizaciones continentales
    "UEFA": '<img src="https://flagcdn.com/w80/eu.png" alt="UEFA" class="flag-icon">',
    "CONMEBOL": '<img src="https://flagcdn.com/w80/un.png" alt="CONMEBOL" class="flag-icon">',
    "CONCACAF": '<img src="https://flagcdn.com/w80/un.png" alt="CONCACAF" class="flag-icon">',
    "AFC": '<img src="https://flagcdn.com/w80/un.png" alt="AFC" class="flag-icon">',
    "CAF": '<img src="https://flagcdn.com/w80/un.png" alt="CAF" class="flag-icon">',
    "OFC": '<img src="https://flagcdn.com/w80/un.png" alt="OFC" class="flag-icon">',
    "FIFA": '<img src="https://flagcdn.com/w80/un.png" alt="FIFA" class="flag-icon">',
  };

  // Función para obtener el nombre traducido del torneo
  function getTranslatedTournamentName(name) {
    return tournamentTranslations[name] || name;
  }

  // Función para obtener el nombre traducido del país
  function getTranslatedCountryName(name) {
    return countryTranslations[name] || name;
  }

  // Función para obtener la bandera del país
  function getCountryFlag(countryName) {
    // Si existe en el diccionario, devolver la bandera (emoji o HTML)
    if (countryFlags[countryName]) {
      return countryFlags[countryName];
    }
    
    // Si no, devolver la inicial del nombre del país
    return countryName.substring(0, 1).toUpperCase();
  }
  
  // Función para obtener el logo de un equipo
  const getTeamLogo = (team) => {
    // Si no hay equipo
    if (!team) return '<div class="team-logo-fallback">?</div>';
    
    // Si tenemos logos cargados y este equipo tiene ID
    if (this.teamLogos && team.id && this.teamLogos[team.id]) {
      return `<img src="${this.teamLogos[team.id]}" alt="${team.name}" class="team-logo-img">`;
    }
    
    // Fallback - usar la inicial del nombre
    return `<div class="team-logo-fallback">${team.name ? team.name.substring(0, 1) : '?'}</div>`;
  };

  // Agrupar partidos por torneo
  const tournamentGroups = {};
  
  filteredMatches.forEach(match => {
    // Asegurarnos de que el torneo existe
    if (match.tournament) {
      const tournamentId = match.tournament.id;
      if (!tournamentGroups[tournamentId]) {
        const originalTournamentName = match.tournament.name || "Torneo sin nombre";
        const originalCountryName = match.tournament.category?.name || "";
        
        tournamentGroups[tournamentId] = {
          id: tournamentId,
          name: getTranslatedTournamentName(originalTournamentName),
          originalName: originalTournamentName,
          country: getTranslatedCountryName(originalCountryName),
          originalCountry: originalCountryName,
          matches: []
        };
      }
      tournamentGroups[tournamentId].matches.push(match);
    } else {
      // Para partidos sin torneo, los agrupamos en "Otros"
      if (!tournamentGroups["otros"]) {
        tournamentGroups["otros"] = {
          id: "otros",
          name: "Otros partidos",
          originalName: "Others",
          country: "",
          originalCountry: "",
          matches: []
        };
      }
      tournamentGroups["otros"].matches.push(match);
    }
  });

  // Ordenar cronológicamente los partidos dentro de cada grupo
  Object.values(tournamentGroups).forEach(group => {
    group.matches.sort((a, b) => a.startTimestamp - b.startTimestamp);
  });

  // NUEVA IMPLEMENTACIÓN: Separar los grupos en favoritos y no favoritos
  const favoriteTournamentGroups = [];
  const nonFavoriteTournamentGroups = [];

  Object.values(tournamentGroups).forEach(group => {
    // Verificar si el torneo es favorito
    if (this.isFavoriteTournament(group.name)) {
      favoriteTournamentGroups.push(group);
    } else {
      nonFavoriteTournamentGroups.push(group);
    }
  });

  // Ordenar cada grupo por separado
  // Para favoritos: ordenar alfabéticamente
  favoriteTournamentGroups.sort((a, b) => a.name.localeCompare(b.name));

  // Para no favoritos: usar la lógica existente
  nonFavoriteTournamentGroups.sort((a, b) => {
    // Priorizar ligas principales
    const mainLeagues = ["LaLiga", "Premier League", "Serie A", "Bundesliga", "Ligue 1", "Liga de Campeones"];
    const aIsPriority = mainLeagues.some(league => a.name.includes(league));
    const bIsPriority = mainLeagues.some(league => b.name.includes(league));
    
    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;
    
    // Si ambos o ninguno son prioritarios, ordenar alfabéticamente
    return a.name.localeCompare(b.name);
  });

  // Unir ambos grupos (favoritos primero)
  const sortedGroups = [...favoriteTournamentGroups, ...nonFavoriteTournamentGroups];

  // Construir HTML para cada grupo
  let html = '';
  sortedGroups.forEach(group => {
    // Obtener bandera del país
    const flag = getCountryFlag(group.originalCountry);
    
    // Verificar si es favorito para añadir la clase
    const isFavorite = this.isFavoriteTournament(group.name);
    const favoriteClass = isFavorite ? 'favorite-tournament' : '';
    
    // Encabezado del torneo con clase de favorito si corresponde
    html += `
        <div class="tournament-header ${favoriteClass}">
        <div class="tournament-header-icon">
            ${flag}
        </div>
        <div class="favorite-icon ${isFavorite ? 'active' : ''}" data-tournament="${group.name}">
            <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
        </div>
        <div class="tournament-header-info">
            <h3 class="tournament-header-name">${group.name}</h3>
            ${group.country ? `<span class="tournament-header-country">${group.country}</span>` : ''}
        </div>
        </div>
        <div class="matches-group"> 
    `;
    
    // Partidos del torneo
    group.matches.forEach(match => {
      const isLive = match.status.type === 'inprogress';
      const isFinished = match.status.type === 'finished';
      const isScheduled = match.status.type === 'notstarted';
      
      let statusText = 'Programado';
      
      if (isLive) {
        statusText = `${match.time?.minute || '0'}'`;
      } else if (isFinished) {
        statusText = 'Finalizado';
      } else {
        // Format the start time
        const matchDate = new Date(match.startTimestamp * 1000);
        statusText = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

        html += `
        <div class="match-card" data-match-id="${match.id}">
            <div class="match-card-header ${isLive ? 'match-header-live' : (isFinished ? 'match-header-finished' : '')}">
            <div class="match-time">${statusText}</div>
            </div>
            <div class="match-card-content">
            <div class="match-teams">
                <div class="team-info">
                <div class="team-logo">
                    <img src="https://img.sofascore.com/api/v1/team/${match.homeTeam?.id}/image" 
                        alt="${match.homeTeam?.name}" class="team-logo-img" loading="lazy"
                        onerror="this.onerror=null; this.src=''; this.parentNode.innerHTML='${match.homeTeam?.name ? match.homeTeam.name.substring(0, 1) : '?'}';">
                </div>
                <div class="team-name">${match.homeTeam?.name || 'Local'}</div>
                </div>
                <div class="match-score">
                <div class="score">${isScheduled ? '-' : match.homeScore?.current || 0}</div>
                <div class="match-separator">:</div>
                <div class="score">${isScheduled ? '-' : match.awayScore?.current || 0}</div>
                </div>
                <div class="team-info away-team">
                <div class="team-logo">
                    <img src="https://img.sofascore.com/api/v1/team/${match.awayTeam?.id}/image" 
                        alt="${match.awayTeam?.name}" class="team-logo-img" loading="lazy"
                        onerror="this.onerror=null; this.src=''; this.parentNode.innerHTML='${match.awayTeam?.name ? match.awayTeam.name.substring(0, 1) : '?'}';">
                </div>
                <div class="team-name">${match.awayTeam?.name || 'Visitante'}</div>
                </div>
            </div>
            <div class="match-status-indicator ${isLive ? 'live-indicator' : ''}">
                ${isLive ? 'EN DIRECTO' : statusText}
            </div>
            </div>
        </div>
        `;
    });

    html += `</div>`;  // Cierre de matches-group
  });

  this.matchesContainerElement.innerHTML = html;

  // Add event listeners to match cards
  const app = this;  // Save reference for event listeners
  document.querySelectorAll('.match-card').forEach(card => {
    card.addEventListener('click', function() {
      app.selectMatch(this.dataset.matchId);
    });
  });

  document.querySelectorAll('.favorite-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const tournamentName = icon.getAttribute('data-tournament');
      const isFavorite = this.isFavoriteTournament(tournamentName);
      
    if (!isFavorite) {
      // Añadir a favoritos
      if (this.addFavoriteTournament(tournamentName)) {
        icon.innerHTML = '<i class="fas fa-heart"></i>';
        icon.classList.add('active');
        
        // Añadir clase de favorito al encabezado del torneo
        const header = icon.closest('.tournament-header');
        if (header) header.classList.add('favorite-tournament');
        
        // Actualizar la lista de torneos en el panel lateral
        if (this.tournaments && this.tournaments.length > 0) {
          this.renderTournaments(this.tournaments);
        }
        
        // NUEVO: Volver a renderizar los partidos para actualizar el orden
        // Guardar la posición de desplazamiento actual
        const scrollPosition = this.matchesContainerElement.scrollTop;
        
        // Volver a renderizar los partidos con el mismo conjunto de datos
        this.renderMatches(this.currentMatches);
        
        // Restaurar la posición de desplazamiento
        setTimeout(() => {
          this.matchesContainerElement.scrollTop = scrollPosition;
        }, 0);
      }
    } else {
        //Quitar de favoritos
        if (this.removeFavoriteTournament(tournamentName)) {
            icon.innerHTML = '<i class="far fa-heart"></i>';
            icon.classList.remove('active');
            
            // Quitar clase de favorito del encabezado del torneo
            const header = icon.closest('.tournament-header');
            if (header) header.classList.remove('favorite-tournament');
            
            // Actualizar la lista de torneos en el panel lateral
            if (this.tournaments && this.tournaments.length > 0) {
            this.renderTournaments(this.tournaments);
            }
            
            // NUEVO: Volver a renderizar los partidos para actualizar el orden
            // Guardar la posición de desplazamiento actual
            const scrollPosition = this.matchesContainerElement.scrollTop;
            
            // Volver a renderizar los partidos con el mismo conjunto de datos
            this.renderMatches(this.currentMatches);
            
            // Restaurar la posición de desplazamiento
            setTimeout(() => {
            this.matchesContainerElement.scrollTop = scrollPosition;
            }, 0);
        }
    }
    });
  });
};

FootStatsApp.prototype.getSortedTournaments = function(tournaments) {
  if (!tournaments || tournaments.length === 0) return [];
  
  // Verificar que no haya torneos sin nombre
  const noNameCount = tournaments.filter(t => !t.name || t.name === "Torneo sin nombr33e").length;
  if (noNameCount > 0) {
    console.warn(`Encontrados ${noNameCount} torneos sin nombre válido antes de ordenar`);
  }
  
  // Trabajar con copias para evitar mutaciones accidentales
  const tournamentsToSort = tournaments.map(t => ({...t}));
  
  // Separar en favoritos y no favoritos
  const favorites = [];
  const nonFavorites = [];
  
  tournamentsToSort.forEach(tournament => {
    if (this.isFavoriteTournament(tournament.name)) {
      favorites.push(tournament);
    } else {
      nonFavorites.push(tournament);
    }
  });
  
  console.log(`Dividiendo torneos: ${favorites.length} favoritos, ${nonFavorites.length} no favoritos`);
  
  // Ordenar alfabéticamente cada grupo
  favorites.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  nonFavorites.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  
  return [...favorites, ...nonFavorites];
};

FootStatsApp.prototype.getTeamLogo = function(team) {
  // Si no hay equipo
  if (!team || !team.id) {
    return '<div class="team-logo-fallback">?</div>';
  }
  
  // Usar directamente la URL de Sofascore con el ID del equipo
  return `<img src="https://img.sofascore.com/api/v1/team/${team.id}/image" 
           alt="${team.name}" class="team-logo-img" loading="lazy"
           onerror="this.onerror=null; this.src=''; this.classList.add('team-logo-error'); this.parentElement.innerHTML='${team.name ? team.name.substring(0, 1) : '?'}';">`;
};


FootStatsApp.prototype.renderMatchDetails = function() {
  if (!this.currentMatchDetails) return;
  
  const match = this.currentMatchDetails;
  const summary = match.summary;
  
  // Update match title
  document.getElementById('match-title').textContent = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
  
  // NUEVO: Agregar botón de refresh después del botón de volver
  const backBtn = document.getElementById('back-to-matches');
  if (backBtn && !document.getElementById('refresh-match-btn')) {
    const refreshButton = document.createElement('button');
    refreshButton.id = 'refresh-match-btn';
    refreshButton.className = 'back-btn refresh-btn'; // Usar estilo similar al botón de volver
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
    refreshButton.title = 'Actualizar datos del partido';
    
    // Agregar evento de click
    refreshButton.addEventListener('click', () => this.refreshMatchDetails());
    
    // Insertar después del botón de volver
    backBtn.parentNode.insertBefore(refreshButton, backBtn.nextSibling);
  }
  
  // Get team colors for gradient
  const homeColor = match.homeTeam.teamColors?.primary || "#1a78cf";
  const awayColor = match.awayTeam.teamColors?.primary || "#22b573";
  
  // Apply dynamic gradient to scoreboard
  const scoreboard = document.querySelector('.match-scoreboard');
  scoreboard.style.background = `linear-gradient(to right, ${homeColor}, ${awayColor})`;
  
  // Update team names and scores
  document.querySelector('.home-name').textContent = match.homeTeam.name;
  document.querySelector('.away-name').textContent = match.awayTeam.name;
  document.querySelector('.home-score').textContent = match.homeScore?.current || 0;
  document.querySelector('.away-score').textContent = match.awayScore?.current || 0;
  
  // Update team logos - replace text with images
  const homeLogo = document.querySelector('.home-logo');
  const awayLogo = document.querySelector('.away-logo');
  
  // Clear any existing content first
  homeLogo.innerHTML = '';
  awayLogo.innerHTML = '';
  
  // Create and set home team logo
  if (match.homeTeam.id) {
    const homeImg = document.createElement('img');
    homeImg.src = `https://img.sofascore.com/api/v1/team/${match.homeTeam.id}/image`;
    homeImg.alt = match.homeTeam.name;
    homeImg.classList.add('team-logo-img');
    homeImg.onerror = function() {
      this.onerror = null;
      this.parentNode.textContent = match.homeTeam.name.substring(0, 1);
      this.parentNode.classList.add('fallback-logo');
    };
    homeLogo.appendChild(homeImg);
  } else {
    homeLogo.textContent = match.homeTeam.name.substring(0, 1);
    homeLogo.classList.add('fallback-logo');
  }
  
  // Create and set away team logo
  if (match.awayTeam.id) {
    const awayImg = document.createElement('img');
    awayImg.src = `https://img.sofascore.com/api/v1/team/${match.awayTeam.id}/image`;
    awayImg.alt = match.awayTeam.name;
    awayImg.classList.add('team-logo-img');
    awayImg.onerror = function() {
      this.onerror = null;
      this.parentNode.textContent = match.awayTeam.name.substring(0, 1);
      this.parentNode.classList.add('fallback-logo');
    };
    awayLogo.appendChild(awayImg);
  } else {
    awayLogo.textContent = match.awayTeam.name.substring(0, 1);
    awayLogo.classList.add('fallback-logo');
  }
  
  // Update match status
  const isLive = match.status.type === 'inprogress';
  const isFinished = match.status.type === 'finished';
  
  let matchTimeText = '';
  let matchStateText = '';
  
  if (isLive) {
    matchTimeText = `${match.time?.minute || '0'}'`;
    matchStateText = 'En directo';
  } else if (isFinished) {
    matchTimeText = 'FT';
    matchStateText = 'Finalizado';
  } else {
    const matchDate = new Date(match.startTimestamp * 1000);
    matchTimeText = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    matchStateText = 'Programado';
  }
  
  document.querySelector('.match-time').textContent = matchTimeText;
  document.querySelector('.match-state').textContent = matchStateText;
  
  // Render initial tab (stats)
  this.renderStatsTab(summary);
  this.renderShotsTab(summary);
  this.renderEventsTab(summary);

  scoreboard.style.boxShadow = "inset 0 0 0 1000px rgba(0, 0, 0, 0.2)";
  
  // Show match detail view
  this.showMatchDetailView();
};

// Método para actualizar los detalles del partido
FootStatsApp.prototype.refreshMatchDetails = function() {
  if (!this.selectedMatchId) return;
  
  // Guardar el estado actual
  const currentTabElement = document.querySelector('.tab-btn.active');
  const currentTab = currentTabElement ? currentTabElement.dataset.tab : 'stats';
  
  // Guardar el estado del selector de eventos si estamos en la pestaña shots
  let currentEventType = null;
  if (currentTab === 'shots') {
    const selector = document.getElementById('event-type-selector');
    if (selector) {
      currentEventType = selector.value;
    }
  }
  
  // Mostrar indicador de carga
  const refreshButton = document.getElementById('refresh-match-btn');
  if (refreshButton) {
    refreshButton.classList.add('refreshing');
    refreshButton.disabled = true;
  }
  
  // Actualizar los datos del partido
  this.loadMatchDetails(this.selectedMatchId)
    .then(() => {
      // Restaurar la pestaña activa
      this.switchTab(currentTab);
      
      // Restaurar el tipo de evento si estábamos en la pestaña de eventos
      if (currentTab === 'shots' && currentEventType) {
        const selector = document.getElementById('event-type-selector');
        if (selector) {
          selector.value = currentEventType;
          
          // Disparar manualmente el evento change para actualizar la vista
          const event = new Event('change');
          selector.dispatchEvent(event);
        }
      }
      
      // Mostrar notificación de éxito
      this.showNotification('Datos actualizados correctamente', 'success');
    })
    .catch(error => {
      console.error('Error al actualizar datos:', error);
      this.showNotification('Error al actualizar los datos', 'error');
    })
    .finally(() => {
      // Restaurar el botón
      if (refreshButton) {
        refreshButton.classList.remove('refreshing');
        refreshButton.disabled = false;
      }
    });
};

// Método para mostrar notificaciones
FootStatsApp.prototype.showNotification = function(message, type = 'info') {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `notification ${type}-notification`;
  
  // Agregar icono según el tipo
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;
  
  // Agregar al DOM
  document.body.appendChild(notification);
  
  // Mostrar con animación
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
};

// NUEVA FUNCIÓN: Método para actualizar los detalles del partido
FootStatsApp.prototype.refreshMatchDetails = function() {
  if (!this.selectedMatchId) return;
  
  // Guardar el estado actual
  const currentTabElement = document.querySelector('.tab-btn.active');
  const currentTab = currentTabElement ? currentTabElement.dataset.tab : 'stats';
  
  // Guardar el estado del selector de eventos si estamos en la pestaña shots
  let currentEventType = null;
  if (currentTab === 'shots') {
    const selector = document.getElementById('event-type-selector');
    if (selector) {
      currentEventType = selector.value;
    }
  }
  
  // Mostrar indicador de carga
  const refreshButton = document.querySelector('.refresh-match-btn');
  if (refreshButton) {
    refreshButton.classList.add('refreshing');
    refreshButton.disabled = true;
  }
  
  // Actualizar los datos del partido
  this.loadMatchDetails(this.selectedMatchId)
    .then(() => {
      // Restaurar la pestaña activa
      this.switchTab(currentTab);
      
      // Restaurar el tipo de evento si estábamos en la pestaña de eventos
      if (currentTab === 'shots' && currentEventType) {
        const selector = document.getElementById('event-type-selector');
        if (selector) {
          selector.value = currentEventType;
          
          // Disparar manualmente el evento change para actualizar la vista
          const event = new Event('change');
          selector.dispatchEvent(event);
        }
      }
      
      // Mostrar notificación de éxito
      this.showNotification('Datos actualizados correctamente', 'success');
    })
    .catch(error => {
      console.error('Error al actualizar datos:', error);
      this.showNotification('Error al actualizar los datos', 'error');
    })
    .finally(() => {
      // Restaurar el botón
      if (refreshButton) {
        refreshButton.classList.remove('refreshing');
        refreshButton.disabled = false;
      }
    });
};

// NUEVA FUNCIÓN: Método para mostrar notificaciones
FootStatsApp.prototype.showNotification = function(message, type = 'info') {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `notification ${type}-notification`;
  
  // Agregar icono según el tipo
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;
  
  // Agregar al DOM
  document.body.appendChild(notification);
  
  // Mostrar con animación
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
};

FootStatsApp.prototype.refreshMatchDetails = function() {
  if (!this.selectedMatchId) return;
  
  // Guardar el estado actual
  const currentTabElement = document.querySelector('.tab-btn.active');
  const currentTab = currentTabElement ? currentTabElement.dataset.tab : 'stats';
  
  // Guardar el estado del selector de eventos si estamos en esa pestaña
  let currentEventType = null;
  if (currentTab === 'shots') {
    const selector = document.getElementById('event-type-selector');
    if (selector) {
      currentEventType = selector.value;
    }
  }
  
  // Mostrar indicador de carga
  const refreshButton = document.querySelector('.refresh-match-btn');
  if (refreshButton) {
    refreshButton.classList.add('refreshing');
    refreshButton.disabled = true;
  }
  
  // Actualizar los datos del partido
  this.loadMatchDetails(this.selectedMatchId)
    .then(() => {
      // Restaurar la pestaña activa
      this.switchTab(currentTab);
      
      // Restaurar el tipo de evento si estábamos en la pestaña de eventos
      if (currentTab === 'shots' && currentEventType) {
        const selector = document.getElementById('event-type-selector');
        if (selector) {
          selector.value = currentEventType;
          
          // Disparar manualmente el evento change para actualizar la vista
          const event = new Event('change');
          selector.dispatchEvent(event);
        }
      }
      
      // Mostrar notificación de éxito
      this.showNotification('Datos actualizados correctamente', 'success');
    })
    .catch(error => {
      console.error('Error al actualizar datos:', error);
      this.showNotification('Error al actualizar los datos', 'error');
    })
    .finally(() => {
      // Restaurar el botón
      if (refreshButton) {
        refreshButton.classList.remove('refreshing');
        refreshButton.disabled = false;
      }
    });
};

FootStatsApp.prototype.showNotification = function(message, type = 'info') {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `notification ${type}-notification`;
  
  // Agregar icono según el tipo
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;
  
  // Agregar al DOM
  document.body.appendChild(notification);
  
  // Mostrar con animación
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
};

FootStatsApp.prototype.renderStatsTab = function(summary) {
  const statsContainer = document.getElementById('tab-stats');
  
  // Si no hay datos, mostrar mensaje de carga
  if (!summary) {
    statsContainer.innerHTML = `
      <div class="stats-comparison">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Cargando estadísticas...</span>
        </div>
      </div>
    `;
    return;
  }

  console.log('summary:', summary);

  // Obtener colores de los equipos para las barras
  const homeColor = this.currentMatchDetails?.homeTeam?.teamColors?.primary || "#1a78cf";
  const awayColor = this.currentMatchDetails?.awayTeam?.teamColors?.primary || "#e74c3c";
  
  // Extraer estadísticas del resumen (objeto summary)
  // Posesión - buscamos en varios lugares posibles según la API
  let homePossession = 50;
  let awayPossession = 50;
  
  if (summary.possession) {
    // Si hay un objeto directo de posesión
    homePossession = summary.possession.home || summary.possession.homeValue || 50;
    awayPossession = summary.possession.away || summary.possession.awayValue || 50;
  } else if (summary.stats && summary.stats.possession) {
    // Si está dentro de un objeto stats
    homePossession = summary.stats.possession.home || 50;
    awayPossession = summary.stats.possession.away || 50;
  } else if (Array.isArray(summary.statistics)) {
    // Si está en un array de estadísticas
    const possessionStat = summary.statistics.find(stat => 
      stat.type === 'possession' || stat.name === 'possession' || stat.key === 'possession');
    if (possessionStat) {
      homePossession = possessionStat.home || possessionStat.homeValue || 50;
      awayPossession = possessionStat.away || possessionStat.awayValue || 50;
    }
  }
  
  // Corners - buscar en varios lugares posibles
  let homeCorners = 0;
  let awayCorners = 0;
  
  if (summary.corners) {
    // Si hay un objeto directo de corners
    homeCorners = summary.corners.home || summary.corners.homeValue || 0;
    awayCorners = summary.corners.away || summary.corners.awayValue || 0;
  } else if (summary.stats && summary.stats.corners) {
    // Si está dentro de un objeto stats
    homeCorners = summary.stats.corners.home || 0;
    awayCorners = summary.stats.corners.away || 0;
  } else if (Array.isArray(summary.statistics)) {
    // Si está en un array de estadísticas
    const cornersStat = summary.statistics.find(stat => 
      stat.type === 'corners' || stat.name === 'corners' || stat.key === 'corners');
    if (cornersStat) {
      homeCorners = cornersStat.home || cornersStat.homeValue || 0;
      awayCorners = cornersStat.away || cornersStat.awayValue || 0;
    }
  } else if (Array.isArray(summary.events)) {
    // Contar los eventos de tipo corner
    homeCorners = summary.events.filter(e => 
      (e.type === 'corner' || e.eventType === 'corner') && (e.team === 'home' || e.isHome)).length;
    awayCorners = summary.events.filter(e => 
      (e.type === 'corner' || e.eventType === 'corner') && (e.team === 'away' || !e.isHome)).length;
  }
  
  // Compilar todas las estadísticas
  const stats = [
    { label: 'Posesión', home: homePossession, away: awayPossession, isPercentage: true },
    { label: 'Tiros', home: summary.shots?.filter(s => s.isHome).length || 0, away: summary.shots?.filter(s => !s.isHome).length || 0 },
    { label: 'Tiros a puerta', home: summary.shots?.filter(s => s.isHome && s.shotType === 'OnTarget').length || 0, away: summary.shots?.filter(s => !s.isHome && s.shotType === 'OnTarget').length || 0 },
    { label: 'Corners', home: homeCorners, away: awayCorners },
    { label: 'Faltas', home: summary.fouls?.filter(f => f.team === 'home').length || 0, away: summary.fouls?.filter(f => f.team === 'away').length || 0 },
    { label: 'Tarjetas amarillas', home: summary.fouls?.filter(f => f.team === 'home' && f.foulType?.includes('amarilla')).length || 0, away: summary.fouls?.filter(f => f.team === 'away' && f.foulType?.includes('amarilla')).length || 0 },
    { label: 'Tarjetas rojas', home: summary.fouls?.filter(f => f.team === 'home' && f.foulType?.includes('roja')).length || 0, away: summary.fouls?.filter(f => f.team === 'away' && f.foulType?.includes('roja')).length || 0 },
    { label: 'Paradas', home: summary.saves?.filter(s => s.team === 'home').length || 0, away: summary.saves?.filter(s => s.team === 'away').length || 0 }
  ];
  
  // Generar el HTML para cada estadística
  const statsHtml = stats.map(stat => {
    const total = stat.home + stat.away;
    let homeWidth = 50;
    let awayWidth = 50;
    
    // Calcular el ancho de las barras
    if (total > 0) {
      if (stat.isPercentage) {
        // Para porcentajes como posesión
        homeWidth = stat.home;
        awayWidth = stat.away;
      } else {
        // Para valores absolutos
        homeWidth = Math.round((stat.home / total) * 100);
        awayWidth = Math.round((stat.away / total) * 100);
      }
    }
    
    // Asegurar que las barras sumen 100% 
    const totalWidth = homeWidth + awayWidth;
    if (totalWidth !== 100) {
      const adjust = 100 / totalWidth;
      homeWidth = Math.round(homeWidth * adjust);
      awayWidth = 100 - homeWidth; // Asegura que suman 100
    }
    
    // Valor a mostrar (con % para posesión)
    const homeDisplay = stat.isPercentage ? `${stat.home}%` : stat.home;
    const awayDisplay = stat.isPercentage ? `${stat.away}%` : stat.away;
    
    return `
      <div class="stat-item">
        <div class="stat-values">
          <div class="home-value">${homeDisplay}</div>
          <div class="stat-label">${stat.label}</div>
          <div class="away-value">${awayDisplay}</div>
        </div>
        <div class="stat-bars">
          <div class="stat-bar-container">
            <div class="stat-bar home-bar" style="width: ${homeWidth}%; background-color: ${homeColor};"></div>
            <div class="stat-bar away-bar" style="width: ${awayWidth}%; background-color: ${awayColor};"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Insertar todo el HTML
  statsContainer.innerHTML = `
    <div class="stats-comparison">
      <h3 class="stats-title">ESTADÍSTICAS PRINCIPALES</h3>
      ${statsHtml}
    </div>
  `;
};

FootStatsApp.prototype.renderEventsTab = function(summary) {
  const eventsContainer = document.getElementById('tab-events');
  
  // Combine shots, fouls, saves into timeline
  const events = [];
  
  if (summary.shots) {
    summary.shots.forEach(shot => {
      if (shot.shotType === 'goal') {
        events.push({
          time: shot.time,
          type: 'goal',
          icon: 'futbol',
          iconClass: 'icon-goal',
          title: `Gol de ${shot.player.name}`,
          description: shot.hasAssist ? `Asistencia: ${shot.assistPlayer.name}` : '',
          team: shot.isHome ? 'home' : 'away'
        });
      }
    });
  }
  
  if (summary.fouls) {
    summary.fouls.forEach(foul => {
      let icon = 'hand';
      let iconClass = '';
      
      if (foul.foulType.includes('amarilla')) {
        icon = 'square';
        iconClass = 'icon-yellow';
      } else if (foul.foulType.includes('roja')) {
        icon = 'square';
        iconClass = 'icon-red';
      }
      
      events.push({
        time: foul.time,
        type: 'foul',
        icon: icon,
        iconClass: iconClass,
        title: foul.foulType,
        description: foul.description,
        team: foul.team
      });
    });
  }
  
  // Sort by time (descending)
  events.sort((a, b) => b.time - a.time);
  
  if (events.length === 0) {
    eventsContainer.innerHTML = `
      <div class="empty-state">
          <i class="fas fa-clock"></i>
          <span>No hay eventos registrados</span>
      </div>
    `;
    return;
  }
  
  const eventsHtml = events.map(event => `
    <div class="timeline-event">
        <div class="timeline-time">${event.time}'</div>
        <div class="timeline-content">
            <div class="timeline-title">
                <i class="fas fa-${event.icon} event-icon ${event.iconClass}"></i>
                ${event.title}
            </div>
            <div class="timeline-description">${event.description}</div>
        </div>
    </div>
  `).join('');
  
  eventsContainer.innerHTML = `
    <div class="match-timeline">
        ${eventsHtml}
    </div>
  `;
};

FootStatsApp.prototype.getFavoriteTournaments = function() {
  try {
    return JSON.parse(localStorage.getItem('favoriteTournaments') || '[]');
  } catch (error) {
    console.error('Error al leer favoritos:', error);
    return [];
  }
};

FootStatsApp.prototype.addFavoriteTournament = function(tournamentName) {
  try {
    const favorites = this.getFavoriteTournaments();
    if (!favorites.includes(tournamentName)) {
      favorites.push(tournamentName);
      localStorage.setItem('favoriteTournaments', JSON.stringify(favorites));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al añadir favorito:', error);
    return false;
  }
};

FootStatsApp.prototype.removeFavoriteTournament = function(tournamentName) {
  try {
    const favorites = this.getFavoriteTournaments();
    const index = favorites.indexOf(tournamentName);
    if (index !== -1) {
      favorites.splice(index, 1);
      localStorage.setItem('favoriteTournaments', JSON.stringify(favorites));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al eliminar favorito:', error);
    return false;
  }
};

FootStatsApp.prototype.isFavoriteTournament = function(tournamentName) {
  return this.getFavoriteTournaments().includes(tournamentName);
};

// UI Interaction
FootStatsApp.prototype.selectTournament = function(tournamentId) {
  this.selectedTournamentId = tournamentId;
  this.renderTournaments(this.tournaments);
  this.renderMatches(this.matches);
};

FootStatsApp.prototype.selectMatch = function(matchId) {
  this.selectedMatchId = matchId;
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.style.display = 'none';
  }
  this.loadMatchDetails(matchId);
};

FootStatsApp.prototype.showMatchDetailView = function() {
  this.matchesView.classList.remove('active');
  this.matchDetailView.classList.add('active');

    // Resetear la posición del scroll de la vista de detalles
  this.matchDetailView.scrollTop = 0;
  
  // Si hay un contenedor de contenido específico dentro de la vista de detalles
  const detailContent = this.matchDetailView.querySelector('.match-detail-content');
  if (detailContent) {
    detailContent.scrollTop = 0;
  }
  
  // En caso de que el scroll esté en el elemento body o html (según la estructura)
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

FootStatsApp.prototype.showMatchesView = function() {
  this.matchDetailView.classList.remove('active');
  this.matchesView.classList.add('active');
};

FootStatsApp.prototype.switchTab = function(tabId) {
  // Update active tab button
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  
  // Show selected tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = content.id === `tab-${tabId}` ? 'block' : 'none';
  });
};

FootStatsApp.prototype.filterTournaments = function(query) {
  if (!query) {
    this.renderTournaments(this.tournaments);
    return;
  }
  
  const filtered = this.tournaments.filter(tournament => 
    tournament.name.toLowerCase().includes(query.toLowerCase())
  );
  
  this.renderTournaments(filtered);
};

FootStatsApp.prototype.filterMatches = function(filter) {
  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  
  let filtered = [...this.matches];
  
  switch (filter) {
    case 'live':
      filtered = filtered.filter(match => match.status.type === 'inprogress');
      break;
    case 'upcoming':
      filtered = filtered.filter(match => match.status.type === 'notstarted');
      break;
    case 'finished':
      filtered = filtered.filter(match => match.status.type === 'finished');
      break;
  }
  
  this.renderMatches(filtered);
};

FootStatsApp.prototype.highlightShot = function(index) {
  document.querySelector(`.shot-marker[data-shot-index="${index}"]`)?.classList.add('highlighted');
  document.querySelector(`.shot-item[data-shot-index="${index}"]`)?.classList.add('highlighted');
};

FootStatsApp.prototype.unhighlightShot = function(index) {
  document.querySelector(`.shot-marker[data-shot-index="${index}"]`)?.classList.remove('highlighted');
  document.querySelector(`.shot-item[data-shot-index="${index}"]`)?.classList.remove('highlighted');
};

FootStatsApp.prototype.refreshData = function() {
  this.loadTournaments();
  this.loadMatches(this.currentDate);
};

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  const app = new FootStatsApp();
});

// Add global error handling
window.addEventListener('error', function(event) {
  console.error('Global error caught:', event.error);
  // You could add more sophisticated error handling here
});

// Reemplazar la función renderShotsTab con esta versión mejorada
FootStatsApp.prototype.renderShotsTab = function(summary) {
  const shotsContainer = document.getElementById('tab-shots');
  
  if (!summary.shots || summary.shots.length === 0) {
    shotsContainer.innerHTML = `
      <div class="empty-state">
          <i class="fas fa-futbol"></i>
          <span>No hay datos de tiros disponibles</span>
      </div>
    `;
    return;
  }

    const homeColor = this.currentMatchDetails?.homeTeam?.teamColors?.primary || "#1a78cf";
  const awayColor = this.currentMatchDetails?.awayTeam?.teamColors?.primary || "#e74c3c";
  
  // Usar el nuevo componente de eventos para mostrar los tiros
  setupEventsComponent(shotsContainer, summary, homeColor, awayColor);
};

// Esta función sustituirá a la existente renderEventsTab
FootStatsApp.prototype.renderEventsTab = function(summary) {
  const eventsContainer = document.getElementById('tab-events');
  
  if (!summary.fouls || summary.fouls.length === 0) {
    eventsContainer.innerHTML = `
      <div class="empty-state">
          <i class="fas fa-clock"></i>
          <span>No hay eventos registrados</span>
      </div>
    `;
    return;
  }
  
  // Crear lista de todos los eventos ordenados por tiempo
  const allEvents = [];
  
  // Añadir goles
  if (summary.shots) {
    summary.shots.forEach(shot => {
      if (shot.shotType === 'goal') {
        allEvents.push({
          time: shot.time,
          timeSeconds: shot.timeSeconds,
          type: 'goal',
          playerName: shot.player.name,
          team: shot.isHome ? 'home' : 'away',
          description: shot.hasAssist ? `Asistencia: ${shot.assistPlayer.name}` : '',
          icon: 'futbol',
          iconClass: 'icon-goal'
        });
      }
    });
  }
  
  // Añadir faltas y tarjetas
  if (summary.fouls) {
    summary.fouls.forEach(foul => {
      let icon = 'hand';
      let iconClass = '';
      
      if (foul.foulType.includes('amarilla')) {
        icon = 'square';
        iconClass = 'icon-yellow';
      } else if (foul.foulType.includes('roja')) {
        icon = 'square';
        iconClass = 'icon-red';
      }
      
      allEvents.push({
        time: foul.time,
        timeSeconds: foul.timeSeconds,
        type: 'foul',
        playerName: foul.playerName,
        team: foul.team,
        description: foul.description,
        icon,
        iconClass
      });
    });
  }
  
  // Ordenar por tiempo (descendente)
  allEvents.sort((a, b) => b.timeSeconds - a.timeSeconds);
  
  const eventsHtml = allEvents.map(event => `
    <div class="timeline-event ${event.team}">
        <div class="timeline-time">${event.time}'</div>
        <div class="timeline-content">
            <div class="timeline-title">
                <i class="fas fa-${event.icon} event-icon ${event.iconClass}"></i>
                ${event.playerName}
            </div>
            <div class="timeline-description">${event.description}</div>
        </div>
    </div>
  `).join('');
  
  eventsContainer.innerHTML = `
    <div class="match-timeline">
        ${eventsHtml}
    </div>
  `;
};

// Añadir una pestaña para alineaciones
FootStatsApp.prototype.renderLineupTab = function(summary) {
  const lineupContainer = document.getElementById('tab-lineup');
  
  // Esta función sería para mostrar la alineación, pero sin datos específicos
  // mostramos un mensaje por ahora
  lineupContainer.innerHTML = `
    <div class="lineups-container">
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <span>Datos de alineación no disponibles</span>
      </div>
    </div>
  `;
};

FootStatsApp.prototype.debugFavorites = function() {
  const favorites = this.getFavoriteTournaments();
  console.log('===== DEBUG FAVORITOS =====');
  console.log('Favoritos almacenados:', favorites);
  console.log('Torneos no favoritos:', this.tournaments);
  console.log('Torneos totales:', this.tournaments.length);
  
  const matchingTournaments = this.tournaments.filter(t => favorites.includes(t.name));
  console.log('Torneos que coinciden con favoritos:', matchingTournaments.length);
  
  if (matchingTournaments.length > 0) {
    console.log('Ejemplos de coincidencias:');
    matchingTournaments.slice(0, 3).forEach(t => console.log(t.name));
  }
  
  if (matchingTournaments.length < favorites.length) {
    console.log('Favoritos que no coinciden con ningún torneo:');
    favorites.filter(f => !this.tournaments.some(t => t.name === f))
      .forEach(f => console.log(f));
  }
};

FootStatsApp.prototype.clearCache = function() {
  try {
    // Eliminar datos de torneos en caché
    localStorage.removeItem('cachedTournaments');
    localStorage.removeItem('cachedTournamentsTimestamp');
    
    console.log('Caché de torneos eliminada correctamente');
    return true;
  } catch (error) {
    console.error('Error al limpiar caché:', error);
    return false;
  }
};