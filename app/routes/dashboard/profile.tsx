import { useOutletContext, Form, useActionData, useNavigation } from "react-router";
import { getDb } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../lib/auth";

export async function action({ request, context }: any) {
  const user = await requireAuth(request, context.cloudflare.env);
  const formData = await request.formData();
  
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const country = formData.get("country") as string;
  
  const db = getDb(context.cloudflare.env);
  
  await db.update(users)
    .set({ name, phone, address, country })
    .where(eq(users.id, user.id));
    
  return { success: "Profile updated successfully!" };
}

export default function Profile() {
  const { user } = useOutletContext<{ user: any }>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Profile Settings</h2>
      
      {actionData?.success && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm mb-6 border border-green-200 dark:border-green-800">
          {actionData.success}
        </div>
      )}
      
      <Form method="post" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
          <input type="email" defaultValue={user.email} disabled className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 outline-none text-slate-500 cursor-not-allowed" />
          <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
          <input type="text" name="name" defaultValue={user.name} required className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-slate-900 dark:text-slate-100" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
          <input type="tel" name="phone" defaultValue={user.phone || ""} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-slate-900 dark:text-slate-100" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
          <input type="text" name="address" defaultValue={user.address || ""} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-slate-900 dark:text-slate-100" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
          <input type="text" name="country" defaultValue={user.country || ""} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-slate-900 dark:text-slate-100" />
        </div>
        
        <button 
          type="submit" 
          disabled={navigation.state === "submitting"}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 mt-4"
        >
          {navigation.state === "submitting" ? "Saving..." : "Save Changes"}
        </button>
      </Form>
    </div>
  );
}
