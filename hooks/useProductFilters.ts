import { useState, useCallback } from 'react';
import { FilterState } from '../components/FilterModal';
import {
  filterProductsByPriceRange,
  filterProductsByRating,
  filterProductsByPriceAndRating,
} from '../services/api';

interface Product {
  id: number;
  name: string;
  // Add other product fields as needed
}

interface FilterResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const useProductFilters = () => {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyFilters = useCallback(async (filters: FilterState) => {
    setLoading(true);
    setError(null);

    try {
      let response: FilterResponse;

      // Determine which API endpoint to call based on active filters
      const hasPriceFilter = filters.selectedPriceRanges && filters.selectedPriceRanges.length > 0;
      const hasRatingFilter = filters.rating !== undefined;

      if (hasPriceFilter && hasRatingFilter) {
        // Use combined filter endpoint
        // For simplicity, we'll use the first selected price range
        const selectedRange = filters.selectedPriceRanges[0];
        const [minStr, maxStr] = selectedRange.split('-');
        const minPrice = parseInt(minStr);
        const maxPrice = maxStr === '+' ? 999999 : parseInt(maxStr);

        response = await filterProductsByPriceAndRating(
          minPrice,
          maxPrice,
          filters.rating
        );
      } else if (hasPriceFilter) {
        // Use price-only filter endpoint
        const selectedRange = filters.selectedPriceRanges[0];
        const [minStr, maxStr] = selectedRange.split('-');
        const minPrice = parseInt(minStr);
        const maxPrice = maxStr === '+' ? 999999 : parseInt(maxStr);

        response = await filterProductsByPriceRange(minPrice, maxPrice);
      } else if (hasRatingFilter) {
        // Use rating-only filter endpoint
        response = await filterProductsByRating(filters.rating);
      } else {
        // No filters applied, return empty response
        setFilteredProducts([]);
        setLoading(false);
        return;
      }

      setFilteredProducts(response.content || []);
    } catch (err: any) {
      setError(err.message || 'Failed to apply filters');
      console.error('Filter error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearFilters = useCallback(() => {
    setFilteredProducts([]);
    setError(null);
  }, []);

  return {
    filteredProducts,
    loading,
    error,
    applyFilters,
    clearFilters,
  };
};
