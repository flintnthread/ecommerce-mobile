import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../lib/language';
import * as Print from 'expo-print';
import api from '../services/api';

const INVOICE_API_PATH = '/api/invoices';

interface InvoiceItem {
  description: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  taxAmount: number;
  lineTotal: number;
}

interface InvoiceData {
  invoiceNumber: string;
  orderId: number;
  date: string;
  orderDate: string;
  sellerName: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerGstin: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail: string;
  items: InvoiceItem[];
  subtotalBeforeTax: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  shippingCharge: number;
  grandTotal: number;
  isInterState: boolean;
  gstNote: string;
}

export default function InvoiceScreen() {
  const { tr } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchInvoice = async (orderId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`${INVOICE_API_PATH}?orderId=${orderId}`);
      if (response.data && response.data.success) {
        setInvoice(response.data.data);
      } else {
        Alert.alert(tr('error'), tr('invoiceNotFound'));
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      Alert.alert(tr('error'), tr('invoiceLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async () => {
    if (!invoice) return;
    
    try {
      // Use the Print API to generate and download the invoice
      const response = await api.get(`http://localhost:8080/invoices/${invoice.invoiceNumber.replace(/^INV-/, '')}.html`);
      if (response.data) {
        await Print.printAsync({ html: response.data });
      } else {
        throw new Error('Invoice HTML not found');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      Alert.alert(tr('error'), tr('invoiceDownloadError'));
    }
  };

  const renderGstBreakdown = () => {
    if (!invoice) return null;

    return (
      <View style={styles.gstSection}>
        <Text style={styles.gstTitle}>{tr('gstBreakdown')}</Text>
        
        {invoice.isInterState ? (
          // Inter-state transaction - IGST only
          <>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>{tr('igst')} @ {invoice.totalGstAmount / invoice.subtotalBeforeTax * 100}%:</Text>
              <Text style={styles.gstValue}>₹{invoice.igstAmount.toFixed(2)}</Text>
            </View>
          </>
        ) : (
          // Intra-state transaction - CGST + SGST
          <>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>{tr('cgst')} @ {(invoice.totalGstAmount / 2 / invoice.subtotalBeforeTax * 100)}%:</Text>
              <Text style={styles.gstValue}>₹{invoice.cgstAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>{tr('sgst')} @ {(invoice.totalGstAmount / 2 / invoice.subtotalBeforeTax * 100)}%:</Text>
              <Text style={styles.gstValue}>₹{invoice.sgstAmount.toFixed(2)}</Text>
            </View>
          </>
        )}
        
        <View style={styles.gstSummary}>
          <Text style={styles.gstSummaryTitle}>{tr('gstBreakdownSummary')}</Text>
          <Text style={styles.gstSummaryRow}>{tr('totalGst')}: ₹{invoice.totalGstAmount.toFixed(2)}</Text>
          {invoice.isInterState ? (
            <Text style={styles.gstSummaryRow}>{tr('totalIgst')}: ₹{invoice.igstAmount.toFixed(2)}</Text>
          ) : (
            <>
              <Text style={styles.gstSummaryRow}>{tr('totalCgst')}: ₹{invoice.cgstAmount.toFixed(2)}</Text>
              <Text style={styles.gstSummaryRow}>{tr('totalSgst')}: ₹{invoice.sgstAmount.toFixed(2)}</Text>
            </>
          )}
          <Text style={styles.gstNote}>{invoice.gstNote}</Text>
        </View>
      </View>
    );
  };

  const renderInvoiceDetails = () => {
    if (!invoice) return null;

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{tr('invoice')}</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <Text style={styles.date}>{tr('date')}: {invoice.date}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tr('soldBy')}</Text>
          <Text style={styles.sellerName}>{invoice.sellerName}</Text>
          <Text style={styles.sellerInfo}>{invoice.sellerAddress}</Text>
          <Text style={styles.sellerInfo}>{tr('phone')}: {invoice.sellerPhone}</Text>
          <Text style={styles.sellerInfo}>{tr('email')}: {invoice.sellerEmail}</Text>
          <Text style={styles.sellerInfo}>{tr('gstin')}: {invoice.sellerGstin}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tr('billTo')}</Text>
          <Text style={styles.customerName}>{invoice.customerName}</Text>
          <Text style={styles.customerInfo}>{invoice.customerAddress}</Text>
          <Text style={styles.customerInfo}>{tr('phone')}: {invoice.customerPhone}</Text>
          <Text style={styles.customerInfo}>{tr('email')}: {invoice.customerEmail}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tr('items')}</Text>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemDetails}>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.itemMeta}>HSN: {item.hsnCode}</Text>
                <Text style={styles.itemMeta}>Qty: {item.quantity}</Text>
                <Text style={styles.itemMeta}>Price: ₹{item.unitPrice.toFixed(2)}</Text>
                <Text style={styles.itemMeta}>Tax: {item.taxPercent}%</Text>
              </View>
              <Text style={styles.itemTotal}>₹{item.lineTotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tr('orderDetails')}</Text>
          <Text style={styles.orderInfo}>{tr('orderId')}: {invoice.orderId}</Text>
          <Text style={styles.orderInfo}>{tr('orderDate')}: {invoice.orderDate}</Text>
        </View>

        {renderGstBreakdown()}

        <View style={styles.totalsSection}>
          <Text style={styles.totalsLabel}>{tr('subtotalBeforeTax')}: ₹{invoice.subtotalBeforeTax.toFixed(2)}</Text>
          <Text style={styles.totalsLabel}>{tr('shippingCharges')}: ₹{invoice.shippingCharge.toFixed(2)}</Text>
          <Text style={styles.grandTotalLabel}>{tr('grandTotal')}: ₹{invoice.grandTotal.toFixed(2)}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{tr('generatedBy')}</Text>
        </View>
      </ScrollView>
    );
  };

  useEffect(() => {
    if (params?.orderId) {
      fetchInvoice(parseInt(params.orderId as string));
    }
  }, [params?.orderId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000080" />
        <Text style={styles.loadingText}>{tr('loading')}</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{tr('invoiceNotFound')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>{tr('back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderInvoiceDetails()}
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.downloadButton} 
          onPress={downloadInvoice}
        >
          <Text style={styles.downloadButtonText}>{tr('downloadInvoice')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.printButton} 
          onPress={downloadInvoice}
        >
          <Text style={styles.printButtonText}>{tr('printInvoice')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  invoiceNumber: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  sellerInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  customerInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemDetails: {
    flex: 1,
    alignItems: 'flex-start',
  },
  itemDescription: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  itemMeta: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  gstSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  gstTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  gstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  gstLabel: {
    fontSize: 14,
    color: '#666',
  },
  gstValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  gstSummary: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  gstSummaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  gstSummaryRow: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  gstNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  totalsSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  totalsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  downloadButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  printButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});
