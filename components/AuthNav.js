import React, {Component} from 'react';
import {
    View,
    Image,
    Dimensions,
    Modal,
    Linking,
    Text,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import Utils from './common/Utils';
import Config from "./common/Config";
import {CText, LoadImages, LoadSVG, Styles} from "./common";
import {Button, Card} from "react-native-paper";
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import AsyncStorage from '@react-native-community/async-storage';
import axios from "axios";
import OneSignal from "react-native-onesignal";
import {withNavigation} from 'react-navigation';
import Services from "./common/Services";
import DeviceInfo from 'react-native-device-info';
import FastImage from "react-native-fast-image";


const appVersionNumber = Config.routes.APP_VERSION_NUMBER;

class AuthNav extends Component {

    constructor(properties) {
        super(properties);
        this.notificationListener();
        this.state = {
            InvalidVersionModal: false,criticalUpdate:false,
            updateVersionNumber:appVersionNumber,
        }
    }

    notificationListener() {
        // OneSignal.setLogLevel(10, 0);
        OneSignal.init("29be598f-9bce-43f7-a0e6-7df2ee66fcf6"); //YOUR_ONESIGNAL_APPID
        OneSignal.addEventListener('received', this.onReceived);
        OneSignal.addEventListener('opened', this.onOpened.bind(this));
        OneSignal.addEventListener('ids', this.onIds);
        OneSignal.enableSound(true);
        // OneSignal.inFocusDisplaying(2); //0-none,1-Alert in Screen,2-Notification in background
        OneSignal.enableVibrate(true);
    }

    componentDidMount() {
        // this.checkSession();
        OneSignal.addEventListener('received', this.onReceived);
        OneSignal.addEventListener('opened', this.onOpened.bind(this));
        OneSignal.addEventListener('ids', this.onIds)
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            // this.checkAppVersion();
            this.checkAppUpdate();
        });
    }

    componentWillUnmount() {
        OneSignal.removeEventListener('received', this.onReceived);
        OneSignal.removeEventListener('opened', this.onOpened.bind(this));
        OneSignal.removeEventListener('ids', this.onIds);
    }

    onReceived(notification) {
        // console.log("Notification received AUTHNAV: ", notification);
    }

    onOpened(openResult) {
        // console.log('Message: ', openResult.notification.payload.body);
        // console.log('Data: ', openResult.notification.payload.additionalData);
        // console.log('isActive: ', openResult.notification.isAppInFocus);
        // console.log('AUTH NAV openResult: ', openResult);
        let url = '' ;
        let data = openResult.notification.payload.body;
        if (openResult.notification.payload.launchURL) {
            url = openResult.notification.payload.launchURL;
        } else {
            if (openResult.notification.payload.additionalData) {
                url = openResult.notification.payload.additionalData.url;
            } else {
                url = ''
            }
        }
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
                // if (openResult.notification.payload.launchURL) {
                //     if (openResult.notification.payload.bigPicture) {
                //         notificationImage = openResult.notification.payload.bigPicture
                //     } else {
                //         notificationImage = ''
                //     }
                // } else if (openResult.notification.payload.bigPicture) {
                //     if (openResult.notification.payload.bigPicture) {
                //         notificationImage = openResult.notification.payload.bigPicture
                //     } else {
                //         notificationImage = ''
                //     }
                if (openResult.notification.payload.launchURL) {
                    if (openResult.notification.payload.bigPicture) {
                        if (openResult.notification.payload.additionalData){
                            if (openResult.notification.payload.additionalData.ntfnVerticalImageUrl){
                                notificationImage = openResult.notification.payload.additionalData.ntfnVerticalImageUrl
                            }else {
                                notificationImage = openResult.notification.payload.bigPicture
                            }
                        }else {
                            notificationImage = openResult.notification.payload.bigPicture
                        }
                    } else {
                        notificationImage = ''
                    }
                } else if (openResult.notification.payload.bigPicture) {
                    if (openResult.notification.payload.additionalData){
                        if (openResult.notification.payload.additionalData.ntfnVerticalImageUrl){
                            notificationImage = openResult.notification.payload.additionalData.ntfnVerticalImageUrl
                        }else {
                            notificationImage = openResult.notification.payload.bigPicture
                        }
                    }else {
                        notificationImage = openResult.notification.payload.bigPicture
                    }
                }else if (openResult.notification.payload.additionalData) {
                    if (openResult.notification.payload.additionalData.type) {
                        if (openResult.notification.payload.additionalData.type === "SHIFT_ATTENDANCE_NOTIFICATION"){
                            let sampleData = {}
                            const tempData = openResult.notification.payload.additionalData
                            sampleData.activity = openResult.notification.payload.body ? openResult.notification.payload.body :'';
                            sampleData.shiftId = tempData.shiftId ? tempData.shiftId :'';
                            sampleData.type = tempData.type ? tempData.type :'';
                            sampleData.url = tempData.url ?tempData.url : '';
                            sampleData.role = tempData.role ? tempData.role :'';

                            // console.log('authNav sampleData',sampleData);
                            // notificationImage = openResult.notification.payload.additionalData.type
                            notificationImage = tempData.type
                            notificationData = sampleData
                        }else {
                            notificationImage = ''
                        }
                    } else {
                        notificationImage = ''
                    }
                } else {
                    notificationImage = ''
                }
                // console.log('authNav notificationImage', notificationImage);
                // console.log('authNav notificationData', notificationData);
                navigate('Notifications', {notificationImage: notificationImage,notificationData:notificationData})

                // navigate('Notifications')
            }
        } else {
            navigate('authNavigator')
        }
    }

    onIds(device) {
        // console.warn('AuthNav id===',device.userId);
        if (device.userId) {
            Utils.setToken('DEVICE_ID', device.userId, function () {
            });
        }
    }


    //Will hit during launch(if no device id is present)
    // installationId(DEVICE_ID) {
    UpdateMobileDetails() {
        const apiURL = Config.routes.BASE_URL + Config.routes.UPDATE_MOBILE_DETAILS;
        // console.log('Update MobileDetails DeviceInfo',DeviceInfo)
         const body = JSON.stringify({
            // DEVICE_ID: DEVICE_ID,
            brand: DeviceInfo.getBrand(),
            modal: DeviceInfo.getModel(),
            type: DeviceInfo.getSystemName(),
             getDeviceId: DeviceInfo.getDeviceId()
        });
        // console.log('Update MobileDetails body',body)
        Services.AuthHTTPRequest(apiURL, 'PUT', body, function (response) {
            if (response) {
                // console.log(" Update MobileDetails response 200", response);
            }
        }, function (error) {
            console.log(" Update MobileDetails error", error);
        });
    }

    async removeToken() {
        try {
            await AsyncStorage.removeItem("Whizzard:token");
            await AsyncStorage.removeItem("Whizzard:userId");
            this.props.navigation.navigate('Login');
            return true;
        } catch (exception) {
            return false;
        }
    }

    checkAppUpdate() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.APP_UPDATE_NUMBER_WITHOUT_TOKEN;
        console.log('check App update start');
        axios(apiURL, {
            method: 'GET',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            data:{}
        }).then(function (response) {
            // console.log('check App update response');
            if (response.status === 200) {
                let responseData = response.data;
                // requireMockLocationCheck
                //criticalUpdate
                console.log('check App update response',responseData);
                Utils.setToken('requireMockLocationCheck',JSON.stringify(responseData.requireMockLocationCheck), function () {
                // Utils.setToken('requireMockLocationCheck','false', function () {
                });
                if (responseData.appVersion !== appVersionNumber) {
                    self.setState({InvalidVersionModal: true,criticalUpdate:responseData.criticalUpdate,updateVersionNumber:responseData.appVersion})
                } else {
                    self.checkSession();
                }
            }
        }).catch(function (error) {
            console.log('check App update error', error, error.response);
            if (error.response) {
                if (error.response.status === 403) {
                    Utils.dialogBox("Token Expired,Please Login Again", '');
                    self.props.navigation.navigate('Login');
                } else {
                    Utils.setToken('Error_Message', error.response.data.message, function () {
                    });
                    self.props.navigation.navigate('ErrorsList');
                }
            } else {
                Utils.setToken('Error_Message last', error.message, function () {
                });
                self.props.navigation.navigate('ErrorsList');
            }
        })
    }

    checkSession() {
        // this.getItem().then((accessToken) => {
        //     if (accessToken) {
        //         this.getUserStatus(accessToken)
        //         // this.UpdateMobileDetails()
        //     } else {
        //         this.props.navigation.navigate('Login');
        //     }
        // });

        AsyncStorage.getItem('Whizzard:token').then((accessToken) => {
            // console.log('AUTH start token',accessToken);
            if (accessToken) {
                AsyncStorage.getItem('Whizzard:userStatus').then((userStatus) => {
                    // console.log('AUTHNAV inside userStatus',userStatus)
                    //ACTIVATED

                    if (userStatus === 'ACTIVATION_PENDING' || userStatus === 'USER_PROFILE_PENDING') {
                        this.props.navigation.navigate('ProfileStatusScreen');
                    }else if (userStatus === 'REJECTED' || userStatus === 'DISABLED') {
                        AsyncStorage.clear();
                        this.props.navigation.navigate('RejectedUsers');
                    } else {
                        this.props.navigation.navigate('AppNav');
                    }
                })
            }else {
                this.props.navigation.navigate('Login');
            }
        })
    }

    getUserStatus(accessToken) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.USER_STATUS_AND_APP_VERSION;
        const body = '';
        axios(apiUrl, {
            method: 'GET',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": accessToken
            },
            data: body
        }).then(function (response) {
            if (response.status === 200) {
                 // console.log('AUTHNAV getUser Status success', response.data)
                const data = response.data;
                Utils.setToken('userStatus', data.status, function () {
                });
                Utils.setToken('userRole', JSON.stringify(response.data.role), function () {
                });
                Utils.setToken('profilePicUrl', response.data.profilePicUrl, function () {
                });
                Utils.setToken('userId', response.data.userId, function () {
                });
                if (data.status === 'ACTIVATION_PENDING' || data.status === 'USER_PROFILE_PENDING') {
                    self.props.navigation.navigate('ProfileStatusScreen', {pendingFields: data.errors.missingFields});
                }else if (data.status === 'REJECTED' || data.status === 'DISABLED') {
                    AsyncStorage.clear();
                    self.props.navigation.navigate('RejectedUsers');
                } else {
                    self.props.navigation.navigate('AppNav');
                }
            }
        }).catch(function (error) {
            // console.log('getUser Status error', error, error.response);
            if (error.response) {
                if (error.response.status === 403) {
                    Utils.dialogBox("Token Expired,Please Login Again", '');
                    self.props.navigation.navigate('Login');
                } else {
                    Utils.setToken('Error_Message', error.response.data.message, function () {
                    });
                    self.props.navigation.navigate('ErrorsList');
                }
            } else {
                Utils.setToken('Error_Message last', error.message, function () {
                });
                self.props.navigation.navigate('ErrorsList');
            }
        })
    }


    async getItem() {
        return await AsyncStorage.getItem('Whizzard:token');
    }

    async getDeviceId() {
        return await AsyncStorage.getItem('Whizzard:DEVICE_ID');
    }


    render() {
        const {criticalUpdate} = this.state
        return (
            <View style={[Styles.flex1, Styles.alignCenter,]}>
                <Image source={LoadImages.splash_screen}
                       style={{height: Dimensions.get('window').height, width: Dimensions.get('window').width}}/>
                <View style={[Styles.alignCenter, {position: 'absolute'}]}>
                    {LoadSVG.splash_icon}
                    <Text style={[Styles.f18, Styles.cWhite, Styles.ffMbold, Styles.mTop30, Styles.mBtm10]}>Welcome
                        to</Text>
                    {LoadSVG.splash_logo}
                    <View style={[Styles.mTop10,Styles.row]}>
                        <Text style={[Styles.ffMextrabold,Styles.f28,Styles.cWhite]}>MAHINDRA </Text>
                        <Text style={[Styles.ffMbold,Styles.f28,Styles.cAsh]}>Logistics</Text>
                    </View>

                    {/* MODAL FOR Invalid VERSION Details ALERT */}
                    <Modal
                        transparent={true}
                        visible={this.state.InvalidVersionModal}
                        onRequestClose={() => { }}>
                        <View style={[Styles.aitCenter, Styles.jCenter, {
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            top: 0,
                            bottom: 0,
                            flex: 1
                        }]}>
                            <View
                                style={[Styles.bw1, Styles.bgLGrey, Styles.aslCenter, Styles.br10, {width: Dimensions.get('window').width - 70}]}>

                                <Card>
                                    <Card.Content>
                                        <View style={[Styles.aslCenter, Styles.p5]}>
                                            {/*<MaterialIcons*/}
                                            {/*    style={[Styles.aslCenter, {paddingRight: 10}]}*/}
                                            {/*    name="cancel" size={50} color="red"/> */}
                                            <FastImage source={LoadImages.Loader}
                                                       style={[Styles.img50,Styles.aslCenter]}/>
                                            <CText
                                                cStyle={[Styles.cBlk, Styles.aslCenter, Styles.f18,Styles.ffMbold]}>Please
                                                Update Application to the latest Version</CText>
                                        </View>
                                        <View>
                                            <Button
                                                style={[Styles.aslCenter, Styles.bgBlue, Styles.padH25, Styles.marV10]}
                                                mode="contained" onPress={() => {
                                                this.setState({InvalidVersionModal: true,}, () => {
                                                    Linking.openURL('https://play.google.com/store/apps/details?id=com.whizzard&hl=en')
                                                })
                                            }}>
                                                {/*UPDATE  v{Config.routes.APP_VERSION_NUMBER}*/}
                                                UPDATE  v{this.state.updateVersionNumber}
                                            </Button>
                                        </View>
                                        {
                                            !criticalUpdate
                                            ?
                                        <View>
                                            <Button
                                                style={[Styles.aslCenter, Styles.padH25, Styles.mBtm10]}
                                                mode="text" onPress={() => {
                                                this.setState({InvalidVersionModal: false,}, () => {
                                                   this.checkSession()
                                                })
                                            }}>
                                                Later
                                            </Button>
                                        </View>
                                            :
                                            null
                                        }
                                    </Card.Content>
                                </Card>
                            </View>
                        </View>
                    </Modal>


                </View>
            </View>
        )
    }
}

export default withNavigation(AuthNav);
