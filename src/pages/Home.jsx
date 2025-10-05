import React, { useRef } from "react";
import "../styles/home.css";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer"; // Add this import
import { useNavigate } from "react-router-dom"; // Add this import

const Home = () => {
  const featuresRef = useRef(null);
  const navigate = useNavigate(); // Add this

  const handleGetStartedClick = () => {
    featuresRef.current.scrollIntoView({ behavior: "smooth" });
  };

  // Add handler for About Us navigation
  const handleAboutUsClick = () => {
    navigate("/about_us");
  };

  return (
    <div className="home-root">
      <div className="layout-container">
        <Navbar />
        <main className="main-content">
          <div className="hero-section">
            <div className="hero-image"></div>
          </div>
          <h2 className="welcome-title">Welcome to SmartPark</h2>
          <p className="welcome-description">
            SmartPark is dedicated to providing innovative parking solutions
            that make your life easier. Our mission is to simplify the parking
            experience, saving you time and reducing stress.
          </p>
          <div className="get-started">
            <button className="btn-get-started" onClick={handleGetStartedClick}>
              Get Started
            </button>
            {/* Add About Us button/link here */}
            <button className="btn-about-us" onClick={handleAboutUsClick}>
              About Us
            </button>
          </div>
          <div className="features-section" ref={featuresRef}>
            <h3 className="features-title">Our Features</h3>
            <div className="features-cards">
              <div className="feature-card f1">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3WN2uoiaF08MRvt-T2xA4bRywVnRXurFsjh7kgIdyZRZGYqZE5QtU3xQLBGeNHQ3C0QP77yBrAXRpxSggsRBl1cjCiY0KIg623dAkRVMkDNkphECbcRBZqc7uuAMkpN3SZZp5tSkWFDQP72LDzlmORduk6hyYOgLMjp2TYG6Hz0j8MwQT5bYd33QeRI5nm7Tk0OUWidpeU_aZwzNZB7ExJVWcSN3765r-IQ1Po_jxLIvwVFs1-r-NssZSJY7wn8n6Lqbs2sRMB4wj"
                  alt="Automatic Vehicle Detection"
                  className="feature-image"
                />
                <div className="feature-card-content ">
                  <h4>Automatic Vehicle Detection</h4>
                  <p>
                    Advanced AI-powered vehicle detection system for monitoring
                    entry and exit of vehicles for efficient parking management.
                  </p>
                </div>
              </div>
              <div className="feature-card f2">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6hM0JHJl83MVc7GdLriTPIIvki3p_JbY60YnAMH4nXqVVH-lhY_vxkxPetfZTVxEFPJm80hQwOyrZi9PXH0K0a5lxOcLYL-DZFyJc0IrgMAF_vY8fm2IIGMs-gfmnV8fGE7Im69I1Ma1SPVgjvhti6T0T2pV9G8lmRawwmI3cSCj7b7S88MIX4N3oa-nN3568fc-8iBN47-IPe0J2n4Z7GBcKMMQ1OPjzcTSiPYDDvEflS3VDP_BdHtS3BnVhssvbrjL_VMvKYVtw"
                  alt="Smart Slot Allocation"
                  className="feature-image"
                />
                <div className="feature-card-content ">
                  <h4>Smart Slot Allocation</h4>
                  <p>
                    Assigns the nearest available parking slot instantly,
                    reducing search time and improving efficiency.
                  </p>
                </div>
              </div>
              <div className="feature-card f3">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAP0v1oXTQ4TpvLTX-dJJhv6oTNc9jgGTiwdZGnKMa3AhVzmTrqJd9R09tfQrDGC0tR9qnBB6sif1SkKiHg5B-4FZKwRRAjGSl1_DsDA7M5sxzxAfBW_p3KtWrq8B1btBJsk6eQiF1Y8n6NcgtAOpzAmRY2slpqxq6HP6XS-YLsDgiMSQtZiKqHWgOrQEKVujkVGY9sFIU7JkNlCeMB0SJzIl0AIoXCrQbCW0pvFBmSccUKiHSLf2FC2FVddO0kyr5B1heSGVf_MsjD"
                  alt="Seamless Digital Payments"
                  className="feature-image"
                />
                <div className="feature-card-content">
                  <h4>Seamless Digital Payments</h4>
                  <p>
                    Pay dynamically calculated parking fees via UPI or wallet
                    with staff verification for extra security.
                  </p>
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

export default Home;
