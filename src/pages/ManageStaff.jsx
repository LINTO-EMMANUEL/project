import React, { useState, useEffect } from "react";
import "../styles/manage-slots.css";
import AdminNavbar from "../components/AdminNavbar";

const ManageStaff = () => {
  const [staff, setStaff] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStaff, setFilteredStaff] = useState([]);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/staff`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch staff data");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch staff data");
        }

        const sanitizedData = data.staff.map((member) => ({
          ...member,
          email: member.login?.email || member.email || "",
          status: member.login?.status || member.status,
        }));

        setStaff(sanitizedData);
        setFilteredStaff(sanitizedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching staff data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

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

  const handleDelete = async (staffId) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        const staffMember = staff.find((s) => s._id === staffId);
        if (!staffMember) {
          throw new Error("Staff member not found");
        }

        // Delete login record first using loginId
        const loginResponse = await fetch(
          `http://localhost:5000/api/login/${staffMember.login._id}`, // Use loginId
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!loginResponse.ok) {
          throw new Error("Failed to delete staff login data");
        }

        // Then delete the staff details
        const staffResponse = await fetch(
          `http://localhost:5000/api/staff/${staffId}`,
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!staffResponse.ok) {
          console.error(
            "Failed to delete staff details:",
            await staffResponse.text()
          );
        }

        setStaff((prev) => prev.filter((member) => member._id !== staffId));
        setFilteredStaff((prev) =>
          prev.filter((member) => member._id !== staffId)
        );

        alert("Staff member deleted successfully");
      } catch (err) {
        console.error("Error deleting staff:", err);
        alert(`Failed to delete staff member: ${err.message}`);
      }
    }
  };

  // Add new function to handle approve/reject
  const handleStatusChange = async (staffId, newStatus) => {
    if (
      window.confirm(
        `Are you sure you want to ${
          newStatus === "approved" ? "approve" : "reject"
        } this staff member?`
      )
    ) {
      try {
        const staffMember = staff.find((s) => s._id === staffId);
        if (!staffMember) {
          throw new Error("Staff member not found");
        }

        const response = await fetch(
          `http://localhost:5000/api/login/status/${staffMember.login._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ status: newStatus }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server response:", errorText);
          throw new Error(`Failed to update staff status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Status update result:", result);

        // Update local state
        setStaff((prev) =>
          prev.map((member) =>
            member._id === staffId ? { ...member, status: newStatus } : member
          )
        );

        setFilteredStaff((prev) =>
          prev.map((member) =>
            member._id === staffId ? { ...member, status: newStatus } : member
          )
        );

        alert(`Staff member ${newStatus} successfully`);
      } catch (err) {
        console.error("Error updating staff status:", err);
        alert(err.message || "Failed to update staff status");
      }
    }
  };

  // Separate function for block/unblock
  const handleBlockStaff = async (staffId, currentStatus) => {
    if (currentStatus === "pending") {
      alert("Pending staff cannot be blocked. They must be approved first.");
      return;
    }

    const newStatus = currentStatus === "rejected" ? "approved" : "rejected";

    if (
      window.confirm(
        `Are you sure you want to ${
          newStatus === "rejected" ? "block" : "unblock"
        } this staff member?`
      )
    ) {
      try {
        const staffMember = staff.find((s) => s._id === staffId);
        if (!staffMember) {
          throw new Error("Staff member not found");
        }

        const response = await fetch(
          `http://localhost:5000/api/login/status/${staffMember.login._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ status: newStatus }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server response:", errorText);
          throw new Error(
            `Failed to ${
              newStatus === "rejected" ? "block" : "unblock"
            } staff: ${response.status}`
          );
        }

        // Update local state
        setStaff((prev) =>
          prev.map((member) =>
            member._id === staffId ? { ...member, status: newStatus } : member
          )
        );

        setFilteredStaff((prev) =>
          prev.map((member) =>
            member._id === staffId ? { ...member, status: newStatus } : member
          )
        );

        alert(
          `Staff member ${
            newStatus === "rejected" ? "blocked" : "unblocked"
          } successfully`
        );
      } catch (err) {
        console.error("Error toggling staff status:", err);
        alert(err.message || "Failed to update staff status");
      }
    }
  };

  return (
    <div
      className="admin-dashboard-root"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <AdminNavbar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
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
              <h2 className="page-title">Manage Staff</h2>
              <p className="page-subtitle">View and manage staff accounts.</p>
            </div>
          </div>

          <div className="search-and-add-container">
            <div className="search-input-wrapper">
              <span className="material-icons search-icon">search</span>
              <input
                type="text"
                placeholder="Search staff by name, email, or qualification..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              <div className="loading-indicator">Loading staff members...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="empty-state">
                {staff.length === 0 ? (
                  <p>No staff records found in the system.</p>
                ) : (
                  <p>No staff match your search criteria.</p>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="slots-table">
                  <thead>
                    <tr className="table-header">
                      <th style={{ color: "#fff" }}>Name</th>
                      <th style={{ color: "#fff" }}>Email</th>
                      <th style={{ color: "#fff" }}>Qualification</th>
                      <th style={{ color: "#fff" }}>Phone Number</th>
                      <th style={{ color: "#fff" }}>Status</th>
                      <th style={{ color: "#fff" }}>Created At</th>
                      <th style={{ color: "#fff" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((member) => (
                      <tr key={member._id} className="table-row">
                        <td style={{ color: "#fff" }}>{member.name}</td>
                        <td style={{ color: "#fff" }}>
                          {member.email || "N/A"}
                        </td>
                        <td style={{ color: "#fff" }}>
                          {member.qualification}
                        </td>
                        <td style={{ color: "#fff" }}>{member.phone_no}</td>
                        <td>
                          <span className={getStatusColor(member.status)}>
                            {member.status}
                          </span>
                        </td>
                        <td style={{ color: "#fff" }}>
                          {member.createdAt
                            ? new Date(member.createdAt).toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="actions-cell">
                          {member.status === "pending" ? (
                            <>
                              <button
                                className="btn-secondary"
                                onClick={() =>
                                  handleStatusChange(member._id, "approved")
                                }
                                title="Approve Staff"
                                style={{ backgroundColor: "#10B981" }}
                              >
                                <span className="material-icons">
                                  check_circle
                                </span>
                              </button>
                              <button
                                className="btn-danger"
                                onClick={() =>
                                  handleStatusChange(member._id, "rejected")
                                }
                                title="Reject Staff"
                              >
                                <span className="material-icons">cancel</span>
                              </button>
                            </>
                          ) : (
                            <>
                              {member.status === "approved" && (
                                <button
                                  className="btn-danger"
                                  onClick={() =>
                                    handleBlockStaff(member._id, member.status)
                                  }
                                  title="Block Staff"
                                >
                                  <span className="material-icons">block</span>
                                </button>
                              )}
                              {member.status === "rejected" && (
                                <button
                                  className="btn-secondary"
                                  onClick={() =>
                                    handleBlockStaff(member._id, member.status)
                                  }
                                  title="Unblock Staff"
                                >
                                  <span className="material-icons">
                                    lock_open
                                  </span>
                                </button>
                              )}
                              <button
                                className="btn-danger"
                                onClick={() => handleDelete(member._id)}
                                title="Delete Staff"
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

export default ManageStaff;
