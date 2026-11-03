import React from 'react';

export interface HistoryErrorBoundaryProps {
  children: React.ReactNode;
  message?: string;
  resetKey?: unknown;
}

interface HistoryErrorBoundaryState {
  failed: boolean;
}

export class HistoryErrorBoundary extends React.Component<HistoryErrorBoundaryProps, HistoryErrorBoundaryState> {
  state: HistoryErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): HistoryErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Health history section could not be drawn:', error);
  }

  componentDidUpdate(previous: HistoryErrorBoundaryProps) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="rounded-[28px] bg-wa-surface p-5 text-body text-wa-plum">
        {this.props.message ?? "We couldn't draw your chart. Your entries are safe."}
      </div>
    );
  }
}

