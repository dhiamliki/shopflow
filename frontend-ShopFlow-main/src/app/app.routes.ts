import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { sellerGuard } from './core/guards/seller.guard';
import { sellerOnboardingGuard } from './core/guards/seller-onboarding.guard';
import { AccountShellComponent } from './layouts/account-shell/account-shell.component';
import { PublicShellComponent } from './layouts/public-shell/public-shell.component';
import { SellerShellComponent } from './layouts/seller-shell/seller-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicShellComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePageComponent),
        data: { navMode: 'marketing' }
      },
      {
        path: 'browse',
        loadComponent: () => import('./features/browse/browse.page').then((m) => m.BrowsePageComponent),
        data: { navMode: 'shop' }
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.page').then((m) => m.CategoriesPageComponent),
        data: { navMode: 'shop' }
      },
      {
        path: 'product/:id',
        loadComponent: () =>
          import('./features/product-detail/product-detail.page').then((m) => m.ProductDetailPageComponent),
        data: { navMode: 'shop' }
      },
      {
        path: 'store/:sellerId',
        loadComponent: () => import('./features/store/store.page').then((m) => m.StorePageComponent),
        data: { navMode: 'shop' }
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart.page').then((m) => m.CartPageComponent),
        data: { navMode: 'shop' }
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/checkout/checkout.page').then((m) => m.CheckoutPageComponent),
        canActivate: [authGuard],
        data: { navMode: 'shop' }
      },
      {
        path: 'order-success/:id',
        loadComponent: () =>
          import('./features/order-success/order-success.page').then((m) => m.OrderSuccessPageComponent),
        canActivate: [authGuard],
        data: { navMode: 'shop' }
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPageComponent),
        canActivate: [noAuthGuard],
        data: { navMode: 'auth' }
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register.page').then((m) => m.RegisterPageComponent),
        canActivate: [noAuthGuard],
        data: { navMode: 'auth' }
      },
      {
        path: 'auth',
        redirectTo: '/login'
      },
      {
        path: 'about',
        loadComponent: () => import('./features/about/about.page').then((m) => m.AboutPageComponent),
        data: { navMode: 'marketing' }
      },
      {
        path: 'sell',
        loadComponent: () => import('./features/sell/sell.page').then((m) => m.SellPageComponent),
        data: { navMode: 'marketing' }
      },
      {
        path: 'how-it-works',
        loadComponent: () =>
          import('./features/how-it-works/how-it-works.page').then((m) => m.HowItWorksPageComponent),
        data: { navMode: 'marketing' }
      },
      {
        path: 'seller/onboarding',
        loadComponent: () =>
          import('./features/seller-onboarding/seller-onboarding.page').then(
            (m) => m.SellerOnboardingPageComponent
          ),
        canActivate: [sellerOnboardingGuard],
        data: { navMode: 'marketing' }
      }
    ]
  },
  {
    path: 'account',
    component: AccountShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/account-dashboard/account-dashboard.page').then(
            (m) => m.AccountDashboardPageComponent
          )
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders.page').then((m) => m.OrdersPageComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/order-tracking/order-tracking.page').then(
            (m) => m.OrderTrackingPageComponent
          )
      }
    ]
  },
  {
    path: 'seller',
    component: SellerShellComponent,
    canActivate: [authGuard, sellerGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/seller-dashboard/seller-dashboard.page').then(
            (m) => m.SellerDashboardPageComponent
          )
      },
      {
        path: 'create-listing',
        loadComponent: () =>
          import('./features/create-listing/create-listing.page').then(
            (m) => m.CreateListingPageComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
