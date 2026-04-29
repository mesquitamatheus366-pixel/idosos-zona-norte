import { Outlet } from "react-router";
import { Navbar } from "../components/Navbar";

export function Layout() {
  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <Navbar />
      <Outlet />
    </div>
  );
}
