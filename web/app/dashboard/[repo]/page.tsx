export default function RepoOverviewPage(props: { params: Promise<{ repo: string }> }) {
  return (
    <div className="emptyState">
      <div className="emptyStateIcon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 7V17C4 19.2091 5.79086 21 8 21H16C18.2091 21 20 19.2091 20 17V7" strokeLinecap="round"/>
          <path d="M9 13L12 16L15 13" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 16V8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 7L20 7" strokeLinecap="round"/>
        </svg>
      </div>
      <h3>No insights recorded yet</h3>
      <p>Run the following command in this repository to perform an initial verification scan and seed the insights dashboard.</p>
      <div className="command-line" style={{ marginTop: '16px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--accepted)' }}>$</span> npx securepush scan
      </div>
    </div>
  );
}
