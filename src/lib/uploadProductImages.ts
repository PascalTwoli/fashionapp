import { supabase } from "@/integrations/supabase/client";

export const uploadProductImages = async (files: File[]): Promise<string[]> => {
	const urls: string[] = [];

	for (const file of files) {
		// Sanitize filename
		const sanitizedName = file.name
			.replace(/[^a-zA-Z0-9.-]/g, "-")
			.replace(/-+/g, "-")
			.toLowerCase();
		const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedName}`;

		console.log("[uploadProductImages] Uploading file:", fileName);

		const { error } = await supabase.storage
			.from("products")
			.upload(fileName, file, {
				cacheControl: "3600",
				upsert: false,
			});

		if (error) {
			console.error(`[uploadProductImages] Error uploading ${fileName}:`, error);
			throw new Error(`Failed to upload image ${fileName}: ${error.message}`);
		}

		console.log("[uploadProductImages] File uploaded successfully:", fileName);

		const { data } = supabase.storage
			.from("products")
			.getPublicUrl(fileName);

		console.log("[uploadProductImages] Public URL:", data.publicUrl);
		urls.push(data.publicUrl);
	}

	return urls;
};
