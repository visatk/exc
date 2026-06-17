import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("exchange", "routes/exchange/index.tsx"),
  route("exchange/step-2", "routes/exchange/step-2.tsx"),
  route("exchange/step-3", "routes/exchange/step-3.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("logout", "routes/logout.tsx"),
  
  route("dashboard", "routes/dashboard.tsx", [
    index("routes/dashboard/index.tsx"),
    route("profile", "routes/dashboard/profile.tsx"),
    route("referrals", "routes/dashboard/referrals.tsx"),
    route("reviews", "routes/dashboard/reviews.tsx"),
  ]),
  
  route("admin", "routes/admin.tsx", [
    index("routes/admin/index.tsx"),
    route("exchanges", "routes/admin/exchanges.tsx"),
    route("pairs", "routes/admin/pairs.tsx"),
    route("gateways", "routes/admin/gateways.tsx"),
    route("users", "routes/admin/users.tsx"),
  ]),
] satisfies RouteConfig;
