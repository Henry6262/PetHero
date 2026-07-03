import React from "react";
import { createRoot } from "react-dom/client";
import OperatorDashboard from "./components/OperatorDashboard";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OperatorDashboard />
  </React.StrictMode>
);
