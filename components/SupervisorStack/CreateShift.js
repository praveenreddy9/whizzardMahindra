import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Modal,
    ScrollView,
    TimePickerAndroid,
    DatePickerAndroid, Linking, PermissionsAndroid, Alert, BackHandler,
} from 'react-native';
import {Styles, CSpinner, LoadSVG, CText} from '../common';
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/dist/FontAwesome';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import Utils from "../common/Utils";
import Config from "../common/Config";
import Services from "../common/Services";
import {Appbar, Card, Colors, DefaultTheme, Title, List, ProgressBar} from "react-native-paper";
import _ from 'lodash';
// import SwipeButton from "rn-swipe-button";
import {CheckBox} from 'react-native-elements';
import OfflineNotice from './../common/OfflineNotice';
import AsyncStorage from "@react-native-community/async-storage";
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";
import DeviceInfo from "react-native-device-info";
import Geolocation from "react-native-geolocation-service";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";


const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

export default class CreateShift extends React.Component {

    constructor(props) {
        super(props);
        this.props.navigation.addListener(
            'didFocus',() => {
                OneSignal.addEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.addEventListener('opened',HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.props.navigation.addListener(
            'willBlur',() => {
                OneSignal.removeEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.removeEventListener('opened',HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.state = {
              spinnerBool: false,
            clientList: [],
            clientSiteList: [],
            clientTitle: 'SELECT CLIENT',
            siteTitle: 'SELECT SITE',
            clientListPopUp: false,
            siteListPopUp: false,
            userRolePopup: false,
            displayRole: 'SELECT ROLE',
            rolesList: [],
            StartTime: new Date().getHours(),
            StartTimeMin: new Date().getMinutes(),
            shiftDate: new Date(),
            shiftDuration: '4',
            userRole: '', clientID: '', clientSiteID: '',
            planTitle: 'SELECT PLAN',
            plansListPopUp: false,
            plansList: [],
            plan: false,finalDate: new Date(), updatedSiteID: '',
            vehicleTypeList: [], vehicleTypeTitle: 'SELECT VEHICLE TYPE', vehicleTypeListPopUp: false, vehicleTypeID: '',loggedUserRole:'',
            shiftSiteSelection:false,shiftRoleSelection:false,
            toUserDetails:{},screenName:'',swipeActivated:false,latitude: null, longitude: null,
        };
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                let toUserDetails = self.props.navigation.state.params.toUserDetails
                self.setState({
                    toUserDetails: toUserDetails,
                    updatedSiteID: toUserDetails.siteId,
                    screenName: toUserDetails.screenName,
                    loggedUserRole:userRole
                }, () => {
                    self.getRolesList(toUserDetails.userId);
                    self.setPresentTime('');
                    if (toUserDetails.dayStatus === 1) {
                        this.setState({shiftDate: new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1))})
                    }
                    if (toUserDetails.screenName === 'HomeScreen'){
                        self.requestLocationPermission()
                    }
                })
            });
        });
    }

    componentWillUnmount() {
        Services.checkMockLocationPermission((response) => {
            if (response){
                this.props.navigation.navigate('Login')
            }
        })
    }


    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
        // console.log("create shift error", error, error.response);
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
                        // console.log('start shift error perms lat long',this.state.latitude,this.state.longitude)
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


            } else {
                Utils.dialogBox('Location permission denied', '');
                this.props.navigation.goBack();
            }
        } catch (err) {
            console.warn(err);
            Utils.dialogBox(err, '')
        }
    }

    checkGPSpermission() {
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({interval: 10000, fastInterval: 5000})
            .then(data => {
                this.setState({GPSasked: true}, () => {
                    this.requestLocationPermission()
                })
            }).catch(err => {
            Utils.dialogBox('GPS permissions denied', '');
            this.props.navigation.goBack()
        });
    }

    validatingLocation() {
        // console.log('Location validation', this.state.longitude, this.state.latitude)
        if (this.state.longitude === null && this.state.latitude === null) {
            Alert.alert('', 'Your Location data is missing, Please check your Location Settings',
                [{
                    text: 'enable', onPress: () => {
                        this.requestLocationPermission();
                    }
                }]);
        } else {
            if (this.state.swipeActivated === true){
                this.validateCreateShift()
            }
        }
    }


    //API CALL FOR All sites list
    getAllSites(userId) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_ALL_SITES +'?&userId=' + userId +'&clientId='+ '';
        const body = {};
        // console.log('sites apiURL',apiURL)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    // console.log(' sitesList 200', response.data);
                    if (this.state.updatedSiteID) {
                        self.setState({
                            siteTitle: self.state.toUserDetails.siteName,
                            updatedSiteID: this.state.updatedSiteID,
                            shiftSiteSelection:true
                        }, () => {
                            self.getSiteClients();
                        });
                    }
                    self.setState({
                        clientSiteList: response.data,
                        spinnerBool: false,
                    });
                }
            }, (error) => {
                // console.log('error in get AllSites');
                self.errorHandling(error)
            })
        });
    }

    //API CALL FOR All sites list
    getSiteClients() {
        const self = this;
        if (self.state.updatedSiteID) {
            const getSiteClientsURL = Config.routes.BASE_URL + Config.routes.GET_SITES_CLIENTS + self.state.updatedSiteID;
            const body = {};
            this.setState({spinnerBool: true}, () => {
                Services.AuthHTTPRequest(getSiteClientsURL, "GET", body, (response) => {
                    if (response.status === 200) {
                        // console.log(' getSiteClients 200', response.data);
                        if (response.data.length === 1) {
                            self.setState({
                                clientList: response.data,
                                clientTitle: response.data[0].clientName,
                                clientID: response.data[0].id,
                                spinnerBool: false
                            })
                        } else {
                            self.setState({
                                clientList: response.data,
                                spinnerBool: false,
                                clientTitle: 'SELECT CLIENT',
                                clientID: ''
                            });
                        }
                    }
                }, (error) => {
                    // console.log('error in getSiteClients');
                    self.errorHandling(error)
                })
            });
        }
    }

    //API CALL FOR logged Users list
    getRolesList(userId) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_ROLES_BY_SELECTED_USER_ROLE + '?userId=' + userId;
        // console.log("sUserId", userId, apiURL);
        const body = { };
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    // console.log('get RolesList 200', response.data);
                    self.setState({
                        rolesList: response.data,
                        spinnerBool: false,
                    },()=>{
                        self.getAllSites(userId);
                    });
                }
            }, (error) => {
                // console.log('error in get RolesList', error, error.response);
                self.errorHandling(error)
            })
        });
    }

    /* Plans based on siteId || AllPlans w/o siteId */
    getAllPlans() {
        const self = this;
       let getPlansURL =
           self.state.plan === true
           ? Config.routes.BASE_URL + Config.routes.GET_ALL_PLANS
                    :
           Config.routes.BASE_URL + Config.routes.GET_PLANS_BY_SITE_ID + self.state.updatedSiteID
        // console.log('getPlansURL',getPlansURL);
        const body = {};
        this.setState({spinnerBool: true, planTitle: 'SELECT PLAN', planId: ''}, () => {
            // Services.AuthHTTPRequest(getPlansURL, self.state.plan === true ? "GET" : "GET", body, (response) => {
            Services.AuthHTTPRequest(getPlansURL, "GET", body, (response) => {
                if (response.status === 200) {
                    // console.log('plans resp200', response.data);
                    if (response.data) {
                        self.setState({
                            // plansList: self.state.plan === true ? response.data.content : response.data,
                            plansList: response.data,
                            spinnerBool: false,
                        });
                    } else {
                        self.setState({spinnerBool: false})
                        Utils.dialogBox('No Plans', '');
                    }
                }
            }, (error) => {
                // console.log('error in getAllPlans');
                self.errorHandling(error)
            })
        });
    }

    //API CALL FOR VEHICLE TYPE LIST
    getAllVehicleTypes() {
        const self = this;
        const CreateShiftUserID = self.props.navigation.state.params.toUserDetails.userId;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_ALL_VEHICLE_TYPES;
        const body = {'userId': CreateShiftUserID};
        // console.log('get AllVehicleTypesURL body', body);
            this.setState({spinnerBool: true}, () => {
                Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                    if (response.status === 200) {
                        // console.log(' vehicles Type 200', response.data);
                        self.setState({
                            vehicleTypeList: response.data.content,
                            spinnerBool: false,
                        });
                    }
                }, (error) => {
                    // console.log('error in get All VehicleTypes');
                    self.errorHandling(error)
                })
         });
    }


    //API call to Assign Adhoc Shift to User
    ShiftAssignToUser(result) {
        const self = this;
        const CreateShiftUserID = self.props.navigation.state.params.toUserDetails.userId;
        let apiURL =Config.routes.BASE_URL+ Config.routes.CREATE_ADHOC_SHIFT + CreateShiftUserID
        {
            self.state.screenName === 'HomeScreen'
            ?
                apiURL=Config.routes.BASE_URL+ Config.routes.SELF_ADHOC_SHIFT + '?latitude='+ self.state.latitude + '&longitude='+self.state.longitude
            :
                null
        }
        // const apiURL = Config.routes.BASE_URL + tempURL ;
        const body = result;
        // console.log('create shift body', body,'apiURL==>',apiURL);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    // let ShiftResponse = response.data;
                    self.setState({spinnerBool: false});
                    Utils.dialogBox('Shift Created Successfully', '');
                    {
                        self.state.screenName === 'HomeScreen'
                        ?
                            self.props.navigation.goBack()
                            :
                            self.props.navigation.navigate('TeamListingScreen');
                    }

                }
            }, (error) => {
                // console.log('error in ShiftAssignToUser');
                self.errorHandling(error)
            })
        });
    }

    //VALIDATE CREATE SHIFT DETAILS
    validateCreateShift() {
        const self = this;
        let result = {};
        const hours = parseInt(self.state.StartTime);
        const minutes = parseInt(self.state.StartTimeMin);
        result.startTime = {hours, minutes}
        result.duration = self.state.shiftDuration;
        result.shiftDate = self.state.shiftDate;
        result.userRole = self.state.userRole;
        result.clientId = self.state.clientID;
        result.siteId = self.state.updatedSiteID;
        {
            self.state.userRole < 19
            ?
                result.planId = self.state.planId
            :
            null
        }
        {
            self.state.userRole === 5 || self.state.userRole === 10
            ?
                result.vehicleType = self.state.vehicleType
                :
                null
        }

        // console.log('validateCreateShift result----', result);
        self.ShiftAssignToUser(result);
    }

    validateDuration(checkButton) {
        const item = this.state.shiftDuration;
        let shiftDuration = Math.trunc(parseInt(item));
        if (checkButton === 'increment') {
            if (shiftDuration >= 12) {
                // Utils.dialogBox('duration cannot be more than 12 hours', '');
                this.setState({shiftDuration: '12'})
            } else {
                const temp = shiftDuration + 1;
                this.setState({shiftDuration: JSON.stringify(temp)});
            }
        } else if (checkButton === 'decrement') {
            if (shiftDuration <= 1) {
                // Utils.dialogBox('minimum duration should be 1 hour', '');
                this.setState({shiftDuration: '1'})
            } else {
                const temp = shiftDuration - 1;
                this.setState({shiftDuration: JSON.stringify(temp)});
            }
        }
    }

    //Using this fun for adding 0 for time
    setPresentTime(checkTime) {
        // if (checkTime === 'now') {
        //     var StartTime = new Date().getHours();
        //     var StartTimeMin = new Date().getMinutes();
        // } else {
        //     var StartTime = this.state.StartTime;
        //     var StartTimeMin = this.state.StartTimeMin;
        // }
        let StartTime = checkTime === 'now' ? new Date().getHours() : this.state.StartTime;
        let StartTimeMin = checkTime === 'now' ? new Date().getMinutes() :  this.state.StartTimeMin;
        if (StartTime <= 9) {
            this.setState({StartTime: "0" + StartTime})
        } else {
            this.setState({StartTime: StartTime})
        }
        if (StartTimeMin <= 9) {
            this.setState({StartTimeMin: "0" + StartTimeMin})
        } else {
            this.setState({StartTimeMin: StartTimeMin})
        }
    }

    TimePicker() {
        try {
            const {action, hour, minute} = TimePickerAndroid.open({
                hour: new Date().getHours(),
                minute: new Date().getMinutes(),
                is24Hour: true,
            }).then((response) => {
                if (response.action === "timeSetAction") {
                    let StartTime = response.hour;
                    let StartTimeMin = response.minute;
                    let TotalStartTime = (StartTime * 60) + (StartTimeMin);
                    this.setState({TotalStartTime: TotalStartTime});

                    if (StartTime <= 9) {
                        this.setState({StartTime: "0" + StartTime})
                    } else {
                        this.setState({StartTime: StartTime})
                    }
                    if (StartTimeMin <= 9) {
                        this.setState({StartTimeMin: "0" + StartTimeMin})
                    } else {
                        this.setState({StartTimeMin: StartTimeMin})
                    }
                }
            })
        } catch ({code, message}) {
            console.log('Cannot open Time picker', message);
        }
    }

    datePicker() {
        const self = this;
        try {
            const {action, year, month, day} = DatePickerAndroid.open({
                date: self.state.shiftDate,
                minDate: new Date(),
                // minDate: self.state.shiftDate,
                mode: 'spinner',
            }).then((response) => {
                if (response.action === "dateSetAction") {
                    let shiftDate = new Date()
                    if (response.year < new Date().getFullYear()) {
                        Utils.dialogBox('Previous Dates cannot be selected', '')
                    } else if (response.month < new Date().getMonth()) {
                        Utils.dialogBox('Previous Dates cannot be selected', '')
                    } else if (response.day < new Date().getDate()) {
                        Utils.dialogBox('Previous Dates cannot be selected', '')
                    } else {
                         shiftDate = new Date(response.year, response.month, response.day)
                    }
                    self.setState({shiftDate: shiftDate});
                }
            });
        } catch ({code, message}) {
            console.warn('Cannot open date picker', message);
        }
    }

    render() {
         const toUserDetails = this.props.navigation.state.params.toUserDetails;
        return (
            <View style={[[Styles.flex1, Styles.bgWhite, {width: Dimensions.get('window').width}]]}>
                <OfflineNotice/>
                <Appbar.Header theme={theme} style={[Styles.bgDarkRed]}>
                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                    <Appbar.Content title="ASSIGN SHIFT" titleStyle={[Styles.ffLBold]}/>
                </Appbar.Header>


                {this.renderSpinner()}

                <ScrollView
                    persistentScrollbar={true}
                    style={[Styles.flex1, Styles.bgDWhite, Styles.padH15]}>

                    {/*USER DETILS CARD*/}
                    {
                        toUserDetails
                            ?
                            <Card style={[styles.shadowCard, Styles.mTop10]}>
                                <Card.Title theme={theme}
                                            style={[Styles.bgWhite]}
                                            title={_.startCase(toUserDetails.userName)}
                                            titleStyle={[Styles.f18, Styles.ffMbold]}
                                            subtitleStyle={[{fontFamily: "Muli-Regular"}]}
                                            subtitle={Services.getUserRoles(toUserDetails.role)}
                                            rightStyle={[Styles.marH5]}
                                            right={() => <MaterialIcons onPress={() => {
                                                Linking.openURL(`tel:${toUserDetails.phoneNumber}`)
                                            }} name="phone" size={30} color="#000"
                                            />}
                                            left={() => Services.getUserProfilePic(toUserDetails.userProfilePic)}

                                />
                            </Card>
                            :
                            null
                    }

                    {/*DATE CARD*/}
                    <View style={[Styles.mTop5]}>
                        <View style={[Styles.row, Styles.jSpaceBet, Styles.pBtm3]}>
                            <Title style={[Styles.cBlk, Styles.f16, Styles.ffMregular]}>Select Date</Title>
                            <TouchableOpacity
                                disabled={this.state.screenName === 'HomeScreen'}
                                onPress={() => {
                                this.setState({shiftDate: new Date()})
                            }}>
                                <Title style={[Styles.cRed, Styles.f16, Styles.ffMregular, {
                                    borderBottomWidth: 1,
                                    borderBottomColor: 'red'
                                }]}>TODAY</Title>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            disabled={this.state.screenName === 'HomeScreen'}
                            activeOpacity={0.7}
                            onPress={() => {  this.datePicker()  }}>
                        <Card style={[styles.shadowCard]}>
                            <Card.Title theme={theme}
                                        style={[Styles.bgWhite]}
                                        title={new Date(this.state.shiftDate).toDateString()}
                                        titleStyle={[Styles.f18, Styles.ffMbold]}
                                        rightStyle={[Styles.marH10]}
                                        right={() => <FontAwesome name="calendar" size={30} color="#000" />}
                            />
                        </Card>
                        </TouchableOpacity>
                    </View>

                    {/*TIME CARD*/}
                    <View style={[Styles.marV5]}>
                        <View style={[Styles.row, Styles.jSpaceBet, Styles.pBtm3]}>
                            <Title style={[Styles.cBlk, Styles.f16, Styles.ffMregular]}>Select START TIME</Title>
                            <TouchableOpacity onPress={() => {
                                this.setPresentTime('now');
                            }}>
                                <Title style={[Styles.cRed, Styles.f16, Styles.ffMregular, {
                                    borderBottomWidth: 1,
                                    borderBottomColor: 'red'
                                }]}>NOW</Title>
                            </TouchableOpacity>
                        </View>
                        <Card style={[styles.shadowCard]}>
                            <Card.Title theme={theme}
                                        style={[Styles.bgWhite]}
                                        title={<Text>{this.state.StartTime}:{this.state.StartTimeMin}</Text>}
                                        titleStyle={[Styles.f18, Styles.ffMbold]}
                                        rightStyle={[Styles.marH10]}
                                        right={() => <Ionicons onPress={() => this.TimePicker()}
                                                               name="ios-clock" size={35} color="#000"
                                        />}
                            />
                        </Card>
                    </View>

                    {/*DURATION CARD*/}
                    <Card style={[styles.shadowCard, Styles.marV5]}>
                        <Card.Title
                            style={[Styles.p5]}
                            title={<Title style={[Styles.cBlk, Styles.f18, Styles.ffMregular]}>DURATION <Text
                                style={[Styles.cBlk, Styles.f18, Styles.ffMbold]}>(hours)</Text></Title>}
                            titleStyle={[Styles.f18]}
                            right={() =>
                                <View style={[Styles.row, {paddingRight: 10}]}>
                                    <TouchableOpacity
                                        disabled={this.state.shiftDuration === '1'} onPress={() => {
                                        this.validateDuration('decrement')
                                    }}
                                        style={[Styles.aslCenter]}>
                                        <Text style={[Styles.IncDecButtonStyle]}>-</Text></TouchableOpacity>
                                    <Text
                                        style={[Styles.txtAlignCen, Styles.ffMbold, Styles.f18, {width: 30}]}>{this.state.shiftDuration}</Text>
                                    <TouchableOpacity disabled={this.state.shiftDuration === '24'} onPress={() => {
                                        this.validateDuration('increment')
                                    }} style={[Styles.aslCenter]}>
                                        <Text style={[Styles.IncDecButtonStyle]}>+</Text></TouchableOpacity>
                                </View>
                            }
                        />
                    </Card>

                    {/*USER ROLE DROP-DOWN CARD*/}
                    <Card
                        style={[styles.shadowCard, Styles.marV5, Styles.bcRed, {borderWidth: this.state.displayRole !== 'SELECT ROLE' ? null : 1}]}>
                        <TouchableOpacity onPress={() => this.setState({userRolePopup: true})}>
                            <Card.Title
                                style={[Styles.p5]}
                                title={this.state.displayRole === 'SELECT ROLE' ? 'SELECT ROLE' :Services.returnRoleName(this.state.displayRole) }
                                titleStyle={[Styles.f18, Styles.ffMbold]}
                                right={() =>
                                    <View style={[Styles.row, {paddingRight: 10}]}>
                                        <Ionicons name='md-arrow-dropdown' size={40}/>
                                    </View>
                                }
                            />
                        </TouchableOpacity>
                    </Card>


                    {/*USER ROLE POP-UP*/}
                    <Modal transparent={true} visible={this.state.userRolePopup}
                           animated={true}
                           animationType='slide'
                           onRequestClose={() => {
                               this.setState({userRolePopup: false})
                           }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <View
                                style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                    width: Dimensions.get('window').width - 80,
                                }]]}>
                                <View style={[Styles.bgWhite, {height: Dimensions.get('window').height / 2,}]}>
                                    <View style={Styles.alignCenter}>
                                        <Text
                                            style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select
                                            Role</Text>
                                    </View>
                                    <ScrollView>
                                        <List.Section>
                                            {
                                                    this.state.rolesList.map(role => {
                                                        if (role.value <= this.state.loggedUserRole) {
                                                             return (
                                                                <List.Item
                                                                    onPress={() => this.setState({
                                                                        userRolePopup: false,
                                                                        displayRole: role.key,
                                                                        userRole: role.value,
                                                                        // shiftRoleSelection:!(role.value === 5 || role.value === 10)
                                                                        shiftRoleSelection:
                                                                            role.value === 5 || role.value === 10
                                                                                ?
                                                                            this.state.vehicleTypeID ? true:false
                                                                                :
                                                                                true
                                                                    },()=>{
                                                                        if (role.value === 5 || role.value === 10){
                                                                            this.getAllVehicleTypes()
                                                                        }})}
                                                                    style={{marign: 0, padding: 0,}}
                                                                    theme={theme}
                                                                    key={role.value}
                                                                    title={Services.returnRoleName(role.key)}
                                                                    titleStyle={[Styles.ffMregular, Styles.colorBlue, Styles.f16, Styles.aslCenter, Styles.bw1, Styles.br100,
                                                                        {
                                                                            width: 210,
                                                                            textAlign: 'center',
                                                                            paddingHorizontal: 5,
                                                                            paddingVertical: 10,
                                                                            backgroundColor: this.state.userRole === role.value ? '#C91A1F' : '#fff',
                                                                            color: this.state.userRole === role.value ? '#fff' : '#233167',
                                                                            borderWidth: this.state.userRole === role.value ? 0 : 1,
                                                                        }]}
                                                                />
                                                            );
                                                        }
                                                    })
                                            }

                                        </List.Section>
                                    </ScrollView>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => {
                                this.setState({userRolePopup: false})
                            }} style={{marginTop: 20}}>
                                {LoadSVG.cancelIcon}
                            </TouchableOpacity>
                        </View>
                    </Modal>


                    {/*sites Dropdown*/}
                    <Card
                        style={[styles.shadowCard, Styles.marV5, Styles.bcRed, {borderWidth: this.state.siteTitle !== 'SELECT SITE' ? null : 1}]}>
                        <TouchableOpacity onPress={() => this.setState({siteListPopUp: true})}>
                            <Card.Title
                                style={[Styles.p5]}
                                title={this.state.siteTitle}
                                titleStyle={[Styles.f18, Styles.ffMbold]}
                                right={() =>
                                    <View style={[Styles.row, {paddingRight: 10}]}>
                                        <Ionicons name='md-arrow-dropdown' size={40}/>
                                    </View>
                                }
                            />
                        </TouchableOpacity>
                    </Card>


                    {/*Clients Dropdown */}
                    <Card
                        style={[styles.shadowCard, Styles.marV5, Styles.bcRed, {borderWidth: this.state.clientTitle !== 'SELECT CLIENT' ? null : 1}]}>
                        <TouchableOpacity
                            onPress={() => this.setState({clientListPopUp: true})}>
                            <Card.Title
                                style={[Styles.p5]}
                                title={this.state.clientTitle}
                                titleStyle={[Styles.f18, Styles.ffMbold]}
                                right={() =>
                                    <View style={[Styles.row, {paddingRight: 10}]}>
                                        <Ionicons name='md-arrow-dropdown' size={40}/>
                                    </View>
                                }
                            />

                        </TouchableOpacity>
                    </Card>

                    {/*Plans LIST POP-UP*/}
                    <Modal
                        transparent={true}
                        visible={this.state.plansListPopUp}
                        onRequestClose={() => {
                            this.setState({plansListPopUp: false})
                        }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <TouchableOpacity onPress={() => {
                                this.setState({plansListPopUp: false})
                            }} style={[Styles.modalbgPosition]}>
                            </TouchableOpacity>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <View
                                style={[[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p15, {
                                    width: Dimensions.get('window').width - 30,
                                    height: this.state.plansList.length > 5 ? Dimensions.get('window').height / 1.6 : null
                                }]]}>
                                <View style={[Styles.aitEnd, Styles.padV3]}>
                                    <CheckBox title='All Plans'
                                              checkedColor='green'
                                              uncheckedColor='#000'
                                              size={30}
                                              containerStyle={{
                                                  padding: 0,
                                                  margin: 0,
                                                  backgroundColor: 'transparent',
                                                  borderWidth: 0
                                              }}
                                              fontFamily={'Muli-Regular'}
                                              textStyle={[Styles.f16, Styles.ffMregular]}
                                              onPress={() => this.setState({plan: !this.state.plan}, () => {
                                                  const self = this;
                                                  self.getAllPlans()
                                              })}
                                              checked={this.state.plan}
                                    />
                                </View>
                                <ScrollView
                                    persistentScrollbar={true}>
                                    {this.state.plansList.length === 0 ?
                                        <Text style={{fontSize: 18, fontFamily: 'Muli-Bold'}}>No Plans has found for
                                            selected Site</Text>
                                        :
                                        <List.Section>
                                            {this.state.plansList.map(plan => {
                                                return (
                                                    <List.Item
                                                        onPress={() => this.setState({
                                                            plansListPopUp: false,
                                                            planTitle: plan.planName,
                                                            planId: plan.id
                                                        })}
                                                        style={styles.item}
                                                        key={plan.id + 1}
                                                        title={plan.planName}
                                                    />
                                                );
                                            })}
                                        </List.Section>
                                    }
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>

                    {/*CLIENTS LIST POP-UP*/}
                    <Modal transparent={true} visible={this.state.clientListPopUp}
                           animated={true}
                           animationType='fade'
                           onRequestClose={() => {
                               this.setState({clientListPopUp: false})
                           }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <View
                                style={[[Styles.bw1, Styles.aslCenter, Styles.bgWhite, Styles.p15, Styles.br40, Styles.bgWhite, {
                                    width: Dimensions.get('window').width - 80,
                                    height: this.state.clientList.length > 0 ? Dimensions.get('window').height / 1.5 : 200,
                                }]]}>
                                <View style={Styles.alignCenter}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select
                                        Client</Text>
                                </View>
                                {/*persistentScrollbar={true}>*/}
                                {this.state.clientList.length > 0 ?
                                    <ScrollView
                                        style={{height: Dimensions.get('window').height / 2}}>
                                        <List.Section>
                                            {this.state.clientList.map(client => {
                                                return (
                                                    <List.Item
                                                        onPress={() => this.setState({
                                                            clientListPopUp: false,
                                                            clientTitle: client.clientName,
                                                            clientID: client.id,
                                                            buttonClient: true
                                                        }, () => {
                                                            // const self = this;
                                                            // self.getClientSites();
                                                        })}
                                                        style={{marign: 0, padding: 0,}}
                                                        theme={theme}
                                                        titleStyle={[Styles.ffMregular,
                                                            Styles.f16,
                                                            Styles.aslCenter,
                                                            Styles.bw1,
                                                            Styles.br100,
                                                            {
                                                                width: 210,
                                                                textAlign: 'center',
                                                                paddingHorizontal: 5,
                                                                paddingVertical: 10,
                                                                backgroundColor: this.state.clientID === client.id ? '#C91A1F' : '#fff',
                                                                color: this.state.clientID === client.id ? '#fff' : '#233167',
                                                                borderWidth: this.state.clientID === client.id ? 0 : 1,
                                                            }]}
                                                        key={client.id + 1}
                                                        title={client.clientName}
                                                    />
                                                );
                                            })}
                                        </List.Section>
                                    </ScrollView>
                                    :
                                    <View style={[{height: 100}, Styles.mBtm10]}>
                                        <Text style={[Styles.ffMregular, Styles.f16, {textAlign: 'center'}]}>There
                                            are no Clients</Text>
                                    </View>
                                }
                            </View>
                            <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                                this.setState({clientListPopUp: false})
                            }}>
                                {LoadSVG.cancelIcon}
                            </TouchableOpacity>
                        </View>
                    </Modal>

                    {/*SITES LIST POP-UP*/}
                    <Modal transparent={true}
                           visible={this.state.siteListPopUp}
                           animated={true}
                           animationType='fade'
                           onRequestClose={() => {
                               this.setState({siteListPopUp: false})
                           }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <View
                                style={[[Styles.bw1, Styles.aslCenter, Styles.bgWhite, Styles.p15, Styles.br40, Styles.bgWhite, {
                                    width: Dimensions.get('window').width - 80,
                                    height: this.state.clientSiteList.length > 0 ? Dimensions.get('window').height / 1.5 : 200,
                                }]]}>
                                <View style={Styles.alignCenter}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select
                                        Sites</Text>
                                </View>
                                {/*persistentScrollbar={true}>*/}
                                {this.state.clientSiteList.length > 0 ?
                                    <ScrollView
                                        style={{height: Dimensions.get('window').height / 2}}>
                                        <List.Section>
                                            {this.state.clientSiteList.map(site => {
                                                return (
                                                    <List.Item
                                                        onPress={() => this.setState({
                                                            siteListPopUp: false,
                                                            siteTitle: site.name,
                                                            updatedSiteID: site.id,
                                                            shiftSiteSelection:true
                                                        }, () => {
                                                            const self = this;
                                                            self.getSiteClients()
                                                        })}
                                                        style={{marign: 0, padding: 0,}}
                                                        theme={theme}
                                                        titleStyle={[Styles.ffMregular,
                                                            Styles.f16,
                                                            Styles.aslCenter,
                                                            Styles.bw1,
                                                            Styles.br100,
                                                            {
                                                                width: 210,
                                                                textAlign: 'center',
                                                                paddingHorizontal: 5,
                                                                paddingVertical: 10,
                                                                backgroundColor: this.state.updatedSiteID === site.id ? '#C91A1F' : '#fff',
                                                                color: this.state.updatedSiteID === site.id ? '#fff' : '#233167',
                                                                borderWidth: this.state.updatedSiteID === site.id ? 0 : 1,
                                                            }]}
                                                        key={this.state.clientSiteList.length}
                                                        title={site.name}
                                                    />
                                                );
                                            })}
                                        </List.Section>
                                    </ScrollView>
                                    :
                                    <View style={[{height: 70}, Styles.mBtm10, Styles.alignCenter, Styles.aslCenter]}>
                                        <Text style={[Styles.ffMregular, Styles.f16, {textAlign: 'center'}]}>There
                                            are no Sites associated with this Client</Text>
                                    </View>
                                }
                            </View>
                            <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                                this.setState({siteListPopUp: false})
                            }}>
                                {LoadSVG.cancelIcon}
                            </TouchableOpacity>
                        </View>
                    </Modal>


                    {/*VEHICLE TYPE LIST POP-UP*/}
                    <Modal transparent={true} visible={this.state.vehicleTypeListPopUp}
                           animated={true}
                           animationType='fade'
                           onRequestClose={() => {
                               this.setState({vehicleTypeListPopUp: false})
                           }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <View
                                style={[[Styles.bw1, Styles.aslCenter, Styles.bgWhite, Styles.p15, Styles.br40, Styles.bgWhite, {
                                    width: Dimensions.get('window').width - 80,
                                    height: this.state.vehicleTypeList.length > 0 ? Dimensions.get('window').height / 1.5 : 200,
                                }]]}>
                                <View style={Styles.alignCenter}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select
                                        Vehicle</Text>
                                </View>
                                {/*persistentScrollbar={true}>*/}
                                {this.state.vehicleTypeList.length > 0 ?
                                    <ScrollView
                                        style={{height: Dimensions.get('window').height / 2}}>
                                        <View>
                                            {this.state.vehicleTypeList.map(List => {
                                                return (
                                                    <TouchableOpacity
                                                        key={List.id}
                                                        onPress={() => this.setState({
                                                            vehicleTypeListPopUp: false,
                                                            vehicleTypeTitle: List.vehicleRegistrationNumber,
                                                            vehicleTypeID: List.id,
                                                            vehicleType: List.vehicleType,
                                                            shiftRoleSelection:true
                                                        })}>
                                                        <Text style={[Styles.ffMregular,
                                                            Styles.f14,
                                                            Styles.aslCenter,
                                                            Styles.bw1,
                                                            Styles.br100,
                                                            Styles.bcAsh,
                                                            Styles.marV5,
                                                            Styles.padV10,
                                                            {
                                                                width: Dimensions.get('window').width - 120,
                                                                textAlign: 'center',
                                                                backgroundColor: this.state.vehicleTypeID === List.id ? '#C91A1F' : '#fff',
                                                                color: this.state.vehicleTypeID === List.id ? '#fff' : '#233167',
                                                                borderWidth: this.state.vehicleTypeID === List.id ? 0 : 1,
                                                            }]}>{List.vehicleRegistrationNumber}{List.vehicleType ?
                                                            <Text
                                                                style={[Styles.ffMbold, Styles.f18]}> ({List.vehicleType} Wheeler)</Text> : null} </Text>
                                                    </TouchableOpacity>

                                                );
                                            })}
                                        </View>
                                    </ScrollView>
                                    :
                                    <View style={[{height: 100}, Styles.mBtm10]}>
                                        <Text style={[Styles.ffMregular, Styles.f16, {textAlign: 'center'}]}>No Vehicles available to User</Text>
                                    </View>
                                }
                            </View>
                            <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                                this.setState({vehicleTypeListPopUp: false})
                            }}>
                                {LoadSVG.cancelIcon}
                            </TouchableOpacity>
                        </View>
                    </Modal>


                    {/*Plans Dropdown== will dispaly after siteId is present*/}
                    {this.state.updatedSiteID && this.state.userRole < 19 && this.state.userRole !== '' ?
                        <Card style={[styles.shadowCard, Styles.marV5, Styles.bcOrng, Styles.bw1]}>
                            <TouchableOpacity onPress={() => this.setState({plansListPopUp: true},()=>{
                                if (!this.state.plan){
                                    this.getAllPlans()
                                }
                            })}>
                                <Card.Title
                                    style={[Styles.p5]}
                                    title={this.state.planTitle}
                                    titleStyle={[Styles.f18, Styles.ffMbold]}
                                    right={() =>
                                        <View style={[Styles.row, {paddingRight: 10}]}>
                                            <Ionicons name='md-arrow-dropdown' size={40}/>
                                        </View>
                                    }
                                />
                            </TouchableOpacity>
                        </Card>
                        : null
                    }

                    {/*Vehicles Type Dropdown== will dispaly after siteId is present*/}
                    {this.state.userRole === 5 || this.state.userRole === 10 ?
                        <Card style={[styles.shadowCard, Styles.marV5, Styles.bcRed, {borderWidth: this.state.vehicleTypeTitle !== 'SELECT VEHICLE TYPE' ? null : 1}]}>
                            <TouchableOpacity onPress={() => this.setState({vehicleTypeListPopUp: true})}>
                                <Card.Title
                                    style={[Styles.p5]}
                                    title={this.state.vehicleTypeTitle}
                                    titleStyle={[Styles.f18, Styles.ffMbold]}
                                    right={() =>
                                        <View style={[Styles.row, {paddingRight: 10}]}>
                                            <Ionicons name='md-arrow-dropdown' size={40}/>
                                        </View>
                                    }
                                />
                            </TouchableOpacity>
                        </Card> : null
                    }


                </ScrollView>

                <View style={[Styles.progressBarCreateShift]}>
                    < ProgressBar color={'green'}
                                  progress={(3 +
                                      (this.state.displayRole === 'SELECT ROLE' ? 0 : 1) +
                                      (this.state.clientTitle === 'SELECT CLIENT' ? 0 : 1) +
                                      (this.state.siteTitle === 'SELECT SITE' ? 0 : 1) +
                                      (this.state.planTitle === 'SELECT PLAN' ? 0 : 1) +
                                      (this.state.vehicleTypeTitle === 'SELECT VEHICLE TYPE' ? 0 : 1)
                                  ) / 8}/>
                </View>
                {/* FOOTER BUTTON*/}
                <Card style={[Styles.footerUpdateButtonStyles]}>
                    <TouchableOpacity onPress={() => {
                        if ( this.state.screenName === 'HomeScreen'){
                            this.setState({swipeActivated:true},()=>{
                                this.validatingLocation()
                            })
                        }else {
                            this.validateCreateShift()
                        }
                    }} style={[Styles.br30, {
                        backgroundColor: !(this.state.shiftSiteSelection === true && this.state.shiftRoleSelection === true) ?  '#b2beb5':'#000'
                    }]}
                                      disabled={ !(this.state.shiftSiteSelection === true && this.state.shiftRoleSelection === true)}>
                        <CText
                            cStyle={[Styles.cWhite, Styles.f20, Styles.p10, Styles.aslCenter, Styles.ffMregular]}>ASSIGN
                            SHIFT</CText>
                    </TouchableOpacity>
                </Card>

            </View>

        );
    }
}

const styles = StyleSheet.create({
    item: {
        borderBottomColor: Colors.grey200,
        borderBottomWidth: 1
    }
});


