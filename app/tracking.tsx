import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../lib/language";
import api from "../services/api";

type TrackingEvent = {
  date: string;
  status: string;
  location: string;
  description: string;
  completed: boolean;
};

export default function TrackingScreen() {
  const router = useRouter();
  const { tr } = useLanguage();
  const params = useLocalSearchParams<{
    awb?: string;
    orderNumber?: string;
  }>();

  const [awb, setAwb] = useState(params.awb || "");
  const [orderNumber, setOrderNumber] = useState(params.orderNumber || "");
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.awb) {
      fetchTrackingData(params.awb);
    }
  }, [params.awb]);

  const fetchTrackingData = async (trackingNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/shiprocket/track/${trackingNumber}`);
      console.log("Tracking response:", response.data);
      
      if (response.data?.success) {
        // Parse tracking data from backend response
        const trackingInfo = response.data.data;
        if (typeof trackingInfo === 'string') {
          // If backend returns string, parse it
          try {
            const parsed = JSON.parse(trackingInfo);
            setTrackingData(parseTrackingEvents(parsed));
          } catch (e) {
            // If parsing fails, create mock data
            setTrackingData(createMockTrackingData());
          }
        } else {
          setTrackingData(parseTrackingEvents(trackingInfo));
        }
      } else {
        setError("Tracking information not available");
        setTrackingData(createMockTrackingData());
      }
    } catch (err) {
      console.error("Error fetching tracking:", err);
      setError("Failed to fetch tracking information");
      setTrackingData(createMockTrackingData());
    } finally {
      setLoading(false);
    }
  };

  const parseTrackingEvents = (data: any): TrackingEvent[] => {
    // Parse backend tracking data into frontend format
    if (Array.isArray(data)) {
      return data.map((event, index) => ({
        date: event.date || event.timestamp || "",
        status: event.status || event.activity || "",
        location: event.location || event.hub || "",
        description: event.description || event.remarks || "",
        completed: index === 0, // First event is most recent/completed
      }));
    }
    return createMockTrackingData();
  };

  const createMockTrackingData = (): TrackingEvent[] => {
    return [
      {
        date: new Date().toISOString(),
        status: "Tracking information will be available soon",
        location: "Processing",
        description: "Shipment details are being updated",
        completed: false,
      },
    ];
  };

  const handleTrackOrder = () => {
    if (awb.trim()) {
      fetchTrackingData(awb.trim());
    } else {
      setError("Please enter a tracking number");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1d324e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Order Info */}
      {orderNumber && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{orderNumber}</Text>
        </View>
      )}

      {/* Tracking Input */}
      {!params.awb && (
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <Ionicons name="cube-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter tracking number"
              value={awb}
              onChangeText={setAwb}
            />
          </View>
          <TouchableOpacity style={styles.trackButton} onPress={handleTrackOrder}>
            <Text style={styles.trackButtonText}>Track</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E97A1F" />
          <Text style={styles.loadingText}>Fetching tracking details...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Tracking Timeline */}
      {!loading && trackingData.length > 0 && (
        <ScrollView style={styles.timelineContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.timelineTitle}>Tracking History</Text>
          {trackingData.map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  { backgroundColor: event.completed ? "#E97A1F" : "#D1D5DB" }
                ]} />
                {index < trackingData.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStatus}>{event.status}</Text>
                <Text style={styles.timelineLocation}>{event.location}</Text>
                <Text style={styles.timelineDescription}>{event.description}</Text>
                <Text style={styles.timelineDate}>
                  {new Date(event.date).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1D324E",
  },
  orderInfo: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D324E",
    textAlign: "center",
  },
  inputSection: {
    padding: 16,
    gap: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1D324E",
    paddingVertical: 12,
  },
  trackButton: {
    backgroundColor: "#E97A1F",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  trackButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    flex: 1,
  },
  timelineContainer: {
    flex: 1,
    padding: 16,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1D324E",
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#D1D5DB",
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#E97A1F",
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D324E",
    marginBottom: 4,
  },
  timelineLocation: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20,
  },
  timelineDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});