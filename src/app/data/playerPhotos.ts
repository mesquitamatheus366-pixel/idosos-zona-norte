/**
 * Maps player IDs to their static figma:asset photo imports.
 * 
 * Since figma:asset URLs are resolved at build time, they can't be stored
 * in the database. This mapping allows us to re-attach the correct photos
 * to players fetched from the API (where foto is null).
 */

import imgYuriDePaula from "figma:asset/61d0ce58e14f74ec17e19e77e27cfdb3331d716b.png";
import imgMatheusRego from "figma:asset/208864519e3004678961d724b2d220f8f50c7329.png";
import imgMatheusMesquita from "figma:asset/cd50ed2e43930354b66a72b1576ea07d9d3d0edf.png";
import imgLucasAurnheimer from "figma:asset/699b6768936b0645155f5ba06de5e3f18000b188.png";
import imgArthurPetrone from "figma:asset/5015cbbad8c38400832f363672e93b21de6c320b.png";
import imgAndreyGomes from "figma:asset/1f8241c4eb73b223af61565b58de11f8cf09bd79.png";
import imgCoutinho from "figma:asset/9c2cffb7055a146616837f190aa6e520c19c7e23.png";
import imgDayvidCoelho from "figma:asset/2aec0f04c5865ebf41e0315ba1c965806328f879.png";
import imgHugoDortas from "figma:asset/e6b3f2ed047e0934856cc362292091ea7885b668.png";
import imgHenriqueLima from "figma:asset/65eaba53ed9515587832f1e6ca318232ea4647ac.png";
import imgFabricioVieira from "figma:asset/d7c74d2f9a832e3fc215a34c3813c176e976c221.png";
import imgLeandroOscar from "figma:asset/f05085536878f0c2082e96d3cf414764712a28ce.png";
import imgJorgeRibeiro from "figma:asset/b20a4917e3a1076fd3c1d94af4b35c3417cbcc2c.png";
import imgJonathanLima from "figma:asset/86909f062c750ac97e704b363c2aefb8ffa297df.png";
import imgJoaoPedro from "figma:asset/5dfd9e662c17e8c1b6ae0f4d8a67321f392777eb.png";
import imgJhonMarques from "figma:asset/2aa8c5d86e6d6d6d98ca6c160b9f129922a4de3e.png";
import imgHugoDortasNew from "figma:asset/8b5aa6a0e932f2fb86d00ed811a35796a6c992d2.png";

import type { Player } from "./players";

// Map player ID -> static photo URL
const playerPhotoMap: Record<string, string> = {
  "1": imgHugoDortas,       // Erik Mello
  "3": imgJhonMarques,      // Jhon Marques
  "4": imgYuriDePaula,      // Yuri De Paula
  "5": imgMatheusRego,      // Matheus Rego
  "6": imgMatheusMesquita,  // Matheus Mesquita
  "7": imgLucasAurnheimer,  // Lucas Aurnheimer
  "8": imgLeandroOscar,     // Leandro Oscar
  "9": imgHugoDortasNew,    // Hugo Dortas
  "10": imgDayvidCoelho,    // Dayvid Coelho
  "13": imgHenriqueLima,    // Henrique Lima
  "15": imgJonathanLima,    // Jonathan Lima
  "16": imgFabricioVieira,  // Fabricio Vieira
  "17": imgAndreyGomes,     // Andrey Gomes
  "18": imgJoaoPedro,       // Joao Pedro
  "19": imgArthurPetrone,   // Arthur Petrone
  "21": imgCoutinho,        // Coutinho
};

/**
 * Merges static photo URLs into players fetched from the API.
 * If a player already has a foto (e.g. uploaded via admin), it's kept.
 * Otherwise, the static bundled photo is used as fallback.
 */
export function mergePlayerPhotos(players: Player[]): Player[] {
  return players.map((p) => ({
    ...p,
    foto: p.foto || playerPhotoMap[p.id] || null,
  }));
}

export { playerPhotoMap };
