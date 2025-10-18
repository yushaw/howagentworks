const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const resolveAssetPath = (path: string) =>
  `${basePath}${path}`.replace(/\/{2,}/g, "/");
