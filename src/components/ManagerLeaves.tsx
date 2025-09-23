import {useEffect, useRef, useState} from 'react';
import { View, Text, ImageBackground, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert, FlatList, Switch, Animated, ActivityIndicator } from "react-native";
import { Color } from '../theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../redux/store/store';
import {   getManagerPendingLeaves,approveManagerPendingLeaves } from '../services/services.action';
import Accordion from 'react-native-collapsible/Accordion';




const  DEVICE_HEIGHT = Dimensions.get('window').height;



const ManagerLeaves = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const [activeSections, setActiveSections] =  useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const userDetails = useAppSelector((state) => state.user.details);

  useEffect(() => {

    managerPendingLeaves();
  }, [])
  const managerPendingLeaves = async () => {
    setIsLoading(true);
    const response = await dispatch(getManagerPendingLeaves(userDetails.employeeId));    
    console.log("getManagerPendingLeaves list:::::",response.payload);
    setIsLoading(false);
    if (response.payload) {
      setPendingLeaves(response.payload);
    }
  }
  const approveCalled = async (index: number) => {
    setIsLoading(true);
    let params = {
      "leaveIds" : [pendingLeaves[index].leaveId],
      "decision" : "Approved"
    }
    const response = await dispatch(approveManagerPendingLeaves(params));    
      console.log("approveManagerPendingLeaves list:::::",response);
      setIsLoading(false);
      if (response.payload === 200) {
        managerPendingLeaves();
      }
  }
  const rejectCalled = async (index: number) => {
    setIsLoading(true);
    let params = {
      "leaveIds" : [pendingLeaves[index].leaveId],
      "decision" : "Rejected"
    }
    const response = await dispatch(approveManagerPendingLeaves(params));    
      console.log("rejectCalled list:::::",response);
      setIsLoading(false);
      if (response.payload === 200) {
        managerPendingLeaves();
      }
  }
  
  const renderItems = (item : any, index : number) => {
    console.log("renderitems:::::",item);
    return (
      <Swipeable>
      <TouchableOpacity activeOpacity={1} onPress={() => { setActiveSections([])}} style={{borderColor:'gray',shadowColor: Color.logoBlue5,
      shadowRadius: 5,
      shadowOpacity: 1.0,
      shadowOffset: {
        width: 0,
        height: 3,
      }}}>
        {/* <View style={{backgroundColor:Color.logoBlue5,borderWidth:1,borderColor:'gray',shadowColor: Color.logoBlue5,
          shadowRadius: 5,
          shadowOpacity: 1.0,paddingVertical:5,
          shadowOffset: {
            width: 0,
            height: 3,
          }}}>
        <Text style={{color:Color.White,fontWeight:'500', fontSize:18, marginLeft:5,borderRightWidth:0.5,borderColor:'gray',width:'90%'}}>{item.technology}</Text>
        </View> */}
          
          <View style={{backgroundColor:Color.bgColor,borderColor:'gray',borderWidth:1,borderTopWidth:0}}>
          <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Name: <Text style={{fontWeight:'normal',fontSize:20}}>{item.name}</Text></Text>
          <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Id: <Text style={{fontWeight:'normal',fontSize:20}}>{item.employeeId}</Text></Text>
          <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Leave Type: <Text style={{fontWeight:'normal',fontSize:20}}>{item.leaveType}</Text></Text>
          <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Applied Date: <Text style={{fontWeight:'normal',fontSize:20}}>{}</Text></Text>
          <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>From Date: <Text style={{fontWeight:'normal',fontSize:20}}>{item.startDate}</Text></Text>
          <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>To Date: <Text style={{fontWeight:'normal',fontSize:20}}>{item.endDate}</Text></Text>
          <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,marginBottom:10,color:Color.logoBlue5}}>No Of Days: <Text style={{fontWeight:'normal',fontSize:20}}>{item.noOfDays}</Text></Text>
          <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
              <Text>Hide details</Text>
              <Icon
                  name="keyboard-double-arrow-up"
                  color={'#000'}
                  size={25}
              />
          </View>
          <View style={{flexDirection:'row'}}>
            <TouchableOpacity 
            style={{marginHorizontal:'5%',width:'42.5%',backgroundColor:Color.logoGreen, borderRadius:10,borderWidth:1,borderColor:'gray', marginVertical:10,padding:10,alignContent:'center',alignSelf:'center'}}
              onPress={() => {approveCalled(index)}}
              >
            <Text style={[styles.subTitle,{width:'100%',textAlign:'center'}]}>
                  Approve
              </Text>

          </TouchableOpacity>
          <TouchableOpacity 
          onPress={() => {rejectCalled(index)}}
            style={{marginRight:'5%',width:'42.5%',backgroundColor:Color.logoBlue5, borderRadius:10,borderWidth:1,borderColor:'gray', marginVertical:10,padding:10,alignContent:'center',alignSelf:'center'}}
              >
            <Text style={[styles.subTitle,{width:'100%',textAlign:'center'}]}>
                  Reject
              </Text>

          </TouchableOpacity>
          </View>
          </View>
        
          
        </TouchableOpacity>
        </Swipeable>
    )
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
           style={{width:'33%', paddingLeft:10,alignContent:'center',alignSelf:'center'}}
           onPress={()=>{
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
                Manager View
            </Text>
         
          </View>
          <ScrollView style={{}}>
     
          <View style={{backgroundColor:'transparent',width:'100%',paddingHorizontal:10,marginVertical:10,height:DEVICE_HEIGHT-100}}>
            {pendingLeaves.length !== 0 ? 
            // <FlatList
            //   style={{marginHorizontal:10}}
            //   showsVerticalScrollIndicator={false}
            //   contentContainerStyle={{
            //     borderTopLeftRadius: 10,
            //     borderTopRightRadius: 10,
            //   }}
            //   stickyHeaderIndices={[0]}
            //   ListHeaderComponentStyle={{
            //     borderColor: Color.lightgray,
            //     backgroundColor:Color.bgColor
            //   }}
            //   // ListHeaderComponent={() => (
            //   //   <View style={{borderColor:'gray',borderWidth:0.5,flexDirection:'row',justifyContent:'space-between'}}>
            //   //     <Text style={{fontSize:17,fontWeight:'600',marginLeft:5,borderRightWidth:0.5,borderColor:'gray',width:'30%'}}>Employee</Text>
            //   //     <Text style={{fontSize:17,fontWeight:'600'}}>Check-In</Text>
            //   //     <Text style={{fontSize:17,fontWeight:'600'}}>Check-Out</Text>
            //   //     <Text style={{width:22}}></Text>
            //   // </View>
            //   // )}
            //   showsHorizontalScrollIndicator = {false}
            //   data={pendingLeaves}
            //   extraData={pendingLeaves}
            //   renderItem={renderItems}
            //   numColumns={1}
            //   keyExtractor={(_, index) => index.toString()}
            //   ListFooterComponent={() => (
            //   <View style={{height:90}}></View>
            //   )}
            // /> 
            <Accordion renderAsFlatList = {true} containerStyle={{height:'100%'}}
              activeSections={activeSections}
              sections={pendingLeaves}
              // renderSectionTitle={this._renderSectionTitle}
              renderHeader={(item, index) => (
                    <View style={{borderColor:'gray',borderWidth:0.5,justifyContent:'space-between'}}>
                      {index === activeSections[0] ? null : 
                      <TouchableOpacity activeOpacity={1} onPress={() => {setActiveSections([index])}}>
                        <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Name: <Text style={{fontWeight:'normal',fontSize:20}}>{item.name}</Text></Text>
                        <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Leave Type: <Text style={{fontWeight:'normal',fontSize:20}}>{item.leaveType}</Text></Text>
                        <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Date Range: <Text style={{fontWeight:'normal',fontSize:20}}>{item.startDate} / {item.endDate}</Text></Text>
                        <Text style={{marginLeft:5,fontWeight:'bold',fontSize:20,marginTop:15,marginBottom:10,color:Color.logoBlue5}}>No Of Days: <Text style={{fontWeight:'normal',fontSize:20}}>{item.noOfDays}</Text></Text>
                        <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
                            <Text>More details</Text>
                            <Icon
                                name="keyboard-double-arrow-down"
                                color={'#000'}
                                size={25}
                            />
                        </View>
                        <View style={{flexDirection:'row'}}>
                        <TouchableOpacity 
                        style={{marginHorizontal:'5%',width:'42.5%',backgroundColor:Color.logoGreen, borderRadius:10,borderWidth:1,borderColor:'gray', marginVertical:10,padding:10,alignContent:'center',alignSelf:'center'}}
                        onPress={() => {approveCalled(index)}}
                          >
                        <Text style={[styles.subTitle,{width:'100%',textAlign:'center'}]}>
                              Approve
                          </Text>

                      </TouchableOpacity>
                      <TouchableOpacity 
                      onPress={() => {rejectCalled(index)}}
                        style={{marginRight:'5%',width:'42.5%',backgroundColor:Color.logoBlue5, borderRadius:10,borderWidth:1,borderColor:'gray', marginVertical:10,padding:10,alignContent:'center',alignSelf:'center'}}
                          >
                        <Text style={[styles.subTitle,{width:'100%',textAlign:'center'}]}>
                              Reject
                          </Text>

                      </TouchableOpacity>
                        </View>
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
      width:'34%',
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

export default ManagerLeaves;