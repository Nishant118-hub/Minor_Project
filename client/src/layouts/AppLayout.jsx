import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linksByRole = {
  ADMIN: [
    ['Dashboard', '/admin/dashboard'], ['Users', '/admin/users'], ['Departments', '/admin/departments'],
    ['Learning', '/admin/learning'], ['Campaigns', '/admin/campaigns'], ['Reports', '/admin/reports']
  ],
  MANAGER: [['Dashboard', '/manager/dashboard'], ['My Team', '/manager/team'], ['Reports', '/manager/reports']],
  EMPLOYEE: [['Dashboard', '/employee/dashboard'], ['Training', '/employee/training'], ['Simulations', '/employee/simulations'], ['Recommendations', '/employee/recommendations'], ['Badges', '/employee/badges'], ['Profile', '/employee/profile']]
};

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const links = linksByRole[user.role] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:grid md:grid-cols-[224px_minmax(0,1fr)]">
      <aside className="border-b border-slate-800 bg-slate-900 p-4 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:p-5">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-500 font-black text-slate-950">CA</div>
          <div><p className="font-semibold">Cyber Awareness</p><p className="text-xs text-slate-400">Training Platform</p></div>
        </div>
        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-cyan-500 font-semibold text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/60 px-4 py-4 sm:px-6">
          <div className="min-w-0"><p className="truncate font-medium">Welcome, {user.name}</p><p className="text-xs uppercase tracking-wide text-cyan-400">{user.role}</p></div>
          <button onClick={signOut} className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-800">Sign out</button>
        </header>
        <main className="mx-auto w-full max-w-[1440px] min-w-0 p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
