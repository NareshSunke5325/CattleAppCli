import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Alert, Animated, Button, Dimensions, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {DrawerActions, useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Color } from "../theme";
import WebView, { WebViewMessageEvent } from "react-native-webview";

const  DEVICE_HEIGHT = Dimensions.get('window').height;
const DEVICE_WIDTH = Dimensions.get('window').width;
const About = () => {
  const navigation = useNavigation<any>();

  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState<number>(0);
  

  useEffect(() => {
    const reduceMotionChangedSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      isReduceMotionEnabled => {
        setReduceMotionEnabled(isReduceMotionEnabled);
      },
    );
    const screenReaderChangedSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      isScreenReaderEnabled => {
        setScreenReaderEnabled(isScreenReaderEnabled);
      },
    );

    AccessibilityInfo.isReduceMotionEnabled().then(isReduceMotionEnabled => {
      setReduceMotionEnabled(isReduceMotionEnabled);
    });
    AccessibilityInfo.isScreenReaderEnabled().then(isScreenReaderEnabled => {
      setScreenReaderEnabled(isScreenReaderEnabled);
    });

    return () => {
      reduceMotionChangedSubscription.remove();
      screenReaderChangedSubscription.remove();
    };
  }, []);

  // fadeAnim will be used as the value for opacity. Initial Value: 0
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    // Will change fadeAnim value to 1 in 5 seconds
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = () => {
    // Will change fadeAnim value to 0 in 3 seconds
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 3000,
      useNativeDriver: true,
    }).start();
  };
  const onWebViewMessage = (event: WebViewMessageEvent) => {
    console.log("Number(event.nativeEvent.data)",Number(event.nativeEvent.data))
    setWebViewHeight(Number(event.nativeEvent.data))
  }
  

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
                About
            </Text>
         <Text style={{width:'33%'}}></Text>
          </View>
          <View style={{backgroundColor:'transparent', width:'100%',height:'97%' }}>
          <ScrollView style={{height:DEVICE_HEIGHT}}>
        
        <WebView 
        style={ { height:webViewHeight+120, marginTop:-120} }
            javaScriptEnabled={true}
            onMessage={onWebViewMessage}
            source={{uri:"https://otsi-global.com/about-us/" }}
            scrollEnabled={false}
            injectedJavaScript='window.ReactNativeWebView.postMessage(document.body.scrollHeight)'
        />

        <View/>
    </ScrollView> 
          {/* <WebView
                  originWhitelist={['*']}
                  scrollEnabled={true}
                  style={{  }}
                  source={{ html: `<html>
                  <head>
                  <iframe style="border-style: none; top:-100px" src="https://otsi-global.com/about-us/"  width="100%" height="97%"></iframe>
                  </head>
                  </html>` }}
                 // injectedJavaScript={injectedJavaScript}
                  javaScriptEnabled
                >
                  <Text style={{position:'absolute',backgroundColor:'red'}}>dgiuhsgasdhgosdhgoisdhgsdiohgsdioghiso</Text>
                </WebView> */}
                
          </View>
          </View>
          </SafeAreaView>
          </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start',
    backgroundColor: Color.logoBlue3,
  },
  horizontal: {
    flexDirection: 'column',

  },
  status: {
    margin: 30,
  },
  fadingContainer: {
    padding: 20,
    backgroundColor: 'powderblue',
  },
  fadingText: {
    fontSize: 28,
  },
  buttonRow: {
    flexBasis: 100,
    justifyContent: 'space-evenly',
    marginVertical: 16,
  },
  subTitle: {
    width:'34%',
    textAlign: 'center',
    fontSize:20,
    color:'#fff'
  },
});

export default About;