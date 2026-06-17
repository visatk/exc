import { useLoaderData, Form, useNavigation } from "react-router";
import { getDb } from "../../db";
import { users } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../../lib/auth";

export async function loader({ request, context }: any) {
  await requireAdmin(request, context.cloudflare.env);
  const db = getDb(context.cloudflare.env);
  
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).all();
  return { users: allUsers };
}

export async function action({ request, context }: any) {
  await requireAdmin(request, context.cloudflare.env);
  const db = getDb(context.cloudflare.env);
  const formData = await request.formData();
  
  const actionType = formData.get("actionType");
  const userId = formData.get("userId") as string;
  
  if (actionType === "toggleRole") {
    const currentRole = formData.get("currentRole");
    const newRole = currentRole === "admin" ? "user" : "admin";
    await db.update(users).set({ role: newRole as "user" | "admin" }).where(eq(users.id, userId));
  } else if (actionType === "updateBalance") {
    const newBalance = Number(formData.get("balance"));
    await db.update(users).set({ balance: newBalance }).where(eq(users.id, userId));
  }
  
  return { success: true };
}

export default function AdminUsers() {
  const { users } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manage Users</h2>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase text-xs">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Balance</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="p-4">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{u.name}</div>
                    <div className="text-xs text-slate-500">ID: {u.id.substring(0, 8)}...</div>
                  </td>
                  <td className="p-4">
                    <div>{u.email}</div>
                    <div className="text-xs text-slate-500">{u.phone || 'No phone'}</div>
                  </td>
                  <td className="p-4">
                    <Form method="post" className="flex items-center space-x-2">
                      <input type="hidden" name="actionType" value="updateBalance" />
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="number" step="0.01" name="balance" defaultValue={u.balance} className="w-24 border p-1 rounded text-xs dark:bg-slate-800 dark:border-slate-700" />
                      <button type="submit" className="text-blue-600 hover:underline text-xs">Save</button>
                    </Form>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Form method="post">
                      <input type="hidden" name="actionType" value="toggleRole" />
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="currentRole" value={u.role} />
                      <button type="submit" className={`text-xs px-3 py-1 rounded text-white ${u.role === 'admin' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-purple-500 hover:bg-purple-600'}`}>
                        Make {u.role === 'admin' ? 'User' : 'Admin'}
                      </button>
                    </Form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
