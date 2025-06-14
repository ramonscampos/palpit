"use client";

import { supabase } from "@/lib/supabase-client";
import { Database } from "@/types/supabase";
import Image from "next/image";
import { useEffect, useState } from "react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Game = Database["public"]["Tables"]["games"]["Row"];
type Guess = Database["public"]["Tables"]["guesses"]["Row"];

interface LeaderboardEntry {
	profile: Profile;
	exactScoreHits: number;
	winnerHits: number;
	totalPoints: number;
}

export function LeaderboardTable() {
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadLeaderboard = async () => {
			try {
				// Buscar todos os perfis
				const { data: profiles, error: profilesError } = await supabase
					.from("profiles")
					.select("*");

				if (profilesError) throw profilesError;

				// Buscar todos os jogos finalizados
				const { data: games, error: gamesError } = await supabase
					.from("games")
					.select("*")
					.not("home_score", "is", null)
					.not("away_score", "is", null);

				if (gamesError) throw gamesError;

				// Buscar todos os palpites
				const { data: guesses, error: guessesError } = await supabase
					.from("guesses")
					.select("*");

				if (guessesError) throw guessesError;

				// Calcular pontuação para cada perfil
				const leaderboardData = profiles.map((profile) => {
					const userGuesses = guesses.filter((g) => g.user_id === profile.id);
					let exactScoreHits = 0;
					let winnerHits = 0;

					userGuesses.forEach((guess) => {
						const game = games.find((g) => g.id === guess.game_id);
						if (!game) return;

						// Verificar acerto exato do placar
						if (
							guess.home_guess === game.home_score &&
							guess.away_guess === game.away_score
						) {
							exactScoreHits++;
						}
						// Verificar acerto do vencedor
						else {
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

					return {
						profile,
						exactScoreHits,
						winnerHits,
						totalPoints: exactScoreHits * 3 + winnerHits,
					};
				});

				// Ordenar por pontuação total (decrescente)
				leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints);

				setLeaderboard(leaderboardData);
			} catch (error) {
				console.error("Erro ao carregar leaderboard:", error);
			} finally {
				setLoading(false);
			}
		};

		loadLeaderboard();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-lg text-gray-600">Carregando...</div>
			</div>
		);
	}

	return (
		<>
			<div className="mt-8 relative bg-white rounded-lg shadow w-full max-w-4xl mx-auto p-4 z-[1]">
				<div className="px-4 py-5 sm:px-6 border-b border-gray-200">
					<h2 className="text-xl font-semibold text-gray-900">
						Tabela de Pontuação
					</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th
									scope="col"
									className="w-12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								/>
								<th
									scope="col"
									className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									Usuário
								</th>
								<th
									scope="col"
									className="w-24 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									AP
								</th>
								<th
									scope="col"
									className="w-24 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									AV
								</th>
								<th
									scope="col"
									className="w-20 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									P
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200 font-bold">
							{leaderboard.map((entry, index) => (
								<tr key={entry.profile.id} className="hover:bg-gray-50">
									<td className="w-12 px-2 py-4 whitespace-nowrap text-xl font-bold text-gray-500">
										{index + 1}º
									</td>
									<td className="px-6 pl-2 md:pl-6 py-4 whitespace-nowrap">
										<div className="flex items-center">
											<div className="flex-shrink-0 h-10 w-10 relative">
												{entry.profile.avatar_url ? (
													<Image
														src={entry.profile.avatar_url}
														alt={entry.profile.name || ""}
														fill
														className="rounded-full object-cover"
													/>
												) : (
													<div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
														<span className="text-gray-500 text-lg">
															{entry.profile.name?.[0]?.toUpperCase() || "?"}
														</span>
													</div>
												)}
											</div>
											<div className="ml-4">
												<div className="text-sm text-gray-900">
													{entry.profile.name}
												</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
										{entry.exactScoreHits}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
										{entry.winnerHits}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
										{entry.totalPoints}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			<div className="-mt-4 relative text-xs text-gray-500 text-right bg-gray-50 rounded-lg shadow w-full max-w-4xl mx-auto pt-6 pb-2 z-0 px-4">
				<span>
					<b>AP:</b> Acertos de Placar
				</span>
				<span className="ml-4">
					<b>AV:</b> Acertos de Vencedor
				</span>
				<span className="ml-4">
					<b>P:</b> Pontuação
				</span>
			</div>
		</>
	);
}
