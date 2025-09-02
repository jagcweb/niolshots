// Tournament API Service - JavaScript Version
// This service fetches unique football tournaments from SofaScore API.

class TournamentApiService {
  constructor() {
    this.baseUrl = "https://www.sofascore.com/api/v1/search/suggestions/unique-tournaments?sport=football";
  }

  async getAllTournaments() {
    try {
      const response = await fetch(this.baseUrl);
      const jsonString = await response.text();
      const jsonObject = JSON.parse(jsonString || '{"results":[]}');
      const results = jsonObject.results || [];
      // TournamentMapper functionality: just pass through or map as needed
      return results.map(tournament => ({
        // Map fields as needed, for example:
        id: tournament.id,
        name: tournament.name,
        slug: tournament.slug,
        // Add more fields according to your DTO structure
      }));
    } catch (e) {
      throw new Error(`Error fetching tournaments: ${e.message}`);
    }
  }
}

export default TournamentApiService;