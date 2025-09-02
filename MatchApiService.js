// Match API Service - JavaScript Version
// This service fetches football matches and match details from SofaScore API.

class MatchApiService {
  constructor() {
    this.matchesBaseUrl = "https://www.sofascore.com/api/v1/sport/football/scheduled-events";
    this.matchBaseUrl = "https://www.sofascore.com/api/v1/event";
  }

  async getMatches(date) {
    try {
      const url = `${this.matchesBaseUrl}/${date}`;
      const response = await fetch(url);
      const jsonString = await response.text();
      const jsonObject = JSON.parse(jsonString || '{"events":[]}');
      return jsonObject.events || [];
    } catch (e) {
      throw new Error(`Error fetching matches: ${e.message}`);
    }
  }

  async getMatch(matchId) {
    try {
      const url = `${this.matchBaseUrl}/${matchId}`;
      const response = await fetch(url);
      const jsonString = await response.text();
      const jsonObject = JSON.parse(jsonString || '{"event":{}}');
      return jsonObject.event;
    } catch (e) {
      throw new Error(`Error fetching match: ${e.message}`);
    }
  }
}

export default MatchApiService;