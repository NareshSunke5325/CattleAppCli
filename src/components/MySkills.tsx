import {useEffect, useRef, useState} from 'react';
import { View, Text, ImageBackground, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert, FlatList, Switch, Animated } from "react-native";
import { Color } from '../theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../redux/store/store';
import { Dropdown } from 'react-native-element-dropdown';
import {  getSkillList, getTechnologyList, postEmployeeSkill } from '../services/services.action';
import Modal from '../Modal';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import AntDesign from 'react-native-vector-icons/AntDesign';
import ShakeComp from '../utils/ShakeComp'




const  DEVICE_HEIGHT = Dimensions.get('window').height;



export default function MySkills() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const [visible, setVisible] = useState<boolean>(false);
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [techRed, setTechRed] = useState<boolean>(false);
  const [expertRed, setExpertRed] = useState<boolean>(false);
  const [primaryRed, setPrimaryRed] = useState<boolean>(false);
  const [expertLevel, setExpertLevel] = useState<number>(-1);
  const [value, setValue] = useState(null);
  const [techGroup, setTechGroup] = useState<string>("-");
  const [isFocus, setIsFocus] = useState(false);
  const [techData, setTechData] = useState<any[]>([]);
  const [skillData, setSkillData] = useState<any[]>([]);
  const userDetails = useAppSelector((state) => state.user.details);
  const shakeTechRef = useRef<ShakeComp>(null);
  const shakeExpertRef = useRef<ShakeComp>(null); 
  const shakePrimaryRef = useRef<ShakeComp>(null);  

  

  const renderLabel = () => {
    if (value || isFocus) {
      return (
        <Text style={[styles.label, isFocus && { color: Color.modalTitle }]}>
          Technology
        </Text>
      );
    }
    return null;
  };

  const rightSwipeActions = (index: number) => {
      return (
        <View
          style={{
            marginTop:index === 0 ? 0 : 30,
            backgroundColor: '#fff',
            justifyContent: 'center',
            alignItems: 'flex-end',
            flexDirection:'row'
          }}
        >
          <TouchableOpacity
            style={{
              height:'100%',
              alignSelf:'center',
              justifyContent:'center',
              backgroundColor: Color.logoBlue3,
              paddingHorizontal: 10,
              paddingVertical: 20,
              width:80,
              borderWidth:1,
              borderColor:'gray'
            }}
            activeOpacity={0.7}
          >
            <Text style={{color:'white',fontSize:20,textAlign:'center'}}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            
            style={{
              height:'100%',
              alignSelf:'center',
              justifyContent:'center',
              backgroundColor: 'red',
              paddingHorizontal: 10,
              paddingVertical: 20,
              width:80,
              borderWidth:1,
              borderColor:'gray'
            }}
            activeOpacity={0.7}
          >
            <Text style={{color:'white',fontSize:20,textAlign:'center'}}>Delete</Text>
          </TouchableOpacity>
        </View>
      );
    };
  

  useEffect(() => {
    
    const getEmployeeSkills = async () => {
      const response = await dispatch(getSkillList(userDetails.employeeId));    
      console.log("getSkillList list:::::",response.payload);
      if (response.payload) {
        setSkillData(response.payload);
      }
    }
    const getTechList = async () => {
      const response = await dispatch(getTechnologyList());    
      if (response.payload) {
        const filterTech = response.payload.map((v : any, index: number) => ({...v, value: index+1}))
        setTechData(filterTech);
      }
    }
    getEmployeeSkills();
    getTechList();
  }, [])
  const hideModal = () => {
    setVisible(false);
    setTechRed(false);
    setExpertRed(false);
    setPrimaryRed(false);
  };
  const showModal = () => {
    setValue(null);
    setTechGroup("-");
    setExpertLevel(-1);
    setIsPrimary(false);
    setVisible(true)
    
  };
  const ExpertLevelClicked = (id: number) => {
    setExpertLevel(id);
  }
  const isPrimaryChange = (value: boolean) => {
    console.log("primary ecvenet::::",value);
    setPrimaryRed(false);
    setIsPrimary(value);    
  };
  const confirmTechnology=  async () => {
    let confirmRed = false;
    if(value === null)
    {
      confirmRed = true;
      setTechRed(true);
      shakeTechRef.current?.startShakeAnimation();
    }
    if(expertLevel === -1)
    {
      confirmRed = true;
      setExpertRed(true);
      shakeExpertRef.current?.startShakeAnimation();
    }
    if(skillData.length === 0  && !isPrimary){
      confirmRed = true;
      setPrimaryRed(true);
      shakePrimaryRef.current?.startShakeAnimation();

    }
    else if(!confirmRed)
    {
      //console.log("tech data object:::::::",techData[value!-1])
      let techValues = techData[value!-1];
      let exptLevel = '';
      switch (expertLevel) {
        case 1:
          exptLevel = 'Beginner';
        break;
        case 2:
          exptLevel = 'Intermediate';
        break;
        case 3:
          exptLevel = 'Expert';
        break;
        case 4:
          exptLevel = 'Guru';
        break;
        default:
          exptLevel = 'Intermediate'
        break;
      }
      let params = {
        "employeeId": userDetails.employeeId,
        "technologyId": techValues.technologyId,
        "technology": techValues.technology,
        "techGroup": techValues.techGroup,
        "expertLevel": exptLevel,
        "isPrimary": isPrimary
      }
      console.log("skill set values::::",params);
      const response = await dispatch(postEmployeeSkill(params));    
      console.log("postEmployeeSkill status",response.payload);
      if (response.payload) {
        const skillAdd = [...skillData,response.payload];
        setSkillData(skillAdd);
        setVisible(false);
      }
    }
  }

  const renderItems = ({item,index}: any) => {
    return (
      <Swipeable
        renderRightActions={() => {return( rightSwipeActions(index)) }}>
      <View style={{borderColor:'gray',marginTop:index === 0 ? 0 : 30,shadowColor: Color.logoBlue5,
      shadowRadius: 5,
      shadowOpacity: 1.0,
      shadowOffset: {
        width: 0,
        height: 3,
      }}}>
        <View style={{backgroundColor:Color.logoBlue5,borderWidth:1,borderColor:'gray',shadowColor: Color.logoBlue5,
          shadowRadius: 5,
          shadowOpacity: 1.0,paddingVertical:5,
          shadowOffset: {
            width: 0,
            height: 3,
          }}}>
        <Text style={{color:Color.White,fontWeight:'500', fontSize:18, marginLeft:5,borderRightWidth:0.5,borderColor:'gray',width:'90%'}}>{item.technology}</Text>
        </View>
          
          <View style={{backgroundColor:Color.bgColor,borderColor:'gray',borderWidth:1,borderTopWidth:0}}>
          <Text style={{marginLeft:5,fontWeight:'500',fontSize:20,marginTop:15,color:Color.logoBlue5}}>Technology Group: <Text style={{fontWeight:'normal',fontSize:20}}>{item.techGroup}</Text></Text>
          <Text style={{marginLeft:5,fontWeight:'500',fontSize:20,marginTop:15,marginBottom:10,color:Color.logoBlue5}}>Level: <Text style={{fontWeight:'normal',fontSize:20}}>{item.expertLevel}</Text></Text>
          </View>
          {index === 0 &&  <View style={[styles.triangleCorner]} />}
          {index === 0 &&  <Icon style={{position:'absolute',right:2,top:2,}}
              name="star"
              color={Color.logoGreen}
              size={25}
          />}
          
         
          {/* <TouchableOpacity style={{marginRight:10}}> 
          <Icon
              name="edit"
              color={'red'}
              size={20}
          />
          </TouchableOpacity> */}
          
        </View>
        </Swipeable>
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
                Skills
            </Text>
            <TouchableOpacity 
           style={{width:'33%', paddingRight:10,justifyContent:'flex-end',alignItems:'flex-end'}}
           onPress={showModal}
            >
           <AntDesign
              name="plus"
              color={'#fff'}
              size={30}
          />

        </TouchableOpacity>
          </View>
          <ScrollView style={{}}>
     
          <View style={{backgroundColor:'transparent',width:'100%',paddingTop:15}}>
            {skillData.length !== 0 ? 
            <FlatList
              style={{marginHorizontal:10}}
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
              // ListHeaderComponent={() => (
              //   <View style={{borderColor:'gray',borderWidth:0.5,flexDirection:'row',justifyContent:'space-between'}}>
              //     <Text style={{fontSize:17,fontWeight:'600',marginLeft:5,borderRightWidth:0.5,borderColor:'gray',width:'30%'}}>Employee</Text>
              //     <Text style={{fontSize:17,fontWeight:'600'}}>Check-In</Text>
              //     <Text style={{fontSize:17,fontWeight:'600'}}>Check-Out</Text>
              //     <Text style={{width:22}}></Text>
              // </View>
              // )}
              showsHorizontalScrollIndicator = {false}
              data={skillData}
              extraData={skillData}
              renderItem={renderItems}
              numColumns={1}
              keyExtractor={(_, index) => index.toString()}
              ListFooterComponent={() => (
              <View style={{height:90}}></View>
              )}
            /> : 
            <View style={{justifyContent:'center',alignItems:'center',height:DEVICE_HEIGHT-100}}>
              <Text style={{textAlign:'center',fontSize:35,color:Color.logoBlue5,fontWeight:'600'}}>No Skills Added!{'\n'}Please Add One...</Text>
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
          <Modal visible={visible} onDismiss={hideModal} headerTitle="Technology" containerStyle={{height: '80%', borderRadius: 10}}>
            <View style={{backgroundColor: 'white',padding: 16,height:'100%'}}>
              {renderLabel()}
              <ShakeComp ref={shakeTechRef}>
              <Dropdown
                style={[styles.dropdown, { borderColor: value === null && techRed === true ? "red" : isFocus ?  Color.lightgray : Color.logoBlue4 }]}
                placeholderStyle={[styles.placeholderStyle, {color: value === null && techRed === true ? 'red' : Color.logoBlue4}]}
                selectedTextStyle={[styles.selectedTextStyle, isFocus && {color: Color.modalTitle}]}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={techData}
                search
                maxHeight={300}
                labelField="technology"
                valueField="value"
                placeholder={!isFocus ? 'Select Technology' : '...'}
                searchPlaceholder="Search..."
                value={value}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                onChange={item => {
                  setValue(item.value);
                  setTechGroup(item.techGroup);
                  setIsFocus(false);

                }}
                renderLeftIcon={() => (
                  <Feather
                    style={styles.icon}
                    color={value === null && techRed === true ? "red" : isFocus ? Color.modalTitle : Color.logoBlue4}
                    name="layers"
                    size={20}
                  />
                )}
              />
              </ShakeComp>
              <View style={{alignItems:'flex-start',marginTop:40,paddingBottom:10,width:'80%'}}>
              
                <Text style={{color:Color.logoBlue4,fontWeight:'800',fontSize:22,marginBottom:10}}>Technology Group</Text>
              
                <Text style={{color:Color.logoBlue4,fontWeight:'500',fontSize:18,left:5}}>{techGroup}</Text>
              </View>
              <View style={{alignItems:'flex-start',marginTop:20,paddingBottom:10,width:'100%'}}>
              <ShakeComp ref={shakeExpertRef}>
                <Text style={{color: expertLevel === -1 && expertRed === true ? "red" : Color.logoBlue4,fontWeight:'800',fontSize:22,marginBottom:10}}>Expertise Level</Text>
              </ShakeComp>
                <View style={{width:'100%',flexDirection:'row',}}>
                  <TouchableOpacity activeOpacity={0.8}
                    style={expertLevel === 1 ? styles.expertSelect : styles.expertUnselect}
                    onPress={() => {ExpertLevelClicked(1)}}>
                      <Fontisto style={{marginVertical:10}}
                          name="bicycle"
                          color={expertLevel === 1 ? "#fff" : Color.logoBlue1}
                          size={35}
                      />
                      <Icon
                          name= {expertLevel === 1 ? "check-box" : "check-box-outline-blank"}
                          color={expertLevel === 1 ? '#fff':'darkgray'}
                          size={20}
                      />
                      <Text style={expertLevel === 1 ? styles.textExpertSelect : styles.textExpertUnselected}>
                          Beginner
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.8}
                    style={expertLevel === 2 ? styles.expertSelect : styles.expertUnselect}
                    onPress={() => {ExpertLevelClicked(2)}}>
                      <FontAwesome6 style={{marginVertical:10}}
                          name="van-shuttle"
                          color={expertLevel === 2 ? "#fff" : Color.logoBlue1}
                          size={35}
                      />
                      <Icon
                          name= {expertLevel === 2 ? "check-box" : "check-box-outline-blank"}
                          color={expertLevel === 2 ? '#fff':'darkgray'}
                          size={20}
                      />
                      <Text style={expertLevel === 2 ? styles.textExpertSelect : styles.textExpertUnselected}>
                          Intermediate
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.8}
                    style={expertLevel === 3 ? styles.expertSelect : styles.expertUnselect}
                    onPress={() => {ExpertLevelClicked(3)}}>
                      <Fontisto style={{marginVertical:10}}
                          name="plane"
                          color={expertLevel === 3 ? "#fff" : Color.logoBlue1}
                          size={35}
                      />
                      <Icon
                          name= {expertLevel === 3 ? "check-box" : "check-box-outline-blank"}
                          color={expertLevel === 3 ? '#fff':'darkgray'}
                          size={20}
                      />
                      <Text style={expertLevel === 3 ? styles.textExpertSelect : styles.textExpertUnselected}>
                          Expert
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.8}
                    style={expertLevel === 4 ? styles.expertSelect : styles.expertUnselect}
                    onPress={() => {ExpertLevelClicked(4)}}>
                      <AntDesign style={{marginVertical:10}}
                          name="rocket1"
                          color={expertLevel === 4 ? "#fff" : Color.logoBlue1}
                          size={35}
                      />
                      <Icon
                          name= {expertLevel === 4 ? "check-box" : "check-box-outline-blank"}
                          color={expertLevel === 4 ? '#fff':'darkgray'}
                          size={20}
                      />
                      <Text style={expertLevel === 4 ? styles.textExpertSelect : styles.textExpertUnselected}>
                          Guru
                      </Text>
                  </TouchableOpacity>
                  
                </View>
               
              </View>
              <View style={{alignItems:'flex-start',marginTop:10,paddingBottom:10,width:'100%',flexDirection:'row',justifyContent:'space-between'}}>
              <ShakeComp ref={shakePrimaryRef}>
                <Text style={{color: skillData.length === 0 && primaryRed === true && !isPrimary ? "red" : Color.logoBlue4,fontWeight:'800',fontSize:22,marginBottom:10}}>Primary</Text>
              </ShakeComp>
                <Switch 
                onValueChange={(value) => {isPrimaryChange(value)}}
                  trackColor={{ false: Color.logoBlue1}}
                  value={isPrimary}></Switch>
              </View>
              
              <TouchableOpacity 
                style={{position:'absolute',bottom:10,width:'50%',backgroundColor:Color.logoBlue5, borderRadius:10,borderWidth:1,borderColor:'gray', marginVertical:5,padding:10,alignContent:'center',alignSelf:'center'}}
                onPress={confirmTechnology}
                  >
                  <Text style={[styles.subTitle,{width:'100%',textAlign:'center'}]}>
                      Add
                  </Text>
              </TouchableOpacity>
            </View>
          </Modal>          
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