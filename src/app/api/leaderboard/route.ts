import {
	BrazilBet,
	ChampionBet,
	Game,
	Guess,
	Profile,
	TeamProgress,
} from "@/types/leaderboard";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Função para calcular o brasileiro que foi mais longe
async function calculateBrazilianChampion(
	supabase: any,
): Promise<string | null> {
	// Buscar todos os times brasileiros que foram apostados
	const { data: brazilBets, error: brazilBetsError } = await supabase
		.from("brazil_bet")
		.select("*");

	if (brazilBetsError) throw brazilBetsError;
	if (!brazilBets) return null;

	// Extrair IDs dos times brasileiros apostados
	const brazilianTeamIds = brazilBets.map((bet: BrazilBet) => bet.team_id);
	if (brazilianTeamIds.length === 0) {
		return null;
	}

	// Buscar todos os jogos finalizados
	const { data: games, error: gamesError } = await supabase
		.from("games")
		.select(`
      *,
      home_team:teams!games_home_team_id_fkey(*),
      away_team:teams!games_away_team_id_fkey(*)
    `)
		.not("home_score", "is", null)
		.not("away_score", "is", null)
		.order("game_time", { ascending: true });

	if (gamesError) throw gamesError;
	if (!games) return null;

	// Filtrar apenas jogos que envolvem times brasileiros apostados
	const brazilianGames = games.filter(
		(game: Game) =>
			brazilianTeamIds.includes(game.home_team_id) ||
			brazilianTeamIds.includes(game.away_team_id),
	);

	// Calcular progresso de cada time brasileiro
	const teamProgress: Record<string, TeamProgress> = {};

	// Inicializar progresso de cada time
	brazilianTeamIds.forEach((teamId: string) => {
		teamProgress[teamId] = {
			games: 0,
			eliminated: false,
			goalDifference: 0,
		};
	});

	// Processar cada jogo em ordem cronológica
	brazilianGames.forEach((game: Game) => {
		const isHomeBrazilian = brazilianTeamIds.includes(game.home_team_id);
		const isAwayBrazilian = brazilianTeamIds.includes(game.away_team_id);

		if (isHomeBrazilian) {
			const teamId = game.home_team_id;
			teamProgress[teamId].games++;
			const goalDiff = (game.home_score || 0) - (game.away_score || 0);
			teamProgress[teamId].goalDifference += goalDiff;
			if (teamProgress[teamId].games >= 4 && goalDiff < 0) {
				teamProgress[teamId].eliminated = true;
			}
		}
		if (isAwayBrazilian) {
			const teamId = game.away_team_id;
			teamProgress[teamId].games++;
			const goalDiff = (game.away_score || 0) - (game.home_score || 0);
			teamProgress[teamId].goalDifference += goalDiff;
			if (teamProgress[teamId].games >= 4 && goalDiff < 0) {
				teamProgress[teamId].eliminated = true;
			}
		}
	});

	// Só há campeão se restar apenas UM time não eliminado
	const notEliminated = Object.entries(teamProgress).filter(
		([, progress]) => !progress.eliminated,
	);
	if (notEliminated.length !== 1) {
		return null;
	}
	// Se só sobrou um, ele é o campeão
	return notEliminated[0][0];
}

// Função para calcular o campeão geral (champion_bet)
async function calculateChampionTeam(supabase: any): Promise<string | null> {
	// Buscar todos os times apostados como campeão
	const { data: championBets, error: championBetsError } = await supabase
		.from("champion_bet")
		.select("*");
	if (championBetsError) throw championBetsError;
	if (!championBets) return null;

	// Extrair IDs dos times apostados
	const championTeamIds = championBets.map((bet: ChampionBet) => bet.team_id);
	if (championTeamIds.length === 0) return null;

	// Buscar todos os jogos finalizados
	const { data: games, error: gamesError } = await supabase
		.from("games")
		.select("*")
		.not("home_score", "is", null)
		.not("away_score", "is", null)
		.order("game_time", { ascending: true });
	if (gamesError) throw gamesError;
	if (!games) return null;

	// Calcular progresso de cada time apostado
	const teamProgress: Record<string, { games: number; lastGameWin: boolean }> =
		{};
	championTeamIds.forEach((teamId: string) => {
		teamProgress[teamId] = { games: 0, lastGameWin: false };
	});

	games.forEach((game: Game) => {
		if (championTeamIds.includes(game.home_team_id)) {
			const teamId = game.home_team_id;
			teamProgress[teamId].games++;
			// Se for o 7º jogo, verificar se venceu
			if (teamProgress[teamId].games === 7) {
				teamProgress[teamId].lastGameWin =
					(game.home_score ?? 0) > (game.away_score ?? 0);
			}
		}
		if (championTeamIds.includes(game.away_team_id)) {
			const teamId = game.away_team_id;
			teamProgress[teamId].games++;
			if (teamProgress[teamId].games === 7) {
				teamProgress[teamId].lastGameWin =
					(game.away_score ?? 0) > (game.home_score ?? 0);
			}
		}
	});

	// Encontrar o campeão: time com 7 jogos e venceu o último
	let championTeamId: string | null = null;
	Object.entries(teamProgress).forEach(([teamId, progress]) => {
		if (progress.games === 7 && progress.lastGameWin) {
			championTeamId = teamId;
		}
	});

	return championTeamId;
}

export async function GET() {
	try {
		const supabase = createRouteHandlerClient({ cookies });

		// Calcular o brasileiro campeão
		// const championTeamId = await calculateBrazilianChampion(supabase);
		const championTeamId = undefined;
		// Calcular o campeão geral
		// const championOverallTeamId = await calculateChampionTeam(supabase);
		const championOverallTeamId = undefined;

		console.log("#####################", championTeamId);

		// Buscar todos os perfis
		const { data: profiles, error: profilesError } = await supabase
			.from("profiles")
			.select("*");
		if (profilesError) throw profilesError;
		if (!profiles) return NextResponse.json({ data: [] });

		// Buscar todos os jogos finalizados
		const { data: games, error: gamesError } = await supabase
			.from("games")
			.select(
				`*, home_team:teams!games_home_team_id_fkey(*), away_team:teams!games_away_team_id_fkey(*)`,
			)
			.not("home_score", "is", null)
			.not("away_score", "is", null);
		if (gamesError) throw gamesError;
		if (!games) return NextResponse.json({ data: [] });

		// Buscar todos os palpites
		const { data: guesses, error: guessesError } = await supabase
			.from("guesses")
			.select("*");
		if (guessesError) throw guessesError;
		if (!guesses) return NextResponse.json({ data: [] });

		// Buscar todos os palpites do brasileiro campeão
		const { data: brazilBets, error: brazilBetsError } = await supabase
			.from("brazil_bet")
			.select("*");
		if (brazilBetsError) throw brazilBetsError;
		if (!brazilBets) return NextResponse.json({ data: [] });

		// Buscar todos os palpites do campeão geral
		const { data: championBets, error: championBetsError } = await supabase
			.from("champion_bet")
			.select("*");
		if (championBetsError) throw championBetsError;
		if (!championBets) return NextResponse.json({ data: [] });

		// Calcular pontos do brasileiro campeão
		let brazilianChampionPoints = 0;
		let usersWhoBetOnBrazilianChampion: BrazilBet[] = [];
		if (championTeamId && brazilBets.length > 0) {
			usersWhoBetOnBrazilianChampion = brazilBets.filter(
				(bet: BrazilBet) => bet.team_id === championTeamId,
			);
			if (usersWhoBetOnBrazilianChampion.length > 0) {
				brazilianChampionPoints = 15;
			}
		}

		// Calcular pontos do campeão geral
		let championPoints = 0;
		let usersWhoBetOnChampion: ChampionBet[] = [];
		if (championOverallTeamId && championBets.length > 0) {
			usersWhoBetOnChampion = championBets.filter(
				(bet: ChampionBet) => bet.team_id === championOverallTeamId,
			);
			if (usersWhoBetOnChampion.length > 0) {
				championPoints = 15;
			}
		}

		// Calcular pontuação para cada perfil
		const leaderboardData = profiles.map((profile: Profile) => {
			const userGuesses = guesses.filter(
				(g: Guess) => g.user_id === profile.id,
			);
			let exactScoreHits = 0;
			let winnerHits = 0;

			userGuesses.forEach((guess: Guess) => {
				const game = games.find((g: Game) => g.id === guess.game_id);
				if (!game) return;

				// Verificar acerto exato do placar
				if (
					guess.home_guess === game.home_score &&
					guess.away_guess === game.away_score
				) {
					exactScoreHits++;
				} else {
					const guessWinner =
						guess.home_guess > guess.away_guess
							? "home"
							: guess.home_guess < guess.away_guess
								? "away"
								: "draw";
					const actualWinner =
						(game.home_score ?? 0) > (game.away_score ?? 0)
							? "home"
							: (game.home_score ?? 0) < (game.away_score ?? 0)
								? "away"
								: "draw";
					if (guessWinner === actualWinner) {
						winnerHits++;
					}
				}
			});

			// Verificar se o usuário apostou no brasileiro campeão
			const userBetOnBrazilianChampion = usersWhoBetOnBrazilianChampion.some(
				(bet: BrazilBet) => bet.user_id === profile.id,
			);
			const brazilianPoints = userBetOnBrazilianChampion
				? brazilianChampionPoints
				: 0;

			// Verificar se o usuário apostou no campeão geral
			const userBetOnChampion = usersWhoBetOnChampion.some(
				(bet: ChampionBet) => bet.user_id === profile.id,
			);
			const championTeamPoints = userBetOnChampion ? championPoints : 0;

			const totalPoints =
				exactScoreHits * 3 + winnerHits + brazilianPoints + championTeamPoints;

			return {
				profile,
				exactScoreHits,
				winnerHits,
				brazilianChampionPoints: brazilianPoints,
				championTeamPoints,
				totalPoints,
			};
		});

		// Ordenar por pontuação total (decrescente)
		leaderboardData.sort((a, b) => {
			if (b.totalPoints !== a.totalPoints) {
				return b.totalPoints - a.totalPoints;
			}
			return (a.profile.name || "").localeCompare(b.profile.name || "");
		});

		return NextResponse.json({ data: leaderboardData });
	} catch (error) {
		console.error("Erro ao carregar leaderboard:", error);
		return NextResponse.json(
			{ error: "Erro ao carregar leaderboard" },
			{ status: 500 },
		);
	}
}
