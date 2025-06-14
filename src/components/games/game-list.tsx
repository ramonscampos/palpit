import { Tables } from "@/types/supabase";
import { useEffect, useState } from "react";
import { GameCard } from "./game-card";
import { GameHeader } from "./game-header";

interface GameListProps {
	games: (Tables<"games"> & {
		home_team: Tables<"teams">;
		away_team: Tables<"teams">;
	})[];
	userGuesses: Record<string, { home_guess: number; away_guess: number }>;
	onGuess: (gameId: string) => void;
	currentDate: Date;
	onDateChange: (newDate: Date) => void;
}

export function GameList({
	games,
	userGuesses,
	onGuess,
	currentDate,
	onDateChange,
}: GameListProps) {
	const [filteredGames, setFilteredGames] = useState(games);

	useEffect(() => {
		const startOfDay = new Date(currentDate);
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date(currentDate);
		endOfDay.setHours(23, 59, 59, 999);

		const gamesForDay = games.filter((game) => {
			const gameDate = new Date(game.game_time);
			return gameDate >= startOfDay && gameDate <= endOfDay;
		});

		setFilteredGames(gamesForDay);
	}, [currentDate, games]);

	const hasPreviousDay = games.some((game) => {
		const gameDate = new Date(game.game_time);
		const startOfCurrentDate = new Date(currentDate);
		startOfCurrentDate.setHours(0, 0, 0, 0);
		return gameDate < startOfCurrentDate;
	});

	const hasNextDay = games.some((game) => {
		const gameDate = new Date(game.game_time);
		const endOfCurrentDate = new Date(currentDate);
		endOfCurrentDate.setHours(23, 59, 59, 999);
		return gameDate > endOfCurrentDate;
	});

	const handlePreviousDay = () => {
		const newDate = new Date(currentDate);
		newDate.setDate(newDate.getDate() - 1);
		onDateChange(newDate);
	};

	const handleNextDay = () => {
		const newDate = new Date(currentDate);
		newDate.setDate(newDate.getDate() + 1);
		onDateChange(newDate);
	};

	return (
		<div className="w-full max-w-4xl mx-auto p-4">
			<GameHeader
				date={currentDate}
				onPreviousDay={handlePreviousDay}
				onNextDay={handleNextDay}
				hasPreviousDay={hasPreviousDay}
				hasNextDay={hasNextDay}
			/>

			<div className="space-y-4">
				{filteredGames.length > 0 ? (
					filteredGames.map((game) => (
						<GameCard
							key={game.id}
							game={game}
							userGuess={userGuesses[game.id]}
							onGuess={onGuess}
						/>
					))
				) : (
					<div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
						<div className="text-gray-500 text-lg mb-2">
							Nenhum jogo para este dia
						</div>
						<p className="text-gray-400">
							Selecione outro dia para ver os jogos disponíveis
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
