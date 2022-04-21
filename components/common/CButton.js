import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const CButton = ({ children, cStyle, onPress, clickable }) => {
    return (
        <TouchableOpacity disabled={clickable} style={[styles.cText, cStyle]} onPress={onPress}>
            {children}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cText: {
        justifyContent: 'center',
        alignItems: 'center',
    }
})


export { CButton };