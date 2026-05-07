import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
				// Silently handle if table doesn't exist (404) or no rows found
				if (
					error.code === "404" ||
					error.code === "PGRST116" ||
					error.message?.includes("not found")
				) {
					// Table or row doesn't exist - default to user role
					console.log("Role not found, defaulting to user");
				}
				setRole("user"); // Default to user role
			} else {
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
