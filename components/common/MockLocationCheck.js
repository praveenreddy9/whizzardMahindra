import React, {PureComponent} from 'react';
import {
    View,
    Text,AppState,
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

var LocationService = NativeModules.LocationService; //LOCATIONS SERIVCES CALL
const {width} = Dimensions.get('window');
var Internet_connection = require("../../assets/images/Internet_connection.png");


function MiniOfflineSign() {
    return (
        <View style={styles.offlineContainer}>
            <View style={[Styles.flex1, {justifyContent: 'center', alignSelf: 'center'}]}>
                <MaterialIcons
                    style={[Styles.aslCenter, Styles.m10, {fontFamily: "Muli-Bold"}]}
                    name="signal-cellular-connected-no-internet-4-bar" size={150} color="#000"/>
                <Text style={[Styles.ffMbold,Styles.f18,Styles.cBlk,Styles.padH10,Styles.aslCenter]}>Whizzard found this device using Mock Location</Text>
                {/*<View style={[Styles.alignCenter]}>*/}
                {/*    <Button style={[Styles.aslCenter, Styles.bgLRed, Styles.marV15, {padding: 5}]}*/}
                {/*        // icon="camera"*/}
                {/*            mode="contained" onPress={() => {}}>*/}
                {/*        RETRY*/}
                {/*    </Button>*/}
                {/*</View>*/}
            </View>
        </View>
    );
}

class MockLocationCheck extends PureComponent {
    constructor(props) {
        super(props);
        // this.requestCurrentLocation()
        this.requestLocationPermission()
        this.state = {mockedLocation: false,
            appState: AppState.currentState}
    }


    componentDidMount() {
        const self = this;
        // this._subscribe = this.props.navigation.addListener('didFocus', () => {
        //     AppState.addEventListener('focus', this._handleAppStateChange);      //screen focus
            // AppState.addEventListener('blur', this._handleAppStateChange);      //notifications
            // AppState.addEventListener('change', this._handleAppStateChange);  //background
        // })
    }

    _handleAppStateChange = (nextAppState) => {
        console.log('app state check',AppState,'nextAppState==>',nextAppState);
         if (
            this.state.appState.match(/inactive|background/) &&
            nextAppState === 'active'
        ) {
             //Todo: Reload task here
         }
        console.log('app state check at last',nextAppState);

        this.setState({ appState: nextAppState });
        // this.requestLocationPermission()
    };

    componentWillUnmount() { // C
        // this.AppState.remove();
        // AppState.removeEventListener()
    }

    async checkMockLocation() {
        console.log('Mock location check at MLC')
        Geolocation.getCurrentPosition(
            (position) => {
                const currentLocation = position.coords;
                // console.log('offline Mock test',position,position.mocked,currentLocation.latitude,currentLocation.longitude)
                this.setState({mockedLocation:position.mocked})
                if (position.mocked){
                    // Utils.dialogBox('Offline Location Mocked','')
                    Alert.alert('Whizzard found this Device using Mock Location', alert,
                        [
                            {
                                text: 'TRY AGAIN', onPress: () => {
                                    this.checkMockLocation()
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
                timeout: 500, maximumAge:0
            }
        );
    }

    async requestLocationPermission() {
        Services.checkMockLocationPermission()
        // try {
        //     const granted = await PermissionsAndroid.request(
        //         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        //     );
        //     // console.log('granted==',granted);
        //     if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        //         this.checkMockLocation()
        //     } else {
        //         Utils.dialogBox('Location permission denied', '');
        //         // this.props.navigation.goBack();
        //         this.stopLocation()
        //     }
        // } catch (err) {
        //     console.warn(err);
        //     Utils.dialogBox(err, '')
        // }
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

//START LOCATION
    async startLocation() {
        // console.log('startlocation fun enter===MockLocationCheck');
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
        // console.log('stopLocation fun enter====MockLocationCheck');
        await LocationService.stopLocation((err) => {
            // console.log('inside stopLocation', err)
        }, (msg) => {
            // console.log('outside stopLocation offline', msg)
            // Utils.setToken('locationStatus', JSON.stringify(msg), function () {
            // });
        });
    }

    render() {
        this.requestLocationPermission()
            // if (this.state.mockedLocation) {
            //     return <MiniOfflineSign/>;
            // }
        return null
            // <MiniOfflineSign/>
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
export default MockLocationCheck;
