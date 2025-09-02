// Este archivo complementa app-unified.js (no es necesario si prefieres mantener la app simple)

// ============================
// TOURNAMENT REPOSITORY
// ============================
function TournamentRepository() {
    this.tournamentApi = new TournamentApiService();
    this.matchApi = new MatchApiService();
    this.localStorageKey = 'footstats_tournaments';
}

// Obtener todos los torneos (combinando API + almacenamiento local)
TournamentRepository.prototype.getAllTournaments = async function() {
    try {
        // 1. Obtener torneos de la API
        const apiTournaments = await this.tournamentApi.getAllTournaments();
        
        // 2. Obtener partidos de hoy para extraer torneos adicionales
        const today = this.formatDate(new Date());
        const todayMatches = await this.matchApi.getMatches(today);
        const matchTournaments = todayMatches.map(match => match.tournament);
        
        // 3. Combinar y eliminar duplicados
        const allTournaments = [...apiTournaments, ...matchTournaments]
            .filter((t, index, self) => 
                index === self.findIndex(x => x.id === t.id)
            );
        
        // 4. Guardar en storage
        this.saveTournaments(allTournaments);
        
        // 5. Obtener estado guardado (checked)
        return this.getCheckedTournaments(allTournaments);
    } catch (error) {
        console.error("Error en getAllTournaments:", error);
        // Fallback a almacenamiento local
        return this.getLocalTournaments();
    }
};

// Guardar torneos en almacenamiento local
TournamentRepository.prototype.saveTournaments = function(tournaments) {
    try {
        const savedTournaments = this.getLocalTournaments();
        
        // Preservar estado "checked" de los torneos guardados
        const updatedTournaments = tournaments.map(t => {
            const saved = savedTournaments.find(st => st.id === t.id);
            return {
                ...t,
                checked: saved ? saved.checked : false
            };
        });
        
        localStorage.setItem(this.localStorageKey, JSON.stringify(updatedTournaments));
    } catch (e) {
        console.error("Error guardando torneos:", e);
    }
};

// Obtener torneos del almacenamiento local
TournamentRepository.prototype.getLocalTournaments = function() {
    try {
        const stored = localStorage.getItem(this.localStorageKey);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error leyendo torneos locales:", e);
        return [];
    }
};

// Obtener torneos con su estado de check
TournamentRepository.prototype.getCheckedTournaments = function(allTournaments) {
    const storedTournaments = this.getLocalTournaments();
    
    if (allTournaments) {
        return allTournaments.map(t => {
            const stored = storedTournaments.find(st => st.id === t.id);
            return {
                ...t,
                checked: stored ? stored.checked : false
            };
        });
    }
    
    return storedTournaments.filter(t => t.checked);
};

// Actualizar estado de torneos
TournamentRepository.prototype.updateTournaments = function(tournamentList) {
    try {
        const allTournaments = this.getLocalTournaments();
        
        tournamentList.forEach(updatedTournament => {
            const index = allTournaments.findIndex(t => t.id === updatedTournament.id);
            if (index !== -1) {
                allTournaments[index] = {
                    ...allTournaments[index],
                    ...updatedTournament
                };
            }
        });
        
        localStorage.setItem(this.localStorageKey, JSON.stringify(allTournaments));
    } catch (e) {
        console.error("Error actualizando torneos:", e);
    }
};

TournamentRepository.prototype.formatDate = function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ============================
// MATCH REPOSITORY
// ============================
function MatchRepository() {
    this.matchApi = new MatchApiService();
    this.localStorageKey = 'footstats_matches';
}

MatchRepository.prototype.getMatches = async function(date) {
    try {
        const matchesDto = await this.matchApi.getMatches(date);
        
        // Transformación simple (similar a un mapper)
        const matches = matchesDto.map(matchDto => ({
            ...matchDto,
            // Aquí podrías agregar transformaciones adicionales
            startTimestampLocalDate: this.timestampToLocalDate(matchDto.startTimestamp)
        }));
        
        // Filtrar partidos para la fecha específica
        const dateObj = new Date(date);
        const filteredMatches = matches.filter(match => 
            this.isSameDay(new Date(match.startTimestampLocalDate), dateObj)
        );
        
        // Guardar en local storage para uso offline
        this.saveMatches(date, filteredMatches);
        
        return filteredMatches;
    } catch (error) {
        console.error("Error obteniendo partidos:", error);
        // Intentar obtener de caché local
        return this.getLocalMatches(date);
    }
};

MatchRepository.prototype.getMatch = async function(matchId) {
    try {
        const matchDto = await this.matchApi.getMatch(matchId);
        
        // Transformación simple (similar a un mapper)
        return {
            ...matchDto,
            // Transformaciones adicionales
            startTimestampLocalDate: this.timestampToLocalDate(matchDto.startTimestamp)
        };
    } catch (error) {
        console.error("Error obteniendo detalles del partido:", error);
        // Intentar obtener de caché local
        return this.getLocalMatch(matchId);
    }
};

MatchRepository.prototype.saveMatches = function(date, matches) {
    try {
        const storedData = localStorage.getItem(this.localStorageKey);
        const allStoredMatches = storedData ? JSON.parse(storedData) : {};
        
        allStoredMatches[date] = matches;
        
        // Limitar a 7 días para no saturar el almacenamiento
        const dates = Object.keys(allStoredMatches).sort();
        if (dates.length > 7) {
            delete allStoredMatches[dates[0]];
        }
        
        localStorage.setItem(this.localStorageKey, JSON.stringify(allStoredMatches));
    } catch (e) {
        console.error("Error guardando partidos:", e);
    }
};

MatchRepository.prototype.getLocalMatches = function(date) {
    try {
        const storedData = localStorage.getItem(this.localStorageKey);
        if (!storedData) return [];
        
        const allStoredMatches = JSON.parse(storedData);
        return allStoredMatches[date] || [];
    } catch (e) {
        console.error("Error leyendo partidos locales:", e);
        return [];
    }
};

MatchRepository.prototype.getLocalMatch = function(matchId) {
    try {
        const storedData = localStorage.getItem(this.localStorageKey);
        if (!storedData) return null;
        
        const allStoredMatches = JSON.parse(storedData);
        
        // Buscar en todas las fechas
        for (const date in allStoredMatches) {
            const match = allStoredMatches[date].find(m => m.id === matchId);
            if (match) return match;
        }
        
        return null;
    } catch (e) {
        console.error("Error buscando partido local:", e);
        return null;
    }
};

MatchRepository.prototype.timestampToLocalDate = function(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
};

MatchRepository.prototype.isSameDay = function(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

// ============================
// STATS REPOSITORY
// ============================
function StatsRepository() {
    this.statsApi = new StatsApiService();
    this.localStorageKey = 'footstats_match_stats';
}

StatsRepository.prototype.getShotsFromApi = async function(matchId) {
    try {
        const shots = await this.statsApi.getShots(matchId);
        this.saveMatchStats(matchId, 'shots', shots);
        return shots;
    } catch (error) {
        console.error("Error obteniendo tiros:", error);
        return this.getLocalStats(matchId, 'shots') || [];
    }
};

StatsRepository.prototype.getPlayerFoulsFromApi = async function(matchId) {
    try {
        const fouls = await this.statsApi.getPlayerFouls(matchId);
        this.saveMatchStats(matchId, 'fouls', fouls);
        return fouls;
    } catch (error) {
        console.error("Error obteniendo faltas:", error);
        return this.getLocalStats(matchId, 'fouls') || [];
    }
};

StatsRepository.prototype.getPlayerSavesFromApi = async function(matchId) {
    try {
        const saves = await this.statsApi.getPlayerSaves(matchId);
        this.saveMatchStats(matchId, 'saves', saves);
        return saves;
    } catch (error) {
        console.error("Error obteniendo paradas:", error);
        return this.getLocalStats(matchId, 'saves') || [];
    }
};

StatsRepository.prototype.getMatchIncidentsFromApi = async function(matchId) {
    try {
        const incidents = await this.statsApi.getMatchIncidents(matchId);
        this.saveMatchStats(matchId, 'incidents', incidents);
        return incidents;
    } catch (error) {
        console.error("Error obteniendo incidentes:", error);
        return this.getLocalStats(matchId, 'incidents') || [];
    }
};

StatsRepository.prototype.getMatchSummaryFromApi = async function(matchId) {
    try {
        const summary = await this.statsApi.getMatchSummary(matchId);
        this.saveMatchStats(matchId, 'summary', summary);
        return summary;
    } catch (error) {
        console.error("Error obteniendo resumen:", error);
        
        // Intentar reconstruir el resumen a partir de componentes guardados
        const shots = this.getLocalStats(matchId, 'shots') || [];
        const fouls = this.getLocalStats(matchId, 'fouls') || [];
        const saves = this.getLocalStats(matchId, 'saves') || [];
        
        return { shots, fouls, saves };
    }
};

StatsRepository.prototype.saveMatchStats = function(matchId, type, data) {
    try {
        const storedData = localStorage.getItem(this.localStorageKey);
        const allStoredStats = storedData ? JSON.parse(storedData) : {};
        
        if (!allStoredStats[matchId]) {
            allStoredStats[matchId] = {};
        }
        
        allStoredStats[matchId][type] = data;
        allStoredStats[matchId].timestamp = new Date().getTime();
        
        // Limitar el número de partidos guardados (max 20)
        const matchIds = Object.keys(allStoredStats);
        if (matchIds.length > 20) {
            // Ordenar por timestamp y eliminar los más antiguos
            const oldestMatches = matchIds
                .map(id => ({ id, timestamp: allStoredStats[id].timestamp || 0 }))
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(0, matchIds.length - 20)
                .map(m => m.id);
            
            oldestMatches.forEach(id => delete allStoredStats[id]);
        }
        
        localStorage.setItem(this.localStorageKey, JSON.stringify(allStoredStats));
    } catch (e) {
        console.error("Error guardando estadísticas:", e);
    }
};

StatsRepository.prototype.getLocalStats = function(matchId, type) {
    try {
        const storedData = localStorage.getItem(this.localStorageKey);
        if (!storedData) return null;
        
        const allStoredStats = JSON.parse(storedData);
        return allStoredStats[matchId]?.[type] || null;
    } catch (e) {
        console.error("Error leyendo estadísticas locales:", e);
        return null;
    }
};