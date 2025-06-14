"use client";

import { supabase } from "@/lib/supabase-client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const router = useRouter();

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full p-8 space-y-8 bg-white shadow-lg rounded-lg">
				<Auth
					supabaseClient={supabase}
					appearance={{ theme: ThemeSupa }}
					providers={["google"]}
					redirectTo={`${location.origin}/auth/callback`}
					localization={{
						variables: {
							sign_in: {
								email_label: "Seu e-mail",
								password_label: "Sua senha",
								email_input_placeholder: "Digite seu e-mail",
								password_input_placeholder: "Digite sua senha",
								button_label: "Entrar",
								social_provider_text: "Entrar com {{provider}}",
								link_text: "Já tem uma conta? Entrar",
							},
							sign_up: {
								email_label: "Seu e-mail",
								password_label: "Crie sua senha",
								email_input_placeholder: "Digite seu e-mail",
								password_input_placeholder: "Crie sua senha forte",
								button_label: "Cadastrar",
								social_provider_text: "Cadastrar com {{provider}}",
								link_text: "Ainda não tem uma conta? Cadastrar",
							},
							forgotten_password: {
								link_text: "Esqueceu sua senha?",
								email_label: "Seu e-mail",
								password_label: "Sua nova senha",
								email_input_placeholder: "Digite seu e-mail de recuperação",
								button_label: "Redefinir senha",
							},
							update_password: {
								password_label: "Sua nova senha",
								password_input_placeholder: "Digite sua nova senha",
								button_label: "Atualizar senha",
							},
						},
					}}
				/>
			</div>
		</div>
	);
}
