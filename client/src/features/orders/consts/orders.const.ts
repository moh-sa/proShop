export const FREE_SHIPPING_THRESHOLD = 100;
export const STANDARD_SHIPPING_PRICE = 10;
export const TAX_RATE = 0.15;

/**
 * Maximum number of attempts to poll for order status.
 */
export const ORDER_STATUS_POLL_MAX_ATTEMPTS = 10;

/**
 * Poll interval in milliseconds for order status.
 */
export const ORDER_STATUS_POLL_INTERVAL = 3_000;

/**
 * Stale time in milliseconds for order status when it is pending.
 */
export const ORDER_STATUS_PENDING_STALE_TIME = ORDER_STATUS_POLL_INTERVAL;
