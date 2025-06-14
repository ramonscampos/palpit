import { Tables } from "@/types/supabase";
import { DiamondPlus } from "lucide-react";
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
	// Dados fake para teste
	const fakeGuess = {
		home_guess: Math.floor(Math.random() * 5),
		away_guess: Math.floor(Math.random() * 5),
	};

	return (
		<div className="px-20 relative">
			{!!userGuess && (
				<>
					<div className="absolute inset-0 bg-gray-100 rounded-xl" />

					<div className="absolute left-3 top-1/2 -translate-y-1/2 text-8xl font-bold text-gray-200">
						{fakeGuess.home_guess}
					</div>
					<div className="absolute right-3 top-1/2 -translate-y-1/2 text-8xl font-bold text-gray-200">
						{fakeGuess.away_guess}
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
							<span className="text-gray-900 font-bold">
								{fakeGuess.home_guess}
							</span>
						</div>
						<span className="text-gray-400">x</span>
						<div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md border border-gray-200">
							<span className="text-gray-900 font-bold">
								{fakeGuess.away_guess}
							</span>
						</div>
					</div>
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
				<div className="absolute right-[38px] top-0 h-[98px]">
					<Button
						onClick={() => onGuess(game.id)}
						variant="secondary"
						title="Palpitar"
						className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium h-full cursor-pointer"
					>
						<DiamondPlus className="left-[6px] relative" />
					</Button>
				</div>
			)}
		</div>
	);
}
