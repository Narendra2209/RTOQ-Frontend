import { Component } from 'react';

// If something on the page breaks, say so and offer a fresh start instead of a blank page.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section id="start">
        <h2>Something went wrong on this page.</h2>
        <p>{String(this.state.error.message || this.state.error)}</p>
        <button className="btn" onClick={() => window.location.reload()}>Start again</button>
      </section>
    );
  }
}
