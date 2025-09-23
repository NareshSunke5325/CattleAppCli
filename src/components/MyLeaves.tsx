import {useEffect, useRef, useState} from 'react';
import { View, Text, ImageBackground, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert, FlatList, Switch, Animated, TextInput, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { Color } from '../theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../redux/store/store';
import { Dropdown } from 'react-native-element-dropdown';
import {  getLeaveBalance, getSkillList, getTechnologyList, applyLeave, } from '../services/services.action';
import Modal from '../Modal';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import AntDesign from 'react-native-vector-icons/AntDesign';
import ShakeComp from '../utils/ShakeComp'
import moment from 'moment';
import { Calendar } from 'react-native-calendars';

const  DEVICE_HEIGHT = Dimensions.get('window').height;
var isNoOfDays = false;

const MyLeaves = () => {
  const navigation =useNavigation<any>();
  const dispatch = useAppDispatch();
  const [visible, setVisible] = useState<boolean>(false);
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [leaveTypeRed, setLeaveTypeRed] = useState<boolean>(false);
  const [reasonRed, setReasonRed] = useState<boolean>(false);
  const [noOfDaysRed, setNoOfDaysRed] = useState<boolean>(false);
  
  const [reasonText, setReasonText] = useState<string>("");
  
  const [disableToDate, setDisableToDate] = useState<boolean>(false);
  const [value, setValue] = useState<string>("");
  const [isFocus, setIsFocus] = useState(false);
  const [techData, setTechData] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any[]>([
      {"balance": 0, "employeeId": "4114", "leaveBalanceId": "", "leaveType": "Casual & sick Leave", "yearPeriod": ""},
      {"balance": 0, "employeeId": "4114", "leaveBalanceId": "", "leaveType": "Bereavement Leave", "yearPeriod": ""}, 
      {"balance": 0, "employeeId": "4114", "leaveBalanceId": "", "leaveType": "Earned Leave", "yearPeriod": ""}, 
      {"balance": 0, "employeeId": "4114", "leaveBalanceId": "", "leaveType": "Marriage Leave", "yearPeriod": ""}, 
      {"balance": 0, "employeeId": "4114", "leaveBalanceId": "", "leaveType": "Paternity Leave", "yearPeriod": ""}]);
  const userDetails = useAppSelector((state) => state.user.details);
  const shakeLeaveTypeRef = useRef<ShakeComp>(null);
  const shakeReasonRef = useRef<ShakeComp>(null); 
  const shakeNoOfDaysRef = useRef<ShakeComp>(null);  
  const totalItems = 5;

  const items = new Array(totalItems).fill(null);
  const permissions = ["Early Logout", "Late Login", "2hrs Permission"]; 
  const [permissionCount, setPermissionCount] = useState<any[]>([{time:0, hour:0},{time:0, hour:0},{time:0, hour:0}]);
  const leaveType = [
    {label:"Casual, Sick Leave",value:0},
    {label:"Earned Leave",value:1},
    {label:"Marriage Leave",value:2},
    {label:"Bereavement Leave",value:3},
    {label:"Paternity Leave",value:4},
  ];
  var initDate = new Date();
  var disabledDaysIndexes = [0,6, 7];
  const [showCalender, setShowCalender] = useState<boolean>(false);
  const [showMaxDate, setShowMaxDate] = useState<string>("");
  const [showMinDate, setShowMinDate] = useState<string>("");
 
  const [isFromDate, setIsFromDate] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState({
    dateString: "", 
    day: 0, 
    month:0,
    timestamp: 0,
    year: 0,
    displayDate:"-",
    selected:""});
    const [fromDate, setFromDate] = useState<any>(selectedDate);
    const [toDate, setToDate] = useState<any>(selectedDate);
    const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
    const [markedDates, setMarkedDates] = useState({});

  const renderLabel = () => {
    if (value.length > 0 || isFocus) {
      return (
        <Text style={[styles.label, isFocus && { color: Color.modalTitle }]}>
          Leave Type
        </Text>
      );
    }
    return null;
  };

  const getDisabledDays = (month: number, year: number, daysIndexes: any[]) => {
    let pivot = moment().month(month).year(year).startOf('month');
    const end = moment().month(month).year(year).endOf('month');
    let dates = {};
    const disabled = { disabled: true, disableTouchEvent: true };
    while (pivot.isBefore(end)) {
      daysIndexes.forEach((day: string | number) => {
        const copy = moment(pivot);
        dates[copy.day(day).format('YYYY-MM-DD')] = disabled;
      });
      pivot.add(7, 'days');
    }
    dates[fromDate.selected] = {selected:true,selectedColor: isFromDate ? Color.logoGreen : 'gray'};
    dates[toDate.selected]= {selected:true,selectedColor:!isFromDate ? Color.logoGreen : 'gray'}
    return dates;
  };

  const getEmployeeLeaveBalance = async () => {
    const response = await dispatch(getLeaveBalance(userDetails.employeeId));    
    console.log("getLeaveBalance list:::::",response.payload);
    if (response.payload) {
      var stringToFilter = 'Casual & sick Leave';  
      var respData = response.payload;
      respData.unshift(respData.splice(respData.findIndex((item: { leaveType: string; }) => item.leaveType === stringToFilter), 1)[0])
      console.log("respData::::::::",respData);
      setLeaveBalance(respData);
    }
  }

  useEffect(() => {
    setMarkedDates(getDisabledDays(
      initDate.getMonth(),
      initDate.getFullYear(),
      disabledDaysIndexes
    ));
    
    getEmployeeLeaveBalance();
    Keyboard.addListener('keyboardDidShow', () => {
      console.log("keyboard show");
      setKeyboardHeight(120);
      setReasonRed(false);
    })
    Keyboard.addListener('keyboardDidHide', () => {
        console.log("keyboard hide")
        setKeyboardHeight(0);
    })
  }, [])

  const hideModal = () => {
    setVisible(false);
    setLeaveTypeRed(false);
    setReasonRed(false);
    setNoOfDaysRed(false);
  };

  const showModal = () => {
    setValue("");
    setIsPrimary(false);
    setVisible(true)
  };

  const confirmLeave = async () => {
    let confirmRed = false;
    const numberOfDates = getDateDifference();

    if(value === "Bereavement Leave" || value === "Marriage Leave" || value === "Paternity Leave")
      {
        if(fromDate.displayDate === "-")
        {
          Alert.alert('','Please select from date and apply');
          return;
        }
      }

    switch (value) {
      case "Casual & sick Leave":
        if(Number(numberOfDates) > 2)
        {
          Alert.alert('','You can apply only 2 days leave for casual & sick Leave or please contact HR for more assisstance!');
          return;
        }
        break;
        case "Bereavement Leave":
          var berLeaves = leaveBalance.filter((item) => item.leaveType === "Bereavement Leave");
          console.log("Bereavement::::",berLeaves);
          if(berLeaves[0].balance < 3)
          {
            Alert.alert('','You do not have enough leaves of this leave type. Please contact HR for more assisstance!');
            return;
          }
          break;
        case "Earned Leave":
          var earnedLeaves = leaveBalance.filter((item) => item.leaveType === "Earned Leave");
          console.log("Earned::::",earnedLeaves);
          if(earnedLeaves[0].balance < numberOfDates)
            {
              Alert.alert('',`You have only ${earnedLeaves[0].balance} days earned leaves left. please apply appropriately or contact HR for more assisstance!`);
              return;
            }
          break;
        case "Marriage Leave":
          var marriageLeaves = leaveBalance.filter((item) => item.leaveType === "Marriage Leave");
          console.log("Marriage::::",marriageLeaves);
          if(marriageLeaves[0].balance < 3)
            {
              Alert.alert('','You do not have enough leaves of this leave type. Please contact HR for more assisstance!');
              return;
            }
          break;
        case "Paternity Leave":
          var paternityLeaves = leaveBalance.filter((item) => item.leaveType === "Paternity Leave");
          console.log("Marriage::::",paternityLeaves);
          if(paternityLeaves[0].balance < 3)
            {
              Alert.alert('','You do not have enough leaves of this leave type. Please contact HR for more assisstance!');
              return;
            }
          break;
  
      default:
        break;
    }

    if(!confirmRed)
    {
      let params = {
        "employeeId": userDetails.employeeId,
        "name": userDetails.name,
        "leaveType": value,
        "noOfDays": numberOfDates,
        "comments": reasonText,
        "startDate": fromDate.dateString,
        "endDate": toDate.dateString
      }
      console.log("leave values::::",params);
      const response = await dispatch(applyLeave(params));    
      console.log("applyLeave status",response);
      if (response.payload === 200) {
         setVisible(false);
         getEmployeeLeaveBalance();
      }
    }
  }

  function getDaysBetweenDates(start : Date, end : Date) {
    var result = 0;
    var days = {sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6};
    var day1 = days["sat"];
    var day2 = days["sun"];
    var current1 = new Date(start);
    var current2 = new Date(start);
    current1.setDate(current1.getDate() + (day1 - current1.getDay() + 7) % 7);
    current2.setDate(current2.getDate() + (day2 - current2.getDay() + 7) % 7);
    while (current1 < end) {
      result++;
      current1.setDate(current1.getDate() + 7);
    }
    while (current2 < end) {
      result++;
      current2.setDate(current2.getDate() + 7);
    }
    return result;  
  }

  const getDateDifference = () => {
    if(value === "Bereavement Leave" || value === "Marriage Leave" || value === "Paternity Leave")
    {
      isNoOfDays = true;
      return 3;
    }
      
    const date1 = new Date(fromDate.selected);  
    const date2 = new Date(toDate.selected);  
    const removeDates = getDaysBetweenDates(date1,date2)
    var time_difference = date2.getTime() - date1.getTime();  
    var days_difference = time_difference / (1000 * 60 * 60 * 24);  
    console.log("daysDiff::::::",days_difference);
    if(days_difference < 0)
    {
      isNoOfDays = false;
      setToDate(selectedDate)
        return "-"
    }
    if(Number.isNaN(days_difference))
    {
      isNoOfDays = false;
      return "-";
    }
    else
    {
      isNoOfDays = true;
      return days_difference + 1 - removeDates;
    }
  }

  const add3DaysFromDate = (dateString: string) => {
    var startDate = dateString;
    console.log("i am in fromDate.selected",dateString);
    startDate = new Date(startDate);
    console.log("i am in add3DaysFromDate",startDate);
    var endDate = "", noOfDaysToAdd = 2, count = 0;
    console.log("i am in endDate",endDate);
    while(count < noOfDaysToAdd){
        endDate = new Date(startDate.setDate(startDate.getDate() + 1));
        if(endDate.getDay() != 0 && endDate.getDay() != 6){
          count++;
        }
    }
    console.log("add 3 days endate:::::",endDate)
    const displayString = moment(endDate).format('DD-MM-YYYY'); 
    const selectedString = moment(endDate).format('YYYY-MM-DD'); 
    const dateDic = {
      dateString: displayString, 
      day: endDate.getDay(), 
      month: endDate.getMonth(), 
      timestamp: endDate.valueOf(), 
      year: endDate.getYear(),
      displayDate:displayString} 
    dateDic.displayDate = displayString;
    dateDic.selected = selectedString;
    setToDate(dateDic);
    return endDate;
  }

  const openCalender = (isFromDate: boolean) => {
    Keyboard.dismiss();
    if(fromDate.selected === '' && !isFromDate)
    {
      Alert.alert('','Please Select from date first');
      return;
    }
    setMarkedDates(getDisabledDays(
      initDate.getMonth(),
      initDate.getFullYear(),
      disabledDaysIndexes
    ));
    setIsFromDate(isFromDate);
    setShowCalender(!showCalender);
  }

  const getLeaveTypeIcon = (leaveType: string) => {
    switch (leaveType) {
      case 'Casual & sick Leave':
        return 'medical-services';
      case 'Earned Leave':
        return 'beach-access';
      case 'Marriage Leave':
        return 'favorite';
      case 'Bereavement Leave':
        return 'sentiment-very-dissatisfied';
      case 'Paternity Leave':
        return 'child-care';
      default:
        return 'event-available';
    }
  };

  const getLeaveTypeColor = (leaveType: string) => {
    switch (leaveType) {
      case 'Casual & sick Leave':
        return '#ef4444';
      case 'Earned Leave':
        return '#06b6d4';
      case 'Marriage Leave':
        return '#ec4899';
      case 'Bereavement Leave':
        return '#6b7280';
      case 'Paternity Leave':
        return '#8b5cf6';
      default:
        return Color.logoBlue4;
    }
  };

   return ( 
    <ImageBackground
        style={{
          flex:1,
          backgroundColor:Color.bgColor,
          justifyContent: 'flex-start',
          height:DEVICE_HEIGHT,
        }}>
        
        {/* Background Gradient Overlay */}
        <View style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(26, 26, 46, 0.8)',
        }} />
        
        <SafeAreaView style={{ flex: 0, backgroundColor: Color.logoBlue3 }} />
        <SafeAreaView style={[styles.container, styles.horizontal]}>
          
          <View style={{backgroundColor:Color.bgColor, height: '100%'}}>
            
            {/* Enhanced Header */}
            <View style={{
              backgroundColor: Color.logoBlue2,
              justifyContent: 'space-between',
              flexDirection: 'row',
              alignItems: 'center',
              height: 50,
              borderBottomColor: 'rgba(255,255,255,0.2)',
              borderBottomWidth: 1,
              marginBottom: 0,
              paddingHorizontal: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 8,
            }}>
              <TouchableOpacity 
                style={{
                  width: '15%',
                  alignContent: 'center',
                  alignSelf: 'center',
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }}
                onPress={() => {
                  navigation.dispatch(DrawerActions.openDrawer());
                }}
              >
                <Icon
                  name="menu"
                  color={'#fff'}
                  size={28}
                />
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 22,
                  color: '#fff',
                  fontWeight: 'bold',
                  letterSpacing: 1
                }}>
                  Leaves
                </Text>
                <View style={{
                  width: 40,
                  height: 2,
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  borderRadius: 1,
                  marginTop: 2
                }} />
              </View>

              <Text style={{width:'15%'}}></Text>
            </View>

            <ScrollView 
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {/* Leave Balance Card */}
              <View style={{
                margin: 20,
                borderRadius: 24,
                backgroundColor: 'rgba(255,255,255,0.95)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 10,
                overflow: 'hidden'
              }}>
                
                {/* Header Section */}
                <View style={{
                  backgroundColor: Color.logoBlue3,
                  padding: 20,
                  alignItems: 'center'
                }}>
                  <Icon name="calendar-today" size={32} color="#fff" />
                  <Text style={{
                    fontSize: 20,
                    color: '#fff',
                    fontWeight: 'bold',
                    marginTop: 8,
                    letterSpacing: 0.5
                  }}>
                    Leave Balance Overview
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.8)',
                    marginTop: 4,
                    textAlign: 'center'
                  }}>
                    Track your available leave days
                  </Text>
                </View>

                {/* Leave Balance List */}
                <View style={{ padding: 20 }}>
                  {leaveBalance.map((item, idx) => (
                    <View key={idx} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#fff',
                      borderRadius: 15,
                      padding: 16,
                      marginBottom: 15,
                      borderLeftWidth: 4,
                      borderLeftColor: getLeaveTypeColor(item.leaveType),
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.01,
                      shadowRadius: 1,
                      elevation: 1,
                    }}>
                      
                      {/* Icon */}
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: getLeaveTypeColor(item.leaveType),
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 16
                      }}>
                        <Icon 
                          name={getLeaveTypeIcon(item.leaveType)} 
                          size={20} 
                          color="#fff" 
                        />
                      </View>

                      {/* Leave Type */}
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 16,
                          color: Color.logoBlue4,
                          fontWeight: '600',
                          marginBottom: 2
                        }}>
                          {item.leaveType}
                        </Text>
                        <Text style={{
                          fontSize: 12,
                          color: 'rgba(15, 52, 96, 0.6)',
                          fontStyle: 'italic'
                        }}>
                          Available days
                        </Text>
                      </View>

                      {/* Balance */}
                      <View style={{
                        backgroundColor: item.balance > 0 ? '#10b981' : '#ef4444',
                        borderRadius: 20,
                        minWidth: 60,
                        height: 36,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 12
                      }}>
                        <Text style={{
                          fontSize: 16,
                          color: '#fff',
                          fontWeight: 'bold'
                        }}>
                          {item.balance}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Quick Actions */}
              <View style={{
                margin: 20,
                marginTop: 0,
                gap: 12
              }}>
                {/* Apply Leave Button */}
                <TouchableOpacity 
                  style={{
                    backgroundColor: '#10b981',
                    borderRadius: 20,
                    padding: 20,
                    shadowColor: '#10b981',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onPress={showModal}
                >
                  <Icon name="add-circle-outline" size={24} color="white" style={{ marginRight: 12 }} />
                  <Text style={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 18,
                    letterSpacing: 0.5
                  }}>
                    Apply Leave
                  </Text>
                </TouchableOpacity>

                {/* Secondary Actions Row */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity 
                    onPress={() => { navigation.navigate('ManagerLeaves') }}
                    style={{
                      flex: 1,
                      backgroundColor: '#3b82f6',
                      borderRadius: 16,
                      padding: 16,
                      shadowColor: '#3b82f6',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 6,
                      alignItems: 'center'
                    }}
                  >
                    <Icon name="supervisor-account" size={20} color="white" style={{ marginBottom: 4 }} />
                    <Text style={{
                      color: 'white',
                      fontWeight: '600',
                      fontSize: 14,
                      textAlign: 'center'
                    }}>
                      Manager View
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => {
                      navigation.push('EmployeePendingLeaves', {
                        reloadLeaves: getEmployeeLeaveBalance(),
                      })
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#f59e0b',
                      borderRadius: 16,
                      padding: 16,
                      shadowColor: '#f59e0b',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 6,
                      alignItems: 'center'
                    }}
                  >
                    <Icon name="pending-actions" size={20} color="white" style={{ marginBottom: 4 }} />
                    <Text style={{
                      color: 'white',
                      fontWeight: '600',
                      fontSize: 14,
                      textAlign: 'center'
                    }}>
                      Leave Status
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Enhanced Modal */}
          <Modal visible={visible} onDismiss={hideModal} headerTitle="Apply Leave" containerStyle={{height: '80%', borderRadius: 10}}>
            <TouchableOpacity activeOpacity={1} onPress={() => {Keyboard.dismiss()}} style={{backgroundColor: 'white',padding: 16,height:'100%'}}>
              {renderLabel()}
              
              <ShakeComp ref={shakeLeaveTypeRef}>
              <Dropdown
                style={[styles.dropdown, { borderColor: value === "" && leaveTypeRed === true ? "red" : isFocus ?  Color.lightgray : Color.logoBlue4 }]}
                placeholderStyle={[styles.placeholderStyle, {color: value === "" && leaveTypeRed === true ? 'red' : Color.logoBlue4}]}
                selectedTextStyle={[styles.selectedTextStyle, isFocus && {color: Color.modalTitle}]}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={leaveBalance}
                maxHeight={300}
                labelField="leaveType"
                valueField="leaveType"
                placeholder={!isFocus ? 'Select Leave Type' : '...'}
                value={value}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                onChange={item => {
                  console.log("item:::",item);
                  const leaveType = item.leaveType
                  setValue(leaveType);
                  setIsFocus(false);
                  if(leaveType === "Bereavement Leave" || leaveType === "Marriage Leave" || leaveType === "Paternity Leave")
                  {
                    setToDate(selectedDate)
                      setDisableToDate(true);
                      getDateDifference();
                  }
                  else
                  {
                    setToDate(selectedDate);
                    setFromDate(selectedDate);
                      setDisableToDate(false);
                      getDateDifference();
                  }
                }}
                renderLeftIcon={() => (
                  <FontAwesome6
                    style={styles.icon}
                    color={value === "" && leaveTypeRed === true ? "red" : isFocus ? Color.modalTitle : Color.logoBlue4}
                    name="user-clock"
                    size={20}
                  />
                )}
              />
              </ShakeComp>

              <View style={{alignItems:'flex-start',marginTop:20,width:'100%',flexDirection:'row'}}>
              <TouchableOpacity onPress={() => {openCalender(true)}} style={{width:'50%'}}>
                  <Text style={{color:showCalender ?  isFromDate ? Color.logoGreen : 'gray' : Color.logoBlue4,fontWeight:'800',fontSize:22,marginBottom:10}}>From Date: </Text>
                  <Text style={{color:showCalender ? isFromDate ? Color.logoGreen :  'gray' : Color.logoBlue4,fontWeight:'500',fontSize:18,left:5}}>{fromDate.displayDate}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {!disableToDate && openCalender(false)}} style={{width:'50%'}}>
                  <Text style={{color:disableToDate ? 'gray' : showCalender ?  !isFromDate ? Color.logoGreen : 'gray' :Color.logoBlue4,fontWeight:'800',fontSize:22,marginBottom:10}}>To Date: </Text>
                  <Text style={{color:disableToDate ? 'gray' : showCalender ? !isFromDate ? Color.logoGreen : 'gray' : Color.logoBlue4 ,fontWeight:'500',fontSize:18,left:5}}>{toDate.displayDate}</Text>
                </TouchableOpacity>                   
              </View>

              <ShakeComp ref={shakeNoOfDaysRef} style={{alignItems:'flex-start',marginTop:15,width:'80%'}}>
                <Text style={{color:noOfDaysRed ? "red" :Color.logoBlue4,fontWeight:'800',fontSize:22,marginBottom:10}}>No of Days:</Text>
                <Text style={{color:Color.logoBlue4,fontWeight:'500',fontSize:18,left:5}}>{getDateDifference()}</Text>
              </ShakeComp>

              <View style={{alignItems:'flex-start',marginTop:20,paddingBottom:10,width:'100%'}}>
              <ShakeComp ref={shakeReasonRef}>
                <Text style={{color: reasonRed ? "red" : Color.logoBlue4,fontWeight:'800',fontSize:22,marginBottom:10,marginTop:5}}>Reason:</Text>
              </ShakeComp>
              <TextInput 
                  style={{fontSize:15, padding:10,height:150,borderColor:'gray',borderWidth:0.5,width:'100%',bottom:keyboardHeight,backgroundColor:'#fff',borderRadius:8}}
                  placeholder="Type something here"  
                  multiline={true}  
                  value={reasonText}
                  onChangeText={text=> setReasonText(text)}
                  onEndEditing={() => Keyboard.dismiss()}>
              </TextInput>                
               
              </View>
             
              
              <TouchableOpacity 
                style={{position:'absolute',bottom:10,width:'50%',backgroundColor:Color.logoBlue5, borderRadius:10,borderWidth:1,borderColor:'gray', marginVertical:5,padding:10,alignContent:'center',alignSelf:'center'}}
                onPress={confirmLeave}
                  >
                  <Text style={[styles.subTitle,{width:'100%',textAlign:'center'}]}>
                      Apply
                  </Text>
              </TouchableOpacity>
              <View style={{position:'absolute',width:'100%',top:170,left:15,backgroundColor:'green',justifyContent:'flex-start'}}>
              {showCalender && <Calendar 
                  style={{width:'100%',borderColor:'gray',borderWidth:2,borderRadius:5,zIndex:999}}
                   initialDate={isFromDate ? fromDate.selected || moment(initDate).format('YYYY-MM-DD') : toDate.selected || moment(initDate).format('YYYY-MM-DD')}
                   minDate={!isFromDate ? fromDate.selected : '2020-01-01'}
                  markedDates={markedDates}
                  onDayPress={(day: { dateString: moment.MomentInput; day: any; month: any; timestamp: any; year: any; }) => {
                   
                    console.log("selected date:::::",day);
                    const displayString = moment(day.dateString).format('DD-MM-YYYY'); 
                    const selectedString = moment(day.dateString).format('YYYY-MM-DD'); 
                    const dateDic = {
                      dateString: day.dateString, 
                      day: day.day, 
                      month: day.month, 
                      timestamp: day.timestamp, 
                      year: day.year,
                      displayDate:displayString} 
                    dateDic.displayDate = displayString;
                    dateDic.selected = selectedString
                    setShowCalender(false);
                    if(isFromDate){
                      setFromDate(dateDic);
                      if(value === "Bereavement Leave" || value === "Marriage Leave" || value === "Paternity Leave")
                        add3DaysFromDate(selectedString);
                    }
                      
                    else{
                      setToDate(dateDic);
                      setNoOfDaysRed(false);
                    } 
                  }}
                  onDayLongPress={(day: any) => {
                    console.log('selected day', day);
                  }}
                  monthFormat={'MMMM yyyy'}
                  enableSwipeMonths={true}
                  disabledDaysIndexes={disabledDaysIndexes}
                  onMonthChange={(month: any) => {
                    console.log('month changed', month);
                    setMarkedDates(getDisabledDays(
                      month.month-1,
                      month.year,
                      disabledDaysIndexes
                    ))
                  }}
                  />}
              </View>
              
            </TouchableOpacity>
          </Modal>    
          
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

export default MyLeaves;