import React, { useState } from "react";
import { Modal as M, StyleSheet, View, TouchableOpacity, Pressable, Text } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';

import { ModalProps } from "./modal.props";
import { Color } from "../theme";
const Modal = ({headerTitle, visible, onDismiss, containerStyle, children, onRequestClose, backdropStyle, onBackdropPress}: ModalProps) => {
  {/*this not finish yet*/}
  return (
    <View style={styles.container}>
    <M
      statusBarTranslucent
      animationType='slide'
      transparent={true}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <Pressable style={[styles.overlay, {...backdropStyle}]} onPress={onBackdropPress}>
      <View style={[styles.modal, {...containerStyle}]}>
        <View style={styles.modalHeader}>
        <View style={styles.modalHeaderContent}>
          <Text style={{color: Color.logoBlue4, fontSize: 20,fontWeight:'bold'}}>{headerTitle}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss}>
        <Icon
              name="close"
              color={'#565558'}
              size={25}
          />
        </TouchableOpacity>
        </View>
        <View style={styles.modalContent}>
          {children}
        </View>
      </View>
      </Pressable>
    </M>
  </View>
  )
}
export default Modal

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center"
    },
    overlay: {
      padding:10,
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent:'center',
    },
    modal: {
      height: '100%',
     // marginTop: 'auto',
      opacity: 1,
      padding: 7,
      backgroundColor: "white",
      shadowColor: "black",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5
    },
    modalHeader: {
      flexDirection: "row",
      padding: 10
    },
    modalContent: {
      flex: 1
    },
    modalHeaderContent: {
      flexGrow: 1,
      // padding: 30
    },
    modalHeaderCloseText: {
      textAlign: "center",
      paddingLeft: 5,
      paddingRight: 5
    }
  });