import React, { useState } from "react";
import InstallButton from "./pages/InstallButteon";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AppProvider, Frame } from "@shopify/polaris";
import Dashboard from "./pages/Dashboard";
import Customer from "./pages/Cusomter";
import Widget from "./components/ChatWidget";
import "./components/ChatWidget.css";

const App = () => {
  return (
    <Router>
      <Frame>
        <Routes>
          <Route path="/customer/:id" element={<Customer />} />
          <Route path="/login" element={<InstallButton />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/" element={<Widget />} />
        </Routes>
      </Frame>
    </Router>
  );
};

export default App;
