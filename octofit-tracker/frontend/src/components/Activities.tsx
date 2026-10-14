import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { _id?: string; user?: string; team?: string; type: string; minutes: number; points: number; occurredAt?: string };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => { if (active) setActivities(data.activities); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load activities.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section aria-labelledby="activities-heading">
    <h2 className="h4" id="activities-heading">Activities</h2>
    <p>Track student activity minutes and points.</p>
    {loading ? <p role="status">Loading activities...</p> : error ? <p role="alert">Unable to load activities: {error}</p> : activities.length === 0 ? <p>No activities yet.</p> :
      <div className="table-responsive"><table className="table table-striped align-middle"><thead><tr><th scope="col">Activity</th><th scope="col">Minutes</th><th scope="col">Points</th><th scope="col">Date</th></tr></thead><tbody>
        {activities.map((activity, index) => <tr key={activity._id ?? `${activity.type}-${index}`}><th scope="row">{activity.type}</th><td>{activity.minutes}</td><td>{activity.points}</td><td>{activity.occurredAt ? new Date(activity.occurredAt).toLocaleDateString() : '—'}</td></tr>)}
      </tbody></table></div>}
  </section>;
}
