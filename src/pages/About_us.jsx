import React from "react";
import styles from "../styles/about_us.module.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"; // Add this import

const teamMembers = [
  {
    name: "Noah Thompson",
    title: "Founder $ CEO",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCB-gliThFa0ofeki9sxb0K7x4_TisMp8HfEGIYlAfFBJ19VBBNWJyPQHdOnwXZXa__YSkjIN5FHtOhWtTV7Pp8CbzEnG5mxdpRvAUFcslzKjDVuJb0JyVsSlRVJy-NFcS8a5zvMIxDOqWdXutIncj0MVgnUxHktP8Wp1v8q8TbCKOqXlehuhmcTxyKaD5d4zgwJUAy_Ev9HNyKZsVK3I834esJSN0_42ald_WtsiVerqQmgrSg3enLAUbhYOAMeiFrPIVJxgAjefZN",
  },
];

const AboutPage = () => {
  return (
    <div className={styles["design-root"]}>
      <div className={styles["layout-container"]}>
        <Navbar />
        <main className={styles["main-content"]}>
          <div className={styles["content-container"]}>
            <div className={styles["page-intro"]}>
              <div className={styles["intro-text"]}>
                <h1 className={styles["page-title"]}>About Us</h1>
                <p className={styles["page-subtitle"]}>
                  Learn more about SmartPark's mission, vision, and values.
                </p>
              </div>
            </div>
            <section className={styles["content-section"]}>
              <h2 className={styles["section-heading"]}>Our Mission</h2>
              <p className={styles["section-paragraph"]}>
                At SmartPark, our mission is to revolutionize the parking
                experience by providing innovative, user-friendly solutions that
                enhance convenience and efficiency for drivers and parking
                operators alike. We strive to create a seamless and stress-free
                parking process, leveraging technology to optimize space
                utilization and improve overall urban mobility.
              </p>
            </section>
            <section className={styles["content-section"]}>
              <h2 className={styles["section-heading"]}>Our Vision</h2>
              <p className={styles["section-paragraph"]}>
                Our vision is to be the leading provider of smart parking
                solutions globally, transforming how people interact with
                parking spaces. We aim to integrate cutting-edge technology with
                sustainable practices, contributing to smarter, more livable
                cities. We envision a future where parking is no longer a hassle
                but a seamless part of the urban experience.
              </p>
            </section>
            <section className={styles["content-section"]}>
              <h2 className={styles["section-heading"]}>Our Values</h2>
              <p className={styles["section-paragraph"]}>
                At SmartPark, we are guided by a set of core values that define
                our approach and commitment: Innovation, Customer-Centricity,
                Integrity, Collaboration, and Sustainability. These values drive
                us to continuously improve our services, prioritize user needs,
                maintain the highest ethical standards, work together
                effectively, and contribute to a greener future.
              </p>
            </section>
            <section className={styles["content-section"]}>
              <h2 className={styles["section-heading"]}>Meet The Founder</h2>
              <div className={styles["team-grid"]}>
                {teamMembers.map((member, index) => (
                  <div key={index} className={styles["team-card"]}>
                    <div className={styles["team-card-image-container"]}>
                      <div
                        className={styles["team-card-image"]}
                        style={{ backgroundImage: `url("${member.imageUrl}")` }}
                      ></div>
                    </div>
                    <div>
                      <p className={styles["team-member-name"]}>
                        {member.name}
                      </p>
                      <p className={styles["team-member-title"]}>
                        {member.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <div className={styles["cta-section-container"]}>
              <div className={styles["cta-content"]}>
                <div className={styles["cta-text-group"]}>
                  <h1 className={styles["cta-heading"]}>Get in Touch</h1>
                  <p className={styles["cta-subheading"]}>
                    Have questions or want to learn more? Reach out to our team
                    today.
                  </p>
                </div>
                <div className={styles["cta-button-wrapper"]}>
                  <button className={styles["cta-button-large"]}>
                    <span className={styles["truncate"]}>Contact Us</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer /> {/* Use the new Footer component */}
      </div>
    </div>
  );
};

export default AboutPage;
