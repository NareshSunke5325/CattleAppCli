import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { loginUser, checkAuthStatus, clearError } from '../store/slices/authSlice';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Color } from '../theme';

const { height: DEVICE_HEIGHT } = Dimensions.get('window');

// Enhanced token validation function
const isValidTokenResponse = (response: any): boolean => {
  const isValid = (
    response &&
    response.accessToken &&
    typeof response.accessToken === 'string' &&
    response.accessToken.length > 0 &&
    response.refreshToken &&
    typeof response.refreshToken === 'string' &&
    response.refreshToken.length > 0 &&
    response.tokenType === 'Bearer'
  );

  console.log('Token validation result:', {
    isValid,
    hasAccessToken: !!response?.accessToken,
    hasRefreshToken: !!response?.refreshToken,
    tokenType: response?.tokenType,
    accessTokenLength: response?.accessToken?.length
  });

  return isValid;
};

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { 
    isAuthenticated, 
    loading, 
    error, 
    accessToken, 
    refreshToken,
    rememberMe: persistedRememberMe 
  } = useSelector((state: RootState) => state.auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(persistedRememberMe || false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const loadingProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('Auth State Changed:', {
      isAuthenticated,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length,
      refreshTokenLength: refreshToken?.length,
      error
    });

    // Check if user is properly authenticated with valid tokens
    if (isAuthenticated && accessToken && refreshToken) {
      console.log('✅ Navigation conditions met - navigating to Home');
      
      // Animate success before navigation
      Animated.parallel([
        Animated.timing(loadingProgress, {
          toValue: 100,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Use replace instead of navigate to prevent going back to login
        setTimeout(() => {
          navigation.replace('Home');
        }, 300);
      });
    } else if (loginAttempted && !loading && !isAuthenticated) {
      console.log('❌ Login failed - showing error');
      // Error will be shown via the error state from Redux
    }
  }, [isAuthenticated, accessToken, refreshToken, loading, loginAttempted]);

  // Check auth status on component mount with animations
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 Initializing auth check...');
      
      // Start loading animation
      Animated.timing(loadingProgress, {
        toValue: 30,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      await dispatch(checkAuthStatus());
      
      // Complete initial loading
      Animated.timing(loadingProgress, {
        toValue: 100,
        duration: 500,
        useNativeDriver: false,
      }).start(() => {
        // Reveal content with staggered animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideUpAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(logoScaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsInitializing(false);
        });
      });
    };

    initializeAuth();
  }, []);

  // Clear error when user starts typing
  useEffect(() => {
    if (error && (username || password)) {
      dispatch(clearError());
    }
  }, [username, password]);

  // Loading animation during login
  useEffect(() => {
    if (loading) {
      // Start pulsing animation for login loading
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoScaleAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(logoScaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Progress bar animation
      Animated.timing(loadingProgress, {
        toValue: 80,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    } else {
      // Reset animations when loading stops
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const onLogin = async () => {
    if (!username.trim()) {
      Alert.alert('', 'Please Enter Username');
      return;
    }
    if (!password.trim()) {
      Alert.alert('', 'Please Enter Password');
      return;
    }

    // Reset states
    setLoginAttempted(true);
    
    // Reset loading progress
    loadingProgress.setValue(0);
    
    try {
      const result = await dispatch(loginUser({ 
        username: username.trim(), 
        password,
        rememberMe 
      }));

      // Check if the action was fulfilled and has valid tokens
      if (loginUser.fulfilled.match(result) && result.payload) {
        if (isValidTokenResponse(result.payload)) {
          console.log('Login successful with tokens:', {
            accessToken: result.payload.accessToken ? 'present' : 'missing',
            refreshToken: result.payload.refreshToken ? 'present' : 'missing',
            expiresIn: result.payload.expiresInSeconds,
            tokenType: result.payload.tokenType,
            rememberMe: result.payload.rememberMe
          });
          
          console.log('🎉 Login successful! Navigation will happen automatically.');
          
        } else {
          console.log('Invalid token response structure:', result.payload);
          Alert.alert('Login Failed', 'Invalid server response. Please try again.');
          loadingProgress.setValue(0);
        }
      } else if (loginUser.rejected.match(result)) {
        // Show the specific error from the authSlice
        const errorMessage = extractErrorMessage(result.payload);
        console.log('Login rejected with error:', errorMessage);
        loadingProgress.setValue(0);
      }
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      loadingProgress.setValue(0);
    }
  };

  // Helper function to extract error message from various error formats
  const extractErrorMessage = (errorPayload: any): string => {
    if (!errorPayload) return 'Login failed. Please try again.';
    
    if (typeof errorPayload === 'string') {
      return errorPayload;
    }
    
    if (errorPayload.message) {
      return errorPayload.message;
    }
    
    if (errorPayload.error) {
      return errorPayload.error;
    }
    
    if (errorPayload.detail) {
      return errorPayload.detail;
    }
    
    // Handle API error structure
    if (errorPayload.response?.data) {
      const apiError = errorPayload.response.data;
      if (typeof apiError === 'string') return apiError;
      if (apiError.message) return apiError.message;
      if (apiError.error) return apiError.error;
    }
    
    return 'Login failed. Please check your credentials and try again.';
  };

  // Handle forgot password
  const onForgotPassword = () => {
    Alert.alert('Forgot Password', 'Please contact your administrator to reset your password.');
  };

  // Animated logo with rotation for success
  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Progress bar width interpolation
  const progressWidth = loadingProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <ImageBackground
      source={require('../images/cattle-yard-desktop.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      {/* Initial Loading Screen */}
      {isInitializing && (
        <View style={styles.initialLoadingContainer}>
          <Animated.View 
            style={[
              styles.initialLogoContainer,
              {
                transform: [
                  { scale: logoScaleAnim },
                  { rotate: logoRotate }
                ],
              }
            ]}
          >
            <Image
              source={require('../images/logo.jpg')}
              style={styles.initialLogo}
            />
            <Text style={styles.initialLoadingText}>CATTLE YARD</Text>
            <Text style={styles.initialLoadingSubtext}>Loading...</Text>
          </Animated.View>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                { width: progressWidth }
              ]} 
            />
          </View>
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }}
          >
            {/* Logo */}
            <View style={styles.logoSection}>
              <Animated.View 
                style={[
                  styles.logoBox,
                  {
                    transform: [
                      { scale: logoScaleAnim }
                    ],
                  }
                ]}
              >
                <Image
                  source={require('../images/logo.jpg')}
                  style={styles.logo}
                />
              </Animated.View>
              <Text style={styles.appName}>CATTLE YARD MANAGEMENT</Text>
              <View style={styles.divider} />
            </View>

            {/* Form Card */}
            <Animated.View 
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideUpAnim }],
                }
              ]}
            >
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
                  error ? styles.inputError : null,
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
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
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
                  error ? styles.inputError : null,
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
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
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
                  disabled={loading}
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
                <TouchableOpacity onPress={onForgotPassword} disabled={loading}>
                  <Text style={[styles.forgot, loading && styles.disabledText]}>Forgot?</Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Icon name="exclamation-triangle" size={16} color={Color.error} />
                  <Text style={styles.errorText}>
                    {extractErrorMessage(error)}
                  </Text>
                </View>
              )}

              {/* Login Button with Progress Indicator */}
              <TouchableOpacity
                style={[
                  styles.button,
                  (loading || !username || !password) && styles.buttonDisabled
                ]}
                onPress={onLogin}
                disabled={loading || !username || !password}
              >
                <View style={styles.buttonContent}>
                  {loading ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.buttonText}>Accessing Yard...</Text>
                    </>
                  ) : (
                    <Text style={styles.buttonText}>Access Yard</Text>
                  )}
                </View>
                
                {/* In-button progress bar */}
                {(loading || isInitializing) && (
                  <Animated.View 
                    style={[
                      styles.buttonProgress,
                      { width: progressWidth }
                    ]} 
                  />
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
            </Animated.View>

            {/* Footer Credit */}
            <Animated.Text 
              style={[
                styles.footerText,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideUpAnim }],
                }
              ]}
            >
              Designed & Developed by{' '}
              <Text style={styles.footerLink}>Object Technology Solutions</Text>
            </Animated.Text>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Loading Overlay for login process */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Animated.View 
            style={[
              styles.loadingBox,
              {
                transform: [
                  { scale: logoScaleAnim }
                ],
              }
            ]}
          >
            <Image
              source={require('../images/logo.jpg')}
              style={styles.loadingLogo}
            />
            <ActivityIndicator size="large" color={Color.primary} style={styles.loadingSpinner} />
            <Text style={styles.loadingText}>Accessing yard...</Text>
            
            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  { width: progressWidth }
                ]} 
              />
            </View>
          </Animated.View>
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
  
  // Initial Loading Styles
  initialLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(46,139,87,0.95)',
    zIndex: 1000,
  },
  initialLogoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  initialLogo: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: 20,
  },
  initialLoadingText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  initialLoadingSubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Progress Bar Styles
  progressBarContainer: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  
  // Logo Section
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
    fontSize: 15,
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
  
  // Card Styles
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
  
  // Input Styles
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
  inputFocused: { 
    borderColor: Color.primary, 
    elevation: 6 
  },
  inputError: { 
    borderColor: Color.error 
  },
  input: { 
    flex: 1, 
    marginHorizontal: 8, 
    fontSize: 16, 
    color: '#333' 
  },
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3 
  },
  dotValid: { 
    backgroundColor: Color.success, 
    marginRight: 12 
  },
  dotInvalid: { 
    backgroundColor: Color.warning, 
    marginRight: 12 
  },
  
  // Options Row
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
  disabledText: {
    opacity: 0.5,
  },
  
  // Error Styles
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Color.error,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  
  // Button Styles
  button: {
    backgroundColor: Color.primary,
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(46,139,87,0.5)',
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  
  // Features Row
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
  
  // Footer
  footerText: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    marginTop: 30,
  },
  footerLink: {
    color: "#4cd193ff",
    fontWeight: '500',
  },
  
  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 12,
    minWidth: 200,
  },
  loadingLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingSpinner: {
    marginBottom: 12,
  },
  loadingText: { 
    color: Color.primary, 
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
});