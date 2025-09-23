import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import { RootState, useAppDispatch } from '../store/store';
import { loginUser } from '../store/slices/authSlice';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Color } from '../theme';

const { height: DEVICE_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  const [username, setUsername] = useState('manager');
  const [password, setPassword] = useState('password123');
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigation.navigate('Home');
    }
  }, [isAuthenticated]);

  const onLogin = async () => {
    if (!username.trim()) {
      Alert.alert('', 'Please Enter Username');
      return;
    }
    if (!password.trim()) {
      Alert.alert('', 'Please Enter Password');
      return;
    }

    try {
      const result = await dispatch(loginUser({ username: username.trim(), password }));
      if (loginUser.fulfilled.match(result)) {
        navigation.navigate('Home');
      } else {
        Alert.alert('', 'Invalid username or password. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <ImageBackground
      source={require('../images/cattle-yard-desktop.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View style={styles.logoSection}>
              <View style={styles.logoBox}>
                <Image
                  source={require('../images/logo.jpg')}
                  style={styles.logo}
                />
              </View>
              <Text style={styles.appName}>Cattle Yard Management</Text>
              <View style={styles.divider} />
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sign In</Text>
              <Text style={styles.cardSubtitle}>
                Access your yard dashboard
              </Text>

              {/* Username */}
              <Text style={styles.label}>Username</Text>
              <View
                style={[
                  styles.inputContainer,
                  isUsernameFocused && styles.inputFocused,
                ]}
              >
                <Icon name="user" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="manager"
                  placeholderTextColor="rgba(0,0,0,0.4)"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setIsUsernameFocused(true)}
                  onBlur={() => setIsUsernameFocused(false)}
                />
                {!!username && (
                  <View
                    style={[
                      styles.dot,
                      username.length >= 3 ? styles.dotValid : styles.dotInvalid,
                    ]}
                  />
                )}
              </View>

              {/* Password */}
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  isPasswordFocused && styles.inputFocused,
                ]}
              >
                <Icon name="lock" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="••••••"
                  placeholderTextColor="rgba(0,0,0,0.4)"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon
                    name={showPassword ? 'eye-slash' : 'eye'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
                {!!password && (
                  <View
                    style={[
                      styles.dot,
                      password.length >= 6 ? styles.dotValid : styles.dotInvalid,
                    ]}
                  />
                )}
              </View>

              {/* Remember Me & Forgot */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.forgot}>Forgot?</Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              {/* Login Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={onLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Access Yard</Text>
                )}
              </TouchableOpacity>

              {/* Features Row */}
              <View style={styles.featuresRow}>
                <View style={styles.iconItem}>
                  <Icon name="users" size={18} color={Color.primary} />
                  <Text style={styles.iconText}>RBAC</Text>
                </View>
                <View style={styles.iconItem}>
                  <Icon name="shield" size={18} color={Color.primary} />
                  <Text style={styles.iconText}>Secure</Text>
                </View>
                <View style={styles.iconItem}>
                  <Icon name="mobile" size={18} color={Color.primary} />
                  <Text style={styles.iconText}>Mobile</Text>
                </View>
              </View>
            </View>

            {/* Footer Credit */}
            <Text style={styles.footerText}>
              Designed & Developed by{' '}
              <Text style={styles.footerLink}>Object Technology Solutions</Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Color.primary} />
            <Text style={styles.loadingText}>Accessing yard...</Text>
          </View>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backgroundImage: { flex: 1, width: '100%', height: DEVICE_HEIGHT },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  safeArea: { flex: 1, justifyContent: 'center' },
  scroll: { padding: 24, paddingBottom: 40 },
  logoSection: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 0.01,
    borderColor: '#fff',
    elevation: 8,
  },
  logo: { width: 110, height: 110, borderRadius: 24 },
  appName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  divider: {
    width: 80,
    height: 3,
    backgroundColor: Color.primary,
    borderRadius: 2,
    marginTop: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    padding: 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(46,139,87,0.7)',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Color.primary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(46,139,87,0.2)',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  inputFocused: { borderColor: Color.primary, elevation: 6 },
  input: { flex: 1, marginHorizontal: 8, fontSize: 16, color: '#333' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotValid: { backgroundColor: Color.success, marginRight: 12 },
  dotInvalid: { backgroundColor: Color.warning, marginRight: 12 },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'rgba(46,139,87,0.5)',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Color.primary,
    borderColor: Color.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberText: {
    fontSize: 14,
    color: Color.primary,
  },
  forgot: {
    fontSize: 14,
    color: Color.primary,
    fontWeight: '500',
  },
  errorText: {
    color: Color.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: Color.primary,
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    elevation: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 5,
  },
  iconItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 12,
    color: Color.primary,
    marginLeft: 6,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(46,139,87,0.8)',
    textAlign: 'center',
    marginTop: 16,
  },
  footerLink: {
    color: Color.primary,
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
  },
  loadingText: { marginTop: 12, color: Color.primary, fontSize: 16 },
});