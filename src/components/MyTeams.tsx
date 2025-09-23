import  { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ImageBackground, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions, FlatList } from "react-native";
import { Color } from '../theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../redux/store/store';
import {Calendar, CalendarList, Agenda} from 'react-native-calendars';
import moment from 'moment';

const  DEVICE_HEIGHT = Dimensions.get('window').height

export default function MyTeams() {
  
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const [showCalender, setShowCalender] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState({
    dateString: "", 
    day: 0, 
    month:0,
    timestamp: 0,
    year: 0,
    displayDate:""});
    const [employeeData, setData] = useState<any[]>([]);
    const [showMaxDate, setShowMaxDate] = useState<string>("");
    const [showMinDate, setShowMinDate] = useState<string>("");
  const userDetails = useAppSelector((state) => state.user.details);
  useEffect(() => {
    const currentDate = new Date();
    const nowDate = currentDate.getDate();
    const nowMonth = currentDate.getMonth()+1;
    const nowYear = currentDate.getFullYear();
    const nowTimeStamp = Math.round(+currentDate);
    const nowDataString = moment(currentDate).format('YYYY-MM-DD'); 
    const minDateString = moment(+nowTimeStamp - 7862356333).format('YYYY-MM-DD'); 
    const displayString = moment(currentDate).format('MMMM D, YYYY'); 
    setSelectedDate({
      dateString: nowDataString, 
      day: nowDate, 
      month: nowMonth, 
      timestamp: nowTimeStamp, 
      year: nowYear,
      displayDate:displayString});
      setShowMaxDate(nowDataString);
      setShowMinDate(minDateString);
  }, []);
  const renderItems = ({item}: any) => {
    return (
      <View style={{paddingVertical:8,marginHorizontal:10,borderColor:'gray',borderBottomWidth:0.5,borderRightWidth:0.5,borderLeftWidth:0.5,flexDirection:'row',justifyContent:'space-between'}}>
          <Text style={{fontWeight:'500', fontSize:17, marginLeft:5,borderRightWidth:0.5,borderColor:'gray',width:'32%'}}>{`${item.dateString}${item.dateString}${item.dateString}`}</Text>
          <Text style={{fontSize:17}}>Check-In</Text>
          <Text style={{fontSize:17}}>Check-Out</Text>
          <TouchableOpacity style={{marginRight:10}}>
          <Icon
              name="edit"
              color={'red'}
              size={20}
          />
          </TouchableOpacity>
          
        </View>
    )
  }
  
   return (
    <ImageBackground
        //source={require('../images/imageBG.png')}
         style={{
          flex:1,
          backgroundColor:showCalender ? Color.bgColor :  Color.logoBlue3,
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
                My Teams
            </Text>
         <Text style={{width:'33%'}}></Text>
          </View>
          <View style={{flexDirection:'row',justifyContent:'space-between'}}>
          <Text style={[styles.subTitle,{color:'#000',width:'42%',textAlign:'right',alignSelf:'center'}]}>
                Date : 
            </Text>
          <TouchableOpacity 
           style={{marginRight:20,width:'50%',backgroundColor:Color.logoBlue5, borderRadius:10,borderWidth:1,borderColor:'gray', marginVertical:10,padding:10,alignContent:'center',alignSelf:'flex-start'}}
           onPress={()=>{ setShowCalender(!showCalender)}}
            >
           <Text style={[styles.subTitle,{width:'100%',textAlign:'left'}]}>
                {selectedDate.displayDate}
            </Text>

        </TouchableOpacity>
          </View>
          
          
          {showCalender ? <Calendar style={{top:0,position:'absolute',width:'80%',alignSelf:'center',borderColor:'gray',borderWidth:2,borderRadius:5,right:'5%',zIndex:999}}
  // Initially visible month. Default = now
  initialDate={showMaxDate}
  // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
  minDate={showMinDate}
  // Maximum date that can be selected, dates after maxDate will be grayed out. Default = undefined
  maxDate={showMaxDate}
  // Handler which gets executed on day press. Default = undefined
  onDayPress={(day: { dateString: moment.MomentInput; day: any; month: any; timestamp: any; year: any; }) => {
    const displayString = moment(day.dateString).format('MMMM D, YYYY'); 
    const dateDic = {
      dateString: day.dateString, 
      day: day.day, 
      month: day.month, 
      timestamp: day.timestamp, 
      year: day.year,
      displayDate:displayString}
    dateDic.displayDate = displayString;
    console.log('employeeDataemployeeDataemployeeData day', ...employeeData);
    setSelectedDate(dateDic);
    setData([...employeeData, dateDic])
  }}
  // Handler which gets executed on day long press. Default = undefined
  onDayLongPress={(day: any) => {
    console.log('selected day', day);
  }}
  // Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
  monthFormat={'MMMM yyyy'}
  // Handler which gets executed when visible month changes in calendar. Default = undefined
  onMonthChange={(month: any) => {
    console.log('month changed', month);
  }}
  //current={'2024-07-03'}
  markedDates = {{[selectedDate.dateString]: {selected:true}}}
  // Hide month navigation arrows. Default = false
  // hideArrows={true}
  // // Replace default arrows with custom ones (direction can be 'left' or 'right')
  // //renderArrow={direction => <Arrow />}
  // // Do not show days of other months in month page. Default = false
  // hideExtraDays={true}
  // // If hideArrows = false and hideExtraDays = false do not switch month when tapping on greyed out
  // // day from another month that is visible in calendar page. Default = false
  // disableMonthChange={true}
  // // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday
  // firstDay={1}
  // // Hide day names. Default = false
  // hideDayNames={true}
  // // Show week numbers to the left. Default = false
  // showWeekNumbers={true}
  // // Handler which gets executed when press arrow icon left. It receive a callback can go back month
  // onPressArrowLeft={subtractMonth => subtractMonth()}
  // // Handler which gets executed when press arrow icon right. It receive a callback can go next month
  // onPressArrowRight={addMonth => addMonth()}
  // // Disable left arrow. Default = false
  // disableArrowLeft={true}
  // // Disable right arrow. Default = false
  // disableArrowRight={true}
  // // Disable all touch events for disabled days. can be override with disableTouchEvent in markedDates
  // disableAllTouchEventsForDisabledDays={true}
  // // Replace default month and year title with custom one. the function receive a date as parameter
  // // renderHeader={date => {
  // //   /*Return JSX*/
  // // }}
  // Enable the option to swipe between months. Default = false
  enableSwipeMonths={true}
  /> : 
  <View>
  <View>
  <FlatList
      style={{height:DEVICE_HEIGHT-200}}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
      }}
      stickyHeaderIndices={[0]}
      ListHeaderComponentStyle={{
        borderColor: Color.lightgray,
        backgroundColor:Color.bgColor
      }}
      ListHeaderComponent={() => (
        <View style={{marginHorizontal:10,borderColor:'gray',borderWidth:0.5,flexDirection:'row',justifyContent:'space-between'}}>
          <Text style={{fontSize:17,fontWeight:'600',marginLeft:5,borderRightWidth:0.5,borderColor:'gray',width:'30%'}}>Employee</Text>
          <Text style={{fontSize:17,fontWeight:'600'}}>Check-In</Text>
          <Text style={{fontSize:17,fontWeight:'600'}}>Check-Out</Text>
          <Text style={{width:22}}></Text>
      </View>
      )}
      data={employeeData}
      extraData={employeeData}
      renderItem={renderItems}
      numColumns={1}
      keyExtractor={(_, index) => index.toString()}
      ListFooterComponent={() => (
       <View style={{height:100}}></View>
      )}
    />
    </View>
      <View style={{position:'absolute',bottom:0,backgroundColor:Color.logoBlue3,width:'100%',flexDirection:'row',justifyContent:'center'}}>
        {/* <Text style={[styles.subTitle,{color:'#000',width:'42%',textAlign:'right',alignSelf:'center'}]}>
              Date : 
          </Text> */}
        <TouchableOpacity 
        style={{width:'50%',backgroundColor:Color.logoBlue5, borderRadius:10,borderWidth:1,borderColor:'gray', marginVertical:5,padding:10,alignContent:'center',alignSelf:'flex-start'}}
        //onPress={()=>{ setShowCalender(!showCalender)}}
          >
        <Text style={[styles.subTitle,{width:'100%',textAlign:'center'}]}>
              Confirm All
        </Text>

        </TouchableOpacity>
      </View>
    </View>
}
          

          </View>
          
          </SafeAreaView>
          
    </ImageBackground>
   );
 }

 const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start',
    backgroundColor: Color.logoBlue3
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
});