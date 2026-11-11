import { Component, type ErrorInfo, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error("Application rendering failed:", error.name);
  }
  render() {
    if (this.state.failed)
      return (
        <main>
          <section className="card" role="alert">
            <h1>Something went wrong.</h1>
            <p>
              The page could not be displayed. Reload to try again. No
              successful operation is assumed.
            </p>
            <a className="button button-primary" href="/">
              Reload portal
            </a>
          </section>
        </main>
      );
    return this.props.children;
  }
}
