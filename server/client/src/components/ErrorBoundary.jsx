import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#fff', background: '#111', height: '100vh' }}>
          <h1 style={{ color: 'var(--accent-red)' }}>Oops! Something went wrong.</h1>
          <p>The application crashed while rendering. Please check the console or the error below:</p>
          <pre style={{ background: '#222', padding: '1rem', borderRadius: '8px', overflow: 'auto', textAlign: 'left', marginTop: '1rem' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '1rem' }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
