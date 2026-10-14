import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => { if (active) setTeams(data.teams); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load teams.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section aria-labelledby="teams-heading">
    <h2 className="h4" id="teams-heading">Teams</h2>
    <p>Manage teams and members.</p>
    {loading ? <p role="status">Loading teams...</p> : error ? <p role="alert">Unable to load teams: {error}</p> : teams.length === 0 ? <p>No teams yet.</p> :
      <div className="table-responsive"><table className="table table-striped align-middle"><thead><tr><th scope="col">Team</th><th scope="col">Mascot</th><th scope="col">Members</th></tr></thead><tbody>
        {teams.map((team, index) => <tr key={team._id ?? `${team.name}-${index}`}><th scope="row">{team.name}</th><td>{team.mascot}</td><td>{team.members.length}</td></tr>)}
      </tbody></table></div>}
  </section>;
}
