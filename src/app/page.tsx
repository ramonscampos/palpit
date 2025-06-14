"use client";

import { Button } from "@/components/ui/button";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
	const supabase = createClientComponentClient<Database>();
	const router = useRouter();
	const [userEmail, setUserEmail] = useState<string | null>(null);

	useEffect(() => {
		const getUser = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				setUserEmail(user.email ?? null);
			} else {
				router.push("/login");
			}
		};
		getUser();
	}, [supabase, router]);

	const handleSignOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error("Erro ao sair:", error.message);
			alert("Erro ao sair. Por favor, tente novamente.");
		} else {
			router.push("/login");
			router.refresh();
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen py-2">
			<main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
				<h1 className="text-4xl font-bold mb-8">
					Bem-vindo à Home do Palp.it!
				</h1>
				{userEmail && <p className="text-xl mb-4">Logado como: {userEmail}</p>}

				<Button
					onClick={handleSignOut}
					variant="destructive"
					className="py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
				>
					Sair
				</Button>
			</main>
		</div>
	);
}
