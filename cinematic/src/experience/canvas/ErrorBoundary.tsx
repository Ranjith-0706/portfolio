'use client';
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onError: (error: unknown) => void;
  fallback?: ReactNode;
}

/** Contains 3D failures so they can never take the portfolio content down with them. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('[3d] recoverable failure — continuing without it', error);
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
