import React, {PureComponent} from 'react';
import {
    View,
    Text,
    Dimensions,
    StyleSheet,
    NativeModules,
    Image,
    PermissionsAndroid,
    Linking,
    DeviceEventEmitter, Alert, PermissionsAndroidStatic
} from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import {Styles} from "./Styles";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import {Button} from "react-native-paper";
import AsyncStorage from "@react-native-community/async-storage";
import Utils from "./Utils";
import FastImage from "react-native-fast-image";
import Geolocation from "react-native-geolocation-service";
import OneSignal from "react-native-onesignal";
import Services from "./Services";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";
import HomeScreen from "../HomeScreen";
import DeviceInfo from "react-native-device-info";
import MockLocationCheck from "./MockLocationCheck";

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



var LocationService = NativeModules.LocationService; //LOCATIONS SERIVCES CALL
const {width} = Dimensions.get('window');
var Internet_connection = require("../../assets/images/Internet_connection.png");

function MiniOfflineSign() {
    // this.stopLocation()
    return (
        <View style={styles.offlineContainer}>
            <View style={[Styles.flex1, {justifyContent: 'center', alignSelf: 'center'}]}>
                {/*<MaterialIcons*/}
                {/*    style={[Styles.aslCenter, Styles.m10, {fontFamily: "Muli-Bold"}]}*/}
                {/*    name="signal-cellular-connected-no-internet-4-bar" size={150} color="#000"/>*/}
                {/*<Image style={[Styles.bgAsh,{ width: 200, height: 200,}]} source={require("../../assets/images/Internet_connection.png")} />*/}
                <FastImage source={Internet_connection}
                           style={[Styles.aslCenter, {
                               height: Dimensions.get("window").height / 1.8,
                               width: Dimensions.get("window").width - 80,
                               resize: 'cover'
                           }]}/>
                {/*<Text style={[Styles.ffMbold,Styles.f18,Styles.cBlk,Styles.padH10,Styles.aslCenter]}>No*/}
                {/*    Internet Connection</Text>*/}
            </View>
        </View>
    );
}

class OfflineNotice extends PureComponent {
    constructor(props) {
        super(props);
        // this.requestLocationPermission();
        // this.checkDeviceInfo();
        // this.notificationListener();
        // this.requestCurrentLocation()
        this.state = {
            isConnected: true,
        };
    }

    checkDeviceInfo() {
        DeviceInfo.getApiLevel().then((apiLevel) => {
            // console.log('offline apiLevel', apiLevel)
            if (apiLevel >= 29) {
                this.requestBackgroundPermission()
            } else {
                this.requestLocationPermission()
            }
        });
    }

    notificationListener() {
        // console.warn('notificationListener fun enter');
        OneSignal.init("29be598f-9bce-43f7-a0e6-7df2ee66fcf6"); //YOUR_ONESIGNAL_APPID
        OneSignal.addEventListener('received', this.onReceived);
        OneSignal.addEventListener('opened',this.onOpened.bind(this));
        OneSignal.addEventListener('ids', this.onIds);
        OneSignal.enableSound(true);
        OneSignal.inFocusDisplaying(2); //0-none,1-Alert in Screen,2-Notification in background
        OneSignal.enableVibrate(true);
    }

    DeepLinkFunction() {
        if (Platform.OS === 'android') {
            Linking.getInitialURL().then(url => {
                // console.log('deep function url=====@==', url);
                this.navigate(url);
            });
        } else {
            Linking.addEventListener('url', this.handleOpenURL);
        }
    }

    componentDidMount() {
        const self = this;
        NetInfo.isConnected.fetch().then(isConnected => {
            // console.log('First, is ' + (isConnected ? 'online' : 'offline'));
        });
        NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);

        // // this.socket = io(socketIP, {transports: ['websocket'], jsonp: true });
        // this.socket = io("http://192.168.29.194:5010");
        // // this.socket = io("https://trackapi.whizzard.in");
        //
        // this.socket.on('sendOrderPickupData', (data)=>{
        //     // console.log('getted message from socket server');
        //     console.log('connected response123',data);
        //     Alert.alert('got socket response','');
        //     this.socket.disconnect()
        // },(error)=>{
        //     console.log('error',error);
        // });
        //
        //
        //
        // console.log('OUTSIDE message from socket server');
    }

    componentWillUnmount() { // C
        NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
    }

    onReceived(notification) {
        // console.log("offline Notification received: ", notification);
    }

    onOpened(openResult) {
        // const {navigate} = this.props.navigation;
        // const {navigator}=this.props.navigation
        // console.log("Opened Notification offline");
        // console.log('Message: ', openResult.notification.payload.body);
        // console.log('Data: ', openResult.notification.payload.additionalData);
        // console.log('isActive: ', openResult.notification.isAppInFocus);
        // navigator('Notifications')
        // this.props.navigation.navigate('Notifications')
        // this.navigate(openResult.notification.payload.launchURL)
        // this.props.navigation.goBack();
        // HomeScreen.prototype.NotificationNavigator(openResult)
    }

    handleOpenURL = (event) => { // D
        console.log('deep handleOpenURL event ', event);
        this.navigate(event.url);
    }


    navigate = (url) => { // E
        console.log('deep URL==', url);
        const {navigate} = this.props.navigation;
        const route = url.replace(/.*?:\/\//g, '');
        console.log('deep route', route);

        if (route === 'article') {
            console.log('route inside navigation', route);
            navigate('Notifications')
            // navigate('SiteListingScreen')
        }
    }


    async requestCurrentLocation() {
        Geolocation.getCurrentPosition(
            (position) => {
                const currentLocation = position.coords;
                // this.checkMockLocation()
            },
            (error) => {
                this.stopLocation()
            }
        );
    }

    async checkMockLocation() {
        Geolocation.getCurrentPosition(
            (position) => {
                const currentLocation = position.coords;
                console.log('offline Mock test',position,position.mocked,currentLocation.latitude,currentLocation.longitude)
                if (position.mocked){
                    // Utils.dialogBox('Offline Location Mocked','')
                    Alert.alert('Whizzard found you are using Mock Location', alert,
                        [
                            {
                                text: 'TRY AGAIN', onPress: () => {
                                    this.requestCurrentLocation()
                                }
                            }
                        ]
                    )
                }else {
                    Utils.dialogBox('Offline Location is Good','')
                }
            },
            (error) => {
                console.log('OFFLINE mock error',error);
                Utils.dialogBox(error.message,'');
            },
            {
                enableHighAccuracy: true,
                timeout: 1000, maximumAge:0
            }
        );
    }

    async requestBackgroundPermission() {
        try {
            const grantedBackground = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
            );
            // console.log('grantedBackground in offline ', grantedBackground);
            if (grantedBackground === PermissionsAndroid.RESULTS.GRANTED) {
                this.requestCurrentLocation()
            } else {
                Alert.alert('App needs Background Location Permissions', 'Select Allow all the time in App Permissions',
                    [
                        {
                            text: 'Ask Again', onPress: () => {
                                this.requestBackgroundPermission()
                            }
                        },
                        {
                            text: 'Open Settings', onPress: () => {
                                Linking.openSettings()
                            }
                        }
                    ]
                )
            }
        } catch (err) {
            console.warn(err);
            Utils.dialogBox(err, '')
        }
    }


    async requestLocationPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                this.requestCurrentLocation()
            } else {
                // console.log('Offline Location Perm Denied');
                Utils.dialogBox('Location permission denied', '');
                this.stopLocation()
               Services.deniedLocationAlert()
            }
        } catch (err) {
            // console.log('Offline Location Perm Error');
            console.warn(err);
            Utils.dialogBox(err, '')
        }
    }

    checkGPSpermission() {
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({interval: 10000, fastInterval: 5000})
            .then(data => {
                // console.log('inside GPS check',data);
                if (this.state.longitude === null && this.state.latitude === null) {
                    Alert.alert('', 'Your Location data is missing, Please clear cache in GOOGLE MAPS',
                        [{
                            text: 'OK', onPress: () => {
                                console.log('to enable GPS');
                            }
                            // text: 'CLOSE APP', onPress: () => { BackHandler.exitApp();}
                        }]);
                }
            }).catch(err => {
            // console.log('error GPS check',err);
            // console.log('error code GPS check ',err.code);
            Utils.dialogBox('GPS permissions denied', '');
            this.stopLocation()
        });
    }

    //Check current shift status and Start or Stop Location
    async checkLocationStatus() {
        // console.log('Check location status at offline ')
        if (this.state.isConnected) {
            AsyncStorage.getItem('Whizzard:currentShiftStatus').then((currentShift) => {
                let currentShiftStatus = JSON.parse(currentShift)
                // console.log('offline currentshiftstatsu',currentShiftStatus)
                if (currentShiftStatus) {
                    if (currentShiftStatus === 'SHIFT_IN_PROGRESS') {
                        // this.requestLocationPermission();
                        this.checkDeviceInfo()
                        this.checkLocationisRunning();
                    } else if (currentShiftStatus === 'INIT' || currentShiftStatus === 'MARKED_ATTENDANCE') {
                        this.checkDeviceInfo()
                        this.stopLocation()
                    } else {
                        this.stopLocation()
                    }
                } else {
                    this.stopLocation()
                    this.requestLocationPermission()
                }
            });
        } else {
            this.stopLocation()
        }
    }

    //check location running status
    async checkLocationisRunning() {
        await LocationService.isLocationRunning((err) => {
            // console.log('isLocationRunning error', err)
        }, (msg) => {
            // console.log('checkLocationisRunning message in offlien',msg);
            if (msg) {
                // console.log('location status true');
            } else {
                // console.log('location status false');
                this.startLocation();
            }
        });
    }

//START LOCATION
    async startLocation() {
        // console.log('startlocation fun enter===OfflineNotice');
        await LocationService.startLocation((err) => {
            // console.log('startLocation error', err)
        }, (msg) => {
            // console.log('startLocation message', msg)
            // Utils.setToken('locationStatus', JSON.stringify(msg), function () {
            // });
        });
    }

//STOP LOCATION
    async stopLocation() {
        // console.log('stopLocation fun enter====OfflineNotice');
        await LocationService.stopLocation((err) => {
            // console.log('inside stopLocation', err)
        }, (msg) => {
            // console.log('outside stopLocation offline', msg)
            // Utils.setToken('locationStatus', JSON.stringify(msg), function () {
            // });
        });
    }

    handleConnectivityChange = isConnected => {
        // console.log('handleConnectivityChange fun eneter')
        this.setState({isConnected});
    };

    render() {
        // OneSignal.addEventListener('received', this.onReceived);
        // OneSignal.addEventListener('opened',this.onOpened.bind(this));
        // console.warn('this.state.isConnected', this.state.isConnected)
        // Services.checkGPSpermissions()
        this.checkLocationStatus()
        // this.DeepLinkFunction()
        if (!this.state.isConnected) {
            this.stopLocation()
            return <MiniOfflineSign/>;
        }
        // return <MockLocationCheck/>;
        return null;
    }
}

const styles = StyleSheet.create({
    offlineContainer: {
        // backgroundColor: '#b52424',
        backgroundColor: '#fff',
        height: Dimensions.get("window").height,
        width: Dimensions.get("window").width,
        // justifyContent: 'center',
        // alignItems: 'center',
        // flexDirection: 'row',
        // position: 'absolute',
    },
    offlineText: {color: '#fff'}
});
export default OfflineNotice;
