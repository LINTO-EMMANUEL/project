// Utility function to handle secure logout for all roles
export const handleSecureLogout = (navigate) => {
  // Clear all role-specific auth data
  localStorage.removeItem("userId");
  localStorage.removeItem("isUserLoggedIn");
  localStorage.removeItem("staffId");
  localStorage.removeItem("isStaffLoggedIn");
  localStorage.removeItem("adminId");
  localStorage.removeItem("isAdminLoggedIn");

  // Clear any session data
  sessionStorage.clear();

  // Prevent back navigation after logout
  if (window.history && window.history.pushState) {
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = function () {
      window.history.pushState(null, "", window.location.href);
      window.location.replace("/login");
    };
  }

  // Force a complete page reload and redirect to login
  window.location.replace("/login");
};
