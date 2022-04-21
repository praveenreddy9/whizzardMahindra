import React, {Component} from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Text,
    Modal,
    Dimensions,
    TouchableOpacity,
    TextInput, Picker, Keyboard, Image, ActivityIndicator, BackHandler, PermissionsAndroid, Alert
} from "react-native";
import {Appbar, Button, Card, Chip, Divider, RadioButton} from 'react-native-paper';
import {CSpinner, LoadSVG, Styles} from "../common";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import Services from "../common/Services";
import OfflineNotice from "../common/OfflineNotice";
import Utils from "../common/Utils";
import DateTimePicker from '@react-native-community/datetimepicker';
import Config from "../common/Config";
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";
import AsyncStorage from "@react-native-community/async-storage";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";
import Geolocation from "react-native-geolocation-service";
import Geocoder from "react-native-geocoding";
import MapView, {Marker} from "react-native-maps/index";
import utils from "@react-native-community/netinfo/src/internal/utils";
import {CheckBox} from "react-native-elements";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import ImageZoom from "react-native-image-pan-zoom";

const options = {
    title: 'Select Avatar',
    // customButtons: [{name: 'fb', title: 'Choose Photo from Facebook'}],
    storageOptions: {
        skipBackup: true,
        path: 'images',
    },
    maxWidth: 1200, maxHeight: 800,
};

Geocoder.init("AIzaSyCr2maoYAmOb3Sg81mYnrBY_m7803DpwWU"); // use a valid API key

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 12.2602;
const LONGITUDE = 77.1461;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;


export default class NewPersonalScreen extends Component {
    constructor(props) {
        super(props);
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
            useSameAddress: false,
            showPersonalPopupModal: false, showFamilyPopupModal: false,
            showAdharPopupModal: false, showPanCardPopupModal: false,
            showDlPopupModal: false, showClothingPopupModal: false, showMapsModal: false,
            reqFields: false,
            canUpdateData: true,
            showKidFields: false,
            listOfMotherTongues: [
                {value: '', languageName: 'Select'},
                {value: 'Assamese', languageName: 'Assamese'},
                {value: 'Bengali', languageName: 'Bengali'},
                {value: 'Bodo', languageName: 'Bodo'},
                {value: 'Dogri', languageName: 'Dogri'},
                {value: 'Gujarati', languageName: 'Gujarati'},
                {value: 'Hindi', languageName: 'Hindi'},
                {value: 'Kannada', languageName: 'Kannada'},
                {value: 'Kashmiri', languageName: 'Kashmiri'},
                {value: 'Konkani', languageName: 'Konkani'},
                {value: 'Maithili', languageName: 'Maithili'},
                {value: 'Malayalam', languageName: 'Malayalam'},
                {value: 'Meitei', languageName: 'Meitei'},
                {value: 'Marathi', languageName: 'Marathi'},
                {value: 'Nepali', languageName: 'Nepali'},
                {value: 'Odia', languageName: 'Odia'},
                {value: 'Punjabi', languageName: 'Punjabi'},
                {value: 'Sanskrit', languageName: 'Sanskrit'},
                {value: 'Santali', languageName: 'Santali'},
                {value: 'Sindhi', languageName: 'Sindhi'},
                {value: 'Tamil', languageName: 'Tamil'},
                {value: 'Telugu', languageName: 'Telugu'},
                {value: 'Urdu', languageName: 'Urdu'},
                {value: 'English', languageName: 'English'},
                {value: 'Kutchi', languageName: 'Kutchi'},
                {value: 'Tulu', languageName: 'Tulu'},
                {value: 'Others', languageName: 'Others'}
            ],
            dlCategories: [{name: 'Select', value: ''},
                {name: 'LMV - Light Motor Vehicle', value: 'LMV'},
                {name: 'HMV - Heavy Motor Vehicle', value: 'HMV'},
                {name: 'MCWG - Motor Cycle with Gear', value: 'MCWG'},
                {name: 'MCWOG - Motor Cycle without Gear', value: 'MCWOG'}],
            waistSizes: [{size: '28', value: '28'}, {size: '30', value: '30'}, {size: '32', value: '32'},
                {size: '34', value: '34'}, {size: '36', value: '36'}, {size: '38', value: '38'}, {
                    size: '40',
                    value: '40'
                },
                {size: '42', value: '42'}, {size: '44', value: '44'}],
            shirtSizes: [{size: 'XXS', value: 'XXS'}, {size: 'XS', value: 'XS'}, {size: 'S', value: 'S'},
                {size: 'M', value: 'M'}, {size: 'L', value: 'L'}, {size: 'XL', value: 'XL'},
                {size: 'XXL', value: 'XXL'}, {size: 'XXXL', value: 'XXXL'}],
            shoeSize: [{size: '6', value: '6'}, {size: '7', value: '7'}, {size: '8', value: '8'},
                {size: '9', value: '9'}, {size: '10', value: '10'}, {size: '11', value: '11'}],
            listOfStates: [
                {value: '', valueName: 'Select State'},
                {value: "Andhra Pradesh", valueName: "Andhra Pradesh"},
                {value: "Arunachal Pradesh", valueName: "Arunachal Pradesh"},
                {value: "Assam", valueName: "Assam"},
                {value: "Bihar", valueName: "Bihar"},
                {value: "Chhattisgarh", valueName: "Chhattisgarh"},
                {value: "Delhi", valueName: "Delhi"},
                {value: "Goa", valueName: "Goa"},
                {value: "Gujarat", valueName: "Gujarat"},
                {value: "Haryana", valueName: "Haryana"},
                {value: "Himachal Pradesh", valueName: "Himachal Pradesh"},
                {value: "Jharkhand", valueName: "Jharkhand"},
                {value: "Karnataka", valueName: "Karnataka"},
                {value: "Kerala", valueName: "Kerala"},
                {value: "Madhya Pradesh", valueName: "Madhya Pradesh"},
                {value: "Maharashtra", valueName: "Maharashtra"},
                {value: "Manipur", valueName: "Manipur"},
                {value: "Meghalaya", valueName: "Meghalaya"},
                {value: "Mizoram", valueName: "Mizoram"},
                {value: "Nagaland", valueName: "Nagaland"},
                {value: "Odisha", valueName: "Odisha"},
                {value: "Punjab", valueName: "Punjab"},
                {value: "Rajasthan", valueName: "Rajasthan"},
                {value: "Sikkim", valueName: "Sikkim"},
                {value: "Tamil Nadu", valueName: "Tamil Nadu"},
                {value: "Telangana", valueName: "Telangana"},
                {value: "Tripura", valueName: "Tripura"},
                {value: "Uttar Pradesh", valueName: "Uttar Pradesh"},
                {value: "Uttarakhand", valueName: "Uttarakhand"},
                {value: "Andaman and Nicobar Islands", valueName: "Andaman and Nicobar Islands"},
                {value: "Dadra & Nagar Haveli and Daman & Diu", valueName: "Dadra & Nagar Haveli and Daman & Diu"},
                {value: "Jammu and Kashmir", valueName: "Jammu and Kashmir"},
                {value: "Lakshadweep", valueName: "Lakshadweep"},
                {value: "Puducherry", valueName: "Puducherry"},
                {value: "Ladakh", valueName: "Ladakh"}
            ],
            email: '',
            corporateEmail: '',
            alternateMobileNumber: '',
            gender: 'Male',
            maritalStatus: 'Single',
            motherTongue: '',
            fatherOrHusbandName: '',
            spouseName: '',
            spouseDateOfBirth: new Date(),
            nameOnAdhaar: '',
            aadharCardNumber: '',
            dateOfBirth: new Date(),
            nameOnPanCard: '',
            panCardNumber: '',
            drivingLicenseNumber: '',
            drivingLicenseExpiryDate: new Date(),
            drivingLicenseType: '',
            height: '',
            shirtSize: '',
            waistSize: '',
            shoesSize: '',
            showDate: false,
            showKidDOB: false,
            kidDOB:new Date().toDateString(),
            permAddress: '',
            permCity: '',
            permState: '',
            permPincode: '',
            permCountry: 'India',
            permHouseNumber: '',
            houseNumber: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India',
            kidsArray: [],
            showAddressDropDown: false,
            canOpenMaps: false,
            LocationCoordinates: [],
            addressType: 'Local',
            addressTypes: [{'type': 'Local', 'value': 'Local'}, {
                'type': 'Permanent',
                'value': 'Permanent'
            }, {'type': 'Both', 'value': 'Both'}],
            permAddressDetails: {},
            localAddressDetails: {},
            nextButton: false,
            MapCountry: 'India',
            isValidPanNumber: null,
            errorPanMessage: null,
            isValidPanName: null,
            errorPanNameMessage: null,
            errorAdharNameMessage: null,
            errorAdharCardMessage: null,
            imagePreview: false, imagePreviewURL: '',imageRotate:'0',
            imageSelectionModal:false

        }
    }

    errorHandling(error) {
        // console.log("error", error, error.response);
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

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        })
        self.setState({
            // UserID: " ",
            UserID: self.props.navigation.state.params.selectedProfileUserID,
            UserFlow: self.props.navigation.state.params.UserFlow,
        }, () => {
            self.getPersonalInformation();
            // console.log('personal userid', self.state.UserID)
        });
    }

    //API CALL TO FETCH PROFILE DETAILS
    getPersonalInformation() {
        const self = this;
        // const UserID = selectedProfileUserID;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_PERSONAL_INFORMATION_WEB + '?&userId=' + self.state.UserID;
        const body = '';
        AsyncStorage.getItem('Whizzard:userStatus').then((userStatus) => {
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                userStatus === 'ACTIVATED'
                    ?
                    this.state.UserFlow === 'NORMAL'
                        ?
                        self.setState({canEditTextInput: userRole === '45'})
                        :
                        self.setState({canEditTextInput: this.state.UserFlow === 'SITE_ADMIN' && userRole === '45'})
                    :
                    self.setState({canEditTextInput: true})
            });
        });
        this.setState({spinnerBool: true, PanCardLoading: true, AadharLoading: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                // console.log("GET_PERSONAL_INFORMATION  resp", response);
                if (response) {
                    var data = response.data;
                    if (self.state.canUpdateData) {
                        self.setState({
                            spinnerBool: false, MyProfileResp: data,
                            checkProfileField: data,
                            email: data.email,
                            corporateEmail: data.corporateEmail,
                            alternateMobileNumber: data.alternateMobileNumber,
                            gender: data.gender,
                            maritalStatus: data.maritalStatus,
                            motherTongue: data.motherTongue,
                            fatherOrHusbandName: data.fatherOrHusbandName,
                            spouseName: data.spouseName,
                            spouseDateOfBirth: data.spouseDateOfBirth,
                            kids: data.kids ? data.kids : [],
                            kidsArray: data.kids ? data.kids : [],
                            nameOnAdhaar: data.nameOnAdhaar,
                            aadharCardNumber: data.aadharCardNumber,
                            dateOfBirth: data.dateOfBirth,
                            nameOnPanCard: data.nameOnPanCard,
                            panCardNumber: data.panCardNumber,
                            drivingLicenseNumber: data.drivingLicenseNumber,
                            drivingLicenseExpiryDate: data.drivingLicenseExpiryDate,
                            drivingLicenseType: data.drivingLicenseType,
                            height: data.height,
                            shirtSize: data.shirtSize,
                            waistSize: data.waistSize,
                            shoesSize: data.shoesSize,
                            permAddress: data.permAddress,
                            permLandmark: data.permLandmark,
                            permCity: data.permCity,
                            permState: data.permState,
                            permPincode: data.permPincode,
                            // permCountry: data.permCountry,
                            permCountry: 'India',
                            permHouseNumber: data.permHouseNumber,
                            houseNumber: data.houseNumber,
                            address: data.address,
                            landmark: data.landmark,
                            city: data.city,
                            lState: data.state,
                            pincode: data.pincode,
                            // country: data.country
                            country: 'India'

                        });
                    } else {
                        self.setState({
                            spinnerBool: false, MyProfileResp: data,
                        });
                    }
                    const onFocusPendingItem = self.props.navigation.state.params.onFocusPendingItem;
                    if (onFocusPendingItem && self.state.canUpdateData === true) {
                        self.checkPendingItem(onFocusPendingItem);
                    }
                }
            }, function (error) {
                // console.log("getProfileDetails error", error.response);
                self.errorHandling(error)
            });
        });
    }


    checkPendingItem(onFocusPendingItem) {
        // console.log('personal onFocusPendingItem', onFocusPendingItem);
        if (onFocusPendingItem === "Missing Aadhaar front copy" || onFocusPendingItem === "Missing AadhaarCard Number" || onFocusPendingItem === "Missing Aadhaar Back Copy") {
            this.setState({showAdharPopupModal: true})
        } else if (onFocusPendingItem === "Missing PAN Card Number" || onFocusPendingItem === "Missing PAN Card Photo") {
            this.setState({showPanCardPopupModal: true})
        } else if (onFocusPendingItem === "Missing Driving License Number" || onFocusPendingItem === "Missing Driving License Front Copy" || onFocusPendingItem === "Missing Driving License Back Copy") {
            this.setState({showDlPopupModal: true})
        } else if (onFocusPendingItem === "Missing Address details" || onFocusPendingItem === "Missing Landmark" || onFocusPendingItem === "Missing Pin Code"
            || onFocusPendingItem === "Missing Local Address details"
            || onFocusPendingItem === "Missing Permanent Address details" || onFocusPendingItem === "Missing Permanent Landmark" || onFocusPendingItem === "Missing Permanent PinCode") {
            // this.detectMyLocation()
            this.requestLocationPermission()
        } else if (onFocusPendingItem === "Missing Family Details") {
            this.setState({showFamilyPopupModal: true})
        }
    }

    // Personal Information Vlaidations and API hitting
    personalInfoValidation() {
        let resp = {};
        let result = {};
        resp = Utils.isValidEmail(this.state.email);
        if (resp.status === true) {
            result.email = resp.message;
            resp = Utils.isEmptyGender(this.state.gender);
            if (resp.status === true) {
                result.gender = resp.message;
                resp = Utils.isEmptyMotherTongue(this.state.motherTongue);
                if (resp.status === true) {
                    result.motherTongue = resp.message;
                    {
                        this.saveOrUpdatePersonalInfo()
                    }
                } else {
                    this.setState({reqFields: true})
                    Utils.dialogBox(resp.message, '')
                }
            } else {
                Utils.dialogBox(resp.message, '')
            }
        } else {
            Utils.dialogBox('please enter your personal email', '');
        }
    }

    saveOrUpdatePersonalInfo() {
        const self = this;
        const data = {
            userId: self.state.UserID,
            email: self.state.email,
            corporateEmail: self.state.corporateEmail,
            alternateMobileNumber: self.state.alternateMobileNumber,
            gender: self.state.gender,
            motherTongue: self.state.motherTongue,
        }
        // console.log('saveOrUpdatePersonalInfo', data)
        const apiUrl = Config.routes.BASE_URL + Config.routes.saveOrUpdatePersonalInfo + '?&userId=' + self.state.UserID;
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'PUT', data, function (response) {
                if (response.status === 200) {
                    self.setState({spinnerBool: false}, () => {
                        Utils.dialogBox('Personal Information Updated Successfully', '');
                        self.setState({showPersonalPopupModal: false, infoUpdated: true}, function () {
                            self.getPersonalInformation();
                        })
                    });
                }
            }, function (error) {
                self.errorHandling(error)
            });
        });
    }

    // Family Information Vlaidations and API hitting
    familyInfoValidation() {
        let resp = {};
        let result = {};
        resp = Utils.isEmptyMStatus(this.state.maritalStatus);
        if (resp.status === true) {
            result.maritalStatus = resp.message;
            if (result.maritalStatus === 'Single') {
                resp = Utils.isValidFullName(this.state.fatherOrHusbandName);
                if (resp.status === true) {
                    result.fatherOrHusbandName = resp.message;
                    {
                        this.saveOrUpdateFamilyInfo()
                    }
                } else {
                    this.setState({reqFields: true})
                    Utils.dialogBox('Please enter Your Father Name', '')
                }
            } else {
                resp = Utils.isValidFullName(this.state.spouseName);
                if (resp.status === true) {
                    result.spouseName = resp.message;
                    {
                        this.saveOrUpdateFamilyInfo()
                    }
                } else {
                    this.setState({reqFields: true})
                    Utils.dialogBox('Please enter your Spouse Name', '')
                }
            }

        } else {
            Utils.dialogBox(resp.message, '')
        }
    }

    saveOrUpdateFamilyInfo() {
        const self = this;
        const data = {
            userId: self.state.UserID,
            maritalStatus: self.state.maritalStatus,
            fatherOrHusbandName: self.state.fatherOrHusbandName,
            spouseName: self.state.spouseName,
            spouseDateOfBirth: self.state.spouseDateOfBirth,
            kids: self.state.kids
        }
        // console.log('saveOrUpdateFamilyInfo', data)
        const apiUrl = Config.routes.BASE_URL + Config.routes.saveOrUpdateFamilyInfo + '?&userId=' + self.state.UserID;
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'PUT', data, function (response) {
                // console.log('saveOrUpdateFamilyInfo resp ', response);
                if (response.status === 200) {
                    self.setState({spinnerBool: false}, () => {
                        Utils.dialogBox('Family Information Updated Successfully', '');
                        self.setState({showFamilyPopupModal: false, infoUpdated: true}, function () {
                            self.getPersonalInformation();
                        })
                    });
                }
            }, function (error) {
                self.errorHandling(error)
            });
        });
    }

    // Aadhar Card Vlaidations and API hitting
    aadharInforValidation() {
        let resp = {};
        let result = {};
        resp = Utils.isValidFullName(this.state.nameOnAdhaar);
        if (resp.status === true) {
            result.nameOnAdhaar = resp.message;
            resp = Utils.isValidAadhar(this.state.aadharCardNumber);
            if (resp.status === true) {
                result.aadharCardNumber = resp.message;
                resp = Utils.isValidDOB(this.state.dateOfBirth);
                if (resp.status === true) {
                    result.dateOfBirth = resp.message;
                    resp = Utils.isValueSelected(this.state.MyProfileResp.aadharPicDetails, 'Please upload Aadhar Card front photo..!')
                    if (resp.status === true) {
                        // result.MyProfileResp.aadharPicDetails = resp.message;
                        resp = Utils.isValueSelected(this.state.MyProfileResp.aadharBackPicDetails, 'Please upload Aadhar Card back photo..!')
                        if (resp.status === true) {
                            // result.MyProfileResp.aadharBackPicDetails = resp.message;
                            {
                                this.saveOrUpdateAadharInfo()
                            }
                        } else {
                            Utils.dialogBox(resp.message, '')
                        }
                    } else {
                        Utils.dialogBox(resp.message, '')
                    }
                } else {
                    Utils.dialogBox(resp.message, '')
                }
            } else {
                Utils.dialogBox(resp.message, '')
            }
        } else {
            Utils.dialogBox(resp.message, '')
        }
    }

    saveOrUpdateAadharInfo() {
        const self = this;
        const data = {
            userId: self.state.UserID,
            nameOnAdhaar: self.state.nameOnAdhaar,
            dateOfBirth: self.state.dateOfBirth,
            aadharCardNumber: self.state.aadharCardNumber,
        }
        // console.log('saveOrUpdateAadharInfo', data)
        const apiUrl = Config.routes.BASE_URL + Config.routes.saveOrUpdateAadharCardInfo + '?&userId=' + self.state.UserID;
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'PUT', data, function (response) {
                // console.log('saveOrUpdateAadharInfo resp ', response);
                if (response.status === 200) {
                    self.setState({spinnerBool: false}, () => {
                        Utils.dialogBox('Aadhar Information Updated Successfully', '');
                        self.setState({showAdharPopupModal: false, infoUpdated: true}, function () {
                            self.getPersonalInformation();
                        })
                    });
                }
            }, function (error) {
                self.errorHandling(error)
            });
        });
    }

    // PAN Card Validations and API hitting
    panInfoValidations() {
        let resp = {};
        let result = {};
        resp = Utils.isValidFullName(this.state.nameOnPanCard);
        if (resp.status === true) {
            result.nameOnPanCard = resp.message
            this.setState({isValidPanName: true, errorPanNameMessage: null});
            resp = Utils.isValidPAN(this.state.panCardNumber);
            if (resp.status === true) {
                result.panCardNumber = resp.message;
                this.setState({isValidPanNumber: true, errorPanMessage: null});
                resp = Utils.isValueSelected(this.state.MyProfileResp.panCardPhoto, 'Please upload PAN Card Photo..!')
                if (resp.status === true) {
                    {
                        this.saveOrUpdatePanCardInfo()
                    }
                } else {
                    Utils.dialogBox(resp.message, '')
                }
            } else {
                this.setState({isValidPanNumber: false, errorPanMessage: resp.message});
            }
        } else {
            this.setState({isValidPanName: false, errorPanNameMessage: resp.message});
        }
    }

    saveOrUpdatePanCardInfo() {
        const self = this;
        const data = {
            userId: self.state.UserID,
            nameOnPanCard: self.state.nameOnPanCard,
            panCardNumber: self.state.panCardNumber,
        }
        // console.log('saveOrUpdatePanCardInfo', data)
        const apiUrl = Config.routes.BASE_URL + Config.routes.saveOrUpdatePANCardInfo + '?&userId=' + self.state.UserID;
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'PUT', data, function (response) {
                // console.log('saveOrUpdatePanCardInfo resp ', response);
                if (response.status === 200) {
                    self.setState({spinnerBool: false}, () => {
                        Utils.dialogBox('PAN Card Information Updated Successfully', '');
                        self.setState({showPanCardPopupModal: false, infoUpdated: true}, function () {
                            self.getPersonalInformation();
                        })
                    });
                }
            }, function (error) {
                // console.log('saveOrUpdatePanCardInfo error', error.response)
                self.errorHandling(error)
            });
        });
    }

    // Driving License Vlaidations and API hitting
    drivingLicenseValidation() {
        let resp = {};
        let result = {};
        resp = Utils.isValueSelected(this.state.drivingLicenseNumber, 'Please enter Driving License Number');
        if (resp.status === true) {
            resp = Utils.isValueSelected(this.state.drivingLicenseExpiryDate, 'Please select Driving License Expiry Date');
            if (resp.status === true) {
                resp = Utils.isValueSelected(this.state.MyProfileResp.drivingLicensePhoto, 'Please upload Driving License Front Photo..!')
                if (resp.status === true) {
                    resp = Utils.isValueSelected(this.state.MyProfileResp.drivingLicenseBackSidePic, 'Please upload Driving License Back Photo..!')
                    if (resp.status === true) {
                        {
                            this.saveOrUpdateDrivingLicenseInfo()
                        }
                    } else {
                        Utils.dialogBox(resp.message, '')
                    }
                } else {
                    Utils.dialogBox(resp.message, '')
                }
            } else {
                Utils.dialogBox(resp.message, '')
            }
        } else {
            Utils.dialogBox(resp.message, '')
        }
    }

    saveOrUpdateDrivingLicenseInfo() {
        const self = this;
        const data = {
            userId: self.state.UserID,
            drivingLicenseNumber: self.state.drivingLicenseNumber,
            drivingLicenseExpiryDate: self.state.drivingLicenseExpiryDate,
            drivingLicenseType: self.state.drivingLicenseType,
        }
        // console.log('saveOrUpdateDrivingLicenseInfo', data)
        const apiUrl = Config.routes.BASE_URL + Config.routes.saveOrUpdateDrivingLicenseInfo + '?&userId=' + self.state.UserID;
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'PUT', data, function (response) {
                // console.log('saveOrUpdateDrivingLicenseInfo resp ', response);
                if (response.status === 200) {
                    self.setState({spinnerBool: false}, () => {
                        Utils.dialogBox('Driving License Information Updated Successfully', '');
                        self.setState({showDlPopupModal: false, infoUpdated: true}, function () {
                            self.getPersonalInformation();
                        })
                    });
                }
            }, function (error) {
                self.errorHandling(error)
            });
        });
    }

    // Temp Address Validations
    temporaryAddressValidation() {
        let resp = {};
        let result = {};
        resp = Utils.isValueSelected(this.state.houseNumber, 'Please enter House no /Flat no');
        if (resp.status === true) {
            result.address = resp.message
            resp = Utils.isValueSelected(this.state.address, 'Please enter Street name /Area name');
        if (resp.status === true) {
            result.address = resp.message
            resp = Utils.isValueSelected(this.state.landmark, 'Please enter Landmark');
            if (resp.status === true) {
                result.landmark = resp.message
                resp = Utils.isValueSelected(this.state.city, 'Please enter City');
                if (resp.status === true) {
                    result.city = resp.message
                    resp = Utils.isValueSelected(this.state.lState, 'Please select State');
                    if (resp.status === true) {
                        result.lState = resp.message
                        resp = Utils.isValueSelected(this.state.pincode, 'Please enter Pincode');
                        if (resp.status === true) {
                            result.pincode = resp.message
                            {
                                this.permanentAddressValidation()
                            }
                        } else {
                            Utils.dialogBox(resp.message, '')
                        }
                    } else {
                        Utils.dialogBox(resp.message, '')
                    }
                } else {
                    Utils.dialogBox(resp.message, '')
                }
            } else {
                Utils.dialogBox(resp.message, '')
            }
        } else {
            Utils.dialogBox(resp.message, '')
        }
        } else {
            Utils.dialogBox(resp.message, '')
        }
    }

    permanentAddressValidation() {
        let resp = {};
        let result = {};
        resp = Utils.isValueSelected(this.state.permHouseNumber, 'Please enter permanent House no /Flat no');
        if (resp.status === true) {
            result.address = resp.message
            resp = Utils.isValueSelected(this.state.permAddress, 'Please enter permanent Street name /Area name');
            if (resp.status === true) {
                result.address = resp.message
                resp = Utils.isValueSelected(this.state.permLandmark, 'Please enter permanent Landmark');
                if (resp.status === true) {
                    result.landmark = resp.message
                    resp = Utils.isValueSelected(this.state.permCity, 'Please enter permanent City');
                    if (resp.status === true) {
                        result.city = resp.message
                        resp = Utils.isValueSelected(this.state.permState, 'Please select permanent State');
                        if (resp.status === true) {
                            result.lState = resp.message
                            resp = Utils.isValueSelected(this.state.permPincode, 'Please enter permanent Pincode');
                            if (resp.status === true) {
                                result.pincode = resp.message
                                {
                                    this.addOrUpdateAddressInfo()
                                }
                            } else {
                                Utils.dialogBox(resp.message, '')
                            }
                        } else {
                            Utils.dialogBox(resp.message, '')
                        }
                    } else {
                        Utils.dialogBox(resp.message, '')
                    }
                } else {
                    Utils.dialogBox(resp.message, '')
                }
            } else {
                Utils.dialogBox(resp.message, '')
            }
        } else {
            Utils.dialogBox(resp.message, '')
        }
    }

    addOrUpdateAddressInfo() {
        const self = this;
        const data = {
            userId: self.state.UserID,
            permAddress: self.state.permAddress,
            permLandmark: this.state.permLandmark,
            permCity: self.state.permCity,
            permState: self.state.permState,
            permPincode: self.state.permPincode,
            permCountry: self.state.permCountry,
            permHouseNumber: self.state.permHouseNumber,
            houseNumber: self.state.houseNumber,
            address: self.state.address,
            landmark: self.state.landmark,
            city: self.state.city,
            state: self.state.lState,
            pincode: self.state.pincode,
            country: self.state.country,
            latitude: this.state.latitude ? this.state.latitude : '',
            longitude: this.state.longitude ? this.state.longitude : '',
        }
        // console.log('addOrUpdateAddressInfo', data)
        const apiUrl = Config.routes.BASE_URL + Config.routes.saveOrUpdateAddressInfo + '?&userId=' + self.state.UserID;
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'PUT', data, function (response) {
                if (response.status === 200) {
                    // console.log('address resp 200', response)
                    self.setState({spinnerBool: false}, () => {
                        Utils.dialogBox('Address Details Updated', '');
                        self.setState({showMapsModal: false, infoUpdated: true}, function () {
                            self.getPersonalInformation();
                        })
                    });
                }
            }, function (error) {
                self.errorHandling(error)
            });
        });
    }

    permSameLocal() {
        if (this.state.useSameAddress) {
            this.setState({
                permAddress: this.state.address,
                permLandmark: this.state.landmark,
                permCity: this.state.city,
                permState: this.state.lState,
                permPincode: this.state.pincode,
                permCountry: this.state.country,
                permHouseNumber: this.state.houseNumber,
            })
        } else {
            this.setState({
                permAddress: this.state.MyProfileResp.permAddress ? this.state.MyProfileResp.permAddress : '',
                permLandmark: this.state.MyProfileResp.permLandmark ? this.state.MyProfileResp.permLandmark : '',
                permCity: this.state.MyProfileResp.permCity ? this.state.MyProfileResp.permCity : '',
                permState: this.state.MyProfileResp.permState ? this.state.MyProfileResp.permState : '',
                permPincode: this.state.MyProfileResp.permPincode ? this.state.MyProfileResp.permPincode : '',
                permCountry: this.state.MyProfileResp.permCountry ? this.state.MyProfileResp.permCountry : '',
                permHouseNumber: this.state.MyProfileResp.permHouseNumber ? this.state.MyProfileResp.permHouseNumber : '',
            })
        }
    }

    //Clothing API
    addOrUpdateClothingInfo() {
        const self = this;
        const data = {
            userId: self.state.UserID,
            height: self.state.height,
            shirtSize: self.state.shirtSize,
            waistSize: self.state.waistSize,
            shoesSize: self.state.shoesSize,
        }
        // console.log('saveOrUpdateClothingInfo', data)
        const apiUrl = Config.routes.BASE_URL + Config.routes.saveOrUpdateClothingInfo + '?&userId=' + self.state.UserID;
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'PUT', data, function (response) {
                // console.log('saveOrUpdateClothingInfo resp ', response);
                if (response.status === 200) {
                    self.setState({spinnerBool: false}, () => {
                        Utils.dialogBox('Clothing Information Updated Successfully', '');
                        self.setState({showClothingPopupModal: false, infoUpdated: true}, function () {
                            self.getPersonalInformation();
                        })
                    });
                }
            }, function (error) {
                self.errorHandling(error)
            });
        });
    }

    updateDate(date, type) {
        // console.log('type', type)
        this.setState({showDate: false});
        if (date) {
            if (type === 'spouseDOB') {
                this.setState({spouseDateOfBirth: date});
            } else if (type === 'dateOfBirth') {
                this.setState({dateOfBirth: date});
            } else if (type === 'drivingLicenseExpiryDate') {
                this.setState({drivingLicenseExpiryDate: date})
            }
        }
    }

    kidDOb(date, type) {
        this.setState({showKidDOB: false});
        if (date) {
            if (type === 'kidDOB') {
                this.setState({kidDOB: date});
            }
        }
    }


    personalInformationImageUpload = (uploadType) => {
        const self = this;
        const data = self.state.imageType;
        Services.checkImageUploadPermissions(uploadType, (response) => {
            // console.log('service image retunr', response);
            let image = response.image
            let formData = response.formData
            let userImageUrl = image.path

                    let INFO;
                    if (data === 'AADHAR_FRONT') {
                        INFO = Config.routes.UPLOAD_AADHAAR_PIC;
                    } else if (data === 'AADHAR_BACK') {
                        INFO = Config.routes.UPLOAD_AADHAAR_BACK_PIC;
                    } else if (data === 'PANCARD') {
                        INFO = Config.routes.UPLOAD_PAN_CARD;
                    } else if (data === 'LICENCE_FRONT') {
                        INFO = Config.routes.UPLOAD_DRIVING_LICENSE;
                    } else if (data === 'LICENCE_BACK') {
                        INFO = Config.routes.UPLOAD_DRIVING_LICENCE_BACK;
                    }
                    let imageUploadURL = Config.routes.BASE_URL + INFO + '?&userId=' + self.state.UserID;
                    const body = formData;
            // console.log('personal pics upload imageUploadURL',imageUploadURL);
                    this.setState({spinnerBool: true}, () => {
                        Services.AuthProfileHTTPRequest(imageUploadURL, 'POST', body, function (response) {
                            // console.log("personal Information ImageUpload resp", response);
                            if (response) {
                                self.getPersonalInformation();
                                self.setState({spinnerBool: false, canUpdateData: false}, () => {
                                    Utils.dialogBox("Image Uploaded successfully", '')
                                })
                            }
                        }, function (error) {
                            self.errorHandling(error)
                        });
                    });
        })
    };

    saveKid() {
        if (this.state.kidName && this.state.kidDOB && this.state.kidGender) {
            let kidDetails = {
                'name': this.state.kidName,
                'dob': new Date(this.state.kidDOB).toDateString(),
                'gender': this.state.kidGender
            }
            this.state.kidsArray.push(kidDetails)
            this.setState({kids: this.state.kidsArray, showKidFields: false}, function () {
                var kidDetails = {
                    'name': '',
                    'dob': new Date().toDateString(),
                    'gender': ''
                }
            })
        } else {
            Utils.dialogBox('please fill all details', '');
        }
    }

    updateKid(index, kidName, kidDOB, kidGender) {
        this.state.kidsArray.map(function (item, indexOfArray) {
            // console.log('item', item);
            if (index === indexOfArray && item) {
                if (kidName) {
                    item.name = kidName
                }
                if (kidDOB) {
                    item.dob =  new Date(kidDOB).toDateString()
                }
                if (kidGender) {
                    item.gender = kidGender
                }
            }
        })
        // console.log('update kids array', this.state.kidsArray);
        this.setState({showKidFields: false, kidsArray: this.state.kidsArray}, function () {
            Utils.dialogBox('Updated Successfully..!', '')
        })
    }

    deleteChild(index) {
        this.state.kidsArray.splice(index, 1);
        this.setState({kidsArray: this.state.kidsArray}, function () {
            Utils.dialogBox('Deleted Successfully..!', '')
        })
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
                        // console.log('current postion', position);
                        this.setState({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            LocationCoordinates: position.coords,
                            canOpenMaps: true,
                            showMapsModal: true
                        })
                    },
                    (error) => {
                        // See error code charts below.
                        // console.log(error.code, error.message);
                        this.setState({
                            latitude: 12.2602,
                            longitude: 77.1461,
                            LocationCoordinates: [],
                            canOpenMaps: false,
                            showMapsModal: false
                        })
                        Utils.dialogBox('Unable to get current location,please try agian', '');
                    },
                    // {enableHighAccuracy: false, timeout: 10000, maximumAge: 100000}
                    {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
                );
            } else {
                this.props.navigation.goBack();
                // console.log('Location permission denied');
                Utils.dialogBox('Location permission denied', '');
                this.setState({canOpenMaps: false})
            }
        } catch (err) {
            console.warn(err);
            // console.log('Location catch err ', err);
        }
    }

    DecodeLocationDetails(coordinate) {
        // console.log('DecodeLocationDetails', coordinate);
        this.setState({spinnerBool: true})
        Geocoder.from(coordinate.latitude, coordinate.longitude)
            .then(json => {
                // console.log('==DecodeLocationDetails json>', json);
                var addressComponent = json.results[0].address_components;
                // console.log('==DecodeLocationDetails addressComponent>', addressComponent);
                let tempState = '';
                let tempPincode = '';
                for (var p = 0; p < addressComponent.length; p++) {
                    let statesList = this.state.listOfStates;
                    for (var m = 0; m < statesList.length; m++) {
                        let string1 = addressComponent[p].long_name;
                        let string2 = statesList[m].value;
                        if (string1 === string2) {
                            tempState = string1;
                        }
                    }

                    if (!isNaN(addressComponent[p].short_name)) {
                        tempPincode = addressComponent[p].short_name;
                    }
                }
                this.setState({
                    pincode: tempPincode,
                    city: addressComponent[2].short_name,
                    lState: tempState,
                    address: addressComponent[1].short_name,
                    country: 'India',
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude,
                    useSameAddress: false,
                    spinnerBool: false
                })
            })
            .catch(error => {
                this.setState({spinnerBool: false})
                console.warn(error)
            })
    }

    detectMyLocation() {
        const self = this;
        if (this.state.LocationCoordinates.length === 0) {
            self.requestLocationPermission();
            self.setState({showMapsModal: false})
        } else {
            self.setState({showMapsModal: true})
        }
    }


    //API CALL TO DELETE UPLOADED IMAGE
    deleteUploadedImage(fieldName, fileName) {
        const self = this;
        const deleteImageURL = Config.routes.BASE_URL + Config.routes.DELETE_UPLOADED_IMAGE + '?fileName=' + fileName + '&fieldName=' + fieldName + '&userId=' + self.state.UserID;
        const body = '';
        // console.log('deleteImageURL', deleteImageURL);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(deleteImageURL, 'POST', body, function (response) {
                // console.log("deleteUploadedImageRes", response);
                if (response) {
                    var data = response.data;
                    self.setState({spinnerBool: false, canUpdateData: false}, () => {
                        Utils.dialogBox("Deleted successfully", '')
                    });
                    self.getPersonalInformation()
                }
            }, function (error) {
                self.errorHandling(error)
            });
        });
    }

    rotate(){
        let newRotation = JSON.parse(this.state.imageRotate) + 90;
        if(newRotation >= 360){
            newRotation =- 360;
        }
        this.setState({
            imageRotate: JSON.stringify(newRotation),
        })
    }

    render() {
        const {canEditTextInput, checkProfileField, MyProfileResp} = this.state;
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <Appbar.Header style={[Styles.defaultbgColor, {borderBottomWidth: 0}]}>
                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                    <Appbar.Content title="Personal Information" titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                </Appbar.Header>

                {/*PROFILE STATUS VIEW*/}
                {Services.showProfileScreensStatus('PERSONAL')}

                <ScrollView>
                    <View style={[Styles.p10]}>
                        <Card style={[Styles.mBtm15, Styles.ProfileScreenCardshadow]}
                              onPress={() => this.setState({showPersonalPopupModal: true})}>
                            <Card.Title title="Personal"
                                        titleStyle={[Styles.ffMbold, Styles.f18]}
                                        left={() => <MaterialCommunityIcons name="check-circle" size={32}
                                                                            color="#b3b3b3"/>}
                                        right={() =>
                                            <MaterialIcons name="chevron-right" size={32} color="#000"
                                                           style={[Styles.bgLWhite, Styles.br15, Styles.mRt10]}/>
                                        }
                            />
                        </Card>
                        <Card style={[Styles.mBtm15, Styles.ProfileScreenCardshadow]}
                              onPress={() => this.setState({showFamilyPopupModal: true})}>
                            <Card.Title title="Family Information"
                                        titleStyle={[Styles.ffMbold, Styles.f18]}
                                        left={() => <MaterialCommunityIcons name="check-circle" size={32}
                                                                            color="#b3b3b3"/>}
                                        right={() =>
                                            <MaterialIcons name="chevron-right" size={32} color="#000"
                                                           style={[Styles.bgLWhite, Styles.br15, Styles.mRt10]}/>
                                        }
                            />
                        </Card>
                        <Card style={[Styles.mBtm15, Styles.ProfileScreenCardshadow]}
                              onPress={() => this.setState({showAdharPopupModal: true})}>
                            <Card.Title title="Aadhar Card"
                                        titleStyle={[Styles.ffMbold, Styles.f18]}
                                        left={() => <MaterialCommunityIcons name="check-circle" size={32}
                                                                            color="#b3b3b3"/>}
                                        right={() =>
                                            <MaterialIcons name="chevron-right" size={32} color="#000"
                                                           style={[Styles.bgLWhite, Styles.br15, Styles.mRt10]}/>
                                        }
                            />
                        </Card>
                        <Card style={[Styles.mBtm15, Styles.ProfileScreenCardshadow]}
                              onPress={() => this.setState({showPanCardPopupModal: true})}>
                            <Card.Title title="PAN Card"
                                        titleStyle={[Styles.ffMbold, Styles.f18]}
                                        left={() => <MaterialCommunityIcons name="check-circle" size={32}
                                                                            color="#b3b3b3"/>}
                                        right={() =>
                                            <MaterialIcons name="chevron-right" size={32} color="#000"
                                                           style={[Styles.bgLWhite, Styles.br15, Styles.mRt10]}/>
                                        }
                            />
                        </Card>
                        <Card style={[Styles.mBtm15, Styles.ProfileScreenCardshadow]}
                              onPress={() => this.setState({showDlPopupModal: true})}>
                            <Card.Title title="Driving License"
                                        titleStyle={[Styles.ffMbold, Styles.f18]}
                                        left={() => <MaterialCommunityIcons name="check-circle" size={32}
                                                                            color="#b3b3b3"/>}
                                        right={() =>
                                            <MaterialIcons name="chevron-right" size={32} color="#000"
                                                           style={[Styles.bgLWhite, Styles.br15, Styles.mRt10]}/>
                                        }
                            />
                        </Card>
                        <Card style={[Styles.mBtm15, Styles.ProfileScreenCardshadow]}
                              onPress={() =>
                                  RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
                                      interval: 10000,
                                      fastInterval: 5000
                                  })
                                      .then(data => {
                                          this.setState({showAddressDropDwon: !this.state.showAddressDropDwon})
                                      }).catch(err => {
                                      // console.log('error code GPS check ', err, err.code);
                                      Utils.dialogBox('GPS permissions denied', '');
                                  })
                              }>
                            <Card.Title title="Address"
                                        titleStyle={[Styles.ffMbold, Styles.f18]}
                                        left={() => <MaterialCommunityIcons name="check-circle" size={32}
                                                                            color="#b3b3b3"/>}
                                        right={() =>
                                            <MaterialCommunityIcons
                                                name={this.state.showAddressDropDwon ? 'chevron-down' : 'chevron-right'}
                                                size={32} color="#000"
                                                style={[Styles.bgLWhite, Styles.br15, Styles.mRt10]}/>
                                        }
                            />
                            {
                                this.state.showAddressDropDwon ?
                                    <View style={[Styles.marH20]}>

                                        {
                                            this.state.address
                                                ?
                                                <View>
                                                    <View style={[Styles.row, Styles.aitCenter, Styles.marV10]}>
                                                        <View style={{marginRight: 10}}>{LoadSVG.homeIcon}</View>
                                                        <Text
                                                            style={[Styles.ffMregular, Styles.f18, {color: '#000'}]}>Local
                                                            Address
                                                        </Text>
                                                    </View>
                                                    <View style={{paddingLeft: 40}}>
                                                        <Text
                                                            style={[Styles.f16, Styles.ffMregular]}>
                                                            {this.state.houseNumber ? 'HNo:'+this.state.houseNumber+ '\n' : null}
                                                            {this.state.address}{'\n'}{this.state.landmark} {'\n'}{this.state.city}, {'\n'}{this.state.lState} - {this.state.pincode},{'\n'}{this.state.country}</Text>
                                                    </View>
                                                </View>
                                                :
                                                null
                                        }

                                        {
                                            this.state.permAddress
                                                ?
                                                <View>
                                                    <View style={[Styles.row, Styles.aitCenter, Styles.marV10]}>
                                                        <View style={{marginRight: 10}}>{LoadSVG.homeIcon}</View>
                                                        <Text
                                                            style={[Styles.ffMregular, Styles.f18, {color: '#000'}]}>Permanent
                                                            Address
                                                        </Text>
                                                    </View>
                                                    <View style={{paddingLeft: 40}}>
                                                        <Text
                                                            style={[Styles.f16, Styles.ffMregular]}>
                                                            {this.state.permHouseNumber ? 'HNo:'+this.state.permHouseNumber+ '\n' : null}
                                                            {this.state.permAddress}{'\n'}{this.state.permLandmark} {'\n'}{this.state.permCity}, {'\n'}{this.state.permState} - {this.state.permPincode},{'\n'}{this.state.permCountry}</Text>
                                                    </View>
                                                </View>
                                                :
                                                null
                                        }

                                        {
                                            this.state.UserFlow === 'NORMAL' || canEditTextInput
                                                ?
                                                <View style={[Styles.row, Styles.aitCenter, Styles.padV10]}>
                                                    <View style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            // this.detectMyLocation()
                                                            this.requestLocationPermission()
                                                        }
                                                        style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20, Styles.br5]}>
                                                        {
                                                            this.state.permAddress && this.state.address
                                                                ?
                                                                <Text
                                                                    style={[Styles.ffMregular, Styles.cBlk, Styles.f16, Styles.aslCenter, Styles.p3]}>Update
                                                                    Address</Text>
                                                                :
                                                                <Text
                                                                    style={[Styles.ffMregular, Styles.cBlk, Styles.f16, Styles.aslCenter, Styles.p3]}>Add
                                                                    Address</Text>
                                                        }
                                                    </TouchableOpacity>
                                                </View>
                                                :
                                                null
                                        }


                                    </View> : null
                            }
                        </Card>
                        <Card style={[Styles.mBtm15, Styles.ProfileScreenCardshadow]}
                              onPress={() => this.setState({showClothingPopupModal: true})}>
                            <Card.Title title="Clothing"
                                        titleStyle={[Styles.ffMbold, Styles.f18]}
                                        left={() => <MaterialCommunityIcons name="check-circle" size={32}
                                                                            color="#b3b3b3"/>}
                                        right={() =>
                                            <MaterialIcons name="chevron-right" size={32} color="#000"
                                                           style={[Styles.bgLWhite, Styles.br15, Styles.mRt10]}/>
                                        }
                            />
                        </Card>
                        <View style={[Styles.flex1, Styles.marV10]}>
                            <Button mode="contained" color='#C91A1F'
                                    contentStyle={[Styles.padV10, Styles.padH30, Styles.ffMregular, Styles.f16]}
                                    onPress={() => {
                                        this.props.navigation.navigate('VehicleDetailsScreen', {
                                            selectedProfileUserID: MyProfileResp.userId,
                                            UserFlow: this.state.UserFlow
                                        })
                                    }}>
                                Next
                            </Button>
                        </View>
                    </View>
                </ScrollView>

                {/* MODALS START*/}
                {/*Personal Details Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.showPersonalPopupModal}
                    onRequestClose={() => {
                        this.setState({showPersonalPopupModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgDarkRed]}>
                                <Appbar.Content title="Add Personal Information"
                                                titleStyle={[Styles.ffMbold]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() => this.setState({showPersonalPopupModal: false})}/>
                            </Appbar.Header>
                            {MyProfileResp
                                ?
                                <ScrollView
                                    style={[Styles.bw1, Styles.bgWhite, {
                                        width: Dimensions.get('window').width,
                                        height: Dimensions.get('window').height
                                    }]}>
                                    <View style={[Styles.p20]}>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter]}>
                                                <View>{LoadSVG.emailId}</View>
                                                <Text
                                                    style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>Email
                                                    Id{Services.returnRedStart()}</Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <TextInput
                                                    editable={this.state.UserFlow === 'NORMAL' ?
                                                        !(canEditTextInput === false && checkProfileField.email) : canEditTextInput}
                                                    style={[{
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#ccc',
                                                        fontSize: 16
                                                    }]}
                                                    placeholder='Your personal email ID'
                                                    value={this.state.email}
                                                    ref={(input) => {
                                                        this.email = input;
                                                    }}
                                                    onSubmitEditing={() => {
                                                        Keyboard.dismiss()
                                                    }}
                                                    onChangeText={(email) => this.setState({email: email})}
                                                />
                                            </View>
                                        </View>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter]}>
                                                <View>{LoadSVG.emailId}</View>
                                                <Text
                                                    style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>Corporate
                                                    Email Id
                                                </Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <TextInput
                                                    editable={this.state.UserFlow === 'NORMAL' ?
                                                        !(canEditTextInput === false && checkProfileField.corporateEmail) : canEditTextInput}
                                                    // editable={false}
                                                    style={[{
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#ccc'
                                                    }, Styles.f16]}
                                                    placeholder='Your corporate email ID'
                                                    value={this.state.corporateEmail}
                                                    ref={(input) => {
                                                        this.corporateEmail = input;
                                                    }}
                                                    onSubmitEditing={() => {
                                                        Keyboard.dismiss()
                                                    }}
                                                    onChangeText={(email) => this.setState({corporateEmail: email})}
                                                />
                                            </View>
                                        </View>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter]}>
                                                <View>{LoadSVG.mobileIcon}</View>
                                                <Text
                                                    style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>
                                                    Alternate Mobile Number
                                                </Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <TextInput
                                                    editable={this.state.UserFlow === 'NORMAL' ?
                                                        !(canEditTextInput === false && checkProfileField.alternateMobileNumber) : canEditTextInput}
                                                    style={[{
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#ccc'
                                                    }, Styles.f16]}
                                                    placeholder='Alternate mobile number'
                                                    value={this.state.alternateMobileNumber}
                                                    ref={(input) => {
                                                        this.alternateMobileNumber = input;
                                                    }}
                                                    onSubmitEditing={() => {
                                                        Keyboard.dismiss()
                                                    }}
                                                    keyboardType='numeric'
                                                    maxLength={10}
                                                    onChangeText={(number) => this.setState({alternateMobileNumber: number})}
                                                />
                                            </View>
                                        </View>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitStart]}>
                                                <View>{LoadSVG.personalNew}</View>
                                                <Text
                                                    style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Gender{Services.returnRedStart()}</Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <RadioButton.Group
                                                    disabled={this.state.UserFlow === 'NORMAL' ?
                                                        !(canEditTextInput === false && this.state.gender === null) : !canEditTextInput}
                                                    onValueChange={gender => this.setState({gender})}
                                                    value={this.state.gender}
                                                >
                                                    <View style={[Styles.row, Styles.mTop8]}>
                                                        <View style={[Styles.row, Styles.aslCenter]}>
                                                            <RadioButton value="Male" disabled={this.state.UserFlow === 'NORMAL' ?
                                                                !(canEditTextInput === false && this.state.gender === null) : !canEditTextInput}/>
                                                            <Text
                                                                style={[Styles.ffMregular, Styles.padH5, Styles.aslCenter, Styles.f16]}>Male</Text>
                                                        </View>
                                                        <View style={[Styles.row, Styles.aslCenter]}>
                                                            <RadioButton value="Female" disabled={this.state.UserFlow === 'NORMAL' ?
                                                                !(canEditTextInput === false && this.state.gender === null) : !canEditTextInput}/>
                                                            <Text
                                                                style={[Styles.ffMregular, Styles.padH5, Styles.aslCenter, Styles.f16]}>Female</Text>
                                                        </View>
                                                    </View>
                                                </RadioButton.Group>
                                            </View>
                                        </View>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter]}>
                                                <View>{LoadSVG.motherTongue}</View>
                                                <Text
                                                    style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>Mother
                                                    Tongue{Services.returnRedStart()}</Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <View
                                                    style={[Styles.bw1, Styles.br5, Styles.mTop5, {borderColor: '#ccc',}]}>
                                                    <Picker
                                                        enabled={this.state.UserFlow === 'NORMAL' ?
                                                            !(canEditTextInput === false && checkProfileField.motherTongue) : canEditTextInput}
                                                        mode="dropdown"
                                                        selectedValue={this.state.motherTongue}
                                                        onValueChange={(itemValue, itemIndex) => this.setState({motherTongue: itemValue})}>
                                                        {this.state.listOfMotherTongues.map((item, index) => {
                                                            return (
                                                                <Picker.Item label={item.languageName}
                                                                             value={item.value}
                                                                             key={index}/>)
                                                        })}
                                                    </Picker>
                                                </View>
                                            </View>
                                        </View>
                                        {
                                            this.state.UserFlow === 'NORMAL' || canEditTextInput
                                                ?
                                                <TouchableOpacity
                                                    style={[Styles.defaultbgColor, Styles.p10, Styles.marV20]}
                                                    onPress={() => this.personalInfoValidation()}>
                                                    <Text
                                                        style={[Styles.aslCenter, Styles.cWhite, Styles.padH10, Styles.padV5, Styles.ffMbold, Styles.f16]}>SAVE</Text>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                    </View>
                                </ScrollView> : null}
                        </View>
                    </View>
                </Modal>

                {/*Family Details Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.showFamilyPopupModal}
                    onRequestClose={() => {
                        this.setState({showFamilyPopupModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgDarkRed]}>
                                <Appbar.Content title="Family Information"
                                                titleStyle={[Styles.ffMbold]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() => this.setState({showFamilyPopupModal: false})}/>
                            </Appbar.Header>
                            {MyProfileResp
                                ?
                                <ScrollView
                                    style={[Styles.bw1, Styles.bgWhite, {
                                        width: Dimensions.get('window').width,
                                        height: Dimensions.get('window').height
                                    }]}>
                                    <View style={[Styles.p20]}>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter]}>
                                                <View>{LoadSVG.maritalNew}</View>
                                                <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Marital
                                                    Status{Services.returnRedStart()}</Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <RadioButton.Group
                                                    disabled={this.state.UserFlow === 'NORMAL' ?
                                                        !(canEditTextInput === false && this.state.maritalStatus == null) : !canEditTextInput}
                                                    onValueChange={maritalStatus => this.setState({maritalStatus})}
                                                    value={this.state.maritalStatus}
                                                >
                                                    <View style={[Styles.row, Styles.mTop8]}>
                                                        <View style={[Styles.row, Styles.aslCenter]}>
                                                            <RadioButton value="Single" disabled={this.state.UserFlow === 'NORMAL' ?
                                                                !(canEditTextInput === false && this.state.maritalStatus == null) : !canEditTextInput}/>
                                                            <Text
                                                                style={[Styles.ffMregular, Styles.padH5, Styles.aslCenter, Styles.f16]}>Single</Text>
                                                        </View>
                                                        <View style={[Styles.row, Styles.aslCenter]}>
                                                            <RadioButton value="Married" disabled={this.state.UserFlow === 'NORMAL' ?
                                                                !(canEditTextInput === false && this.state.maritalStatus == null) : !canEditTextInput}/>
                                                            <Text
                                                                style={[Styles.ffMregular, Styles.padH5, Styles.aslCenter, Styles.f16]}>Married</Text>
                                                        </View>
                                                    </View>
                                                </RadioButton.Group>
                                            </View>
                                        </View>
                                        {this.state.maritalStatus === 'Single' ?
                                            <View style={[Styles.mBtm20]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.personalNew}</View>
                                                    <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Father/Husband
                                                        Name{Services.returnRedStart()}</Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        editable={this.state.UserFlow === 'NORMAL' ?
                                                            !(canEditTextInput === false && checkProfileField.fatherOrHusbandName) : canEditTextInput}
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }, Styles.f16]}
                                                        placeholder='Full Name'
                                                        value={this.state.fatherOrHusbandName}
                                                        onChangeText={(name) => this.setState({fatherOrHusbandName: name})}
                                                    />
                                                </View>
                                            </View>
                                            :
                                            <View>
                                                <View style={[Styles.mBtm20]}>
                                                    <View style={[Styles.row, Styles.aitCenter]}>
                                                        <View>{LoadSVG.personalNew}</View>
                                                        <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Spouse
                                                            Name{Services.returnRedStart()}</Text>
                                                    </View>
                                                    <View style={{paddingLeft: 40}}>
                                                        <TextInput
                                                            editable={this.state.UserFlow === 'NORMAL' ?
                                                                !(canEditTextInput === false && checkProfileField.spouseName) : canEditTextInput}
                                                            style={[{
                                                                borderBottomWidth: 1,
                                                                borderBottomColor: '#ccc'
                                                            }, Styles.f16]}
                                                            placeholder='Full Name'
                                                            value={this.state.spouseName}
                                                            onChangeText={(name) => this.setState({spouseName: name})}
                                                        />
                                                    </View>
                                                </View>
                                                <View style={[Styles.mBtm20]}>
                                                    <View style={[Styles.row, Styles.aitCenter]}>
                                                        <View>{LoadSVG.dob}</View>
                                                        <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Spouse's
                                                            Date
                                                            of
                                                            Birth</Text>
                                                    </View>
                                                    <View style={{paddingLeft: 40}}>
                                                        <TouchableOpacity
                                                            disabled={this.state.UserFlow === 'NORMAL' ?
                                                                (canEditTextInput === false && checkProfileField.spouseDateOfBirth) : !canEditTextInput}
                                                            onPress={() => this.setState({showDate: true})}
                                                            style={[Styles.padV5, Styles.row, Styles.jSpaceBet, {
                                                                borderBottomColor: '#ccc',
                                                                borderBottomWidth: 1
                                                            }]}
                                                        >
                                                            <Text
                                                                style={[Styles.f16, Styles.ffMregular, Styles.aslCenter, {paddingLeft: 5}]}>{this.state.spouseDateOfBirth ? new Date(this.state.spouseDateOfBirth).toDateString() : 'NA'}</Text>
                                                            {LoadSVG.date_picker_icon}
                                                            {this.state.showDate && <DateTimePicker
                                                                timeZoneOffsetInMinutes={0}
                                                                editable={this.state.UserFlow === 'NORMAL' ?
                                                                    !(canEditTextInput === false && checkProfileField.spouseDateOfBirth) : canEditTextInput}
                                                                value={new Date()}
                                                                mode='date'
                                                                maximumDate={new Date()}
                                                                onChange={(event, selectedDate) => {
                                                                    this.updateDate(selectedDate, 'spouseDOB');
                                                                }}/>
                                                            }
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        }
                                    </View>
                                    <Divider style={[styles.shadow]}/>
                                    <View style={[Styles.p20]}>
                                        <View style={[Styles.row, Styles.jSpaceBet, Styles.pBtm18]}>
                                            <Text style={[Styles.f18, Styles.cAsh, Styles.ffMbold]}>Kids Details</Text>
                                            <TouchableOpacity style={[Styles.bw1, Styles.br5]}
                                                              // disabled={this.state.UserFlow === 'NORMAL' ? false : !canEditTextInput}
                                                              onPress={() => this.setState({
                                                                  showKidFields: true,
                                                                  kidName: '',
                                                                  kidDOB: new Date().toDateString(),
                                                                  kidGender: '',
                                                                  editChild: ''
                                                              })}>
                                                <Text
                                                    style={[Styles.aslCenter, Styles.cBlk, Styles.padH10, Styles.padV5, Styles.f16]}>Add</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View>
                                            {this.state.kids ?
                                                this.state.kids.length > 0 ?
                                                    <View style={[{
                                                        paddingLeft: 10,
                                                        flexWrap: 'wrap',
                                                        alignItems: 'flex-start'
                                                    },  Styles.mBtm10]}>
                                                        {
                                                            this.state.kids.map((item, index) => {
                                                                return (
                                                                    <View style={[Styles.row,Styles.alignCenter]} >
                                                                        <Text style={[Styles.f18,Styles.colorBlue,Styles.ffMbold]}>{index+1}.</Text>
                                                                        <Chip key={index}
                                                                              mode='outlined'
                                                                              selectedColor='red'
                                                                              style={[Styles.m5,Styles.padH5,Styles.padV3, {
                                                                                  backgroundColor: this.state.editChild === item.name ? '#db2b30' : '#f3f3f3'
                                                                              }]}
                                                                              textStyle={{
                                                                                  color: this.state.editChild === item.name ? '#fff' : '#000',
                                                                                  fontFamily: 'Muli-Bold',
                                                                                  fontSize: 18,
                                                                              }} onPress={() => this.setState({
                                                                            editChild: item.name,
                                                                            kidName: item.name,
                                                                            kidDOB: new Date(item.dob).toDateString(),
                                                                            kidGender: item.gender,
                                                                            showKidFields: true,
                                                                            childIndex: index
                                                                        })}
                                                                        >{item.name}</Chip>
                                                                        <TouchableOpacity
                                                                            onPress={() => this.deleteChild(index)}
                                                                            style={[Styles.padH3,Styles.alignCenter]}>
                                                                            <Text style={[Styles.f14,Styles.cRed,Styles.ffMregular]}>Remove</Text>
                                                                            {/*<MaterialCommunityIcons name='close'*/}
                                                                            {/*                        color={this.state.editChild === item.name ? '#fff' : 'red'}*/}
                                                                            {/*                        size={28}*/}
                                                                            {/*                        onPress={() => this.deleteChild(index)}/>*/}
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                )
                                                            })
                                                        }
                                                    </View> : null : null
                                            }
                                        </View>
                                        {
                                            this.state.showKidFields ?
                                                <View style={[Styles.p10, Styles.bw1, Styles.br5, Styles.bcAsh]}>
                                                    <View style={[Styles.mBtm20]}>
                                                        <View style={[Styles.row, Styles.aitCenter]}>
                                                            <View>{LoadSVG.personalNew}</View>
                                                            <Text
                                                                style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Name{Services.returnRedStart()}</Text>
                                                        </View>
                                                        <View style={{paddingLeft: 40}}>
                                                            <TextInput
                                                                style={[{
                                                                    borderBottomWidth: 1,
                                                                    borderBottomColor: '#ccc'
                                                                }, Styles.f16]}
                                                                placeholder='Full Name'
                                                                value={this.state.kidName}
                                                                onChangeText={(name) => this.setState({kidName: name})}
                                                            />
                                                        </View>
                                                    </View>
                                                    <View style={[Styles.mBtm20]}>
                                                        <View style={[Styles.row, Styles.aitCenter]}>
                                                            <View>{LoadSVG.dob}</View>
                                                            <Text
                                                                style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Date
                                                                of
                                                                Birth{Services.returnRedStart()}</Text>
                                                        </View>
                                                        <View style={{paddingLeft: 40}}>
                                                            <TouchableOpacity
                                                                disabled={this.state.UserFlow === 'NORMAL' ?
                                                                   !(canEditTextInput === false && checkProfileField.insuranceExpiryDate === null) : !canEditTextInput}
                                                                onPress={() => this.setState({showKidDOB: true})}
                                                                style={[Styles.padV5, Styles.row, Styles.jSpaceBet, {
                                                                    borderBottomColor: '#ccc',
                                                                    borderBottomWidth: 1
                                                                }]}
                                                            >
                                                                <Text
                                                                    style={[Styles.f16, Styles.ffMregular, Styles.aslCenter]}>{new Date(this.state.kidDOB).toDateString()}</Text>
                                                                {LoadSVG.date_picker_icon}
                                                                {this.state.showKidDOB && <DateTimePicker
                                                                    timeZoneOffsetInMinutes={0}
                                                                    value={new Date()}
                                                                    mode='date'
                                                                    maximumDate={new Date()}
                                                                    onChange={(event, selectedDate) => {
                                                                        this.kidDOb(selectedDate, 'kidDOB');
                                                                    }}/>
                                                                }
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                    <View style={[Styles.mBtm20]}>
                                                        <View style={[Styles.row, Styles.aitCenter]}>
                                                            <View>{LoadSVG.personalNew}</View>
                                                            <Text
                                                                style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Gender{Services.returnRedStart()}</Text>
                                                        </View>
                                                        <View style={{paddingLeft: 40}}>
                                                            <RadioButton.Group
                                                                onValueChange={kidGender => this.setState({kidGender})}
                                                                value={this.state.kidGender}
                                                            >
                                                                <View style={[Styles.row, Styles.mTop8]}>
                                                                    <View style={[Styles.row, Styles.aslCenter]}>
                                                                        <RadioButton value="Male"/>
                                                                        <Text
                                                                            style={[Styles.ffMregular, Styles.padH5, Styles.aslCenter, Styles.f16]}>Male</Text>
                                                                    </View>
                                                                    <View style={[Styles.row, Styles.aslCenter]}>
                                                                        <RadioButton value="Female"
                                                                        />
                                                                        <Text
                                                                            style={[Styles.ffMregular, Styles.padH5, Styles.aslCenter, Styles.f16]}>Female</Text>
                                                                    </View>
                                                                </View>
                                                            </RadioButton.Group>
                                                        </View>
                                                    </View>
                                                    <View style={[Styles.row, Styles.jSpaceArd, Styles.marV5, Styles.pTop10]}>
                                                        <TouchableOpacity
                                                            onPress={() => this.setState({showKidFields: false})}
                                                            style={[Styles.br5, Styles.aslCenter, Styles.bgBlk, Styles.OrdersScreenCardshadow]}>
                                                            <Text  style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMbold, Styles.cWhite]}>CANCEL</Text>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                this.state.editChild
                                                                ?
                                                                    this.updateKid(this.state.childIndex, this.state.kidName, this.state.kidDOB, this.state.kidGender)
                                                                    :
                                                                    this.saveKid()
                                                            }}
                                                            style={[Styles.br5, Styles.aslCenter, Styles.bgGrn, Styles.OrdersScreenCardshadow]}>
                                                            <Text
                                                                style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMbold, Styles.cWhite]}>{this.state.editChild ? ' UPDATE ': ' SAVE '}</Text>
                                                        </TouchableOpacity>
                                                    </View>



                                                </View> :
                                                null
                                        }
                                        {
                                            this.state.UserFlow === 'NORMAL' || canEditTextInput
                                                ?
                                                <TouchableOpacity onPress={() => this.familyInfoValidation()}
                                                                  style={[Styles.defaultbgColor, Styles.p10, Styles.marV20]}>
                                                    <Text
                                                        style={[Styles.aslCenter, Styles.cWhite, Styles.padH10, Styles.padV5, Styles.ffMbold, Styles.f16]}>SAVE</Text>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                    </View>
                                </ScrollView> : null}
                        </View>
                    </View>
                </Modal>

                {/*Aadhar Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.showAdharPopupModal}
                    onRequestClose={() => {
                        this.setState({showAdharPopupModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgDarkRed]}>
                                <Appbar.Content title="Add Aadhar Card Details"
                                                titleStyle={[Styles.ffMbold]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() => this.setState({showAdharPopupModal: false})}/>
                            </Appbar.Header>
                            {MyProfileResp
                                ?
                                <ScrollView style={[Styles.bw1, Styles.bgWhite, {
                                    width: Dimensions.get('window').width,
                                    height: Dimensions.get('window').height
                                }]}>
                                    <View style={[Styles.p20]}>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter]}>
                                                <View>{LoadSVG.personalNew}</View>
                                                <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Name as
                                                    Given
                                                    in
                                                    Aadhar Card{Services.returnRedStart()}</Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <TextInput
                                                    editable={this.state.UserFlow === 'NORMAL' ?
                                                        !(canEditTextInput === false && checkProfileField.nameOnAdhaar) : canEditTextInput}
                                                    style={[{
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#ccc'
                                                    }, Styles.f16]}
                                                    placeholder='Full Name'
                                                    value={this.state.nameOnAdhaar}
                                                    onChangeText={(name) => this.setState({nameOnAdhaar: name}, () => {
                                                        let resp = {};
                                                        resp = Utils.isValidFullName(this.state.nameOnAdhaar);
                                                        if (resp.status === true) {
                                                            this.setState({errorAdharNameMessage: null});
                                                        } else {
                                                            this.setState({errorAdharNameMessage: resp.message});
                                                        }
                                                    })}
                                                />
                                                {
                                                    this.state.errorAdharNameMessage ?
                                                        <Text style={{
                                                            color: 'red',
                                                            fontFamily: 'Muli-Regular',
                                                            marginBottom: 5
                                                        }}>{this.state.errorAdharNameMessage}</Text>
                                                        :
                                                        null
                                                }
                                            </View>
                                        </View>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter]}>
                                                <View>{LoadSVG.adharIocn}</View>
                                                <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Aadhar
                                                    Card No{Services.returnRedStart()}</Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <TextInput
                                                    editable={this.state.UserFlow === 'NORMAL' ?
                                                        !(canEditTextInput === false && checkProfileField.aadharCardNumber) : canEditTextInput}
                                                    style={[{
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#ccc'
                                                    }, Styles.f16]}
                                                    placeholder='Adhar Card No'
                                                    keyboardType='numeric'
                                                    maxLength={12}
                                                    value={this.state.aadharCardNumber}
                                                    onChangeText={(adhar) => this.setState({aadharCardNumber: adhar}, function () {
                                                        let resp = {};
                                                        resp = Utils.isValidAadhar(this.state.aadharCardNumber);
                                                        if (resp.status === true) {
                                                            this.setState({errorAdharCardMessage: null});
                                                        } else {
                                                            this.setState({errorAdharCardMessage: resp.message});
                                                        }
                                                    })}
                                                />
                                                {
                                                    this.state.errorAdharCardMessage ?
                                                        <Text style={{
                                                            color: 'red',
                                                            fontFamily: 'Muli-Regular',
                                                            marginBottom: 5
                                                        }}>{this.state.errorAdharCardMessage}</Text>
                                                        :
                                                        null
                                                }
                                            </View>
                                        </View>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter]}>
                                                <View>{LoadSVG.dob}</View>
                                                <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Date of
                                                    Birth{Services.returnRedStart()}</Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <TouchableOpacity
                                                    disabled={this.state.UserFlow === 'NORMAL' ?
                                                        (canEditTextInput === false && checkProfileField.dateOfBirth) : !canEditTextInput}
                                                    onPress={() => this.setState({showDate: true})}
                                                    style={[Styles.padV5, Styles.row, Styles.jSpaceBet, {
                                                        borderBottomColor: '#ccc',
                                                        borderBottomWidth: 1
                                                    }]}
                                                >
                                                    <Text
                                                        style={[Styles.f16, Styles.ffMregular, Styles.aslCenter]}>{this.state.dateOfBirth ? new Date(this.state.dateOfBirth).toDateString() : 'NA'}</Text>
                                                    {LoadSVG.date_picker_icon}
                                                    {this.state.showDate && <DateTimePicker
                                                        timeZoneOffsetInMinutes={0}
                                                        editable={this.state.UserFlow === 'NORMAL' ?
                                                            !(canEditTextInput === false && checkProfileField.dateOfBirth) : canEditTextInput}
                                                        value={new Date()}
                                                        mode='date'
                                                        maximumDate={new Date()}
                                                        onChange={(event, selectedDate) => {
                                                            this.updateDate(selectedDate, 'dateOfBirth');
                                                        }}/>
                                                    }
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        {/*Aadhar Fornt Image Uploads*/}
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                <View style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                <TouchableOpacity
                                                    disabled={this.state.UserFlow === 'NORMAL' ?
                                                        canEditTextInput === false && MyProfileResp.aadharPicDetails : !canEditTextInput}
                                                    onPress={() => {
                                                        // this.personalInformationImageUpload('AADHAR-FRONT')
                                                        this.setState({imageType:'AADHAR_FRONT',imageSelectionModal:true})
                                                    }}
                                                    style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20, Styles.br5]}>
                                                    <Text
                                                        style={[Styles.ffMregular, this.state.UserFlow === 'NORMAL' ?
                                                            canEditTextInput === false && MyProfileResp.aadharPicDetails : canEditTextInput === false ? Styles.cDisabled : Styles.cBlk, Styles.f16, Styles.aslCenter, Styles.p3]}>Upload
                                                        Aadhar Front Photo{Services.returnRedStart()}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            {
                                                MyProfileResp.aadharPicDetails
                                                    ?
                                                    <View
                                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, Styles.posRel, {width: Dimensions.get('window').width - 50,}]}>
                                                        {/*<Image*/}
                                                        {/*    onLoadStart={() => this.setState({aadharLoading: true})}*/}
                                                        {/*    onLoadEnd={() => this.setState({aadharLoading: false})}*/}
                                                        {/*    style={[{*/}
                                                        {/*        width: Dimensions.get('window').width / 2,*/}
                                                        {/*        height: 120*/}
                                                        {/*    }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}*/}
                                                        {/*    source={MyProfileResp.aadharPicDetails.aadharPicUrl ? {uri: MyProfileResp.aadharPicDetails.aadharPicUrl} : null}*/}
                                                        {/*/>*/}

                                                        <TouchableOpacity
                                                            style={[Styles.row, Styles.aslCenter]}
                                                            onPress={() => {
                                                                this.setState({
                                                                    imagePreview: true,
                                                                    imagePreviewURL: MyProfileResp.aadharPicDetails.aadharPicUrl  ? MyProfileResp.aadharPicDetails.aadharPicUrl  : ''
                                                                })
                                                            }}>
                                                            <Image
                                                                onLoadStart={() => this.setState({aadharLoading: true})}
                                                                onLoadEnd={() => this.setState({aadharLoading: false})}
                                                                style={[{
                                                                    width: Dimensions.get('window').width / 2,
                                                                    height: 120
                                                                }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                source={MyProfileResp.aadharPicDetails.aadharPicUrl ? {uri:MyProfileResp.aadharPicDetails.aadharPicUrl } : null}
                                                            />
                                                            <MaterialCommunityIcons
                                                                name="resize"
                                                                size={24}
                                                                color="black"/>
                                                        </TouchableOpacity>

                                                        <ActivityIndicator
                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                            animating={this.state.aadharLoading}
                                                        />
                                                        <View style={[styles.posAbsoluteChip]}>
                                                            {
                                                                canEditTextInput === false && MyProfileResp.aadharPicDetails
                                                                    ?
                                                                    null
                                                                    :
                                                                    MyProfileResp.aadharPicDetails
                                                                        ?
                                                                        <TouchableOpacity
                                                                            onPress={() => {
                                                                                this.deleteUploadedImage('aadharPicDetails', MyProfileResp.aadharPicDetails.fileName)
                                                                            }}
                                                                            style={[Styles.bw1, Styles.br30, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                            <MaterialIcons name='close' size={28}
                                                                                           color='#fff'/>
                                                                        </TouchableOpacity>
                                                                        :
                                                                        null
                                                            }
                                                        </View>
                                                    </View>
                                                    :
                                                    null
                                            }
                                        </View>

                                        {/*Aadhar Back Image Uploads*/}
                                        <View>
                                            <View style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                <View style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                <TouchableOpacity
                                                    disabled={this.state.UserFlow === 'NORMAL' ?
                                                        canEditTextInput === false && MyProfileResp.aadharBackPicDetails : !canEditTextInput}
                                                    onPress={() => {
                                                        // this.personalInformationImageUpload('AADHAR-BACK')
                                                        this.setState({imageType:'AADHAR_BACK',imageSelectionModal:true})
                                                    }}
                                                    style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20, Styles.br5]}>
                                                    <Text
                                                        style={[Styles.ffMregular, this.state.UserFlow === 'NORMAL' ?
                                                            canEditTextInput === false && MyProfileResp.aadharBackPicDetails : canEditTextInput === false ? Styles.cDisabled : Styles.cBlk, Styles.p3, Styles.f16, Styles.aslCenter]}>Upload
                                                        Aadhar Back Photo{Services.returnRedStart()}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            {
                                                MyProfileResp.aadharBackPicDetails
                                                    ?
                                                    <View
                                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, Styles.posRel, {width: Dimensions.get('window').width - 50,}]}>
                                                        <TouchableOpacity
                                                            style={[Styles.row, Styles.aslCenter]}
                                                            onPress={() => {
                                                                this.setState({
                                                                    imagePreview: true,
                                                                    imagePreviewURL: MyProfileResp.aadharBackPicDetails.aadharPicUrl  ? MyProfileResp.aadharBackPicDetails.aadharPicUrl  : ''
                                                                })
                                                            }}>
                                                        <Image
                                                            onLoadStart={() => this.setState({aadharLoading: true})}
                                                            onLoadEnd={() => this.setState({aadharLoading: false})}
                                                            style={[{
                                                                width: Dimensions.get('window').width / 2,
                                                                height: 120
                                                            }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                            source={MyProfileResp.aadharBackPicDetails.aadharPicUrl ? {uri: MyProfileResp.aadharBackPicDetails.aadharPicUrl} : null}
                                                        />
                                                            <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                        </TouchableOpacity>
                                                        <ActivityIndicator
                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                            animating={this.state.aadharLoading}
                                                        />
                                                        <View style={[styles.posAbsoluteChip]}>
                                                            {
                                                                canEditTextInput === false && MyProfileResp.aadharBackPicDetails
                                                                    ?
                                                                    null
                                                                    :
                                                                    MyProfileResp.aadharBackPicDetails
                                                                        ?
                                                                        <TouchableOpacity
                                                                            onPress={() => {
                                                                                this.deleteUploadedImage('aadharBackPicDetails', MyProfileResp.aadharBackPicDetails.fileName)
                                                                            }}
                                                                            style={[Styles.bw1, Styles.br30, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                            <MaterialIcons name='close' size={28}
                                                                                           color='#fff'/>
                                                                        </TouchableOpacity>
                                                                        :
                                                                        null
                                                            }
                                                        </View>
                                                    </View>
                                                    :
                                                    null
                                            }
                                        </View>
                                        {
                                            this.state.UserFlow === 'NORMAL' || canEditTextInput
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => this.aadharInforValidation()}
                                                    style={[Styles.defaultbgColor, Styles.p10, Styles.marV20]}>
                                                    <Text
                                                        style={[Styles.aslCenter, Styles.cWhite, Styles.padH10, Styles.padV5, Styles.ffMbold, Styles.f16]}>SAVE</Text>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                    </View>
                                </ScrollView> : null
                            }
                        </View>
                    </View>
                </Modal>

                {/*Pancard Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.showPanCardPopupModal}
                    onRequestClose={() => {
                        this.setState({showPanCardPopupModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgDarkRed]}>
                                <Appbar.Content title="Add PAN Card Details"
                                                titleStyle={[Styles.ffMbold ]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() => this.setState({showPanCardPopupModal: false})}/>
                            </Appbar.Header>
                            {MyProfileResp
                                ?
                                <ScrollView
                                    style={[Styles.bw1, Styles.bgWhite, {
                                        width: Dimensions.get('window').width,
                                        height: Dimensions.get('window').height
                                    }]}>
                                    <View style={[Styles.p20]}>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter]}>
                                                <View>{LoadSVG.personalNew}</View>
                                                <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Name as
                                                    Given
                                                    in
                                                    PAN Card{Services.returnRedStart()}</Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <TextInput
                                                    editable={this.state.UserFlow === 'NORMAL' ?
                                                        !(canEditTextInput === false && checkProfileField.nameOnPanCard) : canEditTextInput}
                                                    style={[{
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#ccc'
                                                    }, Styles.f16]}
                                                    placeholder='Full Name'
                                                    value={this.state.nameOnPanCard}
                                                    onChangeText={(name) => this.setState({nameOnPanCard: name}, function () {
                                                        let resp = {};
                                                        resp = Utils.isValidFullName(this.state.nameOnPanCard);
                                                        if (resp.status === true) {
                                                            this.setState({errorPanNameMessage: null});
                                                        } else {
                                                            this.setState({errorPanNameMessage: resp.message});
                                                        }
                                                    })}
                                                />
                                                {
                                                    this.state.errorPanNameMessage ?
                                                        <Text style={{
                                                            color: 'red',
                                                            fontFamily: 'Muli-Regular',
                                                            marginBottom: 5
                                                        }}>{this.state.errorPanNameMessage}</Text>
                                                        :
                                                        null
                                                }
                                            </View>
                                        </View>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter]}>
                                                <View>{LoadSVG.panIcon}</View>
                                                <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>PAN Card
                                                    No{Services.returnRedStart()}</Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <TextInput
                                                    editable={this.state.UserFlow === 'NORMAL' ?
                                                        !(canEditTextInput === false && checkProfileField.panCardNumber) : canEditTextInput}
                                                    style={[{
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#ccc',
                                                    }, Styles.f16,]}
                                                    placeholder='Ex:ABCDE1234C'
                                                    autoCapitalize='characters'
                                                    value={this.state.panCardNumber}
                                                    onChangeText={(number) => this.setState({panCardNumber: number}, function () {
                                                        let resp = {};
                                                        resp = Utils.isValidPAN(this.state.panCardNumber);
                                                        if (resp.status === true) {
                                                            this.setState({errorPanMessage: null});
                                                        } else {
                                                            this.setState({errorPanMessage: resp.message});
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
                                        {/*{PAN card Upload}*/}
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                <View style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                <TouchableOpacity
                                                    disabled={this.state.UserFlow === 'NORMAL' ?
                                                        canEditTextInput === false && MyProfileResp.panCardPhoto : !canEditTextInput}
                                                    onPress={() => {
                                                        // this.personalInformationImageUpload('PANCARD')
                                                        this.setState({imageType:'PANCARD',imageSelectionModal:true})
                                                    }}
                                                    style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20, Styles.br5]}>
                                                    <Text
                                                        style={[Styles.ffMregular, this.state.UserFlow === 'NORMAL' ?
                                                            canEditTextInput === false && MyProfileResp.panCardPhoto : canEditTextInput === false ? Styles.cDisabled : Styles.cBlk, Styles.f16, Styles.aslCenter, Styles.p3]}>Upload
                                                        PAN Card Photo{Services.returnRedStart()}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            {
                                                MyProfileResp.panCardPhoto
                                                    ?
                                                    <View
                                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, Styles.posRel, {width: Dimensions.get('window').width - 50,}]}>
                                                        <TouchableOpacity
                                                            style={[Styles.row, Styles.aslCenter]}
                                                            onPress={() => {
                                                                this.setState({
                                                                    imagePreview: true,
                                                                    imagePreviewURL: MyProfileResp.panCardPhoto.panCardUrl  ? MyProfileResp.panCardPhoto.panCardUrl  : ''
                                                                })
                                                            }}>
                                                        <Image
                                                            onLoadStart={() => this.setState({panCardLoading: true})}
                                                            onLoadEnd={() => this.setState({panCardLoading: false})}
                                                            style={[{
                                                                width: Dimensions.get('window').width / 2,
                                                                height: 120
                                                            }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                            source={MyProfileResp.panCardPhoto.panCardUrl ? {uri: MyProfileResp.panCardPhoto.panCardUrl} : null}
                                                        />
                                                            <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                        </TouchableOpacity>
                                                        <ActivityIndicator
                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                            animating={this.state.panCardLoading}
                                                        />
                                                        <View style={[styles.posAbsoluteChip]}>
                                                            {
                                                                canEditTextInput === false && MyProfileResp.panCardPhoto
                                                                    ?
                                                                    null
                                                                    :
                                                                    MyProfileResp.panCardPhoto
                                                                        ?
                                                                        <TouchableOpacity
                                                                            onPress={() => {
                                                                                this.deleteUploadedImage('panCardPhoto', MyProfileResp.panCardPhoto.fileName)
                                                                            }}
                                                                            style={[Styles.bw1, Styles.br30, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                            <MaterialIcons name='close' size={28}
                                                                                           color='#fff'/>
                                                                        </TouchableOpacity>
                                                                        :
                                                                        null
                                                            }
                                                        </View>
                                                    </View>
                                                    :
                                                    null
                                            }
                                        </View>
                                        {
                                            this.state.UserFlow === 'NORMAL' || canEditTextInput
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => this.panInfoValidations()}
                                                    style={[Styles.defaultbgColor, Styles.p10, Styles.marV20]}>
                                                    <Text
                                                        style={[Styles.aslCenter, Styles.cWhite, Styles.padH10, Styles.padV5, Styles.ffMbold, Styles.f16]}>SAVE</Text>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                    </View>
                                </ScrollView> : null}
                        </View>
                    </View>
                </Modal>

                {/*driving licence Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.showDlPopupModal}
                    onRequestClose={() => {
                        this.setState({showDlPopupModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgDarkRed, ]}>
                                <Appbar.Content title="Add Driving Licence Details"
                                                titleStyle={[Styles.ffMbold ]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() => this.setState({showDlPopupModal: false})}/>
                            </Appbar.Header>
                            {MyProfileResp
                                ?
                                <ScrollView
                                    style={[Styles.bw1, Styles.bgWhite, {
                                        width: Dimensions.get('window').width,
                                        height: Dimensions.get('window').height
                                    }]}>
                                    <View style={[Styles.p20]}>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter]}>
                                                <View>{LoadSVG.dlIcon}</View>
                                                <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Driving
                                                    Licence Number{Services.returnRedStart()}</Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <TextInput
                                                    editable={this.state.UserFlow === 'NORMAL' ?
                                                        !(canEditTextInput === false && checkProfileField.drivingLicenseNumber) : canEditTextInput}
                                                    style={[{borderBottomWidth: 1, borderBottomColor: '#ccc'}]}
                                                    placeholder='Ex: AP2420160000738'
                                                    value={this.state.drivingLicenseNumber}
                                                    onChangeText={(num) => this.setState({drivingLicenseNumber: num})}
                                                />
                                            </View>
                                        </View>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter]}>
                                                <View>{LoadSVG.dob}</View>
                                                <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>DL Expiry
                                                    Date{Services.returnRedStart()}</Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <TouchableOpacity
                                                    disabled={this.state.UserFlow === 'NORMAL' ?
                                                        (canEditTextInput === false && checkProfileField.drivingLicenseExpiryDate) : !canEditTextInput}
                                                    onPress={() => this.setState({showDate: true})}
                                                    style={[Styles.padV5, Styles.row, Styles.jSpaceBet, {
                                                        borderBottomColor: '#ccc',
                                                        borderBottomWidth: 1
                                                    }]}
                                                >
                                                    <Text
                                                        style={[Styles.f16, Styles.ffMregular, Styles.aslCenter]}>{this.state.drivingLicenseExpiryDate ? new Date(this.state.drivingLicenseExpiryDate).toDateString() : 'NA'}</Text>
                                                    {LoadSVG.date_picker_icon}
                                                    {this.state.showDate && <DateTimePicker
                                                        timeZoneOffsetInMinutes={0}
                                                        editable={this.state.UserFlow === 'NORMAL' ?
                                                            !(canEditTextInput === false && checkProfileField.drivingLicenseExpiryDate) : canEditTextInput}
                                                        value={new Date()}
                                                        mode='date'
                                                        minimumDate={new Date()}
                                                        onChange={(event, selectedDate) => {
                                                            this.updateDate(selectedDate, 'drivingLicenseExpiryDate');
                                                        }}/>
                                                    }
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/*Driving Licence Front Image Upload */}
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                <View style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                <TouchableOpacity
                                                    disabled={this.state.UserFlow === 'NORMAL' ?
                                                        canEditTextInput === false && MyProfileResp.drivingLicensePhoto : !canEditTextInput}
                                                    onPress={() => {
                                                        // this.personalInformationImageUpload('LICENCE-FRONT')
                                                        this.setState({imageType:'LICENCE_FRONT',imageSelectionModal:true})
                                                    }}
                                                    style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20, Styles.br5]}>
                                                    <Text
                                                        style={[Styles.ffMregular, this.state.UserFlow === 'NORMAL' ?
                                                            canEditTextInput === false && MyProfileResp.drivingLicensePhoto : canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue, Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                        Licence Front Photo{Services.returnRedStart()}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            {
                                                MyProfileResp.drivingLicensePhoto
                                                    ?
                                                    <View
                                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, Styles.posRel, {width: Dimensions.get('window').width - 50,}]}>
                                                        <TouchableOpacity
                                                            style={[Styles.row, Styles.aslCenter]}
                                                            onPress={() => {
                                                                this.setState({
                                                                    imagePreview: true,
                                                                    imagePreviewURL: MyProfileResp.drivingLicensePhoto.drivingLicenseUrl  ? MyProfileResp.drivingLicensePhoto.drivingLicenseUrl  : ''
                                                                })
                                                            }}>
                                                        <Image
                                                            onLoadStart={() => this.setState({licenceFront: true})}
                                                            onLoadEnd={() => this.setState({licenceFront: false})}
                                                            style={[{
                                                                width: Dimensions.get('window').width / 2,
                                                                height: 120
                                                            }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                            source={MyProfileResp.drivingLicensePhoto.drivingLicenseUrl ? {uri: MyProfileResp.drivingLicensePhoto.drivingLicenseUrl} : null}
                                                        />
                                                            <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                        </TouchableOpacity>
                                                        <ActivityIndicator
                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                            animating={this.state.licenceFront}
                                                        />
                                                        <View style={[styles.posAbsoluteChip]}>
                                                            {
                                                                canEditTextInput === false && MyProfileResp.drivingLicensePhoto
                                                                    ?
                                                                    null
                                                                    :
                                                                    MyProfileResp.drivingLicensePhoto
                                                                        ?
                                                                        <TouchableOpacity
                                                                            onPress={() => {
                                                                                this.deleteUploadedImage('drivingLicensePhoto', MyProfileResp.drivingLicensePhoto.fileName)
                                                                            }}
                                                                            style={[Styles.bw1, Styles.br30, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                            <MaterialIcons name='close' size={28}
                                                                                           color='#fff'/>
                                                                        </TouchableOpacity>
                                                                        :
                                                                        null
                                                            }
                                                        </View>
                                                    </View>
                                                    :
                                                    null
                                            }
                                        </View>

                                        {/*Driving Licence Back Image Upload */}
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                <View style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                <TouchableOpacity
                                                    disabled={this.state.UserFlow === 'NORMAL' ?
                                                        canEditTextInput === false && MyProfileResp.drivingLicenseBackSidePic : !canEditTextInput}
                                                    onPress={() => {
                                                        // this.personalInformationImageUpload('LICENCE-BACK')
                                                        this.setState({imageType:'LICENCE_BACK',imageSelectionModal:true})
                                                    }}
                                                    style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20, Styles.br5]}>
                                                    <Text
                                                        style={[Styles.ffMregular, this.state.UserFlow === 'NORMAL' ?
                                                            canEditTextInput === false && MyProfileResp.drivingLicenseBackSidePic : canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue, Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                        Licence Back Photo{Services.returnRedStart()}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            {
                                                MyProfileResp.drivingLicenseBackSidePic
                                                    ?
                                                    <View
                                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, Styles.posRel, {width: Dimensions.get('window').width - 50,}]}>
                                                        <TouchableOpacity
                                                            style={[Styles.row, Styles.aslCenter]}
                                                            onPress={() => {
                                                                this.setState({
                                                                    imagePreview: true,
                                                                    imagePreviewURL: MyProfileResp.drivingLicenseBackSidePic.licenseBackSideUrl  ? MyProfileResp.drivingLicenseBackSidePic.licenseBackSideUrl  : ''
                                                                })
                                                            }}>
                                                        <Image
                                                            onLoadStart={() => this.setState({licenceFront: true})}
                                                            onLoadEnd={() => this.setState({licenceFront: false})}
                                                            style={[{
                                                                width: Dimensions.get('window').width / 2,
                                                                height: 120
                                                            }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                            source={MyProfileResp.drivingLicenseBackSidePic.licenseBackSideUrl ? {uri: MyProfileResp.drivingLicenseBackSidePic.licenseBackSideUrl} : null}
                                                        />
                                                            <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                        </TouchableOpacity>
                                                        <ActivityIndicator
                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                            animating={this.state.licenceFront}
                                                        />
                                                        <View style={[styles.posAbsoluteChip]}>
                                                            {
                                                                canEditTextInput === false && MyProfileResp.drivingLicenseBackSidePic
                                                                    ?
                                                                    null
                                                                    :
                                                                    MyProfileResp.drivingLicenseBackSidePic
                                                                        ?
                                                                        <TouchableOpacity
                                                                            onPress={() => {
                                                                                this.deleteUploadedImage('drivingLicenseBackSidePic', MyProfileResp.drivingLicenseBackSidePic.fileName)
                                                                            }}
                                                                            style={[Styles.bw1, Styles.br30, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                            <MaterialIcons name='close' size={28}
                                                                                           color='#fff'/>
                                                                        </TouchableOpacity>
                                                                        :
                                                                        null
                                                            }
                                                        </View>
                                                    </View>
                                                    :
                                                    null
                                            }
                                        </View>

                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter]}>
                                                <View>{LoadSVG.bloodGroup}</View>
                                                <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Driving
                                                    Licence
                                                    Category</Text>
                                            </View>
                                            <View style={{paddingLeft: 40}}>
                                                <View
                                                    style={[Styles.bw1, Styles.br5, Styles.mTop5, {borderColor: this.state.reqFields ? 'red' : '#ccc',}]}>
                                                    <Picker
                                                        enabled={this.state.UserFlow === 'NORMAL' ?
                                                            canEditTextInput === false && this.state.drivingLicenseType === null : canEditTextInput}
                                                        style={[Styles.bw1, Styles.br5, Styles.mTop5, {borderColor: this.state.reqFields ? 'red' : '#ccc',}]}
                                                        itemStyle={[Styles.ffMregular, Styles.f18]}
                                                        selectedValue={this.state.drivingLicenseType}
                                                        mode='dropdown'
                                                        onValueChange={(itemValue, itemIndex) => this.setState({drivingLicenseType: itemValue})}
                                                    >
                                                        {this.state.dlCategories.map((item, index) => {
                                                            return (
                                                                <Picker.Item label={item.name}
                                                                             value={item.value}
                                                                             key={index}/>)
                                                        })}
                                                    </Picker>
                                                </View>
                                            </View>
                                        </View>
                                        {
                                            this.state.UserFlow === 'NORMAL' || canEditTextInput
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => this.drivingLicenseValidation()}
                                                    style={[Styles.defaultbgColor, Styles.p10, Styles.marV20]}>
                                                    <Text
                                                        style={[Styles.aslCenter, Styles.cWhite, Styles.padH10, Styles.padV5, Styles.ffMbold, Styles.f16]}>SAVE</Text>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                    </View>
                                </ScrollView> : null}
                        </View>
                    </View>
                </Modal>

                {/*clothing Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.showClothingPopupModal}
                    onRequestClose={() => {
                        this.setState({showClothingPopupModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgDarkRed ]}>
                                <Appbar.Content title="Add Clothing Details"
                                                titleStyle={[Styles.ffMbold]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() => this.setState({showClothingPopupModal: false})}/>
                            </Appbar.Header>
                            {MyProfileResp
                                ?
                                <ScrollView
                                    style={[Styles.bw1, Styles.bgWhite, {
                                        width: Dimensions.get('window').width,
                                        height: Dimensions.get('window').height
                                    }]}>
                                    <View style={[Styles.p20]}>
                                        <View style={[Styles.mBtm20]}>
                                            <View style={[Styles.row, Styles.aitCenter, Styles.pBtm10]}>
                                                <View>{LoadSVG.heightIcon}</View>
                                                <Text
                                                    style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Height</Text>
                                            </View>
                                            <View style={[Styles.row, Styles.aitCenter, {paddingLeft: 40}]}>
                                                <TextInput
                                                    editable={this.state.UserFlow === 'NORMAL' ?
                                                        canEditTextInput === false && this.state.height === null : canEditTextInput}
                                                    style={[{
                                                        borderColor: '#ccc',
                                                        borderRadius: 5,
                                                        borderWidth: 1,
                                                        width: 100,
                                                        textAlign: 'center'
                                                    }]}
                                                    placeholder='cms'
                                                    value={this.state.height}
                                                    onChangeText={(num) => this.setState({height: num})}
                                                />
                                            </View>
                                            <View style={[Styles.mBtm20]}>
                                                <View style={[Styles.row, Styles.aitCenter, Styles.padV10]}>
                                                    <View>{LoadSVG.trouserIcon}</View>
                                                    <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Select
                                                        Trouser
                                                        (Waist Size) {this.state.waistSize}</Text>
                                                </View>
                                                <View style={[{
                                                    paddingLeft: 40,
                                                    flexWrap: 'wrap',
                                                    alignItems: 'flex-start'
                                                }, Styles.row]}>
                                                    {
                                                        this.state.waistSizes.map(item => {
                                                            return (
                                                                <Chip key={item.value}
                                                                      mode='outlined'
                                                                      selectedColor='red'
                                                                      style={[Styles.m5, {backgroundColor: this.state.waistSize === item.value ? '#db2b30' : '#f3f3f3'}]}
                                                                      textStyle={{
                                                                          color: this.state.waistSize === item.value ? '#fff' : '#000',
                                                                          fontFamily: 'Muli-Bold'
                                                                      }}
                                                                      onPress={() => this.setState({waistSize: item.value})}>{item.size}</Chip>
                                                            )
                                                        })
                                                    }
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm20]}>
                                                <View style={[Styles.row, Styles.aitCenter, Styles.padV10]}>
                                                    <View>{LoadSVG.shirtIcon}</View>
                                                    <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Select
                                                        Shirt
                                                        Size</Text>
                                                </View>
                                                <View style={[{
                                                    paddingLeft: 40,
                                                    flexWrap: 'wrap',
                                                    alignItems: 'flex-start'
                                                }, Styles.row]}>
                                                    {
                                                        this.state.shirtSizes.map(item => {
                                                            return (
                                                                <Chip key={item.value}
                                                                      mode='outlined'
                                                                      selectedColor='red'
                                                                      style={[Styles.m5, {backgroundColor: this.state.shirtSize === item.value ? '#db2b30' : '#f3f3f3'}]}
                                                                      textStyle={{
                                                                          color: this.state.shirtSize === item.value ? '#fff' : '#000',
                                                                          fontFamily: 'Muli-Bold'
                                                                      }}
                                                                      onPress={() => this.setState({shirtSize: item.value})}>{item.size}</Chip>
                                                            )
                                                        })
                                                    }
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm20]}>
                                                <View style={[Styles.row, Styles.aitCenter, Styles.padV10]}>
                                                    <View>{LoadSVG.shoeIcon}</View>
                                                    <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Select
                                                        Shoe
                                                        Size</Text>
                                                </View>
                                                <View style={[{
                                                    paddingLeft: 40,
                                                    flexWrap: 'wrap',
                                                    alignItems: 'flex-start'
                                                }, Styles.row]}>
                                                    {
                                                        this.state.shoeSize.map(item => {
                                                            return (
                                                                <Chip key={item.value}
                                                                      mode='outlined'
                                                                      selectedColor='red'
                                                                      style={[Styles.m5, {backgroundColor: this.state.shoesSize === item.value ? '#db2b30' : '#f3f3f3'}]}
                                                                      textStyle={{
                                                                          color: this.state.shoesSize === item.value ? '#fff' : '#000',
                                                                          fontFamily: 'Muli-Bold'
                                                                      }}
                                                                      onPress={() => this.setState({shoesSize: item.value})}>{item.size}</Chip>
                                                            )
                                                        })
                                                    }
                                                </View>
                                            </View>
                                        </View>

                                        {
                                            this.state.UserFlow === 'NORMAL' || canEditTextInput
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => this.addOrUpdateClothingInfo()}
                                                    style={[Styles.defaultbgColor, Styles.p10, Styles.marV20]}>
                                                    <Text
                                                        style={[Styles.aslCenter, Styles.cWhite, Styles.padH10, Styles.padV5, Styles.ffMbold, Styles.f16]}>SAVE</Text>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                    </View>
                                </ScrollView> : null}
                        </View>
                    </View>
                </Modal>

                {/* Address Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.showMapsModal}
                    onRequestClose={() => {
                        this.setState({showMapsModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgDarkRed, ]}>
                                <Appbar.Content title="Address"
                                                titleStyle={[Styles.ffMbold ]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() => this.setState({showMapsModal: false})}/>
                            </Appbar.Header>
                            {MyProfileResp
                                ?
                                <ScrollView
                                    style={[Styles.bw1, Styles.bgWhite, {
                                        width: Dimensions.get('window').width,
                                        height: Dimensions.get('window').height
                                    }]}>
                                    <View style={[{
                                        width: Dimensions.get('window').width,
                                        height: Dimensions.get('window').height / 2.3
                                    }]}>
                                        <MapView
                                            style={StyleSheet.absoluteFill}
                                            initialRegion={{
                                                latitude: this.state.latitude,
                                                longitude: this.state.longitude,
                                                latitudeDelta: LATITUDE_DELTA,
                                                longitudeDelta: LONGITUDE_DELTA,
                                            }}>
                                            <Marker
                                                draggable={true}
                                                coordinate={{
                                                    latitude: this.state.latitude,
                                                    longitude: this.state.longitude
                                                }}
                                                onDragEnd={e => this.DecodeLocationDetails(e.nativeEvent.coordinate)}
                                                pinColor={'red'}
                                            />
                                        </MapView>
                                    </View>
                                    <View>
                                        {/*TEMP ADDRESS VIEW*/}
                                        <View style={[Styles.m15]}>
                                            <Text style={[Styles.ffMbold, Styles.f18, Styles.mBtm10]}>Local
                                                Address:</Text>
                                            <View style={[Styles.mBtm15]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>Flat
                                                        no./House no.{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }, Styles.f16]}
                                                        placeholder='Type here'
                                                        returnKeyType="done"
                                                        value={this.state.houseNumber}
                                                        ref={(input) => {
                                                            this.houseNumber = input;
                                                        }}
                                                        onSubmitEditing={() => {
                                                            // this.address.focus();
                                                            Keyboard.dismiss()
                                                        }}
                                                        onChangeText={(houseNumber) => this.setState({houseNumber})}
                                                    />
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm15]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>Street name /Area Name{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }, Styles.f16]}
                                                        placeholder='Type here'
                                                        returnKeyType="done"
                                                        value={this.state.address}
                                                        ref={(input) => {
                                                            this.address = input;
                                                        }}
                                                        onSubmitEditing={() => {
                                                            // this.landmark.focus();
                                                            Keyboard.dismiss()
                                                        }}
                                                        onChangeText={(address) => this.setState({address})}
                                                    />
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm15]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>
                                                        Landmark{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }, Styles.f16]}
                                                        placeholder='Type here'
                                                        returnKeyType="done"
                                                        multiline={true}
                                                        value={this.state.landmark}
                                                        ref={(input) => {
                                                            this.landmark = input;
                                                        }}
                                                        onSubmitEditing={() => {
                                                           Keyboard.dismiss();
                                                        }}
                                                        onChangeText={(landmark) => this.setState({landmark})}
                                                    />
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm15]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>City{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }, Styles.f16]}
                                                        placeholder='Type here'
                                                        returnKeyType="done"
                                                        value={this.state.city}
                                                        ref={(input) => {
                                                            this.city = input;
                                                        }}
                                                        onSubmitEditing={() => {
                                                            Keyboard.dismiss();
                                                        }}
                                                        onChangeText={(city) => this.setState({city})}
                                                    />
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm15]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>State{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View
                                                    style={[Styles.bw1, Styles.bcAsh, Styles.padV5, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.mRt15, Styles.mLt40,]}>
                                                    <Picker
                                                        itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter]}
                                                        selectedValue={this.state.lState}
                                                        // enabled={false}
                                                        mode='dialog'
                                                        onValueChange={(itemValue, itemIndex) => this.setState({lState: itemValue})}
                                                    >
                                                        {this.state.listOfStates.map((item, index) => {
                                                            return (< Picker.Item
                                                                label={item.valueName}
                                                                value={item.value}
                                                                key={index}/>);
                                                        })}
                                                    </Picker>
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm15]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>Pincode{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }, Styles.f16]}
                                                        placeholder='Type here'
                                                        keyboardType='numeric'
                                                        returnKeyType="done"
                                                        value={this.state.pincode}
                                                        ref={(input) => {
                                                            this.pincode = input;
                                                        }}
                                                        onSubmitEditing={() => {
                                                            Keyboard.dismiss()
                                                        }}
                                                        onChangeText={(pincode) => {
                                                            this.setState({pincode})
                                                        }}
                                                    />
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm5]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>Country{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }, Styles.f16]}
                                                        editable={false}
                                                        placeholder='Type here'
                                                        returnKeyType="done"
                                                        value={this.state.country}
                                                        ref={(input) => {
                                                            this.country = input;
                                                        }}
                                                        onSubmitEditing={() => {
                                                            Keyboard.dismiss()
                                                        }}
                                                        onChangeText={(country) => {
                                                            this.setState({country})
                                                        }}
                                                    />
                                                </View>
                                            </View>
                                        </View>

                                        <TouchableOpacity style={[Styles.row]}
                                                          onPress={() => this.setState({useSameAddress: !this.state.useSameAddress})}>
                                            <CheckBox
                                                containerStyle={{
                                                    backgroundColor: "#fff",
                                                    borderWidth: 0,
                                                }}
                                                checkedColor='#36A84C'
                                                size={30}
                                                onPress={() => this.setState({useSameAddress: !this.state.useSameAddress}, function () {
                                                    this.permSameLocal()
                                                })}
                                                checked={this.state.useSameAddress}
                                            />
                                            <Text
                                                style={[Styles.f16, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter, {right: 16}]}>Permanent
                                                Address same as Local Address</Text>
                                        </TouchableOpacity>
                                        {/*PERMANENT ADDRESS VIEW*/}
                                        <View style={[Styles.m15]}>
                                            <Text style={[Styles.ffMbold, Styles.f18, Styles.mBtm10]}>Permanent
                                                Address:</Text>
                                            <View style={[Styles.mBtm15]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>Flat
                                                        no./House no.{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }, Styles.f16]}
                                                        placeholder='Type here'
                                                        returnKeyType="done"
                                                        value={this.state.permHouseNumber}
                                                        ref={(input) => {
                                                            this.permHouseNumber = input;
                                                        }}
                                                        onSubmitEditing={() => {
                                                            // this.permAddress.focus();
                                                            Keyboard.dismiss()
                                                        }}
                                                        onChangeText={(permHouseNumber) => this.setState({permHouseNumber})}
                                                    />
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm15]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>Street name /Area name{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }, Styles.f16]}
                                                        placeholder='Type here'
                                                        returnKeyType="done"
                                                        value={this.state.permAddress}
                                                        ref={(input) => {
                                                            this.permAddress = input;
                                                        }}
                                                        onSubmitEditing={() => {
                                                            // this.permLandmark.focus();
                                                            Keyboard.dismiss()
                                                        }}
                                                        onChangeText={(permAddress) => this.setState({permAddress})}
                                                    />
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm15]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>
                                                        Landmark{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }, Styles.f16]}
                                                        placeholder='Type here'
                                                        returnKeyType="done"
                                                        multiline={true}
                                                        value={this.state.permLandmark}
                                                        ref={(input) => {
                                                            this.permLandmark = input;
                                                        }}
                                                        onSubmitEditing={() => {
                                                            Keyboard.dismiss();
                                                        }}
                                                        onChangeText={(permLandmark) => this.setState({permLandmark})}
                                                    />
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm15]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>City{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }, Styles.f16]}
                                                        placeholder='Type here'
                                                        returnKeyType="done"
                                                        value={this.state.permCity}
                                                        ref={(input) => {
                                                            this.permCity = input;
                                                        }}
                                                        onSubmitEditing={() => {
                                                            Keyboard.dismiss();
                                                        }}
                                                        onChangeText={(permCity) => this.setState({permCity})}
                                                    />
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm15]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>State{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View
                                                    style={[Styles.bw1, Styles.bcAsh, Styles.padV5, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.mRt15, Styles.mLt40,]}>
                                                    <Picker
                                                        itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter]}
                                                        selectedValue={this.state.permState}
                                                        mode='dialog'
                                                        onValueChange={(itemValue, itemIndex) => this.setState({permState: itemValue})}
                                                    >
                                                        {this.state.listOfStates.map((item, index) => {
                                                            return (< Picker.Item
                                                                label={item.valueName}
                                                                value={item.value}
                                                                key={index}/>);
                                                        })}
                                                    </Picker>
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm15]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>Pincode{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }, Styles.f16]}
                                                        placeholder='Type here'
                                                        keyboardType='numeric'
                                                        returnKeyType="done"
                                                        value={this.state.permPincode}
                                                        ref={(input) => {
                                                            this.permPincode = input;
                                                        }}
                                                        onSubmitEditing={() => {
                                                            Keyboard.dismiss()
                                                        }}
                                                        onChangeText={(permPincode) => {
                                                            this.setState({permPincode})
                                                        }}
                                                    />
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm15]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.homeIcon}</View>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f18, Styles.pLeft15, {color: '#000'}]}>Country{Services.returnRedStart()}
                                                    </Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }, Styles.f16]}
                                                        placeholder='Type here'
                                                        returnKeyType="done"
                                                        editable={false}
                                                        value={this.state.permCountry}
                                                        ref={(input) => {
                                                            this.permCountry = input;
                                                        }}
                                                        onSubmitEditing={() => {
                                                            Keyboard.dismiss()
                                                        }}
                                                        onChangeText={(permCountry) => {
                                                            this.setState({permCountry})
                                                        }}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                        {
                                            this.state.UserFlow === 'NORMAL' || canEditTextInput
                                                ?
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        this.temporaryAddressValidation()}
                                                    style={[Styles.defaultbgColor, Styles.p10, Styles.marV20, Styles.m15]}>
                                                    <Text
                                                        style={[Styles.aslCenter, Styles.cWhite, Styles.padH10, Styles.padV5, Styles.ffMbold, Styles.f16]}>SAVE</Text>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                    </View>


                                </ScrollView> : null}
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
                                                            this.setState({imagePreview: false, imagePreviewURL: ''})
                                                        }/>
                            </Appbar.Header>
                            <View style={[Styles.flex1]}>
                                {
                                    this.state.imagePreviewURL
                                        ?
                                        <View>
                                            <View style={[Styles.row,Styles.jSpaceBet]}>
                                                <View/>
                                                <TouchableOpacity style={[Styles.row,Styles.marH10 ]}
                                                                  onPress={() => {this.rotate()} }>
                                                    <Text style={[Styles.colorBlue,Styles.f18,Styles.padH5]}>ROTATE</Text>
                                                    <FontAwesome name="rotate-right" size={24} color="black"
                                                    />
                                                </TouchableOpacity>
                                            </View>

                                            <ImageZoom cropWidth={Dimensions.get('window').width}
                                                       cropHeight={Dimensions.get('window').height}
                                                       imageWidth={Dimensions.get('window').width }
                                                       imageHeight={Dimensions.get('window').height}>
                                                <Image
                                                    onLoadStart={() => this.setState({previewLoading: true})}
                                                    onLoadEnd={() => this.setState({previewLoading: false})}
                                                    style={[{
                                                        width: Dimensions.get('window').width - 20,
                                                        height: Dimensions.get('window').height - 90,
                                                        transform: [{rotate: this.state.imageRotate+'deg'}]
                                                    }, Styles.marV5, Styles.aslCenter, Styles.bgDWhite,Styles.ImgResizeModeContain]}
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
                            style={[Styles.bgWhite, Styles.aslCenter, Styles.p10,  {width: Dimensions.get('window').width - 80}]}>

                            <View style={[Styles.p10]}>
                                <Text style={[Styles.f22,Styles.cBlk,Styles.txtAlignCen,Styles.ffLBlack,Styles.pBtm10]}>Add Image</Text>
                                <View style={[Styles.marV15]}>
                                    <TouchableOpacity
                                        onPress={()=>{this.setState({imageSelectionModal:false},()=>{
                                            this.personalInformationImageUpload('CAMERA')
                                        })}}
                                        activeOpacity={0.7} style={[Styles.marV10,Styles.row,Styles.aitCenter]}>
                                        <FontAwesome name="camera" size={24} color="black" />
                                        <Text style={[Styles.f20,Styles.cBlk,Styles.ffLBold,Styles.padH10]}>Take Photo</Text>
                                    </TouchableOpacity>
                                    <Text style={[Styles.ffLBlack,Styles.brdrBtm1,Styles.mBtm15]}/>
                                    <TouchableOpacity
                                        onPress={()=>{this.setState({imageSelectionModal:false},()=>{
                                            this.personalInformationImageUpload('LIBRARY')
                                        })}}
                                        activeOpacity={0.7} style={[Styles.marV10,Styles.row,Styles.aitCenter]}>
                                        <FontAwesome name="folder" size={24} color="black" />
                                        <Text style={[Styles.f20,Styles.cBlk,Styles.ffLBold,Styles.padH10]}>Gallery</Text>
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

                {/*MODALS END*/}
            </View>
        );
    }
};

const styles = StyleSheet.create({
    circleStyle: {
        height: 45, width: 45,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#a7a7a7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    borderLine: {
        borderTopWidth: 3, borderTopColor: '#f6f6f6'
    },
    borderBottmLine: {
        borderBottomWidth: 3, borderBottomColor: '#f6f6f6'
    },
    gridBorder: {
        borderTopWidth: 5, borderTopColor: '#f6f6f6'
    },
    shadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 1.62,
        elevation: 3,
    },
    posAbsoluteChip: {flex: 1, position: 'absolute', top: 5, right: 10, bottom: 0},
});
