import Stripe from "stripe";

import { config } from "@/core/config";
import { logger } from "@/core/logger";

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!config.stripe.secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: "2025-07-30.basil" as Stripe.LatestApiVersion,
    });
  }
  return stripe;
}

export interface CreateCheckoutInput {
  userId: string;
  leagueId: string;
  packSize: number;
  priceCents: number;
  leagueName: string;
}

export interface CheckoutResult {
  sessionId: string;
  url: string;
  checkoutUrl: string;
}

export const StripeService = {
  async createCheckoutSession(
    input: CreateCheckoutInput,
  ): Promise<CheckoutResult> {
    if (!config.stripe.secretKey) {
      const mockSessionId = `mock_cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const mockUrl = `${config.app.frontendUrl}/league/${input.leagueId}/payment-success?session_id=${mockSessionId}&mock=true`;
      logger.warn(
        "Stripe secret key not configured, returning mock checkout URL",
        {
          sessionId: mockSessionId,
          userId: input.userId,
          leagueId: input.leagueId,
        },
      );
      return {
        sessionId: mockSessionId,
        url: mockUrl,
        checkoutUrl: mockUrl,
      };
    }

    const stripe = getStripe();

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: undefined,
        metadata: {
          userId: input.userId,
          leagueId: input.leagueId,
          type: "attempt_pack",
          packSize: String(input.packSize),
        },
        line_items: [
          {
            price_data: {
              currency: config.stripe.currency,
              product_data: {
                name: `Attempt Pack - ${input.packSize} attempts`,
                description: `${input.packSize} additional attempts for ${input.leagueName}`,
              },
              unit_amount: input.priceCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${config.app.frontendUrl}/league/${input.leagueId}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.app.frontendUrl}/league/${input.leagueId}/payment-cancel`,
      });

      if (!session.url) {
        throw new Error("Failed to create checkout session URL from Stripe");
      }

      logger.info("Stripe checkout session created", {
        sessionId: session.id,
        userId: input.userId,
        leagueId: input.leagueId,
        checkoutUrl: session.url,
      });

      return {
        sessionId: session.id,
        url: session.url,
        checkoutUrl: session.url,
      };
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Stripe gateway error";
      logger.error("Failed to create Stripe checkout session", {
        error: errorMsg,
        userId: input.userId,
        leagueId: input.leagueId,
      });
      throw new Error(`Unable to initialize payment checkout: ${errorMsg}`, {
        cause: err,
      });
    }
  },

  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = getStripe();

    if (!config.stripe.webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      config.stripe.webhookSecret,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, leagueId, packSize } = session.metadata ?? {};

      if (userId && leagueId && packSize) {
        logger.info("Stripe payment completed", {
          sessionId: session.id,
          userId,
          leagueId,
        });

        return {
          type: "payment_completed" as const,
          userId,
          leagueId,
          packSize: Number(packSize),
        };
      }
    }

    return null;
  },

  async retrieveSession(sessionId: string) {
    const stripe = getStripe();
    return stripe.checkout.sessions.retrieve(sessionId);
  },
};
