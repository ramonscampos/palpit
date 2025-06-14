"use client";

import { GameList } from "@/components/games/game-list";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type GameWithTeams = Database["public"]["Tables"]["games"]["Row"] & {
	home_team: Database["public"]["Tables"]["teams"]["Row"];
	away_team: Database["public"]["Tables"]["teams"]["Row"];
};

type UserGuess = {
	home_guess: number;
	away_guess: number;
};

export default function HomePage() {
	const supabase = createClientComponentClient<Database>();
	const router = useRouter();
	const searchParams = useSearchParams();

	const [games, setGames] = useState<GameWithTeams[]>([]);
	const [userGuesses, setUserGuesses] = useState<Record<string, UserGuess>>({});
	const [loading, setLoading] = useState(true);
	const [selectedGame, setSelectedGame] = useState<GameWithTeams | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [homeGuessInput, setHomeGuessInput] = useState<number | "">("");
	const [awayGuessInput, setAwayGuessInput] = useState<number | "">("");

	const [currentDate, setCurrentDate] = useState<Date>(() => {
		const dateParam = searchParams.get("date");
		if (dateParam) {
			// Tenta parsear a data do query param
			const date = new Date(dateParam);
			// Valida se a data é válida
			if (!Number.isNaN(date.getTime())) {
				return date;
			}
		}
		return new Date(); // Retorna a data atual se não houver param ou for inválido
	});

	const isSaveDisabled = homeGuessInput === "" || awayGuessInput === "";

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
					{} as Record<string, UserGuess>,
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

	useEffect(() => {
		// Preencher os inputs do palpite se o jogo já tiver um palpite
		if (selectedGame && userGuesses[selectedGame.id]) {
			setHomeGuessInput(userGuesses[selectedGame.id].home_guess);
			setAwayGuessInput(userGuesses[selectedGame.id].away_guess);
		} else {
			setHomeGuessInput("");
			setAwayGuessInput("");
		}
	}, [selectedGame, userGuesses]);

	const handleGuess = (gameId: string) => {
		const game = games.find((g) => g.id === gameId);
		if (game) {
			setSelectedGame(game);
			setIsModalOpen(true);
			setShowConfirmation(false); // Reset confirmation state
		}
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedGame(null);
		setShowConfirmation(false); // Reset confirmation state
	};

	const handleConfirmSave = () => {
		setShowConfirmation(true);
	};

	const handleSaveGuess = async () => {
		if (!selectedGame) return;

		setLoading(true);
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			console.error("Usuário não autenticado.");
			handleCloseModal();
			return;
		}

		try {
			const { error } = await supabase.from("guesses").upsert(
				{
					game_id: selectedGame.id,
					user_id: user.id,
					home_guess: Number(homeGuessInput),
					away_guess: Number(awayGuessInput),
				},
				{ onConflict: "user_id,game_id" }, // Para atualizar se já existir
			);

			if (error) {
				throw error;
			}

			router.refresh(); // Recarrega os dados na página
		} catch (error) {
			console.error("Erro ao salvar palpite:", error);
		} finally {
			setLoading(false);
			handleCloseModal();
		}
	};

	const handleDateChange = (newDate: Date) => {
		setCurrentDate(newDate);
		const newSearchParams = new URLSearchParams(searchParams.toString());
		newSearchParams.set("date", newDate.toISOString().split("T")[0]); // Salva a data como YYYY-MM-DD
		router.push(`?${newSearchParams.toString()}`);
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
					currentDate={currentDate}
					onDateChange={handleDateChange}
				/>
			</main>

			<Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Palpitar">
				{selectedGame && (
					<div className="space-y-6">
						<div className="flex items-center justify-between gap-8 px-4">
							<div className="flex-1 flex flex-col items-center space-y-4">
								<p className="font-semibold text-gray-900 h-14 flex items-center justify-center text-center">
									{selectedGame.home_team.name}
								</p>
								<div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
									{selectedGame.home_team.logo_url && (
										<img
											src={selectedGame.home_team.logo_url}
											alt={selectedGame.home_team.name}
											className="w-12 h-12 object-contain"
										/>
									)}
								</div>
								<input
									type="number"
									min="0"
									value={homeGuessInput}
									onChange={(e) => setHomeGuessInput(Number(e.target.value))}
									className="w-20 h-12 text-center border-2 border-gray-400 rounded-lg text-lg font-bold text-gray-800 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
									placeholder="-"
								/>
							</div>

							<div className="flex flex-col items-center justify-center">
								<span className="text-2xl font-bold text-gray-400">x</span>
							</div>

							<div className="flex-1 flex flex-col items-center space-y-4">
								<p className="font-semibold text-gray-900 h-14 flex items-center justify-center text-center">
									{selectedGame.away_team.name}
								</p>
								<div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
									{selectedGame.away_team.logo_url && (
										<img
											src={selectedGame.away_team.logo_url}
											alt={selectedGame.away_team.name}
											className="w-12 h-12 object-contain"
										/>
									)}
								</div>
								<input
									type="number"
									min="0"
									value={awayGuessInput}
									onChange={(e) => setAwayGuessInput(Number(e.target.value))}
									className="w-20 h-12 text-center border-2 border-gray-400 rounded-lg text-lg font-bold text-gray-800 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
									placeholder="-"
								/>
							</div>
						</div>

						{!showConfirmation ? (
							<div className="flex justify-center gap-3 pt-4 border-t border-gray-100">
								<Button
									variant="default"
									onClick={handleCloseModal}
									className="px-6 w-32 bg-gray-200 text-gray-900 hover:bg-gray-300"
								>
									Cancelar
								</Button>
								<Button
									onClick={handleConfirmSave}
									className={`px-6 w-32 bg-black text-white font-bold ${isSaveDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"}`}
									disabled={isSaveDisabled}
								>
									Salvar Palpite
								</Button>
							</div>
						) : (
							<div className="space-y-4 pt-4 border-t border-gray-100 text-center">
								<p className="text-lg font-semibold text-gray-800">
									Tem certeza que deseja salvar este palpite?
								</p>
								<p className="text-sm text-gray-600">
									Após salvar, o palpite não poderá ser alterado.
								</p>
								<div className="flex justify-center gap-3 mt-6">
									<Button
										variant="default"
										onClick={() => setShowConfirmation(false)}
										className="px-6 bg-gray-200 text-gray-900 hover:bg-gray-300 w-32"
									>
										Não
									</Button>
									<Button
										onClick={handleSaveGuess}
										className={`px-6  w-32 bg-red-400 text-white font-bold ${isSaveDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"}`}
										disabled={isSaveDisabled}
									>
										Sim, Salvar
									</Button>
								</div>
							</div>
						)}
					</div>
				)}
			</Modal>
		</div>
	);
}
