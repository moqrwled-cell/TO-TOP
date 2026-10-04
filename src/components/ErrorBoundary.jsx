import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#ff6b6b', background: '#1a1a1a', minHeight: '100vh', direction: 'ltr', textAlign: 'left' }}>
          <h2>Something went wrong in the app!</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', background: '#000', padding: '1rem', borderRadius: '8px' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '1rem', color: '#fff' }}>Click to view details (Send a screenshot of this to the developer)</summary>
            <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
            <p><strong>Component Stack:</strong> {this.state.errorInfo && this.state.errorInfo.componentStack}</p>
          </details>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: '2rem', padding: '1rem 2rem', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Clear Data and Reload
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
