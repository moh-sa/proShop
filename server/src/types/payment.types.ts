export type LineItem = {
	imageUrl: string;
	name: string;
	quantity: number;
	unitAmount: number;
};

export type LineItems = Array<LineItem>;
