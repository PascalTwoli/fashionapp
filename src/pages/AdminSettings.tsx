import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Settings are now split into focused pages accessible from the admin dashboard Settings tab.
// This file redirects legacy /admin/settings links back to the dashboard.
export default function AdminSettings() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/admin", { replace: true }); }, [navigate]);
  return null;
}
