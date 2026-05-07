import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface AuthContextType {
	user: User | null;
	profile: Profile | null;
	session: Session | null;
	login: (email: string, password: string) => Promise<{ error: any }>;
	register: (
		name: string,
		email: string,
		password: string,
	) => Promise<{ error: any }>;
	logout: () => Promise<void>;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Set up auth state listener
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log("Auth state changed:", event, session?.user?.id);
			setSession(session);
			setUser(session?.user ?? null);

			if (session?.user) {
				// Fetch user profile
				setTimeout(async () => {
					try {
						const { data: profileData, error } = await supabase
							.from("profiles")
							.select("*")
							.eq("id", session.user.id)
							.maybeSingle();

						if (error) {
							console.warn("Error fetching profile:", error.message);
						} else if (profileData) {
							setProfile(profileData);
						}
					} catch (error) {
						// Silently ignore errors during development
					}
				}, 0);
			} else {
				setProfile(null);
			}

			setIsLoading(false);
		});

		// Check for existing session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);
			setIsLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	const login = async (email: string, password: string) => {
		setIsLoading(true);
		try {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			return { error };
		} finally {
			setIsLoading(false);
		}
	};

	const register = async (name: string, email: string, password: string) => {
		setIsLoading(true);
		try {
			const redirectUrl = `${window.location.origin}/`;

			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					emailRedirectTo: redirectUrl,
					data: {
						name: name,
					},
				},
			});
			return { error };
		} finally {
			setIsLoading(false);
		}
	};

	const logout = async () => {
		await supabase.auth.signOut();
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				profile,
				session,
				login,
				register,
				logout,
				isLoading,
			}}>
			{children}
		</AuthContext.Provider>
	);
};
