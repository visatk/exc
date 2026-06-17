import { redirect } from "react-router";
import { sessionStorage } from "../lib/auth";

export async function action({ request }: any) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

export async function loader() {
  return redirect("/");
}
