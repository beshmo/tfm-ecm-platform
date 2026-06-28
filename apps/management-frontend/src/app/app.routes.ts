import { Routes } from "@angular/router";

import { LoginPageComponent } from "./features/auth/presentation/login-page.component";
import { FolderExplorerPageComponent } from "./features/folder-explorer/presentation/folder-explorer-page.component";

export const routes: Routes = [
  {
    path: "login",
    component: LoginPageComponent
  },
  {
    path: "folders",
    component: FolderExplorerPageComponent
  },
  {
    path: "folders/:folderId",
    component: FolderExplorerPageComponent
  },
  {
    path: "",
    pathMatch: "full",
    redirectTo: "folders"
  },
  {
    path: "**",
    redirectTo: "folders"
  }
];
