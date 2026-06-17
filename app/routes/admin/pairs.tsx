import { useLoaderData, Form, useNavigation } from "react-router";
import { getDb } from "../../db";
import { exchangePairs, gateways } from "../../db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../../lib/auth";

export async function loader({ request, context }: any) {
  await requireAdmin(request, context.cloudflare.env);
  const db = getDb(context.cloudflare.env);
  
  const pairs = await db.select().from(exchangePairs).all();
  const allGateways = await db.select().from(gateways).all();
  
  return { pairs, gateways: allGateways };
}

export async function action({ request, context }: any) {
  await requireAdmin(request, context.cloudflare.env);
  const db = getDb(context.cloudflare.env);
  const formData = await request.formData();
  
  const actionType = formData.get("actionType");
  
  if (actionType === "toggle") {
    const id = formData.get("id") as string;
    const current = formData.get("current") === "true";
    await db.update(exchangePairs).set({ active: !current }).where(eq(exchangePairs.id, id));
  } else if (actionType === "add") {
    await db.insert(exchangePairs).values({
      fromGatewayId: formData.get("fromGatewayId") as string,
      toGatewayId: formData.get("toGatewayId") as string,
      rate: Number(formData.get("rate")),
      reserve: Number(formData.get("reserve")),
      minAmount: Number(formData.get("minAmount")),
      maxAmount: Number(formData.get("maxAmount")),
      active: true,
    });
  } else if (actionType === "update") {
    const id = formData.get("id") as string;
    await db.update(exchangePairs).set({
      rate: Number(formData.get("rate")),
      reserve: Number(formData.get("reserve")),
    }).where(eq(exchangePairs.id, id));
  }
  
  return { success: true };
}

export default function AdminPairs() {
  const { pairs, gateways } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  
  const getGatewayName = (id: string) => gateways.find(g => g.id === id)?.name || id;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Exchange Pairs</h2>
      </div>
      
      {/* Add New Pair */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
        <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-100">Add New Pair</h3>
        <Form method="post" className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <input type="hidden" name="actionType" value="add" />
          
          <div>
            <label className="block text-sm text-slate-600 mb-1">From Gateway</label>
            <select name="fromGatewayId" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none">
              {gateways.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">To Gateway</label>
            <select name="toGatewayId" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none">
              {gateways.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Exchange Rate</label>
            <input type="number" step="0.0001" name="rate" required placeholder="e.g. 115" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Reserve (Dest Currency)</label>
            <input type="number" step="0.01" name="reserve" required placeholder="e.g. 1000" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none" />
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">Min</label>
              <input type="number" name="minAmount" required defaultValue="10" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none" />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">Max</label>
              <input type="number" name="maxAmount" required defaultValue="1000" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none" />
            </div>
          </div>
          <button type="submit" disabled={navigation.state === "submitting"} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded disabled:opacity-50">
            {navigation.state === "submitting" ? "Adding..." : "Add Pair"}
          </button>
        </Form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase text-xs">
            <tr>
              <th className="p-4">Pair</th>
              <th className="p-4">Rate & Reserve</th>
              <th className="p-4">Limits</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pairs.map(p => (
              <tr key={p.id}>
                <td className="p-4 font-medium dark:text-white">
                  {getGatewayName(p.fromGatewayId)} → {getGatewayName(p.toGatewayId)}
                </td>
                <td className="p-4">
                  <Form method="post" className="flex items-center space-x-2">
                    <input type="hidden" name="actionType" value="update" />
                    <input type="hidden" name="id" value={p.id} />
                    <div className="flex flex-col space-y-1">
                      <input type="number" step="0.0001" name="rate" defaultValue={p.rate} className="w-20 border p-1 text-xs rounded dark:bg-slate-800 dark:border-slate-700" title="Rate" />
                      <input type="number" step="0.01" name="reserve" defaultValue={p.reserve} className="w-20 border p-1 text-xs rounded dark:bg-slate-800 dark:border-slate-700" title="Reserve" />
                    </div>
                    <button type="submit" className="text-blue-600 hover:underline text-xs">Save</button>
                  </Form>
                </td>
                <td className="p-4 text-xs">
                  {p.minAmount} - {p.maxAmount}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Form method="post">
                    <input type="hidden" name="actionType" value="toggle" />
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="current" value={p.active.toString()} />
                    <button type="submit" className={`text-xs px-3 py-1 rounded text-white ${p.active ? 'bg-red-500' : 'bg-green-500'}`}>
                      {p.active ? 'Disable' : 'Enable'}
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
