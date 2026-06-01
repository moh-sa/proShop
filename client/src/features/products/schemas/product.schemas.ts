import { paginationParamsSchema } from "@/features/pagination";
import { idSchema, selectSchema } from "@/shared/schemas";
import z from "zod";
import { IMAGE_MAX_SIZE, IMAGE_MIMETYPES } from "../consts";

const nameSchema = z.string().trim().nonempty().max(100);

const descriptionSchema = z.string().trim().nonempty().max(2000);

const brandSchema = z.string().trim().nonempty().max(100);

const categorySchema = z.string().trim().nonempty().max(100);

const priceSchema = z.number().positive();

const countInStockSchema = z.number().int().nonnegative();

const numReviewsSchema = z.number().int().min(0);

const ratingSchema = z.number().min(0).max(5);

function buildImageSchema(isNullable: boolean) {
	return z
    .custom<File>((val) => isNullable ? val === null || val instanceof File : val instanceof File)
    .refine(
      (val) => val === null || val.size <= IMAGE_MAX_SIZE,
      { message: `Image must be ${IMAGE_MAX_SIZE} or smaller` }
    )
    .refine(
      (val) => val === null || IMAGE_MIMETYPES.includes(val.type),
      { message: `Invalid image type. Allowed types: ${IMAGE_MIMETYPES.map((t) => t.replace("image/", "")).join(", ")}` }
    );
}

export const createImageSchema = buildImageSchema(false);
export const updateImageSchema = buildImageSchema(true);

export const baseSchema = z.object({
	name: nameSchema,
	description: descriptionSchema,
	brand: brandSchema,
	category: categorySchema,
	price: priceSchema,
	countInStock: countInStockSchema,
});

export const createProductSchema = baseSchema.extend({
	image: buildImageSchema(false),
});

export const updateProductSchema = createProductSchema.partial().extend({
	productId: idSchema,
});

export const productSchema = baseSchema.extend({
	...selectSchema.shape,
	image: z.url(),
	numReviews: numReviewsSchema,
	rating: ratingSchema,
});

export const productTopRatedListSchema = z.array(
	productSchema.pick({
		id: true,
		name: true,
		image: true,
		price: true,
	}),
);

export const ProductListItemSchema = productSchema.pick({
	id: true,
	name: true,
	brand: true,
	category: true,
	image: true,
	rating: true,
	price: true,
	countInStock: true,
});

export const productSearchParamsSchema = z
	.object({
		keyword: z.coerce.string().trim().optional(),
	})
	.extend(paginationParamsSchema.shape);
