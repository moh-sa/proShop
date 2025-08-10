export interface RateLimitConfig {
	maxRequests: number;
	message?: string;
	windowMs: number;
}
