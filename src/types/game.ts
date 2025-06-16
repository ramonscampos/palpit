export interface Team {
	id: string;
	name: string;
	logo_url: string | null;
}

export interface Game {
	id: string;
	home_team_id: string;
	away_team_id: string;
	game_time: string;
	home_score: number | null;
	away_score: number | null;
}

export interface GameWithTeams extends Game {
	home_team: Team;
	away_team: Team;
}
