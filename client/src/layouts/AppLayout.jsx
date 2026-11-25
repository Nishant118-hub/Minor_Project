import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linksByRole = {
  ADMIN: [
    ['Dashboard', '/admin/dashboard'],
    ['Users', '/admin/users'],
    ['Departments', '/admin/departments'],
    ['Learning', '/admin/learning'],
    ['Campaigns', '/admin/campaigns'],
    ['Reports & Heatmap', '/admin/reports'],
    ['Incidents (SOC)', '/admin/incidents'],
    ['Leaderboard', '/admin/leaderboard']
  ],
  SECURITY_ANALYST: [
    ['Dashboard', '/admin/dashboard'],
    ['Reports & Heatmap', '/admin/reports'],
    ['Incidents (SOC)', '/admin/incidents'],
    ['Leaderboard', '/admin/leaderboard'],
    ['Campaigns', '/admin/campaigns']
  ],
  MANAGER: [
    ['Dashboard', '/manager/dashboard'],
    ['My Team', '/manager/team'],
    ['Reports & Heatmap', '/manager/reports'],
    ['Leaderboard', '/manager/leaderboard']
  ],
  EMPLOYEE: [
    ['Dashboard', '/employee/dashboard'],
    ['Daily Challenge ⚡', '/employee/daily-challenge'],
    ['Simulations', '/employee/simulations'],
    ['Training', '/employee/training'],
    ['Message Analyzer 🔍', '/employee/analyzer'],
    ['Report Incident 🚨', '/employee/incidents'],
    ['Leaderboard 🏆', '/employee/leaderboard'],
    ['Recommendations', '/employee/recommendations'],
    ['Badges & Rank', '/employee/badges'],
    ['Profile', '/employee/profile']
  ]
};

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const links = linksByRole[user.role] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-slate-800 bg-slate-900 p-4 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:p-5 flex flex-col justify-between">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 font-black text-slate-950 shadow-lg shadow-cyan-500/20">CA</div>
            <div>
              <p className="font-bold text-sm tracking-wide">Cyber Awareness</p>
              <p className="text-xs text-slate-400">Enterprise Platform</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {links.map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-cyan-500 font-semibold text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Level and Quick Stats Footer */}
        {user.role === 'EMPLOYEE' && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 hidden md:block">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Security Rank</span>
              <span className="font-semibold text-cyan-400">{user.level || 'Rookie'}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-amber-400 font-medium">🔥 {user.streak?.current || 0} Day Streak</span>
              <span className="text-xs text-emerald-400 font-bold">{user.points || 0} pts</span>
            </div>
            {user.isSecurityChampion && (
              <div className="mt-2 text-center rounded bg-amber-500/10 border border-amber-500/30 py-0.5 text-[11px] font-semibold text-amber-300">
                ⭐ Security Champion
              </div>
            )}
          </div>
        )}
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/60 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <p className="truncate font-medium text-sm sm:text-base">Welcome, {user.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-cyan-400 uppercase">
                  {user.role.replace('_', ' ')}
                </span>
                {user.role === 'EMPLOYEE' && (
                  <span className="text-xs text-slate-400">
                    Tier: <strong className="text-slate-200">{user.level || 'Rookie'}</strong> · Points: <strong className="text-cyan-300">{user.points || 0}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user.role === 'EMPLOYEE' && (
              <NavLink to="/employee/daily-challenge" className="hidden sm:flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors">
                <span>🔥</span> {user.streak?.current || 0} Day Streak
              </NavLink>
            )}
            <button onClick={signOut} className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-xs sm:text-sm text-slate-200 transition-colors hover:bg-slate-800">
              Sign out
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] min-w-0 p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
