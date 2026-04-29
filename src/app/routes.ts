import { createBrowserRouter } from "react-router";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Elenco } from "./pages/Elenco";
import { Partidas } from "./pages/Partidas";
import { Estatisticas } from "./pages/Estatisticas";
import { Sobre } from "./pages/Sobre";
import { Noticias } from "./pages/Noticias";
import { Loja } from "./pages/Loja";
import { Patrocinadores } from "./pages/Patrocinadores";
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
      { path: "elenco", Component: Elenco },
      { path: "partidas", Component: Partidas },
      { path: "estatisticas", Component: Estatisticas },
      { path: "sobre", Component: Sobre },
      { path: "noticias", Component: Noticias },
      { path: "loja", Component: Loja },
      { path: "patrocinadores", Component: Patrocinadores },
    ],
  },
]);