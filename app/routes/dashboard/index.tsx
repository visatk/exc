import { useLoaderData } from "react-router";
import { getDb } from "../../db";
import { exchanges, exchangePairs, gateways } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../../lib/auth";

export async function loader({ request, context }: any) {
  const user = await requireAuth(request, context.cloudflare.env);
  const db = getDb(context.cloudflare.env);
  
  const userExchanges = await db.select()
    .from(exchanges)
    .where(eq(exchanges.userId, user.id))
    .orderBy(desc(exchanges.createdAt))
    .all();
    
  // Since D1 joins can be complex in Drizzle, let's fetch pairs and gateways to map
  // In a real app, you'd use Drizzle relational queries
  const allPairs = await db.select().from(exchangePairs).all();
  const allGateways = await db.select().from(gateways).all();
  
  const history = userExchanges.map(ex => {
    const pair = allPairs.find(p => p.id === ex.pairId);
    const fromGw = allGateways.find(g => g.id === pair?.fromGatewayId);
    const toGw = allGateways.find(g => g.id === pair?.toGatewayId);
    return { ...ex, fromGw, toGw, pair };
  });

  return { history };
}

export default function DashboardIndex() {
  const { history } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Exchange History</h2>
      
      {history.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          You haven't made any exchanges yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Exchange ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Direction</th>
                <th className="px-4 py-3">Send</th>
                <th className="px-4 py-3">Receive</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.id}</td>
                  <td className="px-4 py-3">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.fromGw?.name}</span>
                    <span className="mx-2 text-slate-400">→</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.toGw?.name}</span>
                  </td>
                  <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-medium">{item.amountFrom} {item.fromGw?.currency}</td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">{item.amountTo} {item.toGw?.currency}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      item.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      item.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {item.status.toUpperCase()}
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
