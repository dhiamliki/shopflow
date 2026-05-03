import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize, map, of, switchMap } from 'rxjs';
import { AddressPayload, PaymentMethod, Product } from '../../core/models/commerce.models';
import { AddressService } from '../../core/services/address.service';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import { SessionService } from '../../core/services/session.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { TndCurrencyPipe } from '../../shared/pipes/tnd-currency.pipe';

const TUNISIA = 'Tunisia';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    CommonModule,
    TndCurrencyPipe,
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
          <a routerLink="/login" [queryParams]="{ redirect: '/checkout' }" class="button-primary px-8">
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
                Complete your order with a shipping address and payment method.
              </p>
            </div>

            <div class="panel-dark space-y-7 p-6 sm:p-7">
              <section class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-white">1</span>
                  <h2 class="text-base font-semibold text-white">Shipping Information</h2>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <input class="input-dark sm:col-span-2" formControlName="street" placeholder="Street Address" />
                  <input class="input-dark" formControlName="apartment" placeholder="Apartment, suite, etc. (optional)" />
                  <input class="input-dark" formControlName="city" placeholder="City" />
                  <input class="input-dark" formControlName="postalCode" placeholder="ZIP / Postal Code" />
                  <select class="select-dark" formControlName="country" aria-label="Country">
                    <option [value]="TUNISIA">{{ TUNISIA }}</option>
                  </select>
                </div>
              </section>

              <section class="space-y-4 border-t border-white/8 pt-7">
                <div class="flex items-center gap-3">
                  <span class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-white">2</span>
                  <h2 class="text-base font-semibold text-white">Payment Method</h2>
                </div>

                <div class="space-y-3">
                  @for (method of paymentMethods; track method.value) {
                    <label
                      class="flex cursor-pointer items-start gap-4 rounded-md border p-4 transition"
                      [ngClass]="checkoutForm.controls.paymentMethod.value === method.value ? 'border-emerald-400/35 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/18'"
                    >
                      <input
                        type="radio"
                        class="mt-1 accent-emerald-400"
                        formControlName="paymentMethod"
                        [value]="method.value"
                      />
                      <span>
                        <span class="block text-base font-semibold text-white">{{ method.label }}</span>
                        <span class="mt-1 block text-sm leading-6 text-zinc-400">{{ method.description }}</span>
                      </span>
                    </label>
                  }
                </div>
              </section>

              @if (orderError()) {
                <p class="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {{ orderError() }}
                </p>
              }

              <button type="button" class="button-primary w-full text-base" (click)="placeOrder()" [disabled]="submitting()">
                Place Order <span>&bull;</span> <strong>{{ cartService.cart().totalTtc | tndCurrency }}</strong>
                <app-icon name="lock" [size]="16" className="ml-auto text-black" />
              </button>
            </div>
          </section>

          <aside class="space-y-5">
            <app-panel-card title="Order Summary" className="sticky top-28">
              <div class="space-y-4">
                @for (item of enrichedItems(); track item.id) {
                  <div class="flex items-center gap-4">
                    <img class="h-[76px] w-[76px] shrink-0 rounded-md object-cover sm:h-[88px] sm:w-[88px]" [src]="item.product.imageUrls[0]" [alt]="item.productName" />
                    <div class="min-w-0 flex-1">
                      <p class="line-clamp-2 text-base font-semibold text-white">{{ item.productName }}</p>
                      <p class="mt-1 text-sm text-zinc-400">{{ item.variantLabel || 'Standard' }}</p>
                    </div>
                    <p class="shrink-0 text-base font-semibold text-white">{{ item.totalPrice | tndCurrency }}</p>
                  </div>
                }
              </div>

              <div class="my-6 border-t border-white/8"></div>

              <div class="space-y-4 text-base">
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Subtotal</span>
                  <span class="text-white">{{ cartService.cart().subtotal | tndCurrency }}</span>
                </div>
                @if (cartService.cart().discount > 0) {
                  <div class="flex items-center justify-between">
                    <span class="text-zinc-400">Discount</span>
                    <span class="text-emerald-300">-{{ cartService.cart().discount | tndCurrency }}</span>
                  </div>
                }
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Shipping</span>
                  <span class="text-emerald-300">
                    {{ cartService.cart().shippingFee === 0 ? 'Free' : (cartService.cart().shippingFee | tndCurrency) }}
                  </span>
                </div>
              </div>

              <div class="my-6 border-t border-white/8"></div>

              <div class="flex items-center justify-between">
                <span class="text-2xl font-semibold text-white">Total</span>
                <span class="text-4xl font-semibold tracking-tight text-white">
                  {{ cartService.cart().totalTtc | tndCurrency }}
                </span>
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
  readonly TUNISIA = TUNISIA;
  readonly paymentMethods: Array<{ value: PaymentMethod; label: string; description: string }> = [
    {
      value: 'PAY_ON_DELIVERY',
      label: 'Pay in person when delivery arrives',
      description: 'Pay the delivery person when your order arrives. No online card payment is collected.'
    }
  ];

  readonly checkoutForm = this.fb.nonNullable.group({
    street: ['', Validators.required],
    apartment: [''],
    city: ['', Validators.required],
    postalCode: ['', Validators.required],
    country: [TUNISIA, Validators.required],
    paymentMethod: ['PAY_ON_DELIVERY' as PaymentMethod, Validators.required]
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

  constructor() {
    this.cartService.loadCart().subscribe();
    this.addressService.loadAddresses().subscribe();

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
        switchMap((addressId) => this.ordersService.placeOrder(addressId, value.paymentMethod)),
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
