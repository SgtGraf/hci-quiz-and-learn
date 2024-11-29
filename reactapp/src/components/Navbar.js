import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Nav} from "react-bootstrap";
import './Navbar.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <Nav className="navbar navbar-expand-lg">
            <Container>
                <Link className="navbar-brand" to="/">QuizAssist</Link>
                {/* Mobile Menu Toggle Button */}
                <button
                    className="navbar-toggler"
                    type="button"
                    onClick={toggleMenu}
                    aria-controls="navbarNav"
                    aria-expanded={isMenuOpen ? "true" : "false"}
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Mobile Menu */}
                <div className={`mobile-menu ${isMenuOpen ? "show" : ""}`} id="navbarNav">
                    <button className="close-btn" onClick={toggleMenu}>X</button>
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <Link className="nav-mobile-link" to="/" onClick={closeMenu}>Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-mobile-link" to="/session" onClick={closeMenu}>Session</Link>
                        </li>
                    </ul>
                </div>

                {/* Desktop Navbar Items */}
                <div className="navbar-collapse">
                    <ul className="navbar-nav ms-auto d-none d-lg-flex">
                        <li className="nav-item">
                            <Link className="nav-link" to="/" onClick={closeMenu}>Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/session" onClick={closeMenu}>Session</Link>
                        </li>
                    </ul>
                </div>
            </Container>
        </Nav>
    );
};

export default Navbar;
