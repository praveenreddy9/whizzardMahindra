import React from 'react';
import { View, TextInput, Platform, StyleSheet } from 'react-native';

const CInput = ({ inputRef, onFocus, onBlur, autoFocus, onEndEditing, numberOfLines, cStyle, keyboardType, onChangeText, placeholder, multiline, uColor, pColor, editable, value, secureTextEntry, maxLength, autoCapitalize }) => {
    return (
        <TextInput onBlur={onBlur} onFocus={onFocus} onEndEditing={onEndEditing} style={[styles.inputStyle, cStyle, Platform.OS === 'ios' ? styles.profileTabs : {}]}
            onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder} multiline={multiline || false} value={value}
            underlineColorAndroid={uColor} placeholderTextColor={pColor} editable={editable} numberOfLines={numberOfLines}
            secureTextEntry={secureTextEntry} maxLength={maxLength} autoCapitalize={autoCapitalize} autoCorrect={false} spellCheck={false}
            ref={(r) => { inputRef && inputRef(r) }} textContentType="name" autoFocus={autoFocus}
        />
    );
};

const styles = StyleSheet.create({
    inputStyle: {
        height: 45, marginVertical: 5,
        color: '#000000',
    }
})

export { CInput };