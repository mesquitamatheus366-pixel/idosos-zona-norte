import { createBrowserRouter } from "react-router";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Jogadores } from "./pages/Jogadores";
import { Jogos } from "./pages/Jogos";
import { Estatisticas } from "./pages/Estatisticas";
import { Sorteio } from "./pages/Sorteio";
import { Sobre } from "./pages/Sobre";
import { Login } from "./pages/Login";
import { Admin } from "./pages/Admin";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/admin",
    Component: Admin,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "jogadores", Component: Jogadores },
      { path: "jogos", Component: Jogos },
      { path: "sorteio", Component: Sorteio },
      { path: "estatisticas", Component: Estatisticas },
      { path: "sobre", Component: Sobre },
    ],
  },
]);
