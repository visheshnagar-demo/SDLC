import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
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
    console.error("Uncaught error in React ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            backgroundColor: "#090d16",
            color: "#f8fafc",
            minHeight: "100vh",
            fontFamily: "sans-serif",
          }}
        >
          <h2
            style={{ color: "#06b6d4", fontSize: "1.5rem", fontWeight: "bold" }}
          >
            ChipsLedger Pro Application Error
          </h2>
          <p style={{ marginTop: "1rem", color: "#94a3b8" }}>
            Something went wrong during rendering.
          </p>
          <pre
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#020617",
              border: "1px solid #1e293b",
              borderRadius: "0.5rem",
              color: "#f43f5e",
              fontSize: "0.875rem",
            }}
          >
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#06b6d4",
              color: "#020617",
              fontWeight: "bold",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            Reload Application
          </button>
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
