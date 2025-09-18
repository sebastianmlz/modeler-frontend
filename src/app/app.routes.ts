import { Routes } from '@angular/router';
import { LoginComponent } from './auth/components/login/login.component';
import { DashboardComponent } from './shared/dashboard/dashboard.component';
import { OrganizationListComponent } from './organization/organization-list/organization-list.component';
import { OrganizationDetailComponent } from './organization/organization-detail/organization-detail.component';
import { OrganizationCreateComponent } from './organization/organization-create/organization-create.component';
import { ProjectListComponent } from './project/project-list/project-list.component';
import { ProjectDetailComponent } from './project/project-detail/project-detail.component';
import { ProjectCreateComponent } from './project/project-create/project-create.component';
import { authGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{ path: 'login', component: LoginComponent },
	{
		path: '',
		canActivate: [authGuard],
		children: [
			{ path: 'dashboard', component: DashboardComponent },
			{
				path: 'organization',
				children: [
					{ path: '', component: OrganizationListComponent },
					{ path: 'create', component: OrganizationCreateComponent },
					{ path: ':id', component: OrganizationDetailComponent },
				]
			},
			{
				path: 'project',
				children: [
					{ path: '', component: ProjectListComponent },
					{ path: 'create', component: ProjectCreateComponent },
					{ path: ':id', component: ProjectDetailComponent },
				]
			},
			{
				path: 'diagram',
				   children: [
					   { path: 'list', loadComponent: () => import('./diagram/diagram-list/diagram-list.component').then(m => m.DiagramListComponent) },
					   { path: 'create', loadComponent: () => import('./diagram/diagram-create/diagram-create.component').then(m => m.DiagramCreateComponent) },
					   { path: 'export', loadComponent: () => import('./diagram/diagram-export/diagram-export.component').then(m => m.DiagramExportComponent) },
					   { path: 'show/:id', loadComponent: () => import('./diagram/diagram-show/diagram-show.component').then(m => m.DiagramShowComponent) },
					   { path: 'show/:id/:versionId', loadComponent: () => import('./diagram/diagram-show/diagram-show.component').then(m => m.DiagramShowComponent) },
					   { path: ':id', loadComponent: () => import('./diagram/diagram-detail/diagram-detail.component').then(m => m.DiagramDetailComponent) },
				   ]
			}
		]
	}
];
