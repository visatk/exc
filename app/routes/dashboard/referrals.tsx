import { useOutletContext, useLoaderData } from "react-router";
import { getDb } from "../../db";
import { referralEarnings } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../../lib/auth";

export async function loader({ request, context }: any) {
  const user = await requireAuth(request, context.cloudflare.env);
  const db = getDb(context.cloudflare.env);
  
  const earnings = await db.select()
    .from(referralEarnings)
    .where(eq(referralEarnings.userId, user.id))
    .orderBy(desc(referralEarnings.createdAt))
    .all();
    
  return { earnings };
}

export default function Referrals() {
  const { user } = useOutletContext<{ user: any }>();
  const { earnings } = useLoaderData<typeof loader>();
  
  const totalEarned = earnings.reduce((acc, curr) => acc + curr.amount, 0);
  const refLink = `https://dollarvaly.net/register?ref=${user.referralCode}`;
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Referrals</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-xl">
          <h3 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">Your Referral Link</h3>
          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              readOnly 
              value={refLink} 
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-600 dark:text-slate-300 outline-none" 
            />
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
              Copy
            </button>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Share this link to earn a percentage of your referrals' exchanges.</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-xl flex flex-col justify-center items-center">
          <h3 className="text-green-800 dark:text-green-200 font-semibold mb-1">Total Earned</h3>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">${totalEarned.toFixed(2)}</p>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Earnings History</h3>
      {earnings.length === 0 ? (
        <div className="text-center py-8 text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg">
          No referral earnings yet.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Exchange ID</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map(e => (
                <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-mono">{e.exchangeId}</td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">+${e.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {e.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
