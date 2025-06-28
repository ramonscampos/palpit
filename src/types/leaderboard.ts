import { Database } from "./supabase";

export type BrazilBet = Database["public"]["Tables"]["brazil_bet"]["Row"];
export type Game = Database["public"]["Tables"]["games"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Guess = Database["public"]["Tables"]["guesses"]["Row"];
export type ChampionBet = Database["public"]["Tables"]["champion_bet"]["Row"];

export type TeamProgress = {
  games: number;
  eliminated: boolean;
  goalDifference: number;
}; 