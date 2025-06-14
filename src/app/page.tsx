"use client";

import { GameList } from "@/components/games/game-list";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
	const supabase = createClientComponentClient<Database>();
	const router = useRouter();
	const [games, setGames] = useState<any[]>([]);
	const [userGuesses, setUserGuesses] = useState<Record<string, any>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			try {
				const {
					data: { user },
				} = await supabase.auth.getUser();

				if (!user) {
					router.push("/login");
					return;
				}

				// Carregar jogos com informações dos times
				const { data: gamesData, error: gamesError } = await supabase
					.from("games")
					.select(`
						*,
						home_team:teams!games_home_team_id_fkey(*),
						away_team:teams!games_away_team_id_fkey(*)
					`)
					.order("game_time", { ascending: true });

				if (gamesError) throw gamesError;

				// Carregar palpites do usuário
				const { data: guessesData, error: guessesError } = await supabase
					.from("guesses")
					.select("*")
					.eq("user_id", user.id);

				if (guessesError) throw guessesError;

				// Transformar palpites em um objeto para fácil acesso
				const guessesMap = guessesData.reduce(
					(acc, guess) => {
						acc[guess.game_id] = {
							home_guess: guess.home_guess,
							away_guess: guess.away_guess,
						};
						return acc;
					},
					{} as Record<string, any>,
				);

				setGames(gamesData || []);
				setUserGuesses(guessesMap);
			} catch (error) {
				console.error("Erro ao carregar dados:", error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [supabase, router]);

	const handleGuess = (gameId: string) => {
		// Aqui você pode implementar a lógica para abrir um modal ou navegar para uma página de palpite
		console.log("Palpitar jogo:", gameId);
	};

	const handleSignOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error("Erro ao sair:", error.message);
		} else {
			router.push("/login");
			router.refresh();
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-xl text-gray-900 font-medium">Carregando...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-sm border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
					<h1 className="text-2xl font-bold text-gray-900">Palp.it</h1>
					<Button
						onClick={handleSignOut}
						variant="destructive"
						className="py-2 px-4 font-medium"
					>
						Sair
					</Button>
				</div>
			</header>

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<GameList
					games={games}
					userGuesses={userGuesses}
					onGuess={handleGuess}
				/>
			</main>
		</div>
	);
}
