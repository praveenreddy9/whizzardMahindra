import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Platform,
    Alert,
    FlatList,
    Modal,
    Vibration,
    PermissionsAndroid, Linking
} from 'react-native';
import {CButton, CInput, CText, CModal, Styles, CSpinner, LoadSVG} from './common'
import Utils from './common/Utils';
import Config from "./common/Config"
import Services from "./common/Services";
import {Appbar, Card, Button, DefaultTheme, Switch, Provider as PaperProvider} from "react-native-paper";
import FontAwesome from 'react-native-vector-icons/dist/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';
import QRCodeScanner from 'react-native-qrcode-scanner';
import OfflineNotice from './common/OfflineNotice';
import HomeNoticeScreen from './common/HomeNoticeScreen';
import AsyncStorage from "@react-native-community/async-storage";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import DeviceInfo from "react-native-device-info";


const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

export default class ScanQRcode extends React.Component {

    constructor(properties) {
        super(properties);
        this.getSwitchState();
        // this.requestLocationPermission()
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
            location: null,
            QRVisible: true,
            scannedDetailsModal: false,
            DisplayScreen: 'DISPLAY',
            LocationDATA: null,
            skipQRCode: false,
            InvalidQRscannedModal: false,
            // latitude: null,
            // longitude: null,
            switchState: true, siteCode: '',swipeActivated:false,
        };
    }


    getSwitchState() {
        AsyncStorage.getItem('Whizzard:switchState').then((switchState) => {
            if (JSON.parse(switchState) === true) {
                this.setState({switchState: false})
            } else {
                this.setState({switchState: true})
            }
        })
    }

    async requestCameraPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                this.setState({QRVisible: true, granted: granted})
            } else {
                Utils.dialogBox('Camera permission denied', '');
                this.props.navigation.goBack();
            }
        } catch (err) {
            Utils.dialogBox('err', '');
            // console.warn(err);
        }
    }


    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
            this.requestLocationPermission()
            let tempParamsData = self.props.navigation.state.params.UserShiftResponse
            self.setState({
                QRVisible: true,
                currentShift: tempParamsData,
                allowSkipQRCode: self.props.navigation.state.params.allowSkipQRCode,
                UserFlow: self.props.navigation.state.params.UserFlow,
                currentShiftId:tempParamsData ? tempParamsData.shiftId :'',
                currentUserId: tempParamsData ? tempParamsData.userId :'',
                currentSiteId: tempParamsData ? tempParamsData.siteId :'',
            }, () => {
                // console.log('scan QR currentShift',self.state.currentShift);

                self.state.UserFlow === 'SITE_ADMIN' || self.state.UserFlow === 'ADMIN_ADHOC_FLOW'
                    ? self.setState({
                        siteLocation: tempParamsData.siteName,
                        clientName: tempParamsData.clientName,
                        siteCode: tempParamsData.siteCode,
                        allowSkipQRCode:self.props.navigation.state.params.allowSkipQRCode,
                    })
                    :
                    self.state.UserFlow === 'NORMAL_ADHOC_FLOW'
                    ? self.setState({
                        siteLocation: tempParamsData.attrs.siteName,
                        clientName: tempParamsData.attrs.clientName,
                            siteCode: tempParamsData.attrs.siteCode,
                        allowSkipQRCode:self.props.navigation.state.params.allowSkipQRCode,
                            currentShiftId: tempParamsData.id,
                            currentUserIdcurrentUserId: tempParamsData.userId,
                            currentSiteId: tempParamsData.siteId,
                         })
                    :
                    self.state.UserFlow === 'UserAttendanceLog' ?
                        null
                        :
                        self.setState({
                            siteLocation: tempParamsData.userAttendance.siteDTO.name,
                            clientName: tempParamsData.attributes.clientName,
                            siteCode: tempParamsData.attributes.siteCode
                        });
            })
        });
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    barcodeReceived(e) {
        const self = this;
        if (e) {
            if (e.data && e.data != null) {
                Vibration.vibrate();
                // console.log('scan data e', e);
                self.setState({
                    LocationDATA: e.data,
                    QRVisible: false
                }, () => {
                    self.QR_Location();
                })
            } else {
                self.setState({QRVisible: false, InvalidQRscannedModal: true})
            }
        }
    }


    //API CALL for QR LOCATION and ALERT
    //Here Scanned data will be validated
    QR_Location = () => {
        let data = this.state.LocationDATA;
        var numberFormat = /^[0-9]+$/;
        var format = /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
        if (format.test(data) || numberFormat.test(data)) {
            this.setState({QRVisible: false, InvalidQRscannedModal: true})
        } else {
            const self = this;
            const scanLocationURL = Config.routes.BASE_URL + Config.routes.QR_SITE_LOCATION + data;
            const body = '';
            self.setState({spinnerBool: true}, () => {
                    Services.AuthHTTPRequest(scanLocationURL, "GET", body, function (response) {
                        const data = '';
                        if (response.status === 200) {
                            let ScanResponse = response.data;
                            // console.log('ScanResponse====', ScanResponse)
                            self.setState({
                                ScanResponseName: ScanResponse.name,
                                ScanResponseAddress: ScanResponse.address,
                                ScanResponseSiteCode: ScanResponse.siteCode,
                                ScanResponseSiteId: ScanResponse.siteId,
                                scannedDetailsModal: true,
                                QRVisible: false,
                                spinnerBool: false
                            });
                        } else {
                            self.setState({spinnerBool: false, QRVisible: false})
                        }
                    }, function (error) {
                        // console.log("err", error.response)
                        if (error.response) {
                            if (error.response.status === 403) {
                                self.setState({spinnerBool: false});
                                Utils.dialogBox("Token Expired,Please Login Again", '');
                                self.props.navigation.navigate('Login');
                            } else if (error.response.status === 500) {
                                self.setState({spinnerBool: false, QRVisible: false, InvalidQRscannedModal: true})
                                // Utils.dialogBox(error.response.data.message, '');
                            } else if (error.response.status === 400) {
                                self.setState({spinnerBool: false, QRVisible: true});
                                Utils.dialogBox(error.response.data.message, '');
                            } else if (error.response.status === 404) {
                                self.setState({spinnerBool: false, QRVisible: true});
                                Utils.dialogBox(error.response.data.error, '');
                            } else {
                                self.setState({spinnerBool: false, QRVisible: true});
                                Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
                            }
                        } else {
                            self.setState({spinnerBool: false, QRVisible: true});
                            Utils.dialogBox(error.message, '');
                        }
                    })
                }
            );
        }
    };

//API CALL for ATTENDENCE MARK
    AttendenceMark = () => {
        const self = this;
        const {QRstatus,currentShiftId,currentUserId,currentSiteId} = this.state;
        // console.log('Attendence Mark fun enter QRstatus', QRstatus);
        let scanURL
        {
            QRstatus === 'skippedQR'
                ?
                this.state.UserFlow === 'SITE_ADMIN' || self.state.UserFlow === 'NORMAL_ADHOC_FLOW' || self.state.UserFlow === 'ADMIN_ADHOC_FLOW' ?
                    scanURL = Config.routes.BASE_URL + Config.routes.UPDATE_MARK_ATTENDENCE + '?shiftId=' + currentShiftId + '&siteId=' + currentSiteId + '&userId=' + currentUserId + '&skipScan=' + true
                    :
                    scanURL = Config.routes.BASE_URL + Config.routes.QR_SCAN + '?shiftId=' + currentShiftId + '&siteId=' + currentSiteId + '&skipScan=' + true
                :
                this.state.UserFlow === 'SITE_ADMIN' || self.state.UserFlow === 'NORMAL_ADHOC_FLOW' || self.state.UserFlow === 'ADMIN_ADHOC_FLOW' ?
                    scanURL = Config.routes.BASE_URL + Config.routes.UPDATE_MARK_ATTENDENCE + '?shiftId=' + currentShiftId + '&siteId=' + self.state.ScanResponseSiteId + '&userId=' + currentUserId + '&skipScan=' + false
                    :
                    scanURL = Config.routes.BASE_URL + Config.routes.QR_SCAN + '?shiftId=' + currentShiftId+ '&siteId=' + self.state.ScanResponseSiteId + '&skipScan=' + false
        }
        const body = JSON.stringify({
            "longitude": this.state.longitude,
            "latitude": this.state.latitude,
            // "id": this.state.LocationDATA  ===>sending siteID
            "id": QRstatus === 'skippedQR' ? currentSiteId : this.state.LocationDATA
        });
        // console.log('attendence mark scanURL', scanURL,'body===>', body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(scanURL, "PUT", body, function (response) {
                if (response.status === 200) {
                    // console.log('markedData response', response);
                    let markedData = response.data;
                    self.setState({spinnerBool: false, LocationData: '', QRVisible: false}, () => {
                        Utils.dialogBox(markedData.message, '');
                        if(markedData.result.supervisorDetails) {
                            let supervisorList = markedData.result.supervisorDetails;
                            self.setState({supervisorList:supervisorList})
                        }

                        if (markedData.result.status === "SHIFT_IN_PROGRESS" && self.state.UserFlow === 'NORMAL'){
                            Utils.setToken('shiftId', JSON.stringify(markedData.result.shiftId), function () {
                            });
                            Utils.setToken('currentShiftStatus', JSON.stringify(markedData.result.status), function () {
                            })
                        }


                        markedData.result.status === "SHIFT_IN_PROGRESS"
                            ?
                            self.props.navigation.navigate('Summary', {
                                AttendenceResponse: markedData.result,
                                UserFlow: self.state.UserFlow,
                                SupervisorDetails: self.state.supervisorList
                            })
                            :
                            self.state.UserFlow === 'SITE_ADMIN'
                                ?
                                // self.props.navigation.goBack()
                                self.props.navigation.navigate('TeamListingScreen')
                                :
                                self.props.navigation.navigate('StartShiftScreen', {
                                    CurrentShiftId: markedData.result.shiftId,
                                    currentUserId: markedData.result.userId,
                                    UserFlow:self.state.UserFlow
                                });
                    })
                }else {
                    self.setState({spinnerBool:false})
                }
            }, function (error) {
                if (error.response) {
                    // console.log('Attendence Mark error', error, error.response, error.response.data);
                    if (error.response.status === 403) {
                        Utils.dialogBox("Token Expired,Please Login Again", '');
                        self.props.navigation.navigate('Login');
                        self.setState({spinnerBool: false, QRVisible: false})
                    } else if (error.response.status === 500) {
                        if(error.response.data.message) {
                            Utils.dialogBox(error.response.data.message, '');
                            self.setState({spinnerBool: false, QRVisible: true})
                        }else if(error.response.data.code){
                            Utils.dialogBox(error.response.data.code, '');
                            self.setState({spinnerBool: false, QRVisible: true})
                        }else{
                            Utils.dialogBox(error.response.data, '');
                            self.setState({spinnerBool: false, QRVisible: true})
                        }
                        self.state.UserFlow === 'SITE_ADMIN' || self.state.UserFlow === 'NORMAL_ADHOC_FLOW' || self.state.UserFlow === 'ADMIN_ADHOC_FLOW'
                            ?
                            self.setState({spinnerBool: false})
                            :
                            self.props.navigation.goBack()

                    } else if (error.response.status === 400) {
                        self.setState({spinnerBool: false, QRVisible: true})
                        if(error.response.data.message){
                            Utils.dialogBox(error.response.data.message, '')
                        }else{
                            Utils.dialogBox(error.response.data, '')
                        }
                        self.state.UserFlow === 'SITE_ADMIN' || self.state.UserFlow === 'NORMAL_ADHOC_FLOW'
                            ?
                            self.setState({spinnerBool: false})
                            :
                            self.props.navigation.goBack()
                    } else {
                        Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
                        self.setState({spinnerBool: false, QRVisible: true})
                    }
                } else {
                    Utils.dialogBox(error.message, '');
                    self.setState({spinnerBool: false, QRVisible: true})
                }
            })
        });
    };


    async checkBackgroundLocation(){
        try {
            const grantedBackground = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION);
            if (grantedBackground === 'never_ask_again'|| grantedBackground === 'denied'){
                Alert.alert('Background Location Permissions are Denied', 'Select Allow all the time in App Permissions',
                    [
                        {
                            text: 'Open Settings', onPress: () => {
                                Linking.openSettings()
                            }
                        }
                    ]
                )
            }else if (grantedBackground === PermissionsAndroid.RESULTS.GRANTED) {
                if (this.state.swipeActivated === true) {
                    this.AttendenceMark()
                }
            }else {
                Alert.alert('App needs Background Location Permissions', 'Select Allow all the time in App Permissions',
                    [
                        {
                            text: 'Ask Again', onPress: () => {
                                // Linking.openSettings()
                                this.checkBackgroundLocation()
                            }
                        },
                        {
                            text: 'Go Back', onPress: () => {
                                this.props.navigation.goBack()
                            }
                        }
                    ]
                )
            }
        }catch (err) {
            // console.warn(err);
            Utils.dialogBox(err, '')
        }
    }


    validatingLocation() {
        // console.log('Location validation', this.state.longitude, this.state.latitude)
        if (this.state.longitude && this.state.latitude ) {
            if (this.state.swipeActivated === true){
                this.state.UserFlow === 'UserAttendanceLog'
                    ?
                    this.userAttendenceLog()
                    :
                    // this.AttendenceMark()
                    DeviceInfo.getApiLevel().then((apiLevel) => {
                        if (apiLevel){
                            if (apiLevel >= 29){
                                this.checkBackgroundLocation()
                            }else {
                                this.AttendenceMark()
                            }
                        }else {
                            this.AttendenceMark()
                        }
                    })
            }
        } else {
            Alert.alert('', 'Your Location data is missing, Please check your Location Settings',
                [{
                    text: 'enable', onPress: () => {
                        this.requestLocationPermission();
                    }
                }]);
        }
    }

    async requestBackgroundPermission(){
        try {
            const grantedBackground = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION);
            if (grantedBackground === PermissionsAndroid.RESULTS.GRANTED) {
                this.requestCurrentLocation()
            }else {
                Alert.alert('App needs Background Location Permissions', 'Select Allow all the time in App Permissions',
                    [
                        {
                            text: 'Open Settings', onPress: () => {
                                // this.props.navigation.goBack()
                                Linking.openSettings()
                            }
                        },
                        {
                            text: 'Go Back', onPress: () => {
                                this.props.navigation.goBack()
                                // Linking.openSettings()
                            }
                        },
                        {
                            text: 'Ask Again', onPress: () => {
                                // Linking.openSettings()
                                this.requestBackgroundPermission()
                            }
                        }
                    ]
                )
            }
        }catch (err) {
            // console.warn(err);
            Utils.dialogBox(err, '')
        }
    }


     requestLocationPermission = async()=> {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                if (this.state.UserFlow === 'UserAttendanceLog'){
                    await this.requestCurrentLocation()
                }else {
                    DeviceInfo.getApiLevel().then((apiLevel) => {
                        if (apiLevel){
                            if (apiLevel >= 29){
                                this.requestBackgroundPermission()
                            }else {
                                this.requestCurrentLocation()
                            }
                        }else {
                            this.requestCurrentLocation()
                        }
                    });
                }
            } else {
                Utils.dialogBox('Location permission denied', '');
                this.props.navigation.goBack();
            }
        } catch (err) {
            // console.warn(err);
            Utils.dialogBox(err, '')
        }
    }

    async requestCurrentLocation(){
        this.requestCameraPermission();
        Geolocation.getCurrentPosition(
            (position) => {
                const currentLocation = position.coords;
                this.setState({
                    currentLocation: currentLocation,
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                }, function () {
                    // console.log('start shift lat long', currentLocation.latitude, currentLocation.longitude)
                    if (currentLocation.latitude === null && currentLocation.longitude === null) {
                        this.state.GPSasked === true
                            ?
                            Alert.alert('', 'Your Location data is missing, Please clear cache in GOOGLE MAPS',
                                [{
                                    text: 'GO BACK', onPress: () => {
                                        this.props.navigation.goBack()
                                    }
                                }])
                            :
                            Alert.alert('', 'Your Location data is missing, Please check your GPS  Settings',
                                [
                                    {
                                        text: 'ASK GPS', onPress: () => {
                                            this.checkGPSpermission();
                                        }
                                    },
                                    {
                                        text: 'GO BACK', onPress: () => {
                                            this.props.navigation.goBack()
                                        }
                                    }
                                ]
                            )
                    } else if (this.state.swipeActivated === true && currentLocation.latitude && currentLocation.longitude) {
                        this.validatingLocation()
                    }
                });
            },
            (error) => {
                // console.log(error.code, error.message);
                if (error.code === 2 && this.state.latitude === null && this.state.longitude === null) {
                    Alert.alert('', 'Your Location data is missing, Please check your GPS  Settings',
                        [
                            {
                                text: 'ASK GPS', onPress: () => {
                                    this.checkGPSpermission();
                                }
                            },
                            {
                                text: 'GO BACK', onPress: () => {
                                    this.props.navigation.goBack()
                                }
                            }
                        ]
                    )
                    // this.checkGPSpermission();
                } else {
                    // console.log(error.code, error.message);
                    Utils.dialogBox(error.message, '')
                    this.props.navigation.goBack()
                }
            },
            // {enableHighAccuracy: false, timeout: 10000, maximumAge: 100000}
            // {enableHighAccuracy: true, timeout: 25000, maximumAge: 3600000}
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );
    }

    checkGPSpermission() {
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({interval: 10000, fastInterval: 5000})
            .then(data => {
                this.setState({GPSasked: true}, () => {
                    this.requestLocationPermission()
                })
            }).catch(err => {
            // console.log('error code GPS check ',err.code);
            Utils.dialogBox('GPS permissions denied', '');
            this.props.navigation.goBack()
        });
    }


    //API CALL for LOG ATTENDENCE AT SITE WITH IN/OUT
    userAttendenceLog = () => {
        const self = this;
        const UserAttendenceLogURL = Config.routes.BASE_URL + Config.routes.USER_ATTENDENCE_LOG
        const body = JSON.stringify({
            "longitude": this.state.longitude,
            "latitude": this.state.latitude,
            'siteId': self.state.ScanResponseSiteId,
            'incoming': self.state.switchState,
            'logStatus':"SCAN_QR_CODE"
        });
        // console.log('User Attendence Log BODY', body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(UserAttendenceLogURL, "POST", body, function (response) {
                if (response) {
                    let markedData = response.data;
                    // console.log('UserAttendenceLog 200', markedData);
                    const switchState = self.state.switchState;

                    Utils.setToken('switchState', JSON.stringify(switchState), function () {
                    });
                    self.setState({spinnerBool: false, LocationData: '', QRVisible: false}, () => {
                        Utils.dialogBox(markedData.message, '');
                        // self.props.navigation.navigate('UserLogHistory')
                        self.props.navigation.goBack();
                    })
                }
            }, function (error) {
                if (error.response) {
                    // console.log('USER AttendenceLog error', error, error.response, error.response.data);
                    if (error.response.status === 403) {
                        Utils.dialogBox("Token Expired,Please Login Again", '');
                        self.props.navigation.navigate('Login');
                        self.setState({spinnerBool: false, QRVisible: false})
                    } else if (error.response.status === 500) {
                        self.setState({spinnerBool: false,   QRVisible: false}, () => {
                            Utils.dialogBox(error.response.data.message, '');
                            self.props.navigation.goBack();
                        })
                    } else if (error.response.status === 400) {
                        self.setState({spinnerBool: false,   QRVisible: false}, () => {
                            Utils.dialogBox(error.response.data.message, '');
                            self.props.navigation.goBack();
                        })
                    } else {
                        Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
                        self.setState({spinnerBool: false, QRVisible: true})
                    }
                } else {
                    Utils.dialogBox(error.message, '');
                    self.setState({spinnerBool: false, QRVisible: true})
                }
            })
        });
    };


    render() {
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                <HomeNoticeScreen/>

                {/* MODAL FOR Scanned Detials Show(if our QR scans)*/}
                {/*Here on OK press calls functions validating UserFlow*/}
                {/*scannedDetailsModal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.scannedDetailsModal}
                    onRequestClose={() => {
                    }}>
                    {/* onRequestClose={() => { this.setState({ scannedDetailsModal: false }) }}> */}
                    <View style={[Styles.modalfrontPosition]}>
                        <View
                            style={[Styles.bw1, Styles.bgLGrey, Styles.aslCenter, Styles.br10, {width: Dimensions.get('window').width - 70}]}>

                            <Card>
                                <Card.Content>
                                    <View style={[Styles.aslCenter, Styles.p5]}>
                                        <FontAwesome
                                            style={[Styles.aslCenter, Styles.marH15, {fontFamily: "Muli-Bold"}]}
                                            name="qrcode" size={50} color="#000"/>
                                        <CText
                                            cStyle={[Styles.cBlk, Styles.aslCenter, Styles.f18,Styles.ffMbold]}>{this.state.UserFlow === 'UserAttendanceLog' ?'Log Attendance' :'Mark Attendance' } </CText>
                                        {
                                            this.state.UserFlow === 'UserAttendanceLog'
                                                ?
                                                <View style={[Styles.mTop10,]}>
                                                <CText
                                                    cStyle={[Styles.aslStart, Styles.f22,Styles.ffMbold, {
                                                        color: this.state.switchState === true ? 'green' : 'red'
                                                    }]}>Log
                                                    Status : {this.state.switchState === true ? 'IN' : 'OUT'}</CText>
                                                <TouchableOpacity
                                                onPress={()=>{this.setState({switchState: !this.state.switchState})}}>
                                                    <Text style={[Styles.cOrangered,Styles.f14,Styles.mTop3,Styles.aslCenter,{borderBottomColor: '#FF4500', borderBottomWidth: 1}]}>(wanted to change status ?)</Text>
                                                </TouchableOpacity>
                                                </View>
                                                :
                                                null

                                        }

                                        <CText
                                            cStyle={[Styles.cBlk, Styles.aslStart, Styles.f18, Styles.marV10, {fontFamily: "Muli-Bold"}]}>Site
                                            Name : {this.state.ScanResponseName}</CText>
                                        <CText
                                            cStyle={[Styles.cBlk, Styles.aslStart, Styles.f18, Styles.marV10, {fontFamily: "Muli-Bold"}]}>Site
                                            Code : {this.state.ScanResponseSiteCode || 'NA'}</CText>
                                        <CText
                                            cStyle={[Styles.cBlk, Styles.aslStart, Styles.f18, {fontFamily: "Muli-Bold"}]}>Address
                                            : {this.state.ScanResponseAddress} ?</CText>
                                    </View>
                                    <View>
                                        <Button
                                            style={[Styles.aslCenter, Styles.bgBlue, Styles.padH25, Styles.marV10]}
                                            mode="contained" onPress={() => {
                                            Services.returnCurrentPosition((position)=>{
                                                this.setState({
                                                    currentLocation: position,
                                                    latitude: position.latitude,
                                                    longitude: position.longitude,
                                                    scannedDetailsModal: false,
                                                    QRVisible: true,
                                                    QRstatus: 'scannedQR',
                                                    swipeActivated:true
                                                },()=>{this.validatingLocation()})
                                            })
                                            // this.setState({
                                            //     scannedDetailsModal: false,
                                            //     QRVisible: true,
                                            //     QRstatus: 'scannedQR',
                                            //     swipeActivated:true
                                            // }, () => {
                                            //     this.validatingLocation()
                                            // })
                                        }}>
                                            OK
                                        </Button>
                                        <Button color={'#000'} style={[Styles.aslCenter]}
                                                onPress={() => {
                                                    this.props.navigation.goBack();
                                                    this.setState({
                                                        QRVisible: false,
                                                        scannedDetailsModal: false,
                                                        LocationDATA: ''
                                                    })
                                                }}>
                                            CANCEL
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>
                        </View>
                    </View>
                </Modal>

                {/*Modal for skip QR Code */}
                {/*on OK press calls Attendence mark Function*/}
                {/*skipQRCode*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.skipQRCode}
                    onRequestClose={() => {
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.p15, Styles.padH20, {width: Dimensions.get('window').width - 60}]}>

                            <View style={[Styles.aslCenter, Styles.p5, Styles.row]}>
                                <FontAwesome
                                    style={[Styles.aslCenter, Styles.marH15, Styles.ffMbold]}
                                    name="qrcode" size={50} color="#000"/>
                                <CText
                                    cStyle={[Styles.cRed, Styles.aslCenter, Styles.f18, Styles.ffMbold]}>
                                    SKIP QR SCAN ? </CText>
                            </View>

                            <View style={{borderBottomWidth: 1, borderBottomColor: '#b2beb5', marginVertical: 5,}}>
                            </View>

                            <Text style={[Styles.cAsh, Styles.aslCenter, Styles.f16, Styles.ffMbold, Styles.marV15]}>NOT
                                RECOMMENDED</Text>

                            <View style={[Styles.p10, Styles.bw1, Styles.bcAsh, Styles.mTop20]}>
                                <Text
                                    style={[Styles.cBlk, Styles.aslCenter, Styles.f16, Styles.ffMregular, Styles.mTop10]}>Proceed
                                    to
                                    Mark Attendance</Text>
                                <Text
                                    style={[Styles.cBlk, Styles.aslCenter, Styles.f18, Styles.ffMbold, Styles.pTop10]}>{this.state.siteLocation}({this.state.siteCode})</Text>
                                <Text
                                    style={[Styles.cBlk, Styles.aslCenter, Styles.f18, Styles.ffMbold]}>{this.state.clientName}</Text>
                            </View>

                            <TouchableOpacity onPress={() => {
                                Services.returnCurrentPosition((position)=>{
                                    this.setState({
                                        currentLocation: position,
                                        latitude: position.latitude,
                                        longitude: position.longitude,
                                        skipQRCode: false, QRstatus: 'skippedQR',swipeActivated:true
                                    },()=>{this.validatingLocation()})
                                })
                                // this.setState({skipQRCode: false, QRstatus: 'skippedQR',swipeActivated:true}, () => {
                                //     this.validatingLocation()
                                // })
                            }} style={[Styles.bgBlk, Styles.p10, Styles.marV20]}>
                                <Text
                                    style={[Styles.aslCenter, Styles.cWhite, Styles.padH10, Styles.padV5, Styles.ffMbold, Styles.f18]}>MARK
                                    ATTENDANCE</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                            this.setState({skipQRCode: false, QRVisible: true})
                        }}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/*Invalid QR Code Scanned*/}
                {/* MODAL FOR Invalid QR CODE SCANNED(other QR,alphabets) */}
                {/*InvalidQRscannedModal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.InvalidQRscannedModal}
                    onRequestClose={() => {
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View
                            style={[Styles.bw1, Styles.bgLGrey, Styles.aslCenter, Styles.br10, {width: Dimensions.get('window').width - 70}]}>

                            <Card>
                                <Card.Content>
                                    <View>
                                        <MaterialIcons
                                            style={[Styles.aslCenter, {paddingRight: 10}]}
                                            name="cancel" size={50} color="red"/>
                                    </View>
                                    <View style={[Styles.aslCenter, Styles.p5]}>
                                        <CText
                                            cStyle={[Styles.cBlk, Styles.aslCenter, Styles.f18, {fontFamily: "Muli-Bold"}]}>
                                            Invalid QR code scanned</CText>
                                    </View>
                                    <View>
                                        <Button
                                            style={[Styles.aslCenter, Styles.bgBlue, Styles.padH25, Styles.marV10]}
                                            mode="contained" onPress={() => {
                                            this.setState({
                                                QRVisible: true, InvalidQRscannedModal: false
                                            })
                                        }}>
                                            RETRY
                                        </Button>
                                        <Button color={'#000'} style={[Styles.aslCenter]}
                                                onPress={() => {
                                                    this.setState({
                                                        QRVisible: false,
                                                        InvalidQRscannedModal: false
                                                    }, () => {
                                                        // this.props.navigation.navigate('HomeScreen')
                                                        this.props.navigation.goBack()
                                                    })
                                                }}>
                                            Cancel
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>
                        </View>
                    </View>
                </Modal>
                {this.renderSpinner()}
                {
                    this.state.UserFlow === 'UserAttendanceLog'
                        ?

                        this.state.granted && this.state.QRVisible === true
                            ?
                            <View style={[Styles.flex1, Styles.bgWhite]}>
                                <Appbar.Header theme={theme} style={[Styles.bgWhite]}>
                                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                                    <Appbar.Content theme={theme} title="Attendance Log"/>
                                    <View style={[Styles.row, Styles.aslCenter, Styles.padH10]}>
                                        <Switch
                                            color='green'
                                            value={this.state.switchState}
                                            onValueChange={() => {
                                                this.setState({switchState: !this.state.switchState});
                                            }}
                                        />
                                        <Text
                                            style={[Styles.aslCenter, Styles.ffMbold, Styles.f22, {color: this.state.switchState === true ? 'green' : 'red'}]}>{' '}{this.state.switchState === true ? 'IN' : 'OUT'}</Text>

                                        <Text style={[Styles.padH10]}> </Text>
                                    </View>
                                </Appbar.Header>
                                <View style={[Styles.alignCenter, Styles.bgDash]}>
                                    <CText
                                        cStyle={[Styles.f18, Styles.marH20, Styles.marV10, Styles.ffMbold]}>Mark
                                        your Attendance </CText>
                                </View>

                                <QRCodeScanner
                                    onRead={this.barcodeReceived.bind(this)}
                                    style={{flex: 1}}
                                    cameraStyle={{height: Dimensions.get('window').height}}
                                    showMarker={false}
                                    fadeIn={false}
                                    reactivate={true}
                                    cameraType={"back"}
                                />
                            </View>
                            :
                            null
                        :
                        this.state.currentShift
                            ?
                            <View style={[Styles.flex1, Styles.bgWhite]}>

                                <Appbar.Header theme={theme} style={[Styles.bgWhite]}>
                                    <Appbar.BackAction onPress={() =>{
                                        this.state.UserFlow === 'NORMAL_ADHOC_FLOW' ?
                                            this.props.navigation.navigate('HomeScreen')
                                            : this.props.navigation.goBack()}}/>
                                    <Appbar.Content theme={theme} title="Scan QR code"/>
                                    {this.state.allowSkipQRCode === 'true' ?
                                        <Button mode="text"
                                                onPress={() => this.setState({skipQRCode: true, QRVisible: false})}>
                                            <Text style={{
                                                fontSize: 18,
                                                textAlign: 'right',
                                                fontWeight: 'bold',
                                                color: '#5220f0'
                                            }}> Skip</Text>
                                        </Button> : null
                                    }

                                </Appbar.Header>
                                <View style={[Styles.bgWhite]}>
                                    <CText
                                        cStyle={[Styles.f18, Styles.marH20, Styles.marV10, {fontFamily: "Muli-Regular"}]}>Mark
                                        Your attendance at <CText
                                            cStyle={[Styles.f18, Styles.marV5, {fontFamily: "Muli-Bold"}]}>{this.state.siteLocation}({this.state.siteCode})</CText></CText>
                                </View>
                                {
                                    this.state.granted && this.state.QRVisible === true
                                        ?
                                        <QRCodeScanner
                                            onRead={this.barcodeReceived.bind(this)}
                                            style={{flex: 1}}
                                            cameraStyle={{height: Dimensions.get('window').height}}
                                            showMarker={false}
                                            fadeIn={false}
                                            reactivate={true}
                                            cameraType={"back"}
                                        />
                                        :
                                        <View style={{backgroundColor: '#000', flex: 1}}>
                                            <Text>No QR CODE
                                            </Text>
                                        </View>
                                }
                            </View>
                            :
                            <CSpinner/>
                }
            </View>
        );
    }
}
