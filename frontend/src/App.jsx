import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loader from "./components/Loader";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { STAFF_ROLES } from "./context/contexts";

const Home = lazy(() => import("./pages/Home"));
const Search = lazy(() => import("./pages/Search"));
const Restaurants = lazy(() => import("./pages/Restaurants"));
const RestaurantDetail = lazy(() => import("./pages/RestaurantDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Orders = lazy(() => import("./pages/Orders"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/restaurants/:id" element={<RestaurantDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={STAFF_ROLES}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}

export default App;
