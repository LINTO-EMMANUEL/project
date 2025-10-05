import React, { useState, useEffect } from "react";
import "../styles/manage-slots.css"; // Reuse the same CSS
import AdminNavbar from "../components/AdminNavbar";

const ManageUser = () => {
  // State for users data
  const [users, setUsers] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for search
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Fetch data when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Update filtered users when users or search query changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query)) ||
        (user.vehicleNumber &&
          user.vehicleNumber.toLowerCase().includes(query)) ||
        (user.status && user.status.toLowerCase().includes(query))
    );
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  // Status color mapping to match slots style
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-green-400";
      case "rejected":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // If VITE_API_URL is not set, use the default URL
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${baseUrl}/api/users`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch user data");
      }

      const data = await response.json();
      console.log("Received user data:", data); // Debug log

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch user data");
      }

      const sanitizedData = data.users.map((user) => ({
        ...user,
        email: user.login?.email || user.email || "",
        status: user.login?.status || user.status || "pending",
        createdAt:
          user.createdAt || user.login?.createdAt || new Date().toISOString(),
        loginId: user.login?._id, // Explicitly store login ID
      }));

      console.log("Sanitized user data:", sanitizedData); // Debug log
      setUsers(sanitizedData);
      setFilteredUsers(sanitizedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err.message || "Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced handleDelete to follow ManageSlots pattern
  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        // Find the user to get login ID
        const user = users.find((u) => u._id === userId);
        if (!user) {
          throw new Error("User not found");
        }
        if (!user.loginId) {
          throw new Error("Login ID not found for user");
        }

        // Delete using the login ID - this will handle both user and login deletion in a transaction
        const loginResponse = await fetch(
          `http://localhost:5000/api/login/${user.loginId}`, // Use explicit loginId
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!loginResponse.ok) {
          const errorData = await loginResponse.json();
          throw new Error(errorData.message || "Failed to delete user");
        }

        // Update local state to remove the deleted user
        setUsers(users.filter((user) => user._id !== userId));
        setFilteredUsers(filteredUsers.filter((user) => user._id !== userId));

        alert("User deleted successfully");
      } catch (err) {
        console.error("Error deleting user:", err);
        alert(`Failed to delete user: ${err.message}`);
      }
    }
  };

  // Add new block user function with improved error handling
  const handleBlockUser = async (userId, currentStatus) => {
    // Only allow blocking approved users and unblocking rejected users
    if (currentStatus === "pending") {
      alert("Pending users cannot be blocked. They must be approved first.");
      return;
    }

    // Toggle between blocked and approved status
    const newStatus = currentStatus === "rejected" ? "approved" : "rejected";

    if (
      window.confirm(
        `Are you sure you want to ${
          newStatus === "rejected" ? "block" : "unblock"
        } this user?`
      )
    ) {
      try {
        console.log(
          `Attempting to change status of user ${userId} from ${currentStatus} to ${newStatus}`
        );

        // Make API call to update user status
        const response = await fetch(
          `http://localhost:5000/api/login/status/${userId}`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: newStatus }),
          }
        );

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server response:", errorText);
          throw new Error(
            `Failed to ${
              newStatus === "rejected" ? "block" : "unblock"
            } user: ${response.status}`
          );
        }

        const result = await response.json();
        console.log("Success response:", result);

        // Update user status in the local state
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, status: newStatus } : user
          )
        );

        setFilteredUsers(
          filteredUsers.map((user) =>
            user._id === userId ? { ...user, status: newStatus } : user
          )
        );

        alert(
          `User ${
            newStatus === "rejected" ? "blocked" : "unblocked"
          } successfully`
        );
      } catch (err) {
        console.error("Error toggling user status:", err);
        alert(err.message);
      }
    }
  };

  // Update the handleStatusChange function with a more reliable approach
  const handleStatusChange = async (userId, newStatus) => {
    if (
      window.confirm(
        `Are you sure you want to ${
          newStatus === "approved" ? "approve" : "reject"
        } this user?`
      )
    ) {
      try {
        console.log(`Changing user ${userId} status to ${newStatus}`);

        // Use direct URL with domain and port for more reliable connection
        const url = `http://localhost:5000/api/login/status/${userId}`;
        console.log("Sending request to:", url);

        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          // Attempt to get error details from response
          let errorDetails = "Unknown error";
          try {
            const errorData = await response.json();
            errorDetails = errorData.message || response.statusText;
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError);
            errorDetails = response.statusText || `HTTP ${response.status}`;
          }

          throw new Error(`Failed to update user status: ${errorDetails}`);
        }

        const result = await response.json();
        console.log("Status update result:", result);

        // Update local state
        setUsers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, status: newStatus } : user
          )
        );

        setFilteredUsers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, status: newStatus } : user
          )
        );

        alert(`User ${newStatus} successfully`);

        // Refresh the data
        fetchUsers();
      } catch (err) {
        console.error("Error updating user status:", err);
        alert(err.message || "Failed to update user status");
      }
    }
  };

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div
      className="admin-dashboard-root"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <AdminNavbar onToggle={handleSidebarToggle} />
      <div
        className="content-wrapper"
        style={{
          marginLeft: sidebarCollapsed ? "80px" : "260px",
          transition: "margin-left 0.3s ease",
          width: `calc(100% - ${sidebarCollapsed ? "80px" : "260px"})`,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div className="manage-slots-container">
          <div className="header-actions">
            <div>
              <h2 className="page-title">Manage Users</h2>
              <p className="page-subtitle">View or remove user accounts.</p>
            </div>
          </div>

          {/* Search Bar - Match style from ManageSlots */}
          <div className="search-and-add-container">
            <div className="search-input-wrapper">
              <span className="material-icons search-icon">search</span>
              <input
                type="text"
                placeholder="Search users by name, email, or vehicle number..."
                className="search-input"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={() => setSearchQuery("")}
                >
                  <span className="material-icons">close</span>
                </button>
              )}
            </div>
          </div>

          <div className="card" style={{ width: "95%", maxWidth: "1600px" }}>
            {error && <div className="error-message">{error}</div>}

            {loading ? (
              <div className="loading-indicator">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">
                {users.length === 0 ? (
                  <p>No users found in the system.</p>
                ) : (
                  <p>No users match your search criteria.</p>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="slots-table">
                  <thead>
                    <tr className="table-header">
                      <th style={{ color: "#fff" }}>Name</th>
                      <th style={{ color: "#fff" }}>Email</th>
                      <th style={{ color: "#fff" }}>Vehicle Number</th>
                      <th style={{ color: "#fff" }}>Vehicle Type</th>
                      <th style={{ color: "#fff" }}>Status</th>
                      <th style={{ color: "#fff" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="table-row">
                        <td style={{ color: "#fff" }}>{user.name}</td>
                        <td style={{ color: "#fff" }}>{user.email}</td>
                        <td style={{ color: "#fff" }}>{user.vehicleNumber}</td>
                        <td style={{ color: "#fff" }}>{user.vehicleType}</td>
                        <td>
                          <span className={getStatusColor(user.status)}>
                            {user.status}
                          </span>
                        </td>
                        <td className="actions-cell">
                          {user.status === "pending" ? (
                            // For pending users, show approve/reject buttons
                            <>
                              <button
                                className="btn-secondary"
                                onClick={() =>
                                  handleStatusChange(user._id, "approved")
                                }
                                title="Approve User"
                                style={{ backgroundColor: "#10B981" }} // Green color
                              >
                                <span className="material-icons">
                                  check_circle
                                </span>
                              </button>
                              <button
                                className="btn-danger"
                                onClick={() =>
                                  handleStatusChange(user._id, "rejected")
                                }
                                title="Reject User"
                              >
                                <span className="material-icons">cancel</span>
                              </button>
                            </>
                          ) : (
                            // For approved/rejected users, show block and delete buttons
                            <>
                              {user.status === "approved" && (
                                <button
                                  className="btn-danger"
                                  onClick={() =>
                                    handleBlockUser(user._id, user.status)
                                  }
                                  title="Block User"
                                >
                                  <span className="material-icons">block</span>
                                </button>
                              )}
                              {user.status === "rejected" && (
                                <button
                                  className="btn-secondary"
                                  onClick={() =>
                                    handleBlockUser(user._id, user.status)
                                  }
                                  title="Unblock User"
                                >
                                  <span className="material-icons">
                                    lock_open
                                  </span>
                                </button>
                              )}
                              <button
                                className="btn-danger"
                                onClick={() => handleDelete(user._id)}
                                title="Delete User"
                              >
                                <span className="material-icons">delete</span>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUser;
