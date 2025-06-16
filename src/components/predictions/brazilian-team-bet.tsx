import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";
import { Database } from "@/types/supabase";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BrazilianTeamModal } from "./brazilian-team-modal";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type BrazilBet = Database["public"]["Tables"]["brazil_bet"]["Row"] & {
  team: Team;
  user: {
    avatar_url: string | null;
    name: string | null;
  };
};

interface BrazilianTeamBetProps {
  currentUserId: string | null;
}

interface GroupedBet {
  team: Team;
  users: Array<{
    avatar_url: string | null;
    name: string | null;
  }>;
}

export function BrazilianTeamBet({ currentUserId }: BrazilianTeamBetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupedBets, setGroupedBets] = useState<GroupedBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [userHasBet, setUserHasBet] = useState(false);

  const loadBets = async () => {
    try {
      const { data, error } = await supabase
        .from("brazil_bet")
        .select(`
          *,
          team:teams(*),
          user:profiles(avatar_url, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const bets = data || [];
      
      // Agrupar palpites por time
      const grouped = bets.reduce((acc: GroupedBet[], bet) => {
        const existingTeam = acc.find(group => group.team.id === bet.team.id);
        
        if (existingTeam) {
          existingTeam.users.push(bet.user);
        } else {
          acc.push({
            team: bet.team,
            users: [bet.user]
          });
        }
        
        return acc;
      }, []);

      // Ordenar por número de votos (decrescente)
      grouped.sort((a, b) => b.users.length - a.users.length);
      
      setGroupedBets(grouped);
      setUserHasBet(bets.some(bet => bet.user_id === currentUserId));

    } catch (error) {
      console.error("Erro ao carregar palpites:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBets();
  }, [currentUserId]);

  // Adicionar um listener para mudanças na tabela brazil_bet
  useEffect(() => {
    const channel = supabase
      .channel('brazil_bet_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brazil_bet'
        },
        () => {
          loadBets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectTeam = async (teamId: string) => {
    if (!currentUserId) return;

    try {
      // Verificar se o usuário já tem um palpite
      const { data: existingBet, error: fetchError } = await supabase
        .from("brazil_bet")
        .select("id")
        .eq("user_id", currentUserId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = "No rows found"
        throw fetchError;
      }

      if (existingBet) {
        // Se já existe, atualiza
        const { error: updateError } = await supabase
          .from("brazil_bet")
          .update({ team_id: teamId })
          .eq("id", existingBet.id);

        if (updateError) throw updateError;
      } else {
        // Se não existe, insere
        const { error: insertError } = await supabase
          .from("brazil_bet")
          .insert({
            user_id: currentUserId,
            team_id: teamId,
          });

        if (insertError) throw insertError;
      }

      await loadBets();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar palpite:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Carregando palpites...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">🇧🇷 Time brasileiro que vai mais longe</h2>
          {currentUserId && !userHasBet && (
            <Button onClick={() => setIsModalOpen(true)} className="bg-gray-700 hover:bg-gray-900 font-bold">
              Fazer Palpite
            </Button>
          )}
        </div>

        {groupedBets.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Ninguém fez palpite ainda. Seja o primeiro!
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groupedBets.map((group) => (
              <div key={group.team.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4 mb-3">
                  {group.team.logo_url && (
                    <Image
                      src={group.team.logo_url}
                      alt={group.team.name}
                      width={40}
                      height={40}
                    />
                  )}
                  <div>
                    <p className="font-bold text-gray-900">{group.team.name}</p>
                    <p className="text-sm text-gray-500">{group.users.length} {group.users.length === 1 ? 'voto' : 'votos'}</p>
                  </div>
                </div>
                <div className="pl-14 space-y-2">
                  {group.users.map((user, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-500">
                      {user.avatar_url && (
                        <Image
                          src={user.avatar_url}
                          alt={user.name || "Usuário"}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      )}
                      <span>{user.name || "Usuário"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <BrazilianTeamModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectTeam={handleSelectTeam}
        />
      </div>
    </div>
  );
} 