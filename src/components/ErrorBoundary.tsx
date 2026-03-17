import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, system-ui, sans-serif",
          background: "#f8fafc",
          color: "#1e293b",
          padding: "2rem",
          textAlign: "center",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "#1e3a8a", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 20,
            marginBottom: 24,
          }}>
            N
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Algo deu errado
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, maxWidth: 400 }}>
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Recarregar página
          </button>
          {this.state.error && (
            <details style={{ marginTop: 24, fontSize: 12, color: "#94a3b8", maxWidth: 500 }}>
              <summary style={{ cursor: "pointer" }}>Detalhes técnicos</summary>
              <pre style={{ marginTop: 8, textAlign: "left", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
