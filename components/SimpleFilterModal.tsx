import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SimpleFilterModalProps {
  visible: boolean;
  filters: any;
  filterOptions?: any;
  filterOptionsLoading?: boolean;
  onUpdateFilter: (key: string, value: any) => void;
  onApply: () => void;
  onClose: () => void;
  onClear: () => void;
}

const SimpleFilterModal: React.FC<SimpleFilterModalProps> = ({
  visible,
  filters,
  filterOptions,
  filterOptionsLoading,
  onUpdateFilter,
  onApply,
  onClose,
  onClear,
}) => {
  const insets = useSafeAreaInsets();

  const toggleArrayFilter = (key: string, value: any) => {
    const currentArray = filters[key] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item: any) => item !== value)
      : [...currentArray, value];
    onUpdateFilter(key, newArray);
  };

  const renderFilterOptions = () => {
    if (!filterOptions || filterOptionsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading filters...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.filterContent}>
        {/* Categories */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {filterOptions.categories?.map((category: any) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterOption,
                filters.categoryIds?.includes(category.id) && styles.selectedOption
              ]}
              onPress={() => toggleArrayFilter('categoryIds', category.id)}
            >
              <Text style={styles.optionText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Colors */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Colors</Text>
          {filterOptions.colors?.map((color: any) => (
            <TouchableOpacity
              key={color.id}
              style={[
                styles.filterOption,
                filters.colorIds?.includes(color.id) && styles.selectedOption
              ]}
              onPress={() => toggleArrayFilter('colorIds', color.id)}
            >
              <View style={[styles.colorPreview, { backgroundColor: color.hex || '#ccc' }]} />
              <Text style={styles.optionText}>{color.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sizes */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Sizes</Text>
          {filterOptions.sizes?.map((size: any) => (
            <TouchableOpacity
              key={size.id}
              style={[
                styles.filterOption,
                filters.sizeIds?.includes(size.id) && styles.selectedOption
              ]}
              onPress={() => toggleArrayFilter('sizeIds', size.id)}
            >
              <Text style={styles.optionText}>{size.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Genders */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Gender</Text>
          {filterOptions.genders?.map((gender: any) => (
            <TouchableOpacity
              key={gender.value}
              style={[
                styles.filterOption,
                filters.genders?.includes(gender.value) && styles.selectedOption
              ]}
              onPress={() => toggleArrayFilter('genders', gender.value)}
            >
              <Text style={styles.optionText}>{gender.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price Range */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Price Range</Text>
          <View style={styles.priceRangeContainer}>
            <TouchableOpacity
              style={[
                styles.priceRangeOption,
                filters.minPrice === 0 && filters.maxPrice === 500 && styles.selectedOption
              ]}
              onPress={() => {
                onUpdateFilter('minPrice', 0);
                onUpdateFilter('maxPrice', 500);
              }}
            >
              <Text style={styles.optionText}>₹0 - ₹500</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.priceRangeOption,
                filters.minPrice === 500 && filters.maxPrice === 1000 && styles.selectedOption
              ]}
              onPress={() => {
                onUpdateFilter('minPrice', 500);
                onUpdateFilter('maxPrice', 1000);
              }}
            >
              <Text style={styles.optionText}>₹500 - ₹1,000</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.priceRangeOption,
                filters.minPrice === 1000 && filters.maxPrice === 2000 && styles.selectedOption
              ]}
              onPress={() => {
                onUpdateFilter('minPrice', 1000);
                onUpdateFilter('maxPrice', 2000);
              }}
            >
              <Text style={styles.optionText}>₹1,000 - ₹2,000</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sort */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          {['relevance', 'price_low_to_high', 'price_high_to_low', 'rating_high_to_low'].map((sortOption: any) => (
            <TouchableOpacity
              key={sortOption}
              style={[
                styles.filterOption,
                filters.sort === sortOption && styles.selectedOption
              ]}
              onPress={() => onUpdateFilter('sort', sortOption)}
            >
              <Text style={styles.optionText}>
                {sortOption === 'relevance' ? 'Relevance' :
                 sortOption === 'price_low_to_high' ? 'Price: Low to High' :
                 sortOption === 'price_high_to_low' ? 'Price: High to Low' :
                 sortOption === 'rating_high_to_low' ? 'Rating: High to Low' : sortOption}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filters</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {renderFilterOptions()}

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.clearButton} onPress={onClear}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={onApply}>
            <Text style={styles.applyButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContent: {
    flex: 1,
    paddingVertical: 20,
  },
  filterSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    borderColor: '#007bff',
    backgroundColor: '#e6f3ff',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priceRangeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default SimpleFilterModal;
