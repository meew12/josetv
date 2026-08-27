"use client";
import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 text-destructive">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">
            Algo salió mal
          </h2>
          <p className="mb-2 max-w-md text-sm text-muted-foreground">
            Se produjo un error al cargar esta sección.
          </p>
          {this.state.error && (
            <pre className="mb-4 max-w-md overflow-auto rounded-lg bg-card p-3 text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
