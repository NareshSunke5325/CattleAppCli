import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageBackground,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Color } from '../theme';
import { getSingUpSubmit } from '../redux/user.services';
import StorageService from '../services/StorageService';

const DEVICE_HEIGHT = Dimensions.get('window').height;
const DEVICE_WIDTH = Dimensions.get('window').width;

const SignUpScreen = () => {
  const navigation = useNavigation<any>();

  const [emailId, setEmailId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modelText, setModelText] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isEmployeeIdFocused, setIsEmployeeIdFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Persist user info when email or employee ID changes
  useEffect(() => {
    const storeUserInfo = async () => {
      const userInfo = {
        EmailId: emailId,
        EmployeeId: employeeId
      };
      await StorageService.storeData('userInfo', userInfo);
    };

    if (emailId && employeeId) {
      storeUserInfo();
    }
  }, [emailId, employeeId]);

  const onSignUp = async () => {
    if (!emailId || !emailId.includes('@otsi')) {
      setModelText('Please enter a valid @otsi email');
      setShowErrorModal(true);
      return;
    }

    if (!employeeId) {
      setModelText('Please enter a valid employee ID');
      setShowErrorModal(true);
      return;
    }

    const params = {
      EmailId: emailId,
      EmployeeId: employeeId
    };

    setIsLoading(true);

    try {
      const signUpResponse = await getSingUpSubmit(params);

      if (signUpResponse?.data?.success) {
        navigation.navigate('VerifyOtpScreen', { signupData: params });
      } else {
        Alert.alert('Error', 'Please check your SignUp details');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      style={{
        backgroundColor: Color.bgColor,
        justifyContent: 'flex-start',
        height: DEVICE_HEIGHT,
      }}>
      
      {/* Background Gradient Overlay */}
      <View style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Color.logoBlue2,
      }} />

      {/* Floating Elements for Visual Interest */}
      <View style={{
        position: 'absolute',
        top: 80,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
      }} />
      <View style={{
        position: 'absolute',
        top: 180,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
      }} />
      <View style={{
        position: 'absolute',
        top: 300,
        right: 50,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(245, 101, 101, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(245, 101, 101, 0.2)',
      }} />
      
      <SafeAreaView style={[styles.container, styles.horizontal]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            
            {/* Logo Section */}
            <View style={{
              alignItems: 'center',
              paddingTop: 40,
              paddingBottom: 30,
            }}>
              <Image
                 source={require('../images/OTSi_Logo-vector-white.png')}
                resizeMode="contain"
                style={{ 
                  width: DEVICE_WIDTH * 0.3, 
                  height: 70, 
                  marginBottom: 16 
                }}
              />
              <Image
                 source={require('../images/OTSi_Text_Logo-vector-white.png')}
                resizeMode="contain"
                style={{ 
                  width: DEVICE_WIDTH * 0.6, 
                  height: 60, 
                  marginBottom: 12 
                }}
              />
              <View style={{
                alignItems: 'center',
                marginTop: 8
              }}>
                <Text style={{
                  textAlign: 'center',
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#ffffff',
                  letterSpacing: 1,
                  textShadowColor: 'rgba(0, 0, 0, 0.3)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 3,
                }}>
                  Employee Portal
                </Text>
                <View style={{
                  width: 60,
                  height: 2,
                  backgroundColor: Color.logoBlue5,
                  borderRadius: 1,
                  marginTop: 8,
                  opacity: 0.8
                }} />
              </View>
            </View>

            {/* Sign Up Form Card */}
            <View style={{
              margin: 20,
              borderRadius: 28,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 12,
            }}>
              
              {/* Glass Background Layers */}
              <View style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                borderRadius: 28,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.18)',
              }} />
              
              <View style={{
                position: 'absolute',
                top: 2, left: 2, right: 2, bottom: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 26,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
              }} />

              {/* Form Content */}
              <View style={{
                backgroundColor: 'rgba(247, 247, 247, 0.95)',
                borderRadius: 28,
                padding: 32,
                paddingTop: 40,
                paddingBottom: 40,
              }}>
                
                {/* Form Header */}
                <View style={{
                  alignItems: 'center',
                  marginBottom: 32
                }}>
                  <Text style={{
                    fontSize: 28,
                    fontWeight: 'bold',
                    color: Color.logoBlue4,
                    marginBottom: 8,
                    textAlign: 'center'
                  }}>
                    Join Our Team
                  </Text>
                  <Text style={{
                    fontSize: 15,
                    color: 'rgba(15, 52, 96, 0.7)',
                    textAlign: 'center',
                    fontWeight: '300'
                  }}>
                    Sign up to access your employee portal
                  </Text>
                </View>

                {/* Email Input */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: Color.logoBlue4,
                    marginBottom: 8,
                    marginLeft: 4,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    Email Address
                  </Text>
                  
                  <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: isEmailFocused ? Color.logoBlue5 : 'rgba(211, 211, 211, 0.5)',
                    shadowColor: isEmailFocused ? Color.logoBlue5 : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isEmailFocused ? 0.2 : 0.05,
                    shadowRadius: isEmailFocused ? 8 : 4,
                    elevation: isEmailFocused ? 6 : 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    overflow: 'hidden'
                  }}>
                    {/* Icon */}
                    <View style={{
                      paddingLeft: 16,
                      paddingRight: 8
                    }}>
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: isEmailFocused ? 'rgba(15, 52, 96, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Text style={{ fontSize: 12 }}>📧</Text>
                      </View>
                    </View>
                    
                    {/* Input */}
                    <TextInput 
                      style={{
                        flex: 1,
                        height: 56,
                        fontSize: 16,
                        color: '#333',
                        fontWeight: '400',
                        paddingRight: 16
                      }}
                      placeholder='Enter your @otsi email'
                      placeholderTextColor='rgba(0, 0, 0, 0.4)'
                      keyboardType='email-address'
                      value={emailId}
                      onChangeText={setEmailId}
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      autoCorrect={false}
                      autoCapitalize='none'
                      selectionColor={Color.logoBlue5}
                    />
                    
                    {/* Validation Indicator */}
                    {emailId.length > 0 && (
                      <View style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: emailId.includes('@otsi') ? '#10b981' : '#f59e0b',
                        marginRight: 16
                      }} />
                    )}
                  </View>
                </View>

                {/* Employee ID Input */}
                <View style={{ marginBottom: 32 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: Color.logoBlue4,
                    marginBottom: 8,
                    marginLeft: 4,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    Employee ID
                  </Text>
                  
                  <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: isEmployeeIdFocused ? Color.logoBlue5 : 'rgba(211, 211, 211, 0.5)',
                    shadowColor: isEmployeeIdFocused ? Color.logoBlue5 : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isEmployeeIdFocused ? 0.2 : 0.05,
                    shadowRadius: isEmployeeIdFocused ? 8 : 4,
                    elevation: isEmployeeIdFocused ? 6 : 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    overflow: 'hidden'
                  }}>
                    {/* Icon */}
                    <View style={{
                      paddingLeft: 16,
                      paddingRight: 8
                    }}>
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: isEmployeeIdFocused ? 'rgba(15, 52, 96, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Text style={{ fontSize: 12 }}>🆔</Text>
                      </View>
                    </View>
                    
                    {/* Input */}
                    <TextInput 
                      style={{
                        flex: 1,
                        height: 56,
                        fontSize: 16,
                        color: '#333',
                        fontWeight: '400',
                        paddingRight: 16
                      }}
                      placeholder='Enter your Employee ID'
                      placeholderTextColor='rgba(0, 0, 0, 0.4)'
                      keyboardType='number-pad'
                      maxLength={5}
                      value={employeeId}
                      onChangeText={setEmployeeId}
                      onFocus={() => setIsEmployeeIdFocused(true)}
                      onBlur={() => setIsEmployeeIdFocused(false)}
                      autoCorrect={false}
                      selectionColor={Color.logoBlue5}
                    />
                    
                    {/* Validation Indicator */}
                    {employeeId.length > 0 && (
                      <View style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: employeeId.length >= 3 ? '#10b981' : '#f59e0b',
                        marginRight: 16
                      }} />
                    )}
                  </View>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                  onPress={onSignUp}
                  disabled={isLoading}
                  style={{
                    backgroundColor: Color.logoBlue5,
                    borderRadius: 18,
                    height: 56,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: Color.logoBlue5,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                    marginBottom: 24,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  activeOpacity={0.8}
                >
                  {/* Button shine effect */}
                  <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18
                  }} />
                  
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}>
                      <Text style={{
                        color: '#fff',
                        fontSize: 18,
                        fontWeight: 'bold',
                        letterSpacing: 0.5,
                        marginRight: 8
                      }}>
                        Create Account
                      </Text>
                      <Text style={{ color: '#fff', fontSize: 16 }}>✨</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Terms & Conditions */}
                <View style={{
                  alignItems: 'center',
                  paddingVertical: 8
                }}>
                  <Text style={{
                    color: 'rgba(15, 52, 96, 0.6)',
                    fontSize: 12,
                    textAlign: 'center',
                    lineHeight: 16
                  }}>
                    By signing up, you agree to our{'\n'}
                    <Text style={{ color: Color.logoBlue5, fontWeight: '500' }}>
                      Terms & Conditions
                    </Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Login Link */}
            <TouchableOpacity
              style={{
                marginTop: 16,
                marginBottom: 32,
                alignSelf: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
              onPress={() => navigation.navigate('LoginScreen')}
              activeOpacity={0.7}
            >
              <Text style={{
                color: '#ffffff',
                fontSize: 16,
                textAlign: 'center',
                fontWeight: '500'
              }}>
                Already have an account? Sign in
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      {/* Loading Overlay */}
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999
        }}>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            minWidth: 120
          }}>
            <ActivityIndicator size="large" color={Color.logoBlue5} />
            <Text style={{
              marginTop: 12,
              color: Color.logoBlue4,
              fontSize: 16,
              fontWeight: '500'
            }}>
              Creating account...
            </Text>
          </View>
        </View>
      )}

      {/* Enhanced Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showErrorModal}
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Glassmorphism Modal */}
          <View style={{
            width: DEVICE_WIDTH * 0.8,
            maxWidth: 320,
            borderRadius: 24,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 12,
          }}>
            {/* Glass Background Layers */}
            <View style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }} />
            
            <View style={{
              backgroundColor: 'rgba(247, 247, 247, 0.98)',
              borderRadius: 24,
              padding: 28,
              alignItems: 'center',
            }}>
              {/* Error Icon */}
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16
              }}>
                <Text style={{ fontSize: 24 }}>⚠️</Text>
              </View>

              {/* Error Message */}
              <Text style={{
                color: '#374151',
                fontSize: 18,
                fontWeight: '600',
                textAlign: 'center',
                marginBottom: 8
              }}>
                Validation Error
              </Text>
              
              <Text style={{
                color: '#6b7280',
                fontSize: 16,
                textAlign: 'center',
                marginBottom: 24,
                lineHeight: 22
              }}>
                {modelText || 'Please fill in all fields correctly'}
              </Text>

              {/* Close Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: Color.logoBlue5,
                  paddingVertical: 12,
                  paddingHorizontal: 32,
                  borderRadius: 12,
                  shadowColor: Color.logoBlue5,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 'bold',
                  letterSpacing: 0.5
                }}>
                  Got it
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    flex: 1
  },
  horizontal: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: 10,
  },
});

export default SignUpScreen;