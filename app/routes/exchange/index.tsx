import { useLoaderData, Form, useNavigation, redirect, useNavigate } from "react-router";
import { getDb } from "../../db";
import { gateways, exchangePairs } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { useState, useEffect } from "react";
import { exchangeSessionStorage } from "../../lib/auth";

export async function loader({ context, request }: any) {
  const db = getDb(context.cloudflare.env);
  
  const allGateways = await db.select().from(gateways).where(eq(gateways.active, true)).all();
  const allPairs = await db.select().from(exchangePairs).where(eq(exchangePairs.active, true)).all();
  
  return { gateways: allGateways, pairs: allPairs };
}

export async function action({ request, context }: any) {
  const formData = await request.formData();
  const pairId = formData.get("pairId");
  const sendAmount = Number(formData.get("sendAmount"));
  
  if (!pairId || !sendAmount) {
    return { error: "Missing required fields" };
  }
  
  // Validate with DB
  const db = getDb(context.cloudflare.env);
  const pair = await db.select().from(exchangePairs).where(eq(exchangePairs.id, pairId as string)).get();
  
  if (!pair) return { error: "Invalid pair" };
  if (sendAmount < pair.minAmount) return { error: `Minimum amount is ${pair.minAmount}` };
  if (sendAmount > pair.maxAmount) return { error: `Maximum amount is ${pair.maxAmount}` };
  
  const receiveAmount = sendAmount * pair.rate;
  if (receiveAmount > pair.reserve) return { error: "Not enough reserve" };
  
  // Store exchange details in session
  const cookieHeader = request.headers.get("Cookie");
  const session = await exchangeSessionStorage.getSession(cookieHeader);
  
  session.set("pairId", pair.id);
  session.set("sendAmount", sendAmount);
  session.set("receiveAmount", receiveAmount);
  
  return redirect(`/exchange/step-2`, {
    headers: {
      "Set-Cookie": await exchangeSessionStorage.commitSession(session),
    },
  });
}

export default function ExchangeStep1() {
  const { gateways, pairs } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [sendGatewayId, setSendGatewayId] = useState("");
  const [receiveGatewayId, setReceiveGatewayId] = useState("");
  const [sendAmount, setSendAmount] = useState<number | "">("");
  
  const selectedPair = pairs.find(p => p.fromGatewayId === sendGatewayId && p.toGatewayId === receiveGatewayId);
  const receiveAmount = selectedPair && typeof sendAmount === "number" ? sendAmount * selectedPair.rate : "";
  
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Exchange</h1>
        <div className="flex justify-center items-center mt-4 space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">1</div>
            <span className="text-green-500 font-semibold">STEP 1</span>
          </div>
          <div className="w-16 h-px bg-slate-300 dark:bg-slate-700"></div>
          <div className="flex items-center space-x-2 opacity-50">
            <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">2</div>
            <span>STEP 2</span>
          </div>
          <div className="w-16 h-px bg-slate-300 dark:bg-slate-700"></div>
          <div className="flex items-center space-x-2 opacity-50">
            <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">3</div>
            <span>STEP 3</span>
          </div>
        </div>
      </div>

      <Form method="post" className="space-y-6">
        <input type="hidden" name="pairId" value={selectedPair?.id || ""} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Send Section */}
          <div className="space-y-4">
            <label className="block text-lg font-medium text-slate-700 dark:text-slate-200">Amount Send</label>
            <div className="flex items-center space-x-2 border border-slate-300 dark:border-slate-700 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500">
              <input 
                type="number" 
                name="sendAmount"
                value={sendAmount}
                onChange={e => setSendAmount(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-transparent outline-none p-2 text-xl"
                placeholder="0.00"
                required
              />
              <select 
                value={sendGatewayId}
                onChange={e => setSendGatewayId(e.target.value)}
                className="bg-transparent border-none outline-none font-semibold text-slate-700 dark:text-slate-200"
                required
              >
                <option value="">Select Gateway</option>
                {gateways.map(g => <option key={g.id} value={g.id}>{g.name} ({g.currency})</option>)}
              </select>
            </div>
            {selectedPair && (
              <div className="text-sm text-slate-500">
                Min: {selectedPair.minAmount} | Max: {selectedPair.maxAmount}
              </div>
            )}
          </div>

          {/* Receive Section */}
          <div className="space-y-4">
            <label className="block text-lg font-medium text-slate-700 dark:text-slate-200">Amount Receive</label>
            <div className="flex items-center space-x-2 border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-slate-50 dark:bg-slate-800">
              <input 
                type="text" 
                value={receiveAmount}
                readOnly
                className="w-full bg-transparent outline-none p-2 text-xl text-green-600 dark:text-green-400 font-bold"
                placeholder="0.00"
              />
              <select 
                value={receiveGatewayId}
                onChange={e => setReceiveGatewayId(e.target.value)}
                className="bg-transparent border-none outline-none font-semibold text-slate-700 dark:text-slate-200"
                required
              >
                <option value="">Select Gateway</option>
                {gateways.map(g => <option key={g.id} value={g.id}>{g.name} ({g.currency})</option>)}
              </select>
            </div>
            {selectedPair && (
              <div className="text-sm text-slate-500">
                Reserve: {selectedPair.reserve} {gateways.find(g => g.id === receiveGatewayId)?.currency}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
          <button type="button" className="px-6 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Go Back</button>
          <button 
            type="submit" 
            disabled={!selectedPair || !sendAmount || navigation.state === "submitting"}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {navigation.state === "submitting" ? "Processing..." : "Next Step >"}
          </button>
        </div>
      </Form>
    </div>
  );
}
