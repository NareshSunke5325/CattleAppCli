// components/AddUserModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface AddUserModalProps {
  visible: boolean;
  onClose: () => void;
  onAddUser: (userData: any) => Promise<void>;
  isAdding: boolean;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  visible,
  onClose,
  onAddUser,
  isAdding,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    active: true,
    roles: ['ROLE_WORKER'],
  });

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.username.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Name, Email, Username)');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    await onAddUser(formData);
    // Reset form on success
    setFormData({
      name: '',
      email: '',
      username: '',
      phone: '',
      active: true,
      roles: ['ROLE_WORKER'],
    });
  };

  const handleClose = () => {
    if (!isAdding) {
      setFormData({
        name: '',
        email: '',
        username: '',
        phone: '',
        active: true,
        roles: ['ROLE_WORKER'],
      });
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New User</Text>
            <TouchableOpacity onPress={handleClose} disabled={isAdding}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter full name"
                placeholderTextColor="#9CA3AF"
                editable={!isAdding}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter email address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isAdding}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username *</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                placeholder="Enter username"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                editable={!isAdding}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                editable={!isAdding}
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.label}>Active User</Text>
              <Switch
                value={formData.active}
                onValueChange={(value) => setFormData({ ...formData, active: value })}
                disabled={isAdding}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={formData.active ? '#fff' : '#fff'}
              />
            </View>

            <View style={styles.roleSelection}>
              <Text style={styles.label}>User Role *</Text>
              <View style={styles.roleOptions}>
                {['ROLE_WORKER', 'ROLE_MANAGER', 'ROLE_CUSTOMER'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      formData.roles[0] === role && styles.roleOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, roles: [role] })}
                    disabled={isAdding}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      formData.roles[0] === role && styles.roleOptionTextSelected
                    ]}>
                      {role.replace('ROLE_', '')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isAdding}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button, 
                styles.submitButton, 
                isAdding && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="person-add" size={16} color="#fff" />
                  <Text style={styles.submitButtonText}>Add User</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  form: {
    padding: 16,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  roleSelection: {
    marginBottom: 16,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  roleOptionSelected: {
    backgroundColor: '#3B82F6',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  roleOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AddUserModal;