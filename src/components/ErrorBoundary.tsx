"use client";

import React from "react";

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      const e = this.state.error as any;
      const message = String(e?.message ?? e);
      const stack = String(e?.stack ?? "");
      return (
        <div className="mx-auto max-w-2xl rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-100">
          <div className="font-display text-lg text-rose-200">⚠ Something broke</div>
          <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed">{message}</pre>
          {stack && stack !== message ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-rose-300">stack trace</summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[10px] text-rose-200/80">{stack}</pre>
            </details>
          ) : null}
          <button
            className="mt-4 rounded-2xl border border-rose-400/60 px-4 py-2 text-xs hover:bg-rose-500/20"
            onClick={() => this.setState({ error: null })}
          >
            try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
