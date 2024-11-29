import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SessionPage from './pages/SessionPage';

const App = () => {
    return (
        <Router>
            <div id="root">
                <Navbar />
                <main className="prevent_overflow">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/session" element={<SessionPage />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
};

export default App;
