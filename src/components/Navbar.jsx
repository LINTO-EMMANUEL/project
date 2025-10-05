import React from "react";
import { Link } from "react-router-dom";
import "../styles/navbar.css";

const Navbar = () => (
  <header className="navbar">
    <div className="navbar-left">
      <Link className="brand-icon" to="/">
        <img
          src="/vite.svg" // Corrected logo path
          alt="Logo"
          width="30"
          height="30"
          className="brand-logo"
        />
      </Link>
      <h1 className="brand-title ">SmartPark</h1>
    </div>
    <div className="navbar-right">
      <nav className="nav-links">
        <Link className="nav-link" to="/">
          HOME
        </Link>
        <Link className="nav-link" to="/about_us">
          ABOUT US
        </Link>
      </nav>
      <div className="nav-actions">
        <Link
          className="btn btn-secondary"
          to="/login"
          onClick={() => localStorage.removeItem("isAdminLoggedIn")}
        >
          LOGIN
        </Link>
        <Link className="btn btn-primary" to="/register">
          REGISTER
        </Link>
      </div>
    </div>
  </header>
);

export default Navbar;
