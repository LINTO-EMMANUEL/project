import React, { useState, useEffect } from "react";
import StaffNavbar from "../components/StaffNavbar";

const VehicleRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/vehicle-records`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch records");

        const data = await response.json();
        setRecords(data.records || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#1b263b]">
      <StaffNavbar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      <div
        className="flex-1 p-6"
        style={{
          marginLeft: sidebarCollapsed ? "80px" : "256px",
          transition: "margin-left 0.3s ease",
        }}
      >
        <h1 className="text-3xl font-bold text-white mb-6">Vehicle Records</h1>

        {error && (
          <div className="bg-red-600/20 text-red-200 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-white">Loading records...</div>
        ) : (
          <div className="bg-[#0d1b2a] rounded-xl p-6">
            <table className="w-full text-white">
              <thead>
                <tr>
                  <th className="text-left p-3">Vehicle Type</th>
                  <th className="text-left p-3">Vehicle Class</th>
                  <th className="text-left p-3">Entry Time</th>
                  <th className="text-left p-3">Exit Time</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id} className="border-t border-gray-700">
                    <td className="p-3">{record.vehicleType}</td>
                    <td className="p-3">{record.vehicleClass || "Unknown"}</td>
                    <td className="p-3">
                      {new Date(record.entryTime).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {record.exitTime
                        ? new Date(record.exitTime).toLocaleString()
                        : "-"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded ${
                          record.status === "active"
                            ? "bg-green-600"
                            : "bg-red-600"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleRecords;
