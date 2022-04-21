import React, {useState} from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Modal,
    ScrollView,
    TimePickerAndroid,
    DatePickerAndroid,
    Linking,
    PermissionsAndroid,
    Alert,
    Keyboard,
    Image,
    ActivityIndicator,
    Picker,
    RefreshControl,
    FlatList,
} from 'react-native';
import {Styles, CSpinner, LoadSVG, CText, LoadImages} from "./common";
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/dist/FontAwesome';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import Utils from "./common/Utils";
import Config from "./common/Config";
import Services from "./common/Services";
import {
    Appbar,
    Card,
    Colors,
    DefaultTheme,
    Title,
    List,
    ProgressBar,
    RadioButton,
    TextInput,
    FAB, Searchbar, Checkbox
} from "react-native-paper";
import _ from 'lodash';
// import SwipeButton from "rn-swipe-button";
import {CheckBox} from 'react-native-elements';
import OfflineNotice from './common/OfflineNotice';
import AsyncStorage from "@react-native-community/async-storage";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import DeviceInfo from "react-native-device-info";
import Geolocation from "react-native-geolocation-service";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import ImageZoom from "react-native-image-pan-zoom";
import RNDateTimePicker, {Event} from '@react-native-community/datetimepicker';

const textInputTheme = {
    colors: {
        placeholder: '#233167', text: '#233167',
        // primary: '#233167',
        //     underlineColor: 'transparent', background: '#003489'
    }
};

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

const themeSubtitle = {
    fontSize: 18,
    color: 'black',
    fontFamily: 'Muli-Bold'
};

const options = {
    title: 'Select Avatar',
    // customButtons: [{name: 'fb', title: 'Choose Photo from Facebook'}],
    storageOptions: {
        skipBackup: true,
        path: 'images',
    },
    maxWidth: 1200, maxHeight: 800,
    saveToPhotos: true
};


export default class CreateNonRegisteredAdhocShift extends React.Component {

    constructor(props) {
        super(props);
        // this.requestLocationPermission()
        // this.requestCameraPermission()
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
            clientList: [],
            clientSiteList: [],
            clientTitle: 'SELECT CLIENT',
            siteTitle: 'SELECT SITE',
            clientListPopUp: false,
            siteListPopUp: false,
            searchedSiteList: [],
            searchSiteString: '',
            userRolePopup: false,
            displayRole: 'SELECT ROLE',
            rolesList: [],
            // StartTime: new Date().getHours(),
            // StartTimeMin: new Date().getMinutes(),
            StartTime: Services.returnCalculatedHours(new Date()),
            StartTimeMin: Services.returnCalculatedMinutes(new Date()),
            shiftDate: new Date(),
            shiftDuration: '4',
            userRole: '',
            clientID: '',
            clientSiteID: '',
            planTitle: 'SELECT PLAN',
            plansListPopUp: false,
            plansList: [],
            plan: false,
            finalDate: new Date(),
            updatedSiteID: '',
            vehicleTypeTitle: 'SELECT VEHICLE TYPE',
            vehicleTypeListPopUp: false,
            vehicleTypeID: '',
            loggedUserRole: '',
            shiftSiteSelection: false,
            shiftRoleSelection: false,
            swipeActivated: false,
            // latitude: null,
            // longitude: null,

            roleValue: 1,
            userDetails: [],
            mobileNumber: '',
            vehicleTypeList: [{name: '2 Wheeler', value: '2'},
                {name: '3 Wheeler', value: '3'},
                {name: '4 Wheeler', value: '4'}],
            stateCode: '',
            distCode: '',
            rtoCode: '',
            vehicleNum: '',
            errorVehicleRegMessage: null,
            userImageUrl: '',
            userImageFormData: '',
            planId: '',
            allowOtherFields: false,
            adhocReasons: [],
            adhocReasonValue: '',
            otherAdhocReason: '',
            paymentMode: 'Now',

            //Beneficary Related
            ShowAddBankDetailsModal: false,
            //Error message States
            errorPanMessage: null,
            errorBeneficiaryName: null,
            errorBeneficiaryAccountNumber: null,
            errorBeneficiaryIFSCcode: null,
            ownerInfo: false,
            OwnerPanCardNumber: '',
            OwnerAccountName: '',
            OwnerAadharCardNumber: '',
            OwnerBankAccountNumber: '',
            OwnerBankIFSCcode: '',
            panNumberStatus: [],
            panNumberDetails: [],
            panVerifiedFirst: false,
            panCardFormData: '',
            panImageURL: '',
            userPanFound: false,
            BeneficiaryBankProofImageURL: '',
            BeneficiaryAadharImageURL: '',
            OwnerBeneficaryId: '',
            userPanCardNumber: '',
            successModal: false,
            beneficiaryDetailsFound: false,

            //user bank details start
            IFSCcode: '',
            BankName: '',
            BankBranchName: '',
            BranchAddress: '',
            BankAccountNumber: '',
            VerifyBankAccountNumber: '',
            AccountType: '',
            AccountHolderName: '',
            userBankPanCardNumber: '',
            userErrorPanMessage: null,
            errorIFSCcode: null,
            errorBankName: null,
            errorBankAccountNumber: null,
            errorVerifyBankAccountNumber: null,
            errorAccountHolderName: '',
            userBankPassbookUrl: '',
            userBankPassbookFormData: '',
            userOtherBankPassbookUrl: '',
            userOtherBankPassbookFormData: '',
            userBankDetailsInfo: {},
            userBankInfoCreated: false,
            //user bank detials end

            imagePreview: false,
            imagePreviewURL: '',
            imageRotate: '0',
            createdAdhocList: [],
            showAdhocShiftsList: false,
            filterAdhocShiftDate: new Date(),
            otpDigits: '',
            otpVerificationModal: false,
            showTimepicker: false,
            imageSelectionModal: false,
            addBankDetailsLater: false,
            addUserBankDetails: true,
            createAdhocShiftModal: false,isRefreshing: false,loggedUserId:'',
        };
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            Services.checkMockLocationPermission((response) => {
                if (response) {
                    this.props.navigation.navigate('Login')
                }
            })
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                AsyncStorage.getItem('Whizzard:userId').then((userId) => {
                    this.requestLocationPermission()
                    self.setState({
                        loggedUserRole: userRole,
                        loggedUserId: userId
                    })
                });
            });
            self.getCreatedShiftsList()
        });
    }


    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    //to set state values to default,on back navigation focus handling
    setDefaultValues(){
        this.setState({
            spinnerBool: false,
            clientList: [],
            clientSiteList: [],
            clientTitle: 'SELECT CLIENT',
            siteTitle: 'SELECT SITE',
            clientListPopUp: false,
            siteListPopUp: false,
            searchedSiteList: [],
            searchSiteString: '',
            userRolePopup: false,
            displayRole: 'SELECT ROLE',
            rolesList: [],
            // StartTime: new Date().getHours(),
            // StartTimeMin: new Date().getMinutes(),
            StartTime: Services.returnCalculatedHours(new Date()),
            StartTimeMin: Services.returnCalculatedMinutes(new Date()),
            shiftDate: new Date(),
            shiftDuration: '4',
            userRole: '',
            clientID: '',
            clientSiteID: '',
            planTitle: 'SELECT PLAN',
            plansListPopUp: false,
            plansList: [],
            plan: false,
            finalDate: new Date(),
            updatedSiteID: '',
            vehicleTypeTitle: 'SELECT VEHICLE TYPE',
            vehicleTypeListPopUp: false,
            vehicleTypeID: '',
            shiftSiteSelection: false,
            shiftRoleSelection: false,
            swipeActivated: false,
            // latitude: null,
            // longitude: null,

            roleValue: 1,
            userDetails: [],
            mobileNumber: '',
            vehicleTypeList: [{name: '2 Wheeler', value: '2'},
                {name: '3 Wheeler', value: '3'},
                {name: '4 Wheeler', value: '4'}],
            stateCode: '',
            distCode: '',
            rtoCode: '',
            vehicleNum: '',
            errorVehicleRegMessage: null,
            userImageUrl: '',
            userImageFormData: '',
            planId: '',
            allowOtherFields: false,
            adhocReasons: [],
            adhocReasonValue: '',
            otherAdhocReason: '',
            paymentMode: 'Now',

            //Beneficary Related
            ShowAddBankDetailsModal: false,
            //Error message States
            errorPanMessage: null,
            errorBeneficiaryName: null,
            errorBeneficiaryAccountNumber: null,
            errorBeneficiaryIFSCcode: null,
            ownerInfo: false,
            OwnerPanCardNumber: '',
            OwnerAccountName: '',
            OwnerAadharCardNumber: '',
            OwnerBankAccountNumber: '',
            OwnerBankIFSCcode: '',
            panNumberStatus: [],
            panNumberDetails: [],
            panVerifiedFirst: false,
            panCardFormData: '',
            panImageURL: '',
            userPanFound: false,
            BeneficiaryBankProofImageURL: '',
            BeneficiaryAadharImageURL: '',
            OwnerBeneficaryId: '',
            userPanCardNumber: '',
            successModal: false,
            beneficiaryDetailsFound: false,

            //user bank details start
            IFSCcode: '',
            BankName: '',
            BankBranchName: '',
            BranchAddress: '',
            BankAccountNumber: '',
            VerifyBankAccountNumber: '',
            AccountType: '',
            AccountHolderName: '',
            userBankPanCardNumber: '',
            userErrorPanMessage: null,
            errorIFSCcode: null,
            errorBankName: null,
            errorBankAccountNumber: null,
            errorVerifyBankAccountNumber: null,
            errorAccountHolderName: '',
            userBankPassbookUrl: '',
            userBankPassbookFormData: '',
            userOtherBankPassbookUrl: '',
            userOtherBankPassbookFormData: '',
            userBankDetailsInfo: {},
            userBankInfoCreated: false,
            //user bank detials end

            imagePreview: false,
            imagePreviewURL: '',
            imageRotate: '0',
            // createdAdhocList: [],
            showAdhocShiftsList: false,
            filterAdhocShiftDate: new Date(),
            otpDigits: '',
            otpVerificationModal: false,
            showTimepicker: false,
            imageSelectionModal: false,
            addBankDetailsLater: false,
            addUserBankDetails: true,
            createAdhocShiftModal: true,isRefreshing: false,
        },()=>{
            this.getAdhocShiftReasons()
        })
    }

    errorHandling(error) {
        const self = this;
        // console.log('errorHandling in create shift',error, error.response);
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

    // async requestCameraPermission() {
    //     try {
    //         const granted = await PermissionsAndroid.request(
    //             PermissionsAndroid.PERMISSIONS.CAMERA,
    //         );
    //         if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    //             this.requestLocationPermission()
    //             // this.setState({QRVisible: true, granted: granted})
    //         } else {
    //             Utils.dialogBox('Camera permission denied', '');
    //             this.props.navigation.goBack();
    //         }
    //     } catch (err) {
    //         Utils.dialogBox('err', '');
    //         console.warn(err);
    //     }
    // }

    async requestLocationPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
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
            // console.log('error GPS check',err);
            Utils.dialogBox('GPS permissions denied', '');
            this.props.navigation.goBack()
        });
    }

    validatingLocation() {
        // console.log('Location validation', this.state.longitude, this.state.latitude)
        if (this.state.longitude && this.state.latitude) {
            if (this.state.swipeActivated === true) {
                // this.ShiftAssignToUser()
                this.checkUserLocation()
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

    //API CALL FOR Adhoc Shift Reasons
    getAdhocShiftReasons() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_ADHOC_SHIFT_REASONS;
        const body = {};
        // console.log('adhoc reasons apiURL',apiURL)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let tempData = response.data;
                    let sample = {name: 'Select Reason', key: ''}
                    tempData.unshift(sample)
                    // console.log(' adhoc reasons resp200', tempData);
                    self.setState({
                        adhocReasons: tempData,
                        spinnerBool: false
                    })
                    self.getAllSites();
                }
            }, (error) => {
                // console.log('error in adhoc reasons');
                self.errorHandling(error)
            })
        });
    }


    //API CALL to get Created Adhoc Shift Details
    getCreatedShiftsList() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_ADHOC_SHIFTS_CREATED + '?date=' + Services.returnCalendarFormat(self.state.filterAdhocShiftDate);
        // const apiURL = Config.routes.BASE_URL + Config.routes.GET_ADHOC_SHIFTS_CREATED +'?date='+ '2021-06-22';
        const body = {};
        // console.log('get Created Shifts List apiURL',apiURL)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    // console.log(' get Created Shifts List resp200', response.data);
                    self.setState({
                        createdAdhocList: response.data,
                        spinnerBool: false,
                        isRefreshing: false,
                    })
                }
            }, (error) => {
                // console.log('error in get Created Shifts List');
                self.errorHandling(error)
            })
        });
    }

    handleRefresh = () => {
        this.setState({
            isRefreshing: true,
        }, () => {
         this.getCreatedShiftsList()
        });
    };

    //API CALL to check user locaiton
    checkUserLocation() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.CHECK_USER_LOCATION + '?latitude=' + self.state.latitude + '&longitude=' + self.state.longitude + '&siteId=' + self.state.updatedSiteID;
        const body = {};
        // console.log('check User Location apiURL', apiURL)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    let tempData = response.data;
                    // console.log(' check User Location resp200', tempData);
                    if (tempData.showWarning) {
                        self.setState({successModal: true, spinnerBool: false})
                    } else {
                        // self.ShiftAssignToUser()
                        self.setState({otpVerificationModal: true, spinnerBool: false}, () => {
                            self.sendOTPtoUser()
                        })
                    }
                    self.setState({
                        spinnerBool: false
                    })
                }
            }, (error) => {
                // console.log('error in check User Location');
                self.errorHandling(error)
            })
        });
    }

    //API CALL to send OTP
    sendOTPtoUser() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.SEND_OTP_TO_USER + self.state.mobileNumber;
        // const apiURL = Config.routes.BASE_URL + Config.routes.SEND_OTP_TO_USER + '8096712223';
        const body = {};
        // console.log('send OTP to User apiURL',apiURL)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let tempData = response.data;
                    // console.log('send OTP to User resp200', tempData);
                    self.setState({
                        spinnerBool: false
                    })
                }
            }, (error) => {
                // console.log('error in send OTP to User ');
                self.errorHandling(error)
            })
        });
    }

    //API CALL to send OTP
    verifyOTP() {
        const self = this;
        // const apiURL = Config.routes.BASE_URL + Config.routes.VERIFY_OTP + 'phoneNumber=8096712223'+'&otp=123456';
        const apiURL = Config.routes.BASE_URL + Config.routes.VERIFY_OTP + 'phoneNumber=' + self.state.mobileNumber + '&otp=' + self.state.otpDigits;
        const body = {}
        // console.log('verify OTP apiURL',apiURL,'body===>',body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    // console.log('verify OTP resp200', response.data);
                    self.setState({
                        spinnerBool: false,
                        otpVerificationModal: false
                    }, () => {
                        self.ShiftAssignToUser()
                    })
                }
            }, (error) => {
                // console.log('error in verify OTP');
                self.errorHandling(error)
            })
        });
    }

    verifyMobileNumber(number) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.VERIFY_MOBILE_NUMBER + number;
        const body = {}
        // console.log('verify Mobile Number body', body, 'apiUrl===', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log("verify Mobile Number resp200", response.data);
                    let tempData = response.data;
                    if (tempData.userExists) {
                        if (tempData.status === "NOT_REGISTERED") {
                            if (tempData.reachedMaximumShifts) {
                                self.setState({
                                    spinnerBool: false,
                                    userStatus: 'OLD_NOT_REGISTERED',
                                    allowOtherFields: false,
                                })
                                Alert.alert(tempData.liteUserWarning, Alert,
                                    [
                                        {
                                            text: 'OK', onPress: () => {
                                                self.setState({
                                                    allowOtherFields: false,
                                                    mobileNumber: '',
                                                    userStatus: null
                                                })
                                            }
                                        },
                                    ]
                                )
                            } else {
                                if (tempData.role === 1 || tempData.role === 5 || tempData.role === 10) {
                                    self.setState({
                                        spinnerBool: false,
                                        userStatus: 'OLD_NOT_REGISTERED',
                                        userDetails: tempData,
                                        userName: tempData.userExists ? tempData.fullName : '',
                                        roleValue: tempData.userExists ? tempData.role : '',
                                        allowOtherFields: true,
                                        selectedUserId: tempData.userExists ? tempData.userId : '',
                                        beneficiaryDetailsFound: tempData.beneficiary ? true : false
                                    }, () => {
                                        if (tempData.beneficiary) {
                                            self.checkBeneficaryDetails(tempData.beneficiary)
                                        }
                                    })
                                } else {
                                    self.setState({
                                        spinnerBool: false,
                                        userStatus: 'OLD_NOT_REGISTERED',
                                        allowOtherFields: false,
                                        beneficiaryDetailsFound: false
                                    }, () => {
                                        Alert.alert('Lite User Shift can only be assigned to D,A,DDA Role Users', Alert,
                                            [
                                                {
                                                    text: 'OK', onPress: () => {
                                                        self.setState({
                                                            allowOtherFields: false,
                                                            mobileNumber: '',
                                                            userStatus: null,
                                                            beneficiaryDetailsFound: false
                                                        })
                                                    }
                                                },
                                            ]
                                        )
                                    })
                                }
                            }
                        } else {
                            self.setState({
                                spinnerBool: false,
                                userStatus: 'REGISTERED',
                                allowOtherFields: false,
                            })
                            Alert.alert('Lite User Shift cannot be assigned to Registered Users', Alert,
                                [
                                    {
                                        text: 'OK', onPress: () => {
                                            self.setState({
                                                allowOtherFields: false,
                                                mobileNumber: '',
                                                userStatus: null
                                            })
                                        }
                                    },
                                ]
                            )
                        }
                    } else {
                        self.setState({
                            spinnerBool: false,
                            userStatus: 'NEW_NOT_REGISTERED',
                            userDetails: tempData,
                            userName: tempData.userExists ? tempData.fullName : '',
                            roleValue: tempData.userExists ? Services.getUserRoles(tempData.role) : '',
                            allowOtherFields: true,
                        })
                    }

                }
            }, function (error) {
                // console.log('verify Mobile Number error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    //API CALL FOR All sites list
    getAllSites() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_ALL_SITES + '?&userId=' + self.state.loggedUserId + '&clientId=' + '';
        // const body = {"businessUnits": [], "cityIds": []}; //used for previous loggedUserSites API
        const body = {};
        // console.log('sites apiURL',apiURL)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    // console.log(' sitesList 200', response.data);
                    let tempData = response.data;

                    if (tempData.length === 1) {
                        self.setState({
                            clientSiteList: response.data,
                            searchedSiteList: response.data,
                            shiftSiteSelection: true,
                            siteTitle: tempData[0].name,
                            updatedSiteID: tempData[0].id
                        }, () => {
                            self.getSiteClients();
                        });
                    } else {
                        self.setState({
                            clientSiteList: response.data,
                            searchedSiteList: response.data,
                            spinnerBool: false,
                            siteTitle: 'SELECT SITE',
                            updatedSiteID: ''
                        })
                    }


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
            // console.log('url insidieieiei', getSiteClientsURL);
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
        } else {
            console.log('into else w/o')
        }
    }

    /* Plans based on siteId*/
    getSitePlans() {
        const self = this;
        let apiUrl = Config.routes.BASE_URL + Config.routes.GET_ADHOC_SITE_PLANS;
        const body = {
            siteId: self.state.updatedSiteID,
            role: self.state.roleValue,
            vehicleType: self.state.roleValue === 1 ? '' : self.state.vehicleTypeValue
        };
        // console.log('get Site Plans', apiUrl, 'body==>', body);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, "POST", body, (response) => {
                if (response.status === 200) {
                    // console.log('get Site Plans resp200', response.data);
                    let tempData = response.data;
                    let sample = {planName: 'No Plan', id: ''}
                    tempData.unshift(sample)
                    self.setState({
                        plansList: tempData,
                        plansListPopUp: true,
                        spinnerBool: false
                    })
                }
            }, (error) => {
                // console.log('error in get Site Plans');
                self.errorHandling(error)
            })
        });
    }

    uploadImage() {
        const self = this;
        let apiURL = Config.routes.BASE_URL + Config.routes.UPLOAD_ADHOC_USER_PIC + 'phoneNumber=' + self.state.mobileNumber;
        const body = self.state.userImageFormData;
        // console.log(' image upload url', apiURL, 'body===', body)
        self.setState({spinnerBool: true}, () => {
            Services.AuthProfileHTTPRequest(apiURL, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log('image upload resp200', response)
                    if (self.state.paymentMode === "Later" && self.state.addBankDetailsLater === false) {
                        if (self.state.addUserBankDetails && self.state.userBankPassbookFormData) {
                            self.uploadUserBankImage()
                        } else {
                            self.checkShiftStatus()
                        }
                    } else {
                        self.checkShiftStatus()
                    }
                }
            }, function (error) {
                // console.log("img error", error.response, error);
                self.errorHandling(error)
            });
        });
    }

    uploadUserBankImage() {
        const self = this;
        let apiURL = Config.routes.BASE_URL + Config.routes.UPLOAD_ADHOC_USER_BANK_DETAILS + self.state.shiftCreatedResponse.userId;
        const body = self.state.userBankPassbookFormData;
        // console.log('user bank image upload url', apiURL, 'body===', body)
        self.setState({spinnerBool: true}, () => {
            Services.AuthProfileHTTPRequest(apiURL, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log('user bank image upload resp200', response)
                    self.checkShiftStatus()
                    // self.props.navigation.goBack()
                }
            }, function (error) {
                // console.log("user bank img error");
                self.errorHandling(error)
            });
        });
    }

    checkShiftStatus() {
        const self = this;
        let tempCreated = self.state.shiftCreatedResponse
        // console.log('Shift tempCreated',tempCreated)
        Utils.dialogBox('Shift Created Successfully', '');
        self.setState({spinnerBool: false, createAdhocShiftModal: false,swipeActivated:false}, () => {
            if (tempCreated.status === 'INIT') {
                this.props.navigation.navigate('ScanQRcode', {
                    UserShiftResponse: tempCreated,
                    allowSkipQRCode: tempCreated.attrs.allowSkipQRCode,
                    UserFlow: 'NORMAL_ADHOC_FLOW'
                })
            } else {
                self.props.navigation.navigate('StartShiftScreen', {
                    CurrentShiftId: tempCreated.id,
                    currentUserId: tempCreated.userId,
                    UserFlow: 'NORMAL_ADHOC_FLOW'
                });
            }

        })
    }

    checkAdhocShift() {
        const self = this;
        let resp;
        resp = Utils.isValidMobileNumber(this.state.mobileNumber);
        if (resp.status === true) {
            resp = Utils.isValidName(this.state.userName);
            if (resp.status === true) {

                if (self.state.roleValue === 1) {
                    self.thirdStepValidation() //site,plan,Bank
                } else {
                    self.secondStepValidation() //role,vehicle
                }
            } else {
                Utils.dialogBox(resp.message, '');
            }

        } else {
            Utils.dialogBox(resp.message, '');
        }

    }

    secondStepValidation() {
        const self = this;
        let resp;
        resp = Utils.isValueSelected(this.state.roleValue, 'Please select a Role');
        if (resp.status === true) {
            resp = Utils.isValueSelected(this.state.vehicleTypeValue, 'Please select a Vehicle Type');
            if (resp.status === true) {
                resp = Utils.ValidateTotalVehicleNumberinParts(this.state.stateCode, this.state.distCode, this.state.rtoCode, this.state.vehicleNumber);
                if (resp.status === true) {
                    var finalVehicleNumber = this.state.stateCode + this.state.distCode + this.state.rtoCode + this.state.vehicleNumber;
                    this.setState({errorVehicleRegMessage: null, finalVehicleNumber: finalVehicleNumber});

                    self.thirdStepValidation()

                } else {
                    Utils.dialogBox(resp.message, '');
                }

            } else {
                Utils.dialogBox(resp.message, '');
            }
        } else {
            Utils.dialogBox(resp.message, '');
        }
    }

    thirdStepValidation() {
        const self = this;
        let resp;
        resp = Utils.isValueSelected(this.state.updatedSiteID, 'Please select a Site');
        if (resp.status === true) {
            resp = Utils.isValueSelected(this.state.clientID, 'Please select Client');
            if (resp.status === true) {
                {
                    this.state.planTitle === "No Plan"
                        ?
                        resp = Utils.isValidAmountEntered(this.state.noPlanAmount, 'Amount at No Plan')
                        :
                        resp = Utils.isValueSelected(this.state.planId, 'Please select a Plan')
                }
                if (resp.status === true) {
                    {
                        this.state.paymentMode === "Later"
                            ?
                            this.state.addBankDetailsLater === false
                                ?
                                this.state.addUserBankDetails
                                    ?
                                    resp = Utils.isValueSelected(this.state.userBankInfoCreated, 'Please Add User Bank Details')
                                    :
                                    resp = Utils.isValueSelected(this.state.OwnerBeneficaryId, 'Please Create a Beneficiary')
                                :
                                resp = Utils.isValueSelected(true, 'Please Create a Beneficiary')
                            :
                            resp = Utils.isValueSelected(true, 'Please Create a Beneficiary')
                    }
                    if (resp.status === true) {
                        resp = Utils.isValueSelected(this.state.adhocReasonValue, 'Please select Lite User Reason');
                        if (resp.status === true) {
                            {
                                this.state.adhocReasonValue === "OTHER"
                                    ?
                                    resp = Utils.isValidReason(this.state.otherAdhocReason)
                                    :
                                    resp = Utils.isValueSelected(this.state.adhocReasonValue, 'Please select Lite User Reason');
                            }
                            if (resp.status === true) {
                                resp = Utils.isValueSelected(this.state.userImageUrl, 'Please Upload User Image');
                                if (resp.status === true) {

                                    // self.setState({swipeActivated: true}, () => {
                                    //     // self.ShiftAssignToUser()
                                    //     self.validatingLocation()
                                    // })
                                    Services.returnCurrentPosition((position) => {
                                        self.setState({
                                            currentLocation: position,
                                            latitude: position.latitude,
                                            longitude: position.longitude,
                                            swipeActivated: true
                                        }, () => {
                                            this.validatingLocation()
                                        })
                                    })


                                } else {
                                    Utils.dialogBox(resp.message, '');
                                }
                            } else {
                                Utils.dialogBox(resp.message, '');
                            }
                        } else {
                            Utils.dialogBox(resp.message, '');
                        }
                    } else {
                        Utils.dialogBox(resp.message, '');
                    }
                } else {
                    Utils.dialogBox(resp.message, '');
                }
            } else {
                Utils.dialogBox(resp.message, '');
            }

        } else {
            Utils.dialogBox(resp.message, '');
        }
    }

    //API call to Assign Adhoc Shift to User
    ShiftAssignToUser() {
        const self = this;
        let result = {};
        const hours = parseInt(self.state.StartTime);
        const minutes = parseInt(self.state.StartTimeMin);
        result.startTime = {hours, minutes}
        result.duration = self.state.shiftDuration;
        result.shiftDate = self.state.shiftDate;
        result.userRole = self.state.roleValue;
        result.clientId = self.state.clientID;
        result.siteId = self.state.updatedSiteID;
        result.unRegisteredUserAdhocShiftReason = this.state.adhocReasonValue === "OTHER" ? this.state.otherAdhocReason : this.state.adhocReasonValue;
        result.adhocPaymentMode = self.state.paymentMode
        result.adhocUserShiftLocation = {'latitude': self.state.latitude, 'longitude': self.state.longitude}
        result.pan = self.state.userPanCardNumber
        result.planId = self.state.planId
        result.adhocShiftAmountPaid = self.state.noPlanAmount
        result.beneficiaryId = self.state.OwnerBeneficaryId          //created beneficary Id
        result.addBankDetailsLater = self.state.addBankDetailsLater  //to add bank details later
        result.addUserBankInfo = self.state.addUserBankDetails      //to check user or beneficary
        result.liteUserBankData = self.state.userBankDetailsInfo   //user bank details

        if (self.state.roleValue === 5 || self.state.roleValue === 10) {
            result.vehicleType = self.state.vehicleTypeValue,
                result.vehicleRegNoInParts = {
                    part1: this.state.stateCode,
                    part2: this.state.distCode,
                    part3: this.state.rtoCode,
                    part4: this.state.vehicleNumber
                }
        }

        let apiURL = Config.routes.BASE_URL + Config.routes.CREATE_UNREGISTERED_ADHOC + 'phoneNumber=' + self.state.mobileNumber + '&name=' + self.state.userName

        const body = result;
        // console.log('create shift body', body, 'apiURL==>', apiURL,'body==',body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    // let ShiftResponse = response.data;

                    let tempResponse = response.data.shift
                    // console.log('Shift created resp', response.data)
                    self.setState({shiftCreatedResponse: tempResponse, otpVerificationModal: false}, () => {
                        if (self.state.userImageFormData) {
                            self.uploadImage()
                        } else {
                            self.checkShiftStatus()
                        }
                    })
                    // Utils.dialogBox('Shift Created Successfully', '');
                    // self.props.navigation.goBack()
                }
            }, (error) => {
                // console.log('error in ShiftAssignToUser');
                self.errorHandling(error)
            })
        });
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
        let StartTime = checkTime === 'now' ? new Date().getHours() : this.state.StartTime;
        let StartTimeMin = checkTime === 'now' ? new Date().getMinutes() : this.state.StartTimeMin;
        // StartTime:Services.returnCalculatedHours(new Date()),StartTimeMin:Services.returnCalculatedMinutes(new Date()),
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


    shiftDatePicker() {
        const self = this;
        try {
            const {action, year, month, day} = DatePickerAndroid.open({
                date: self.state.shiftDate,
                maxDate: new Date(),
                // minDate: self.state.shiftDate,
                // mode: 'spinner',
            }).then((response) => {
                if (response.action === "dateSetAction") {
                    let shiftDate = new Date(response.year, response.month, response.day)
                    self.setState({shiftDate: shiftDate});
                }
            });
        } catch ({code, message}) {
            console.warn('Cannot open date picker', message);
        }
    }

    filterDatePicker() {
        const self = this;
        try {
            const {action, year, month, day} = DatePickerAndroid.open({
                date: self.state.filterAdhocShiftDate,
                maxDate: new Date(),
                // mode: 'spinner',
            }).then((response) => {
                if (response.action === "dateSetAction") {
                    let tempDate = new Date()
                    tempDate = new Date(response.year, response.month, response.day)
                    self.setState({filterAdhocShiftDate: tempDate}, () => {
                        self.getCreatedShiftsList()
                    });
                }
            });
        } catch ({code, message}) {
            console.warn('Cannot open date picker', message);
        }
    }

    // validate PAN Number and get the beneficiary details
    validatePanNumber(panNumber, check) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_BENEFICIARY_DETAILS_BY_PAN + '?panNumber=' + _.toUpper(panNumber);
        const body = {};
        // console.log('validate PanNumber apiUrl', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response) {
                    // console.log('get pan user details resp200', response.data);
                    const panNumberStatus = response.data;
                    if (panNumberStatus.id) {
                        if (check === 'AlertNeeded') {
                            Alert.alert('Beneficiary already found for PAN number' + '(' + self.state.OwnerPanCardNumber + ')', Alert,
                                [
                                    {
                                        text: 'CANCEL', onPress: () => {
                                            self.setState({
                                                OwnerPanCardNumber: '',
                                                OwnerAccountName: '',
                                                OwnerAadharCardNumber: '',
                                                OwnerBankAccountNumber: '',
                                                OwnerBankIFSCcode: '',
                                                OwnerPanInfo: null,
                                                OwnerBeneficaryId: null,
                                                panImageURL: '',
                                                panCardFormData: '',
                                                userPanFound: false,
                                                BeneficiaryAadharImageURL: '',
                                                BeneficiaryBankProofImageURL: '',
                                                benAadharPicFormData: '',
                                                benBankProofPicFormData: '',
                                                showPanDetails: false
                                            })
                                        }
                                    },
                                    {
                                        text: 'ClICK TO CONTINUE', onPress: () => {
                                            self.setState({
                                                // OwnerPanCardNumber:panNumberStatus.panNumber,
                                                OwnerAccountName: panNumberStatus.beneficiaryName,
                                                OwnerAadharCardNumber: panNumberStatus.aadharCardNumber,
                                                OwnerBankAccountNumber: panNumberStatus.bankAccountNumber,
                                                OwnerBankIFSCcode: panNumberStatus.ifscCode,
                                                OwnerPanInfo: panNumberStatus.panUploadInfo,
                                                OwnerBeneficaryId: panNumberStatus.id,
                                                panImageURL: panNumberStatus.panUploadInfo ? panNumberStatus.panUploadInfo.panUploadUrl : '',
                                                panCardFormData: panNumberStatus.panUploadInfo,
                                                userPanFound: true,
                                                BeneficiaryAadharImageURL: panNumberStatus.aadharUploadInfo ? panNumberStatus.aadharUploadInfo.aadharUploadUrl : '',
                                                BeneficiaryBankProofImageURL: panNumberStatus.bankUploadInfo ? panNumberStatus.bankUploadInfo.bankUploadUrl : '',
                                                benAadharPicFormData: panNumberStatus.aadharUploadInfo,
                                                benBankProofPicFormData: panNumberStatus.bankUploadInfo,
                                                showPanDetails: true
                                            })
                                        }
                                    }
                                ]
                            )
                        }

                        self.checkBeneficaryDetails(panNumberStatus)

                        self.setState({panNumberDetails: panNumberStatus})

                    } else {
                        self.setState({
                            // OwnerPanCardNumber: '',
                            OwnerAccountName: '',
                            OwnerAadharCardNumber: '',
                            OwnerBankAccountNumber: '',
                            OwnerBankIFSCcode: '',
                            OwnerPanInfo: null,
                            OwnerBeneficaryId: null,
                            panImageURL: '',
                            panCardFormData: '',
                            userPanFound: false,
                            BeneficiaryAadharImageURL: '',
                            BeneficiaryBankProofImageURL: '',
                            benAadharPicFormData: '',
                            benBankProofPicFormData: '',
                            showPanDetails: true
                        })
                    }
                    self.setState({spinnerBool: false, panNumberStatus: panNumberStatus});
                }
            }, function (error) {
                // console.log("error", error, error.response);
                self.errorHandling(error)
            });
        });
    }

    checkBeneficaryDetails(details) {
        const self = this;
        // console.log('checkBeneficaryDetails fun start details', details);
        const beneficiaryData = details
        self.setState({
            spinnerBool: false,
            panNumberDetails: beneficiaryData,
            OwnerBeneficaryId: beneficiaryData.id ? beneficiaryData.id : beneficiaryData.beneficiaryId,
            OwnerPanCardNumber: beneficiaryData.panNumber,
            OwnerAccountName: beneficiaryData.beneficiaryName,
            OwnerAadharCardNumber: beneficiaryData.aadharCardNumber,
            OwnerBankAccountNumber: beneficiaryData.bankAccountNumber,
            OwnerPanInfo: beneficiaryData.panUploadInfo,
            OwnerBankIFSCcode: beneficiaryData.ifscCode,
            // panImageURL: beneficiaryData.panUploadInfo ? beneficiaryData.panUploadInfo.panUploadUrl : '',
            panImageURL: beneficiaryData.panUploadInfo ? beneficiaryData.panUploadInfo.panUploadUrl : beneficiaryData.panUploadUrl,
            panDoc: beneficiaryData.panUploadInfo,
            // userPanFound: beneficiaryData.id ? true : false,
            userPanFound: beneficiaryData.id ? beneficiaryData.id : beneficiaryData.beneficiaryId ? true : false,
            BeneficiaryAadharImageURL: beneficiaryData.aadharUploadInfo ? beneficiaryData.aadharUploadInfo.aadharUploadUrl : beneficiaryData.aadhaarUploadUrl,
            BeneficiaryBankProofImageURL: beneficiaryData.bankUploadInfo ? beneficiaryData.bankUploadInfo.bankUploadUrl : beneficiaryData.bankUploadUrl,
            benAadharPicFormData: beneficiaryData.aadharUploadInfo,
            benBankProofPicFormData: beneficiaryData.bankUploadInfo,
            showPanDetails: beneficiaryData.id ? beneficiaryData.id : beneficiaryData.beneficiaryId ? true : false
        })
        if (beneficiaryData.ifscCode) {
            self.checkBeneficaryIFSCCode(beneficiaryData.ifscCode)
        }

    }

    //API CALL TO CHECK Beneficary IFSC CODE
    checkBeneficaryIFSCCode(IFSCcode) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.VERIFY_IFSC_CODE + '?ifscCode=' + _.toUpper(IFSCcode);
        const body = '';
        // console.log('check Beneficary IFSCCode apiUrl', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response) {
                    // console.log('check Beneficary IFSCCode resp200', response.data);
                    self.setState({spinnerBool: false, BeneficaryIFSCverified: response.data});
                }
            }, function (error) {
                // console.log("check Beneficary IFSCCode error", error, error.response);
                self.errorHandling(error)
            });
        });
    }

    //Uploadig bank document
    bankDocumentUpload(uploadType) {
        const self = this;
        const data = self.state.imageType;
        Services.checkImageUploadPermissions(uploadType, (response) => {
            // console.log('service image retunr', response);
            let image = response.image
            let formData = response.formData
            let userImageUrl = image.path


            if (data === 'panCard') {
                self.setState({panCardFormData: formData, panImageURL: image.path, spinnerBool: false}, () => {
                    Utils.dialogBox('Uploaded successfully', '');
                });
            } else if (data === 'BeneficiaryBankProofUpload') {
                self.setState({
                    benBankProofPicFormData: formData,
                    BeneficiaryBankProofImageURL: image.path,
                    spinnerBool: false
                }, () => {
                    Utils.dialogBox('Uploaded successfully', '');
                });
            } else if (data === 'BeneficiaryAadharUpload') {
                self.setState({
                    benAadharPicFormData: formData,
                    BeneficiaryAadharImageURL: image.path,
                    spinnerBool: false
                }, () => {
                    Utils.dialogBox('Uploaded successfully', '');
                });
            } else if (data === 'USER_BANK_PASSBOOK') {
                self.setState({
                    userBankPassbookUrl: image.path,
                    userBankPassbookFormData: formData,
                    spinnerBool: false
                }, () => {
                    Utils.dialogBox('Uploaded successfully', '');
                });
            } else if (data === 'USER_OTHER_BANK_PASSBOOK') {
                self.setState({
                    userOtherBankPassbookUrl: image.path,
                    userOtherBankPassbookFormData: formData,
                    spinnerBool: false
                }, () => {
                    Utils.dialogBox('Uploaded successfully', '');
                });
            } else if (data === 'LITE_USER_PHOTO') {
                self.setState({
                    userImageUrl: image.path,
                    userImageFormData: formData,
                    spinnerBool: false
                }, () => {
                    Utils.dialogBox('Uploaded successfully', '');
                });
            }

            if (data === 'panCard' || data === 'BeneficiaryBankProofUpload' || data === 'BeneficiaryAadharUpload') {
                if (self.state.userPanFound) {
                    self.uploadBankImages(data, formData)
                }
            }


        })
    };

    uploadBankImages(data, formData) {
        const self = this;
        let INFO;
        if (data === 'BeneficiaryBankProofUpload') {
            INFO = Config.routes.BENEFICIARY_BANK_PROOF_UPLOAD + '?&beneficiaryId=' + self.state.OwnerBeneficaryId;
        } else if (data === 'BeneficiaryAadharUpload') {
            INFO = Config.routes.BENEFICIARY_AADHAR_PIC_UPLOAD + '?&beneficiaryId=' + self.state.OwnerBeneficaryId;
        } else if (data === 'panCard') {
            INFO = Config.routes.BENEFICIARY_PAN_PIC_UPLOAD + '?&beneficiaryId=' + self.state.OwnerBeneficaryId;
        }
        let imageUploadURL = Config.routes.BASE_URL + INFO;
        const body = formData;
        // console.log(' image upload url', imageUpload URL, 'body===', body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthProfileHTTPRequest(imageUploadURL, 'POST', body, function (response) {
                // console.log("bank DocumentUpload resp", response);
                if (response.status === 200) {

                    if (data === 'BeneficiaryBankProofUpload') {
                        if (self.state.benAadharPicFormData) {
                            self.uploadBankImages('BeneficiaryAadharUpload', self.state.benAadharPicFormData)
                        } else {
                            self.setState({
                                spinnerBool: false,
                                canUpdateData: true,
                                errorBankAccountNumber: null,
                                errorVerifyBankAccountNumber: null,
                                errorIFSCcode: null,
                                errorBankName: null,
                                errorAccountHolderName: null,
                                OwnerBeneficaryId: self.state.benCreatedResponse.beneficiaryId,
                                ShowAddBankDetailsModal: false
                            }, () => {
                                Utils.dialogBox('Beneficiary Created Succesfully', '');
                            });
                        }
                    } else {
                        self.setState({
                            spinnerBool: false,
                            canUpdateData: true,
                            errorBankAccountNumber: null,
                            errorVerifyBankAccountNumber: null,
                            errorIFSCcode: null,
                            errorBankName: null,
                            errorAccountHolderName: null,
                            OwnerBeneficaryId: self.state.benCreatedResponse.beneficiaryId,
                            ShowAddBankDetailsModal: false
                        }, () => {
                            Utils.dialogBox('Beneficiary Created Succesfully', '');
                        });
                    }

                }
            }, function (error) {
                // console.log("bank DocumentUpload   img error", error.response, error);
                self.errorHandling(error)
            });
        });
    }

    validateOwnerInfo() {
        this.setState({mandatoryChecks: false})
        let resp;
        let result = {};
        result.beneficiaryDetails = {};
        // let result = {data, beneficiaryDetails: {}};
        resp = Utils.isValidPAN(this.state.OwnerPanCardNumber);
        if (resp.status === true) {
            result.beneficiaryDetails.panCardNumber = resp.message;
            this.setState({errorPanMessage: null});
            resp = Utils.isValidIFSCCode(this.state.OwnerBankIFSCcode);
            if (resp.status === true) {
                if (this.state.BeneficaryIFSCverified === true) {
                    result.beneficiaryDetails.beneficiaryIFSCcode = resp.message;
                    this.setState({errorBeneficiaryIFSCcode: null});
                    resp = Utils.isValidBeneficiary(this.state.OwnerAccountName);
                    if (resp.status === true) {
                        result.beneficiaryDetails.beneficiaryOwnerName = resp.message;
                        this.setState({errorBeneficiaryName: null});
                        resp = Utils.isValidBankAccountNumber(this.state.OwnerBankAccountNumber);
                        if (resp.status === true) {
                            result.beneficiaryDetails.beneficiaryAccountNum = resp.message;
                            this.setState({errorBeneficiaryAccountNumber: null});

                            // resp = Utils.isValueSelected(this.state.panCardFormData, 'Please upload Beneficiary PAN Image');
                            // if (resp.status === true) {
                            //     resp = Utils.isValueSelected(this.state.BeneficiaryBankProofImageURL, 'Please upload Beneficiary Bank Proof Image');
                            //     if (resp.status === true) {

                            result.beneficiaryDetails.aadharCardNumber = this.state.OwnerAadharCardNumber;
                            result.beneficiaryDetails.panCardPhoto = this.state.panCardFormData;

                            this.setState({mandatoryChecks: true}, () => {
                                this.createBeneficary();
                            })

                            //     } else {
                            //         Utils.dialogBox(resp.message, '')
                            //     }
                            // } else {
                            //     Utils.dialogBox(resp.message, '')
                            // }
                        } else {
                            this.OwnerBankAccountNumber.focus();
                            this.setState({errorBeneficiaryAccountNumber: resp.message});
                        }
                    } else {
                        this.OwnerAccountName.focus();
                        this.setState({errorBeneficiaryName: resp.message});
                    }
                } else {
                    this.OwnerBankIFSCcode.focus();
                    // this.checkBeneficaryIFSCCode(this.state.OwnerBankIFSCcode)
                    this.setState({errorBeneficiaryIFSCcode: 'Please enter Verified IFSC Code'});
                }
            } else {
                this.OwnerBankIFSCcode.focus();
                this.setState({errorBeneficiaryIFSCcode: resp.message});
            }
        } else {
            this.OwnerPanCardNumber.focus();
            this.setState({errorPanMessage: resp.message});
        }

    }

    //API CALL TO CREATE BENEFICARY
    createBeneficary() {
        const self = this;
        const beneficiaryName = self.state.OwnerAccountName;
        const beneficiaryPanNumber = self.state.OwnerPanCardNumber;
        const beneficiaryAadharCardNumber = self.state.OwnerAadharCardNumber ? self.state.OwnerAadharCardNumber : '';
        const beneficiaryBankAccountNumber = self.state.OwnerBankAccountNumber;
        const beneficiaryIfscCode = self.state.OwnerBankIFSCcode;

        const apiURL = Config.routes.BASE_URL + Config.routes.CREATE_BENEFICARY +
            '?beneficiaryName=' + beneficiaryName + '&panNumber=' + beneficiaryPanNumber + '&aadharCardNumber=' + beneficiaryAadharCardNumber
            + '&bankAccountNumber=' + beneficiaryBankAccountNumber + '&ifscCode=' + beneficiaryIfscCode + '&fieldName=panUploadInfo';

        const body = self.state.panCardFormData;
        // console.log('create Beneficary apiURL', apiURL, 'body==', body);
        this.setState({spinnerBool: true, mandatoryChecks: true}, () => {
            Services.AuthHTTPRequest(apiURL, 'POST', body, function (response) {
                // console.log('create Beneficary resp ', response);
                if (response.status === 200) {
                    // console.log('bank updated resp200', response.data);
                    if (self.state.benBankProofPicFormData || self.state.benAadharPicFormData) {
                        self.setState({
                            OwnerBeneficaryId: response.data.beneficiaryId,
                            benCreatedResponse: response.data,
                            spinnerBool: false
                        }, () => {
                            if (self.state.benBankProofPicFormData) {
                                self.uploadBankImages('BeneficiaryBankProofUpload', self.state.benBankProofPicFormData)
                            } else if (self.state.benAadharPicFormData) {
                                self.uploadBankImages('BeneficiaryAadharUpload', self.state.benAadharPicFormData)
                            }
                        })
                    } else {
                        self.setState({
                            spinnerBool: false,
                            canUpdateData: true,
                            errorBankAccountNumber: null,
                            errorVerifyBankAccountNumber: null,
                            errorIFSCcode: null,
                            errorBankName: null,
                            errorAccountHolderName: null,
                            OwnerBeneficaryId: response.data.beneficiaryId,
                            ShowAddBankDetailsModal: false
                        }, () => {
                            Utils.dialogBox('Beneficiary Created Succesfully', '');
                        });
                    }
                }
            }, function (error) {
                // console.log('create Beneficary error', error.response);
                self.errorHandling(error)
            });
        });
    };

    //API CALL TO CHECK IFSC CODE
    checkIFSCCode(IFSCcode) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.VERIFY_IFSC_CODE + '?ifscCode=' + _.toUpper(IFSCcode);
        const body = '';
        // console.log('check IFSCCode apiUrl', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response) {
                    // console.log('check IFSCCode resp200', response.data);
                    self.setState({spinnerBool: false, IFSCverified: response.data});
                }
            }, function (error) {
                // console.log("check IFSCCode error", error, error.response);
                self.errorHandling(error)
            });
        });
    }

    //VALIDATING USER BANK ACCOUNT DETAILS
    validateUserBankDetails() {
        let resp;
        let result = {};
        resp = Utils.isValidIFSCCode(this.state.IFSCcode);
        if (resp.status === true) {
            if (this.state.IFSCverified === true) {
                result.ifscCode = resp.message;
                this.setState({errorIFSCcode: null});
                resp = Utils.isValidBank(this.state.BankName);
                if (resp.status === true) {
                    result.bankName = resp.message;
                    this.setState({errorBankName: null});
                    resp = Utils.isValidBankAccountNumber(this.state.BankAccountNumber);
                    if (resp.status === true) {
                        result.accountNUmber = resp.message;
                        result.accountNumber = resp.message;
                        this.setState({errorBankAccountNumber: null});
                        resp = Utils.isValidCompareBankAccountNumber(this.state.BankAccountNumber, this.state.VerifyBankAccountNumber);
                        if (resp.status === true) {
                            this.setState({errorVerifyBankAccountNumber: null});
                            resp = Utils.isValidPAN(this.state.userBankPanCardNumber);
                            if (resp.status === true) {
                                result.pan = resp.message;
                                this.setState({userErrorPanMessage: null});
                                resp = Utils.isValidBeneficiary(this.state.AccountHolderName);
                                if (resp.status === true) {
                                    result.beneficiaryName = resp.message;
                                    this.setState({errorAccountHolderName: null});
                                    resp = Utils.isValueSelected(this.state.userBankPassbookUrl, 'Please upload Bank Passbook Image');
                                    if (resp.status === true) {
                                        result.accountType = this.state.AccountType
                                        result.branchName = this.state.BankBranchName
                                        result.branchAddress = this.state.BranchAddress

                                        // userBankPassbookUrl:'',
                                        //     userBankPassbookFormData: '',
                                        // console.log('User bank details saved==',result)

                                        this.setState({userBankDetailsInfo: result, userBankInfoCreated: true}, () => {
                                            Utils.dialogBox('User Bank Details Saved', '')
                                        })

                                    } else {
                                        Utils.dialogBox(resp.message, '');
                                    }
                                } else {
                                    this.AccountHolderName.focus();
                                    this.setState({errorAccountHolderName: resp.message});
                                }
                            } else {
                                this.userBankPanCardNumber.focus();
                                this.setState({userErrorPanMessage: resp.message});
                            }
                        } else {
                            this.VerifyBankAccountNumber.focus();
                            this.setState({errorVerifyBankAccountNumber: resp.message});
                        }
                    } else {
                        this.BankAccountNumber.focus();
                        this.setState({errorBankAccountNumber: resp.message});
                    }
                } else {
                    this.BankName.focus();
                    this.setState({errorBankName: resp.message});
                }
            } else {
                this.IFSCcode.focus();
                this.setState({errorIFSCcode: 'Please enter Verified IFSC Code'});
            }
        } else {
            this.IFSCcode.focus();
            this.setState({errorIFSCcode: resp.message});
        }
    }

    userBankCreateInfo() {
        return (
            <View style={[Styles.flex1]}>
                {/*BANK DETAILS VIEW*/}
                <ScrollView style={[Styles.padH15]}>

                    {/*IFSC CODE*/}
                    <View>
                        <View style={[Styles.row, Styles.mTop5]}>
                            <View
                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.ifscIcon}</View>
                            <Text
                                style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter, Styles.colorBlue]}>Bank's
                                IFSC Code{Services.returnRedStart()}</Text>
                        </View>
                        <View
                            style={[Styles.row, Styles.mRt30, Styles.mLt40]}>
                            <TextInput
                                style={[
                                    {textTransform: 'uppercase'},
                                    Styles.bgWhite, Styles.padH5, Styles.colorBlue]}
                                autoCapitalize='characters'
                                placeholder='A B C D 1 2 3 4 5 6 7'
                                mode='outlined'
                                autoCompleteType='off'
                                blurOnSubmit={false}
                                ref={(input) => {
                                    this.IFSCcode = input;
                                }}
                                onSubmitEditing={() => {
                                    Keyboard.dismiss()
                                }}
                                value={this.state.IFSCcode}
                                returnKeyType="next"
                                onChangeText={(IFSCcode) => this.setState({IFSCcode}, () => {
                                    let resp;
                                    resp = Utils.isValidIFSCCode(this.state.IFSCcode);
                                    if (resp.status === true) {
                                        this.setState({errorIFSCcode: null}, () => {
                                            this.checkIFSCCode(this.state.IFSCcode)
                                        });
                                    } else {
                                        this.setState({errorIFSCcode: resp.message});
                                    }
                                })}/>


                            <TouchableOpacity
                                onPress={() => this.checkIFSCCode(this.state.IFSCcode)}
                                disabled={!this.state.IFSCcode ? true :
                                    this.state.errorIFSCcode ? true : false}
                                style={[Styles.br5, Styles.aslCenter, Styles.mLt10, this.state.errorIFSCcode ? Styles.bgDisabled : Styles.bgBlk]}>
                                <Text
                                    style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMextrabold, Styles.cWhite,]}>Validate</Text>
                            </TouchableOpacity>

                        </View>
                        {
                            this.state.errorIFSCcode ?
                                <Text style={{
                                    color: 'red',
                                    fontFamily: 'Muli-Regular',
                                    paddingLeft: 30, marginBottom: 5
                                }}>{this.state.errorIFSCcode}</Text>
                                :
                                this.state.IFSCcode && this.state.IFSCverified === false ?
                                    Services.returnIFSCStatusView('NotVerified')
                                    :
                                    this.state.IFSCcode && this.state.IFSCverified === true
                                        ?
                                        Services.returnIFSCStatusView('Verified')
                                        : null
                        }
                    </View>

                    {/*BANK NAME*/}
                    <View>
                        <View style={[Styles.row, Styles.mTop5]}>
                            <View
                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.bankNew}</View>
                            <Text
                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.colorBlue]}>Bank
                                Name{Services.returnRedStart()}</Text>
                        </View>
                        <TextInput
                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm0, Styles.f16, Styles.colorBlue]}
                            placeholder='Enter Bank Name'
                            autoCompleteType='off'
                            mode={'outlined'}
                            autoCapitalize="none"
                            blurOnSubmit={false}
                            value={this.state.BankName}
                            returnKeyType="done"
                            ref={(input) => {
                                this.BankName = input;
                            }}
                            onSubmitEditing={() => {
                                Keyboard.dismiss()
                            }}
                            onChangeText={(BankName) => this.setState({BankName}, () => {
                                let resp;
                                resp = Utils.isValidBank(this.state.BankName);
                                if (resp.status === true) {
                                    this.setState({errorBankName: null});
                                } else {
                                    this.setState({errorBankName: resp.message});
                                }
                            })}/>
                        {
                            this.state.errorBankName ?
                                <Text style={{
                                    color: 'red',
                                    fontFamily: 'Muli-Regular',
                                    paddingLeft: 20, marginBottom: 10
                                }}>{this.state.errorBankName}</Text>
                                :
                                null
                        }
                    </View>

                    {/*/!*BANK's BRANCH NAME*!/*/}
                    <View>
                        <View style={[Styles.row, Styles.mTop5]}>
                            <View
                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.bankNew}</View>
                            <Text
                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.colorBlue]}>Bank's
                                Branch Name </Text>
                        </View>
                        <TextInput
                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm0, Styles.f16, Styles.colorBlue]}
                            placeholder='Enter Bank Branch Name'
                            autoCompleteType='off'
                            mode={'outlined'}
                            autoCapitalize="none"
                            blurOnSubmit={false}
                            value={this.state.BankBranchName}
                            returnKeyType="done"
                            ref={(input) => {
                                this.BankBranchName = input;
                            }}
                            onSubmitEditing={() => {
                                Keyboard.dismiss()
                            }}
                            onChangeText={(BankBranchName) => this.setState({BankBranchName})}/>
                    </View>

                    {/*/!*BANK's ADDRESS*!/*/}
                    <View>
                        <View style={[Styles.row, Styles.mTop5]}>
                            <View
                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.bankNew}</View>
                            <Text
                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.colorBlue]}>Branch's
                                Address </Text>
                        </View>
                        <TextInput
                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm0, Styles.f16, Styles.colorBlue]}
                            placeholder='Enter Branch Address'
                            multiline={true}
                            autoCompleteType='off'
                            mode={'outlined'}
                            autoCapitalize="none"
                            blurOnSubmit={false}
                            value={this.state.BranchAddress}
                            returnKeyType="done"
                            ref={(input) => {
                                this.BranchAddress = input;
                            }}
                            onSubmitEditing={() => {
                                Keyboard.dismiss()
                            }}
                            onChangeText={(BranchAddress) => this.setState({BranchAddress})}/>
                    </View>

                    {/*ACCOUNT NUMBER*/}
                    <View>
                        <View style={[Styles.row, Styles.mTop5]}>
                            <View
                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.bankAccIcon}</View>
                            <Text
                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.colorBlue]}>Account
                                Number{Services.returnRedStart()}</Text>
                        </View>
                        <TextInput
                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm0, Styles.f16, Styles.colorBlue]}
                            placeholder='Enter account number'
                            autoCompleteType='off'
                            mode={'outlined'}
                            autoCapitalize="none"
                            blurOnSubmit={false}
                            keyboardType='numeric'
                            value={this.state.BankAccountNumber}
                            returnKeyType="done"
                            ref={(input) => {
                                this.BankAccountNumber = input;
                            }}
                            onSubmitEditing={() => {
                                Keyboard.dismiss()
                            }}
                            onChangeText={(BankAccountNumber) => this.setState({BankAccountNumber}, () => {
                                let resp;
                                resp = Utils.isValidBankAccountNumber(this.state.BankAccountNumber);
                                if (resp.status === true) {
                                    this.setState({errorBankAccountNumber: null});
                                } else {
                                    this.setState({errorBankAccountNumber: resp.message});
                                }
                            })}/>
                        {
                            this.state.errorBankAccountNumber ?
                                <Text style={{
                                    color: 'red',
                                    fontFamily: 'Muli-Regular',
                                    paddingLeft: 20, marginBottom: 10
                                }}>{this.state.errorBankAccountNumber}</Text>
                                :
                                null
                        }
                    </View>

                    {/*CONFIRM ACCOUNT NUMBER*/}
                    <View>
                        <View style={[Styles.row, Styles.mTop5]}>
                            <View
                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.bankAccIcon}</View>
                            <Text
                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.colorBlue]}>Re-Write
                                Account Number{Services.returnRedStart()}</Text>
                        </View>
                        <TextInput
                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm0, Styles.f16, Styles.colorBlue]}
                            placeholder='Confirm account number'
                            autoCompleteType='off'
                            mode={'outlined'}
                            autoCapitalize="none"
                            blurOnSubmit={false}
                            keyboardType='numeric'
                            value={this.state.VerifyBankAccountNumber}
                            returnKeyType="done"
                            ref={(input) => {
                                this.VerifyBankAccountNumber = input;
                            }}
                            onSubmitEditing={() => {
                                Keyboard.dismiss()
                            }}
                            onChangeText={(VerifyBankAccountNumber) => this.setState({VerifyBankAccountNumber}, () => {
                                let resp;
                                resp = Utils.isValidCompareBankAccountNumber(this.state.BankAccountNumber, this.state.VerifyBankAccountNumber);
                                if (resp.status === true) {
                                    this.setState({errorVerifyBankAccountNumber: null});
                                } else {
                                    this.setState({errorVerifyBankAccountNumber: resp.message});
                                }
                            })}/>
                        {
                            this.state.errorVerifyBankAccountNumber ?
                                <Text style={{
                                    color: 'red',
                                    fontFamily: 'Muli-Regular',
                                    paddingLeft: 20, marginBottom: 10
                                }}>{this.state.errorVerifyBankAccountNumber}</Text>
                                :
                                null
                        }
                    </View>

                    {/*PAN CARD*/}
                    <View>
                        <View
                            style={[Styles.row, Styles.mTop5]}>
                            <View
                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.panIcon}</View>
                            <Text
                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.colorBlue]}>
                                PAN Card
                                Number{Services.returnRedStart()}
                            </Text>
                        </View>
                        <View style={{paddingLeft: 40}}>
                            <TextInput
                                style={[{
                                    textTransform: 'uppercase',
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#ccc',
                                }, Styles.f16, Styles.colorBlue]}
                                placeholder='Ex:ABCDE1234C'
                                mode={'outlined'}
                                autoCapitalize='characters'
                                returnKeyType="done"
                                ref={(input) => {
                                    this.userBankPanCardNumber = input;
                                }}
                                onSubmitEditing={() => {
                                    Keyboard.dismiss()
                                }}
                                value={this.state.userBankPanCardNumber}
                                onChangeText={(number) => this.setState({userBankPanCardNumber: number}, function () {
                                    let resp;
                                    resp = Utils.isValidPAN(this.state.userBankPanCardNumber);
                                    if (resp.status === true) {
                                        this.setState({userErrorPanMessage: null});
                                    } else {
                                        this.setState({
                                            userErrorPanMessage: resp.message,
                                        });
                                    }
                                })}
                            />
                            {
                                this.state.userErrorPanMessage ?
                                    <Text style={{
                                        color: 'red',
                                        fontFamily: 'Muli-Regular',
                                        marginBottom: 5
                                    }}>{this.state.userErrorPanMessage}</Text>
                                    :
                                    null
                            }
                        </View>
                    </View>

                    {/*ACCOUNT TYPE*/}
                    <View>
                        <View style={[Styles.row, Styles.mTop5]}>
                            <View
                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.bankAccIcon}</View>
                            <Text
                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.colorBlue]}>Account
                                Type</Text>
                        </View>
                        <View
                            style={[Styles.row, Styles.marV10, Styles.mRt30, Styles.mLt40,]}>
                            <TouchableOpacity
                                style={[Styles.bw1, Styles.br20, Styles.aslCenter, this.state.AccountType === 'Savings' ? [Styles.bcRed, Styles.bgRed] : [Styles.bcBlk, Styles.bgWhite]]}
                                onPress={() => {
                                    this.setState({AccountType: 'Savings'})
                                }}>
                                <Text
                                    style={[Styles.f16, Styles.padH10, Styles.padV5, this.state.AccountType === 'Savings' ? Styles.cWhite : Styles.colorBlue, Styles.ffMbold]}>Savings</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[Styles.marH20, Styles.bw1, Styles.br20, Styles.aslCenter, this.state.AccountType === 'Current' ? [Styles.bcRed, Styles.bgRed] : [Styles.bcBlk, Styles.bgWhite]]}
                                onPress={() => {
                                    this.setState({AccountType: 'Current'})
                                }}>
                                <Text
                                    style={[Styles.f16, Styles.padH10, Styles.padV5, this.state.AccountType === 'Current' ? Styles.cWhite : Styles.colorBlue, Styles.ffMbold]}>Current</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/*Account Holder NAME*/}
                    <View>
                        <View style={[Styles.row, Styles.mTop5]}>
                            <View
                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.userIconVoilet}</View>
                            <Text
                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.colorBlue]}>
                                Account Holder Name{Services.returnRedStart()}
                            </Text>
                        </View>
                        <TextInput
                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm0, Styles.f16, Styles.colorBlue]}
                            placeholder='Full Name'
                            autoCompleteType='off'
                            mode={'outlined'}
                            autoCapitalize="none"
                            blurOnSubmit={false}
                            value={this.state.AccountHolderName}
                            returnKeyType="done"
                            ref={(input) => {
                                this.AccountHolderName = input;
                            }}
                            onSubmitEditing={() => {
                                Keyboard.dismiss()
                            }}
                            onChangeText={(AccountHolderName) => this.setState({AccountHolderName}, () => {
                                let resp;
                                resp = Utils.isValidBeneficiary(this.state.AccountHolderName);
                                if (resp.status === true) {
                                    this.setState({errorAccountHolderName: null});
                                } else {
                                    this.setState({errorAccountHolderName: resp.message});
                                }
                            })}/>
                        {
                            this.state.errorAccountHolderName ?
                                <Text style={{
                                    color: 'red',
                                    fontFamily: 'Muli-Regular',
                                    paddingLeft: 20, marginBottom: 10
                                }}>{this.state.errorAccountHolderName}</Text>
                                :
                                null
                        }
                    </View>

                    {/*Upload BANK PROOF PIC*/}
                    <View>
                        <View
                            style={[Styles.row, Styles.aitCenter, Styles.marV5,]}>
                            <TouchableOpacity
                                onPress={() => {
                                    this.setState({
                                        imageType: 'USER_BANK_PASSBOOK',
                                        imageSelectionModal: true
                                    })
                                }}
                                activeOpacity={0.7}
                                style={[Styles.row, Styles.bgLYellow, Styles.br5, Styles.aslCenter, Styles.p5,]}>
                                {LoadSVG.cameraPic}
                                <Text
                                    style={[Styles.f16, this.state.documentOneUrl ? Styles.cDisabled : Styles.colorBlue, Styles.ffLBold, Styles.pRight15]}>Upload
                                    Bank Passbook{Services.returnRedStart()}</Text>
                            </TouchableOpacity>
                            {
                                this.state.userBankPassbookUrl && this.state.userBankInfoCreated === false
                                    ?
                                    <TouchableOpacity
                                        onPress={() => {
                                            this.setState({
                                                picUploaded: false,
                                                userBankPassbookUrl: '',
                                                userBankPassbookFormData: ''
                                            })
                                        }}
                                        style={[Styles.bw1, Styles.br5, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                        <Text
                                            style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffLBold, Styles.cWhite]}>Delete</Text>
                                    </TouchableOpacity>
                                    :
                                    null
                            }
                        </View>

                        {
                            this.state.userBankPassbookUrl
                                ?
                                <View
                                    style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                    <TouchableOpacity
                                        style={[Styles.row, Styles.aslCenter]}
                                        onPress={() => {
                                            this.setState({
                                                imagePreview: true,
                                                imagePreviewURL: this.state.userBankPassbookUrl
                                            })
                                        }}>
                                        <Image
                                            onLoadStart={() => this.setState({imageLoading: true})}
                                            onLoadEnd={() => this.setState({imageLoading: false})}
                                            style={[{
                                                width: Dimensions.get('window').width / 2,
                                                height: 120
                                            }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                            source={this.state.userBankPassbookUrl ? {uri: this.state.userBankPassbookUrl} : null}
                                        />
                                        {/*<MaterialCommunityIcons name="resize"*/}
                                        {/*                        size={24}*/}
                                        {/*                        color="black"/>*/}
                                        {Services.returnZoomIcon()}
                                    </TouchableOpacity>
                                    <ActivityIndicator
                                        style={[Styles.ImageUploadActivityIndicator]}
                                        animating={this.state.imageLoading}
                                    />
                                </View>
                                :
                                null
                        }
                    </View>
                </ScrollView>

                <TouchableOpacity
                    onPress={() => {
                        this.validateUserBankDetails();
                    }}
                    style={[Styles.bgDarkRed, Styles.p10, Styles.m3, Styles.br10,]}>
                    <Text
                        style={[Styles.aslCenter, Styles.cWhite, Styles.padV5, Styles.ffMbold, Styles.f16]}>SAVE</Text>
                </TouchableOpacity>
            </View>
        )
    }

    beneficiaryCreateInfo() {
        const {
            userDetails,
            allowOtherFields,
            userPanFound,
            canEditTextInput,
            panNumberDetails,
            beneficiaryDetailsFound,
            createdAdhocList
        } = this.state;
        return (
            <View style={[Styles.flex1, Styles.padH10]}>
                {/*BENEFICIARY DETAILS VIEW*/}
                <ScrollView style={[Styles.flex1]}>
                    <View style={[Styles.flex1]}>
                        {/*PAN CARD*/}
                        <View>
                            <View
                                style={[Styles.row, Styles.mTop15]}>
                                <View
                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.panIcon}</View>
                                <Text
                                    style={[Styles.f18, Styles.ffMbold, Styles.aslCenter,
                                        canEditTextInput === false && checkProfileField.beneficiaryInfo.panNumber ? Styles.cDisabled : Styles.colorBlue]}>
                                    PAN Card
                                    Number{Services.returnRedStart()}
                                </Text>
                            </View>
                            <View style={{paddingLeft: 40}}>
                                <TextInput
                                    editable={!(canEditTextInput === false && checkProfileField.beneficiaryInfo.panNumber)}
                                    style={[{
                                        textTransform: 'uppercase',
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#ccc',
                                    }, Styles.f16,
                                        canEditTextInput === false && checkProfileField.beneficiaryInfo.panNumber ? Styles.cDisabled : Styles.colorBlue]}
                                    placeholder='Ex:ABCDE1234C'
                                    mode={'outlined'}
                                    autoCapitalize='characters'
                                    returnKeyType="done"
                                    ref={(input) => {
                                        this.OwnerPanCardNumber = input;
                                    }}
                                    onSubmitEditing={() => {
                                        Keyboard.dismiss()
                                    }}
                                    value={this.state.OwnerPanCardNumber}
                                    onChangeText={(number) => this.setState({OwnerPanCardNumber: number}, function () {
                                        let resp;
                                        resp = Utils.isValidPAN(this.state.OwnerPanCardNumber);
                                        if (resp.status === true) {
                                            this.setState({errorPanMessage: null});
                                            {
                                                this.validatePanNumber(this.state.OwnerPanCardNumber, 'AlertNeeded')
                                            }
                                        } else {
                                            this.setState({
                                                errorPanMessage: resp.message,
                                                showPanDetails: false
                                            });
                                        }
                                    })}
                                />
                                {
                                    this.state.errorPanMessage ?
                                        <Text style={{
                                            color: 'red',
                                            fontFamily: 'Muli-Regular',
                                            marginBottom: 5
                                        }}>{this.state.errorPanMessage}</Text>
                                        :
                                        null
                                }
                            </View>
                        </View>

                        {/*Beneficiary IFSC CODE*/}
                        <View>
                            <View
                                style={[Styles.row, Styles.mTop15]}>
                                <View
                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.ifscIcon}</View>
                                <Text
                                    style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, userPanFound ? Styles.cDisabled : Styles.colorBlue]}>Bank's
                                    IFSC
                                    Code{Services.returnRedStart()}</Text>
                            </View>
                            <View
                                style={[Styles.row, Styles.mRt30, Styles.mLt40]}>
                                <TextInput
                                    style={[
                                        {textTransform: 'uppercase'},
                                        Styles.marV5, Styles.bgWhite, Styles.padH15, userPanFound ? Styles.cDisabled : Styles.colorBlue]}
                                    autoCapitalize='characters'
                                    placeholder='ex:A B C D 1 2 3 4 5 6 7'
                                    mode={'outlined'}
                                    editable={!userPanFound}
                                    theme={{colors: {text: userPanFound ? '#cccccc' : '#233167'}}}
                                    autoCompleteType='off'
                                    // placeholderTextColor='#233167'
                                    blurOnSubmit={false}
                                    ref={(input) => {
                                        this.OwnerBankIFSCcode = input;
                                    }}
                                    onSubmitEditing={() => {
                                        Keyboard.dismiss()
                                    }}
                                    value={this.state.OwnerBankIFSCcode}
                                    returnKeyType="done"
                                    onChangeText={(OwnerBankIFSCcode) => this.setState({OwnerBankIFSCcode}, () => {
                                        let resp;
                                        resp = Utils.isValidIFSCCode(this.state.OwnerBankIFSCcode);
                                        if (resp.status === true) {
                                            this.setState({errorBeneficiaryIFSCcode: null}, () => {
                                                this.checkBeneficaryIFSCCode(this.state.OwnerBankIFSCcode)
                                            });
                                        } else {
                                            this.setState({errorBeneficiaryIFSCcode: resp.message});
                                        }
                                    })}/>
                                <TouchableOpacity
                                    onPress={() => this.checkBeneficaryIFSCCode(this.state.OwnerBankIFSCcode)}
                                    disabled={!this.state.OwnerBankIFSCcode ? true :
                                        this.state.errorBeneficiaryIFSCcode ? true : false}
                                    style={[Styles.br5, Styles.aslCenter, Styles.mLt10, this.state.errorBeneficiaryIFSCcode ? Styles.bgDisabled : Styles.bgBlk,
                                        {display: userPanFound ? "none" : 'flex'}]}>
                                    <Text
                                        style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMextrabold, Styles.cWhite,]}>Validate</Text>
                                </TouchableOpacity>

                            </View>
                            {
                                this.state.errorBeneficiaryIFSCcode ?
                                    <Text style={{
                                        color: 'red',
                                        fontFamily: 'Muli-Regular',
                                        paddingLeft: 30,
                                        marginBottom: 5
                                    }}>{this.state.errorBeneficiaryIFSCcode}</Text>
                                    :
                                    this.state.OwnerBankIFSCcode && this.state.BeneficaryIFSCverified === false ?
                                        Services.returnIFSCStatusView('NotVerified')
                                        :
                                        this.state.OwnerBankIFSCcode && this.state.BeneficaryIFSCverified === true
                                            ?
                                            Services.returnIFSCStatusView('Verified')
                                            : null
                            }
                        </View>

                        {/*OWNER NAME*/}
                        <View style={[Styles.mBtm10]}>
                            <View
                                style={[Styles.row, Styles.mTop15]}>
                                <View
                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.userIconVoilet}</View>
                                <Text
                                    style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, userPanFound ? Styles.cDisabled : Styles.colorBlue]}>
                                    Beneficiary
                                    Name{Services.returnRedStart()}
                                </Text>
                            </View>
                            <View style={{paddingLeft: 40}}>
                                <TextInput
                                    style={[{
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#ccc',
                                    }, Styles.f16, userPanFound ? Styles.cDisabled : Styles.colorBlue]}
                                    placeholder='Beneficiary Name'
                                    mode={'outlined'}
                                    autoCompleteType='off'
                                    editable={!userPanFound}
                                    theme={{colors: {text: userPanFound ? '#cccccc' : '#233167'}}}
                                    autoCapitalize="none"
                                    blurOnSubmit={false}
                                    value={this.state.OwnerAccountName}
                                    returnKeyType="done"
                                    ref={(input) => {
                                        this.OwnerAccountName = input;
                                    }}
                                    onSubmitEditing={() => {
                                        Keyboard.dismiss()
                                    }}
                                    onChangeText={(OwnerAccountName) => this.setState({OwnerAccountName}, () => {
                                        let resp;
                                        resp = Utils.isValidBeneficiary(this.state.OwnerAccountName);
                                        if (resp.status === true) {
                                            this.setState({errorBeneficiaryName: null});
                                        } else {
                                            this.setState({errorBeneficiaryName: resp.message});
                                        }
                                    })}/>
                                {
                                    this.state.errorBeneficiaryName ?
                                        <Text style={{
                                            color: 'red',
                                            fontFamily: 'Muli-Regular',
                                            marginBottom: 10
                                        }}>{this.state.errorBeneficiaryName}</Text>
                                        :
                                        null
                                }
                            </View>
                        </View>

                        {/*ACCOUNT NUMBER*/}
                        <View>
                            <View
                                style={[Styles.row, Styles.mTop15]}>
                                <View
                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.bankAccIcon}</View>
                                <Text
                                    style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, userPanFound ? Styles.cDisabled : Styles.colorBlue]}>Account
                                    Number{Services.returnRedStart()}</Text>
                            </View>
                            <TextInput
                                style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.f16, userPanFound ? Styles.cDisabled : Styles.colorBlue]}
                                placeholder='Enter account number'
                                autoCompleteType='off'
                                mode={'outlined'}
                                editable={!userPanFound}
                                theme={{colors: {text: userPanFound ? '#cccccc' : '#233167'}}}
                                autoCapitalize="none"
                                blurOnSubmit={false}
                                keyboardType='numeric'
                                value={this.state.OwnerBankAccountNumber}
                                returnKeyType="done"
                                ref={(input) => {
                                    this.OwnerBankAccountNumber = input;
                                }}
                                onSubmitEditing={() => {
                                    Keyboard.dismiss()
                                }}
                                onChangeText={(OwnerBankAccountNumber) => this.setState({OwnerBankAccountNumber}, () => {
                                    let resp;
                                    resp = Utils.isValidBankAccountNumber(this.state.OwnerBankAccountNumber);
                                    if (resp.status === true) {
                                        this.setState({errorBeneficiaryAccountNumber: null});
                                    } else {
                                        this.setState({errorBeneficiaryAccountNumber: resp.message});
                                    }
                                })}/>
                            {
                                this.state.errorBeneficiaryAccountNumber ?
                                    <Text style={{
                                        color: 'red',
                                        fontFamily: 'Muli-Regular',
                                        paddingLeft: 20,
                                        marginBottom: 10
                                    }}>{this.state.errorBeneficiaryAccountNumber}</Text>
                                    :
                                    null
                            }
                        </View>

                        {/*AADHAR NUMBER*/}
                        <View style={[Styles.mBtm10]}>
                            <View
                                style={[Styles.row, Styles.mTop15]}>
                                <View
                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.adharIocn}</View>
                                <Text
                                    style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, userPanFound && panNumberDetails.aadharCardNumber ? Styles.cDisabled : Styles.colorBlue]}>Aadhar
                                    Card No</Text>
                            </View>
                            <View style={{paddingLeft: 40}}>
                                <TextInput
                                    editable={!userPanFound}
                                    style={[{
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#ccc'
                                    }, Styles.f16, userPanFound && panNumberDetails.aadharCardNumber ? Styles.cDisabled : Styles.colorBlue]}
                                    placeholder='Aadhar Card No'
                                    mode={'outlined'}
                                    theme={{colors: {text: userPanFound ? '#cccccc' : '#233167'}}}
                                    keyboardType='numeric'
                                    maxLength={12}
                                    returnKeyType="done"
                                    ref={(input) => {
                                        this.OwnerAadharCardNumber = input;
                                    }}
                                    onSubmitEditing={() => {
                                        Keyboard.dismiss()
                                    }}
                                    value={this.state.OwnerAadharCardNumber}
                                    onChangeText={(adhar) => this.setState({OwnerAadharCardNumber: adhar})}
                                />
                            </View>
                        </View>

                        {/*Upload PAN Card*/}
                        <View>
                            <View
                                style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                <View
                                    style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                <TouchableOpacity
                                    // disabled={userPanFound && this.state.panImageURL}
                                    disabled={userPanFound}
                                    onPress={() => {
                                        this.setState({imageType: 'panCard', imageSelectionModal: true})
                                    }}
                                    style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                    <Text
                                        style={[Styles.ffMregular, userPanFound ? Styles.cDisabled : Styles.colorBlue,
                                            Styles.f16, Styles.p3, Styles.aslCenter]}>Upload PAN
                                        Card Pic</Text>
                                </TouchableOpacity>

                            </View>
                            {
                                this.state.panImageURL
                                    ?
                                    <View
                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 120,}]}>
                                        <TouchableOpacity
                                            style={[Styles.row, Styles.aslCenter]}
                                            onPress={() => {
                                                this.setState({
                                                    imagePreview: true,
                                                    imagePreviewURL: this.state.panImageURL
                                                })
                                            }}>
                                            <Image
                                                onLoadStart={() => this.setState({PANLoading: true})}
                                                onLoadEnd={() => this.setState({PANLoading: false})}
                                                style={[{
                                                    width: Dimensions.get('window').width / 2,
                                                    height: 120
                                                }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                source={this.state.panImageURL ? {uri: this.state.panImageURL} : null}
                                            />
                                            {Services.returnZoomIcon()}
                                        </TouchableOpacity>
                                        <ActivityIndicator
                                            style={[Styles.ImageUploadActivityIndicator]}
                                            animating={this.state.PANLoading}
                                        />
                                    </View>
                                    :
                                    null
                            }
                        </View>

                        {/*Upload BANK PROOF PIC*/}
                        <View>
                            <View
                                style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                <View
                                    style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                <TouchableOpacity
                                    disabled={userPanFound}
                                    onPress={() => {
                                        this.setState({
                                            imageType: 'BeneficiaryBankProofUpload',
                                            imageSelectionModal: true
                                        })
                                    }}
                                    style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                    <Text
                                        style={[Styles.ffMregular,
                                            userPanFound ? Styles.cDisabled : Styles.colorBlue,
                                            Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                        Bank Proof
                                        Pic</Text>
                                </TouchableOpacity>
                            </View>
                            {
                                this.state.BeneficiaryBankProofImageURL
                                    ?
                                    <View
                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 120,}]}>
                                        <TouchableOpacity
                                            style={[Styles.row, Styles.aslCenter]}
                                            onPress={() => {
                                                this.setState({
                                                    imagePreview: true,
                                                    imagePreviewURL: this.state.BeneficiaryBankProofImageURL
                                                })
                                            }}>
                                            <Image
                                                onLoadStart={() => this.setState({BenBankProofLoading: true})}
                                                onLoadEnd={() => this.setState({BenBankProofLoading: false})}
                                                style={[{
                                                    width: Dimensions.get('window').width / 2,
                                                    height: 120
                                                }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                source={this.state.BeneficiaryBankProofImageURL ? {uri: this.state.BeneficiaryBankProofImageURL} : null}
                                            />
                                            {Services.returnZoomIcon()}
                                        </TouchableOpacity>
                                        <ActivityIndicator
                                            style={[Styles.ImageUploadActivityIndicator]}
                                            animating={this.state.BenBankProofLoading}
                                        />
                                    </View>
                                    :
                                    null
                            }
                        </View>


                        {/*Upload AADHAR CARD PIC*/}
                        <View>
                            <View
                                style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                <View
                                    style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                <TouchableOpacity
                                    disabled={userPanFound}
                                    onPress={() => {
                                        this.setState({imageType: 'BeneficiaryAadharUpload', imageSelectionModal: true})
                                    }}
                                    style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                    <Text
                                        style={[Styles.ffMregular,
                                            userPanFound ? Styles.cDisabled : Styles.colorBlue,
                                            Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                        Aadhar Card
                                        Pic </Text>
                                </TouchableOpacity>
                            </View>
                            {
                                this.state.BeneficiaryAadharImageURL
                                    ?
                                    <View
                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 120,}]}>
                                        <TouchableOpacity
                                            style={[Styles.row, Styles.aslCenter]}
                                            onPress={() => {
                                                this.setState({
                                                    imagePreview: true,
                                                    imagePreviewURL: this.state.BeneficiaryAadharImageURL
                                                })
                                            }}>
                                            <Image
                                                onLoadStart={() => this.setState({BenAadharLoading: true})}
                                                onLoadEnd={() => this.setState({BenAadharLoading: false})}
                                                style={[{
                                                    width: Dimensions.get('window').width / 2,
                                                    height: 120
                                                }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                source={this.state.BeneficiaryAadharImageURL ? {uri: this.state.BeneficiaryAadharImageURL} : null}
                                            />
                                            {Services.returnZoomIcon()}
                                        </TouchableOpacity>
                                        <ActivityIndicator
                                            style={[Styles.ImageUploadActivityIndicator]}
                                            animating={this.state.BenAadharLoading}
                                        />
                                    </View>
                                    :
                                    null
                            }
                        </View>

                    </View>
                </ScrollView>
                {
                    beneficiaryDetailsFound || userPanFound
                        ?
                        null
                        :
                        <TouchableOpacity
                            onPress={() => {
                                this.validateOwnerInfo();
                            }}
                            style={[{backgroundColor: '#C91A1F'},
                                Styles.p10, Styles.m3, Styles.br10,]}>
                            <Text
                                style={[Styles.aslCenter, Styles.cWhite, Styles.padV5, Styles.ffMbold, Styles.f16]}>CREATE</Text>
                        </TouchableOpacity>
                }
            </View>
        )
    }

    searchSite = (searchData) => {
        if (searchData) {
            let filteredData = this.state.clientSiteList.filter(function (item) {
                // let tempName = item.name;
                let tempName = item.attrs.siteLable;
                return tempName.toUpperCase().includes(searchData.toUpperCase());
            });
            this.setState({searchedSiteList: filteredData, searchSiteString: searchData});
        } else {
            this.setState({searchedSiteList: this.state.clientSiteList, searchSiteString: searchData})
        }
    }


    rotate() {
        let newRotation = JSON.parse(this.state.imageRotate) + 90;
        if (newRotation >= 360) {
            newRotation = -360;
        }
        this.setState({
            imageRotate: JSON.stringify(newRotation),
        })
    }

    onRefresh() {
        this.getCreatedShiftsList()
    }

    render() {
        if (this.state.refreshing) {
            return (
                <View style={[Styles.flex1, Styles.alignCenter]}>
                    {/*<ActivityIndicator/>*/}
                    <ActivityIndicator animating size="large"/>
                </View>
            );
        }
        const {
            userDetails,
            allowOtherFields,
            userPanFound,
            canEditTextInput,
            panNumberDetails,
            beneficiaryDetailsFound,
            createdAdhocList,isRefreshing
        } = this.state;
        return (
            <View style={[[Styles.flex1, Styles.bgWhite, {width: Dimensions.get('window').width}]]}>
                <OfflineNotice/>
                <Appbar.Header theme={theme} style={[Styles.bgDarkRed]}>
                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                    <Appbar.Content title="Lite User Shift" titleStyle={[Styles.ffLBold]}/>
                    <View style={[Styles.aslEnd, Styles.marH10]}>
                        <Text
                            style={[Styles.cWhite, Styles.ffLBlack, Styles.f14, Styles.padH5, Styles.aslStart]}>(Filter
                            Date)</Text>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                                this.filterDatePicker()
                            }}
                            style={[Styles.aslCenter, Styles.row, Styles.bgLYellow, Styles.p3, Styles.mBtm3]}>
                            <FontAwesome name="calendar" size={22} color="#000" style={[Styles.padH5]}/>
                            <View>
                                <Text
                                    style={[Styles.colorBlue, Styles.ffLBlack, Styles.f18, Styles.padH5, Styles.aslCenter]}>{Services.returnCalendarFormat(this.state.filterAdhocShiftDate)}</Text>

                            </View>
                        </TouchableOpacity>

                    </View>
                </Appbar.Header>


                {this.renderSpinner()}
                <View style={[Styles.flex1]}>
                    <View style={[Styles.flex1]}>
                        {
                            // createdAdhocList.length === 0
                            //     ?
                            //     <View style={[Styles.alignCenter, Styles.flex1]}>
                            //         <Text
                            //             style={[Styles.ffLBold, Styles.f18, Styles.colorBlue, Styles.pLeft15]}>No Lite
                            //             Shifts Created..</Text>
                            //     </View>
                            //     :
                            //     <ScrollView style={[Styles.flex1]}>
                            //         <Text
                            //             style={[Styles.colorBlue, Styles.f18, Styles.ffLBold, Styles.aslStart, Styles.padH10, Styles.pTop5]}>Created
                            //             List</Text>
                            //         <List.Section
                            //             style={[Styles.flex1]}>
                            //             {createdAdhocList.map((item, index) => {
                            //                 return (
                            //                     <View key={index}
                            //                           style={[Styles.mBtm10, Styles.marH10]}>
                            //                         <TouchableOpacity
                            //                             activeOpacity={0.7}
                            //                             onPress={() => {
                            //                                 if (Services.returnCalendarFormat(item.shiftDate) === Services.returnCalendarFormat(new Date())) {
                            //                                     if (item.status === "ATTENDANCE_MARKED") {
                            //                                         this.props.navigation.navigate('StartShiftScreen', {
                            //                                             CurrentShiftId: item.shiftId,
                            //                                             currentUserId: item.userId,
                            //                                             UserFlow: 'NORMAL_ADHOC_FLOW'
                            //                                         })
                            //                                     } else if (item.status === "SHIFT_IN_PROGRESS") {
                            //                                         this.props.navigation.navigate('EndShiftScreen', {
                            //                                             CurrentShiftId: item.shiftId,
                            //                                             currentUserId: item.userId,
                            //                                             UserFlow: 'NORMAL_ADHOC_FLOW'
                            //                                         })
                            //                                     } else {
                            //                                         this.props.navigation.navigate('ShiftSummary', {shiftId: item.shiftId})
                            //                                     }
                            //                                 } else {
                            //                                     // console.log('Previous day shift')
                            //                                     this.props.navigation.navigate('ShiftSummary', {shiftId: item.shiftId})
                            //                                 }
                            //
                            //                             }}
                            //                             style={[Styles.padH10, Styles.OrdersScreenCardshadow, Styles.bgWhite,
                            //
                            //                                 {
                            //                                     width: Dimensions.get('window').width - 20,
                            //                                     borderLeftColor: Services.getShiftStatusColours(item.status),
                            //                                     borderLeftWidth: 10,
                            //                                     // backgroundColor:Services.getExpensesStatus(item.status)
                            //                                 }]}>
                            //                             <View style={[Styles.padV5]}>
                            //                                 <View style={[Styles.row, Styles.jSpaceBet]}>
                            //                                     <View style={[Styles.row]}>
                            //                                         <Text
                            //                                             style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.fullName} ({Services.getUserRolesShortName(item.userRole)})</Text>
                            //                                     </View>
                            //                                 </View>
                            //
                            //                                 <View style={[Styles.row]}>
                            //                                     <View style={[Styles.row]}>
                            //                                         <Text
                            //                                             style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Date:</Text>
                            //                                         <Text
                            //                                             style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.shiftDateStr}</Text>
                            //                                     </View>
                            //                                     <Text
                            //                                         style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.padH10]}>||</Text>
                            //                                     <View style={[Styles.row]}>
                            //                                         <Text
                            //                                             style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Duration:</Text>
                            //                                         <Text
                            //                                             style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.duration} H</Text>
                            //                                     </View>
                            //                                 </View>
                            //
                            //                                 <View style={[Styles.row, Styles.jSpaceBet]}>
                            //                                     <View>
                            //                                         <View style={[Styles.row]}>
                            //                                             <Text
                            //                                                 style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Site:</Text>
                            //                                             <Text
                            //                                                 numberOfLines={1}
                            //                                                 style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, {width: Dimensions.get('window').width / 2.2}]}>{item.attrs.siteCode}</Text>
                            //                                         </View>
                            //                                         <View style={[Styles.row]}>
                            //                                             <Text
                            //                                                 style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Client:</Text>
                            //                                             <Text
                            //                                                 style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.clientName}</Text>
                            //                                         </View>
                            //                                     </View>
                            //                                     <FontAwesome name="chevron-right" size={24}
                            //                                                  color="#233167"
                            //                                     />
                            //                                 </View>
                            //
                            //
                            //                                 <View style={[Styles.row, Styles.jSpaceBet]}>
                            //                                     <View style={[Styles.row]}>
                            //                                         <Text
                            //                                             style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Payment
                            //                                             Type:</Text>
                            //                                         <Text
                            //                                             style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.adhocPaymentMode}</Text>
                            //                                     </View>
                            //                                     {
                            //                                         item.adhocShiftAmountPaid
                            //                                             ?
                            //                                             <View style={[Styles.row]}>
                            //                                                 <Text
                            //                                                     style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Amount:</Text>
                            //                                                 <Text
                            //                                                     style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>&#x20B9; {item.adhocShiftAmountPaid}</Text>
                            //                                             </View>
                            //                                             :
                            //                                             null
                            //                                     }
                            //                                 </View>
                            //
                            //                                 <View style={[Styles.row, Styles.jSpaceBet]}>
                            //
                            //                                     <Text
                            //                                         numberOfLines={1}
                            //                                         style={[Styles.f16, Styles.ffLBlack, Styles.cOrangered, Styles.aslStart, {width: Dimensions.get('window').width / 2.4}]}>{_.startCase(item.attrs.shiftCreatedBy)}</Text>
                            //                                     <Text
                            //                                         numberOfLines={1}
                            //                                         style={[Styles.f16, Styles.ffLBlack, Styles.aslEnd, {color: Services.getShiftStatusColours(item.status),width: Dimensions.get('window').width / 2.4}]}>{_.startCase(item.status)}</Text>
                            //                                 </View>
                            //
                            //
                            //                             </View>
                            //
                            //                         </TouchableOpacity>
                            //                     </View>
                            //                 );
                            //             })}
                            //         </List.Section>
                            //     </ScrollView>


                            <View style={[Styles.flex1, Styles.bgDWhite]}
                                  refreshControl={
                                <RefreshControl
                                    refreshing={this.state.refreshing}
                                    onRefresh={this.onRefresh.bind(this)}/>
                            }>
                                <Text style={[Styles.colorBlue, Styles.f18, Styles.ffLBold, Styles.aslStart, Styles.padH10, Styles.pTop5]}>Created List</Text>

                                <FlatList
                                    data={createdAdhocList}
                                    renderItem={({item,index}) => (
                                        <View key={index}
                                              style={[Styles.mBtm10, Styles.marH10]}>
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    if (Services.returnCalendarFormat(item.shiftDate) === Services.returnCalendarFormat(new Date())) {
                                                        if (item.status === "ATTENDANCE_MARKED") {
                                                            this.props.navigation.navigate('StartShiftScreen', {
                                                                CurrentShiftId: item.shiftId,
                                                                currentUserId: item.userId,
                                                                UserFlow: 'NORMAL_ADHOC_FLOW'
                                                            })
                                                        } else if (item.status === "SHIFT_IN_PROGRESS") {
                                                            this.props.navigation.navigate('EndShiftScreen', {
                                                                CurrentShiftId: item.shiftId,
                                                                currentUserId: item.userId,
                                                                UserFlow: 'NORMAL_ADHOC_FLOW'
                                                            })
                                                        } else {
                                                            this.props.navigation.navigate('ShiftSummary', {shiftId: item.shiftId})
                                                        }
                                                    } else {
                                                        // console.log('Previous day shift')
                                                        this.props.navigation.navigate('ShiftSummary', {shiftId: item.shiftId})
                                                    }

                                                }}
                                                style={[Styles.padH10, Styles.OrdersScreenCardshadow, Styles.bgWhite,

                                                    {
                                                        width: Dimensions.get('window').width - 20,
                                                        borderLeftColor: Services.getShiftStatusColours(item.status),
                                                        borderLeftWidth: 10,
                                                        // backgroundColor:Services.getExpensesStatus(item.status)
                                                    }]}>
                                                <View style={[Styles.padV5]}>
                                                    <View style={[Styles.row, Styles.jSpaceBet]}>
                                                        <View style={[Styles.row]}>
                                                            <Text
                                                                style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.fullName} ({Services.getUserRolesShortName(item.userRole)})</Text>
                                                        </View>
                                                    </View>

                                                    <View style={[Styles.row]}>
                                                        <View style={[Styles.row]}>
                                                            <Text
                                                                style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Date:</Text>
                                                            <Text
                                                                style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.shiftDateStr}</Text>
                                                        </View>
                                                        <Text
                                                            style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.padH10]}>||</Text>
                                                        <View style={[Styles.row]}>
                                                            <Text
                                                                style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Duration:</Text>
                                                            <Text
                                                                style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.duration} H</Text>
                                                        </View>
                                                    </View>

                                                    <View style={[Styles.row, Styles.jSpaceBet]}>
                                                        <View>
                                                            <View style={[Styles.row]}>
                                                                <Text
                                                                    style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Site:</Text>
                                                                <Text
                                                                    numberOfLines={1}
                                                                    style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, {width: Dimensions.get('window').width / 2.2}]}>{item.attrs.siteCode}</Text>
                                                            </View>
                                                            <View style={[Styles.row]}>
                                                                <Text
                                                                    style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Client:</Text>
                                                                <Text
                                                                    style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.clientName}</Text>
                                                            </View>
                                                        </View>
                                                        <FontAwesome name="chevron-right" size={24}
                                                                     color="#233167"
                                                        />
                                                    </View>


                                                    <View style={[Styles.row, Styles.jSpaceBet]}>
                                                        <View style={[Styles.row]}>
                                                            <Text
                                                                style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Payment
                                                                Type:</Text>
                                                            <Text
                                                                style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.adhocPaymentMode}</Text>
                                                        </View>
                                                        {
                                                            item.adhocShiftAmountPaid
                                                                ?
                                                                <View style={[Styles.row]}>
                                                                    <Text
                                                                        style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Amount:</Text>
                                                                    <Text
                                                                        style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>&#x20B9; {item.adhocShiftAmountPaid}</Text>
                                                                </View>
                                                                :
                                                                null
                                                        }
                                                    </View>

                                                    <View style={[Styles.row, Styles.jSpaceBet]}>

                                                        <Text
                                                            numberOfLines={1}
                                                            style={[Styles.f16, Styles.ffLBlack, Styles.cOrangered, Styles.aslStart, {width: Dimensions.get('window').width / 2.4}]}>{_.startCase(item.attrs.shiftCreatedBy)}</Text>
                                                        <Text
                                                            numberOfLines={1}
                                                            style={[Styles.f16, Styles.ffLBlack, Styles.aslEnd, {
                                                                color: Services.getShiftStatusColours(item.status),
                                                                width: Dimensions.get('window').width / 2.4
                                                            }]}>{_.startCase(item.status)}</Text>
                                                    </View>


                                                </View>

                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    keyExtractor={(item, index) => index.toString()}
                                    refreshing={isRefreshing}
                                    onRefresh={this.handleRefresh}
                                    ListFooterComponent={this.renderFooter}
                                />
                                {
                                    createdAdhocList.length === 0
                                        ?
                                        <View style={[Styles.aslCenter, Styles.flex1]}>
                                            <Text
                                                style={[Styles.ffLBold, Styles.f18, Styles.colorBlue, Styles.pLeft15]}>No
                                                Lite
                                                Shifts Created..</Text>
                                        </View>
                                        :
                                        null
                                }
                            </View>
                        }

                    </View>

                    <View style={[{position: "absolute", bottom: 15, right: 20}]}>
                        <FAB
                            style={[Styles.bgPureRed, Styles.OrdersScreenCardshadow]}
                            icon="add"
                            // label={'ADD'}
                            color={'#fff'}
                            // onPress={() => this.setState({createAdhocShiftModal: true}, () => {
                            //     // this.getAllSites();
                            //     this.getAdhocShiftReasons();
                            // })}
                            onPress={() => this.setDefaultValues()}
                        />
                    </View>

                </View>


                <View>
                    {/*MODALS START*/}

                    {/*MODAL to CREATE ADHOC SHIFT*/}
                    <Modal transparent={true}
                           visible={this.state.createAdhocShiftModal}
                           animated={true}
                           animationType='slide'
                           onRequestClose={() => {
                               this.setState({createAdhocShiftModal: false})
                           }}>
                        <View style={[Styles.modalfrontPosition]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <View
                                style={[[Styles.flex1, Styles.bgWhite, {
                                    width: Dimensions.get('window').width,
                                    height: Dimensions.get('window').height,
                                }]]}>
                                <Appbar.Header theme={theme} style={[Styles.bgDarkRed]}>
                                    <Appbar.Content
                                        title={"Create Lite Shift"}
                                        titleStyle={[Styles.ffLBlack]}/>
                                    <MaterialCommunityIcons name="window-close" size={28}
                                                            color="#fff" style={{marginRight: 10}}
                                                            onPress={() => this.setState({createAdhocShiftModal: false})}/>
                                </Appbar.Header>
                                <View style={[Styles.flex1]}>
                                    <ScrollView
                                        persistentScrollbar={true}
                                        style={[Styles.flex1, Styles.bgDWhite, Styles.padH15]}>

                                        {/*MOBILE NUMBER*/}
                                        <View>
                                            {/*MOBILE NUMBER*/}
                                            <View>
                                                <Text
                                                    style={[Styles.ffLBlack, Styles.colorBlue, Styles.aslStart, Styles.f16, Styles.mTop5]}>Enter
                                                    User's Mobile Number to Create Shift</Text>
                                                <TextInput label={'Mobile Number*'}
                                                           placeholder={'Type here'}
                                                           style={[Styles.marV5, Styles.flex1]}
                                                           maxLength={10}
                                                           keyboardType={'numeric'}
                                                           theme={theme}
                                                           mode='outlined'
                                                           onSubmitEditing={() => {
                                                               // this.state.mobileNumber ? this.verifyMobileNumber(this.state.mobileNumber) : null
                                                               Keyboard.dismiss()
                                                           }}
                                                           placeholderTextColor='#233167'
                                                           blurOnSubmit={false}
                                                           value={this.state.mobileNumber}
                                                           onChangeText={(mobileNumber) => this.setState({mobileNumber}, () => {
                                                               // this.verifyMobileNumber(this.state.mobileNumber)
                                                               let resp;
                                                               resp = Utils.isValidMobileNumber(this.state.mobileNumber);
                                                               if (resp.status === true) {
                                                                   this.setState({
                                                                       errorMobileNumber: null,
                                                                       allowOtherFields: true
                                                                   }, () => {
                                                                       this.verifyMobileNumber(this.state.mobileNumber)
                                                                   });
                                                               } else {
                                                                   this.setState({
                                                                       errorMobileNumber: resp.message,
                                                                       allowOtherFields: false
                                                                   });
                                                               }
                                                           })}
                                                />

                                                {
                                                    this.state.errorMobileNumber === null && this.state.mobileNumber
                                                        ?
                                                        this.state.userStatus === 'OLD_NOT_REGISTERED'
                                                            ?
                                                            <View style={[Styles.mBtm5, Styles.aslStart, Styles.row]}>
                                                                <MaterialCommunityIcons name="check-circle" size={23}
                                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br40]}
                                                                                        color={'green'}/>
                                                                <Text
                                                                    style={[Styles.colorGreen, Styles.f16, Styles.padH5, Styles.ffMbold]}>Existed
                                                                    Un-Registered User</Text>
                                                            </View>
                                                            :
                                                            this.state.userStatus === 'NEW_NOT_REGISTERED'
                                                                ?
                                                                <View
                                                                    style={[Styles.mBtm5, Styles.aslStart, Styles.row]}>
                                                                    <MaterialCommunityIcons name="check-circle"
                                                                                            size={23}
                                                                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br40]}
                                                                                            color={'#CF268A'}/>
                                                                    <Text
                                                                        style={[Styles.cVoiletPinkMix, Styles.f16, Styles.padH5, Styles.ffMbold]}>New
                                                                        Un-Registered User</Text>
                                                                </View>
                                                                :
                                                                this.state.userStatus === 'REGISTERED'
                                                                    ?
                                                                    <View
                                                                        style={[Styles.mBtm5, Styles.aslStart, Styles.row]}>
                                                                        <MaterialCommunityIcons name="cancel" size={23}
                                                                                                style={[Styles.aslCenter, Styles.bgWhite, Styles.br40]}
                                                                                                color={'red'}/>
                                                                        <Text
                                                                            style={[Styles.cRed, Styles.f16, Styles.padH5, Styles.ffMbold]}>Registered
                                                                            User</Text>
                                                                    </View>
                                                                    :
                                                                    null
                                                        :
                                                        null
                                                }
                                            </View>

                                        </View>


                                        {
                                            allowOtherFields
                                                ?
                                                <View>
                                                    {/*USER NAME*/}
                                                    <TextInput label={'Name*'}
                                                               placeholder={'Type here'}
                                                               style={[Styles.marV5]}
                                                               theme={theme}
                                                               mode='outlined'
                                                               onSubmitEditing={() => {
                                                                   Keyboard.dismiss()
                                                               }}
                                                               placeholderTextColor='#233167'
                                                               blurOnSubmit={false}
                                                               onChangeText={(userName) => this.setState({userName})}
                                                               value={this.state.userName}
                                                    />

                                                    {/*ROLES SELCTION radio button*/}
                                                    <View
                                                        style={[Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgWhite, Styles.p5]}>
                                                        <Text
                                                            style={[Styles.ffLRegular, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.marH10]}>Role{Services.returnRedStart()}</Text>
                                                        <RadioButton.Group
                                                            onValueChange={roleValue => this.setState({
                                                                roleValue,
                                                                vehicleTypeValue: '',
                                                                planTitle: 'SELECT PLAN',
                                                                planId: ''
                                                            }, () => {
                                                                this.setState({
                                                                    displayRole: Services.getUserRoles(roleValue),
                                                                    userRole: roleValue
                                                                })
                                                            })}
                                                            value={this.state.roleValue}>
                                                            <View style={[Styles.row, Styles.aslCenter,]}>
                                                                <View style={[Styles.row, Styles.alignCenter]}>
                                                                    <RadioButton value={1}/>
                                                                    <Text
                                                                        style={[Styles.ffLBold, Styles.colorBlue, Styles.aslCenter, Styles.f14]}>Associate</Text>
                                                                </View>
                                                                <View style={[Styles.row, Styles.alignCenter]}>
                                                                    <RadioButton value={5}/>
                                                                    <Text
                                                                        style={[Styles.ffLBold, Styles.colorBlue, Styles.aslCenter, Styles.f14]}>Driver</Text>
                                                                </View>
                                                                <View style={[Styles.row, Styles.alignCenter]}>
                                                                    <RadioButton value={10}/>
                                                                    <Text
                                                                        style={[Styles.ffLBold, Styles.colorBlue, Styles.aslCenter, Styles.f14]}>Driver
                                                                        & Associate</Text>
                                                                </View>
                                                            </View>
                                                        </RadioButton.Group>
                                                    </View>

                                                    {/*Vehicle Type radio button*/}
                                                    {
                                                        this.state.roleValue === 5 || this.state.roleValue === 10
                                                            ?
                                                            <View
                                                                style={[Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgWhite, Styles.p5]}>
                                                                <Text
                                                                    style={[Styles.ffLRegular, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.marH10]}>Vehicle
                                                                    Type{Services.returnRedStart()}</Text>
                                                                <RadioButton.Group
                                                                    onValueChange={vehicleTypeValue => this.setState({vehicleTypeValue})}
                                                                    value={this.state.vehicleTypeValue}>
                                                                    <View style={[Styles.row, Styles.aslCenter]}>
                                                                        {
                                                                            this.state.roleValue === 10 ?
                                                                                <View
                                                                                    style={[Styles.row, Styles.alignCenter]}>
                                                                                    <RadioButton value={2}/>
                                                                                    <Image
                                                                                        style={[Styles.aslCenter, {
                                                                                            height: 32,
                                                                                            width: 32
                                                                                        }]}
                                                                                        source={LoadImages.vehicle_two}
                                                                                    />
                                                                                    {/*<Text  style={[Styles.ffLBlack, Styles.colorBlue, Styles.aslCenter, Styles.f16]}>2-Wheeler</Text>*/}
                                                                                </View>
                                                                                :
                                                                                null
                                                                        }
                                                                        <View style={[Styles.row, Styles.alignCenter]}>
                                                                            <RadioButton value={3}/>
                                                                            <Image
                                                                                style={[Styles.aslCenter, {
                                                                                    height: 32,
                                                                                    width: 32
                                                                                }]}
                                                                                source={LoadImages.vehicle_three}
                                                                            />
                                                                            {/*<Text  style={[Styles.ffLBlack, Styles.colorBlue, Styles.aslCenter, Styles.f16]}>3-Wheeler</Text>*/}
                                                                        </View>
                                                                        <View style={[Styles.row, Styles.alignCenter]}>
                                                                            <RadioButton value={4}/>
                                                                            <Image
                                                                                style={[Styles.aslCenter, {
                                                                                    height: 32,
                                                                                    width: 32
                                                                                }]}
                                                                                source={LoadImages.vehicle_four}
                                                                            />
                                                                            {/*<Text  style={[Styles.ffLBlack, Styles.colorBlue, Styles.aslCenter, Styles.f16]}>4-Wheeler</Text>*/}
                                                                        </View>
                                                                    </View>
                                                                </RadioButton.Group>
                                                            </View>
                                                            :
                                                            null
                                                    }

                                                    {/*VEHICLE REGISTRATION NUMBER*/}
                                                    {
                                                        (this.state.roleValue === 5 || this.state.roleValue === 10) && this.state.vehicleTypeValue
                                                            ?
                                                            <View
                                                                style={[Styles.bgWhite, Styles.OrdersScreenCardshadow, Styles.p5]}>
                                                                <View style={[Styles.row]}>
                                                                    <View
                                                                        style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                    <Text
                                                                        style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                        Registration
                                                                        No{Services.returnRedStart()}</Text>
                                                                </View>
                                                                <View style={[Styles.row,]}>
                                                                    <TextInput
                                                                        style={[{textTransform: 'uppercase'}, Styles.colorBlue, Styles.marV5, Styles.br5, Styles.padH5, Styles.aslCenter]}
                                                                        autoCapitalize='characters'
                                                                        placeholder='AA'
                                                                        mode='outlined'
                                                                        autoCompleteType='off'
                                                                        placeholderTextColor='#EFF0FF'
                                                                        blurOnSubmit={false}
                                                                        maxLength={2}
                                                                        ref={(input) => {
                                                                            this.stateCode = input;
                                                                        }}
                                                                        onSubmitEditing={() => {
                                                                            this.distCode.focus();
                                                                        }}
                                                                        value={this.state.stateCode}
                                                                        onChangeText={(stateCode) => this.setState({stateCode}, function () {
                                                                            // this.validateVehicleNum('')
                                                                            let resp = {};
                                                                            resp = Utils.ValidateTotalVehicleNumberinParts(this.state.stateCode, this.state.distCode, this.state.rtoCode, this.state.vehicleNumber);
                                                                            if (resp.status === true) {
                                                                                this.setState({errorVehicleRegMessage: null});
                                                                            } else {
                                                                                this.setState({errorVehicleRegMessage: resp.message});
                                                                            }
                                                                        })}
                                                                        returnKeyType="next"/>
                                                                    <Text
                                                                        style={[Styles.f28, Styles.cBlk, Styles.ffMbold, Styles.aslCenter]}> - </Text>
                                                                    <TextInput
                                                                        style={[{textTransform: 'uppercase'}, Styles.colorBlue, Styles.marV5, Styles.br5, Styles.padH5, Styles.aslCenter]}
                                                                        mode='outlined'
                                                                        placeholder='12'
                                                                        autoCompleteType='off'
                                                                        placeholderTextColor='#EFF0FF'
                                                                        autoCapitalize="characters"
                                                                        blurOnSubmit={false}
                                                                        // keyboardType='numeric'
                                                                        maxLength={2}
                                                                        ref={(input) => {
                                                                            this.distCode = input;
                                                                        }}
                                                                        onSubmitEditing={() => {
                                                                            this.rtoCode.focus();
                                                                        }}
                                                                        value={this.state.distCode}
                                                                        onChangeText={(distCode) => this.setState({distCode}, function () {
                                                                            // this.validateVehicleNum('')
                                                                            let resp = {};
                                                                            resp = Utils.ValidateTotalVehicleNumberinParts(this.state.stateCode, this.state.distCode, this.state.rtoCode, this.state.vehicleNumber);
                                                                            if (resp.status === true) {
                                                                                this.setState({errorVehicleRegMessage: null});
                                                                            } else {
                                                                                this.setState({errorVehicleRegMessage: resp.message});
                                                                            }
                                                                        })}
                                                                        returnKeyType="next"/>
                                                                    <Text
                                                                        style={[Styles.f28, Styles.cBlk, Styles.ffMbold, Styles.aslCenter]}> - </Text>
                                                                    <TextInput
                                                                        style={[{textTransform: 'uppercase'}, Styles.colorBlue, Styles.marV5, Styles.br5, Styles.padH5, Styles.aslCenter]}
                                                                        placeholder='AA'
                                                                        mode='outlined'
                                                                        autoCompleteType='off'
                                                                        placeholderTextColor='#EFF0FF'
                                                                        autoCapitalize="characters"
                                                                        blurOnSubmit={false}
                                                                        maxLength={2}
                                                                        ref={(input) => {
                                                                            this.rtoCode = input;
                                                                        }}
                                                                        onSubmitEditing={() => {
                                                                            this.vehicleNumber.focus();
                                                                        }}
                                                                        value={this.state.rtoCode}
                                                                        onChangeText={(rtoCode) => this.setState({rtoCode}, function () {
                                                                            // this.validateVehicleNum('')
                                                                            let resp = {};
                                                                            resp = Utils.ValidateTotalVehicleNumberinParts(this.state.stateCode, this.state.distCode, this.state.rtoCode, this.state.vehicleNumber);
                                                                            if (resp.status === true) {
                                                                                this.setState({errorVehicleRegMessage: null});
                                                                            } else {
                                                                                this.setState({errorVehicleRegMessage: resp.message});
                                                                            }
                                                                        })}
                                                                        returnKeyType="next"/>
                                                                    <Text
                                                                        style={[Styles.f28, Styles.cBlk, Styles.ffMbold, Styles.aslCenter]}> - </Text>
                                                                    <TextInput
                                                                        style={[{textTransform: 'uppercase'}, Styles.colorBlue, Styles.marV5, Styles.br5, Styles.padH5, Styles.aslCenter]}
                                                                        placeholder='1234'
                                                                        keyboardType='numeric'
                                                                        mode='outlined'
                                                                        autoCompleteType='off'
                                                                        placeholderTextColor='#EFF0FF'
                                                                        maxLength={4}
                                                                        autoCapitalize="characters"
                                                                        blurOnSubmit={false}
                                                                        ref={(input) => {
                                                                            this.vehicleNumber = input;
                                                                        }}
                                                                        onSubmitEditing={() => {
                                                                            Keyboard.dismiss();
                                                                        }}
                                                                        value={this.state.vehicleNumber}
                                                                        onChangeText={(vehicleNumber) => this.setState({vehicleNumber}, function () {
                                                                            // this.validateVehicleNum('')
                                                                            let resp = {};
                                                                            resp = Utils.ValidateTotalVehicleNumberinParts(this.state.stateCode, this.state.distCode, this.state.rtoCode, this.state.vehicleNumber);
                                                                            if (resp.status === true) {
                                                                                this.setState({errorVehicleRegMessage: null});
                                                                            } else {
                                                                                this.setState({errorVehicleRegMessage: resp.message});
                                                                            }
                                                                        })}
                                                                        returnKeyType="done"/>
                                                                </View>
                                                                {
                                                                    this.state.errorVehicleRegMessage ?
                                                                        <Text style={{
                                                                            color: 'red',
                                                                            fontFamily: 'Muli-Regular',
                                                                            marginBottom: 5
                                                                        }}>{this.state.errorVehicleRegMessage}</Text>
                                                                        :
                                                                        null
                                                                }
                                                            </View>
                                                            :
                                                            null
                                                    }


                                                    {/*sites Dropdown*/}
                                                    <View
                                                        style={[Styles.marV5, Styles.OrdersScreenCardshadow, Styles.bgWhite, Styles.padH10, Styles.padV5]}>
                                                        <Text
                                                            style={[Styles.ffLRegular, Styles.aslStart, Styles.colorBlue, Styles.f18]}>Site
                                                            & Client{Services.returnRedStart()} </Text>
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            onPress={() => this.setState({siteListPopUp: true})}
                                                            style={[Styles.row, Styles.flex1, Styles.jSpaceBet, Styles.marV5, Styles.OrdersScreenCardshadow, Styles.bgDWhite, Styles.padH10, Styles.padV5,
                                                                Styles.bcRed, {borderWidth: this.state.siteTitle !== 'SELECT SITE' ? null : 1}]}>
                                                            <Text
                                                                style={[Styles.ffLBold, Styles.aslCenter, Styles.colorBlue, Styles.f18, Styles.marH10, Styles.flexWrap, {width: Dimensions.get('window').width / 1.8}]}>{this.state.siteTitle !== 'SELECT SITE' ? (this.state.siteTitle + ' (' + this.state.clientTitle + ')') : this.state.siteTitle}</Text>
                                                            <Ionicons name='md-arrow-dropdown' size={40}
                                                                      color={'#233167'}/>
                                                        </TouchableOpacity>
                                                    </View>

                                                    {/*Plans Dropdown== will dispaly after siteId is present*/}
                                                    {this.state.updatedSiteID && this.state.roleValue && (this.state.roleValue === 1 ? true : this.state.vehicleTypeValue)
                                                        ?
                                                        <View
                                                            style={[Styles.marV5, Styles.OrdersScreenCardshadow, Styles.bgWhite, Styles.padH10, Styles.padV5]}>
                                                            <Text
                                                                style={[Styles.ffLRegular, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.mBtm10]}>Payment
                                                                Plan{Services.returnRedStart()}</Text>
                                                            <TouchableOpacity
                                                                activeOpacity={0.7}
                                                                onPress={() => {
                                                                    this.getSitePlans()
                                                                }}
                                                                style={[Styles.row, Styles.jSpaceBet, Styles.marV5, Styles.OrdersScreenCardshadow, Styles.bgDWhite, Styles.padH10, Styles.padV5,
                                                                    Styles.bcRed, {borderWidth: this.state.planTitle !== 'SELECT PLAN' ? null : 1}]}>
                                                                <Text
                                                                    style={[Styles.ffLBold, Styles.aslCenter, Styles.colorBlue, Styles.f18, Styles.marH10, Styles.flexWrap, {width: Dimensions.get('window').width / 1.8}]}>{this.state.planTitle}</Text>
                                                                <Ionicons name='md-arrow-dropdown' size={40}
                                                                          color={'#233167'}/>
                                                            </TouchableOpacity>
                                                            {
                                                                this.state.planTitle === 'No Plan'
                                                                    ?
                                                                    <View style={[Styles.row]}>
                                                                        <Text
                                                                            style={[Styles.ffLBold, Styles.aslCenter, Styles.cOrangered, Styles.f40, Styles.pRight10]}>&#x20B9;</Text>
                                                                        <TextInput label={'Amount*'}
                                                                                   placeholder={'Type here'}
                                                                                   style={[Styles.marV5, Styles.flex1]}
                                                                                   theme={theme}
                                                                                   mode='outlined'
                                                                                   keyboardType='numeric'
                                                                                   onSubmitEditing={() => {
                                                                                       Keyboard.dismiss()
                                                                                   }}
                                                                                   placeholderTextColor='#233167'
                                                                                   blurOnSubmit={false}
                                                                                   onChangeText={(noPlanAmount) => this.setState({noPlanAmount})}
                                                                                   value={this.state.noPlanAmount}
                                                                        />
                                                                    </View>
                                                                    :
                                                                    null
                                                            }
                                                        </View>
                                                        :
                                                        null
                                                    }

                                                    {/*Payment Mode radio button*/}
                                                    <View
                                                        style={[Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgWhite, Styles.p5]}>

                                                        <RadioButton.Group
                                                            onValueChange={paymentMode => this.setState({paymentMode})}
                                                            value={this.state.paymentMode}>
                                                            <View style={[Styles.row, Styles.aslStart,]}>
                                                                <Text
                                                                    style={[Styles.ffLRegular, Styles.aslCenter, Styles.colorBlue, Styles.f16, Styles.marH10]}>Payment
                                                                    Mode{Services.returnRedStart()}</Text>
                                                                <View style={[Styles.row, Styles.alignCenter]}>
                                                                    <RadioButton value={'Now'}/>
                                                                    <Text
                                                                        style={[Styles.ffLBold, Styles.colorBlue, Styles.aslCenter, Styles.f16]}>Now
                                                                        (Cash)</Text>
                                                                </View>
                                                                <View style={[Styles.row, Styles.alignCenter]}>
                                                                    <RadioButton value={'Later'}/>
                                                                    <Text
                                                                        style={[Styles.ffLBold, Styles.colorBlue, Styles.aslCenter, Styles.f16]}>Later</Text>
                                                                </View>
                                                            </View>
                                                        </RadioButton.Group>

                                                        {/*{*/}
                                                        {/*    this.state.paymentMode === 'Now'*/}
                                                        {/*        ?*/}
                                                        {/*        <View>*/}
                                                        {/*            <TextInput label={'PAN Card  Number'}*/}
                                                        {/*                       placeholder={'Type here'}*/}
                                                        {/*                       style={[{*/}
                                                        {/*                           textTransform: 'uppercase',*/}
                                                        {/*                           borderBottomWidth: 1,*/}
                                                        {/*                           borderBottomColor: '#ccc',*/}
                                                        {/*                       }, Styles.f16, Styles.colorBlue, Styles.marV5, Styles.marH10]}*/}
                                                        {/*                       autoCapitalize='characters'*/}
                                                        {/*                       theme={textInputTheme}*/}
                                                        {/*                       mode='outlined'*/}
                                                        {/*                       returnKeyType="done"*/}
                                                        {/*                       onSubmitEditing={() => {*/}
                                                        {/*                           Keyboard.dismiss()*/}
                                                        {/*                       }}*/}
                                                        {/*                       placeholderTextColor='#233167'*/}
                                                        {/*                       blurOnSubmit={false}*/}
                                                        {/*                       value={this.state.userPanCardNumber}*/}
                                                        {/*                       onChangeText={(number) => this.setState({userPanCardNumber: number})}*/}
                                                        {/*            />*/}
                                                        {/*        </View>*/}
                                                        {/*        :*/}
                                                        {/*        null*/}
                                                        {/*}*/}


                                                        {this.state.paymentMode === 'Later'
                                                            ?
                                                            <View>


                                                                {/*<View style={[Styles.row,Styles.marH10,Styles.marV3,Styles.alignEnd]}>*/}
                                                                {/*    <Checkbox*/}
                                                                {/*        color={'red'}*/}
                                                                {/*        size={25}*/}
                                                                {/*        onPress={() => this.setState({addBankDetailsLater: !this.state.addBankDetailsLater})}*/}
                                                                {/*        status={this.state.addBankDetailsLater ? 'checked' : 'unchecked'}*/}
                                                                {/*    />*/}
                                                                {/*    <Text*/}
                                                                {/*        style={[Styles.f16, Styles.ffMbold, Styles.aslCenter,Styles.marH5,Styles.colorBlue]}>Add Bank Details Later</Text>*/}
                                                                {/*</View>*/}

                                                                <RadioButton.Group
                                                                    onValueChange={addBankDetailsLater => this.setState({addBankDetailsLater})}
                                                                    value={this.state.addBankDetailsLater}>
                                                                    <View style={[Styles.row, Styles.aslStart,]}>
                                                                        <Text
                                                                            style={[Styles.ffLRegular, Styles.aslCenter, Styles.colorBlue, Styles.f16, Styles.marH10]}>Add
                                                                            Bank
                                                                            Details{Services.returnRedStart()}</Text>
                                                                        <View style={[Styles.row, Styles.alignCenter]}>
                                                                            <RadioButton value={false}/>
                                                                            <Text
                                                                                style={[Styles.ffLBold, Styles.colorBlue, Styles.aslCenter, Styles.f16]}>Now</Text>
                                                                        </View>
                                                                        <View style={[Styles.row, Styles.alignCenter]}>
                                                                            <RadioButton value={true}/>
                                                                            <Text
                                                                                style={[Styles.ffLBold, Styles.colorBlue, Styles.aslCenter, Styles.f16]}>Later</Text>
                                                                        </View>
                                                                    </View>
                                                                </RadioButton.Group>

                                                                <View
                                                                    style={[Styles.row, Styles.aitCenter, Styles.mTop10, Styles.mBtm5, Styles.marH10]}>
                                                                    <TouchableOpacity
                                                                        disabled={this.state.addBankDetailsLater}
                                                                        onPress={() => {
                                                                            this.setState({
                                                                                ShowAddBankDetailsModal: true,
                                                                                canEditTextInput: true
                                                                            })
                                                                        }}
                                                                        activeOpacity={0.7}
                                                                        style={[Styles.row, this.state.addBankDetailsLater ? Styles.bgDisabled : Styles.bgDWhite, Styles.br5, Styles.aslCenter, Styles.p5,]}>
                                                                        {LoadSVG.bankAccIcon}
                                                                        <Text
                                                                            style={[Styles.f16, this.state.addBankDetailsLater ? Styles.cLightWhite : Styles.colorBlue, Styles.ffLBold, Styles.padH10]}>Add
                                                                            Bank
                                                                            Details{Services.returnRedStart()}</Text>
                                                                    </TouchableOpacity>
                                                                    {
                                                                        this.state.OwnerBeneficaryId || this.state.userBankInfoCreated
                                                                            ?
                                                                            <View
                                                                                style={[Styles.mBtm5, Styles.aslCenter, Styles.row]}>
                                                                                <MaterialCommunityIcons
                                                                                    name="check-circle" size={23}
                                                                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br40]}
                                                                                    color={'green'}/>
                                                                                <Text
                                                                                    // style={[Styles.colorGreen, Styles.f16, Styles.padH5, Styles.ffMbold]}>{beneficiaryDetailsFound ? 'Found Existed' : 'Completed'}</Text>
                                                                                    style={[Styles.colorGreen, Styles.f16, Styles.padH5, Styles.ffMbold]}>Completed</Text>
                                                                            </View>
                                                                            :
                                                                            null
                                                                    }
                                                                </View>
                                                            </View>
                                                            :
                                                            null
                                                        }
                                                    </View>

                                                    {/*DATE CARD*/}
                                                    <View style={[Styles.marV5, Styles.row]}>
                                                        <View
                                                            style={[Styles.marV5, Styles.OrdersScreenCardshadow, Styles.bgWhite, Styles.padH10, Styles.padV10, Styles.flex1]}>
                                                            <Text
                                                                style={[Styles.ffLRegular, Styles.aslStart, Styles.colorBlue, Styles.f18]}>Creation
                                                                Date & Time</Text>
                                                            <View
                                                                style={[Styles.row, Styles.jSpaceBet, Styles.mTop5]}>
                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => {
                                                                        this.shiftDatePicker()
                                                                    }}
                                                                    style={[Styles.row, Styles.bgLYellow, Styles.padH5, Styles.OrdersScreenCardshadow]}>
                                                                    <Text
                                                                        style={[Styles.colorBlue, Styles.f18, Styles.ffLBold, Styles.aslCenter]}>{new Date(this.state.shiftDate).toDateString()}</Text>
                                                                    <FontAwesome name="calendar" style={[Styles.pLeft5]}
                                                                                 size={28}
                                                                                 color="#000"/>
                                                                </TouchableOpacity>

                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => {
                                                                        this.setState({showTimepicker: true})
                                                                    }}
                                                                    style={[Styles.row, Styles.bgLYellow, Styles.padH5, Styles.OrdersScreenCardshadow]}>
                                                                    <Text
                                                                        style={[Styles.colorBlue, Styles.f18, Styles.ffLBold, Styles.aslCenter]}>{this.state.StartTime}:{this.state.StartTimeMin}</Text>
                                                                    <Ionicons style={[Styles.pLeft5]} name="ios-clock"
                                                                              size={32}
                                                                              color="#000"/>
                                                                </TouchableOpacity>

                                                            </View>
                                                        </View>
                                                        <TouchableOpacity
                                                            style={[Styles.aslCenter, Styles.marH3]}
                                                            onPress={() => {
                                                                this.setState({
                                                                    shiftDate: new Date(),
                                                                    StartTime: Services.returnCalculatedHours(new Date()),
                                                                    StartTimeMin: Services.returnCalculatedMinutes(new Date())
                                                                })
                                                            }}>
                                                            <FontAwesome style={[Styles.aslCenter]} name="refresh"
                                                                         size={26} color="black"/>
                                                            <Text
                                                                style={[Styles.cRed, Styles.f12, Styles.ffLRegular, Styles.aslCenter]}>(NOW)</Text>
                                                        </TouchableOpacity>
                                                    </View>


                                                    {/*DURATION CARD*/}
                                                    <View
                                                        style={[Styles.row, Styles.jSpaceBet, Styles.marV5, Styles.OrdersScreenCardshadow, Styles.bgWhite, Styles.padH10, Styles.padV10]}>
                                                        <Text
                                                            style={[Styles.colorBlue, Styles.f18, Styles.ffLRegular, Styles.aslCenter]}>DURATION <Text
                                                            style={[Styles.colorBlue, Styles.f18, Styles.ffLBold]}>(hours)</Text></Text>

                                                        <View style={[Styles.row, {paddingRight: 10}]}>
                                                            <TouchableOpacity
                                                                disabled={this.state.shiftDuration === '1'}
                                                                onPress={() => {
                                                                    this.validateDuration('decrement')
                                                                }}
                                                                style={[Styles.aslCenter]}>
                                                                <Text
                                                                    style={[Styles.IncDecButtonStyle]}>-</Text></TouchableOpacity>
                                                            <Text
                                                                style={[Styles.txtAlignCen, Styles.ffMbold, Styles.f18, {width: 30}]}>{this.state.shiftDuration}</Text>
                                                            <TouchableOpacity
                                                                disabled={this.state.shiftDuration === '24'}
                                                                onPress={() => {
                                                                    this.validateDuration('increment')
                                                                }} style={[Styles.aslCenter]}>
                                                                <Text
                                                                    style={[Styles.IncDecButtonStyle]}>+</Text></TouchableOpacity>
                                                        </View>
                                                    </View>

                                                    {/*ADHOC REASON*/}
                                                    <View
                                                        style={[Styles.bgWhite, Styles.OrdersScreenCardshadow, Styles.padH10, Styles.padV5, Styles.marV5,]}>
                                                        <Text
                                                            style={[Styles.f18, Styles.colorBlue, Styles.ffLBold, Styles.aslStart]}>Lite
                                                            User Shift
                                                            Reason</Text>
                                                        <View
                                                            style={[Styles.bw1, Styles.bcAsh, Styles.marV5, Styles.br5, Styles.bgWhite,]}>
                                                            <Picker
                                                                itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                                                selectedValue={this.state.adhocReasonValue}
                                                                mode='dropdown'
                                                                onValueChange={(itemValue, itemIndex) => this.setState({adhocReasonValue: itemValue})}
                                                            >
                                                                {this.state.adhocReasons.map((item, index) => {
                                                                    return (< Picker.Item
                                                                        label={item.name}
                                                                        value={item.key}
                                                                        key={index}/>);
                                                                })}
                                                            </Picker>
                                                        </View>

                                                        {
                                                            this.state.adhocReasonValue === "OTHER"
                                                                ?
                                                                <View style={[Styles.padH15]}>
                                                                    <TextInput
                                                                        placeholder={'Type here'}
                                                                        multiline={true}
                                                                        numberOfLines={4}
                                                                        style={[Styles.bgWhite, Styles.f18, Styles.bw1, Styles.bcAsh, Styles.m15, {height: 140}]}
                                                                        label='Lite User Reason *'
                                                                        value={this.state.otherAdhocReason}
                                                                        onChangeText={otherAdhocReason => this.setState({otherAdhocReason})}
                                                                    />
                                                                </View>
                                                                :
                                                                null
                                                        }

                                                    </View>

                                                    {/*USER PROFILE PHOTO*/}
                                                    <View>
                                                        <View style={[Styles.row, Styles.aitCenter, Styles.marV5,]}>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    this.setState({imageType: 'LITE_USER_PHOTO'}, () => {
                                                                        this.bankDocumentUpload('CAMERA')
                                                                    })
                                                                    // this.imageUpload()
                                                                }}
                                                                activeOpacity={0.7}
                                                                // disabled={this.state.expenseImageUrl || !canEditTextInput}
                                                                style={[Styles.row, Styles.bgLYellow, Styles.br5, Styles.aslCenter, Styles.p5,]}>
                                                                {LoadSVG.cameraPic}
                                                                <Text
                                                                    style={[Styles.f16, this.state.userImageUrl ? Styles.cDisabled : Styles.colorBlue, Styles.ffLBold, Styles.pRight15]}>Take
                                                                    User Photo{Services.returnRedStart()}</Text>
                                                            </TouchableOpacity>
                                                            {
                                                                this.state.userImageUrl
                                                                    ?
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            this.setState({
                                                                                picUploaded: false,
                                                                                userImageUrl: '',
                                                                                userImageFormData: ''
                                                                            })
                                                                        }}
                                                                        style={[Styles.bw1, Styles.br5, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                        <Text
                                                                            style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffLBold, Styles.cWhite]}>Delete</Text>
                                                                    </TouchableOpacity>
                                                                    :
                                                                    null
                                                            }
                                                        </View>

                                                        {
                                                            this.state.userImageUrl
                                                                ?
                                                                <View
                                                                    style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                    <TouchableOpacity
                                                                        style={[Styles.row, Styles.aslCenter]}
                                                                        onPress={() => {
                                                                            this.setState({
                                                                                imagePreview: true,
                                                                                imagePreviewURL: this.state.userImageUrl
                                                                            })
                                                                        }}>
                                                                        <Image
                                                                            onLoadStart={() => this.setState({imageLoading: true})}
                                                                            onLoadEnd={() => this.setState({imageLoading: false})}
                                                                            style={[{
                                                                                width: Dimensions.get('window').width / 2,
                                                                                height: 120
                                                                            }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                            source={this.state.userImageUrl ? {uri: this.state.userImageUrl} : null}
                                                                        />
                                                                        {Services.returnZoomIcon()}
                                                                    </TouchableOpacity>
                                                                    <ActivityIndicator
                                                                        style={[Styles.ImageUploadActivityIndicator]}
                                                                        animating={this.state.imageLoading}
                                                                    />
                                                                </View>
                                                                :
                                                                null
                                                        }
                                                    </View>


                                                </View>
                                                :
                                                null
                                        }


                                    </ScrollView>
                                    {/* FOOTER BUTTON*/}
                                    {
                                        allowOtherFields
                                            ?
                                            <Card style={[Styles.footerUpdateButtonStyles]}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.checkAdhocShift()
                                                        // this.ShiftAssignToUser()
                                                    }}
                                                    style={[Styles.br30, Styles.bgBlk]}
                                                >
                                                    <Text
                                                        style={[Styles.cWhite, Styles.f20, Styles.p10, Styles.aslCenter, Styles.ffLBold]}>ASSIGN
                                                        SHIFT</Text>
                                                </TouchableOpacity>
                                            </Card>
                                            :
                                            null
                                    }
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/*MODAL FOR OTP verification*/}
                    <Modal
                        transparent={true}
                        animated={true}
                        animationType='slide'
                        visible={this.state.otpVerificationModal}
                        onRequestClose={() => {
                            this.setState({otpVerificationModal: false})
                        }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <View
                                style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br15, {width: Dimensions.get('window').width - 60}]}>
                                <Text style={[Styles.colorBlue, Styles.f25, Styles.ffLBold, Styles.aslCenter]}>
                                    ENTER OTP
                                </Text>
                                <View style={[Styles.aslCenter, Styles.p5, Styles.pBtm18]}>
                                    <Text style={[Styles.ffLRegular, Styles.f18, Styles.colorBlue, Styles.marV10]}>The
                                        6-digit Code was sent to mobile number ({this.state.mobileNumber}). Please enter
                                        the code and Verify to Create the Lite User Shift</Text>
                                </View>
                                <View style={[Styles.mBtm15]}>
                                    <View style={[Styles.padH15]}>
                                        <TextInput
                                            placeholder={'Type here'}
                                            mode={'flat'}
                                            maxLength={6}
                                            keyboardType={'numeric'}
                                            style={[Styles.bgWhite, Styles.f18, Styles.colorBlue]}
                                            value={this.state.otpDigits}
                                            onChangeText={otpDigits => this.setState({otpDigits})}
                                        />
                                    </View>
                                </View>
                                <Card.Content style={[Styles.row, Styles.jSpaceBet, Styles.p5, Styles.pBtm18,]}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => this.setState({otpVerificationModal: false})}
                                        style={[Styles.aslCenter, Styles.br10, Styles.bgBlk, Styles.marH5]}>
                                        <Text
                                            style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>CANCEL</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            {
                                                let resp;
                                                resp = Utils.isValidOTP(this.state.otpDigits);
                                                if (resp.status === true) {
                                                    if (resp.message === '...809') {
                                                        this.ShiftAssignToUser()
                                                    } else {
                                                        this.verifyOTP()
                                                    }
                                                } else {
                                                    Utils.dialogBox(resp.message, '');
                                                }
                                            }
                                        }}
                                        style={[Styles.aslCenter, Styles.br10, Styles.bgGrn, Styles.marH5]}>
                                        <Text
                                            style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>VERIFY</Text>
                                    </TouchableOpacity>
                                </Card.Content>
                            </View>
                        </View>
                    </Modal>

                    {/*MODAL for CREATED ADHOC SHIFTS LIST */}
                    <Modal transparent={true}
                           visible={this.state.showAdhocShiftsList}
                           animated={true}
                           animationType='slide'
                           onRequestClose={() => {
                               this.setState({showAdhocShiftsList: false})
                           }}>
                        <View style={[Styles.modalfrontPosition]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <View
                                style={[[Styles.flex1, Styles.bgWhite, {
                                    width: Dimensions.get('window').width,
                                    height: Dimensions.get('window').height,
                                }]]}>
                                <Appbar.Header theme={theme} style={[Styles.bgDarkRed]}>
                                    <Appbar.Content
                                        title={"Created Shifts History"}
                                        titleStyle={[Styles.ffLBlack]}/>
                                    <MaterialCommunityIcons name="window-close" size={28}
                                                            color="#fff" style={{marginRight: 10}}
                                                            onPress={() => this.setState({showAdhocShiftsList: false})}/>
                                </Appbar.Header>

                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        this.filterDatePicker()
                                    }}
                                    style={[Styles.aslCenter, Styles.row, Styles.bgLYellow, Styles.p5, Styles.mTop8]}>
                                    <FontAwesome name="calendar" size={30} color="#000" style={[Styles.padH5]}/>
                                    <Text
                                        style={[Styles.colorBlue, Styles.ffLBlack, Styles.f18, Styles.padH5, Styles.aslCenter]}>{Services.returnCalendarFormat(this.state.filterAdhocShiftDate)}</Text>
                                </TouchableOpacity>


                                {createdAdhocList.length > 0 ?
                                    <View style={[Styles.flex1]}>
                                        <ScrollView style={[Styles.flex1]}>
                                            <List.Section style={[Styles.flex1]}>
                                                {createdAdhocList.map((item, index) => {
                                                    return (
                                                        <View key={index}
                                                              style={[Styles.mBtm10, Styles.marH10]}>
                                                            <TouchableOpacity
                                                                activeOpacity={0.7}
                                                                onPress={() => {
                                                                    this.setState({showAdhocShiftsList: false}, () => {
                                                                        this.props.navigation.navigate('ShiftSummary', {shiftId: item.shiftId})
                                                                    })
                                                                }}
                                                                style={[Styles.padH10, Styles.OrdersScreenCardshadow, Styles.bgWhite,

                                                                    {
                                                                        width: Dimensions.get('window').width - 20,
                                                                        borderLeftColor: Services.getShiftStatusColours(item.status),
                                                                        borderLeftWidth: 10,
                                                                        // backgroundColor:Services.getExpensesStatus(item.status)
                                                                    }]}>
                                                                <View style={[Styles.padV5]}>
                                                                    <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                        <View style={[Styles.row]}>
                                                                            <Text
                                                                                style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.fullName} ({Services.getUserRolesShortName(item.userRole)})</Text>
                                                                        </View>

                                                                        {/*<View style={[Styles.row]}>*/}
                                                                        {/*    /!*<Text*!/*/}
                                                                        {/*    /!*    style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Role:</Text>*!/*/}
                                                                        {/*    <Text*/}
                                                                        {/*        style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{Services.getUserRoles(item.userRole)}</Text>*/}
                                                                        {/*</View>*/}
                                                                    </View>

                                                                    <View style={[Styles.row]}>
                                                                        <View style={[Styles.row]}>
                                                                            <Text
                                                                                style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Date:</Text>
                                                                            <Text
                                                                                style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.shiftDateStr}</Text>
                                                                        </View>
                                                                        <Text
                                                                            style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.padH10]}>||</Text>
                                                                        <View style={[Styles.row]}>
                                                                            <Text
                                                                                style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Duration:</Text>
                                                                            <Text
                                                                                style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.duration} H</Text>
                                                                        </View>
                                                                    </View>

                                                                    <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                        <View>
                                                                            <View style={[Styles.row]}>
                                                                                <Text
                                                                                    style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Site:</Text>
                                                                                <Text
                                                                                    style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.siteName}</Text>
                                                                            </View>
                                                                            <View style={[Styles.row]}>
                                                                                <Text
                                                                                    style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Client:</Text>
                                                                                <Text
                                                                                    style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.clientName}</Text>
                                                                            </View>
                                                                        </View>
                                                                        <FontAwesome name="chevron-right" size={24}
                                                                                     color="#233167"
                                                                            // onPress={()=>{this.setState({showAdhocShiftsList:false},()=>{
                                                                            //     this.props.navigation.navigate('ShiftSummary', {shiftId: item.shiftId})
                                                                            // })
                                                                            //     }}
                                                                        />
                                                                    </View>


                                                                    <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                        <View style={[Styles.row]}>
                                                                            <Text
                                                                                style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Payment
                                                                                Type:</Text>
                                                                            <Text
                                                                                style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.adhocPaymentMode}</Text>
                                                                        </View>
                                                                        {
                                                                            item.adhocShiftAmountPaid
                                                                                ?
                                                                                <View style={[Styles.row]}>
                                                                                    <Text
                                                                                        style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Amount:</Text>
                                                                                    <Text
                                                                                        style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>&#x20B9; {item.adhocShiftAmountPaid}</Text>
                                                                                </View>
                                                                                :
                                                                                null
                                                                        }
                                                                    </View>

                                                                    <View style={[Styles.row]}>
                                                                        <Text
                                                                            style={[Styles.f16, Styles.ffLBlack, {color: Services.getShiftStatusColours(item.status)}]}>{_.startCase(item.status)}</Text>
                                                                    </View>


                                                                </View>

                                                            </TouchableOpacity>
                                                        </View>
                                                    );
                                                })}
                                            </List.Section>
                                        </ScrollView>

                                    </View>
                                    :
                                    <View style={[Styles.flex1, Styles.alignCenter]}>
                                        <Text style={[Styles.ffLBold, Styles.f20, Styles.colorBlue]}>No Lite User Shifts
                                            Found</Text>
                                    </View>
                                }
                            </View>
                        </View>
                    </Modal>


                    {/*Bank Details Modal*/}
                    <Modal
                        transparent={true}
                        animated={true}
                        animationType='slide'
                        visible={this.state.ShowAddBankDetailsModal}
                        onRequestClose={() => {
                            this.setState({ShowAddBankDetailsModal: false})
                        }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <View style={[Styles.flex1, Styles.bgWhite, {
                                width: Dimensions.get('window').width,
                                height: Dimensions.get('window').height
                            }]}>
                                {this.state.spinnerBool === false ? null : <CSpinner/>}
                                <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                                    <Appbar.Content title="Bank Details"
                                                    titleStyle={[Styles.ffLBold, Styles.cWhite]}/>
                                    <MaterialCommunityIcons name="window-close" size={32}
                                                            color="#fff" style={{marginRight: 10}}
                                                            onPress={() =>
                                                                this.setState({ShowAddBankDetailsModal: false})
                                                            }/>
                                </Appbar.Header>

                                <View>

                                    <View
                                        style={[Styles.m10, Styles.OrdersScreenCardshadow, Styles.bgLBlueWhite, Styles.p5]}>

                                        <RadioButton.Group
                                            onValueChange={addUserBankDetails => this.setState({addUserBankDetails})}
                                            value={this.state.addUserBankDetails}>
                                            <Text
                                                style={[Styles.ffLBold, Styles.aslStart, Styles.cLightBlue, Styles.f16, Styles.marH10]}>Adding
                                                Bank Details {Services.returnRedStart()}</Text>
                                            <View style={[Styles.row, Styles.aslCenter,]}>

                                                <View style={[Styles.row, Styles.alignCenter]}>
                                                    <RadioButton value={true}/>
                                                    <Text
                                                        style={[Styles.ffLBold, Styles.cLightBlue, Styles.aslCenter, Styles.f16]}>User</Text>
                                                </View>
                                                <View style={[Styles.row, Styles.alignCenter]}>
                                                    <RadioButton value={false}/>
                                                    <Text
                                                        style={[Styles.ffLBold, Styles.cLightBlue, Styles.aslCenter, Styles.f16]}>Beneficiary</Text>
                                                </View>
                                            </View>
                                        </RadioButton.Group>
                                    </View>
                                </View>

                                {
                                    this.state.addUserBankDetails
                                        ?
                                        this.userBankCreateInfo()
                                        :
                                        this.beneficiaryCreateInfo()
                                }


                            </View>
                        </View>
                    </Modal>

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
                                <View style={[Styles.alignCenter, Styles.padV3]}>
                                    <Text style={[Styles.ffLBold, Styles.f20]}>Payment Plans</Text>
                                </View>
                                <ScrollView
                                    persistentScrollbar={true}>
                                    {this.state.plansList.length === 0
                                        ?
                                        <Text style={[Styles.ffLBold, Styles.f18]}>No Plans has found for
                                            selected Site</Text>
                                        :
                                        <List.Section>
                                            {this.state.plansList.map((plan, index) => {
                                                return (
                                                    <List.Item
                                                        onPress={() => this.setState({
                                                            plansListPopUp: false,
                                                            planTitle: plan.planName,
                                                            planId: plan.id
                                                        })}
                                                        style={[Styles.brdrBtm1, Styles.bcAsh]}
                                                        key={index}
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
                                    width: Dimensions.get('window').width - 60,
                                    height: this.state.clientSiteList.length > 0 ? Dimensions.get('window').height / 1.5 : 300,
                                }]]}>
                                <View style={Styles.alignCenter}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select
                                        Sites</Text>
                                </View>
                                <View style={[Styles.alignCenter, Styles.marV10]}>
                                    <Searchbar
                                        style={{
                                            width: Dimensions.get('window').width - 100,
                                            borderWidth: 1,
                                            backgroundColor: '#f5f5f5',
                                        }}
                                        isFocused="false"
                                        placeholder="Search a Site"
                                        onSubmitEditing={() => {
                                            this.searchSite(this.state.searchSiteString), () => {
                                                Keyboard.dismiss()
                                            }
                                        }}
                                        value={this.state.searchSiteString}
                                        onChangeText={(searchSiteString) => {
                                            this.searchSite(searchSiteString)
                                        }}
                                    />
                                </View>
                                {/*persistentScrollbar={true}>*/}
                                {this.state.searchedSiteList.length > 0 ?
                                    <ScrollView
                                        style={{height: Dimensions.get('window').height / 2}}>
                                        <List.Section>
                                            {this.state.searchedSiteList.map(site => {
                                                return (
                                                    <List.Item
                                                        onPress={() => this.setState({
                                                            siteListPopUp: false,
                                                            siteTitle: site.name,
                                                            updatedSiteID: site.id,
                                                            shiftSiteSelection: true
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
                                                                width: 250,
                                                                textAlign: 'center',
                                                                paddingHorizontal: 5,
                                                                paddingVertical: 10,
                                                                backgroundColor: this.state.updatedSiteID === site.id ? '#C91A1F' : '#fff',
                                                                color: this.state.updatedSiteID === site.id ? '#fff' : '#233167',
                                                                borderWidth: this.state.updatedSiteID === site.id ? 0 : 1,
                                                            }]}
                                                        key={this.state.clientSiteList.length}
                                                        title={site.name + ' (' + site.siteCode + ')'}
                                                        // title={site.attrs.siteLable}
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
                            <View
                                style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br15, {width: Dimensions.get('window').width - 60}]}>
                                <Card.Content style={[Styles.aslCenter, Styles.p5, Styles.pBtm18]}>
                                    {/*<Image*/}
                                    {/*    style={[Styles.aslCenter, {height: 200, width: 200}]}*/}
                                    {/*    source={LoadImages.stopWarning}/>*/}
                                    <View style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.mapIconBig}</View>
                                    <Title
                                        style={[Styles.cRed, Styles.f20, Styles.ffLBold, Styles.aslCenter]}>WARNING :
                                        You are creating the shift away from the Site.
                                    </Title>
                                </Card.Content>
                                <Card.Content style={[Styles.row, Styles.jSpaceBet, Styles.p5, Styles.pBtm18,]}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => this.setState({successModal: false, swipeActivated: false})}
                                        style={[Styles.aslCenter, Styles.br10, Styles.bgBlk, Styles.marH5]}>
                                        <Text
                                            style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>CANCEL</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => this.setState({
                                            successModal: false,
                                            otpVerificationModal: true
                                        }, () => {
                                            // this.ShiftAssignToUser()
                                            this.sendOTPtoUser()
                                        })}
                                        style={[Styles.aslCenter, Styles.br10, Styles.bgGrn, Styles.marH5]}>
                                        <Text
                                            style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>PROCEED</Text>
                                    </TouchableOpacity>
                                </Card.Content>
                            </View>
                        </View>
                    </Modal>

                    {/*Images Preview Modal*/}
                    <Modal
                        transparent={true}
                        animated={true}
                        animationType='slide'
                        visible={this.state.imagePreview}
                        onRequestClose={() => {
                            this.setState({imagePreview: false, imagePreviewURL: ''})
                        }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <View style={[Styles.flex1, Styles.bgWhite, {
                                width: Dimensions.get('window').width,
                                height: Dimensions.get('window').height
                            }]}>
                                {this.state.spinnerBool === false ? null : <CSpinner/>}
                                <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                                    <Appbar.Content title="Image Preview"
                                                    titleStyle={[Styles.ffMbold]}/>
                                    <MaterialCommunityIcons name="window-close" size={32}
                                                            color="#000" style={{marginRight: 10}}
                                                            onPress={() =>
                                                                this.setState({
                                                                    imagePreview: false,
                                                                    imagePreviewURL: ''
                                                                })
                                                            }/>
                                </Appbar.Header>
                                <View style={[Styles.flex1]}>
                                    {
                                        this.state.imagePreviewURL
                                            ?
                                            <View>
                                                <View style={[Styles.row, Styles.jSpaceBet]}>
                                                    <View/>
                                                    <TouchableOpacity style={[Styles.row, Styles.marH10]}
                                                                      onPress={() => {
                                                                          this.rotate()
                                                                      }}>
                                                        <Text
                                                            style={[Styles.colorBlue, Styles.f18, Styles.padH5]}>ROTATE</Text>
                                                        <FontAwesome name="rotate-right" size={24} color="black"
                                                        />
                                                    </TouchableOpacity>
                                                </View>

                                                <ImageZoom cropWidth={Dimensions.get('window').width}
                                                           cropHeight={Dimensions.get('window').height}
                                                           imageWidth={Dimensions.get('window').width}
                                                           imageHeight={Dimensions.get('window').height}>
                                                    <Image
                                                        onLoadStart={() => this.setState({previewLoading: true})}
                                                        onLoadEnd={() => this.setState({previewLoading: false})}
                                                        style={[{
                                                            width: Dimensions.get('window').width - 20,
                                                            height: Dimensions.get('window').height - 90,
                                                            transform: [{rotate: this.state.imageRotate + 'deg'}]
                                                        }, Styles.marV5, Styles.aslCenter, Styles.bgDWhite, Styles.ImgResizeModeContain]}
                                                        source={this.state.imagePreviewURL ? {uri: this.state.imagePreviewURL} : null}
                                                    />
                                                </ImageZoom>
                                                <ActivityIndicator
                                                    style={[Styles.ImageUploadActivityIndicator]}
                                                    animating={this.state.previewLoading}
                                                />
                                            </View>
                                            :
                                            null
                                    }

                                </View>


                            </View>
                        </View>
                    </Modal>


                    {/*MODAL FOR IMAGE UPLOAD SELECTION*/}
                    <Modal
                        transparent={true}
                        animated={true}
                        animationType='slide'
                        visible={this.state.imageSelectionModal}
                        onRequestClose={() => {
                            this.setState({imageSelectionModal: false})
                        }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <TouchableOpacity onPress={() => {
                                this.setState({imageSelectionModal: false})
                            }} style={[Styles.modalbgPosition]}>
                            </TouchableOpacity>
                            <View
                                style={[Styles.bgWhite, Styles.aslCenter, Styles.p10, {width: Dimensions.get('window').width - 80}]}>

                                <View style={[Styles.p10]}>
                                    <Text
                                        style={[Styles.f22, Styles.cBlk, Styles.txtAlignCen, Styles.ffLBlack, Styles.pBtm10]}>Add
                                        Image</Text>
                                    <View style={[Styles.marV15]}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({imageSelectionModal: false}, () => {
                                                    this.bankDocumentUpload('CAMERA')
                                                })
                                            }}
                                            activeOpacity={0.7} style={[Styles.marV10, Styles.row, Styles.aitCenter]}>
                                            <FontAwesome name="camera" size={24} color="black"/>
                                            <Text style={[Styles.f20, Styles.cBlk, Styles.ffLBold, Styles.padH10]}>Take
                                                Photo</Text>
                                        </TouchableOpacity>
                                        <Text style={[Styles.ffLBlack, Styles.brdrBtm1, Styles.mBtm15]}/>
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({imageSelectionModal: false}, () => {
                                                    this.bankDocumentUpload('LIBRARY')
                                                })
                                            }}
                                            activeOpacity={0.7} style={[Styles.marV10, Styles.row, Styles.aitCenter]}>
                                            <FontAwesome name="folder" size={24} color="black"/>
                                            <Text
                                                style={[Styles.f20, Styles.cBlk, Styles.ffLBold, Styles.padH10]}>Gallery</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                            </View>
                            {/*<TouchableOpacity style={{marginTop: 20}} onPress={() => {*/}
                            {/*    this.setState({imageSelectionModal: false})*/}
                            {/*}}>*/}
                            {/*    {LoadSVG.cancelIcon}*/}
                            {/*</TouchableOpacity>*/}
                        </View>
                    </Modal>


                    {/*TIME PICKER VIEW WITH CONDITION*/}
                    <View>
                        {
                            this.state.showTimepicker === true
                                ?
                                <RNDateTimePicker
                                    mode="time"
                                    value={new Date()}
                                    // onChange={this.setDate}
                                    onChange={(event, date) => {
                                        if (event.type === "set") {
                                            let tempTime = date
                                            this.setState({
                                                showTimepicker: false,
                                                StartTime: Services.returnCalculatedHours(tempTime),
                                                StartTimeMin: Services.returnCalculatedMinutes(tempTime)
                                            })
                                        } else {
                                            this.setState({showTimepicker: false})
                                        }
                                    }}
                                />
                                :
                                null
                        }
                    </View>

                    {/*MODALS END*/}
                </View>

            </View>

        );
    }
};

const styles = StyleSheet.create({
    item: {
        borderBottomColor: Colors.grey200,
        borderBottomWidth: 1
    }
});


