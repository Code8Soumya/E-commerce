import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/store", "routes/store.tsx"),
    route("/products", "routes/products.tsx"),
    route("/products/:id", "routes/products/$id.tsx"),
    route("/login", "routes/login.tsx"),
    route("/register", "routes/register.tsx"),
    route("/profile", "routes/profile.tsx"),
    route("/orders", "routes/orders.tsx"),
    route("/cart", "routes/cart.tsx"),
] satisfies RouteConfig;
