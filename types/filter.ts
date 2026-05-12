// Enhanced Filter Types for E-commerce

export interface EnhancedProductFilterRequest {
  // 🔎 Search
  keyword?: string;

  // 📄 Pagination
  page?: number;
  size?: number;

  // 🔃 Sorting
  sortBy?: string;
  sortDirection?: string;

  // 📂 Category Filters
  categoryIds?: number[];
  subcategoryIds?: number[];

  // 👕 Gender Filter
  genders?: string[];

  // 🎨 Color Filter
  colorIds?: number[];
  colorNames?: string[];

  // 📏 Size Filter
  sizeIds?: number[];
  sizeNames?: string[];

  // 💰 Price Range
  minPrice?: number;
  maxPrice?: number;

  // ⭐ Rating Filter
  minRating?: number;

  // 🏪 Seller Filter
  sellerId?: number;

  // 📦 Stock Filter
  inStock?: boolean;

  // 🚚 Delivery Filters
  acceptCod?: boolean;
  acceptPrepaid?: boolean;

  // 📍 Location Filters
  deliverAllLocations?: boolean;
}

export interface FilterResponse {
  products: ProductDTO[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  appliedFilters: AppliedFiltersSummary;
}

export interface AppliedFiltersSummary {
  categories?: string[];
  colors?: string[];
  sizes?: string[];
  genders?: string[];
  priceRange?: string;
  minRating?: number;
  totalActiveFilters: number;
}

export interface FilterOptions {
  categories: CategoryFilter[];
  colors: ColorFilter[];
  sizes: SizeFilter[];
  genders: GenderFilter[];
  priceRanges: PriceRangeFilter[];
  ratings: RatingFilter[];
}

export interface CategoryFilter {
  id: number;
  name: string;
  image?: string;
  parentId?: number;
  productCount: number;
}

export interface ColorFilter {
  id: number;
  name: string;
  code: string;
  hex?: string;
  productCount: number;
}

export interface SizeFilter {
  id: number;
  name: string;
  code: string;
  productCount: number;
}

export interface GenderFilter {
  value: string;
  label: string;
  productCount: number;
}

export interface PriceRangeFilter {
  id: string;
  label: string;
  min: number;
  max: number;
  productCount: number;
}

export interface RatingFilter {
  value: number;
  label: string;
  productCount: number;
}

// Basic Product DTO (should match backend)
export interface ProductDTO {
  id: number;
  name: string;
  sku?: string;
  shortDescription?: string;
  description?: string;
  categoryId?: number;
  subcategoryId?: number;
  gender?: string;
  rating?: number;
  ratingCount?: number;
  sellerId?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  variants?: ProductVariantDTO[];
  images?: ProductImageDTO[];
}

export interface ProductVariantDTO {
  id: number;
  productId: number;
  color?: string;
  size?: string;
  sku?: string;
  basePrice?: number;
  mrpExclGst?: number;
  mrpPrice?: number;
  sellingPrice?: number;
  finalPrice?: number;
  discountPercentage?: number;
  discountAmount?: number;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImageDTO {
  id: number;
  productId: number;
  imagePath?: string;
  imageUrl?: string;
  sortOrder?: number;
  isMain?: boolean;
}
