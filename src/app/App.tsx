import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { Component, type ReactNode } from "react";

// Error Boundary to prevent blank screen on crashes
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <h1 className="font-['Anton',sans-serif] text-[#22ff88] text-4xl mb-4">ERRO</h1>
            <p className="text-white/60 font-['Roboto',sans-serif] text-sm mb-4">
              Algo deu errado ao carregar a pagina.
            </p>
            <p className="text-white/30 font-['Roboto',sans-serif] text-xs mb-6 bg-[#151515] p-3 rounded-lg border border-[#222]">
              {this.state.error}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: "" });
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-[#22ff88] text-[#0b0b0b] font-['Roboto',sans-serif] text-sm rounded-lg hover:bg-[#c4a265] transition-colors"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </AuthProvider>
    </ErrorBoundary>
  );
}
