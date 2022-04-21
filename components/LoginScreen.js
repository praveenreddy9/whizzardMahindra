import React, {Component} from 'react';
import {
    StyleSheet,
    Text,
    View,
    KeyboardAvoidingView,
    ScrollView,
    TouchableOpacity,
    Keyboard,
    NativeModules, PermissionsAndroid, Alert,Image
} from 'react-native';
import Utils from './common/Utils';
import Config from './common/Config';
import {CheckBox} from 'react-native-elements';
import {Styles, CSpinner, LoadSVG,LoadImages} from './common'
import AsyncStorage from '@react-native-community/async-storage';
import Services from "./common/Services";
import OfflineNotice from './common/OfflineNotice';
import {TextInput, DefaultTheme} from "react-native-paper";
import OneSignal from "react-native-onesignal";
import Geolocation from "react-native-geolocation-service";
import MockLocationCheck from "./common/MockLocationCheck";
let LocationService = NativeModules.LocationService; //LOCATIONS SERIVCES CALL


const theme = {
    ...DefaultTheme,
    fonts: {
        ...DefaultTheme.fonts,
        regular: 'Muli-Regular',
    },
    colors: {
        ...DefaultTheme.colors,
        text: '#233167',
        primary: '#233167', underlineColor: 'transparent'
    }
};


export default class LoginScreen extends Component {

    constructor() {
        super();
        this.showAlertofLocation()
        this.handleLocalStorage()
        // this.stopLocation();
        // this.requestLocationPermission();
        this.notificationListener();
        this.keyboardWillShow = this.keyboardWillShow.bind(this);
        this.keyboardWillHide = this.keyboardWillHide.bind(this);
        this.state = {
            phoneNumber: "",
            password: "",
            rememberMe: true,
            token: '',
            spinnerBool: false,
            KeyboardVisible: true,
            ErrorMessage: '',
            isValidMobileNumber: null,
            isValidPassword: null,
            errorPassMessage: null,
            errorMobileMessage: null,
            showLogin: false,showPassword:false
        };
    };

    notificationListener() {
        OneSignal.init("29be598f-9bce-43f7-a0e6-7df2ee66fcf6"); //YOUR_ONESIGNAL_APPID
        OneSignal.addEventListener('received', this.onReceived);
        OneSignal.addEventListener('opened', this.onOpened.bind(this));
        OneSignal.addEventListener('ids', this.onIds);
        OneSignal.enableSound(true);
        OneSignal.inFocusDisplaying(2); //0-none,1-Alert in Screen,2-Notification in background
        OneSignal.enableVibrate(true);
    }

    //STOP LOCATION
    async stopLocation() {
         await LocationService.stopLocation((err) => {
            // console.log('inside stopLocation', err)
        }, (msg) => {
            // console.log('outside stopLocation', msg)
            // Utils.setToken('locationStatus', JSON.stringify(msg), function () {
            // });
        });
    }


    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }


    async componentDidMount() {
        OneSignal.addEventListener('received', this.onReceived);
        OneSignal.addEventListener('opened', this.onOpened.bind(this));
        OneSignal.addEventListener('ids', this.onIds);
        this.getCache();
        this.keyboardWillShowSub = Keyboard.addListener('keyboardDidShow', this.keyboardWillShow)
        this.keyboardWillHideSub = Keyboard.addListener('keyboardDidHide', this.keyboardWillHide)
    }

    componentWillUnmount() {
        OneSignal.removeEventListener('received', this.onReceived);
        OneSignal.removeEventListener('opened', this.onOpened.bind(this));
        OneSignal.removeEventListener('ids', this.onIds);
        this.keyboardWillShowSub.remove();
        this.keyboardWillHideSub.remove();
    }

    onReceived(notification) {
        // console.log("Notification received LOGIN: ", notification);
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
                if (openResult.notification.payload.launchURL) {
                    if (openResult.notification.payload.bigPicture) {
                        notificationImage = openResult.notification.payload.bigPicture
                    } else {
                        notificationImage = ''
                    }
                } else if (openResult.notification.payload.bigPicture) {
                    if (openResult.notification.payload.bigPicture) {
                        notificationImage = openResult.notification.payload.bigPicture
                    } else {
                        notificationImage = ''
                    }
                } else {
                    notificationImage = ''
                }
                navigate('Notifications', {notificationImage: notificationImage})
            }
        } else {
            navigate('authNavigator')
        }
    }

    onIds(device) {
        if (device.userId) {
            Utils.setToken('DEVICE_ID', device.userId, function () {
            });
        }
    }

    keyboardWillShow = event => {
        this.setState({
            KeyboardVisible: false
        })
    };

    keyboardWillHide = event => {
        this.setState({
            KeyboardVisible: true
        })
    };

    async requestLocationPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
             if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                this.requestCurrentLocation()
            } else {
                Utils.dialogBox('Location permission denied', '');
                this.stopLocation()
                Services.deniedLocationAlert()
            }
        } catch (err) {
            console.warn(err);
            Utils.dialogBox(err, '')
        }
    }

    async requestCurrentLocation(){
        Geolocation.getCurrentPosition(
            (position) => {
                const currentLocation = position.coords;
                // console.log('login currentLocation==>',currentLocation.latitude,currentLocation.longitude);
                this.setState({
                    currentLocation: currentLocation,
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                });
            },
            (error) => {
                // console.log(error.code, error.message);
                    Utils.dialogBox(error.message, '')
            },
            // {enableHighAccuracy: false, timeout: 10000, maximumAge: 100000}
            // {enableHighAccuracy: true, timeout: 25000, maximumAge: 3600000}
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );
    }

    async showAlertofLocation() {
        Alert.alert(Services.returnLocationTitle(), Services.returnLocationMessage(),
            [{
                text: 'OK', onPress: () => {
                    this.requestLocationPermission()
                }
            }]
        )
    }

    async handleLocalStorage() {
        this.stopLocation()
        try {
            await AsyncStorage.removeItem("Whizzard:token");
            await AsyncStorage.removeItem("Whizzard:userId");
            await AsyncStorage.removeItem("Whizzard:shiftId");
            await AsyncStorage.removeItem("Whizzard:currentShiftStatus");
            await AsyncStorage.removeItem("Whizzard:locationStatus");
            await AsyncStorage.removeItem("Whizzard:userRole");
            await AsyncStorage.removeItem("Whizzard:userStatus");   //===>for canEditTextput check in profile
            await AsyncStorage.removeItem("Whizzard:selectedUserSiteDetails");   //===>TeamListing
            await AsyncStorage.removeItem("Whizzard:selectedSiteDetails"); //===>sitelisting
            await AsyncStorage.removeItem("Whizzard:profilePicUrl");       //===>profilePicUrl Authnav
            // this.props.navigation.navigate('authNavigator');
            // this.props.navigation.navigate('Login')
            return true;
        } catch (exception) {
            return false;
        }
    }

    onChangeCheck() {
        const self = this;
         if (self.state.rememberMe === true) {
            let userDetails = {
                'rememberphoneNumber': self.state.phoneNumber,
                'rememberPassword': self.state.password
            };
            Utils.setToken('loginDetails', JSON.stringify(userDetails), function (data) {
            });
        } else {
            AsyncStorage.removeItem('Whizzard:loginDetails');
        }
    }

    async getCache() {
        try {
            let value = await AsyncStorage.getItem('Whizzard:loginDetails');
            let parsed = JSON.parse(value);
            this.setState({phoneNumber: parsed.rememberphoneNumber, password: parsed.rememberPassword})
            if (this.state.phoneNumber || this.state.password) {
                this.onLogin();
            }
        } catch (e) {
             console.log("caught error", e);
            // Handle exceptions
        }
    }

    httpLoginRequest = () => {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.POST_LOGIN;
        const body = JSON.stringify({
            phoneNumber: self.state.phoneNumber,
            password: self.state.password,
            longitude: this.state.longitude,
            latitude: this.state.latitude});
        // console.log('login body',body,apiUrl);
        this.setState({spinnerBool: true}, (response) => {
            Services.NoAuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response) {
                    let result = response.data;
                    // console.log('login sucess resp',result);
                    let token = result.accessToken;
                    let tokenType = result.tokenType;
                    let accessToken = tokenType + " " + token;
                    if (!self.state.rememberMe) {
                        self.setState({phoneNumber: '', password: ''});
                    }
                    // console.log('login accessToken',accessToken);
                    Utils.setToken('token', accessToken, function () {
                    });
                    Utils.setToken('userStatus', result.status, function () {
                    });
                    Utils.setToken('userRole', JSON.stringify(result.role), function () {
                    });
                    Utils.setToken('profilePicUrl', result.profilePicUrl, function () {
                    });
                    Utils.setToken('userId', result.id, function () {
                    });

                    if (result.role <= 15 && result.status === "ACTIVATED"){
                        if (result.lastLogIn=== null){
                            self.setState({spinnerBool: false}, () => {
                                Utils.dialogBox("Reset your Password", '');
                                self.props.navigation.navigate('ResetPassword',{
                                    phoneNumber: result.id,
                                    code: 'FirstLogin'
                                });
                            })
                        }else {
                            self.setState({spinnerBool: false}, () => {
                                Utils.dialogBox("Successfully LoggedIn", '');
                                self.props.navigation.navigate('authNavigator');
                            })
                        }
                    }else {
                        self.setState({spinnerBool: false}, () => {
                            Utils.dialogBox("Successfully LoggedIn", '');
                            self.props.navigation.navigate('authNavigator');
                        })
                    }
                }
            }, function (error) {
                // console.log('login error', error, error.response);
                if (error.response) {
                    if (error.response.status === 403) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox("Token Expired,Please Login Again", '');
                        self.props.navigation.navigate('Login');
                    } else if (error.response.status === 500) {
                        self.setState({spinnerBool: false});
                        if(error.response.data.message){
                            Utils.dialogBox(error.response.data.message, '');
                        }else if(error.response.data.code){
                            Utils.dialogBox(error.response.data.code, '');
                        }else{
                            Utils.dialogBox('Bad Credentials', '');
                        }
                    } else if (error.response.status === 400) {
                        self.setState({spinnerBool: false});
                        if(error.response.data.message){
                            Utils.dialogBox(error.response.data.message, '');
                        }else{
                            Utils.dialogBox(error.response.data.code, '');
                        }
                    } else {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
                    }
                } else {
                    self.setState({spinnerBool: false});
                    Utils.dialogBox(error.message, '');
                }
            });
        })
    };

    onLogin = () => {
        this.onChangeCheck();
        let resp = {};
        let result = {};
        resp = Utils.isValidMobileNumber(this.state.phoneNumber);
        if (resp.status === true) {
            result.phoneNumber = resp.message;
            this.setState({isValidMobileNumber: true, errorMobileMessage: ''});
            resp = Utils.isValidPassword(this.state.password);
            if (resp.status === true) {
                result.password = resp.message;
                this.setState({isValidPassword: true, errorPassMessage: '', showLogin: true});
            } else {
                this.password.focus();
                this.setState({isValidPassword: false, errorPassMessage: resp.message, showLogin: false});
            }
        } else {
            this.phoneNumber.focus();
            this.setState({isValidMobileNumber: false, errorMobileMessage: resp.message, showLogin: false});
        }
    };

    render() {
        return (
            <View style={styles.container}>
                {/*<OfflineNotice/>*/}
                {/*<MockLocationCheck/>*/}
                {this.renderSpinner()}
                <ScrollView
                    // persistentScrollbar={true}
                    style={{marginHorizontal: 20,}}>
                <View style={{marginTop: 20, marginBottom: 30}}>
                    {/*{LoadSVG.whizzard_logo}*/}
                                                  <Image
                                                        style={[Styles.img45]}
                                                        source={LoadImages.whizzardMll}/>

                    <Text style={[Styles.colorBlue, Styles.f28, Styles.ffMbold]}>
                        Welcome,
                    </Text>
                    <Text style={[Styles.colorBlue, Styles.f25, Styles.ffMregular]}>
                        Sign in to continue
                    </Text>
                </View>

                    <KeyboardAvoidingView style={{flex: 1}} >
                        <View  >
                            <TextInput label='Mobile Number*'
                                       mode='outlined'
                                       theme={theme}
                                       returnKeyType="next"
                                       blurOnSubmit={false}
                                       placeholder='Mobile Number'
                                       placeholderTextColor='red'
                                       keyboardType='numeric'
                                       ref={(input) => {
                                           this.phoneNumber = input;
                                       }}
                                       onSubmitEditing={() => {
                                           this.password.focus();
                                       }}
                                       onChangeText={(phoneNumber) => this.setState({phoneNumber}, () => {
                                           this.onLogin();
                                       })}
                                       value={this.state.phoneNumber}/>
                            {
                                this.state.errorMobileMessage ?
                                    <Text style={{
                                        color: 'red',
                                        fontFamily: 'Muli-Regular',
                                        paddingLeft: 20, marginBottom: 10
                                    }}>{this.state.errorMobileMessage}</Text>
                                    :
                                    <Text/>
                            }
                            {
                                this.state.isValidMobileNumber === true ?
                                    Services.successIcon()
                                    :
                                    this.state.isValidMobileNumber === false ?
                                        Services.errorIcon()
                                        : null
                            }
                        </View>

                        <View>
                            <TextInput label='Password*'
                                       theme={theme}
                                       mode='outlined'
                                       autoCompleteType='off'
                                       placeholderTextColor='#233167'
                                       autoCapitalize="none"
                                       blurOnSubmit={false}
                                       returnKeyType="done"
                                       placeholder='Password'
                                       secureTextEntry={this.state.showPassword=== false}
                                       value={this.state.password}
                                       ref={(input) => {
                                           this.password = input;
                                       }}
                                       onSubmitEditing={() => {
                                           Keyboard.dismiss();
                                           this.onLogin() ;
                                       }}
                                       onChangeText={(password) => this.setState({password}, () => {
                                           this.onLogin();
                                       })}/>
                            {
                                this.state.errorPassMessage ?
                                    <Text style={{
                                        color: 'red',
                                        fontFamily: 'Muli-Regular',
                                        paddingLeft: 20, marginBottom: 10
                                    }}>{this.state.errorPassMessage}</Text>
                                    :
                                    <Text/>
                            }
                            {this.state.isValidPassword === true ?
                                Services.successIcon()
                                :
                                this.state.isValidPassword === false ?
                                    Services.errorIcon() : null
                            }


                        </View>


                        <View style={[Styles.row,Styles.jSpaceArd ]}>
                            <TouchableOpacity style={[Styles.row,{right:10}]}
                                              onPress={() => this.setState({rememberMe: !this.state.rememberMe}, function () {
                                                  this.onChangeCheck();
                                              })}>
                                <CheckBox
                                    containerStyle={{
                                        backgroundColor:"#fff",
                                        borderWidth: 0,
                                    }}
                                    checkedColor='#36A84C'
                                    size={25}
                                    onPress={() => this.setState({rememberMe: !this.state.rememberMe}, function () {
                                        this.onChangeCheck();
                                    })}
                                    checked={this.state.rememberMe}
                                />
                                <Text style={[Styles.f16,Styles.colorBlue,Styles.ffMbold,Styles.aslCenter,{right:16}]}>Remember me</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[Styles.row,{left:10}]}
                                              onPress={() => this.setState({ showPassword :!this.state.showPassword})}>
                                <CheckBox
                                    containerStyle={{
                                        backgroundColor:"#fff",
                                        borderWidth: 0,
                                    }}
                                    checkedColor='#36A84C'
                                    size={25}
                                    onPress={() => this.setState({ showPassword :!this.state.showPassword})}
                                    checked={this.state.showPassword}
                                />
                                <Text style={[Styles.f16,Styles.colorBlue,Styles.ffMbold,Styles.aslCenter,{right:16}]}>Show password</Text>
                            </TouchableOpacity>


                        </View>

                        <View style={[Styles.row,Styles.jEnd]}>
                            <TouchableOpacity style={[Styles.mTop10]} onPress={() => this.props.navigation.navigate('ForgotPassword')}>
                                <Text style={[Styles.f16,Styles.colorBlue,Styles.ffMbold]}> Forgot password? </Text>
                            </TouchableOpacity>
                        </View>


                    </KeyboardAvoidingView>


                    <TouchableOpacity
                        onPress={() => this.httpLoginRequest()}
                        disabled={this.state.showLogin === false}
                        style={[Styles.mTop40,{backgroundColor:this.state.showLogin === false?'#cccccc': '#C91A1F'},Styles.bcRed,Styles.br5,]}>
                        <Text style={[Styles.f18,Styles.ffMbold,Styles.cWhite,Styles.padH10,Styles.padV10,Styles.aslCenter]}>CONTINUE</Text>
                    </TouchableOpacity>

                    <View style={{flexDirection: 'row', marginTop: 15, justifyContent: 'center'}}>
                        <Text style={{color: '#848CAA', fontFamily: 'Muli-Regular', fontSize: 16}}>
                            Don't have an account?
                        </Text>
                        <TouchableOpacity onPress={() => this.props.navigation.navigate('Signup')}>
                            <Text style={{color:Services.returnServerBasedColor('login'), fontSize: 16, fontFamily: 'Muli-Bold'}}> Sign up </Text>
                        </TouchableOpacity>
                        <Text style={{color: '#848CAA', fontFamily: 'Muli-Regular', fontSize: 16}}>now.</Text>
                    </View>
                </ScrollView>
                {Services.returnAPKdate()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        textAlign: 'center',
        backgroundColor: '#fff',
        color: 'red',
    },
    input: {
        height: 40,
        backgroundColor: 'rgba(225,225,225,0.2)',
        marginBottom: 20,
        padding: 10,
        color: '#fff',
        fontFamily: 'Muli-Regular'
    },
    submitButton: {
        backgroundColor: '#f3cc14',
        marginTop: 40,
        height: 40,

    },
    submitButtonText: {
        color: '#000',
        textAlign: 'center',
        fontSize: 20,
        lineHeight: 40,
        fontFamily: 'Muli-Bold'
    },
    proceedButton: {
        backgroundColor: '#f3cc14',
        marginTop: 10,
        // height: 30,
    },
    proceedButtonText: {
        color: '#000',
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 20,
        fontFamily: 'Muli-Bold'
    }
});
