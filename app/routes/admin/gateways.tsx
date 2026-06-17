import { useLoaderData, Form, useNavigation } from "react-router";
import { getDb } from "../../db";
import { gateways } from "../../db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../../lib/auth";

export async function loader({ request, context }: any) {
  await requireAdmin(request, context.cloudflare.env);
  const db = getDb(context.cloudflare.env);
  const allGateways = await db.select().from(gateways).all();
  return { gateways: allGateways };
}

export async function action({ request, context }: any) {
  await requireAdmin(request, context.cloudflare.env);
  const db = getDb(context.cloudflare.env);
  const formData = await request.formData();
  
  const actionType = formData.get("actionType");
  
  if (actionType === "toggle") {
    const id = formData.get("id") as string;
    const current = formData.get("current") === "true";
    await db.update(gateways).set({ active: !current }).where(eq(gateways.id, id));
  } else if (actionType === "add") {
    await db.insert(gateways).values({
      name: formData.get("name") as string,
      currency: formData.get("currency") as string,
      type: formData.get("type") as "fiat" | "crypto",
      logoUrl: formData.get("logoUrl") as string,
      active: true,
    });
  }
  
  return { success: true };
}

export default function AdminGateways() {
  const { gateways } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manage Gateways</h2>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
        <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-100">Add New Gateway</h3>
        <Form method="post" className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <input type="hidden" name="actionType" value="add" />
          
          <div>
            <label className="block text-sm text-slate-600 mb-1">Name</label>
            <input type="text" name="name" required placeholder="e.g. Binance Pay" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Currency</label>
            <input type="text" name="currency" required placeholder="e.g. USDT" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Type</label>
            <select name="type" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none">
              <option value="fiat">Fiat</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Logo URL</label>
            <input type="text" name="logoUrl" placeholder="https://..." className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none" />
          </div>
          <button type="submit" disabled={navigation.state === "submitting"} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded disabled:opacity-50">
            {navigation.state === "submitting" ? "Adding..." : "Add Gateway"}
          </button>
        </Form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase text-xs">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Currency</th>
              <th className="p-4">Type</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {gateways.map(g => (
              <tr key={g.id}>
                <td className="p-4 font-medium dark:text-white">{g.name}</td>
                <td className="p-4">{g.currency}</td>
                <td className="p-4 uppercase text-xs">{g.type}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${g.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {g.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Form method="post">
                    <input type="hidden" name="actionType" value="toggle" />
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="current" value={g.active.toString()} />
                    <button type="submit" className={`text-xs px-3 py-1 rounded text-white ${g.active ? 'bg-red-500' : 'bg-green-500'}`}>
                      {g.active ? 'Disable' : 'Enable'}
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
