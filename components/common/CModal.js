import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';

const CModal = ({ children, visible, title, buttonVisible, buttonClick, buttonText, closeButton }) => {
    return (
        <Modal visible={visible} transparent animationType={'slide'} onRequestClose={() => { }}>

            <View>

            </View>
        </Modal>
    );
};


const styles = StyleSheet.create({

})

export { CModal };