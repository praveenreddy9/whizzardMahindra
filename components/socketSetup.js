import * as React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    FlatList,
    Modal,
    Dimensions,
    TextInput,
    Keyboard,
    Button,
    Picker,
    Alert,
    Image,
    ActivityIndicator, StyleSheet
} from "react-native";
import {Appbar, DefaultTheme, RadioButton, Title,} from "react-native-paper";
import OneSignal from "react-native-onesignal";
import HomeScreen from './HomeScreen';
import {CSpinner, LoadSVG, Styles,LoadImages} from "./common";
import Utils from './common/Utils';
import OfflineNotice from "./common/OfflineNotice";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import ImageZoom from "react-native-image-pan-zoom";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import Services from "./common/Services";
import _ from "lodash";

// window.navigator.userAgent = 'react-native'

import io from "socket.io-client";

var praveenTest = '';
// var praveenTest = new WebSocket('http://192.168.0.112:5010');
// var praveenTest = React.useRef(new WebSocket('http://192.168.0.112:5010')).current;

// const socket = io('http://192.168.29.194:5010', {        //durga TECH
// // const socket = io('http://192.168.0.112:5010', {        //durga TECH#2
//     // const socket = io('http://192.168.29.176:5010', {        //my local
//     // const socket = io('http://localhost:5010', {
//     transports: ['websocket'], jsonp: false });

const socketIP = 'http://192.168.29.194:5010';

export default class socketSetup extends React.Component {

    constructor(props) {
        super(props);
        this.props.navigation.addListener(
            'willBlur', () => {
                OneSignal.removeEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.removeEventListener('opened', HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.props.navigation.addListener(
            'didFocus', () => {
                OneSignal.addEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.addEventListener('opened', HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.state = {

            spinnerBool: false,
        }
    }

    componentDidMount() {
        const self = this;

        // this.socket = io(socketIP, {transports: ['websocket'], jsonp: true });
        this.socket = io("http://192.168.29.194:5010");

        this.socket.on('sendOrderPickupData', (data)=>{
            console.log('getted message from socket server');
            console.log('connected response123',data);
        },(error)=>{
            console.log('error',error);
        });











        // socket.connect();
        // socket.on('connect', ()=>{
        //     console.log('First connected to socket server');
        //     // console.log('testData===>',testData);
        //     this.readyToEmit()
        // });

        // socket.on('connect',function (testData){
        //     console.log('connected to socket server');
        //     console.log('testData ==>',testData);
        // })

        // socket.on('sendData', () => {
        //     console.log('socket server update call');
        // });

        // this.readyToEmit()

        console.log('outside to socket server1122');

    }

    readyToEmit(){
        console.log('get data enter12')
        this.socket.on('sendOrderPickupData', (data)=>{
            console.log('getted message from socket server');
            console.log('connected response',data);
        });
        // socket.emit('sendData',{shiftId:'123456',orderId:'809809'})
        // this.checkForMessage()
        // console.log('after emit and end');
    }

    checkForMessage(){
        console.log('get message start');
        socket.on('getmessage', ()=>{
            console.log('emmitted message to socket server');
            // console.log('connected response',response);
        });
        console.log('get message end');
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    render() {
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                {this.renderSpinner()}
                <View
                    style={[[Styles.flex1, Styles.bgWhite]]}>
                    <Appbar.Header style={[Styles.bgDarkRed, Styles.padV5]}>
                        <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                        <Appbar.Content
                            style={[Styles.padV5]}
                            subtitleStyle={[Styles.ffLBlack, Styles.cWhite]}
                            title={'SOCKET'}
                            titleStyle={[Styles.ffLBlack]}/>
                    </Appbar.Header>
                    <View style={[Styles.flex1]}>

                    </View>

                </View>
            </View>
        );
    }
};
