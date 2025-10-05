import React, { useState, useEffect } from "react";
import "../styles/manage-slots.css";
import AdminNavbar from "../components/AdminNavbar";

const ManageSlots = () => {
  // State for slots data
  const [slots, setSlots] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State for add/edit modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [slotData, setSlotData] = useState({
    slotNumber: "",
    slotType: "4-wheeler",
    direction: "",
    status: "available",
    currentVehicle: null,
  });

  // State for search
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSlots, setFilteredSlots] = useState([]);

  // Fetch data from the database
  useEffect(() => {
    fetchSlots();
  }, [currentPage]); // Re-fetch when page changes

  // Update filtered slots when slots or search query changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredSlots(slots);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = slots.filter(
      (slot) =>
        slot.id.toLowerCase().includes(query) ||
        slot.location.toLowerCase().includes(query) ||
        slot.status.toLowerCase().includes(query)
    );
    setFilteredSlots(filtered);
  }, [slots, searchQuery]);

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "text-green-400";
      case "Occupied":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSlotData({
      ...slotData,
      [name]: value,
    });
  };

  // Reset form data
  const resetForm = () => {
    setSlotData({
      slotNumber: "",
      slotType: "4-wheeler",
      direction: "",
      status: "available",
      currentVehicle: null,
    });
  };

  // Handlers for CRUD operations
  const handleAddSlot = () => {
    setModalMode("add");
    resetForm();
    setShowModal(true);
  };

  const handleEditSlot = (id) => {
    setModalMode("edit");
    const slotToEdit = slots.find((slot) => slot.id === id);
    if (slotToEdit) {
      setSlotData({
        slotNumber: slotToEdit.id, // Use id as slotNumber
        slotType: slotToEdit.slotType,
        direction: slotToEdit.direction || slotToEdit.location,
        status: slotToEdit.status,
      });
      setShowModal(true);
    }
  };

  // Extract fetchSlots function to reuse it
  const fetchSlots = async () => {
    setLoading(true);
    try {
      // Update the API URL to include the server address
      const response = await fetch(
        `http://localhost:5000/api/parking-slots?page=${currentPage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch parking slots data: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Fetched slots data:", data); // Debug log

      setSlots(data.slots || []);
      setFilteredSlots(data.slots || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching slots:", err);
      setError("Failed to load parking slots. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Different validation for add vs edit mode
    if (modalMode === "add") {
      // Validate all fields for new slots
      const validationErrors = [];
      if (!slotData.slotNumber) validationErrors.push("Slot Number");
      if (!slotData.slotType) validationErrors.push("Slot Type");
      if (!slotData.direction) validationErrors.push("Direction/Location");

      if (validationErrors.length > 0) {
        alert(
          `Please fill in the following fields: ${validationErrors.join(", ")}`
        );
        return;
      }
    } else {
      // For edit mode, only validate editable fields
      if (!slotData.direction || !slotData.slotType || !slotData.status) {
        alert("Please fill in all required fields");
        return;
      }
    }

    try {
      let response;
      console.log("Submitting data:", slotData);

      if (modalMode === "add") {
        // Log the data being sent for debugging
        console.log("Sending slot data:", slotData);

        response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000"
          }/api/parking-slots`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              slotNumber: slotData.slotNumber,
              slotType: slotData.slotType,
              direction: slotData.direction,
              status: slotData.status,
            }),
            credentials: "include",
          }
        );
      } else {
        response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/parking-slots/${
            slotData.slotNumber
          }`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              direction: slotData.direction,
              status: slotData.status,
              slotType: slotData.slotType,
            }),
            credentials: "include",
          }
        );
      }

      // Log full response for debugging
      console.log("Response status:", response.status);
      const contentType = response.headers.get("content-type");
      console.log("Content type:", contentType);

      if (!response.ok) {
        let errorMessage;

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage =
            errorData.message ||
            `Failed to ${modalMode} slot. Server returned ${response.status}`;
        } else {
          const text = await response.text();
          console.error("Non-JSON error response:", text);
          errorMessage = `Failed to ${modalMode} slot. Server returned ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      // Try to parse the response as JSON
      const result = await response.json();
      console.log("Success:", result);

      // Refresh the slot list after successful add/update
      await fetchSlots();

      // Close the modal
      setShowModal(false);
    } catch (err) {
      console.error(
        `Error ${modalMode === "add" ? "adding" : "updating"} slot:`,
        err
      );
      alert(
        `Failed to ${modalMode === "add" ? "add" : "update"} parking slot. ${
          err.message || "Check the console for details."
        }`
      );
    }
  };

  // Delete slot handler
  const handleDeleteSlot = async (id) => {
    if (window.confirm("Are you sure you want to delete this parking slot?")) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/parking-slots/${id}`,
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to delete slot");
        }

        // Update local state to remove the deleted slot
        setSlots((prev) => prev.filter((slot) => slot.id !== id));
        setFilteredSlots((prev) => prev.filter((slot) => slot.id !== id));
      } catch (err) {
        console.error("Error deleting slot:", err);
        alert(
          err.message || "Failed to delete parking slot. Please try again."
        );
      }
    }
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Handle sidebar toggle
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
              <h2 className="page-title">Manage Parking Slots</h2>
              <p className="page-subtitle">
                View, add, edit, or remove parking slots.
              </p>
            </div>
          </div>

          {/* Search Bar and Add Button - Rearranged to be inline */}
          <div className="search-and-add-container">
            <div className="search-input-wrapper">
              <span className="material-icons search-icon">search</span>
              <input
                type="text"
                placeholder="Search slots by ID, location, or status..."
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
            <button
              className="btn btn-primary add-button"
              onClick={handleAddSlot}
            >
              <span className="material-icons">add</span>
              Add New Slot
            </button>
          </div>

          <div className="card">
            {error && <div className="error-message">{error}</div>}

            {loading ? (
              <div className="loading-indicator">Loading parking slots...</div>
            ) : filteredSlots.length === 0 ? (
              <div className="empty-state">
                {slots.length === 0 ? (
                  <p>No parking slots found. Add a new slot to get started.</p>
                ) : (
                  <p>No parking slots match your search criteria.</p>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="slots-table">
                  <thead>
                    <tr className="table-header">
                      <th style={{ color: "#fff" }}>Slot ID</th>
                      <th style={{ color: "#fff" }}>Location</th>
                      <th style={{ color: "#fff" }}>Type</th>
                      <th style={{ color: "#fff" }}>Status</th>
                      <th style={{ color: "#fff" }}>Vehicle ID</th>
                      <th style={{ color: "#fff" }}>Created At</th>
                      <th style={{ color: "#fff" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSlots.map((slot) => (
                      <tr key={slot._id} className="table-row">
                        <td style={{ color: "#fff" }}>{slot.id}</td>
                        <td style={{ color: "#fff" }}>
                          {slot.direction || slot.location || "Not specified"}
                        </td>
                        <td style={{ color: "#fff" }}>{slot.slotType}</td>
                        <td>
                          <span className={getStatusColor(slot.status)}>
                            {slot.status}
                          </span>
                        </td>
                        <td style={{ color: "#fff" }}>
                          {slot.vehicleId || "N/A"}
                        </td>
                        <td style={{ color: "#fff" }}>
                          {slot.createdAt
                            ? new Date(slot.createdAt).toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="actions-cell">
                          <button
                            className="btn-secondary"
                            onClick={() => handleEditSlot(slot.id)}
                            title="Edit slot"
                          >
                            <span className="material-icons">edit</span>
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => handleDeleteSlot(slot.id)}
                            title="Delete slot"
                          >
                            <span className="material-icons">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Remove pagination controls, just show the table */}
          </div>

          {/* Add/Edit Slot Modal */}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div className="modal-header">
                  <h3>{modalMode === "add" ? "Add New Slot" : "Edit Slot"}</h3>
                  <button
                    className="close-button"
                    onClick={() => setShowModal(false)}
                  >
                    <span className="material-icons">close</span>
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="slot-form">
                  <div className="form-group">
                    <label htmlFor="slotNumber">Slot Number</label>
                    <input
                      type="text"
                      id="slotNumber"
                      name="slotNumber"
                      value={slotData.slotNumber}
                      onChange={(e) =>
                        setSlotData({ ...slotData, slotNumber: e.target.value })
                      }
                      required
                      placeholder="e.g. A-01"
                      disabled={modalMode === "edit"}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="slotType">Slot Type</label>
                    <select
                      id="slotType"
                      name="slotType"
                      value={slotData.slotType}
                      onChange={(e) =>
                        setSlotData({ ...slotData, slotType: e.target.value })
                      }
                      required
                    >
                      <option value="2-wheeler">2-wheeler</option>
                      <option value="4-wheeler">4-wheeler</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="direction">Direction</label>
                    <input
                      type="text"
                      id="direction"
                      name="direction"
                      value={slotData.direction}
                      onChange={(e) =>
                        setSlotData({ ...slotData, direction: e.target.value })
                      }
                      required
                      placeholder="e.g. North Wing"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={slotData.status}
                      onChange={(e) =>
                        setSlotData({ ...slotData, status: e.target.value })
                      }
                      required
                    >
                      <option value="available">Available</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {modalMode === "add" ? "Add Slot" : "Update Slot"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageSlots;
