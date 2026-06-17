import { Outlet, Link, useLoaderData } from "react-router";
import { requireAuth } from "../lib/auth";
import { getDb } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { LayoutDashboard, User, Users, Star, LogOut, ArrowLeft } from "lucide-react";

export async function loader({ request, context }: any) {
  const sessionUser = await requireAuth(request, context.cloudflare.env);
  const db = getDb(context.cloudflare.env);
  const user = await db.select().from(users).where(eq(users.id, sessionUser.id)).get();
  
  return { user };
}

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof loader>();
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-blue-600" /> Dollarvaly
          </Link>
        </div>
        
        {/* User Card */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center font-bold text-xl mb-3">
            {user?.name.charAt(0)}
          </div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">{user?.name}</h2>
          <p className="text-sm text-slate-500 mb-2">{user?.email}</p>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 mt-4">
            <p className="text-xs text-slate-500 uppercase font-semibold">Account Balance</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">${user?.balance.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/dashboard" className="px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition font-medium flex items-center gap-3">
            <LayoutDashboard className="w-4 h-4" /> Overview
          </Link>
          <Link to="/dashboard/profile" className="px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition font-medium flex items-center gap-3">
            <User className="w-4 h-4" /> Profile
          </Link>
          <Link to="/dashboard/referrals" className="px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition font-medium flex items-center gap-3">
            <Users className="w-4 h-4" /> Referrals
          </Link>
          <Link to="/dashboard/reviews" className="px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition font-medium flex items-center gap-3">
            <Star className="w-4 h-4" /> My Reviews
          </Link>
        </nav>
        
        {/* Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <form method="post" action="/logout">
            <button className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition font-medium flex items-center gap-3">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8">
        <Outlet context={{ user }} />
      </div>
    </div>
  );
}
