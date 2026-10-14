import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { _id?: string; title: string; focus: string; minutes: number; difficulty: string; reason: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then((data) => { if (active) setSuggestions(data.suggestions); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load workout suggestions.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section aria-labelledby="workouts-heading">
    <h2 className="h4" id="workouts-heading">Workout suggestions</h2>
    <p>Recommended from recent activity and fitness goals.</p>
    {loading ? <p role="status">Loading workout suggestions...</p> : error ? <p role="alert">Unable to load workout suggestions: {error}</p> : suggestions.length === 0 ? <p>No workout suggestions yet.</p> :
      <ul className="list-group">
        {suggestions.map((workout, index) => <li className="list-group-item" key={workout._id ?? `${workout.title}-${index}`}>
          <h3 className="h6 mb-1">{workout.title}</h3>
          <p className="mb-1">{workout.focus} · {workout.minutes} min · {workout.difficulty}</p>
          <p className="mb-0">{workout.reason}</p>
        </li>)}
      </ul>}
  </section>;
}
