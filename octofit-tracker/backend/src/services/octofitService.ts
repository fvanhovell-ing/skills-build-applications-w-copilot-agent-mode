import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw badRequest('Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) throw badRequest('A valid userId is required');
  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) throw badRequest('A valid teamId is required');
  if (typeof type !== 'string' || !type.trim()) throw badRequest('An activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) throw badRequest('Minutes must be a positive number');

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) throw notFound('The specified user or team was not found');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw badRequest('Team details are required');
  const { name, mascot, members = [] } = input;
  if (typeof name !== 'string' || !name.trim()) throw badRequest('A team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw badRequest('A team mascot is required');
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw badRequest('Members must be valid user IDs');
  }
  if (members.length && await User.countDocuments({ _id: { $in: members } }) !== members.length) {
    throw badRequest('Every team member must exist');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0, rank: 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw notFound('No user was found for that email address');

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
    Workout.find().lean(),
  ]);
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  const activityFocus = activities[0]?.type.toLowerCase() === 'strength'
    ? 'strength'
    : activities[0] && ['run', 'cycle', 'walk'].includes(activities[0].type.toLowerCase())
      ? 'endurance'
      : undefined;
  const preferredFocus = workouts.some((workout) => workout.focus.toLowerCase() === goalFocus)
    ? goalFocus
    : activityFocus ?? goalFocus;
  const matchingWorkoutExists = workouts.some((workout) => workout.focus.toLowerCase() === preferredFocus);

  return workouts
    .sort((left, right) => Number(right.focus.toLowerCase() === preferredFocus) - Number(left.focus.toLowerCase() === preferredFocus))
    .map((workout) => ({
      ...workout,
      reason: workout.focus.toLowerCase() === preferredFocus && matchingWorkoutExists
        ? `Recommended to support your ${preferredFocus} goal or recent activity.`
        : `A complementary workout for your ${goalFocus} goal.`,
    }));
}

export { User };
