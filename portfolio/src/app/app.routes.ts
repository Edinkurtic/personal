import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page';
import { Home } from './home/home';
import { SkillOverview } from './skill-overview/skill-overview';

export const routes: Routes = [
    {path: '', component:LandingPage },
    {path:'home',component:Home},
    {path:'skills',component:SkillOverview}
];
