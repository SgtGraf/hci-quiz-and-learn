import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import QuizzesPage from "./pages/QuizzesPage";

const App = () => {
  return (
    <Router>
      <Navbar />
      <main className="container my-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
};

export default App;