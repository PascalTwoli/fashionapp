import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Hardcoded admin email list - in production, this should come from environment variables
const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS?.split(',').map((e: string) => e.trim()) || [];

export const useUserRole = () => {
	const { user } = useAuth();
	const [role, setRole] = useState<"admin" | "moderator" | "user" | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchUserRole = useCallback(async () => {
		if (!user) {
			setRole(null);
			setIsLoading(false);
			return;
		}

		try {
			console.log("Fetching user role for user:", user.id);
			
			// First check if user is in admin emails list (fallback for development)
			if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email)) {
				console.log("User is admin (via email list)");
				setRole("admin");
				setIsLoading(false);
				return;
			}

			// Try to fetch from user_roles table
			const { data, error } = await supabase
				.from("user_roles")
				.select("role")
				.eq("user_id", user.id)
				.single();

			if (error) {
				console.warn(
					"Error fetching user role:",
					error.code,
					error.message,
				);
				// If table doesn't exist or row not found, default to user role
				if (
					error.code === "404" ||
					error.code === "PGRST116" ||
					error.code === "42P01" || // table doesn't exist
					error.message?.includes("not found")
				) {
					console.log("Role not found, defaulting to user");
				}
				setRole("user");
			} else if (data) {
				console.log("User role fetched:", data.role);
				setRole(data.role);
			}
		} catch (error) {
			console.error("Error in fetchUserRole:", error);
			setRole("user");
		} finally {
			setIsLoading(false);
		}
	}, [user]);

	useEffect(() => {
		fetchUserRole();
	}, [fetchUserRole, user]);

	return {
		role,
		isLoading,
		isAdmin: role === "admin",
		refetchRole: fetchUserRole,
	};
};
