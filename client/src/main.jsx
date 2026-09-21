import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            backgroundColor: "#020617",
            color: "#f8fafc",
            fontFamily: "monospace",
          }}
        >
          <h2 style={{ color: "#ef4444" }}>⚠️ Application Render Error</h2>
          <p style={{ marginTop: "1rem", color: "#94a3b8" }}>
            Something went wrong while rendering the UI.
          </p>
          <pre
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "4px",
              overflowX: "auto",
            }}
          >
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
