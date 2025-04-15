export const IMAGE_FIELD_NAME = "image" as const;

export const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

export const IMAGE_TYPE_LIMIT = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/avif",
];
