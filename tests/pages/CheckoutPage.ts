import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface PaymentInfo {
    cardNumber: string;
    expiry: string;
    cvv: string;
    name: string;
}

export interface BillingInfo {
    address: string;
    city: string;
    state: string;
    zip: string;
}

export class CheckoutPage extends BasePage {
    readonly cardNumberInput: Locator;
    readonly expiryInput: Locator;
    readonly cvvInput: Locator;
    readonly nameInput: Locator;
    readonly addressInput: Locator;
    readonly cityInput: Locator;
    readonly stateInput: Locator;
    readonly zipInput: Locator;
    readonly submitButton: Locator;
    readonly cardError: Locator;
    readonly successMessage: Locator;
    readonly orderNumber: Locator;

    constructor(page: Page) {
        super(page);
        this.cardNumberInput = page.locator('[data-testid="card-number"]');
        this.expiryInput = page.locator('[data-testid="card-expiry"]');
        this.cvvInput = page.locator('[data-testid="card-cvv"]');
        this.nameInput = page.locator('[data-testid="card-name"]');
        this.addressInput = page.locator('[data-testid="billing-address"]');
        this.cityInput = page.locator('[data-testid="billing-city"]');
        this.stateInput = page.locator('[data-testid="billing-state"]');
        this.zipInput = page.locator('[data-testid="billing-zip"]');
        this.submitButton = page.locator('[data-testid="submit-order"]');
        this.cardError = page.locator('#card-error');
        this.successMessage = page.locator('[data-testid="success-message"]');
        this.orderNumber = page.locator('[data-testid="order-number"]');
    }

    async fillPaymentInfo(info: PaymentInfo) {
        await this.cardNumberInput.fill(info.cardNumber);
        await this.expiryInput.fill(info.expiry);
        await this.cvvInput.fill(info.cvv);
        await this.nameInput.fill(info.name);
    }

    async fillBillingInfo(info: BillingInfo) {
        await this.addressInput.fill(info.address);
        await this.cityInput.fill(info.city);
        await this.stateInput.fill(info.state);
        await this.zipInput.fill(info.zip);
    }

    async submitOrder() {
        await this.submitButton.click();
    }

    async getCardErrorMessage(): Promise<string | null> {
        return this.cardError.textContent();
    }

    async backToCart() {
        await this.page.locator('#back-to-cart').click();
    }
}
