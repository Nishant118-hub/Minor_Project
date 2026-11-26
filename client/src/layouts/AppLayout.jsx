import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BinaryMatrixRain from '../components/BinaryMatrixRain';

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
  const [matrixActive, setMatrixActive] = useState(true);
  const links = linksByRole[user.role] || [];

  return (
    <div className="relative min-h-screen bg-black text-slate-100 md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      {/* Falling Green Binary Matrix Rain Canvas */}
      {matrixActive && <BinaryMatrixRain opacity={0.35} />}

      {/* Sidebar */}
      <aside className="relative z-10 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md p-4 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:p-5 flex flex-col justify-between">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-500 font-black text-slate-950 shadow-lg shadow-cyan-500/25">
              CA
            </div>
            <div>
              <p className="font-bold text-sm tracking-wide text-slate-100">Cyber Awareness</p>
              <p className="text-xs text-cyan-400 font-mono tracking-wider">SEC::TERMINAL</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {links.map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-500 font-semibold text-slate-950 shadow-matrix'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-cyan-300'
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
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3 hidden md:block">
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

      {/* Main Content Area */}
      <div className="relative z-10 min-w-0">
        <header className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/85 backdrop-blur-md px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <p className="truncate font-medium text-sm sm:text-base">Welcome, {user.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-cyan-400 uppercase">
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
            {/* Matrix Rain Effect Toggle */}
            <button
              onClick={() => setMatrixActive(!matrixActive)}
              title="Toggle Matrix Binary Rain Background"
              className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-mono transition-colors ${
                matrixActive
                  ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-950/60'
                  : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={matrixActive ? 'text-cyan-400 animate-pulse' : ''}>0101</span>
              <span>Matrix FX: {matrixActive ? 'ON' : 'OFF'}</span>
            </button>

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
        <main className="mx-auto w-full max-w-[1440px] min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
