import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize, map, of, switchMap } from 'rxjs';
import { AddressPayload, Product } from '../../core/models/commerce.models';
import { AddressService } from '../../core/services/address.service';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import { SessionService } from '../../core/services/session.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    EmptyStateComponent,
    IconComponent,
    PanelCardComponent
  ],
  template: `
    <section class="sf-page py-8">
      @if (!session.isCustomer()) {
        <app-empty-state
          icon="lock"
          title="Buyer checkout only"
          message="Secure checkout is available for customer accounts. Sign in with a buyer account to place an order."
        >
          <a routerLink="/auth" [queryParams]="{ mode: 'login', redirect: '/checkout' }" class="button-primary px-8">
            Sign in to checkout
          </a>
        </app-empty-state>
      } @else if (!enrichedItems().length) {
        <app-empty-state
          icon="bag"
          title="Nothing to check out yet"
          message="Add a few products to your cart before heading to secure checkout."
        >
          <a routerLink="/browse" class="button-primary px-8">Browse products</a>
        </app-empty-state>
      } @else {
        <nav class="mb-7 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <a routerLink="/cart" class="hover:text-white">Cart</a>
          <span>&rsaquo;</span>
          <span class="text-zinc-300">Checkout</span>
          <span>&rsaquo;</span>
          <span>Order Complete</span>
        </nav>

        <div class="grid gap-10 xl:grid-cols-[1fr,560px]">
          <section class="space-y-7" [formGroup]="checkoutForm">
            <div class="space-y-3">
              <h1 class="font-display text-5xl font-semibold tracking-[-0.05em] text-white">Checkout</h1>
              <p class="text-lg text-zinc-400">
                Complete your order by providing your details and payment information.
              </p>
              <p class="inline-flex items-center gap-2 text-sm text-zinc-400">
                <app-icon name="lock" [size]="15" className="text-zinc-400" />
                All transactions are secure and encrypted.
              </p>
            </div>

            <div class="panel-dark space-y-7 p-6 sm:p-7">
              <section class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-white">1</span>
                  <h2 class="text-base font-semibold text-white">Shipping Information</h2>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <input class="input-dark" formControlName="fullName" placeholder="Full Name" />
                  <input class="input-dark" formControlName="email" placeholder="Email Address" />
                  <input class="input-dark sm:col-span-2" formControlName="phoneNumber" placeholder="Phone Number" />
                  <input class="input-dark sm:col-span-2" formControlName="street" placeholder="Street Address" />
                  <input class="input-dark" formControlName="apartment" placeholder="Apartment, suite, etc. (optional)" />
                  <input class="input-dark" formControlName="city" placeholder="City" />
                  <input class="input-dark" formControlName="state" placeholder="State / Province" />
                  <input class="input-dark" formControlName="postalCode" placeholder="ZIP / Postal Code" />
                  <input class="input-dark" formControlName="country" placeholder="Country" />
                </div>
              </section>

              <section class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-white">2</span>
                  <h2 class="text-base font-semibold text-white">Shipping Method</h2>
                </div>

                <label class="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-5 py-4">
                  <span class="flex items-center gap-4">
                    <input type="radio" formControlName="shippingMethod" value="standard" class="accent-emerald-400" />
                    <span>
                      <span class="block text-lg font-semibold text-white">Standard Shipping</span>
                      <span class="text-sm text-zinc-400">Est. delivery: 2 to 4 business days</span>
                    </span>
                  </span>
                  <span class="text-lg font-semibold text-white">Free</span>
                </label>

                <label class="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-5 py-4">
                  <span class="flex items-center gap-4">
                    <input type="radio" formControlName="shippingMethod" value="express" class="accent-emerald-400" />
                    <span>
                      <span class="block text-lg font-semibold text-white">Express Shipping</span>
                      <span class="text-sm text-zinc-400">Arrives sooner for time-sensitive orders</span>
                    </span>
                  </span>
                  <span class="text-lg font-semibold text-white">$9.99</span>
                </label>
              </section>

              <section class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-white">3</span>
                  <h2 class="text-base font-semibold text-white">Payment Method</h2>
                </div>

                <div class="grid gap-4 lg:grid-cols-[0.58fr,0.42fr]">
                  <div class="space-y-3">
                    @for (method of paymentMethods; track method.value) {
                      <label class="flex items-center gap-4 rounded-md border border-white/10 bg-white/[0.03] px-5 py-4">
                        <input type="radio" formControlName="paymentMethod" [value]="method.value" class="accent-emerald-400" />
                        <span class="flex items-center gap-3">
                          <app-icon [name]="method.icon" [size]="18" className="text-zinc-200" />
                          <span class="text-lg font-semibold text-white">{{ method.label }}</span>
                        </span>
                      </label>
                    }
                  </div>

                  <div class="space-y-3">
                    <input class="input-dark" formControlName="cardNumber" placeholder="Card Number" />
                    <div class="grid grid-cols-2 gap-3">
                      <input class="input-dark" formControlName="expirationDate" placeholder="MM / YY" />
                      <input class="input-dark" formControlName="cvc" placeholder="CVV" />
                    </div>
                    <input class="input-dark" formControlName="nameOnCard" placeholder="Name on Card" />
                  </div>
                </div>
              </section>

              @if (orderError()) {
                <p class="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {{ orderError() }}
                </p>
              }

              <button type="button" class="button-primary w-full text-base" (click)="placeOrder()" [disabled]="submitting()">
                Place Order <span>&bull;</span> <strong>{{ summary().total | currency: 'USD' : 'symbol' : '1.2-2' }}</strong>
                <app-icon name="lock" [size]="16" className="ml-auto text-black" />
              </button>
            </div>
          </section>

          <aside class="space-y-5">
            <app-panel-card title="Order Summary" className="sticky top-28">
              <div class="space-y-4">
                @for (item of enrichedItems(); track item.id) {
                  <div class="flex items-center gap-4">
                    <img class="h-20 w-20 rounded-[18px] object-cover" [src]="item.product.imageUrls[0]" [alt]="item.productName" />
                    <div class="min-w-0 flex-1">
                      <p class="line-clamp-2 text-base font-semibold text-white">{{ item.productName }}</p>
                      <p class="mt-1 text-sm text-zinc-400">{{ item.variantLabel || 'Standard' }}</p>
                    </div>
                    <p class="text-lg font-semibold text-white">{{ item.totalPrice | currency: 'USD' : 'symbol' : '1.2-2' }}</p>
                  </div>
                }
              </div>

              <div class="my-6 border-t border-white/8"></div>

              <div class="space-y-4 text-base">
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Subtotal</span>
                  <span class="text-white">{{ summary().subtotal | currency: 'USD' : 'symbol' : '1.2-2' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Shipping</span>
                  <span class="text-emerald-300">
                    {{ summary().shipping === 0 ? 'Free' : (summary().shipping | currency: 'USD' : 'symbol' : '1.2-2') }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Estimated Taxes</span>
                  <span class="text-white">{{ summary().taxes | currency: 'USD' : 'symbol' : '1.2-2' }}</span>
                </div>
              </div>

              <div class="my-6 border-t border-white/8"></div>

              <div class="flex items-center justify-between">
                <span class="text-2xl font-semibold text-white">Total</span>
                <span class="text-4xl font-semibold tracking-tight text-white">
                  {{ summary().total | currency: 'USD' : 'symbol' : '1.2-2' }}
                </span>
              </div>

              <div class="mt-8 space-y-4 rounded-[24px] border border-white/8 bg-white/[0.02] p-5">
                @for (trust of trustPoints; track trust.title) {
                  <div class="flex items-start gap-4">
                    <span class="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                      <app-icon [name]="trust.icon" [size]="18" className="text-zinc-100" />
                    </span>
                    <div>
                      <p class="text-lg font-semibold text-white">{{ trust.title }}</p>
                      <p class="text-sm leading-6 text-zinc-400">{{ trust.body }}</p>
                    </div>
                  </div>
                }
              </div>
            </app-panel-card>
          </aside>
        </div>
      }
    </section>
  `
})
export class CheckoutPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly catalog = inject(CatalogService);
  private readonly addressService = inject(AddressService);
  readonly cartService = inject(CartService);
  private readonly ordersService = inject(OrdersService);
  readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly orderError = signal('');
  readonly selectedAddressId = signal<number | null>(null);

  readonly checkoutForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    street: ['', Validators.required],
    apartment: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postalCode: ['', Validators.required],
    country: ['United States', Validators.required],
    shippingMethod: 'standard',
    paymentMethod: 'card',
    cardNumber: ['', Validators.required],
    expirationDate: ['', Validators.required],
    cvc: ['', Validators.required],
    nameOnCard: ['', Validators.required]
  });

  readonly enrichedItems = toSignal(
    toObservable(this.cartService.cart).pipe(
      switchMap((cart) => {
        if (!cart.items.length) {
          return of([] as Array<{ id: number; product: Product; productName: string; variantLabel: string | null; totalPrice: number }>);
        }

        return this.catalog.getProductsByIds(cart.items.map((item) => item.productId)).pipe(
          map((products) =>
            cart.items.map((item) => ({
              ...item,
              product: products.find((product) => product.id === item.productId) ?? products[0]
            }))
          )
        );
      })
    ),
    { initialValue: [] }
  );

  readonly summary = computed(() => {
    const subtotal = this.enrichedItems().reduce((total, item) => total + item.totalPrice, 0);
    const shipping = this.checkoutForm.controls.shippingMethod.value === 'express' ? 9.99 : 0;
    const taxes = subtotal * 0.08;

    return {
      subtotal,
      shipping,
      taxes,
      total: subtotal + shipping + taxes
    };
  });

  readonly paymentMethods = [
    { value: 'card', label: 'Credit / Debit Card', icon: 'card' },
    { value: 'paypal', label: 'PayPal', icon: 'wallet' },
    { value: 'apple-pay', label: 'Apple Pay', icon: 'bag' }
  ];

  readonly trustPoints = [
    {
      icon: 'shield-check',
      title: 'Secure Payments',
      body: 'Your payment information is encrypted and secure.'
    },
    {
      icon: 'arrow-left',
      title: '30-Day Returns',
      body: 'Not satisfied? Get a full refund within 30 days.'
    }
  ];

  constructor() {
    this.cartService.loadCart().subscribe();
    this.addressService.loadAddresses().subscribe();

    const user = this.session.user();
    if (user) {
      this.checkoutForm.patchValue({
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        nameOnCard: `${user.firstName} ${user.lastName}`
      });
    }

    effect(() => {
      const primary =
        this.addressService.addresses().find((address) => address.principal) ??
        this.addressService.addresses()[0];
      if (!primary) {
        return;
      }

      this.selectedAddressId.set(primary.id);
      this.checkoutForm.patchValue(
        {
          street: primary.street,
          city: primary.city,
          postalCode: primary.postalCode,
          country: primary.country
        },
        { emitEvent: false }
      );
    });
  }

  placeOrder(): void {
    this.orderError.set('');

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.orderError.set('Please complete the required fields before placing your order.');
      return;
    }

    this.submitting.set(true);

    const value = this.checkoutForm.getRawValue();
    const payload: AddressPayload = {
      street: [value.street, value.apartment].filter(Boolean).join(', '),
      city: value.city,
      postalCode: value.postalCode,
      country: value.country,
      principal: true
    };

    const addressId$ = this.selectedAddressId()
      ? of(this.selectedAddressId()!)
      : this.addressService.createAddress(payload).pipe(map((address) => address.id));

    addressId$
      .pipe(
        switchMap((addressId) => this.ordersService.placeOrder(addressId)),
        finalize(() => this.submitting.set(false))
      )
      .subscribe({
        next: (order) => {
          void this.router.navigate(['/order-success', order.id]);
        },
        error: (error: unknown) => {
          this.orderError.set(
            error instanceof Error ? error.message : 'We could not place your order. Please try again.'
          );
        }
      });
  }
}
