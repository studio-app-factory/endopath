// ============================================================
// ENDOPATH — Top-level error boundary
//
// Wraps the whole app so a single render-time exception doesn't leave
// the user staring at a blank white screen. The user's data lives in
// IndexedDB so a render crash never destroys it; the fallback says so
// and offers a hard reload.
// ============================================================

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // We don't ship a crash-reporting SDK (see privacy policy) so this
    // is just a console line for whoever's hand-debugging.
    console.error('[ErrorBoundary] uncaught render error', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-[#FAF5F0] flex items-center justify-center p-6">
        <div
          role="alert"
          className="max-w-md text-center space-y-4 p-6 rounded-3xl bg-[#FFFAF5] border border-[#E8D5CC] shadow-xl shadow-[#8B3D52]/10"
        >
          <h1 className="text-2xl font-semibold text-[#3D1A24] font-['Cormorant_Garamond']">
            Something went wrong
          </h1>
          <p className="text-sm text-[#7A5560]">
            Endopath hit an unexpected error. Your symptom history, pain map, and cycle data
            are safe — they live on your device, not in this view.
          </p>
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5] text-sm font-semibold shadow-lg shadow-[#C97D7D]/20 cursor-pointer"
          >
            Reload Endopath
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-3 text-left text-[10px] text-[#8B6B78] whitespace-pre-wrap overflow-auto max-h-40">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
