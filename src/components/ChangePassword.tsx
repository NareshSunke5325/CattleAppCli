import { createRef, useCallback, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Alert, Button, ImageBackground, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import {useNavigation} from '@react-navigation/native';
import { RootState, useAppDispatch, useAppSelector } from "../redux/store/store";
import { useSelector } from "react-redux";
import { updateLoginDetails } from "../redux/user.action";
import { changePassword } from "../services/services.action";
import { Color } from "../theme";
const  DEVICE_HEIGHT = Dimensions.get('window').height
const  DEVICE_WIDTH = Dimensions.get('window').width

const ChangePassword = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const userDetails = useSelector((state: RootState) => state.user.details);
  const oncurrentPassword = (text: string) => {
    console.log("in oncurrentPassword",text);
    setCurrentPassword(text);
  };
  const onnewPassword = (text: string) => {
    setNewPassword(text);
  };
  const onconfirmPassword = (text: string) => {
    setConfirmPassword(text);
  };
  
 
  const onDonePressed = async () => {
    console.log("currentPassword",currentPassword?.length)
    

    if(currentPassword?.length === 0)
    {
      Alert.alert('','Please Enter Current Password')
    }
    else if(newPassword?.length === 0)
    {
      Alert.alert('','Please Enter New Password')
    }
    else if(confirmPassword?.length === 0)
    {
      Alert.alert('','Please Enter Confirm Password')
    }
    else if(currentPassword == newPassword)
      {
        Alert.alert('','Current Password and New password are same!')
      }
    else if(newPassword !== confirmPassword)
    {
      Alert.alert('','New Password and Confirm password did not match!')
    }
    else
    {
      let params = {
        "EmployeeId": userDetails.employeeId,
        "OldPassword": currentPassword,
        "NewPassword": newPassword
      };
      
      const reponse = await dispatch(changePassword(params));
      console.log("changePassword1111111::::",reponse);
      if (reponse.payload === 200) {
        var copyUserDetails = {...userDetails};
        copyUserDetails.mustChangePassword = false;
        console.log("copyUserDetailscopyUserDetailscopyUserDetails::::::",copyUserDetails);
        await dispatch(updateLoginDetails(copyUserDetails));
        navigation.navigate('Home')
      }
      else
      {
        Alert.alert('Please check your details or try again later')
      }
      
    }
    
  };
    return (
      <ImageBackground
        //source={require('../images/imageBG.png')}
         style={{
          backgroundColor:Color.bgColor,
        justifyContent: 'flex-start',
        height:DEVICE_HEIGHT,

      }}>
        <SafeAreaView style={{flex: 0, backgroundColor: Color.logoBlue3}}/>
        <SafeAreaView style={[styles.container, styles.horizontal]}>
        <KeyboardAvoidingView
         behavior={ Platform.OS === 'ios' ? 'padding' : 'height' }>
          <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          <View style={{backgroundColor:Color.logoBlue3,width:'100%',height:40,borderBottomColor:'darkgray',borderBottomWidth:1,marginBottom:50}}>
            <Text style={styles.subTitle}>
                Change Password
            </Text>
          </View>
            
            
            <View style={{margin:10,paddingBottom:15}}>
            <View style={{width:'100%',height:'100%',position:'absolute',backgroundColor:'lightgray',borderRadius:10,opacity:0.4}}></View>
            <View style={{padding:10,borderRadius:10}}>
              <Text style={{fontSize:20,fontWeight:500, color:Color.logoBlue4}}> Current Password</Text>
                <TextInput style={{backgroundColor:'#fff',marginTop:10,borderColor:'lightgray',borderWidth:1,height:44,fontSize:18,paddingLeft:5,borderRadius:5}}
                    placeholder='Enter Current Password'
                    value={currentPassword}
                    secureTextEntry
                    onChangeText={text=> oncurrentPassword(text)}
                    autoCorrect={false}
                />
                <Text style={{fontSize:20,fontWeight:500,marginTop:20, color:Color.logoBlue4}}> New Password</Text>
                <TextInput style={{backgroundColor:'#fff',marginTop:10,borderColor:'lightgray',borderWidth:1,height:44,fontSize:18,paddingLeft:5,borderRadius:5}}
                    placeholder='Enter New Password'
                    value={newPassword}
                    secureTextEntry
                    onChangeText={onnewPassword}
                    autoCorrect={false}
                />
                <Text style={{fontSize:20,fontWeight:500,marginTop:20, color:Color.logoBlue4}}> Confirm Password</Text>
                <TextInput style={{backgroundColor:'#fff',marginTop:10,borderColor:'lightgray',borderWidth:1,height:44,fontSize:18,paddingLeft:5,borderRadius:5,marginBottom:15}}
                    placeholder='Confirm Password'
                    value={confirmPassword}
                    secureTextEntry
                    onChangeText={onconfirmPassword}
                    autoCorrect={false}
                />
            </View>
           <View style={{marginBottom:10}}>
           <Button 
                title="Done"
                color={Color.logoBlue5}
                onPress={onDonePressed}
            />
           </View>
           
           </View>
          

            </ScrollView>
           </KeyboardAvoidingView>
    
      </SafeAreaView>
      </ImageBackground>
    )

}
const styles = StyleSheet.create({
    container: {
      justifyContent: 'center',
    },
    horizontal: {
      flexDirection: 'column',
      justifyContent: 'space-around',
      padding: 10,
    },
    title: {
        textAlign: 'center',
        marginVertical: 8,
        fontSize:60
      },
      subTitle: {
        textAlign: 'center',
        marginVertical: 2,
        fontSize:20,
        color:'#fff'
      },
  });

export default ChangePassword;