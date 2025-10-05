import React from "react";
import styles from "../styles/about_us.module.css";

const Footer = () => (
  <footer className={styles["footer-wrapper"]}>
   
    <div className={styles["footer-container"]}>
      <div className={styles["footer-links"]}>
        <a
          className={styles["footer-link"]}
          href="/src/html/policy.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
        <a
          className={styles["footer-link"]}
          href="/src/html/terms_of_service.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Service
        </a>
      </div>
      <p className={styles["footer-copyright"]}>
        @2024 SmartPark. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
