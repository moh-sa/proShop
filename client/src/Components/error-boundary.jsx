import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    console.error(error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

export function GlobalErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  return (
    <div>
      <h1>Oops! An error occurred.</h1>
      <p>{error.data || error.statusText || error.message} </p>
      {/* Logging mechanism */}
      <ErrorBoundary error={error} />
    </div>
  );
}
