"use client";

import { Button } from "@/components/ui/button";
import { Database } from "@/types/supabase";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const router = useRouter();
	const supabase = createClientComponentClient<Database>();

	const handleGoogleSignIn = async () => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${location.origin}/auth/callback`,
				queryParams: {
					access_type: "offline",
					prompt: "consent",
				},
			},
		});
		if (error) {
			console.error("Login Page: Erro no signInWithOAuth:", error.message);
			alert(error.message);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen py-2">
			<main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
				<h1 className="text-4xl font-bold mb-8">Bem-vindo ao Palp.it!</h1>

				<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
					<h2 className="text-2xl font-semibold mb-6 text-gray-800">Entrar</h2>
					<Button
						onClick={handleGoogleSignIn}
						variant="secondary"
						className="w-full py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
					>
						<svg
							className="mr-2 h-4 w-4"
							viewBox="0 0 24 24"
							fill="currentColor"
							xmlns="http://www.w3.org/2000/svg"
						>
							<title>Google logo</title>
							<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.8c1.625 0 3.107.595 4.256 1.574l2.12-2.12c-1.57-1.4-3.66-2.31-5.876-2.31-4.142 0-7.65 2.827-8.877 6.643h3.753c.96-2.52 3.31-4.437 6.124-4.437zm-6.124 9.117c-.822-1.39-1.3-3.007-1.3-4.717 0-.325.025-.644.07-.957h-3.79c-.31 1.077-.48 2.217-.48 3.424 0 2.298.667 4.45 1.83 6.208l2.97-2.97c-.3-.873-.47-1.81-.47-2.788zm10.748 3.513l-2.97-2.97c1.39-.823 2.61-1.996 3.6-3.473h3.81c-.773 2.12-2.186 3.92-4.44 5.343zm-4.624-9.98c0 1.944-.813 3.69-2.12 4.908l-2.97 2.97c1.4.773 2.924 1.25 4.59 1.25 1.62 0 3.107-.596 4.256-1.574l2.12-2.12c-1.57-1.4-3.66-2.31-5.876-2.31z" />
						</svg>
						Entrar com Google
					</Button>
				</div>
			</main>
		</div>
	);
}
