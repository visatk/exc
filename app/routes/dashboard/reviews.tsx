import { useOutletContext, useLoaderData, Form, useNavigation } from "react-router";
import { getDb } from "../../db";
import { reviews, exchanges } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../../lib/auth";

export async function loader({ request, context }: any) {
  const user = await requireAuth(request, context.cloudflare.env);
  const db = getDb(context.cloudflare.env);
  
  const userReviews = await db.select()
    .from(reviews)
    .where(eq(reviews.userId, user.id))
    .orderBy(desc(reviews.createdAt))
    .all();
    
  return { reviews: userReviews };
}

export async function action({ request, context }: any) {
  const user = await requireAuth(request, context.cloudflare.env);
  const formData = await request.formData();
  
  const exchangeId = formData.get("exchangeId") as string;
  const rating = Number(formData.get("rating"));
  const comment = formData.get("comment") as string;
  
  const db = getDb(context.cloudflare.env);
  
  await db.insert(reviews).values({
    userId: user.id,
    exchangeId: exchangeId || null,
    rating,
    comment,
  });
  
  return null;
}

export default function Reviews() {
  const { reviews: existingReviews } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">My Reviews</h2>
      
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-6 rounded-xl mb-8">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Write a Review</h3>
        <Form method="post" className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exchange ID (Optional)</label>
            <input type="text" name="exchangeId" className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" placeholder="e.g. 339417856" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rating (1-5)</label>
            <select name="rating" required className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Average</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Terrible</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Comment</label>
            <textarea name="comment" required rows={3} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" placeholder="Share your experience..."></textarea>
          </div>
          <button 
            type="submit" 
            disabled={navigation.state === "submitting"}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {navigation.state === "submitting" ? "Submitting..." : "Submit Review"}
          </button>
        </Form>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Past Reviews</h3>
      {existingReviews.length === 0 ? (
        <div className="text-center py-8 text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg">
          You haven't written any reviews yet.
        </div>
      ) : (
        <div className="space-y-4">
          {existingReviews.map(r => (
            <div key={r.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
              <div className="flex justify-between items-start mb-2">
                <div className="flex space-x-1 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < r.rating ? '★' : '☆'}</span>
                  ))}
                </div>
                <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-sm">{r.comment}</p>
              {r.exchangeId && (
                <p className="text-xs text-slate-400 mt-2">Exchange: #{r.exchangeId}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
