import { useState, useCallback, useEffect } from 'react';

export interface FilterState {
  // Sort
  sort: string;
  
  // Category
  categoryIds: number[];
  subcategoryIds: number[];
  
  // Gender
  genders: string[];
  
  // Color
  colorIds: number[];
  colorNames: string[];
  
  // Size
  sizeIds: number[];
  sizeNames: string[];
  
  // Price
  minPrice: number | null;
  maxPrice: number | null;
  selectedPriceRanges: string[];
  
  // Rating
  minRating: number | null;
  
  // Other
  inStock: boolean;
  sellerId: number | null;
  
  // Search
  keyword: string;
  
  // Pagination
  page: number;
  size: number;
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

const initialFilterState: FilterState = {
  sort: 'relevance',
  categoryIds: [],
  subcategoryIds: [],
  genders: [],
  colorIds: [],
  colorNames: [],
  sizeIds: [],
  sizeNames: [],
  minPrice: null,
  maxPrice: null,
  selectedPriceRanges: [],
  minRating: null,
  inStock: true,
  sellerId: null,
  keyword: '',
  page: 0,
  size: 20,
};

export const useFilterState = (initialState?: Partial<FilterState>) => {
  const [filters, setFilters] = useState<FilterState>({
    ...initialFilterState,
    ...initialState,
  });

  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Calculate active filter count
  useEffect(() => {
    let count = 0;
    
    if (filters.categoryIds.length > 0) count += filters.categoryIds.length;
    if (filters.subcategoryIds.length > 0) count += filters.subcategoryIds.length;
    if (filters.genders.length > 0) count += filters.genders.length;
    if (filters.colorIds.length > 0) count += filters.colorIds.length;
    if (filters.colorNames.length > 0) count += filters.colorNames.length;
    if (filters.sizeIds.length > 0) count += filters.sizeIds.length;
    if (filters.sizeNames.length > 0) count += filters.sizeNames.length;
    if (filters.selectedPriceRanges.length > 0) count += filters.selectedPriceRanges.length;
    if (filters.minPrice !== null || filters.maxPrice !== null) count += 1;
    if (filters.minRating !== null) count += 1;
    if (filters.sort !== 'relevance') count += 1;
    if (filters.keyword.trim() !== '') count += 1;
    
    setActiveFilterCount(count);
  }, [filters]);

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 0, // Reset page when filter changes
    }));
  }, []);

  const updateMultipleFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...updates,
      page: 0, // Reset page when filters change
    }));
  }, []);

  const toggleArrayFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => {
      const currentArray = prev[key] as any[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [key]: newArray,
        page: 0,
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  const clearFilterCategory = useCallback((category: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [category]: Array.isArray(initialFilterState[category]) ? [] : initialFilterState[category],
      page: 0,
    }));
  }, []);

  const hasActiveFilters = activeFilterCount > 0;

  const getFilterSummary = useCallback(() => {
    const summary: string[] = [];
    
    if (filters.categoryIds.length > 0) summary.push(`${filters.categoryIds.length} categories`);
    if (filters.genders.length > 0) summary.push(`${filters.genders.length} genders`);
    if (filters.colorIds.length > 0 || filters.colorNames.length > 0) {
      summary.push(`${filters.colorIds.length + filters.colorNames.length} colors`);
    }
    if (filters.sizeIds.length > 0 || filters.sizeNames.length > 0) {
      summary.push(`${filters.sizeIds.length + filters.sizeNames.length} sizes`);
    }
    if (filters.selectedPriceRanges.length > 0) summary.push(`${filters.selectedPriceRanges.length} price ranges`);
    if (filters.minRating !== null) summary.push(`${filters.minRating}+ stars`);
    if (filters.minPrice !== null || filters.maxPrice !== null) summary.push('price range');
    
    return summary.join(', ');
  }, [filters]);

  const resetPage = useCallback(() => {
    setFilters(prev => ({ ...prev, page: 0 }));
  }, []);

  return {
    filters,
    setFilters,
    updateFilter,
    updateMultipleFilters,
    toggleArrayFilter,
    clearFilters,
    clearFilterCategory,
    hasActiveFilters,
    activeFilterCount,
    getFilterSummary,
    resetPage,
  };
};
