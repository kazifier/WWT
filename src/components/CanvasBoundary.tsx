"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Keeps a 3D viewport failure local.
 *
 * Without a boundary, anything thrown while mounting a react-three-fiber canvas
 * (no WebGL context, a driver issue, a bad geometry) propagates to the route and
 * Next.js replaces the whole page with its "This page couldn't load" error
 * screen — which is exactly what took /model down. Here the drawing area shows a
 * short explanation and the tables, dimensions and schedule on the page survive.
 */
export class CanvasBoundary extends Component<
  { children: ReactNode; label: string; height?: string },
  { message: string | null }
> {
  state: { message: string | null } = { message: null };

  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.label}] 3D view failed:`, error, info.componentStack);
  }

  render() {
    if (this.state.message) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border border-line bg-ink-900 px-4 text-center"
          style={{ height: this.props.height ?? "440px" }}
        >
          <div className="text-[12px] font-semibold text-mist-200">
            {this.props.label} could not be rendered in this browser
          </div>
          <div className="max-w-md text-[11px] leading-relaxed text-mist-400">
            The 3D view needs WebGL. Enable hardware acceleration or open the page in a current browser;
            every dimension, area and schedule on this page is data and stays available.
          </div>
          <div className="font-mono text-[10px] text-mist-600">{this.state.message}</div>
        </div>
      );
    }
    return this.props.children;
  }
}
