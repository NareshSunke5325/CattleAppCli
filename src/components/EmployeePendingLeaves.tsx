import {useEffect, useRef, useState} from 'react';
import { View, Text, ImageBackground, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert, FlatList, Switch, Animated, ActivityIndicator } from "react-native";
import { Color } from '../theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../redux/store/store';
import {   getEmployeePendingLeaves, cancelEmployeeLeaves } from '../services/services.action';
import Accordion from 'react-native-collapsible/Accordion';




const  DEVICE_HEIGHT = Dimensions.get('window').height;



export default function EmployeePendingLeaves({props} : any) {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  //const { reloadLeaves } = props.params;
  console.log("props:::::",props);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeSections, setActiveSections] =  useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const userDetails = useAppSelector((state) => state.user.details);

  useEffect(() => {
    employeePendingLeaves();
  }, [])
  

  const renderItems = (item: any, index: number) => {
    return (
      <Swipeable>
      <TouchableOpacity activeOpacity={1} onPress={() => {setActiveSections([])}} style={{borderColor:'gray',shadowColor: Color.logoBlue5,
      shadowRadius: 5,
      shadowOpacity: 1.0,
      shadowOffset: {
        width: 0,
        height: 3,
      }}}>
        
          
          <View style={{backgroundColor:Color.bgColor,borderColor:'gray',borderWidth:1,borderTopWidth:0}}>
            <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Leave Type: <Text style={{fontWeight:'normal',fontSize:20}}>{item.leaveType}</Text></Text>
            {/* <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Name: <Text style={{fontWeight:'normal',fontSize:20}}>{item.name}</Text></Text> */}
            {/* <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Id: <Text style={{fontWeight:'normal',fontSize:20}}>{item.employeeId}</Text></Text> */}
            <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Applied Date: <Text style={{fontWeight:'normal',fontSize:20}}>{item.appliedDate}</Text></Text>
            <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>From Date: <Text style={{fontWeight:'normal',fontSize:20}}>{item.startDate}</Text></Text>
            <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>To Date: <Text style={{fontWeight:'normal',fontSize:20}}>{item.endDate}</Text></Text>
            <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>No Of Days: <Text style={{fontWeight:'normal',fontSize:20}}>{item.noOfDays}</Text></Text>
            <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Approved/Rejected Date: <Text style={{fontWeight:'normal',fontSize:20}}>{}</Text></Text>
            <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Status: <Text style={{fontWeight:'normal',fontSize:20}}>{item.status}</Text></Text>
            <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,marginBottom:10,color:Color.logoBlue5}}>Approved/Rejected By: <Text style={{fontWeight:'normal',fontSize:20}}>{}</Text></Text>
            <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
              <Text>Hide details</Text>
              <Icon
                  name="keyboard-double-arrow-up"
                  color={'#000'}
                  size={25}
              />
            </View>
            {item.status === 'Pending' && <View style={{justifyContent:'center'}}>
               <TouchableOpacity 
              onPress={() => {cancelCalled(index)}}
                style={{marginRight:'5%',width:'80%',backgroundColor:Color.logoBlue5, borderRadius:10,borderWidth:1,borderColor:'gray', marginVertical:10,padding:10,alignContent:'center',alignSelf:'center'}}
                  >
                <Text style={[styles.subTitle,{width:'100%',textAlign:'center'}]}>
                      Cancel
                  </Text>

              </TouchableOpacity>
            </View>}
          {/* <View style={{flexDirection:'row'}}>
            <TouchableOpacity 
            style={{marginHorizontal:'5%',width:'42.5%',backgroundColor:Color.logoGreen, borderRadius:10,borderWidth:1,borderColor:'gray', marginVertical:10,padding:10,alignContent:'center',alignSelf:'center'}}
            // onPress={showModal} 
              >
            <Text style={[styles.subTitle,{width:'100%',textAlign:'center'}]}>
                  Approve
              </Text>

          </TouchableOpacity>
          <TouchableOpacity 
          //onPress={() => {navigation.navigate('ManagerLeaves')}}
            style={{marginRight:'5%',width:'42.5%',backgroundColor:Color.logoBlue5, borderRadius:10,borderWidth:1,borderColor:'gray', marginVertical:10,padding:10,alignContent:'center',alignSelf:'center'}}
              >
            <Text style={[styles.subTitle,{width:'100%',textAlign:'center'}]}>
                  Reject
              </Text>

          </TouchableOpacity>
          </View> */}
          </View>
        
          
        </TouchableOpacity>
        </Swipeable>
    )
  }
  const employeePendingLeaves = async () => {
    setIsLoading(true);
    const response = await dispatch(getEmployeePendingLeaves(userDetails.employeeId));    
    console.log("getEmployeePendingLeaves list:::::",response.payload);
    setIsLoading(false);
    if (response.payload) {
      setPendingLeaves(response.payload);
    }
  }
  const cancelCalled = async (index: number) => {
    console.log("cancel called::::",pendingLeaves[index]);
    let params = [pendingLeaves[index].leaveId];
    console.log("cancel leave params::::",params);
    const response = await dispatch(cancelEmployeeLeaves(params));    
    console.log("cancelEmployeeLeaves:::::",response);
    if (response.payload === 200) {
      employeePendingLeaves();
    }
  }
  const _updateSections = (activeSections: any) => {
    console.log("updatesectop::::",activeSections);
    setActiveSections(activeSections)
  };
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor:Color.bgColor, padding: 20, opacity: 0.8, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }
   return (
    <ImageBackground
        style={{
          flex:1,
          backgroundColor:Color.bgColor,
          justifyContent: 'flex-start',
          height:DEVICE_HEIGHT,
        }}>
        <SafeAreaView style={[styles.container, styles.horizontal]}>
          
          <View style={{backgroundColor:Color.bgColor}}>
        <View style={{ backgroundColor:Color.logoBlue3, flexDirection:'row',alignItems:'center',height:40,borderBottomColor:'darkgray',borderBottomWidth:1,marginBottom:0}}>
         <TouchableOpacity 
           style={{width:'15%', paddingLeft:10,alignContent:'center',alignSelf:'center'}}
           onPress={()=>{
            //reloadLeaves();
            navigation.goBack();
          }}
            >
           <Icon
              name="arrow-back-ios"
              color={'#fff'}
              size={25}
          />

        </TouchableOpacity>
            <Text style={styles.subTitle}>
                Leave/Pending Status
            </Text>
         
          </View>
          <ScrollView style={{}}>
     
          <View style={{backgroundColor:'transparent',width:'100%',height:DEVICE_HEIGHT-100,paddingHorizontal:10,marginVertical:10}}>
            {pendingLeaves.length !== 0 ? 
            <Accordion renderAsFlatList = {true} containerStyle={{height:'100%'}}
            activeSections={activeSections}
            sections={pendingLeaves}
            // renderSectionTitle={this._renderSectionTitle}
            renderHeader={(item, index) => (
                  <View style={{borderColor:'gray',borderWidth:0.5,justifyContent:'space-between'}}>
                    {index === activeSections[0] ? null : 
                    <TouchableOpacity activeOpacity={1} onPress={() => {setActiveSections([index])}}>
                      {/* <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Name: <Text style={{fontWeight:'normal',fontSize:20}}>{item.name}</Text></Text> */}
                      <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Leave Type: <Text style={{fontWeight:'normal',fontSize:20}}>{item.leaveType}</Text></Text>
                      <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Date Range: <Text style={{fontWeight:'normal',fontSize:20}}>{item.startDate} / {item.endDate}</Text></Text>
                      <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>No Of Days: <Text style={{fontWeight:'normal',fontSize:20}}>{item.noOfDays}</Text></Text>
                      <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,marginBottom:10,color:Color.logoBlue5}}>Status: <Text style={{fontWeight:'normal',fontSize:20}}>{item.status}</Text></Text>
                      <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
                          <Text>More details</Text>
                          <Icon
                              name="keyboard-double-arrow-down"
                              color={'#000'}
                              size={25}
                          />
                      </View>
                      {item.status === 'Pending' && <View style={{justifyContent:'center'}}>
                        <TouchableOpacity 
                        onPress={() => {cancelCalled(index)}}
                          style={{marginRight:'5%',width:'80%',backgroundColor:Color.logoBlue5, borderRadius:10,borderWidth:1,borderColor:'gray', marginVertical:10,padding:10,alignContent:'center',alignSelf:'center'}}
                            >
                          <Text style={[styles.subTitle,{width:'100%',textAlign:'center'}]}>
                                Cancel
                            </Text>

                        </TouchableOpacity>
                      </View>}
                     
                    </TouchableOpacity>}
                      
                  </View>
                )}
            renderContent={renderItems}
             onChange={_updateSections}
          />
            : 
            <View style={{justifyContent:'center',alignItems:'center',height:DEVICE_HEIGHT-100}}>
              <Text style={{textAlign:'center',fontSize:35,color:Color.logoBlue5,fontWeight:'600'}}>No Pending Leaves{'\n'}Please try again later...</Text>
            </View>

            }
          
          </View>
    
          </ScrollView>
          {/* <View style={{position:'absolute',bottom:0,width:'100%',backgroundColor:Color.bgColor,height:80}}>
            <TouchableOpacity 
              style={{ width:'70%',backgroundColor:Color.logoBlue5, borderRadius:10,borderWidth:1,borderColor:'gray', marginVertical:5,padding:10,alignContent:'center',alignSelf:'center'}}
              onPress={showModal}>
                <Text style={[styles.subTitle,{width:'100%',textAlign:'center',}]}>
                    Upload Skill
                </Text>
            </TouchableOpacity>
          </View> */}
          </View>
               
          </SafeAreaView>
    </ImageBackground>
   );
 }

 const styles = StyleSheet.create({
  container: {
    flex:1,
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
      width:'70%',
      textAlign: 'center',
      fontSize:20,
      color:'#fff'
    },
    dropdown: {
      height: 70,
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
      color:Color.logoBlue4,
      fontWeight:'bold'
    },
    placeholderStyle: {
      fontSize: 16,
      color:Color.modalTitle,
    },
    selectedTextStyle: {
      fontSize: 16,
      color: Color.logoBlue4,
      marginLeft:10
 
      
    },
    iconStyle: {
      width: 20,
      height: 20,
    },
    inputSearchStyle: {
      height: 40,
      fontSize: 16,
    },
    expertSelect: {
      shadowColor: Color.logoBlue5,
      borderRadius:5,
      shadowRadius: 5,
      shadowOpacity: 1.0,
      shadowOffset: {
        width: 0,
        height: 3,
      },marginHorizontal:2,
      height:100, 
      width:'24%',
      backgroundColor:Color.logoBlue5, 
      borderWidth:1,
      borderColor:'gray', 
      marginVertical:5,
      justifyContent:'center',
      alignItems:'center'
    },
    expertUnselect: {
      shadowColor: "gray",
      borderRadius:5,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      marginHorizontal:2,
      height:100, 
      width:'24%',
      backgroundColor:'#fff', 
      borderWidth:1,
      borderColor:'gray', 
      marginVertical:5,
      justifyContent:'center',
      alignItems:'center'
    },
    textExpertSelect: {
      width:'100%',
      textAlign:'center',
      color:'#fff',
      height:20,
      fontSize:10
    },
    textExpertUnselected: {
      width:'100%',
      textAlign:'center',
      color:Color.logoBlue5,
      height:20,
      fontSize:10
    },
    triangleCorner: {
      position:'absolute',
      right:1,
      top:1,
      width: 0,
      height: 0,
      backgroundColor: "transparent",
      borderStyle: "solid",
      borderRightWidth: 46,
      borderTopWidth: 46,
      borderRightColor: "transparent",
      borderTopColor: Color.White,
      transform: [{ rotate: "90deg" }],
    },
});