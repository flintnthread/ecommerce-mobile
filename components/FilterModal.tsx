import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterState {
  priceRange?: { min: number; max: number };
  rating?: number;
  selectedPriceRanges: string[];
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    selectedPriceRanges: [],
    rating: undefined,
    priceRange: undefined,
  });
  
  const [showPriceOptions, setShowPriceOptions] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const insets = useSafeAreaInsets();

  // Predefined price ranges
  const priceRanges = [
    { id: '0-200', label: '₹0 - ₹200', min: 0, max: 200 },
    { id: '200-500', label: '₹200 - ₹500', min: 200, max: 500 },
    { id: '500-1000', label: '₹500 - ₹1,000', min: 500, max: 1000 },
    { id: '1000-2000', label: '₹1,000 - ₹2,000', min: 1000, max: 2000 },
    { id: '2000-5000', label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
    { id: '5000+', label: '₹5,000+', min: 5000, max: 999999 },
  ];

  const ratingOptions = [
    { value: 4, label: '4+ ⭐⭐⭐⭐' },
    { value: 3, label: '3+ ⭐⭐⭐' },
    { value: 2, label: '2+ ⭐⭐' },
    { value: 1, label: '1+ ⭐' },
  ];

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  const handlePriceRangeToggle = (rangeId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedPriceRanges: prev.selectedPriceRanges?.includes(rangeId)
        ? prev.selectedPriceRanges.filter(id => id !== rangeId)
        : [...(prev.selectedPriceRanges || []), rangeId]
    }));
  };

  const handleRatingSelect = (rating: number) => {
    setFilters(prev => ({
      ...prev,
      rating: prev.rating === rating ? undefined : rating
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({
      selectedPriceRanges: [],
      rating: undefined,
      priceRange: undefined,
    });
  };

  const selectedPriceRangesCount = filters.selectedPriceRanges?.length || 0;
  const hasActiveFilters = selectedPriceRangesCount > 0 || filters.rating !== undefined;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top,
            }
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={handleClearFilters} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Price Filter Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setShowPriceOptions(!showPriceOptions)}
              >
                <Text style={styles.sectionTitle}>Price</Text>
                <View style={styles.sectionHeaderRight}>
                  {selectedPriceRangesCount > 0 && (
                    <Text style={styles.sectionCount}>{selectedPriceRangesCount}</Text>
                  )}
                  <Ionicons
                    name={showPriceOptions ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#666"
                  />
                </View>
              </TouchableOpacity>

              {showPriceOptions && (
                <View style={styles.priceOptions}>
                  {priceRanges.map((range) => {
                    const isSelected = filters.selectedPriceRanges?.includes(range.id);
                    return (
                      <TouchableOpacity
                        key={range.id}
                        style={[
                          styles.priceOption,
                          isSelected && styles.priceOptionSelected
                        ]}
                        onPress={() => handlePriceRangeToggle(range.id)}
                      >
                        <View style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected
                        ]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                        <Text style={[
                          styles.priceOptionText,
                          isSelected && styles.priceOptionTextSelected
                        ]}>
                          {range.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Rating Filter Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Rating</Text>
                {filters.rating !== undefined && (
                  <Text style={styles.sectionCount}>1</Text>
                )}
              </View>
              <View style={styles.ratingOptions}>
                {ratingOptions.map((option) => {
                  const isSelected = filters.rating === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.ratingOption,
                        isSelected && styles.ratingOptionSelected
                      ]}
                      onPress={() => handleRatingSelect(option.value)}
                    >
                      <View style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected
                      ]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>
                      <Text style={[
                        styles.ratingOptionText,
                        isSelected && styles.ratingOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
            <TouchableOpacity
              style={[
                styles.applyButton,
                !hasActiveFilters && styles.applyButtonDisabled
              ]}
              onPress={handleApplyFilters}
              disabled={!hasActiveFilters}
            >
              <Text style={[
                styles.applyButtonText,
                !hasActiveFilters && styles.applyButtonTextDisabled
              ]}>
                Apply Filters {hasActiveFilters && `(${selectedPriceRangesCount + (filters.rating ? 1 : 0)})`}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionCount: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#e6f3ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  priceOptions: {
    marginTop: 10,
  },
  priceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  priceOptionSelected: {
    backgroundColor: '#e6f3ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priceOptionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  priceOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  ratingOptions: {
    marginTop: 10,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  ratingOptionSelected: {
    backgroundColor: '#e6f3ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  ratingOptionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  ratingOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButtonTextDisabled: {
    color: '#999',
  },
});

export default FilterModal;
