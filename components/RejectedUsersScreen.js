import React, {Component} from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    TouchableOpacity, Alert
} from "react-native";
import AsyncStorage from '@react-native-community/async-storage';
import {FAB, Colors, DefaultTheme} from "react-native-paper";
import {CText,Styles} from "./common";
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import OfflineNotice from './common/OfflineNotice';
import OneSignal from "react-native-onesignal";
import LoginScreen from "./LoginScreen";


const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};
export default class RejectedUsersScreen extends Component {

    constructor(props) {
        super(props);
        this.props.navigation.addListener(
            'willBlur',() => {
                OneSignal.removeEventListener('received', LoginScreen.prototype.onReceived);
                OneSignal.removeEventListener('opened',LoginScreen.prototype.onOpened.bind(this));
            }
        );
        this.props.navigation.addListener(
            'didFocus',() => {
                OneSignal.addEventListener('received', LoginScreen.prototype.onReceived);
                OneSignal.addEventListener('opened',LoginScreen.prototype.onOpened.bind(this));
            }
        );
    }

    render() {
        return (
            <View style={[Styles.flex1, {backgroundColor: '#140a25',}]}>
                <OfflineNotice/>
                <View style={[Styles.flex1, {
                    backgroundColor: '#140a25',
                    justifyContent: 'center',
                    alignSelf: 'center',
                    textAlign: 'center'
                }]}>

                    <View style={[Styles.padH10]}>
                        <MaterialIcons style={{textAlign: 'center'}} name="block" size={100} color="red"/>
                        <CText
                            cStyle={[Styles.f22, Styles.cWhite, Styles.marV5, Styles.txtAlignCen, {fontFamily: 'Muli-Regular'}]}>Your Profile has been Rejected, Please contact supervisor. </CText>
                    </View>

                </View>
            </View>


        );
    }
}

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: "white"
    },
    container: {
        flex: 1,
        alignItems: "center"
    }
});
