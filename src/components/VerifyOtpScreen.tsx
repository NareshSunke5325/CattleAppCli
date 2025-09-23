import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Color } from '../theme';
import StorageService from '../services/StorageService';
import { VerifyOtpAndSetPassword } from '../redux/user.services';
import Icon from 'react-native-vector-icons/MaterialIcons';

const DEVICE_WIDTH = Dimensions.get('window').width;

const VerifyOtpScreen = ({ navigation }: any) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const otpInputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = await StorageService.getData<any>('userInfo');
      setUserInfo(storedUser);
    };
    fetchUser();
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');

    if (!newPassword || !confirmPassword || fullOtp.length < 6) {
      Alert.alert('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }

    if (!userInfo?.EmployeeId) {
      Alert.alert('User info not found');
      return;
    }

    const payload = {
      EmployeeId: userInfo.EmployeeId,
      otp: fullOtp,
      newPassword: newPassword,
    };

    setIsLoading(true);

    try {
      const response = await VerifyOtpAndSetPassword(payload);

      if (response?.data?.success) {
        Alert.alert('Success', 'Password has been reset!', [
          { text: 'Login', onPress: () => navigation.navigate('LoginScreen') },
        ]);
      } else {
        Alert.alert('Error', 'Invalid OTP or details');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    Alert.alert(
      'Go Back?', 
      'Are you sure you want to go back? You will need to request a new OTP.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Go Back', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Background Gradient Overlay */}
        <View style={styles.backgroundOverlay} />
        
        {/* Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
            disabled={isLoading}
          >
            <Icon
              name="arrow-back"
              color={'#fff'}
              size={24}
            />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Verify OTP</Text>
            <View style={styles.headerUnderline} />
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.card}>
            {/* Icon Header */}
            <View style={styles.iconContainer}>
              <Icon name="verified-user" size={48} color={Color.logoBlue4} />
            </View>

            <Text style={styles.title}>Verify OTP & Set Password</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to your registered email and create a new password
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => (otpInputs.current[index] = ref)}
                  style={[
                    styles.otpInput, 
                    isLoading ? styles.otpInputDisabled : {},
                    digit ? styles.otpInputFilled : {}
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  editable={!isLoading}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      const updatedOtp = [...otp];
                      if (otp[index] === '') {
                        if (index > 0) {
                          updatedOtp[index - 1] = '';
                          setOtp(updatedOtp);
                          otpInputs.current[index - 1]?.focus();
                        }
                      } else {
                        updatedOtp[index] = '';
                        setOtp(updatedOtp);
                      }
                    }
                  }}
                />
              ))}
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="rgba(0,0,0,0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                editable={!isLoading}
                placeholderTextColor="rgba(0,0,0,0.4)"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock-outline" size={20} color="rgba(0,0,0,0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isLoading}
                placeholderTextColor="rgba(0,0,0,0.4)"
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.6}
              style={styles.resendContainer}
              disabled={true}
            >
              <Text style={styles.resendText}>
                Didn't receive code? <Text style={styles.comingSoon}>Resend (coming soon)</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Verifying...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Icon name="check-circle" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Verify & Set Password</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyOtpScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.logoBlue3,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(22, 142, 179, 0.7)',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Color.logoBlue2,//bg
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitleText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerUnderline: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
    marginTop: 2,
  },
  headerSpacer: {
    width: 44,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    width: DEVICE_WIDTH * 0.9,
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(15, 52, 96, 0.05)',
    borderRadius: 50,
    alignSelf: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Color.logoBlue4,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(15, 52, 96, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 8,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  otpInputFilled: {
    borderColor: Color.logoBlue4,
    backgroundColor: 'rgba(15, 52, 96, 0.05)',
  },
  otpInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  inputIcon: {
    position: 'absolute',
    left: 20,
    top: 18,
    zIndex: 1,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    height: 56,
    paddingLeft: 50,
    paddingRight: 20,
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  resendContainer: {
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  resendText: {
    color: Color.logoBlue4,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  comingSoon: {
    textDecorationLine: 'underline',
    color: Color.logoBlue5,
    fontWeight: '600',
  },
  button: {
    backgroundColor: Color.logoBlue5,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Color.logoBlue5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(15, 52, 96, 0.5)',
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});