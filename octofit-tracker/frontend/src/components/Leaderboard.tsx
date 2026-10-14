import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => { if (active) setLeaderboard(data.leaderboard); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load rankings.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section aria-labelledby="leaderboard-heading">
    <h2 className="h4" id="leaderboard-heading">Leaderboard</h2>
    <p>Compare team point totals.</p>
    {loading ? <p role="status">Loading leaderboard...</p> : error ? <p role="alert">Unable to load leaderboard: {error}</p> : leaderboard.length === 0 ? <p>No rankings yet.</p> :
      <div className="table-responsive"><table className="table table-striped align-middle"><thead><tr><th scope="col">Rank</th><th scope="col">Team</th><th scope="col">Points</th></tr></thead><tbody>
        {leaderboard.map((entry, index) => <tr key={entry.teamName}><th scope="row">{entry.rank || index + 1}</th><td>{entry.teamName}</td><td>{entry.totalPoints}</td></tr>)}
      </tbody></table></div>}
  </section>;
}
