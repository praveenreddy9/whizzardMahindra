import React from 'react';
import {Text,StyleSheet} from 'react-native';

const CText = ({children, cStyle}) => {
    return (
        <Text style={[styles.cText, cStyle]}>{children}</Text>
    );
};

const styles = StyleSheet.create ({
    cText:{
        backgroundColor: 'transparent', fontSize: 14, color: '#666'
    }
})

export {CText};