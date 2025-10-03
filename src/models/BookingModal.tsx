import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { Color } from '../theme';

import { useAppDispatch, useAppSelector } from '../store/store';
import { Calendar } from 'react-native-calendars';

interface Herd {
  herdType: string;
  headCount: number;
  feedType: string | null;
}

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  yardIds: number[];
  yardCodes: string[];
  onBookingSuccess: () => void;
}

const FEED_TYPES = [
  'HAY',
  'SILAGE',
  'GRAINS',
  'PELLETS',
  'MIXED_RATION',
  'MINERAL',
  'WATER'
];

const HERD_TYPES = ['COWS', 'CALVES', 'BULLS', 'HEIFERS'];

export default function BookingModal({
  visible,
  onClose,
  yardIds,
  yardCodes,
  onBookingSuccess,
}: BookingModalProps) {
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    contactName: '',
    contactPhone: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
    remarks: '',
  });
  
  const [herds, setHerds] = useState<Herd[]>([
    { herdType: 'COWS', headCount: 0, feedType: null },
    { herdType: 'CALVES', headCount: 0, feedType: null },
  ]);

  const [selectedFeedType, setSelectedFeedType] = useState('PELLETS');

  useEffect(() => {
    // Update all herds with selected feed type
    setHerds(prevHerds => 
      prevHerds.map(herd => ({
        ...herd,
        feedType: selectedFeedType
      }))
    );
  }, [selectedFeedType]);

  const calculateTotalHeads = () => {
    return herds.reduce((total, herd) => total + herd.headCount, 0);
  };

  const updateHerdCount = (index: number, count: number) => {
    const newHerds = [...herds];
    newHerds[index].headCount = Math.max(0, count);
    setHerds(newHerds);
  };

  const addHerd = () => {
    if (herds.length < HERD_TYPES.length) {
      const availableTypes = HERD_TYPES.filter(type => 
        !herds.some(herd => herd.herdType === type)
      );
      if (availableTypes.length > 0) {
        setHerds([
          ...herds,
          { herdType: availableTypes[0], headCount: 0, feedType: selectedFeedType }
        ]);
      }
    }
  };

  const removeHerd = (index: number) => {
    if (herds.length > 1) {
      const newHerds = herds.filter((_, i) => i !== index);
      setHerds(newHerds);
    }
  };

  // Date picker functions using react-native-date-picker
  const showStartPicker = () => {
    setShowStartDatePicker(true);
    setShowEndDatePicker(false);
  };

  const showEndPicker = () => {
    setShowEndDatePicker(true);
    setShowStartDatePicker(false);
  };

  const handleStartDateConfirm = (date: Date) => {
    setFormData(prev => ({ 
      ...prev, 
      startTime: date,
      // Auto-adjust end time to be 2 hours after start time
      endTime: new Date(date.getTime() + 2 * 60 * 60 * 1000)
    }));
    setShowStartDatePicker(false);
  };

  const handleEndDateConfirm = (date: Date) => {
    setFormData(prev => ({ ...prev, endTime: date }));
    setShowEndDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.contactName.trim()) {
      Alert.alert('Error', 'Please enter contact name');
      return;
    }

    if (!formData.contactPhone.trim()) {
      Alert.alert('Error', 'Please enter contact phone');
      return;
    }

    const totalHeads = calculateTotalHeads();
    if (totalHeads === 0) {
      Alert.alert('Error', 'Please add at least one animal');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        yardIds,
        herds: herds.filter(herd => herd.headCount > 0),
        requestedDecks: Math.ceil(totalHeads / 10).toString(), // Assuming 10 animals per deck
        requestedHeadCount: totalHeads,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime.toISOString(),
        remarks: formData.remarks,
      };

      const response = await fetch('https://sandbox-pro163.com/api/v1/bookings/yard-booking', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success', 
          `Booking created successfully!\nBooking ID: ${data.bookingId}`,
          [
            {
              text: 'OK',
              onPress: () => {
                onBookingSuccess();
                onClose();
                resetForm();
              }
            }
          ]
        );
      } else {
        throw new Error(data.message || 'Failed to create booking');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      contactName: '',
      contactPhone: '',
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      remarks: '',
    });
    setHerds([
      { herdType: 'COWS', headCount: 0, feedType: 'PELLETS' },
      { herdType: 'CALVES', headCount: 0, feedType: 'PELLETS' },
    ]);
    setSelectedFeedType('PELLETS');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const estimatedCost = calculateTotalHeads() * 10.33; // Example calculation

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Book your cattle</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={Color.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Selected Yards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {yardCodes.length} yard{yardCodes.length > 1 ? 's' : ''} selected
            </Text>
            <View style={styles.yardsContainer}>
              {yardCodes.map((code, index) => (
                <View key={index} style={styles.yardTag}>
                  <Text style={styles.yardTagText}>{code}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <TextInput
              style={styles.input}
              placeholder="Contact Name"
              value={formData.contactName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, contactName: text }))}
              placeholderTextColor={Color.textLight}
            />
            <TextInput
              style={styles.input}
              placeholder="Contact Phone"
              value={formData.contactPhone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, contactPhone: text }))}
              placeholderTextColor={Color.textLight}
              keyboardType="phone-pad"
            />
          </View>

          {/* Feed Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feed Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.feedScrollView}>
              {FEED_TYPES.map((feedType) => (
                <TouchableOpacity
                  key={feedType}
                  style={[
                    styles.feedTypeButton,
                    selectedFeedType === feedType && styles.feedTypeButtonSelected
                  ]}
                  onPress={() => setSelectedFeedType(feedType)}
                >
                  <Text style={[
                    styles.feedTypeText,
                    selectedFeedType === feedType && styles.feedTypeTextSelected
                  ]}>
                    {feedType}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Timing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timing</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={showStartPicker}
            >
              <Text style={styles.dateButtonText}>Start: {formatDate(formData.startTime)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={showEndPicker}
            >
              <Text style={styles.dateButtonText}>End: {formatDate(formData.endTime)}</Text>
            </TouchableOpacity>

            {/* Date Pickers */}
            <Calendar
              modal
              open={showStartDatePicker}
              date={formData.startTime}
              mode="datetime"
              onConfirm={handleStartDateConfirm}
              onCancel={handleDateCancel}
              title="Select Start Time"
              confirmText="Confirm"
              cancelText="Cancel"
              minimumDate={new Date()}
            />

            <Calendar 
              modal
              open={showEndDatePicker}
              date={formData.endTime}
              mode="datetime"
              onConfirm={handleEndDateConfirm}
              onCancel={handleDateCancel}
              title="Select End Time"
              confirmText="Confirm"
              cancelText="Cancel"
              minimumDate={formData.startTime}
            />
          </View>

          {/* Herds */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Herds</Text>
              {herds.length < HERD_TYPES.length && (
                <TouchableOpacity style={styles.addButton} onPress={addHerd}>
                  <Text style={styles.addButtonText}>+ Add herd</Text>
                </TouchableOpacity>
              )}
            </View>

            {herds.map((herd, index) => (
              <View key={index} style={styles.herdRow}>
                <Text style={styles.herdType}>{herd.herdType}</Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity 
                    style={styles.counterButton}
                    onPress={() => updateHerdCount(index, herd.headCount - 1)}
                  >
                    <Text style={styles.counterButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.countText}>{herd.headCount}</Text>
                  <TouchableOpacity 
                    style={styles.counterButton}
                    onPress={() => updateHerdCount(index, herd.headCount + 1)}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                {herds.length > 1 && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeHerd(index)}
                  >
                    <Icon name="delete" size={20} color={Color.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total heads: {calculateTotalHeads()}</Text>
              <Text style={styles.estimatedText}>Estimated total: AUD ${estimatedCost.toFixed(2)}</Text>
            </View>
          </View>

          {/* Remarks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Remarks (optional)</Text>
            <TextInput
              style={[styles.input, styles.remarksInput]}
              placeholder="Enter any remarks..."
              value={formData.remarks}
              onChangeText={(text) => setFormData(prev => ({ ...prev, remarks: text }))}
              placeholderTextColor={Color.textLight}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Color.bgColor,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.textPrimary,
    marginBottom: 12,
  },
  yardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yardTag: {
    backgroundColor: Color.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  yardTagText: {
    color: Color.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Color.textPrimary,
    marginBottom: 12,
  },
  remarksInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  feedScrollView: {
    marginBottom: 8,
  },
  feedTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  feedTypeButtonSelected: {
    backgroundColor: Color.primary,
    borderColor: Color.primary,
  },
  feedTypeText: {
    color: Color.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  feedTypeTextSelected: {
    color: '#fff',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: Color.textPrimary,
  },
  herdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
  },
  herdType: {
    fontSize: 16,
    color: Color.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Color.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 18,
    color: Color.primary,
    fontWeight: 'bold',
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Color.primaryLight,
    borderRadius: 6,
  },
  addButtonText: {
    color: Color.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  totalContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.textPrimary,
    marginBottom: 4,
  },
  estimatedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Color.success,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.primary,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Color.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: Color.primary,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: Color.textLight,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});