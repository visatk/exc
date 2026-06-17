import { useLoaderData, Form, useNavigation } from "react-router";
import { getDb } from "../../db";
import { exchanges, users, referralEarnings } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../../lib/auth";

export async function loader({ request, context }: any) {
  await requireAdmin(request, context.cloudflare.env);
  const db = getDb(context.cloudflare.env);
  
  const allExchanges = await db.select()
    .from(exchanges)
    .orderBy(desc(exchanges.createdAt))
    .all();
    
  return { exchanges: allExchanges };
}

export async function action({ request, context }: any) {
  await requireAdmin(request, context.cloudflare.env);
  const db = getDb(context.cloudflare.env);
  const formData = await request.formData();
  const exchangeId = formData.get("exchangeId") as string;
  const newStatus = formData.get("status") as string;
  
  // Update exchange status
  await db.update(exchanges)
    .set({ status: newStatus, updatedAt: new Date().toISOString() })
    .where(eq(exchanges.id, exchangeId));
    
  if (newStatus === "confirmed") {
    // If there's a referral link attached to this exchange (for real logic, would need to fetch user and see if referredBy is set)
    const exchange = await db.select().from(exchanges).where(eq(exchanges.id, exchangeId)).get();
    if (exchange?.userId) {
      const user = await db.select().from(users).where(eq(users.id, exchange.userId)).get();
      if (user?.referredBy) {
        const referrer = await db.select().from(users).where(eq(users.referralCode, user.referredBy)).get();
        if (referrer) {
          // Grant 1% of send amount as bonus
          const bonus = exchange.amountFrom * 0.01;
          await db.insert(referralEarnings).values({
            userId: referrer.id,
            exchangeId: exchange.id,
            amount: bonus,
            status: "paid"
          });
          
          await db.update(users)
            .set({ balance: referrer.balance + bonus })
            .where(eq(users.id, referrer.id));
        }
      }
    }
  }
  
  return { success: true };
}

export default function AdminExchanges() {
  const { exchanges } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Manage Exchanges</h2>
      
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">User Details</th>
              <th className="px-4 py-3">Amounts</th>
              <th className="px-4 py-3">Tx ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {exchanges.map((ex) => (
              <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{ex.id}</td>
                <td className="px-4 py-3">
                  <div className="text-xs">
                    <p><strong>Name:</strong> {ex.userDetails?.name}</p>
                    <p><strong>Email:</strong> {ex.userDetails?.email}</p>
                    <p><strong>Dest:</strong> {ex.userDetails?.destAccount}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-blue-600">{ex.amountFrom}</span> → <span className="text-green-600">{ex.amountTo}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{ex.txId}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    ex.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    ex.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {ex.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Form method="post" className="inline-block">
                    <input type="hidden" name="exchangeId" value={ex.id} />
                    <input type="hidden" name="status" value="confirmed" />
                    <button 
                      type="submit" 
                      disabled={ex.status === "confirmed" || navigation.state === "submitting"}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-medium disabled:opacity-50"
                    >
                      Confirm
                    </button>
                  </Form>
                  <Form method="post" className="inline-block">
                    <input type="hidden" name="exchangeId" value={ex.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <button 
                      type="submit" 
                      disabled={ex.status === "cancelled" || navigation.state === "submitting"}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
