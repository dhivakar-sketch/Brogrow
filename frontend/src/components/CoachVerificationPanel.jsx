export default function CoachVerificationPanel({ athletes = [], onApprove, onReject }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Coach verification</h2>
        <span className="muted">Manual review queue</span>
      </div>

      <div className="coach-verification-list">
        {athletes.map((athlete) => (
          <div className="verification-card" key={athlete.name}>
            <div>
              <strong>{athlete.name}</strong>
              <small>{athlete.sport}</small>
            </div>

            <div className="verification-score">
              <span>AI score</span>
              <strong>{athlete.score}</strong>
            </div>

            <div className="verification-actions">
              <button className="ghost-btn" type="button" onClick={() => onReject?.(athlete)}>Reject</button>
              <button className="primary-btn" type="button" onClick={() => onApprove?.(athlete)}>Approve</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
