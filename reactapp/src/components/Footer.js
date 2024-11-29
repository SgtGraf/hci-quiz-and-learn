import React from 'react';
import { Container } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="py-4 fixed-bottom" style={{ backgroundColor: "#6782ab", color: "#fff7f1" }}>
      <Container className="d-flex flex-column flex-md-row justify-content-between align-items-center">
        <div className="text-center text-md-left mb-3 mb-md-0">
          <h5>© 2024 QuizAssist</h5>
        </div>
        <div className="d-flex justify-content-center justify-content-md-end">
          <a href="/" className="text-white mx-3 text-decoration-none">Terms and Conditions</a>
          <a href="/" className="text-white mx-3 text-decoration-none">Privacy Policy</a>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
