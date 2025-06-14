import { Tables } from "@/types/supabase";
import { Ban, DiamondPlus } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

interface GameCardProps {
	game: Tables<"games"> & {
		home_team: Tables<"teams">;
		away_team: Tables<"teams">;
	};
	userGuess?: {
		home_guess: number;
		away_guess: number;
	} | null;
	onGuess: (gameId: string) => void;
}

export function GameCard({ game, userGuess, onGuess }: GameCardProps) {
	const gameTime = new Date(game.game_time);
	const currentTime = new Date();
	const timeDifference = gameTime.getTime() - currentTime.getTime(); // Diferença em milissegundos
	const isPredictionClosed = timeDifference <= 60 * 60 * 1000; // 60 minutos em milissegundos

	const hasActualScore = game.home_score !== null && game.away_score !== null;

	let resultColorClass = "bg-gray-100"; // Cor padrão (cinza claro)
	let resultTextColorClass = "text-gray-300"; // Cor padrão do texto (cinza claro)

	if (userGuess && game.home_score !== null && game.away_score !== null) {
		const homeActual = game.home_score;
		const awayActual = game.away_score;
		const homeGuess = userGuess.home_guess;
		const awayGuess = userGuess.away_guess;

		const didGuessHomeWin = homeGuess > awayGuess;
		const didGuessAwayWin = awayGuess > homeGuess;
		const didGuessDraw = homeGuess === awayGuess;

		const didHomeWin = homeActual > awayActual;
		const didAwayWin = awayActual > homeActual;
		const didDraw = homeActual === awayActual;

		// Acertou o placar exato
		if (homeGuess === homeActual && awayGuess === awayActual) {
			resultColorClass = "bg-gray-100"; // Verde muito fraco
			resultTextColorClass = "text-emerald-200"; // Verde mais escuro
		} // Acertou o vencedor
		else if (
			(didGuessHomeWin && didHomeWin) ||
			(didGuessAwayWin && didAwayWin) ||
			(didGuessDraw && didDraw)
		) {
			resultColorClass = "bg-gray-100"; // Amarelo muito fraco
			resultTextColorClass = "text-amber-200"; // Amarelo mais escuro
		} // Errou tudo
		else {
			resultColorClass = "bg-gray-100"; // Vermelho muito fraco
			resultTextColorClass = "text-red-200"; // Vermelho mais escuro
		}
	}

	const checkValue = (value: number | null | undefined) => {
		return value !== null && value !== undefined;
	};

	return (
		<div className="px-20 relative">
			{!!userGuess && (
				<>
					<div className={`absolute inset-0 rounded-xl ${resultColorClass}`} />

					<div
						className={`absolute left-3 top-1/2 -translate-y-1/2 text-8xl font-bold ${resultTextColorClass}`}
					>
						{userGuess.home_guess}
					</div>
					<div
						className={`absolute right-3 top-1/2 -translate-y-1/2 text-8xl font-bold ${resultTextColorClass}`}
					>
						{userGuess.away_guess}
					</div>
				</>
			)}

			<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md border border-gray-200 relative z-[2]">
				<div className="flex-1 flex items-center gap-2">
					<div className="relative w-12 h-12 flex items-center justify-center">
						<Image
							src={game.home_team.logo_url || "/placeholder.png"}
							alt={game.home_team.name}
							fill
							className="object-contain p-1"
							sizes="48px"
						/>
					</div>
					<span className="font-medium text-gray-900">
						{game.home_team.name}
					</span>
				</div>

				<div className="flex flex-col items-center gap-2 mx-4">
					<span className="text-gray-500 font-bold">Placar</span>
					<div className="flex items-center gap-1">
						<div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md border border-gray-200">
							<span
								className={
									checkValue(game.home_score)
										? "text-gray-900 font-bold"
										: "text-gray-600"
								}
							>
								{checkValue(game.home_score) ? game.home_score : "-"}
							</span>
						</div>
						<span className="text-gray-400 mx-2">x</span>
						<div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md border border-gray-200">
							<span
								className={
									checkValue(game.away_score)
										? "text-gray-900 font-bold"
										: "text-gray-600"
								}
							>
								{checkValue(game.away_score) ? game.away_score : "-"}
							</span>
						</div>
					</div>
					<span className="text-xs text-gray-400 mt-1 font-bold">
						{new Date(game.game_time).toLocaleTimeString("pt-BR", {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</span>
				</div>

				<div className="flex-1 flex items-center justify-end gap-2">
					<span className="font-medium text-gray-900">
						{game.away_team.name}
					</span>
					<div className="relative w-12 h-12 flex items-center justify-center">
						<Image
							src={game.away_team.logo_url || "/placeholder.png"}
							alt={game.away_team.name}
							fill
							className="object-contain p-1"
							sizes="48px"
						/>
					</div>
				</div>
			</div>

			{!userGuess && (
				<div className="absolute right-[38px] top-0 h-full">
					<Button
						onClick={() => onGuess(game.id)}
						variant="secondary"
						title={isPredictionClosed ? "Palpites encerrados" : "Palpitar"}
						className={`bg-emerald-500 hover:bg-emerald-600 text-white font-medium h-full ${isPredictionClosed ? "opacity-50 bg-gray-500 cursor-not-allowed" : "cursor-pointer"}`}
						disabled={isPredictionClosed}
					>
						{isPredictionClosed ? (
							<Ban className="left-[6px] relative" />
						) : (
							<DiamondPlus className="left-[6px] relative" />
						)}
					</Button>
				</div>
			)}
		</div>
	);
}
