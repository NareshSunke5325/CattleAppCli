import {useEffect, useState} from 'react';
import { View, Text, ImageBackground, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert } from "react-native";
import { Color } from '../theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../redux/store/store';
import { Dropdown } from 'react-native-element-dropdown';
import { getEmployeeProfile, getTechnologyList } from '../services/services.action';
import { profile } from '../interfaces/profile';
import { reset as resetUser} from '../redux/user.slice';

const  DEVICE_HEIGHT = Dimensions.get('window').height

export default function ProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const userDetails = useAppSelector((state) => state.user.details);
  const [myProfile, setMyProfile] = useState<profile>({} as any);
  // const myProfile = useAppSelector<profile>((state: any) => state.service.profile);
  // console.log("myProfile Data:::::",myProfile);


  
  function logoutCalled  () {
    Alert.alert('', 'User Unautorized! Please logout and login', [
      { text: 'Ok', onPress: () =>  {
        dispatch(resetUser());
        navigation.goBack();
        navigation.goBack();
      }},
     // { text: 'No', onPress: () => null },
    ]);
    
  };

  useEffect(() => {
    const getProfileDetails = async () => {
      const response = await dispatch(getEmployeeProfile(userDetails.employeeId));
      console.log("employee responsepayload:::::",response.payload);
      if(response.payload.MustChangePassword)
        {
          logoutCalled();
          return;
        }
      if (response.payload) {
        setMyProfile(response.payload)
        }
      }
      getProfileDetails();
  }, [])
   return (
    <ImageBackground
        //source={require('../images/imageBG.png')}
         style={{
          flex:1,
          backgroundColor:Color.bgColor,
        justifyContent: 'flex-start',
        height:DEVICE_HEIGHT,

      }}>
        <SafeAreaView style={[styles.container, styles.horizontal]}>
          
          <View style={{backgroundColor:Color.bgColor}}>
        <View style={{ backgroundColor:Color.logoBlue3, justifyContent:'space-between',flexDirection:'row',alignItems:'center',height:40,borderBottomColor:'darkgray',borderBottomWidth:1,marginBottom:0}}>
         <TouchableOpacity 
           style={{width:'33%', paddingLeft:10,alignContent:'center',alignSelf:'center'}}
           onPress={()=>{
            //this.props.navigation.navigate('DrawerOpen');
            navigation.dispatch(DrawerActions.openDrawer());
          }}
            >
           <Icon
              name="menu"
              color={'#fff'}
              size={35}
          />

        </TouchableOpacity>
            <Text style={styles.subTitle}>
                Profile
            </Text>
         <Text style={{width:'33%'}}></Text>
          </View>
          <ScrollView style={{height:DEVICE_HEIGHT-88}}>
          <View  
          style={{backgroundColor:Color.logoBlue1,width:'100%',height:200,borderBottomColor:'lightgray',borderBottomWidth:1, paddingTop:20,justifyContent: 'space-between'}}>
          <Icon
              style={{alignSelf:'center',borderRadius:50,borderWidth:1}}
              name="person"
              color={"black"}
              size={100}
          />
          <View style={{alignItems:'center',bottom:10}}>
            <Text style={{fontSize:20,marginBottom:10, color:'#fff'}}>{userDetails.name}</Text>
            <Text style={{fontSize:15, color:'#fff'}}>{userDetails.emailId}</Text>
          </View>
          
          </View>
          <View style={{left:'10%',alignItems:'center', marginTop:20,borderBottomWidth:0.5,borderBottomColor:'gray',paddingBottom:10,width:'80%'}}>
            <Text style={{color:Color.logoBlue4,fontWeight:'500',fontSize:15,marginBottom:10}}>Employee Id : {myProfile.employeeId}</Text>
            <Text style={{color:Color.logoBlue4,fontWeight:'500',fontSize:15}}>Date of Birth : {myProfile.dateOfBirth}</Text>
          </View>
          <View style={{left:'10%',alignItems:'center',marginTop:20,borderBottomWidth:0.5,borderBottomColor:'gray',paddingBottom:10,width:'80%'}}>
            <Text style={{color:Color.logoBlue4,fontWeight:'500',fontSize:15,marginBottom:10}}>Phone Number : {myProfile.contactNumber}</Text>
            <Text style={{color:Color.logoBlue4,fontWeight:'500',fontSize:15,marginBottom:10}}>Reporting Manager : {myProfile.reportingManager}</Text>
            <Text style={{color:Color.logoBlue4,fontWeight:'500',fontSize:15}}>HRBP Name : {myProfile.hrbpName}</Text>
          </View>
          <View style={{left:'10%',alignItems:'center',marginTop:20,paddingBottom:10,width:'80%'}}>
            <Text style={{color:Color.logoBlue4,fontWeight:'500',fontSize:15,marginBottom:10}}>Practice : {myProfile.practice}</Text>
            <Text style={{color:Color.logoBlue4,fontWeight:'500',fontSize:15}}>Sub Practice: {myProfile.subPractice}</Text>
          </View>
          
          </ScrollView>
          </View>
          
          
          </SafeAreaView>
    </ImageBackground>
   );
 }

 const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start',
    backgroundColor: Color.logoBlue3,
  },
  horizontal: {
    flexDirection: 'column',

  },
  title: {
      textAlign: 'center',
      marginVertical: 8,
      fontSize:60
    },
    subTitle: {
      width:'34%',
      textAlign: 'center',
      fontSize:20,
      color:'#fff'
    },
    dropdown: {
      height: 50,
      borderColor: 'gray',
      borderWidth: 0.5,
      borderRadius: 8,
      paddingHorizontal: 8,
    },
    icon: {
      marginRight: 5,
    },
    label: {
      position: 'absolute',
      backgroundColor: 'white',
      left: 22,
      top: 8,
      zIndex: 999,
      paddingHorizontal: 8,
      fontSize: 14,
      color:Color.logoBlue5,
      fontWeight:'bold'
    },
    placeholderStyle: {
      fontSize: 16,
      color:Color.modalTitle,
    },
    selectedTextStyle: {
      fontSize: 16,
      color: Color.logoBlue5
    },
    iconStyle: {
      width: 20,
      height: 20,
    },
    inputSearchStyle: {
      height: 40,
      fontSize: 16,
    },
});