import { Outlet, Link, useLoaderData } from "react-router";
import { requireAdmin } from "../lib/auth";
import { LayoutDashboard, ArrowLeftRight, Settings, CreditCard, Users, LogOut, ArrowLeft } from "lucide-react";

export async function loader({ request, context }: any) {
  const user = await requireAdmin(request, context.cloudflare.env);
  return { user };
}

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();
  
  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950">
      {/* Admin Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-4 bg-slate-950 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            Dollarvaly Admin
          </h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          <Link to="/admin" className="px-4 py-2 hover:bg-slate-800 hover:text-white transition flex items-center gap-3">
            <LayoutDashboard className="w-4 h-4" /> Dashboard Overview
          </Link>
          <Link to="/admin/exchanges" className="px-4 py-2 hover:bg-slate-800 hover:text-white transition flex items-center gap-3">
            <ArrowLeftRight className="w-4 h-4" /> Manage Exchanges
          </Link>
          <Link to="/admin/pairs" className="px-4 py-2 hover:bg-slate-800 hover:text-white transition flex items-center gap-3">
            <Settings className="w-4 h-4" /> Exchange Pairs
          </Link>
          <Link to="/admin/gateways" className="px-4 py-2 hover:bg-slate-800 hover:text-white transition flex items-center gap-3">
            <CreditCard className="w-4 h-4" /> Gateways
          </Link>
          <Link to="/admin/users" className="px-4 py-2 hover:bg-slate-800 hover:text-white transition flex items-center gap-3">
            <Users className="w-4 h-4" /> Users
          </Link>
        </nav>
        
        <div className="p-4 bg-slate-950 space-y-2">
          <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Site
          </Link>
          <form method="post" action="/logout">
            <button type="submit" className="text-sm text-red-400 hover:text-red-300 flex items-center gap-2 w-full text-left">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <Outlet context={{ user }} />
      </div>
    </div>
  );
}
