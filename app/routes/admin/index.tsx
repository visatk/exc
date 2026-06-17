import { useLoaderData } from "react-router";
import { getDb } from "../../db";
import { exchanges, users } from "../../db/schema";
import { sql, eq } from "drizzle-orm";
import { requireAdmin } from "../../lib/auth";

export async function loader({ request, context }: any) {
  await requireAdmin(request, context.cloudflare.env);
  const db = getDb(context.cloudflare.env);
  
  // Get stats
  const totalExchanges = await db.select({ count: sql<number>`count(*)` }).from(exchanges).get();
  const pendingExchanges = await db.select({ count: sql<number>`count(*)` }).from(exchanges).where(eq(exchanges.status, 'waiting for confirmation')).get();
  const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users).get();
  
  return { 
    totalExchanges: totalExchanges?.count || 0,
    pendingExchanges: pendingExchanges?.count || 0,
    totalUsers: totalUsers?.count || 0
  };
}

export default function AdminIndex() {
  const stats = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-slate-500 mb-1">Total Exchanges</h3>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.totalExchanges}</p>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl shadow-sm border border-orange-200 dark:border-orange-800">
          <h3 className="text-orange-600 dark:text-orange-400 mb-1">Pending Confirmations</h3>
          <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{stats.pendingExchanges}</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800">
          <h3 className="text-blue-600 dark:text-blue-400 mb-1">Total Users</h3>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.totalUsers}</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Quick Actions</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">Use the sidebar to navigate to specific management sections.</p>
      </div>
    </div>
  );
}
