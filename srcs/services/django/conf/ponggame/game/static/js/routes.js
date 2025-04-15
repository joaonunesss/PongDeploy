import { homePage } from "./home.js";
import { registerPage } from "./register.js";
import { profilePage } from "./profile.js";
import { gamePage } from "./game.js";
import { loginPage } from "./login.js";
import { handleOAuthCallback } from "./apiPage.js";
import { tournamentPage } from "./tournament.js";
import { tournamentBracketsPage, tournamentAliasPage } from "./tournamentRoom.js";

/* Django/Nginx routes */
const routes = [
    {path: "/", component: homePage},
    {path: "/game/:Gamemode", component: gamePage},
    {path: "/profile/:username", component: profilePage},
    {path: "/register", component: registerPage},
    {path: "/login", component: loginPage},
    {path: "/tournament", component: tournamentPage},
    {path: "/tournament/brackets", component: tournamentBracketsPage},
    {path: "/tournament/alias", component: tournamentAliasPage},
    {path: "/auth/callback", component: handleOAuthCallback }
];

/* VsCode Liver Server routes */
/* const routes = [
    {path: "/templates/index.live.html", component: tournamentBracketsPage},
    {path: "/game", component: gamePage},
    {path: "/profile/:username", component: profilePage},
    {path: "/register", component: registerPage},
    {path: "/login", component: loginPage},
    {path: "/tournament", component: tournamentPage},
    {path: "/tournament/room", component: tournamentBracketsPage}
]; */

export default routes;
