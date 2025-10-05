import { Home, Car, Wallet, User, HelpCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { handleSecureLogout } from "../utils/authUtils";
import "../styles/navbar.css";

const UserNavbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("isUserLoggedIn") === "true";

  const handleLogout = () => {
    handleSecureLogout(navigate);
  };

  return (
    <div className="sidebar">
      {/* Profile Section */}
      <div className="profile-section">
        <img
          src="/src/assets/placeholder.svg"
          alt="Profile"
          className="profile-image"
          width="40"
          height="40"
        />
        <span className="profile-name">Hi, Clara</span>
      </div>

      {/* Navigation */}
      <nav className="nav-menu">
        <Link to="/user_dashboard" className="nav-link">
          <Home size={20} /> <span>Dashboard</span>
        </Link>
        <Link to="/parking" className="nav-link">
          <Car size={20} /> <span>Parking</span>
        </Link>
        <Link
          to={isAuthenticated ? "/user_wallet" : "/login"}
          className="nav-link"
        >
          <Wallet size={20} /> <span>Wallet</span>
        </Link>
        <Link to="/account" className="nav-link">
          <User size={20} /> <span>Account</span>
        </Link>
        <Link to="/help" className="nav-link">
          <HelpCircle size={20} /> <span>Help</span>
        </Link>
      </nav>

      {/* Logout Button */}
      <div className="logout-section">
        <button onClick={handleLogout} className="btn btn-danger">
          <span className="material-icons">logout</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserNavbar;
