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
    DeviceEventEmitter, Alert,BackHandler
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

class HomeNoticeScreen extends PureComponent {
    constructor(props) {
        super(props);
        // this.requestLocationPermission();
        // this.checkGPSpermission();
        // Services.checkGPSpermissions()
        this.state = {
            isConnected: true,
        };
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
        // this.checkLocationisRunning();
        const self = this;
        OneSignal.addEventListener('received', this.onReceived);
        OneSignal.addEventListener('opened', this.onOpened);
        NetInfo.isConnected.fetch().then(isConnected => {
            // console.log('First, is ' + (isConnected ? 'online' : 'offline'));
        });
        NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
    }

    componentWillUnmount() { // C
        // console.log('componentWillUnmount called');
        Linking.removeEventListener('url', this.handleOpenURL);
        OneSignal.removeEventListener('received', this.onReceived);
        OneSignal.removeEventListener('opened', this.onOpened);
        NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
    }

    onReceived(notification) {
        // console.log("offline Notification received: ", notification);
    }

    onOpened(openResult) {
        // console.log('offline  onOpened openResult====', openResult);
        const self = this;
        // console.log('Homescreen Message: ', openResult.notification.payload.body);
        // console.log('Homescreen Data: ', openResult.notification.payload.additionalData);
        // console.log('Homescreen isActive: ', openResult.notification.isAppInFocus);
        // console.log('Homescreen openResult: ', openResult);
        if (openResult.notification.isAppInFocus === true) {
            // Utils.dialogBox('notification on open','');
        }
        let data = openResult.notification.payload.body;
        // console.log('onOpened data=',data);
    }

    handleOpenURL = (event) => { // D
        // console.log('deep handleOpenURL event ', event);
        this.navigate(event.url);
    }
    navigate = (url) => { // E
        // console.log('deep URL==', url);
        const {navigate} = this.props.navigation;
        const route = url.replace(/.*?:\/\//g, '');
        // console.log('deep route', route);
        const id = route.match(/\/([^\/]+)\/?$/)[2];
        // console.log('deep id', id);
        const routeName = route.split('/')[0];
        // console.log('deep routeName', routeName);
        if (routeName === 'article') {
            navigate('article', {id, name: 'chris'})
        }
    }


    async requestLocationPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                // {
                //     title: Services.returnLocationTitle(),
                //     message:Services.returnLocationMessage(),
                //     // buttonNeutral: "Ask Me Later",
                //     // buttonNegative: "Cancel",
                //     buttonPositive: "OK"
                // },
                // PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                Geolocation.getCurrentPosition(
                    (position) => {
                        const currentLocation = position.coords;
                        this.setState({
                            currentLocation: currentLocation,
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                        }, function () {
                            // console.log('currentLocation.offlinee location',currentLocation.latitude,currentLocation.longitude);
                            // console.log('currentLocation.longitude',currentLocation.longitude);
                            if (currentLocation.latitude === null && currentLocation.longitude === null){
                                Alert.alert('Your Location data is missing, Please check your GPS  Settings', '',
                                    [ {
                                        // text: 'enable', onPress: () => {this.checkGPSpermission();}
                                        text: 'enable', onPress: () => {this.checkGPSpermission();}
                                    }]);
                            }
                        });
                    },
                    (error) => {
                        // console.log('Home notice screen currentLocation.offlinee errro',this.state.latitude,this.state.longitude);
                        if (error.code === 2){
                            this.checkGPSpermission();
                        }else {
                            console.log(error.code, error.message);
                            Utils.dialogBox(error.message, '')
                            this.stopLocation()
                        }

                    }
                );
            } else {
                Utils.dialogBox('Location permission denied', '');
                // this.props.navigation.goBack();
                this.stopLocation()
            }
        } catch (err) {
            console.warn(err);
            Utils.dialogBox(err, '')
        }
    }

    checkGPSpermission(){
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({interval: 10000, fastInterval: 5000})
            .then(data => {
                // console.log('inside GPS check',data);
                if (this.state.longitude === null && this.state.latitude === null) {
                    Alert.alert('Your Location data is missing, Please clear cache in GOOGLE MAPS', '',
                        [ {
                            text: 'OK', onPress: () => { console.log('to enable GPS');}
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
        if (this.state.isConnected) {
            AsyncStorage.getItem('Whizzard:currentShiftStatus').then((currentShift) => {
                let currentShiftStatus = JSON.parse(currentShift)
                if (currentShiftStatus) {
                    if (currentShiftStatus === 'SHIFT_IN_PROGRESS') {
                        // this.requestLocationPermission();

                        this.checkLocationisRunning();
                    } else if (currentShiftStatus === 'SHIFT_ENDED' || currentShiftStatus === 'INIT') {
                        this.stopLocation()
                    }
                } else {
                    this.stopLocation()
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
        // console.log('startlocation fun enter===HomeNoticeScreen');
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
        // console.log('stopLocation fun enter====HomeNoticeScreen');
        await LocationService.stopLocation((err) => {
            // console.log('inside stopLocation', err)
        }, (msg) => {
            // console.log('outside stopLocation HomeNoticeScreen', msg)
            // Utils.setToken('locationStatus', JSON.stringify(msg), function () {
            // });
        });
    }

    handleConnectivityChange = isConnected => {
        // console.log('handleConnectivityChange fun eneter')
        this.setState({isConnected});
    };

    render() {
        // console.warn('this.state.isConnected', this.state.isConnected)
        // Services.checkGPSpermissions()
        this.checkLocationStatus()
        if (!this.state.isConnected) {
            // this.stopLocation()
            return <MiniOfflineSign/>;
        }
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
export default HomeNoticeScreen;
