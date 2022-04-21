import React,{useContext} from 'react';
import {
    AccessibilityInfo,
    ActivityIndicator,
    Alert,AppState,
    Dimensions,
    FlatList,
    Image,
    ImageBackground,
    Linking,
    Modal,
    NativeModules,
    PermissionsAndroid,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableHighlight,
    TouchableOpacity,
    View
} from 'react-native';
import {CDismissButton, CSpinner, CText, LoadImages, LoadSVG, Styles, SupervisorsModal} from './common'
import Config from './common/Config';
import Services from './common/Services';
import Utils from './common/Utils';
import {
    Appbar,
    Card,
    Colors,
    DefaultTheme,
    FAB,
    IconButton,
    Paragraph,
    ProgressBar,
    Surface,
    Title,Snackbar,
} from "react-native-paper";
import {Column as Col, Row} from "react-native-flexbox-grid";
import Icon from 'react-native-vector-icons/dist/MaterialIcons';
import OfflineNotice from './common/OfflineNotice';
import AsyncStorage from "@react-native-community/async-storage";
import FastImage from "react-native-fast-image";
import Geolocation from "react-native-geolocation-service";
import DeviceInfo from "react-native-device-info";
import OneSignal from "react-native-onesignal";
import SignatureCapture from 'react-native-signature-capture';
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Entypo from "react-native-vector-icons/Entypo";
import MockLocationCheck from "./common/MockLocationCheck";
import io from "socket.io-client";
let LocationService = NativeModules.LocationService; //LOCATIONS SERIVCES CALL

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular',
        regular: 'Muli-Bold'
    }
};

const ImageURL = "https://images-for-push-notifications.s3.ap-south-1.amazonaws.com/republic_mobile-push.png"

export default class HomeScreen extends React.Component {


    constructor(properties) {
        super(properties);// triggers the ids event
        // this.DeepLinkFunction();
        // this.socket = io('localhost:5010', {jsonp: false});
        this.notificationListener();
        this.props.navigation.addListener(
            'willBlur', () => {
                OneSignal.removeEventListener('received', this.onReceived);
                OneSignal.removeEventListener('opened', this.onOpened.bind(this));
            }
        );

        this.props.navigation.addListener(
            'didFocus', () => {
                OneSignal.addEventListener('received', this.onReceived);
                OneSignal.addEventListener('opened', this.onOpened.bind(this));
            }
        );
        this.state = {
            refreshing: false,
            spinnerBool: false,
            userId: '',
            currentShift: '',
            completedShifts: '',
            otherShifts: '',
            loggedInUserDetails: [],
            ModalUserShiftList: false,
            ShowModal: true,
            NotificationToken: '',
            noShiftModel: false,
            siteSupervisorsInfo: '',
            primarySiteSupervisorsModal: false,
            trainingProgressModal: false,
            successModal: false,
            progress: '0',
            trainingProgressList: [],
            termsAndConditionsModal: false,
            profileInfoRatio: 0,
            primarySiteSupervisorsInfo: [],
            SignatureModal: false,
            SignatureURL: '',
            signatureDragged: false,
            notificationsCount: '',
            supervisorButtons: true,
            adhocShiftsCount: '',
            verifiedTripSummaryReportsCount: '',
            unVerifiedTripSummaryReportsCount: '',
            totalTripSummaryReportsCount: '',
            praveenState:'HELLO_PRAVEEN',
            reduceMotionEnabled: false,
            appState: AppState.currentState
        };
        this._onSaveEvent = this._onSaveEvent.bind(this);
        this._onDragEvent = this._onDragEvent.bind(this);

        // LogBox.ignoreAllLogs(value);
    }

    notificationListener = () => {
        // console.warn('notificationListener fun enter');
        // OneSignal.setLogLevel(10, 0);
        // OneSignal.initWithContext(this);
        OneSignal.init("29be598f-9bce-43f7-a0e6-7df2ee66fcf6"); //YOUR_ONESIGNAL_APPID
        OneSignal.addEventListener('received', this.onReceived);
        OneSignal.addEventListener('opened', this.onOpened.bind(this));
        OneSignal.addEventListener('ids', this.onIds);
        OneSignal.enableSound(true);
        OneSignal.inFocusDisplaying(2); //0-none,1-Alert in Screen,2-Notification in background
        OneSignal.enableVibrate(true);
    };


    //check location running status
    async checkLocationisRunning() {
        await LocationService.isLocationRunning((err) => {
            // console.log('isLocationRunning error', err)
        }, (msg) => {
            // console.log('checkLocationisRunning message in HOME', msg);
            if (msg) {
                // console.log('location status true');
            } else {
                this.startLocation();
            }
        });
    }

//START LOCATION
    async startLocation() {
         await LocationService.startLocation((err) => {
            // console.log('startLocation error', err)
        }, (msg) => {
            // console.log('startLocation message', msg)
        });
    }

//STOP LOCATION
    async stopLocation() {
        // console.log('stopLocation fun enter====HOME');
        await LocationService.stopLocation((err) => {
            // console.log('inside stopLocation HOME', err)
        }, (msg) => {
            // console.log('outside stopLocation HOME', msg)
        });
    }


    // DeepLinkFunction() {
    //     if (Platform.OS === 'android') {
    //         Linking.getInitialURL().then(url => {
    //             // console.log('deep function url=====@==', url);
    //             this.navigate(url);
    //         });
    //     } else {
    //         Linking.addEventListener('url', this.handleOpenURL);
    //     }
    // }


    componentDidMount() {
        const self = this;
        // this.socket = io(socketIP, {transports: ['websocket'], jsonp: true });
        // this.socket = io("http://192.168.0.120:5010");        //DP my hostel
        this.socket = io("http://192.168.29.194:5010");        //DP /tech
        // this.socket = io("http://192.168.1.5:5010");           //DP Home
        // this.socket = io("http://trackapi.whizzard.in");
        //
        // // this.socket.emit('sendData',{shiftId:'5121',orderId:'8899'})
        //
        // AsyncStorage.getItem('Whizzard:userId').then((userId) => {
        //     console.log('local userId',userId);
        //     this.socket.emit('requestToReceiveData',{phoneNumber:'8096712223',userId:userId})
        //     // this.socket.emit('sendData',{shiftId:'5121',orderId:'8899'})
        // })


        // this.socket.on('sendOrderPickupData', (data)=>{
        //     // console.log('getted message from socket server');
        //     console.log('connected response123',data);
        //     Alert.alert('got socket response','');
        //     this.socket.disconnect()
        // },(error)=>{
        //     console.log('error',error);
        // });

        // console.log('OUTSIDE message from socket server');

        // OneSignal.addEventListener('received', this.onReceived);
        // OneSignal.addEventListener('opened', this.onOpened);
        // OneSignal.addEventListener('opened', this.onOpened.bind(this));
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            AsyncStorage.getItem('Whizzard:profilePicUrl').then((data) => {
                self.setState({profilePicUrl: data,supervisorButtons:true}, function () {
                    self.TokenVerification();
                })
            })
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        });
    }

    startSocket(){
        this.socket.on('sendOrderPickupData', (data)=>{
            // console.log('getted message from socket server');
            console.log('connected response123',data);
            Alert.alert('got socket response','');
        },(error)=>{
            console.log('error',error);
        });

        // console.log('OUTSIDE message from socket server');
    }

    initaliseSocket(){
        this.socket.on('sendOrderPickupData', (data)=>{
            // console.log('getted message from socket server');
            console.log('connected response',data);
            this.playSound()
            Alert.alert('got socket response','');
        },(error)=>{
            console.log('error',error);
        });

        // console.log('Inital message from socket server');
    }


    emitSocketToStart(){
        const {loggedInUserDetails} =this.state;
        // this.socket = io("http://192.168.29.194:5010");
        this.socket.emit('requestToReceiveData',{phoneNumber:loggedInUserDetails.phoneNumber,userId:loggedInUserDetails.userId,siteCode:loggedInUserDetails.siteCode})
        Alert.alert('Data emitted','');
        this.initaliseSocket()
    }

    emitSocketToStop(){
        const {loggedInUserDetails} =this.state;
        // this.socket = io("http://192.168.29.194:5010");
        this.socket.emit('requestToDisconnectData',{phoneNumber:loggedInUserDetails.phoneNumber,userId:loggedInUserDetails.userId,siteCode:loggedInUserDetails.siteCode})
        Alert.alert('Data emit to stop','');
        // this.socket.disconnect()
    }

    playSound(){
        // Import the react-native-sound module
        var Sound = require('react-native-sound');

// Enable playback in silence mode
        Sound.setCategory('Alarm');

       // let soundFileName = 'emergency-alarm.mp3'
       let soundFileName = 'praveen.mp3'

// Load the sound file 'whoosh.mp3' from the app bundle
// See notes below about preloading sounds within initialization code below.
        var whoosh = new Sound(soundFileName, Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.log('failed to load the sound', error);
                return;
            }
            // loaded successfully
            console.log('duration in seconds: ' + whoosh.getDuration() + 'number of channels: ' + whoosh.getNumberOfChannels());

            // Play the sound with an onEnd callback
            whoosh.play((success) => {
                if (success) {
                    console.log('successfully finished playing');
                } else {
                    console.log('playback failed due to audio decoding errors');
                }
            });
        });
        console.log('END from play sound');
    }


    componentWillUnmount() { // C
         // Linking.removeEventListener('url', this.handleOpenURL);
        OneSignal.removeEventListener('received', HomeScreen.prototype.onReceived);
        OneSignal.removeEventListener('opened', HomeScreen.prototype.onOpened.bind(this));
        OneSignal.removeEventListener('ids', HomeScreen.prototype.onIds);
        Services.checkMockLocationPermission((response) => {
            if (response){
                this.props.navigation.navigate('Login')
            }
        })
    }

    onIds(device) {
        if (device.userId) {
            Utils.setToken('DEVICE_ID', device.userId, function () {
            });
        }
    }

    onReceived(notification) {
        // console.log("Homescreen Notification received: ", notification);
    }

    onOpened(openResult) {
        // console.log("Homescreen Notification openResult ", openResult);
        // console.log("Opened Notification");
        // console.log('Message: ', openResult.notification.payload.body);
        // console.log('Data: ', openResult.notification.payload.additionalData);
        // console.log('isActive: ', openResult.notification.isAppInFocus);

        // Whizzard://Notifications  ==>to notification screen
        // Whizzard://ShiftSummary  ==>to shift summary screen

        let url;
        url = openResult.notification.payload.launchURL
            ? openResult.notification.payload.launchURL
            : openResult.notification.payload.additionalData ? openResult.notification.payload.additionalData.url : '';
        const {navigate} = this.props.navigation;
        // console.log('notification url', url);
        if (url) {
            const route = url.replace(/.*?:\/\//g, '');
            // console.log('deep route', route);
            if (route === 'ShiftSummary') {
                navigate('ShiftSummary', {shiftId: openResult.notification.payload.additionalData.shiftId})
            } else if (route === 'Notifications') {
                let notificationImage = '';
                let notificationData = '';
                if (openResult.notification.payload.launchURL) {
                    if (openResult.notification.payload.bigPicture) {
                        if (openResult.notification.payload.additionalData) {
                            if (openResult.notification.payload.additionalData.ntfnVerticalImageUrl) {
                                notificationImage = openResult.notification.payload.additionalData.ntfnVerticalImageUrl
                            } else {
                                notificationImage = openResult.notification.payload.bigPicture
                            }
                        } else {
                            notificationImage = openResult.notification.payload.bigPicture
                        }
                    } else {
                        notificationImage = ''
                    }
                } else if (openResult.notification.payload.bigPicture) {
                    if (openResult.notification.payload.additionalData) {
                        if (openResult.notification.payload.additionalData.ntfnVerticalImageUrl) {
                            notificationImage = openResult.notification.payload.additionalData.ntfnVerticalImageUrl
                        } else {
                            notificationImage = openResult.notification.payload.bigPicture
                        }
                    } else {
                        notificationImage = openResult.notification.payload.bigPicture
                    }
                } else if (openResult.notification.payload.additionalData) {
                    if (openResult.notification.payload.additionalData.type) {
                        if (openResult.notification.payload.additionalData.type === "SHIFT_ATTENDANCE_NOTIFICATION") {
                            let sampleData = {}
                            const tempData = openResult.notification.payload.additionalData
                            sampleData.activity = openResult.notification.payload.body ? openResult.notification.payload.body : '';
                            sampleData.shiftId = tempData.shiftId ? tempData.shiftId : '';
                            sampleData.type = tempData.type ? tempData.type : '';
                            sampleData.url = tempData.url ? tempData.url : '';
                            sampleData.role = tempData.role ? tempData.role : '';

                            // console.log('HomeScreen sampleData',sampleData);
                            // notificationImage = openResult.notification.payload.additionalData.type
                            notificationImage = tempData.type
                            notificationData = sampleData
                        }
                        // else if (openResult.notification.payload.additionalData.type === "ORDER_PICKUP_NOTIFICATION") {
                        //     let sampleData = {}
                        //     const tempData = openResult.notification.payload.additionalData
                        //     sampleData.activity = openResult.notification.payload.body ? openResult.notification.payload.body : '';
                        //     sampleData.shiftId = tempData.shiftId ? tempData.shiftId : '';
                        //     sampleData.type = tempData.type ? tempData.type : '';
                        //     sampleData.url = tempData.url ? tempData.url : '';
                        //     sampleData.role = tempData.role ? tempData.role : '';
                        //     sampleData.orderId = tempData.orderId ? tempData.orderId : '';
                        //     sampleData.orderName = tempData.orderName ? tempData.orderName : '';
                        //
                        //     notificationImage = tempData.type
                        //     notificationData = sampleData
                        // }
                        else {
                            notificationImage = ''
                        }
                    } else {
                        notificationImage = ''
                    }
                } else {
                    notificationImage = ''
                }
                navigate('Notifications', {notificationImage: notificationImage, notificationData: notificationData})
            }
        } else {
            navigate('HomeScreen')
        }
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
        // const id = route.match(/\/([^\/]+)\/?$/)[2];
        // console.log('deep id', id);
        // const routeName = route.split('/')[0];
        // console.log('deep routeName', routeName);

        // if (routeName === 'article') {
        //     navigate('article', {id, name: 'chris'})
        // }

        if (route === 'Notifications') {
            // console.log('route inside navigation', route);
            navigate('Notifications')
            // navigate('SiteListingScreen')
        }

    }


    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    //error handling
    errorHandling(error) {
        // console.log("HOME screen error", error, error.response);
        const self = this;
        if (error.response) {
            if (error.response.status === 403) {
                self.setState({spinnerBool: false});
                Utils.dialogBox("Token Expired,Please Login Again", '');
                self.props.navigation.navigate('Login');
            } else if (error.response.status === 500) {
                self.setState({spinnerBool: false});
                if (error.response.data.message) {
                    Utils.dialogBox(error.response.data.message, '');
                } else {
                    Utils.dialogBox(error.response.data[0], '');
                }
            } else if (error.response.status === 400) {
                self.setState({spinnerBool: false});
                if (error.response.data.message) {
                    Utils.dialogBox(error.response.data.message, '');
                } else {
                    Utils.dialogBox(error.response.data[0], '');
                }
            } else if (error.response.status === 413) {
                self.setState({spinnerBool: false}, () => {
                    Utils.dialogBox('Request Entity Too Large', '');
                })
            } else if (error.response.status === 404) {
                self.setState({spinnerBool: false}, () => {
                    Utils.dialogBox(error.response.data.error, '');
                })
            } else {
                self.setState({spinnerBool: false});
                Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
            }
        } else {
            self.setState({spinnerBool: false});
            Utils.dialogBox(error.message, '');
        }
    }

    checkDeviceMockLocation(){
        Services.checkMockLocationPermission((response) => {
            if (response){
                this.props.navigation.navigate('Login')
            }
        })
    }

    //API call for TokenVerification and LoginDTO
    TokenVerification() {
        const self = this;
        const getLoggedinUserDetails = Config.routes.BASE_URL + Config.routes.LOGGEDIN_USER_DETAILS + '?days=' + 0;
        const body = {};
        this.checkDeviceMockLocation()
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(getLoggedinUserDetails, "GET", body, function (response) {
                if (response.status === 200) {
                    let loggedInUserDetails = response.data;
                    let userId = response.data.userId;
                    let currentShift = loggedInUserDetails.currentShift;
                    let otherShifts = loggedInUserDetails.otherShifts;
                    let completedShifts = loggedInUserDetails.completedShifts;
                    if (!loggedInUserDetails.termsAccepted) {
                        if (loggedInUserDetails.allowTermsAcceptance) {
                            self.setState({termsAndConditionsModal: true})
                        }
                    }
                    // this.socket = io("http://192.168.29.194:5010");
                    // this.socket.emit('requestToReceiveData',{phoneNumber:loggedInUserDetails.phoneNumber,userId:loggedInUserDetails.userId})

                    console.log('HOME data',loggedInUserDetails);
                    self.setState({
                        loggedInUserDetails: loggedInUserDetails,
                        userId: userId,
                        notificationsCount: loggedInUserDetails.notificationsCount,
                        siteSupervisorsInfo: loggedInUserDetails.siteSupervisorsInfo,
                        primarySiteSupervisorsInfo: loggedInUserDetails.primarySiteSupervisorsInfo,
                        refreshing: false,
                        currentShift: currentShift,
                        otherShifts: otherShifts,
                        completedShifts: completedShifts,
                        spinnerBool: false,
                        profileInfoRatio: loggedInUserDetails.profileInfoRatio / 100,
                        adhocShiftsCount: loggedInUserDetails.adhocShiftsCount,
                        verifiedTripSummaryReportsCount: loggedInUserDetails.verifiedTripSummaryReportsCount,
                        unVerifiedTripSummaryReportsCount: loggedInUserDetails.unVerifiedTripSummaryReportsCount,
                        totalTripSummaryReportsCount: loggedInUserDetails.totalTripSummaryReportsCount,
                    });
                    Utils.setToken('userId', userId, function () {
                    });
                    Utils.setToken('userRole', JSON.stringify(loggedInUserDetails.role), function () {
                    });



                    if (currentShift === null) {
                        // console.log('current shift null')
                        Utils.setToken('currentShiftStatus', JSON.stringify(null), function () {
                        });
                        self.stopLocation()
                    }else {
                        Utils.setToken('currentShiftStatus', JSON.stringify(currentShift.status), function () {
                        });
                    }

                    if (currentShift === null && otherShifts === null) {
                        {
                            loggedInUserDetails.role >= 19
                                ?
                                self.setState({
                                    spinnerBool: false, noShiftModel: false
                                })
                                :
                                self.setState({
                                    spinnerBool: false,
                                    noShiftModel: loggedInUserDetails.termsAccepted
                                })
                        }
                        // {self.stopLocation()}

                    } else if (currentShift) {
                        self.setState({currentShift: currentShift, spinnerBool: false,});

                        if (currentShift.shiftId && currentShift.status === 'SHIFT_IN_PROGRESS') {
                            Utils.setToken('shiftId', currentShift.shiftId, function (d) {
                            });
                        } else {
                            Utils.setToken('shiftId', '', function (d) {
                            });
                        }

                        {
                            currentShift.status === 'SHIFT_IN_PROGRESS' ? self.checkLocationisRunning() : self.stopLocation()
                        }

                    } else if (currentShift === null && otherShifts.length > 1) {
                        self.setState({ModalUserShiftList: true, otherShifts: otherShifts, spinnerBool: false})
                        // {self.stopLocation()}
                    }
                }
            }, function (error) {
                 self.errorHandling(error);
            })
        })
    }

    //API CALL to ACTIVATE SINGLE SHIFT FROM POP-UP
    ActiveUserShift = (shiftId) => {
        const self = this;
        const body = '';
        const ActiveUserShift = Config.routes.BASE_URL + Config.routes.USERSHIFT_ACTIVE + shiftId
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(ActiveUserShift, "PUT", body, function (response) {
                if (response.status === 200) {
                    let ActiveShift = response.data;
                    if (ActiveShift.shiftActive === true) {
                        self.setState({spinnerBool: false, ShowModal: false}, () => {
                            self.TokenVerification();
                            Utils.dialogBox("Shift selected, Mark attendance to proceed", '');
                        })
                    } else {
                        if (self.state.ShowModal === true)
                            self.setState({spinnerBool: false}, () => {
                                self.TokenVerification();
                            })
                    }
                }
            }, function (error) {
                self.errorHandling(error);
            })
        })
    };

    //API CALL to ACTIVATE ANOTHER SHIFT WHEN SELECTED
    ChangeUserShift = (newShiftId) => {
        const self = this;
        const body = '';
        const ChangeUserShift = Config.routes.BASE_URL + Config.routes.CHANGE_SHIFT + "?" + "currentShiftId=" + this.state.currentShift.shiftId + "&newShiftId=" + newShiftId + '&days=' + 0;
         this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(ChangeUserShift, "PUT", body, function (response) {
                if (response.status === 200) {
                    self.setState({spinnerBool: false, successModal: true}, () => {
                        self.TokenVerification();
                     })
                }
            }, function (error) {
                 self.errorHandling(error);
            });
        })
    };

    //FlatList for CompletedShiftsList
    CompletedShiftsList(item) {
         return (
            <ScrollView
                persistentScrollbar={true}
                style={[Styles.mTop10]}>
                <View style={[Styles.bw1, Styles.bgWhite, {borderColor: '#b5dbf0'}]}>
                    <View style={[Styles.row, Styles.jSpaceBet, Styles.p10]}>
                        <CText
                            cStyle={[Styles.aslCenter, Styles.ffMbold]}>{new Date(item.shiftDate).toLocaleDateString()}</CText>
                        <View>
                            <CText cStyle={[Styles.padV3, Styles.aslStart, Styles.ffMregular]}>Shift
                                Duration:{Services.calculateShiftDuration(item.reportingTime, item.actualEndTime)}</CText>
                        </View>
                    </View>
                    {Services.getShiftCardDetails(item)}

                    {
                        item.status === 'SHIFT_ENDED'
                            ?
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.navigate('Summary', {
                                    AttendenceResponse: item,
                                    SupervisorDetails: this.state.siteSupervisorsInfo
                                })
                                // this.props.navigation.navigate('ShiftSummary', {
                                //     shiftId: item.shiftId})
                            }}
                                              style={[Styles.m10, Styles.padV15, Styles.br5, Styles.bgLYellow, Styles.bcLYellow]}>
                                <View style={[Styles.aslCenter, Styles.row]}>
                                    <Icon name="done" size={30} color="#000"/>
                                    <CText
                                        cStyle={[Styles.f18, Styles.aslCenter, Styles.marH15, Styles.ffMregular]}>Shift
                                        Ended ({Services.getUserRolesShortName(item.userRole)})</CText>
                                </View>
                            </TouchableOpacity>
                            :
                            <View
                                style={[Styles.m10, Styles.padV15, Styles.br5, Styles.bgLYellow, Styles.bcLYellow]}>
                            <View style={[Styles.aslCenter, Styles.row]}>
                                <Icon name="done" size={30} color="#000"/>
                                <CText
                                    cStyle={[Styles.f18, Styles.aslCenter, Styles.marH15, Styles.ffMregular]}>Shift
                                    Cancelled ({Services.getUserRolesShortName(item.userRole)})</CText>
                            </View>
                            </View>
                    }
                </View>
            </ScrollView>
        )
    }

    //FlatList for OtherShiftsList and OnCLick to make Active
    OtherShiftsList(item) {
         return (
            <ScrollView
                persistentScrollbar={true}
                style={[Styles.mTop10,]}>
                {
                    item.shiftActive === false
                        ?
                        <View style={[{backgroundColor: '#b5dbf0'}]}>
                            <View
                                style={[Styles.row, Styles.jSpaceBet, Styles.bw1, Styles.padV10, Styles.padH10, {borderColor: '#f1f5f4'}]}>
                                <CText
                                    cStyle={[Styles.aslCenter, Styles.ffMbold]}>{new Date(item.shiftDate).toLocaleDateString()}</CText>
                                <CText
                                    cStyle={[Styles.aslEnd, Styles.ffMbold]}>ReportingTime-{Services.checkHMformat(item.startTime.hours, item.startTime.minutes)}</CText>
                            </View>

                            {Services.getShiftCardDetails(item)}
                            {
                                this.state.currentShift === null
                                    ?
                                    null
                                    :
                                    this.state.currentShift.status === 'INIT'
                                        ?
                                        <TouchableOpacity onPress={() => {
                                            Alert.alert('Do you want to Switch your shift', alert,
                                                [
                                                    {text: 'Cancel'},
                                                    {
                                                        text: 'OK', onPress: () => {
                                                            this.ChangeUserShift(item.shiftId)
                                                        }
                                                    }
                                                ]
                                            )
                                        }}
                                                          style={[Styles.padV10, Styles.aslCenter,]}>
                                            <CText
                                                cStyle={[Styles.f18, Styles.cWhite, Styles.aslCenter, Styles.bgBlk, Styles.p10, Styles.br10, Styles.ffMregular]}>Select
                                                Shift ({Services.getUserRolesShortName(item.userRole)})</CText>
                                        </TouchableOpacity>
                                        :
                                        null

                            }
                        </View>
                        :
                        null
                }

            </ScrollView>
        )
    }

    UserShiftsList(item) {
         if (item.shiftActive === false) {
            return (
                <ScrollView
                    persistentScrollbar={true}>
                    <TouchableOpacity onPress={() => {
                        this.setState({ModalUserShiftList: false}, () => {
                            this.ActiveUserShift(item.shiftId)
                        })
                    }}
                                      style={[Styles.aslCenter, Styles.m5, Styles.marV5, {width: Dimensions.get('window').width - 100}]}>
                        <Card>
                            <Card.Content>
                                <Title
                                    style={[Styles.ffMregular]}>{item.attributes.clientName}-{item.attributes.siteName}{' '}({Services.getUserRolesShortName(item.userRole)})</Title>
                                <Paragraph style={[Styles.ffMregular]}>({item.startTime.hours <= 9
                                    ? "0" + item.startTime.hours : item.startTime.hours}:{item.startTime.minutes <= 9
                                    ? "0" + item.startTime.minutes : item.startTime.minutes} to {item.endTime.hours <= 9
                                    ? "0" + item.endTime.hours : item.endTime.hours}:{item.endTime.minutes <= 9
                                    ? "0" + item.endTime.minutes : item.endTime.minutes})</Paragraph>
                            </Card.Content>
                        </Card>

                        {/* <CText cStyle={[Styles.f18, Styles.aslCenter, Styles.cBlk, Styles.fWbold]}>{item.attributes.clientName}-{item.attributes.siteName}</CText>
                        <CText cStyle={[Styles.f12, Styles.aslCenter, Styles.cBlk, Styles.fWbold]}>({item.startTime.hours}:{item.startTime.minutes} to {item.endTime.hours}:{item.endTime.minutes})</CText> */}
                    </TouchableOpacity>
                </ScrollView>
            )
        }
    }


    onRefresh() {
        //Clear old data of the list
        this.setState({dataSource: []});
        //Call the Service to get the latest data
        this.TokenVerification();
    }

    saveSign() {
        this.refs["sign"].saveImage();
    }


    resetSign() {
        this.refs["sign"].resetImage();
        this.setState({signatureDragged: false})
    }

    _onSaveEvent(result) {
        if (this.state.signatureDragged) {
            //result.encoded - for the base64 encoded png
            //result.pathName - for the file path name
            this.UploadSignature(result)
        } else {
            Utils.dialogBox('Please Sign above', '')
        }
    }

    _onDragEvent() {
        // This callback will be called when the user enters signature
        this.setState({signatureDragged: true})
        // console.log("dragged");
    }

    //Upload Signature
    UploadSignature(result) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.UPLOAD_DIGITAL_SIGNATURE;
        const body = {
            termsAccepted: true,
            brand: DeviceInfo.getBrand(),
            modal: DeviceInfo.getModel(),
            type: DeviceInfo.getSystemName(),
            systemVersion: DeviceInfo.getSystemVersion(),
            imageValue: result.encoded
        }
         this.setState({spinnerBool: true}, () => {
            Services.AuthSignatureHTTPRequest(apiURL, 'POST', body, function (response) {
                 if (response) {
                    self.setState({
                        spinnerBool: false,
                        SignatureModal: false,
                        signatureDragged: false,
                        termsAndConditionsModal: false
                    }, () => {
                         Utils.dialogBox("Agreement signed successfully", '',)
                    })
                }
            }, function (error) {
                 self.errorHandling(error)
            });
        });
    };

    render() {
        if (this.state.refreshing) {
            return (
                //loading view while data is loading
                <View style={[Styles.flex1, Styles.alignCenter]}>
                    <ActivityIndicator/>
                </View>
            );
        }
         const {loggedInUserDetails,supervisorButtons, adhocShiftsCount,verifiedTripSummaryReportsCount,unVerifiedTripSummaryReportsCount,totalTripSummaryReportsCount} = this.state;
        return (
            // <View style={[Styles.flex1]}>
            //     <View style={[Styles.flex1,]}>
            //         <View style={[{flex:0.6},Styles.bgDarkRed]}/>
            //         <View style={[{flex:3},Styles.bgWhite]}/>
            //     </View>
            //     <View style={[Styles.flex1,Styles.pAbsHome]}>
            //         <Appbar.Header style={[Styles.bgDarkRed]}>
            //             <Appbar.Action icon="menu" size={30} onPress={() => {
            //                 this.props.navigation.openDrawer();
            //             }}/>
            //             <Appbar.Content title="" subtitle=""/>
            //             <Appbar.Action icon="phone" size={25} onPress={() => {
            //                 this.setState({primarySiteSupervisorsModal: true});
            //             }}/>
            //             {
            //                 this.state.loggedInUserDetails.role >= 19
            //                     ?
            //                     <Appbar.Action icon="group" size={30} onPress={() => {
            //                         this.props.navigation.navigate('SiteListingScreen')
            //                     }}/>
            //                     : null
            //             }
            //
            //             <Appbar.Action icon="notifications" size={30} onPress={() => {
            //                 this.props.navigation.navigate('Notifications', {
            //                     notificationImage: '',
            //                     notificationData: ''
            //                 });
            //             }}/>
            //             {
            //                 this.state.notificationsCount
            //                     ?
            //                     <View style={[Styles.NotificationPosAbsolute]}>
            //                         <Text
            //                             style={[Styles.f8, Styles.alignCenter, Styles.br15, Styles.bgRed, Styles.cWhite, Styles.ffMbold, Styles.p2, Styles.padH5]}>{this.state.notificationsCount}</Text>
            //                     </View>
            //                     :
            //                     null
            //             }
            //         </Appbar.Header>
            //         <View style={[Styles.pAbsIntro]}>
            //             <TouchableOpacity
            //                 activeOpacity={0.9}
            //                 // onPress={() => this.props.navigation.navigate('profile', {
            //                 onPress={() => this.props.navigation.navigate('NewProfileScreen', {
            //                     UserFlow: 'NORMAL',
            //                     UserStatus: "ACTIVATED",
            //                     selectedProfileUserID: '',
            //                     onFocusPendingItem: null
            //                 })}
            //                 style={[Styles.row, Styles.bgWhite,Styles.marH10,Styles.br8,Styles.OrdersScreenCardshadow,Styles.p3]}>
            //                 {
            //                     this.state.profilePicUrl
            //                         ?
            //                         // <View style={[Styles.padV30, Styles.pTop20]}>
            //                         <View style={[Styles.alignCenter,{height: 100,
            //                             width: 100}]}>
            //                             <ImageBackground style={[{
            //                                 height: 100,
            //                                 width: 100
            //                             },Styles.alignCenter, Styles.ImgResizeModeContain]}
            //                                              source={LoadImages.user_pic}>
            //                                 <Image
            //                                     onLoadEnd={()=>this.setState({loaded:true})}
            //                                     style={[{
            //                                         height: 100,
            //                                         width: 100
            //                                     }, Styles.aslCenter,this.state.loaded ? Styles.bgWhite:'', Styles.ImgResizeModeContain]}
            //                                     source={this.state.profilePicUrl ? {uri: this.state.profilePicUrl} : LoadImages.user_pic}/>
            //                             </ImageBackground>
            //                         </View>
            //                         :
            //                         <FastImage
            //                             style={[{
            //                                 height: 100,
            //                                 width: 100
            //                             }, Styles.aslCenter, Styles.ImgResizeModeContain]}
            //                             source={LoadImages.user_pic}/>
            //                 }
            //
            //                 <View style={[Styles.flex1,Styles.pLeft5]}>
            //                     <Text numberOfLines={1} style={[Styles.aslStart, Styles.f24, Styles.colorBlue, Styles.mTop5, Styles.ffRBold ]}>{this.state.loggedInUserDetails.fullName}</Text>
            //
            //                     <View style={[Styles.flex1]}>
            //                         <Text
            //                             style={[Styles.aslStart, Styles.f16, Styles.colorGreen,Styles.mBtm5, Styles.ffMbold]}>{Services.getUserRoles(this.state.loggedInUserDetails.role)}</Text>
            //
            //                         <View style={[Styles.row,Styles.jSpaceBet, Styles.mTop5,]}>
            //                             <Text style={[Styles.aslCenter, Styles.f18, Styles.colorBlue, Styles.ffMbold ]}>{this.state.loggedInUserDetails.siteCode || '--'}</Text>
            //                             <View style={[Styles.row]}>
            //                                 <Text style={[Styles.aslCenter, Styles.f18, Styles.colorBlue,Styles.ffMbold ]}>Profile</Text>
            //                                 <Text
            //                                     style={[Styles.aslCenter, Styles.f18, Styles.colorGreen, Styles.ffMbold]}>{' '}{this.state.loggedInUserDetails.profileInfoRatio}%</Text>
            //                             </View>
            //                         </View>
            //                     </View>
            //                 </View>
            //                 <MaterialIcons name="navigate-next" size={30} style={[Styles.aslCenter]} color={'#233167'} />
            //
            //             </TouchableOpacity>
            //
            //             </View>
            //         </View>
            //
            //     </View>
            // </View>


            <View style={[[Styles.flex1, Styles.bgWhite]]}>
                <OfflineNotice/>
                {/*<HomeNoticeScreen/>*/}
                {/*app-header*/}
                     <Appbar.Header style={[Styles.bgWhite]}>
                        <Appbar.Action icon="menu" size={30} onPress={() => {
                            this.props.navigation.openDrawer();
                        }}/>
                        <Appbar.Content title="" subtitle=""/>
                        <Appbar.Action icon="phone" size={25} onPress={() => {
                            this.setState({primarySiteSupervisorsModal: true});
                        }}/>
                        {
                            this.state.loggedInUserDetails.role >= 19
                                ?
                                <Appbar.Action icon="group" size={30} onPress={() => {
                                    this.props.navigation.navigate('SiteListingScreen')
                                }}/>
                                : null
                        }

                        <Appbar.Action icon="notifications" size={30} onPress={() => {
                            this.props.navigation.navigate('Notifications', {
                                notificationImage: '',
                                notificationData: ''
                            });
                        }}/>
                        {
                            this.state.notificationsCount
                                ?
                                <View style={[Styles.NotificationPosAbsolute]}>
                                    <Text
                                        style={[Styles.f8, Styles.alignCenter, Styles.br15, Styles.bgRed, Styles.cWhite, Styles.ffMbold, Styles.p2, Styles.padH5]}>{this.state.notificationsCount}</Text>
                                </View>
                                :
                                null
                        }
                    </Appbar.Header>

                {this.renderSpinner()}

                {/*<View style={[Styles.row,Styles.jSpaceBet,Styles.flexWrap]}>*/}

                {/*    <TouchableOpacity*/}
                {/*        onPress={()=>{*/}
                {/*            this.playSound()*/}
                {/*        }}*/}
                {/*        activeOpacity={0.7}*/}
                {/*        style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgLPink,Styles.width120]}>*/}
                {/*        <View style={[Styles.alignCenter, Styles.p5]}>*/}
                {/*            <Text*/}
                {/*                style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Play Sound</Text>*/}
                {/*        </View>*/}
                {/*    </TouchableOpacity>*/}

                {/*    <TouchableOpacity*/}
                {/*        onPress={()=>{*/}
                {/*            this.emitSocketToStart()*/}
                {/*        }}*/}
                {/*        activeOpacity={0.9}*/}
                {/*        style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgLGreen,Styles.width120]}>*/}
                {/*        <View style={[Styles.alignCenter, Styles.p5]}>*/}
                {/*            <Text*/}
                {/*                style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Emit</Text>*/}
                {/*        </View>*/}
                {/*    </TouchableOpacity>*/}

                {/*    <TouchableOpacity*/}
                {/*        onPress={()=>{*/}
                {/*            this.socket.connect()*/}
                {/*        }}*/}
                {/*        activeOpacity={0.9}*/}
                {/*        style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgLBlueGreen,Styles.width120]}>*/}
                {/*        <View style={[Styles.alignCenter, Styles.p5]}>*/}
                {/*            <Text*/}
                {/*                style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Connect</Text>*/}
                {/*        </View>*/}
                {/*    </TouchableOpacity>*/}

                {/*    <TouchableOpacity*/}
                {/*        onPress={()=>{*/}
                {/*            this.emitSocketToStop()*/}
                {/*        }}*/}
                {/*        activeOpacity={0.9}*/}
                {/*        style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgLGrey,Styles.width120]}>*/}
                {/*        <View style={[Styles.alignCenter, Styles.p5]}>*/}
                {/*            <Text*/}
                {/*                style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Emit Stop</Text>*/}
                {/*        </View>*/}
                {/*    </TouchableOpacity>*/}

                {/*    <TouchableOpacity*/}
                {/*        onPress={()=>{*/}
                {/*            this.socket.disconnect()*/}
                {/*        }}*/}
                {/*        activeOpacity={0.9}*/}
                {/*        style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgRed,Styles.width120]}>*/}
                {/*        <View style={[Styles.alignCenter, Styles.p5]}>*/}
                {/*            <Text*/}
                {/*                style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Dis-Connect</Text>*/}
                {/*        </View>*/}
                {/*    </TouchableOpacity>*/}
                {/*</View>*/}

                {
                    this.state.loggedInUserDetails
                        ?
                        <ScrollView
                            persistentScrollbar={true}
                            refreshControl={
                                <RefreshControl
                                    //refresh control used for the Pull to Refresh
                                    refreshing={this.state.refreshing}
                                    onRefresh={this.onRefresh.bind(this)}
                                />
                            }
                            style={[{flex: 1, backgroundColor: '#f1f5f4'}]}>
                            <View style={[{
                                flex: 1,
                                backgroundColor: '#f1f5f4',
                                paddingVertical: 10,
                                paddingHorizontal: 10
                            }]}>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    // onPress={() => this.props.navigation.navigate('profile', {
                                    onPress={() => this.props.navigation.navigate('NewProfileScreen', {
                                        UserFlow: 'NORMAL',
                                        UserStatus: "ACTIVATED",
                                        selectedProfileUserID: '',
                                        onFocusPendingItem: null
                                    })}
                                    style={[Styles.row, Styles.bgWhite,Styles.OrdersScreenCardshadow]}>
                                    {
                                        this.state.profilePicUrl
                                            ?
                                            // <View style={[Styles.padV30, Styles.pTop20]}>
                                            <View style={[Styles.alignCenter,{height: 100,
                                                width: 100}]}>
                                                <ImageBackground style={[{
                                                    height: 100,
                                                    width: 100
                                                },Styles.alignCenter, Styles.ImgResizeModeContain]}
                                                                 source={LoadImages.user_pic}>
                                                    <Image
                                                        onLoadEnd={()=>this.setState({loaded:true})}
                                                        style={[{
                                                            height: 100,
                                                            width: 100
                                                        }, Styles.aslCenter,this.state.loaded ? Styles.bgWhite:'', Styles.ImgResizeModeContain]}
                                                        source={this.state.profilePicUrl ? {uri: this.state.profilePicUrl} : LoadImages.user_pic}/>
                                                </ImageBackground>
                                            </View>
                                            :
                                            <FastImage
                                                style={[{
                                                    height: 100,
                                                    width: 100
                                                }, Styles.aslCenter, Styles.ImgResizeModeContain]}
                                                source={LoadImages.user_pic}/>
                                    }

                                    <View style={[Styles.flex1,Styles.pLeft5]}>
                                        <Text numberOfLines={1} style={[Styles.aslStart, Styles.f24, Styles.colorBlue, Styles.mTop5, Styles.ffRBold ]}>{this.state.loggedInUserDetails.fullName}</Text>

                                    <View style={[Styles.flex1]}>
                                            <Text
                                                style={[Styles.aslStart, Styles.f16, Styles.colorGreen,Styles.mBtm5, Styles.ffMbold]}>{Services.getUserRoles(this.state.loggedInUserDetails.role)}</Text>

                                            <View style={[Styles.row,Styles.jSpaceBet, Styles.mTop5,]}>
                                                <Text style={[Styles.aslCenter, Styles.f18, Styles.colorBlue, Styles.ffMbold ]}>{this.state.loggedInUserDetails.siteCode || '--'}</Text>
                                                <View style={[Styles.row]}>
                                                    <Text style={[Styles.aslCenter, Styles.f18, Styles.colorBlue,Styles.ffMbold ]}>Profile</Text>
                                                    <Text
                                                        style={[Styles.aslCenter, Styles.f18, Styles.colorGreen, Styles.ffMbold]}>{' '}{this.state.loggedInUserDetails.profileInfoRatio}%</Text>
                                                </View>
                                            </View>
                                    </View>
                                    </View>
                                    <MaterialIcons name="navigate-next" size={30} style={[Styles.aslCenter]} color={'#233167'} />

                                </TouchableOpacity>

                                <View>
                                    {/* DISTANCE,DELIVERIES,TRIPS */}
                                    {
                                        this.state.loggedInUserDetails.role <= 15
                                            ?
                                            < Row size={12} style={[styles.aslCenter, {
                                                marginTop: 10,
                                                marginBottom: 10,
                                                backgroundColor: "#f1f5f4"
                                            }]}>
                                                <Col sm={4}>
                                                    <Surface
                                                        style={[styles.aslCenter, {elevation: 2, paddingBottom: 10}]}>
                                                        <Image style={[Styles.aslCenter, {
                                                            height: 60,
                                                            width: 60,
                                                            resizeMode: 'contain'
                                                        }]} source={LoadImages.distance}/>
                                                        <CText
                                                            cStyle={[Styles.cBlk, Styles.f18, Styles.aslCenter, Styles.padV5, Styles.ffMbold]}>{this.state.loggedInUserDetails.totalDistance}{this.state.loggedInUserDetails.totalDistance ? ' km' : null}</CText>
                                                        <CText
                                                            cStyle={[Styles.aslCenter, Styles.ffMbold]}>DISTANCE</CText>
                                                    </Surface>
                                                </Col>
                                                <Col sm={4}>
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            // this.props.navigation.navigate('MyTrips')
                                                            this.props.navigation.navigate('MyTrips', {shiftId: ''})
                                                        }>
                                                        <Surface style={[styles.aslCenter, Styles.marH5, {
                                                            elevation: 2,
                                                            paddingBottom: 10
                                                        }]}>
                                                            <Image style={[Styles.aslCenter, {
                                                                height: 60,
                                                                width: 60,
                                                                resizeMode: 'contain'
                                                            }]} source={LoadImages.deliveries}/>
                                                            <CText
                                                                cStyle={[Styles.cBlk, Styles.f18, Styles.aslCenter, Styles.padV5, Styles.ffMbold]}>{this.state.loggedInUserDetails.totalDeliveries}</CText>
                                                            <CText
                                                                cStyle={[Styles.aslCenter, Styles.ffMbold]}>PACKAGES</CText>
                                                        </Surface>
                                                    </TouchableOpacity>
                                                </Col>
                                                <Col sm={4}>
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            // this.props.navigation.navigate('MyTrips')
                                                            this.props.navigation.navigate('MyTrips', {shiftId: ''})
                                                        }>
                                                        <Surface style={[styles.aslCenter, {
                                                            elevation: 2,
                                                            paddingBottom: 10
                                                        }]}>
                                                            <Image style={[Styles.aslCenter, {
                                                                height: 40,
                                                                width: 60,
                                                                resizeMode: 'contain',
                                                                margin: 10
                                                            }]} source={LoadImages.trips}/>
                                                            <CText
                                                                cStyle={[Styles.cBlk, Styles.f18, Styles.aslCenter, Styles.padV5, Styles.ffMbold]}>{this.state.loggedInUserDetails.totalTrips}</CText>
                                                            <CText
                                                                cStyle={[Styles.aslCenter, Styles.ffMbold]}>TRIPS</CText>
                                                        </Surface>
                                                    </TouchableOpacity>
                                                </Col>
                                            </Row> :
                                            <Row size={12} style={[styles.aslCenter, {
                                                marginTop: 10,
                                                marginBottom: 10,
                                                backgroundColor: "#f1f5f4"
                                            }]}>
                                            </ Row>
                                    }


                                    {
                                        // this.state.currentShift === null && loggedInUserDetails.role >= 19
                                        loggedInUserDetails.role >= 19
                                            ?
                                            <View style={[Styles.aslCenter,Styles.mBtm15,Styles.bgWhite,Styles.br5,Styles.OrdersScreenCardshadow]}>

                                                {/*<TouchableOpacity*/}
                                                {/*    onPress={()=>{this.setState({supervisorButtons:!supervisorButtons})}}*/}
                                                {/*    activeOpacity={0.9}*/}
                                                {/*    style={[Styles.row, Styles.jSpaceBet, Styles.bgTransprent, Styles.br5, Styles.padV10, Styles.padH10,{width:Dimensions.get('window').width-23}]}>*/}

                                                {/*    <Text style={[Styles.ffMbold,Styles.padH10, Styles.cWhite, Styles.f18,]}>Tasks List</Text>*/}
                                                {/*    <FontAwesome name={supervisorButtons ? "chevron-up":"chevron-down"} size={25} color={"#fff"}/>*/}
                                                {/* </TouchableOpacity>*/}
                                                {/*{*/}
                                                {/*    supervisorButtons*/}
                                                {/*        ?*/}
                                                        <View style={[Styles.row, Styles.flexWrap,Styles.alignCenter,Styles.padV10]}>
                                                            {
                                                                loggedInUserDetails.role >= 27
                                                                    ?
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            this.props.navigation.navigate('UserLogHistory')
                                                                        }}
                                                                        activeOpacity={0.9}
                                                                        style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgLGoldenrod, {width: Dimensions.get('window').width / 4}]}>
                                                                        <View style={[Styles.alignCenter, Styles.p5]}>
                                                                            <MaterialCommunityIcons name="qrcode-scan"
                                                                                                    size={32}
                                                                                                    color={'#233167'}/>
                                                                            <Text
                                                                                style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Log</Text>
                                                                            <Text
                                                                                numberOfLines={1}
                                                                                style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Attendance</Text>
                                                                        </View>
                                                                    </TouchableOpacity>
                                                                    :
                                                                    null
                                                            }

                                                            {
                                                                loggedInUserDetails.role <= 26
                                                                    ?
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            // this.props.navigation.navigate('MyTrips')
                                                                            this.props.navigation.navigate('MyTrips', {shiftId:''})
                                                                        }}
                                                                        activeOpacity={0.9}
                                                                        style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgLBlueGreen, {width: Dimensions.get('window').width / 4}]}>
                                                                        <View style={[Styles.alignCenter, Styles.p5]}>
                                                                            {/*<FontAwesome name="calendar" size={32}*/}
                                                                            {/*             color={"#233167"}/>*/}
                                                                            <Entypo name="colours" size={32}
                                                                                    color={"#233167"}/>
                                                                            <Text
                                                                                style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>My</Text>
                                                                            <Text
                                                                                style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Trips</Text>
                                                                        </View>
                                                                    </TouchableOpacity>
                                                                    :
                                                                    null
                                                            }

                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    this.props.navigation.navigate('CalendarShifts', {userId: ''})
                                                                }}
                                                                activeOpacity={0.9}
                                                                style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgLGreen, {width: Dimensions.get('window').width / 4}]}>
                                                                <View style={[Styles.alignCenter, Styles.p5]}>
                                                                    <FontAwesome name="calendar" size={32}
                                                                                 color={"#233167"}/>
                                                                    <Text
                                                                        style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Calendar</Text>
                                                                    <Text
                                                                        style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Shifts</Text>
                                                                </View>
                                                            </TouchableOpacity>

                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    this.props.navigation.navigate('TripsVerification')
                                                                }}
                                                                activeOpacity={0.9}
                                                                style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgLBrown, {width: Dimensions.get('window').width / 4}]}>
                                                                <View style={[Styles.alignCenter, Styles.p5]}>
                                                                    <FontAwesome name="file-text" size={32}
                                                                                 color={"#233167"}/>
                                                                    <Text
                                                                        style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Trip</Text>
                                                                    <Text
                                                                        numberOfLines={1}
                                                                        style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Verification</Text>
                                                                </View>
                                                            </TouchableOpacity>

                                                            {/*<TouchableOpacity*/}
                                                            {/*    onPress={() => {*/}
                                                            {/*        this.props.navigation.navigate('TripSummaryReport', {userId: ''})*/}
                                                            {/*    }}*/}
                                                            {/*    activeOpacity={0.9}*/}
                                                            {/*    style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgLBrown, {width: Dimensions.get('window').width / 4}]}>*/}
                                                            {/*    {*/}
                                                            {/*        this.state.unVerifiedTripSummaryReportsCount*/}
                                                            {/*            ?*/}
                                                            {/*            <View style={[Styles.HomeScreenCountsPosAb]}>*/}
                                                            {/*                <Text*/}
                                                            {/*                    style={[Styles.f14, Styles.alignCenter, Styles.br15, Styles.bgRed, Styles.cWhite, Styles.ffMbold, Styles.p2, Styles.padH5]}>{this.state.unVerifiedTripSummaryReportsCount}</Text>*/}
                                                            {/*            </View>*/}
                                                            {/*            :*/}
                                                            {/*            null*/}
                                                            {/*    }*/}
                                                            {/*    {*/}
                                                            {/*        this.state.verifiedTripSummaryReportsCount*/}
                                                            {/*            ?*/}
                                                            {/*            <View style={[Styles.HomeScreenLeftCountsPosAb]}>*/}
                                                            {/*                <Text*/}
                                                            {/*                    style={[Styles.f14, Styles.alignCenter, Styles.br15, Styles.bgGrn, Styles.cWhite, Styles.ffMbold, Styles.p2, Styles.padH5]}>{this.state.verifiedTripSummaryReportsCount}</Text>*/}
                                                            {/*            </View>*/}
                                                            {/*            :*/}
                                                            {/*            null*/}
                                                            {/*    }*/}
                                                            {/*    <View style={[Styles.alignCenter, Styles.p5]}>*/}
                                                            {/*        <FontAwesome name="file-text" size={32}*/}
                                                            {/*                     color={"#233167"}/>*/}
                                                            {/*        <Text*/}
                                                            {/*            style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Trip</Text>*/}
                                                            {/*        <Text*/}
                                                            {/*            style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Reports</Text>*/}
                                                            {/*    </View>*/}
                                                            {/*</TouchableOpacity>*/}


                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    this.props.navigation.navigate('PendingUsersScreen')
                                                                }}
                                                                activeOpacity={0.9}
                                                                style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgLVoilet, {width: Dimensions.get('window').width / 4}]}>
                                                                <View style={[Styles.alignCenter, Styles.p5]}>
                                                                    <FontAwesome name="users" size={32}
                                                                                 color={"#233167"}/>
                                                                    <Text
                                                                        style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Pending</Text>
                                                                    <Text
                                                                        style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Users</Text>
                                                                </View>
                                                            </TouchableOpacity>

                                                            {
                                                                loggedInUserDetails.role >= 30 || loggedInUserDetails.role === 27 || loggedInUserDetails.role === 28
                                                                    ?
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            this.props.navigation.navigate('ReimbursementExpenses')
                                                                        }}
                                                                        activeOpacity={0.9}
                                                                        style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgLPink, {width: Dimensions.get('window').width / 4}]}>
                                                                        <View style={[Styles.alignCenter, Styles.p5]}>
                                                                            <FontAwesome name="address-card" size={32}
                                                                                         color={"#233167"}/>
                                                                            <Text
                                                                                style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Add</Text>
                                                                            <Text
                                                                                style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Expenses</Text>
                                                                        </View>
                                                                    </TouchableOpacity>
                                                                    :
                                                                    null
                                                            }

                                                            {
                                                                loggedInUserDetails.role === 19 || loggedInUserDetails.role === 20 || loggedInUserDetails.role === 25 || loggedInUserDetails.role === 26 || loggedInUserDetails.role === 30 || loggedInUserDetails.role === 31|| loggedInUserDetails.role === 28
                                                                // || loggedInUserDetails.role === 45
                                                                    ?
                                                                    <TouchableOpacity
                                                                        onPress={()=>{
                                                                            this.props.navigation.navigate('CreateNonRegisteredAdhocShift')
                                                                        }}
                                                                        activeOpacity={0.9}
                                                                        style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgLPurple, {width: Dimensions.get('window').width / 4}]}>
                                                                        {
                                                                            this.state.adhocShiftsCount
                                                                                ?
                                                                                <View style={[Styles.HomeScreenCountsPosAb]}>
                                                                                    <Text
                                                                                        style={[Styles.f14, Styles.alignCenter, Styles.br15, Styles.bgRed, Styles.cWhite, Styles.ffMbold, Styles.p2, Styles.padH5]}>{this.state.adhocShiftsCount}</Text>
                                                                                </View>
                                                                                :
                                                                                null
                                                                        }
                                                                        <View style={[Styles.alignCenter, Styles.p5]}>
                                                                            <MaterialIcons name="directions-run" size={32} color={"#233167"} />
                                                                            <Text
                                                                                style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Lite</Text>
                                                                            <Text
                                                                                style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>User Shift</Text>
                                                                        </View>
                                                                    </TouchableOpacity>
                                                                    :
                                                                    null
                                                            }

                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    this.props.navigation.navigate('CashClosure')
                                                                }}
                                                                activeOpacity={0.9}
                                                                style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, Styles.bgLightVoilet, {width: Dimensions.get('window').width / 4}]}>
                                                                <View style={[Styles.alignCenter, Styles.p5]}>
                                                                    <FontAwesome name="file-text" size={32}
                                                                                 color={"#233167"}/>
                                                                    <Text
                                                                        style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Cash</Text>
                                                                    <Text
                                                                        style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Closure</Text>
                                                                </View>
                                                            </TouchableOpacity>

                                                            {/*<TouchableOpacity*/}
                                                            {/*    onPress={() => {*/}
                                                            {/*        // this.props.navigation.navigate('TripSummary')*/}
                                                            {/*        this.props.navigation.navigate('socketSetup')*/}
                                                            {/*    }}*/}
                                                            {/*    activeOpacity={0.9}*/}
                                                            {/*    style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10,Styles.bgLGreenWhiteMix, {width: Dimensions.get('window').width / 4}]}>*/}
                                                            {/*    <View style={[Styles.alignCenter, Styles.p5]}>*/}
                                                            {/*        /!*<FontAwesome name="file-text" size={32}*!/*/}
                                                            {/*        /!*             color={"#233167"}/>*!/*/}
                                                            {/*        <MaterialCommunityIcons name="database-plus" size={32} color={"#233167"} />*/}
                                                            {/*        <Text*/}
                                                            {/*            style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>SOCKET</Text>*/}
                                                            {/*    </View>*/}
                                                            {/*</TouchableOpacity>*/}

                                                            {/*<TouchableOpacity*/}
                                                            {/*    onPress={() => {*/}
                                                            {/*        this.props.navigation.navigate('TripSummary')*/}
                                                            {/*    }}*/}
                                                            {/*    activeOpacity={0.9}*/}
                                                            {/*    style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10, {backgroundColor:'#DBD0CC'*/}
                                                            {/*    }, {width: Dimensions.get('window').width / 4}]}>*/}
                                                            {/*    <View style={[Styles.alignCenter, Styles.p5]}>*/}
                                                            {/*        <FontAwesome name="file-text" size={32}*/}
                                                            {/*                     color={"#233167"}/>*/}
                                                            {/*        <Text*/}
                                                            {/*            style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Trip</Text>*/}
                                                            {/*        <Text*/}
                                                            {/*            style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Summary</Text>*/}
                                                            {/*    </View>*/}
                                                            {/*</TouchableOpacity>*/}


                                                            {/*<TouchableOpacity*/}
                                                            {/*    onPress={() => {*/}
                                                            {/*        // this.props.navigation.navigate('TripSummary')*/}
                                                            {/*        this.props.navigation.navigate('HelpDesk')*/}
                                                            {/*    }}*/}
                                                            {/*    activeOpacity={0.9}*/}
                                                            {/*    style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10,Styles.bgLGreenWhiteMix, {width: Dimensions.get('window').width / 4}]}>*/}
                                                            {/*    <View style={[Styles.alignCenter, Styles.p5]}>*/}
                                                            {/*        /!*<FontAwesome name="file-text" size={32}*!/*/}
                                                            {/*        /!*             color={"#233167"}/>*!/*/}
                                                            {/*        <MaterialCommunityIcons name="database-plus" size={32} color={"#233167"} />*/}
                                                            {/*        <Text*/}
                                                            {/*            style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Help</Text>*/}
                                                            {/*        <Text*/}
                                                            {/*            style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>Desk</Text>*/}
                                                            {/*    </View>*/}
                                                            {/*</TouchableOpacity>*/}

                                                        </View>
                                                {/*        :*/}
                                                {/*        null*/}
                                                {/*}*/}

                                            </View>
                                            :
                                            null
                                    }

                                    {/*CurrentShift Container*/}
                                    {
                                        this.state.currentShift === null
                                            ?
                                            <ScrollView
                                                persistentScrollbar={true}>
                                                {
                                                    this.state.otherShifts === null && this.state.currentShift === null && this.state.loggedInUserDetails.role < 26
                                                        ?
                                                        <View
                                                            style={[Styles.m10, Styles.padV20, Styles.br5, Styles.bgBlk, Styles.bcBlk]}>
                                                            <TouchableOpacity onPress={() => {
                                                                this.setState({noShiftModel: true})
                                                            }}
                                                                              style={[Styles.aslCenter]}>
                                                                <CText
                                                                    cStyle={[Styles.f20, Styles.aslCenter, Styles.marH15, Styles.cWhite, Styles.ffMregular]}>No
                                                                    Shifts Assigned Today</CText>
                                                            </TouchableOpacity>
                                                        </View>
                                                        :
                                                        null
                                                }

                                                {
                                                    this.state.otherShifts === null
                                                        ?
                                                        null
                                                        :
                                                        this.state.otherShifts.length
                                                            ?
                                                            <View>
                                                                <CText
                                                                    cStyle={[Styles.f20, Styles.mTop10, Styles.cBlk, Styles.aslStart, Styles.ffMbold]}>Other
                                                                    Shifts({this.state.otherShifts.length})</CText>
                                                                <FlatList
                                                                    style={[]}
                                                                    data={this.state.otherShifts}
                                                                    renderItem={({item}) => this.OtherShiftsList(item)}
                                                                    extraData={this.state}
                                                                    keyExtractor={(item, index) => index.toString()}/>
                                                            </View>
                                                            :
                                                            null
                                                }
                                                {
                                                    this.state.completedShifts === null
                                                        ?
                                                        null
                                                        :
                                                        this.state.completedShifts.length > 0
                                                            ?
                                                            <View>
                                                                <CText
                                                                    cStyle={[Styles.f20, Styles.mTop10, Styles.cBlk, Styles.aslStart, Styles.ffMbold]}>Completed
                                                                    Shifts({this.state.completedShifts.length})</CText>
                                                                <FlatList
                                                                    style={[]}
                                                                    data={this.state.completedShifts}
                                                                    renderItem={({item}) => this.CompletedShiftsList(item)}
                                                                    extraData={this.state}
                                                                    keyExtractor={(item, index) => index.toString()}/>
                                                            </View>
                                                            :
                                                            null
                                                }

                                            </ScrollView>

                                            :
                                            <ScrollView persistentScrollbar={true}>
                                                {/* DATE,ACTUAL AND REPORTING TIME CONDITIONS */}
                                                {
                                                    this.state.currentShift
                                                        ?
                                                        <View
                                                            style={[Styles.bw1, Styles.p10, Styles.bgWhite, {borderColor: '#b5dbf0'}]}>
                                                            <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                {
                                                                    this.state.currentShift === null
                                                                        ?
                                                                        null
                                                                        :
                                                                        // <CText cStyle={[Styles.aslCenter, Styles.ffMbold]}>{new Date(this.state.currentShift.shiftDate).toLocaleDateString()}</CText>
                                                                        <CText cStyle={[Styles.aslCenter, Styles.ffMbold]}>{this.state.currentShift.shiftDateStr}</CText>
                                                                }

                                                                {
                                                                    this.state.currentShift === null
                                                                        ?
                                                                        null
                                                                        :
                                                                        this.state.currentShift.status === 'INIT'
                                                                            ?
                                                                            <CText
                                                                                cStyle={[Styles.aslCenter, Styles.ffMbold]}>Reporting
                                                                                Time-{Services.checkHMformat(this.state.currentShift.startTime.hours, this.state.currentShift.startTime.minutes)}</CText>
                                                                            :
                                                                            this.state.currentShift.status === 'SHIFT_ENDED'
                                                                                ?
                                                                                <CText
                                                                                    cStyle={[Styles.padV3, Styles.aslStart, Styles.ffMregular]}>Shift
                                                                                    Duration:{Services.calculateShiftDuration(this.state.currentShift.reportingTime, this.state.currentShift.actualEndTime)}</CText>
                                                                                :
                                                                                this.state.currentShift.status === 'ATTENDANCE_MARKED'
                                                                                    ?
                                                                                    <CText
                                                                                        cStyle={[Styles.aslCenter, Styles.ffMbold]}>Attd
                                                                                        Marked- {Services.convertTimeStamptoHM(this.state.currentShift.reportingTime)}
                                                                                    </CText>
                                                                                    :
                                                                                    this.state.currentShift.status === 'SHIFT_IN_PROGRESS'
                                                                                        ?
                                                                                        <CText
                                                                                            cStyle={[Styles.aslCenter, Styles.ffMbold]}>Shift
                                                                                            Started
                                                                                            Time- {Services.convertTimeStamptoHM(this.state.currentShift.actualStartTime)}
                                                                                        </CText>
                                                                                        :
                                                                                        null
                                                                }

                                                            </View>
                                                            {/* PADDING FOR CHARTS */}
                                                            {
                                                                this.state.currentShift === null
                                                                    ?
                                                                    null
                                                                    :
                                                                    this.state.currentShift
                                                                        ?
                                                                        Services.getShiftCardDetails(this.state.currentShift)
                                                                        :
                                                                        null
                                                            }
                                                            {/*CURRENT SHIFT STATUS VIEW*/}
                                                            {
                                                                this.state.currentShift.status === 'INIT'
                                                                    ?
                                                                    <View
                                                                        style={[Styles.m10, Styles.padV20, Styles.br5, Styles.bgBlk, Styles.bcBlk]}>
                                                                        <TouchableOpacity
                                                                            onPress={() => {
                                                                                this.props.navigation.navigate('ScanQRcode', {
                                                                                    UserShiftResponse: this.state.currentShift,
                                                                                    allowSkipQRCode: this.state.currentShift.attributes.allowSkipQRCode,
                                                                                    UserFlow: 'NORMAL'
                                                                                })
                                                                            }}
                                                                            style={[Styles.aslCenter, Styles.row]}>
                                                                            <Icon name="fingerprint" size={28}
                                                                                  color="#fff"/>
                                                                            <CText
                                                                                cStyle={[Styles.f18, Styles.aslCenter, Styles.marH10, Styles.cWhite, Styles.ffMregular]}>Mark
                                                                                Attendence
                                                                                ({Services.getUserRolesShortName(this.state.currentShift.userRole)})</CText>
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                    :
                                                                    this.state.currentShift.status === 'SHIFT_ENDED'
                                                                        ?
                                                                        <View>
                                                                            <CText
                                                                                cStyle={[Styles.aslCenter, Styles.cBlk, Styles.ffMregular]}>Shift
                                                                                Started
                                                                                Time- {new Date(this.state.currentShift.actualStartTime).toLocaleTimeString()}</CText>
                                                                            <TouchableOpacity onPress={() => {
                                                                                this.props.navigation.navigate('Summary', {
                                                                                    AttendenceResponse: this.state.currentShift,
                                                                                    SupervisorDetails: this.state.siteSupervisorsInfo
                                                                                })
                                                                            }}
                                                                                              style={[Styles.m10, Styles.padV15, Styles.br5, Styles.bgLYellow, Styles.bcLYellow]}>
                                                                                <View
                                                                                    style={[Styles.aslCenter, Styles.row]}>
                                                                                    <Icon name="done" size={30}
                                                                                          color="#000"/>
                                                                                    <CText
                                                                                        cStyle={[Styles.f20, Styles.aslCenter, Styles.marH15, Styles.ffMregular]}>Shift Ended</CText>
                                                                                </View>
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                        :
                                                                        this.state.currentShift.status === 'ATTENDANCE_MARKED'
                                                                            ?
                                                                            <View
                                                                                style={[Styles.m10, Styles.padV20, Styles.br5, Styles.bgBlk, Styles.bcBlk]}>
                                                                                <TouchableOpacity onPress={() => {
                                                                                    this.props.navigation.navigate('StartShiftScreen', {
                                                                                        CurrentShiftId: this.state.currentShift.shiftId,
                                                                                        currentUserId: this.state.currentShift.userId,
                                                                                        UserFlow: 'NORMAL'
                                                                                    })
                                                                                }}
                                                                                                  style={[Styles.aslCenter, Styles.row]}>
                                                                                    <Icon name="timer" size={30}
                                                                                          color="#fff"/>
                                                                                    <CText
                                                                                        cStyle={[Styles.f20, Styles.aslCenter, Styles.marH15, Styles.cWhite, Styles.ffMregular]}>Start
                                                                                        Shift
                                                                                        ({Services.getUserRolesShortName(this.state.currentShift.userRole)})</CText>
                                                                                </TouchableOpacity>
                                                                            </View>
                                                                            :
                                                                            this.state.currentShift.status === 'SHIFT_IN_PROGRESS'
                                                                                ?
                                                                                <View
                                                                                    style={[Styles.m10, Styles.padV20, Styles.br5, Styles.bgOrangeYellow, Styles.bcOrangeYellow]}>
                                                                                    <TouchableOpacity onPress={() => {
                                                                                        this.props.navigation.navigate('EndShiftScreen', {
                                                                                            CurrentShiftId: this.state.currentShift.shiftId,
                                                                                            currentUserId: this.state.currentShift.userId,
                                                                                            UserFlow: 'NORMAL'
                                                                                        })
                                                                                    }}
                                                                                                      style={[Styles.aslCenter, Styles.row]}>
                                                                                        <Icon name="timer" size={30}
                                                                                              color="#000"/>
                                                                                        <CText
                                                                                            cStyle={[Styles.f20, Styles.aslCenter, Styles.marH15, Styles.cBlk, Styles.ffMregular]}>Shift
                                                                                            in Progress
                                                                                            ({Services.getUserRolesShortName(this.state.currentShift.userRole)}) </CText>
                                                                                    </TouchableOpacity>
                                                                                </View>
                                                                                :
                                                                                null
                                                            }
                                                        </View>
                                                        :
                                                        null
                                                }


                                                {
                                                    this.state.otherShifts === null
                                                        ?
                                                        null
                                                        :
                                                        this.state.otherShifts.length
                                                            ?
                                                            <View>
                                                                <CText
                                                                    cStyle={[Styles.f20, Styles.mTop10, Styles.cBlk, Styles.aslStart, Styles.ffMbold]}>Other
                                                                    Shifts({this.state.otherShifts.length})</CText>
                                                                <FlatList
                                                                    style={[]}
                                                                    data={this.state.otherShifts}
                                                                    renderItem={({item}) => this.OtherShiftsList(item)}
                                                                    extraData={this.state}
                                                                    keyExtractor={(item, index) => index.toString()}/>
                                                            </View>
                                                            :
                                                            null
                                                }
                                                {
                                                    this.state.completedShifts === null
                                                        ?
                                                        null
                                                        :
                                                        this.state.completedShifts.length > 0
                                                            ?
                                                            <View>
                                                                <CText
                                                                    cStyle={[Styles.f20, Styles.mTop10, Styles.cBlk, Styles.aslStart, Styles.ffMbold]}>Completed
                                                                    Shifts({this.state.completedShifts.length})</CText>
                                                                <FlatList
                                                                    style={[]}
                                                                    data={this.state.completedShifts}
                                                                    renderItem={({item}) => this.CompletedShiftsList(item)}
                                                                    extraData={this.state}
                                                                    keyExtractor={(item, index) => index.toString()}/>
                                                            </View>
                                                            :
                                                            null
                                                }


                                                {/*<View>*/}
                                                {/*    {this.UserShifts(this.state.otherShifts)}*/}
                                                {/*</View>*/}

                                            </ScrollView>

                                    }
                                </View>


                            </View>
                        </ScrollView>
                        :
                        <CSpinner/>

                }

                {/*MODAL START*/}

                {/*MODAL FOR SUCCESS*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.successModal}
                    onRequestClose={() => {
                        this.setState({successModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({successModal: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            this.setState({successModal: false})
                        }}
                                          style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br15, {width: Dimensions.get('window').width - 100}]}>
                            <Card.Content style={[Styles.aslCenter, Styles.p5, Styles.pBtm18]}>
                                {LoadSVG.success_Icon}
                                <Title
                                    style={[Styles.colorGreen, Styles.f20, Styles.ffMbold, Styles.aslCenter]}>Woohoo!</Title>
                            </Card.Content>
                            <Card.Content style={[Styles.aslCenter, Styles.p5, Styles.pBtm18, Styles.aslCenter]}>
                                <Title
                                    style={[Styles.colorBlue, Styles.f20, Styles.ffMbold]}>Shift
                                    switched successfully</Title>
                            </Card.Content>
                        </TouchableOpacity>
                    </View>
                </Modal>


                {/*MODAL FOR PRIMARY SITE SUPERVISOR LIST VIEW*/}
                <SupervisorsModal visible={this.state.primarySiteSupervisorsModal}
                                  closeModal={() => this.setState({primarySiteSupervisorsModal: false})}
                                  children={this.state.primarySiteSupervisorsInfo}/>


                {/*MODAL FOR Training Progress*/}
                {/*<Modal*/}
                {/*    transparent={true}*/}
                {/*    visible={this.state.trainingProgressModal}*/}
                {/*    onRequestClose={() => {*/}
                {/*        this.setState({trainingProgressModal: false})*/}
                {/*    }}>*/}
                {/*    <View style={[Styles.bottomModalBg]}>*/}
                {/*        <TouchableOpacity onPress={() => {*/}
                {/*            this.setState({trainingProgressModal: false})*/}
                {/*        }} style={[Styles.modalbgPosition]}>*/}
                {/*        </TouchableOpacity>*/}
                {/*        <View*/}
                {/*            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br30, Styles.mBtm20, {width: Dimensions.get('window').width - 60}]}>*/}
                {/*            <View style={[Styles.aslCenter, Styles.p5, Styles.pBtm18]}>*/}
                {/*                <FastImage source={LoadImages.training}*/}
                {/*                           style={[Styles.aslCenter, Styles.padH30, {height: 88, width: 88}]}/>*/}
                {/*                <Title*/}
                {/*                    style={[Styles.cBlk, Styles.f18, Styles.ffMbold, Styles.aslCenter]}>Training*/}
                {/*                    Progress</Title>*/}
                {/*            </View>*/}
                {/*            {this.state.trainingProgressList.map(item => {*/}
                {/*                return (*/}
                {/*                    <View*/}
                {/*                        key={item.name}*/}
                {/*                        style={[Styles.p15, Styles.br5,*/}
                {/*                            item.status === true ? {backgroundColor: '#cdf9da'} : {backgroundColor: '#f9d8d9'},*/}
                {/*                            Styles.m10, Styles.marH30]}>*/}
                {/*                        <View*/}
                {/*                            style={[Styles.row]}>{item.status ? LoadSVG.trainingEnable : LoadSVG.trainingDisable}<CText*/}
                {/*                            cStyle={[Styles.ffMbold, Styles.aslCenter, Styles.f16, {marginLeft: 20}, item.status === true ? {color: '#408821'} : {color: '#000'},]}>{item.name}</CText></View>*/}
                {/*                    </View>*/}
                {/*                );*/}
                {/*            })}*/}
                {/*            <TouchableOpacity style={[Styles.marV30]} onPress={() => {*/}
                {/*                this.setState({trainingProgressModal: false})*/}
                {/*            }}>*/}
                {/*                <View*/}
                {/*                    style={[Styles.p15, Styles.br5, Styles.marH30, {backgroundColor: '#f5f5f5'}]}>*/}
                {/*                    <Text style={[Styles.ffMregular, Styles.f16, {textAlign: 'center'}]}>tap to*/}
                {/*                        dismiss</Text>*/}
                {/*                </View>*/}
                {/*            </TouchableOpacity>*/}
                {/*        </View>*/}

                {/*    </View>*/}

                {/*</Modal>*/}

                {/*MODAL for UsershiftsList pop-up*/}
                <Modal
                    transparent={true}
                    visible={this.state.ModalUserShiftList}
                    onRequestClose={() => {
                    }}>
                    {/*!// onRequestClose={() => { this.setState({ ModalUserShiftList: false }) }}>*/}
                    <View style={[Styles.aitCenter, Styles.jCenter, {
                        backgroundColor: 'rgba(0, 0, 0 ,0.7)',
                        top: 0,
                        bottom: 0,
                        flex: 1
                    }]}>
                        <View style={[Styles.bw1, Styles.bgLGrey, Styles.aslCenter, Styles.br10, {
                            height: Dimensions.get('window').height / 2,
                            width: Dimensions.get('window').width - 80
                        }]}>
                            {
                                this.state.otherShifts === null
                                    ?
                                    null
                                    :
                                    this.state.otherShifts.length
                                        ?
                                        <CText
                                            cStyle={[Styles.f20, Styles.m10, Styles.cRed, Styles.aslCenter, Styles.marH40, Styles.ffMbold]}>Shifts
                                            Available ({this.state.otherShifts.length})</CText>
                                        :
                                        null
                            }

                            <FlatList
                                style={[Styles.aslCenter]}
                                data={this.state.otherShifts}
                                renderItem={({item}) => this.UserShiftsList(item)}
                                extraData={this.state}
                                keyExtractor={(item, index) => index.toString()}/>
                        </View>
                    </View>
                </Modal>

                {/*MODAL for no shift asssigned can call to superviosr*/}
                <Modal
                    transparent={true}
                    visible={this.state.noShiftModel}
                    onRequestClose={() => {
                        this.setState({noShiftModel: false})
                    }}>
                    <View style={[Styles.aitCenter, Styles.jCenter, {
                        backgroundColor: 'rgba(0, 0, 0 ,0.7)',
                        top: 0, bottom: 0, flex: 1
                    }]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({noShiftModel: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <View
                            style={[Styles.bgLGrey, Styles.br5, Styles.ffMregular, {width: Dimensions.get('window').width - 60}]}>

                            <Card style={[Styles.marV1, {paddingHorizontal: 10}]} theme={theme}>

                                <Card.Title
                                    theme={theme}
                                    titleStyle={[Styles.bgWhite, Styles.ffMbold, Styles.f20, Styles.marV5]}
                                    title="No Shifts found"
                                    right={() => <IconButton onPress={() => {
                                        this.setState({noShiftModel: false}, () => {
                                            this.TokenVerification()
                                        })
                                    }} icon="autorenew" color={'#397af9'} size={30}/>}
                                />
                                <Card.Content><Title style={{fontSize: 16, lineHeight: 22, paddingBottom: 20}}>Contact
                                    your Site
                                    Supervisor(s) to let them know your
                                    availability.</Title></Card.Content>

                                <View style={[Styles.p5]}>
                                    {
                                        this.state.siteSupervisorsInfo ?
                                            this.state.siteSupervisorsInfo.length === 0
                                                ?
                                                <Card.Title theme={theme}
                                                            style={[Styles.bgWhite, Styles.ffMregular]}
                                                            title="No Site Administrator Found"
                                                />
                                                :
                                                <ScrollView
                                                    persistentScrollbar={true}
                                                    style={[{height: this.state.siteSupervisorsInfo.length === 1 ? 80 : this.state.siteSupervisorsInfo.length === 2 ? 160 : this.state.siteSupervisorsInfo.length === 3 ? 240 : Dimensions.get('window').width / 1.3}]}>
                                                    <FlatList
                                                        data={this.state.siteSupervisorsInfo}
                                                        renderItem={({item}) => Services.getSupervisorList(item)}
                                                        extraData={this.state}
                                                        keyExtractor={(item, index) => index.toString()}/>
                                                </ScrollView>
                                            : null
                                    }
                                    <CDismissButton onPress={() => {
                                        this.setState({noShiftModel: false})
                                    }} showButton={'dismiss'}/>
                                </View>
                            </Card>

                        </View>
                    </View>
                </Modal>

                {/*modal for terms and conditions*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.termsAndConditionsModal}
                    onRequestClose={() => {
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.p15, {
                                width: Dimensions.get('window').width - 40,
                                height: Dimensions.get('window').height - 150
                            }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <View style={[Styles.aslCenter, Styles.p5, Styles.flex1]}>
                                <View style={[Styles.aslCenter, Styles.marV5]}>
                                    <Text
                                        style={[Styles.ffMregular]}>Name: {this.state.loggedInUserDetails.fullName}</Text>
                                    <Text style={[Styles.ffMregular]}>Phone
                                        Number: {this.state.loggedInUserDetails.phoneNumber}</Text>
                                    {
                                        this.state.loggedInUserDetails.aadharCardNumber
                                            ?
                                            <Text style={[Styles.ffMregular]}>Aadhar
                                                Number: {this.state.loggedInUserDetails.aadharCardNumber}</Text>
                                            :
                                            <Text style={[Styles.ffMregular]}>Aadhar Number: NA</Text>
                                    }

                                    <Text
                                        style={[Styles.ffMregular]}>Role: {Services.getUserRoles(this.state.loggedInUserDetails.role)}</Text>
                                    <ScrollView
                                        persistentScrollbar={true}
                                        style={[Styles.mTop15]}>
                                        {Services.agreementData()}
                                    </ScrollView>
                                    <View style={[Styles.row, Styles.aslCenter, {marginVertical: 10}]}>
                                        <Text style={[Styles.ffMregular]}>I accept to the </Text>
                                        <TouchableOpacity
                                            onPress={() => Linking.openURL(`https://docs.google.com/document/d/e/2PACX-1vQOmqz0IMPq5e4b5Nv36CXcaDuqWLym8kOpLIHvm45H4o7XV4A0OxYO96I-C2knR4TI4AUFJp_MXSdD/pub`)}><Text
                                            style={[{
                                                color: 'red',
                                                borderBottomColor: 'red',
                                                borderBottomWidth: 1
                                            }, Styles.ffMregular]}>terms of service</Text></TouchableOpacity>
                                    </View>
                                    <View style={[Styles.aslCenter, Styles.mTop10]}>
                                        <FAB
                                            style={{backgroundColor: '#000'}}
                                            icon="check"
                                            // onPress={() => this.acceptTandC()}
                                            onPress={() => this.setState({SignatureModal: true})}
                                            color='red'
                                        />
                                    </View>
                                </View>


                            </View>
                        </View>
                    </View>
                </Modal>

                {/*modal for Taking Signature*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.SignatureModal}
                    onRequestClose={() => {
                        // this.setState({SignatureModal:false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View style={[Styles.bgWhite]}>
                            <Text
                                style={[Styles.aslCenter, Styles.ffMbold, Styles.f18, Styles.colorBlue, Styles.padV5]}>Please
                                Sign
                                Below</Text>

                            <View style={[Styles.bgLGreen, Styles.bw3, Styles.bcBlk, {
                                margin: 5,
                            }]}>
                                <SignatureCapture
                                    style={[{
                                        width: Dimensions.get('window').width - 40,
                                        height: Dimensions.get('window').height - 150
                                    },
                                        Styles.aslCenter]}
                                    ref="sign"
                                    square={true}
                                    showBorder={true}
                                    backgroundColor={'#f1e9c2'}
                                    onSaveEvent={this._onSaveEvent}
                                    onDragEvent={this._onDragEvent}
                                    saveImageFileInExtStorage={false}
                                    showNativeButtons={false}
                                    showTitleLabel={false}
                                    viewMode={"portrait"}
                                    minStrokeWidth={5}
                                    maxStrokeWidth={5}
                                />
                            </View>

                            <View style={[Styles.row]}>
                                <TouchableOpacity style={Styles.signaturebuttonStyle}
                                                  onPress={() => {
                                                      this.saveSign()
                                                  }}>
                                    <Text>Save</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={Styles.signaturebuttonStyle}
                                                  onPress={() => {
                                                      this.resetSign()
                                                  }}>
                                    <Text>Clear</Text>
                                </TouchableOpacity>
                                <TouchableHighlight style={Styles.signaturebuttonStyle}
                                                    onPress={() => {
                                                        this.setState({SignatureModal: false, signatureDragged: false})
                                                    }}>
                                    <Text>Cancel</Text>
                                </TouchableHighlight>

                            </View>

                        </View>

                    </View>
                </Modal>


                {/*MODALS END*/}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: "white"
    },
    container: {
        marginTop: 10
    },
    surface: {
        padding: 4,
        alignItems: "center",
        justifyContent: "center",
        elevation: 1
    },

    row: {
        marginLeft: 10,
        marginTop: 2,
        marginRight: 10
    },

    signature: {
        flex: 1,
        borderColor: '#000033',
        borderWidth: 1,
    },
    buttonStyle: {
        flex: 1, justifyContent: "center", alignItems: "center", height: 50,
        backgroundColor: "#eeeeee",
        margin: 10
    }

});


