import React, {Component} from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Text,
    Modal,
    Dimensions,
    TouchableOpacity,
    TextInput, Picker, Image, ActivityIndicator, Keyboard, Alert
} from "react-native";
import {Appbar, Button, Card, Chip} from 'react-native-paper';
import {CSpinner, LoadImages, LoadSVG, Styles} from "../common";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import FastImage from "react-native-fast-image";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import Services from "../common/Services";
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";
import Utils from "../common/Utils";
import Config from "../common/Config";
import AsyncStorage from "@react-native-community/async-storage";
import OfflineNotice from "../common/OfflineNotice";
import DateTimePicker from "@react-native-community/datetimepicker";
import _ from "lodash";
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

const activeColor = '#233167';
const disableColor = '#b2beb5';

export default class VehicleDetailsScreen extends Component {
    constructor(props) {
        super(props);
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
            ShowAddVehicleDetailsModal: false, vehicleList: [], VehicleData: [],
            ShowUpdateVehicleDetailsModal: false, VehicleResp: [],
            canUpdateData: true,//used for image upload check
            showButton: false, selectedProfileUserID: '',
            // checkProfileField:[],
            //DropDown states
            showLicenseDetails: true,
            showVehicleDetails: false,
            showInsurancePolicy: false,
            showRoadPollutionCheck: false,
            //TextInput License Details states
            userDrivingLicenseNumber: '',
            // userDrivingLicenseExpiryDate: new Date(),
            //TextInput Vehicle details states
            userVehicleNumber: '',
            userVehicleRC: '',
            userVehicleType: '',
            userVehicleModalName: '',
            userVehicleClass: '',
            //TextInput Insurance Policy States
            userVehicleInsurancePolicyNumber: '',
            userVehicleInsuranceProviderName: '',
            // userVehicleInsuranceExpiryDate: new Date(),
            //TextInput RoadTax,PollutionCheck States
            // userVehicleRoadTaxExpiryDate: new Date(),
            // userVehiclePollutionExpiryDate: new Date(),
            vehicleTypeList: [{value: '', label: 'Select Vehicle Type', key: 0},
                {value: '2', label: '2 Wheeler', key: 1},
                {value: '3', label: '3 Wheeler', key: 2},
                {value: '4', label: '4 Wheeler', key: 3}],
            showDate: false,
            showDatePollution: false,
            errorVehicleRegMessage: null, vehicleId: '', errorVehicleTypeMessage: null, errorVehicleModalMessage: null,


            SelectedTab: 'VehicleRC',
            VehicleInsuranceProviderName: '',
            VehicleInsuranceNumber: '',
            InsuranceExpiryDate: null,
            PollutionExpiryDate: null,
            stateCode: '', distCode: '', rtoCode: '', vehicleNum: '',
            //Vehicle RC
            VehicleBrand: '',
            VehicleModalName: '',
            VehicleClass: '', VehicleTonnage: '',
            errorInsuranceMessage: null, errorRoadTaxMessage: null, errorPollutionMessage: null,
            twoVehicleModalList: [
                {value: '', label: 'Select Vehicle Model', key: 0},
                {value: 'Activa', label: 'Activa', key: 1},
                {value: 'Apache', label: 'Apache', key: 2},
                {value: 'Avenger', label: 'Avenger', key: 3},
                {value: 'Bullet', label: 'Bullet', key: 4},
                {value: 'CB Shine', label: 'CB Shine', key: 5},
                {value: 'CT 100', label: 'CT 100', key: 6},
                {value: 'Dio', label: 'Dio', key: 7},
                {value: 'Discover', label: 'Discover', key: 8},
                {value: 'Fasino', label: 'Fasino', key: 9},
                {value: 'FZ', label: 'FZ', key: 10},
                {value: 'Glamour', label: 'Glamour', key: 11},
                {value: 'HF Deluxe', label: 'HF Deluxe', key: 12},
                {value: 'Jupiter', label: 'Jupiter', key: 13},
                {value: 'Livo', label: 'Livo', key: 14},
                {value: 'Maestro', label: 'Maestro', key: 15},
                {value: 'Passion', label: 'Passion', key: 16},
                {value: 'Platina', label: 'Platina', key: 17},
                {value: 'Pulsar', label: 'Pulsar', key: 18},
                {value: 'Shine', label: 'Shine', key: 19},
                {value: 'Splendor', label: 'Splendor', key: 20},
                {value: 'Sports', label: 'Sports', key: 21},
                {value: 'Star City', label: 'Star City', key: 22},
                {value: 'Unicorn', label: 'Unicorn', key: 23},
                {value: 'Victor', label: 'Victor', key: 24},
                {value: 'Others', label: 'Others', key: 25}],
            fourVehicleModalList: [
                {value: '', label: 'Select Vehicle Model', key: 0},
                {value: 'Ace', label: 'Ace', key: 1},
                {value: 'Jeeto', label: 'Jeeto', key: 2},
                {value: 'Bolero', label: 'Bolero', key: 3},
                {value: 'Dost', label: 'Dost', key: 4},
                {value: 'Zip', label: 'Zip', key: 5},
                {value: 'Super Ace', label: 'Super Ace', key: 6},
                {value: 'Super Carry', label: 'Super Carry', key: 7},
                {value: 'Omni', label: 'Omni', key: 8},
                {value: 'Others', label: 'Others', key: 9}],
            vehicleClassList: [
                {value: 'MC50CC', label: 'MC 50CC', key: 0},
                {value: 'LMVNT', label: 'LMV-NT', key: 1},
                {value: 'FVG', label: 'FVG', key: 2},
                {value: 'MCEX50CC', label: 'MC EX50CC', key: 3},
                {value: 'MCWG', label: 'MCWG', key: 4},
                {value: 'HGMV', label: 'HGMV', key: 5},
                {value: 'HPMV', label: 'HPMV', key: 6}],
            vehicleBrand: [
                {value: '', label: 'Select Vehicle Brand', key: 0},
                {value: 'Tata', label: 'Tata', key: 1},
                {value: 'Mahindra', label: 'Mahindra', key: 2},
                {value: 'Maruti', label: 'Maruti', key: 3},
                {value: 'Piaggo', label: 'Piaggo', key: 4},
                {value: 'Bajaj', label: 'Bajaj', key: 5},
                {value: 'Hero', label: 'Hero', key: 6},
                {value: 'TVS', label: 'TVS', key: 7},
                {value: 'Yamaha', label: 'Yamaha', key: 8},
                {value: 'Honda', label: 'Honda', key: 9},
                {value: 'Other', label: 'Other', key: 10}],
            variantsList: [
                {value: '', label: 'Select Vehicle Variant', key: 0},
                {value: 'Diesel', label: 'Diesel', key: 1},
                {value: 'Petrol', label: 'Petrol', key: 2},
                {value: 'Electric', label: 'Electric', key: 3}],
            tonnageList: [
                {value: '', label: 'Select Vehicle Tonnage', key: 0},
                {value: '<500 KGs', label: '<500 KGs', key: 1},
                {value: '500 KGs', label: '500 KGs', key: 2},
                {value: '700 KGs', label: '700 KGs', key: 3},
                {value: '750 KGs', label: '750 KGs', key: 4},
                {value: '1 Ton', label: '1 Ton', key: 5},
                {value: '2 Ton', label: '2 Ton', key: 6},
                {value: '4 Ton', label: '4 Ton', key: 7},
                {value: '> 4 Ton', label: '> 4 Ton', key: 8},
                {value: 'Other', label: 'Other', key: 9}],
            ImagesArray: [
                {insurancePic: ''},
                {VehicleRcPic: ''},
                {PollutionPic: ''},
                {RoadTaxPic: ''},
                {VehicleRcBackPic: ''},
                {VehicleFrontPic: ''},
            ],
            variant: '',
            imagePreview: false, imagePreviewURL: '',imageRotate:'0',
            imageSelectionModal:false
        };
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
            UserID: self.props.navigation.state.params.selectedProfileUserID,
            UserFlow: self.props.navigation.state.params.UserFlow,
        }, () => {
            self.getProfileVehiclesList();
        });
    };

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

    //API CALL TO FETCH PROFILE DETAILS
    getProfileVehiclesList() {
        const self = this;
        const UserID = self.state.UserID;
        const apiURL = Config.routes.BASE_URL + Config.routes.USER_VEHICLES + '?&userId=' + UserID;
        const body = '';
        AsyncStorage.getItem('Whizzard:userStatus').then((userStatus) => {
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                {
                    userStatus === 'ACTIVATED'
                        ?
                        this.state.UserFlow === 'NORMAL'
                            ?
                            self.setState({canEditTextInput: userRole === '45'})
                            :
                            self.setState({canEditTextInput: this.state.UserFlow === 'SITE_ADMIN' && userRole === '45'})
                        :
                        self.setState({canEditTextInput: true})
                }
            })
        })
        this.setState({
            spinnerBool: true,
            VehicleRCLoading: true,
            InsurancePolicyLoading: true,
            RoadTaxLoading: true,
            PollutionCheckLoading: true,
            VehicleRCBackLoading: true,
            VehicleFrontLoading: true,
        }, () => {
            Services.AuthHTTPRequest(apiURL, 'GET', body, function (response) {
                // console.log("GET_VEHICLE_INFORMATION Res", response.data);
                if (response) {
                    var data = response.data;
                    self.setState({
                        vehicleList: response.data,
                        spinnerBool: false,
                    })
                }
            }, function (error) {
                // console.log("getProfileVehiclesList error", error.response);
                self.errorHandling(error)
            });
        });
    }


    //API CALL TO FETCH SELECTED VEHICLE DETAILS
    getVehicleDetails() {
        const self = this;
        const vehicleId = this.state.vehicleId
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_VEHICLE + vehicleId;
        const body = '';
        // console.log('getVehicleDetails apiUrl vehiucle',apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                // console.log("getVehicleDetails Res", response.data);
                if (response.status === 200) {
                   let data = response.data;

                    if (data.vehicleRegistrationNumber && data.vehicleType && data.model
                        && data.vehicleClass && data.insuransePolicyNumber && data.insuranceProviderName && data.insuranceExpiryDate &&
                        data.roadTaxExpiryDate && data.pollutionExpiryDate && data.brand && data.tonnage && data.variant) {
                        self.setState({showButton: false})
                    } else {
                        self.setState({showButton: true})
                    }

                    if (self.state.canUpdateData) {
                        self.setState({
                            spinnerBool: false,
                            InsuranceProviderName: data.insurancePolicyName,
                            InsuransePolicyNumber: data.insurancePolicyNumber,
                            InsuranceExpiryDate: data.insuranceExpiryDate,
                            RoadTaxExpiryDate: data.roadTaxExpiryDate,
                            PollutionExpiryDate: data.pollutionExpiryDate,
                            VehicleNumber: data.vehicleRegistrationNumber,
                            VehicleType: JSON.stringify(data.vehicleType),
                            VehicleModalName: data.model,
                            VehicleClass: data.vehicleClass,
                            VehicleBrand: data.brand,
                            VehicleTonnage: data.tonnage,
                            // vehicleId: data.id,
                            checkProfileField: data,
                            VehicleData: data,
                            ShowUpdateVehicleDetailsModal: true,
                            AddVehicle: false,
                            VehicleResp: data,
                            variant: data.variant
                        });

                        // if (response.data.vehicleRegistrationNumber) {
                        //     const vehicleNum = response.data.vehicleRegistrationNumber.replace(/\s+/g, '');
                        //     var stateCode = vehicleNum.slice(0, 2);
                        //     var distCode = vehicleNum.slice(2, 4);
                        //     var rtoCode = vehicleNum.slice(4, 6);
                        //     var vehicleNumber = vehicleNum.slice(6, 10);
                        //     self.setState({
                        //         stateCode: _.toUpper( stateCode),
                        //         distCode: _.toUpper( distCode),
                        //         rtoCode: _.toUpper( rtoCode),
                        //         vehicleNumber: _.toUpper( vehicleNumber), })
                        // }
                        if (response.data.vehicleRegNoInParts.part1) {
                            const vehicleNum = response.data.vehicleRegNoInParts;
                            var stateCode = vehicleNum.part1;
                            var distCode = vehicleNum.part2;
                            var rtoCode = vehicleNum.part3;
                            var vehicleNumber = vehicleNum.part4;
                            self.setState({
                                stateCode: _.toUpper(stateCode),
                                distCode: _.toUpper(distCode),
                                rtoCode: _.toUpper(rtoCode),
                                vehicleNumber: _.toUpper(vehicleNumber),
                            })
                        }
                    } else {
                        self.setState({
                            spinnerBool: false, VehicleData: data, VehicleResp: data
                        });
                    }
                }
            }, function (error) {
                // console.log("getVehicleDetails error", error.response);
                self.errorHandling(error)
            });
        });
    }

    toggleDatePicker() {
        this.setState({showDate: true});
    }

    togglePollutionPicker() {
        this.setState({showDatePollution: true});
    }

    updatePollutionExpiry(date, type) {
        this.setState({showDatePollution: false});
        if (date) {
            if (type === 'PollutionExpiryDate') {
                this.setState({
                    PollutionExpiryDate: date.toDateString(),
                    errorPollutionMessage: null,
                    showDatePollution: false
                });
            }
        }
    }

    // DATE PICKERS
    updateDate(date, type) {
        this.setState({showDate: false});
        if (date) {
            if (type === 'InsuranceExpiryDate') {
                this.setState({
                    InsuranceExpiryDate: date.toDateString(),
                    showDate: false,
                    errorInsuranceMessage: null,
                    showDatePollution: false
                });
            } else if (type === 'RoadTaxExpiryDate') {
                this.setState({
                    RoadTaxExpiryDate: date.toDateString(),
                    showDate: false,
                    errorRoadTaxMessage: null,
                    showDatePollution: false
                });
            }
        }
    }


//TO VALIDATE ONLY REG NUMBER
    validateVehicleNum = (button) => {
        this.setState({mandatoryChecks: false})
        let resp = {};
        let result = {};

        resp = Utils.ValidateTotalVehicleNumberinParts(this.state.stateCode, this.state.distCode, this.state.rtoCode, this.state.vehicleNumber);
        if (resp.status === true) {
            var finalVehicleNumber = this.state.stateCode + this.state.distCode + this.state.rtoCode + this.state.vehicleNumber;
            this.setState({errorVehicleRegMessage: null, finalVehicleNumber: finalVehicleNumber});

            resp = Utils.isValidExpiryDate(this.state.VehicleType, 'Select Vehicle Type');
            if (resp.status === true) {
                this.setState({errorVehicleTypeMessage: null});

                resp = Utils.isValidExpiryDate(this.state.VehicleModalName, 'Select Vehicle Model');
                if (resp.status === true) {
                    this.setState({errorVehicleModalMessage: null});

                    if (button === 'onClickSave') {
                        this.ValidateVehicleInformation()
                    }

                } else {
                    this.setState({errorVehicleModalMessage: resp.message, SelectedTab: 'VehicleRC'});
                }
            } else {
                this.setState({errorVehicleTypeMessage: resp.message, SelectedTab: 'VehicleRC'});
            }
        } else {
            this.setState({errorVehicleRegMessage: resp.message, SelectedTab: 'VehicleRC'});
        }
    }


    ValidateVehicleInformation() {
        let resp = {};
        let result = {};
        if (this.state.ShowUpdateVehicleDetailsModal === true) {
            resp = Utils.isValueSelected(this.state.VehicleResp.rcUploadInfo, 'Please Upload Vehicle RC Pic')
            if (resp.status === true) {
                resp = Utils.isValueSelected(this.state.VehicleResp.rcBackSideInfo, 'Please Upload Vehicle RC back side Pic')
                if (resp.status === true) {
                    resp = Utils.isValueSelected(this.state.VehicleResp.vehicleNoPlateImageInfo, 'Please Upload Vehicle front side Pic')
                    if (resp.status === true) {

                        this.setState({mandatoryChecks: true})
                        this.UpdateVehicleInformation()

                    } else {
                        this.setState({SelectedTab: 'VehicleRC'});
                        Utils.dialogBox(resp.message, '');
                    }
                } else {
                    this.setState({SelectedTab: 'VehicleRC'});
                    Utils.dialogBox(resp.message, '');
                }
            } else {
                this.setState({SelectedTab: 'VehicleRC'});
                Utils.dialogBox(resp.message, '');
            }
        } else {
            resp = Utils.isValueSelected(this.state.ImagesArray[1].VehicleRcformData, 'Please Upload Vehicle RC Pic')
            if (resp.status === true) {
                resp = Utils.isValueSelected(this.state.ImagesArray[4].VehicleRcBackformData, 'Please Upload Vehicle RC back side Pic')
                if (resp.status === true) {
                    resp = Utils.isValueSelected(this.state.ImagesArray[5].VehicleFrontNumberPlateformData, 'Please Upload Vehicle front side Pic')
                    if (resp.status === true) {

                        this.setState({mandatoryChecks: true})
                        this.AddVehicleInformation()

                    } else {
                        this.setState({SelectedTab: 'VehicleRC'});
                        Utils.dialogBox(resp.message, '');
                    }
                } else {
                    this.setState({SelectedTab: 'VehicleRC'});
                    Utils.dialogBox(resp.message, '');
                }
            } else {
                this.setState({SelectedTab: 'VehicleRC'});
                Utils.dialogBox(resp.message, '');
            }
        }
    };


    //API CALL TO UPDATE PROFILE DETAILS== PUT
    UpdateVehicleInformation() {
        // console.log('UpdateVehicleInformation start')
        var body = JSON.stringify({
            userId: this.state.UserID,
            insurancePolicyNumber: this.state.InsuransePolicyNumber,
            insurancePolicyName: this.state.InsuranceProviderName,
            insuranceExpiryDate: this.state.InsuranceExpiryDate ? new Date(this.state.InsuranceExpiryDate) : null,
            roadTaxExpiryDate: this.state.RoadTaxExpiryDate ? new Date(this.state.RoadTaxExpiryDate) : null,
            pollutionExpiryDate: this.state.PollutionExpiryDate ? new Date(this.state.PollutionExpiryDate) : null,
            // vehicleRegistrationNumber: this.state.stateCode + this.state.distCode + this.state.rtoCode + this.state.vehicleNumber,
            vehicleType: this.state.VehicleType,
            model: this.state.VehicleModalName,
            vehicleClass: this.state.VehicleClass,
            brand: this.state.VehicleBrand,
            tonnage: this.state.VehicleTonnage,
            // ownerIsDriver : true,
            isPrimary: true,
            mappedUserIds: [this.state.UserID],
            variant: this.state.variant,
            vehicleRegNoInParts: {
                part1: this.state.stateCode,
                part2: this.state.distCode,
                part3: this.state.rtoCode,
                part4: this.state.vehicleNumber
            }
        });
        const self = this;
        const vehicleId = self.state.vehicleId;
        const apiURL = Config.routes.BASE_URL + Config.routes.UPDATE_VEHICLE + vehicleId;
        // console.log('UpdateVehicleInformation URL', apiURL, 'body==>', body)
        this.setState({spinnerBool: true}, () => {
            // Services.AuthHTTPRequest(apiURL, 'PUT', body, function (response) {
            Services.AuthHTTPRequest(apiURL, 'PUT', body, function (response) {
                // console.log('updateVehicleInformation resp ', response);
                if (response.status === 200) {
                    self.setState({spinnerBool: false, ShowUpdateVehicleDetailsModal: false}, () => {
                        self.getProfileVehiclesList();
                        Utils.dialogBox('Vehicle Information Updated', '');
                        // self.props.navigation.goBack()
                    });
                }
            }, function (error) {
                // console.log("vehicle update error", error.response);
                self.errorHandling(error)
            });
        });
    };

    //API CALL TO ADD VEHICLE DETAILS== POST
    AddVehicleInformation() {
        // console.log('AddVehicleInformation start')
        const insurancePolicyNumber = this.state.InsuransePolicyNumber
        const insurancePolicyName = this.state.InsuranceProviderName
        const insuranceExpiryDate = this.state.InsuranceExpiryDate ? Services.returnInServerFormat(this.state.InsuranceExpiryDate) : ''
        const roadTaxExpiryDate = this.state.RoadTaxExpiryDate ? Services.returnInServerFormat(this.state.RoadTaxExpiryDate) : ''
        const pollutionExpiryDate = this.state.PollutionExpiryDate ? Services.returnInServerFormat(this.state.PollutionExpiryDate) : ''
        // const  vehicleRegistrationNumber= this.state.stateCode + this.state.distCode + this.state.rtoCode + this.state.vehicleNumber
        const vehicleRegistrationNumberInParts = '&part1=' + this.state.stateCode + '&part2=' + this.state.distCode + '&part3=' + this.state.rtoCode + '&part4=' + this.state.vehicleNumber
        // vehicleId:this.state.vehicleId,
        const vehicleType = this.state.VehicleType
        const model = this.state.VehicleModalName
        const vehicleClass = this.state.VehicleClass
        const brand = this.state.VehicleBrand
        const tonnage = this.state.VehicleTonnage
        const variant = this.state.variant
        const mappedUserIds = [this.state.UserID]
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.SAVE_VEHICLE
            + '?insurancePolicyNumber=' + insurancePolicyNumber +
            '&insuranceProviderName=' + insurancePolicyName + '&vehicleType=' + vehicleType
            + '&brand=' + brand + '&modal=' + model + '&class=' + vehicleClass + '&tonnage=' + tonnage
            + '&insuranceExpiryDate=' + insuranceExpiryDate
            + '&roadTaxExpiryDate=' + roadTaxExpiryDate
            + '&pollutionExpiryDate=' + pollutionExpiryDate
            + '&userIds=' + mappedUserIds + '&variant=' + variant + vehicleRegistrationNumberInParts;
        var body = this.state.ImagesArray[1].VehicleRcformData
        // console.log('AddVehicleInformation URL', apiURL, 'body==>', body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthProfileHTTPRequest(apiURL, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log('AddVehicleInformation resp200', response)

                    if (self.state.ImagesArray[2].PollutionformData) {
                        self.addVehicleImages('POLLUTION', self.state.ImagesArray[2].PollutionformData, response.data.id)
                    }
                    if (self.state.ImagesArray[3].RoadTaxformData) {
                        self.addVehicleImages('ROADTAX', self.state.ImagesArray[3].RoadTaxformData, response.data.id)
                    }
                    if (self.state.ImagesArray[0].insuranceformData) {
                        self.addVehicleImages('INSURANCE', self.state.ImagesArray[2].insuranceformData, response.data.id)
                    }

                    self.addVehicleImages('VEHICLE_RC_BACK', self.state.ImagesArray[4].VehicleRcBackformData, response.data.id)

                }
            }, function (error) {
                // console.log("vehicle update error", error.response);
                self.errorHandling(error)
            });
        });
    };

    vehicleInformationImageUpload = (uploadType) => {
        const self = this;
        const data = self.state.imageType;
        Services.checkImageUploadPermissions(uploadType, (response) => {
            // console.log('service image retunr', response);
            let image = response.image
            let formData = response.formData
            let imageUrl = image.path

                    // console.log(' postImages imagas formData', formData)
                    let INFO;
                    if (data === 'INSURANCE') {
                        INFO = Config.routes.USER_INSURANCE_PIC;
                    } else if (data === 'VEHICLE_RC') {
                        INFO = Config.routes.USER_VEHICLE_RC_PIC;
                    } else if (data === 'POLLUTION') {
                        INFO = Config.routes.USER_POLLUTION_PIC;
                    } else if (data === 'ROADTAX') {
                        INFO = Config.routes.USER_ROAD_TAX_PIC;
                    } else if (data === 'VEHICLE_RC_BACK') {
                        INFO = Config.routes.VEHICLE_RC_BACK_PIC;
                    } else if (data === 'VEHICLE_FRONT_NUMBER_PLATE') {
                        INFO = Config.routes.VEHICLE_FRONT_NUMBER_PLATE;
                    }
                    if (self.state.ShowAddVehicleDetailsModal === true) {
                        self.setState({spinnerBool: false, canUpdateData: false}, () => {
                            let ImagesArray = self.state.ImagesArray;
                            if (data === 'INSURANCE') {
                                 ImagesArray[0].insurancePic = imageUrl
                                ImagesArray[0].insuranceformData = formData
                            } else if (data === 'VEHICLE_RC') {
                                 ImagesArray[1].VehicleRcPic = imageUrl
                                ImagesArray[1].VehicleRcformData = formData
                            } else if (data === 'POLLUTION') {
                                 ImagesArray[2].PollutionPic = imageUrl
                                ImagesArray[2].PollutionformData = formData
                            } else if (data === 'ROADTAX') {
                                 ImagesArray[3].RoadTaxPic = imageUrl
                                ImagesArray[3].RoadTaxformData = formData
                            } else if (data === 'VEHICLE_RC_BACK') {
                                 ImagesArray[4].VehicleRcBackPic = imageUrl
                                ImagesArray[4].VehicleRcBackformData = formData
                            } else if (data === 'VEHICLE_FRONT_NUMBER_PLATE') {
                                 ImagesArray[5].VehicleFrontNumberPlatePic = imageUrl
                                ImagesArray[5].VehicleFrontNumberPlateformData = formData
                            }
                            // console.log('ImagesArray', ImagesArray);
                            self.setState({ImagesArray})
                            Utils.dialogBox("Uploaded successfully", '', function () {
                            })
                        })
                    } else {
                        let imageUploadURL = Config.routes.BASE_URL + INFO + '?&vehicleId=' + self.state.vehicleId;
                        const body = formData;
                        this.setState({spinnerBool: true}, () => {
                            Services.AuthProfileHTTPRequest(imageUploadURL, 'POST', body, function (response) {
                                // console.log("vehicle Information ImageUpload resp", response.data);
                                if (response.status === 200) {
                                    self.setState({spinnerBool: false, canUpdateData: false}, () => {
                                        self.getVehicleDetails();
                                        Utils.dialogBox("Uploaded successfully", '')
                                    })
                                }
                            }, function (error) {
                                // console.log("vehicle upload img error", error.response);
                                self.errorHandling(error)
                            });
                        });
                    }
        })
    }


    //API CALL TO DELETE UPLOADED IMAGE
    deleteUploadedImage(fieldName, fileName) {
        const self = this;
        const deleteImageURL = Config.routes.BASE_URL + Config.routes.DELETE_VEHICLE_UPLOADED_IMAGE + '?fileName=' + fileName + '&fieldName=' + fieldName + '&userId=' + self.state.UserID + '&vehicleId=' + self.state.vehicleId;
        // console.log('vehcile delete URL', deleteImageURL);
        const body = '';
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(deleteImageURL, 'POST', body, function (response) {
                // console.log("delete Uploaded ImageRes", response);
                if (response.status === 200) {
                    var data = response.data;
                    self.setState({spinnerBool: false, canUpdateData: false});
                    self.getVehicleDetails();
                    Utils.dialogBox("Deleted successfully", '', function () {
                    })
                    // self.getProfileVehiclesList()
                }
            }, function (error) {
                // console.log(" vehicle delete pic error", error.response);
                self.errorHandling(error)
            });
        });
    }


    addVehicleImages = (data, formData, vehicleId) => {
        const self = this;
        // console.log('addVehicle start data', data);
        // let INFO = '';
        if (data === 'INSURANCE') {
            var INFO = Config.routes.USER_INSURANCE_PIC;
        } else if (data === 'VEHICLE_RC') {
            var INFO = Config.routes.USER_VEHICLE_RC_PIC;
        } else if (data === 'POLLUTION') {
            var INFO = Config.routes.USER_POLLUTION_PIC;
        } else if (data === 'ROADTAX') {
            var INFO = Config.routes.USER_ROAD_TAX_PIC;
        } else if (data === 'VEHICLE_RC_BACK') {
            var INFO = Config.routes.VEHICLE_RC_BACK_PIC;
        } else if (data === 'VEHICLE_FRONT_NUMBER_PLATE') {
            var INFO = Config.routes.VEHICLE_FRONT_NUMBER_PLATE;
        }

        // console.log('addVehicle end INFO', INFO);

        let imageUploadURL = Config.routes.BASE_URL + INFO + '?&vehicleId=' + vehicleId;
        const body = formData;
        // console.log('addVehicleImages imageUploadURL', imageUploadURL);
        // console.log('body===>', body);
        this.setState({spinnerBool: true}, () => {
            Services.AuthProfileHTTPRequest(imageUploadURL, 'POST', body, function (response) {
                // console.log("ADD vehicle Information ImageUpload resp", response.data);
                if (response.status === 200) {
                    if (data === 'VEHICLE_RC_BACK') {
                        self.addVehicleImages('VEHICLE_FRONT_NUMBER_PLATE', self.state.ImagesArray[5].VehicleFrontNumberPlateformData, vehicleId)
                    } else if (data === 'INSURANCE' || data === 'POLLUTION' || data === 'ROADTAX') {

                    } else if (data === 'VEHICLE_FRONT_NUMBER_PLATE') {
                        self.setState({spinnerBool: false, ShowAddVehicleDetailsModal: false})
                        Utils.dialogBox('Vehicle added succesfully', '')
                        self.getProfileVehiclesList()
                    }
                }
            }, function (error) {
                // console.log("ADD vehicle upload img error", error.response);
                self.errorHandling(error)
            });
        });

    }


    AddVehicleDetails() {
        this.setState({
            InsuranceProviderName: '',
            InsuransePolicyNumber: '',
            InsuranceExpiryDate: null,
            RoadTaxExpiryDate: null,
            PollutionExpiryDate: null,
            VehicleNumber: '',
            VehicleType: '',
            VehicleModalName: '',
            VehicleClass: '',
            VehicleBrand: '',
            VehicleTonnage: '',
            vehicleId: '',
            checkProfileField: '',
            VehicleData: '',
            stateCode: '', distCode: '', rtoCode: '', vehicleNumber: '',
            ShowAddVehicleDetailsModal: true,
            AddVehicle: true,
            ImagesArray: [
                {insurancePic: ''},
                {VehicleRcPic: ''},
                {PollutionPic: ''},
                {RoadTaxPic: ''},
                {VehicleRcBackPic: ''},
                {VehicleFrontNumberPlatePic: ''},
            ],
            variant: ''
        })
    }

//API CALL TO DELETE VEHICLE DETAILS
    DeleteVehicleDetails(vehicleId) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.DELETE_VEHICLE + vehicleId;
        // console.log('vehcile delete URL', apiURL);
        const body = '';
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, 'DELETE', body, function (response) {
                if (response.status === 200) {
                    var data = response.data;
                    self.setState({spinnerBool: false});
                    self.getProfileVehiclesList();
                    Utils.dialogBox("Deleted successfully", '', function () {
                    })
                }
            }, function (error) {
                // console.log(" DeleteVehicleDetails error", error.response);
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
        const {
            SelectedTab,
            checkProfileField,
            VehicleResp,
            vehicleList,
            VehicleData,
            canEditTextInput,
            ImagesArray
        } = this.state;
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <Appbar.Header style={[Styles.defaultbgColor, {borderBottomWidth: 0}]}>
                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                    <Appbar.Content title="Vehicle Information" titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                </Appbar.Header>

                {/*PROFILE STATUS VIEW*/}
                {Services.showProfileScreensStatus('VEHICLE')}

                <ScrollView>
                    <View style={[Styles.p10]}>
                        {vehicleList
                            ?
                            vehicleList.map((list) => {
                                return (<View key={list.id}>
                                        <Card style={[Styles.mBtm15, Styles.ProfileScreenCardshadow]}>
                                            <Card.Title title={list.model ? 'Vehicle-' + list.model : 'Vehicle'}
                                                        subtitle={list.vehicleRegNoInParts ? Services.returnCheckingVehicleNumber(list.vehicleRegNoInParts)
                                                            : null}
                                                        titleStyle={[Styles.ffMbold, Styles.f18]}
                                                        left={() => <MaterialCommunityIcons name="check-circle"
                                                                                            size={32}
                                                                                            color="#b3b3b3"/>}
                                                        right={() =>
                                                            <View style={[Styles.row]}>
                                                                {
                                                                    vehicleList.length === 1
                                                                        ?
                                                                        null
                                                                        :
                                                                        <MaterialIcons name="delete" size={32}
                                                                                       color="#000"
                                                                                       style={[Styles.mRt10]}
                                                                                       onPress={() =>
                                                                                           Alert.alert('Are you sure you want to Delete Vehicle?', alert,
                                                                                               [
                                                                                                   {text: 'Cancel'},
                                                                                                   {
                                                                                                       text: 'OK',
                                                                                                       onPress: () => {
                                                                                                           this.DeleteVehicleDetails(list.id)
                                                                                                       }
                                                                                                   }
                                                                                               ]
                                                                                           )}/>
                                                                }

                                                                <MaterialIcons name="chevron-right" size={32}
                                                                               color="#000"
                                                                               style={[Styles.bgLWhite, Styles.br15, Styles.mRt10]}
                                                                               onPress={() => this.setState({
                                                                                   vehicleId: list.id,
                                                                                   canUpdateData: true
                                                                               }, () => {
                                                                                   this.getVehicleDetails()
                                                                               })}/>
                                                            </View>
                                                        }/>
                                        </Card>
                                    </View>
                                )
                            })
                            :
                            null}
                        {
                            this.state.UserFlow === 'NORMAL' || canEditTextInput
                                ?
                                <TouchableOpacity style={[Styles.bw1, Styles.padV8, Styles.bcAsh]}
                                                  onPress={() => this.AddVehicleDetails()}>
                                    <Text
                                        style={[Styles.ffMregular, Styles.cBlk, Styles.f18, Styles.p3, Styles.aslCenter]}>Add
                                        New Vehicle</Text>
                                </TouchableOpacity>
                                :
                                null
                        }

                    </View>
                </ScrollView>
                <View style={[Styles.row, Styles.aslCenter, Styles.marV10]}>
                    {/*<Button mode="contained" color='#000' labelStyle={{fontSize: 20}}*/}
                    {/*        contentStyle={[Styles.padV10, Styles.padH30]}*/}
                    {/*        onPress={() => console.log('Pressed')}>*/}
                    {/*    Save*/}
                    {/*</Button>*/}
                    <Button
                        disabled={vehicleList.length > 0 ? false : true}
                        mode="contained"
                        color={vehicleList.length > 0 ? '#C91A1F' : '#cccccc'}
                        contentStyle={[Styles.padV10, Styles.padH30, Styles.ffMregular, Styles.f16]}
                        onPress={() => this.props.navigation.navigate('BankDetailsScreen', {
                            selectedProfileUserID: this.state.UserID,
                            UserFlow: this.state.UserFlow
                        })}>
                        Next
                    </Button>
                </View>

                {/*MODAL START*/}

                {/*UPDATE VEHICLE DETAILS Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.ShowUpdateVehicleDetailsModal}
                    onRequestClose={() => {
                        this.setState({ShowUpdateVehicleDetailsModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgWhite, Styles.jSpaceBet]}>
                                <Appbar.Content title="Update Vehicle Information"
                                                titleStyle={[Styles.ffMbold, Styles.cBlk]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#000" style={{marginRight: 10}}
                                                        onPress={() => this.setState({ShowUpdateVehicleDetailsModal: false})}/>
                            </Appbar.Header>
                            {
                                VehicleResp
                                    ?
                                    <View style={[Styles.flex1, Styles.bgWhite]}>
                                        <View style={[Styles.row, Styles.bgDarkRed, Styles.ProfileScreenCardshadow]}>
                                            <TouchableOpacity onPress={() => {
                                                this.setState({SelectedTab: 'VehicleRC'})
                                            }}
                                                              style={[Styles.flex1, Styles.aitCenter, Styles.padV10,
                                                                  SelectedTab === 'VehicleRC' ? Styles.brdrBtm2White : Styles.brdrBtm2Red
                                                              ]}>
                                                <Text
                                                    style={[Styles.cWhite, Styles.f18, Styles.pBtm5, SelectedTab === 'VehicleRC' ? Styles.ffMextrabold : Styles.ffMregular]}>Vehicle/RC</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => {
                                                this.setState({SelectedTab: 'Pollution'})
                                            }}
                                                              style={[Styles.flex1, Styles.aitCenter, Styles.padV10,
                                                                  SelectedTab === 'Pollution' ? Styles.brdrBtm2White : Styles.brdrBtm2Red
                                                              ]}>
                                                <Text
                                                    style={[Styles.cWhite, Styles.f18, Styles.pBtm5, SelectedTab === 'Pollution' ? Styles.ffMextrabold : Styles.ffMregular]}>Pollution</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => {
                                                this.setState({SelectedTab: 'Insurance'})
                                            }}
                                                              style={[Styles.flex1, Styles.aitCenter, Styles.padV10,
                                                                  SelectedTab === 'Insurance' ? Styles.brdrBtm2White : Styles.brdrBtm2Red
                                                              ]}>
                                                <Text
                                                    style={[Styles.cWhite, Styles.f18, Styles.pBtm5, SelectedTab === 'Insurance' ? Styles.ffMextrabold : Styles.ffMregular]}>Insurance</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <ScrollView style={[Styles.p10]}>
                                            {
                                                SelectedTab === 'Insurance'
                                                    ?
                                                    <View style={[Styles.mBtm20]}>

                                                        {/*Upload INSURANCE PIC*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                                <View
                                                                    style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                                <TouchableOpacity
                                                                    disabled={this.state.UserFlow === 'NORMAL' ?
                                                                        canEditTextInput === false && VehicleResp.insurancePolicyUploadInfo : canEditTextInput === false}
                                                                    onPress={() => {
                                                                        // this.vehicleInformationImageUpload('INSURANCE')
                                                                        this.setState({imageType:'INSURANCE',imageSelectionModal:true})
                                                                    }}
                                                                    style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                    <Text
                                                                        style={[Styles.ffMregular,
                                                                            this.state.UserFlow === 'NORMAL' ?
                                                                                canEditTextInput === false && VehicleResp.insurancePolicyUploadInfo : canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue,
                                                                            Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                        Insurance Photo</Text>
                                                                </TouchableOpacity>
                                                                {
                                                                    canEditTextInput === false && VehicleResp.insurancePolicyUploadInfo
                                                                        ?
                                                                        null
                                                                        :
                                                                        VehicleResp.insurancePolicyUploadInfo
                                                                            ?
                                                                            <TouchableOpacity
                                                                                onPress={() => {
                                                                                    this.deleteUploadedImage('insurancePolicyPhoto', VehicleResp.insurancePolicyUploadInfo.fileName)
                                                                                }}
                                                                                style={[Styles.bw1, Styles.br5, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                                <Text
                                                                                    style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMextrabold, Styles.cWhite]}>Delete</Text>
                                                                            </TouchableOpacity>
                                                                            :
                                                                            null
                                                                }
                                                            </View>
                                                            {
                                                                VehicleResp.insurancePolicyUploadInfo
                                                                    ?
                                                                    <View
                                                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                        <TouchableOpacity
                                                                            style={[Styles.row, Styles.aslCenter]}
                                                                            onPress={() => {
                                                                                this.setState({
                                                                                    imagePreview: true,
                                                                                    imagePreviewURL: VehicleResp.insurancePolicyUploadInfo.displayName  ? VehicleResp.insurancePolicyUploadInfo.displayName : ''
                                                                                })
                                                                            }}>
                                                                        <Image
                                                                            onLoadStart={() => this.setState({RoadTaxLoading: true})}
                                                                            onLoadEnd={() => this.setState({RoadTaxLoading: false})}
                                                                            style={[{
                                                                                width: Dimensions.get('window').width / 2,
                                                                                height: 120
                                                                            }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                            source={VehicleResp.insurancePolicyUploadInfo.displayName ? {uri: VehicleResp.insurancePolicyUploadInfo.displayName} : null}
                                                                        />
                                                                            <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                                        </TouchableOpacity>
                                                                        <ActivityIndicator
                                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                                            animating={this.state.RoadTaxLoading}
                                                                        />
                                                                    </View>
                                                                    :
                                                                    null
                                                            }
                                                        </View>

                                                        {/*INSURANCE PROVIDER NAME*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.mTop15]}>
                                                                <View
                                                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                <Text
                                                                    style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Insurance
                                                                    Provider Name</Text>
                                                            </View>
                                                            <TextInput
                                                                style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.colorBlue, Styles.f16]}
                                                                placeholder='Enter Insurance Provider Name'
                                                                autoCompleteType='off'
                                                                editable={this.state.UserFlow === 'NORMAL' ?
                                                                    !(canEditTextInput === false && VehicleResp.insurancePolicyName) : canEditTextInput}
                                                                autoCapitalize="none"
                                                                blurOnSubmit={false}
                                                                // keyboardType='numeric'
                                                                value={this.state.InsuranceProviderName}
                                                                returnKeyType="done"
                                                                onSubmitEditing={() => {
                                                                    Keyboard.dismiss()
                                                                }}
                                                                onChangeText={(InsuranceProviderName) => this.setState({InsuranceProviderName})}/>
                                                        </View>
                                                        {/*INSURANCE NUMBER*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.mTop15]}>
                                                                <View
                                                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleIconVoilet}</View>
                                                                <Text
                                                                    style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Insurance
                                                                    Number</Text>
                                                            </View>
                                                            <TextInput
                                                                style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.colorBlue, Styles.f16]}
                                                                placeholder='Enter Insurance Number'
                                                                autoCompleteType='off'
                                                                editable={this.state.UserFlow === 'NORMAL' ?
                                                                    !(canEditTextInput === false && VehicleResp.insurancePolicyNumber) : canEditTextInput}
                                                                autoCapitalize="none"
                                                                blurOnSubmit={false}
                                                                // keyboardType='numeric'
                                                                value={this.state.InsuransePolicyNumber}
                                                                returnKeyType="done"
                                                                onSubmitEditing={() => {
                                                                    Keyboard.dismiss()
                                                                }}
                                                                onChangeText={(InsuransePolicyNumber) => this.setState({InsuransePolicyNumber})}/>
                                                        </View>

                                                        {/*INSURANCE EXPIRY DATE*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.mTop15]}>
                                                                <View
                                                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.dob}</View>
                                                                <Text
                                                                    style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Insurance
                                                                    Expiry Date</Text>
                                                            </View>
                                                            <TouchableOpacity
                                                                disabled={this.state.UserFlow === 'NORMAL' ?
                                                                    canEditTextInput === false && VehicleResp.insuranceExpiryDate !== null : !canEditTextInput}
                                                                onPress={() => this.toggleDatePicker(true)}
                                                                style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.row, Styles.jSpaceBet]}>
                                                                {
                                                                    this.state.InsuranceExpiryDate === null
                                                                        ?
                                                                        <Text
                                                                            style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Select
                                                                            Expiry Date</Text>
                                                                        :
                                                                        <Text
                                                                            style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>{new Date(this.state.InsuranceExpiryDate).toDateString()}</Text>
                                                                }
                                                                {LoadSVG.date_picker_icon}
                                                                {this.state.showDate && <DateTimePicker
                                                                    timeZoneOffsetInMinutes={0}
                                                                    value={new Date()}
                                                                    mode='date'
                                                                    minimumDate={new Date()}
                                                                    onChange={(event, selectedDate) => {
                                                                        this.updateDate(selectedDate, 'InsuranceExpiryDate');
                                                                    }}/>
                                                                }
                                                            </TouchableOpacity>
                                                            {
                                                                this.state.errorInsuranceMessage ?
                                                                    <Text style={{
                                                                        color: 'red',
                                                                        fontFamily: 'Muli-Regular',
                                                                        paddingLeft: 20, marginBottom: 5
                                                                    }}>{this.state.errorInsuranceMessage}</Text>
                                                                    :
                                                                    null
                                                            }
                                                        </View>
                                                    </View>
                                                    :
                                                    SelectedTab === 'Pollution'
                                                        ?
                                                        <View style={[Styles.mBtm20]}>
                                                            {/*Upload POLLUTION CERTIFICATE PIC*/}
                                                            <View>
                                                                <View
                                                                    style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                                    <View
                                                                        style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                                    <TouchableOpacity
                                                                        disabled={this.state.UserFlow === 'NORMAL' ?
                                                                            canEditTextInput === false && VehicleResp.pollutionExpiryUploadInfo : !canEditTextInput}
                                                                        onPress={() => {
                                                                            // this.vehicleInformationImageUpload('POLLUTION')
                                                                            this.setState({imageType:'POLLUTION',imageSelectionModal:true})
                                                                        }}
                                                                        style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                        <Text
                                                                            style={[Styles.ffMregular,
                                                                                this.state.UserFlow === 'NORMAL' ?
                                                                                    canEditTextInput === false && VehicleResp.pollutionExpiryUploadInfo : canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue,
                                                                                Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                            Pollution Photo</Text>
                                                                    </TouchableOpacity>
                                                                    {
                                                                        canEditTextInput === false && VehicleResp.pollutionExpiryUploadInfo
                                                                            ?
                                                                            null
                                                                            :
                                                                            VehicleResp.pollutionExpiryUploadInfo
                                                                                ?
                                                                                <TouchableOpacity
                                                                                    onPress={() => {
                                                                                        this.deleteUploadedImage('pollutionCheckUploadDetails', VehicleResp.pollutionExpiryUploadInfo.fileName)
                                                                                    }}
                                                                                    style={[Styles.bw1, Styles.br5, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                                    <Text
                                                                                        style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMextrabold, Styles.cWhite]}>Delete</Text>
                                                                                </TouchableOpacity>
                                                                                :
                                                                                null
                                                                    }
                                                                </View>
                                                                {
                                                                    VehicleResp.pollutionExpiryUploadInfo
                                                                        ?
                                                                        <View
                                                                            style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                            <TouchableOpacity
                                                                                style={[Styles.row, Styles.aslCenter]}
                                                                                onPress={() => {
                                                                                    this.setState({
                                                                                        imagePreview: true,
                                                                                        imagePreviewURL: VehicleResp.pollutionExpiryUploadInfo.displayName  ? VehicleResp.pollutionExpiryUploadInfo.displayName : ''
                                                                                    })
                                                                                }}>
                                                                            <Image
                                                                                onLoadStart={() => this.setState({RoadTaxLoading: true})}
                                                                                onLoadEnd={() => this.setState({RoadTaxLoading: false})}
                                                                                style={[{
                                                                                    width: Dimensions.get('window').width / 2,
                                                                                    height: 120
                                                                                }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                source={VehicleResp.pollutionExpiryUploadInfo.displayName ? {uri: VehicleResp.pollutionExpiryUploadInfo.displayName} : null}
                                                                            />
                                                                                <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                                            </TouchableOpacity>
                                                                            <ActivityIndicator
                                                                                style={[Styles.ImageUploadActivityIndicator]}
                                                                                animating={this.state.RoadTaxLoading}
                                                                            />
                                                                        </View>
                                                                        :
                                                                        null
                                                                }
                                                            </View>


                                                            <View>
                                                                <View style={[Styles.row, Styles.mTop15]}>
                                                                    <View
                                                                        style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.dob}</View>
                                                                    <Text
                                                                        style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Pollution
                                                                        Certificate Expiry Date</Text>
                                                                </View>
                                                                <TouchableOpacity
                                                                    disabled={this.state.UserFlow === 'NORMAL' ?
                                                                        canEditTextInput === false && VehicleResp.pollutionExpiryDate !== null : !canEditTextInput}
                                                                    onPress={() => this.togglePollutionPicker(true)}
                                                                    style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.row, Styles.jSpaceBet]}>
                                                                    {
                                                                        this.state.PollutionExpiryDate === null
                                                                            ?
                                                                            <Text
                                                                                style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Select
                                                                                Expiry Date</Text>
                                                                            :
                                                                            <Text
                                                                                style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>{new Date(this.state.PollutionExpiryDate).toDateString()}</Text>
                                                                    }
                                                                    {LoadSVG.date_picker_icon}
                                                                    {this.state.showDatePollution && <DateTimePicker
                                                                        timeZoneOffsetInMinutes={0}
                                                                        value={new Date()}
                                                                        mode='date'
                                                                        minimumDate={new Date()}
                                                                        onChange={(event, selectedDate) => {
                                                                            this.updatePollutionExpiry(selectedDate, 'PollutionExpiryDate');
                                                                        }}/>
                                                                    }
                                                                </TouchableOpacity>
                                                                {
                                                                    this.state.errorPollutionMessage ?
                                                                        <Text style={{
                                                                            color: 'red',
                                                                            fontFamily: 'Muli-Regular',
                                                                            paddingLeft: 20, marginBottom: 5
                                                                        }}>{this.state.errorPollutionMessage}</Text>
                                                                        :
                                                                        null
                                                                }
                                                            </View>

                                                            {/*Upload VEHICLE ROAD TAX PIC*/}
                                                            <View>
                                                                <View
                                                                    style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                                    <View
                                                                        style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                                    <TouchableOpacity
                                                                        disabled={this.state.UserFlow === 'NORMAL' ?
                                                                            canEditTextInput === false && VehicleResp.roadTaxUploadInfo : !canEditTextInput}
                                                                        onPress={() => {
                                                                            // this.vehicleInformationImageUpload('ROADTAX')
                                                                            this.setState({imageType:'ROADTAX',imageSelectionModal:true})
                                                                        }}
                                                                        style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                        <Text
                                                                            style={[Styles.ffMregular,
                                                                                this.state.UserFlow === 'NORMAL' ?
                                                                                    canEditTextInput === false && VehicleResp.roadTaxUploadInfo : canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue,
                                                                                Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                            Road Tax Pic</Text>
                                                                    </TouchableOpacity>
                                                                    {
                                                                        canEditTextInput === false && VehicleResp.roadTaxUploadInfo
                                                                            ?
                                                                            null
                                                                            :
                                                                            VehicleResp.roadTaxUploadInfo
                                                                                ?
                                                                                <TouchableOpacity
                                                                                    onPress={() => {
                                                                                        this.deleteUploadedImage('roadTaxUploadDetails', VehicleResp.roadTaxUploadInfo.fileName)
                                                                                    }}
                                                                                    style={[Styles.bw1, Styles.br5, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                                    <Text
                                                                                        style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMextrabold, Styles.cWhite]}>Delete</Text>
                                                                                </TouchableOpacity>
                                                                                :
                                                                                null
                                                                    }

                                                                </View>
                                                                {
                                                                    VehicleResp.roadTaxUploadInfo
                                                                        ?
                                                                        <View
                                                                            style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                            <TouchableOpacity
                                                                                style={[Styles.row, Styles.aslCenter]}
                                                                                onPress={() => {
                                                                                    this.setState({
                                                                                        imagePreview: true,
                                                                                        imagePreviewURL: VehicleResp.roadTaxUploadInfo.displayName  ? VehicleResp.roadTaxUploadInfo.displayName : ''
                                                                                    })
                                                                                }}>
                                                                            <Image
                                                                                onLoadStart={() => this.setState({RoadTaxLoading: true})}
                                                                                onLoadEnd={() => this.setState({RoadTaxLoading: false})}
                                                                                style={[{
                                                                                    width: Dimensions.get('window').width / 2,
                                                                                    height: 120
                                                                                }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                source={VehicleResp.roadTaxUploadInfo.displayName ? {uri: VehicleResp.roadTaxUploadInfo.displayName} : null}
                                                                            />
                                                                                <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                                            </TouchableOpacity>
                                                                            <ActivityIndicator
                                                                                style={[Styles.ImageUploadActivityIndicator]}
                                                                                animating={this.state.RoadTaxLoading}
                                                                            />
                                                                        </View>
                                                                        :
                                                                        null
                                                                }
                                                            </View>


                                                            <View>
                                                                <View style={[Styles.row, Styles.mTop15]}>
                                                                    <View
                                                                        style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.dob}</View>
                                                                    <Text
                                                                        style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Road
                                                                        Tax Expiry Date</Text>
                                                                </View>
                                                                <TouchableOpacity
                                                                    disabled={this.state.UserFlow === 'NORMAL' ?
                                                                        canEditTextInput === false && VehicleResp.roadTaxExpiryDate !== null : !canEditTextInput}
                                                                    onPress={() => this.toggleDatePicker(true)}
                                                                    style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.row, Styles.jSpaceBet]}>
                                                                    {
                                                                        this.state.RoadTaxExpiryDate === null
                                                                            ?
                                                                            <Text
                                                                                style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Select
                                                                                Expiry Date</Text>
                                                                            :
                                                                            <Text
                                                                                style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>{new Date(this.state.RoadTaxExpiryDate).toDateString()}</Text>

                                                                    }
                                                                    {LoadSVG.date_picker_icon}
                                                                    {this.state.showDate && <DateTimePicker
                                                                        timeZoneOffsetInMinutes={0}
                                                                        value={new Date()}
                                                                        mode='date'
                                                                        minimumDate={new Date()}
                                                                        onChange={(event, selectedDate) => {
                                                                            this.updateDate(selectedDate, 'RoadTaxExpiryDate');
                                                                        }}/>
                                                                    }
                                                                </TouchableOpacity>
                                                                {
                                                                    this.state.errorRoadTaxMessage ?
                                                                        <Text style={{
                                                                            color: 'red',
                                                                            fontFamily: 'Muli-Regular',
                                                                            paddingLeft: 20, marginBottom: 5
                                                                        }}>{this.state.errorRoadTaxMessage}</Text>
                                                                        :
                                                                        null
                                                                }
                                                            </View>
                                                        </View>
                                                        :
                                                        SelectedTab === 'VehicleRC'
                                                            ?
                                                            <View style={[Styles.mBtm20]}>

                                                                {/*VEHICLE REGISTRATION NUMBER*/}
                                                                <View>
                                                                    <View style={[Styles.row, Styles.mTop15]}>
                                                                        <View
                                                                            style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                        <Text
                                                                            style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                            Registration
                                                                            No{Services.returnRedStart()}</Text>
                                                                    </View>
                                                                    <View
                                                                        style={[Styles.row, Styles.mRt30, Styles.mLt40,]}>
                                                                        <TextInput
                                                                            style={[{textTransform: 'uppercase'}, Styles.colorBlue, Styles.bw1, Styles.bcAsh, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.padH10, Styles.aslCenter]}
                                                                            autoCapitalize='characters'
                                                                            placeholder='AA'
                                                                            mode='outlined'
                                                                            autoCompleteType='off'
                                                                            editable={this.state.UserFlow === 'NORMAL' ?
                                                                                !(canEditTextInput === false && VehicleResp.vehicleRegistrationNumber) : canEditTextInput}
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
                                                                            style={[{textTransform: 'uppercase'}, Styles.colorBlue, Styles.bw1, Styles.bcAsh, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.padH10, Styles.aslCenter]}
                                                                            mode='outlined'
                                                                            placeholder='12'
                                                                            autoCompleteType='off'
                                                                            editable={this.state.UserFlow === 'NORMAL' ?
                                                                                !(canEditTextInput === false && VehicleResp.vehicleRegistrationNumber) : canEditTextInput}
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
                                                                            style={[{textTransform: 'uppercase'}, Styles.colorBlue, Styles.bw1, Styles.bcAsh, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.padH10, Styles.aslCenter]}
                                                                            placeholder='AA'
                                                                            mode='outlined'
                                                                            autoCompleteType='off'
                                                                            editable={this.state.UserFlow === 'NORMAL' ?
                                                                                !(canEditTextInput === false && VehicleResp.vehicleRegistrationNumber) : canEditTextInput}
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
                                                                            style={[{textTransform: 'uppercase'}, Styles.colorBlue, Styles.bw1, Styles.bcAsh, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.padH20, Styles.aslCenter]}
                                                                            placeholder='1234'
                                                                            keyboardType='numeric'
                                                                            mode='outlined'
                                                                            autoCompleteType='off'
                                                                            editable={this.state.UserFlow === 'NORMAL' ?
                                                                                !(canEditTextInput === false && VehicleResp.vehicleRegistrationNumber) : canEditTextInput}
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
                                                                                paddingLeft: 20, marginBottom: 5
                                                                            }}>{this.state.errorVehicleRegMessage}</Text>
                                                                            :
                                                                            null
                                                                    }
                                                                </View>


                                                                {/*VEHICLE TYPE*/}
                                                                <View>
                                                                    <View style={[Styles.row, Styles.mTop15]}>
                                                                        <View
                                                                            style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                        <Text
                                                                            style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                            Type{Services.returnRedStart()}</Text>
                                                                    </View>
                                                                    <View
                                                                        style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.jSpaceArd, Styles.row]}>
                                                                        <TouchableOpacity
                                                                            disabled={this.state.UserFlow === 'NORMAL' ?
                                                                                canEditTextInput === false && VehicleResp.vehicleType : !canEditTextInput}
                                                                            onPress={() => {
                                                                                this.setState({VehicleType: '2'}, () => {
                                                                                    this.validateVehicleNum('')
                                                                                })
                                                                            }}
                                                                            style={[Styles.bw1, Styles.bcAsh, Styles.padH20, Styles.padV5, Styles.br20,
                                                                                this.state.VehicleType === '2' ? Styles.bgAsh : Styles.bgWhite]}>
                                                                            <Image
                                                                                style={[Styles.aslCenter, Styles.img30]}
                                                                                source={LoadImages.vehicle_two}/>
                                                                        </TouchableOpacity>
                                                                        <TouchableOpacity
                                                                            disabled={this.state.UserFlow === 'NORMAL' ?
                                                                                canEditTextInput === false && VehicleResp.vehicleType : !canEditTextInput}
                                                                            onPress={() => {
                                                                                this.setState({VehicleType: '3'}, () => {
                                                                                    this.validateVehicleNum('')
                                                                                })
                                                                            }}
                                                                            style={[Styles.bw1, Styles.bcAsh, Styles.padH20, Styles.padV5, Styles.br20,
                                                                                this.state.VehicleType === '3' ? Styles.bgAsh : Styles.bgWhite]}>
                                                                            <Image
                                                                                style={[Styles.aslCenter, Styles.img30]}
                                                                                source={LoadImages.vehicle_three}/>
                                                                        </TouchableOpacity>
                                                                        <TouchableOpacity
                                                                            disabled={this.state.UserFlow === 'NORMAL' ?
                                                                                canEditTextInput === false && VehicleResp.vehicleType : canEditTextInput}
                                                                            onPress={() => {
                                                                                this.setState({VehicleType: '4'}, () => {
                                                                                    this.validateVehicleNum('')
                                                                                })
                                                                            }}
                                                                            style={[Styles.bw1, Styles.bcAsh, Styles.padH20, Styles.padV5, Styles.br20,
                                                                                this.state.VehicleType === '4' ? Styles.bgAsh : Styles.bgWhite]}>
                                                                            <Image
                                                                                style={[Styles.aslCenter, Styles.img30]}
                                                                                source={LoadImages.vehicle_four}/>
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                    {
                                                                        this.state.errorVehicleTypeMessage ?
                                                                            <Text style={{
                                                                                color: 'red',
                                                                                fontFamily: 'Muli-Regular',
                                                                                paddingLeft: 20, marginBottom: 5
                                                                            }}>{this.state.errorVehicleTypeMessage}</Text>
                                                                            :
                                                                            null
                                                                    }
                                                                </View>

                                                                {/*VEHICLE BRAND*/}
                                                                <View>
                                                                    <View style={[Styles.row, Styles.mTop15]}>
                                                                        <View
                                                                            style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                        <Text
                                                                            style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                            Brand</Text>
                                                                    </View>
                                                                    <View
                                                                        style={[Styles.bw1, Styles.bcAsh, Styles.padV5, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.mRt30, Styles.mLt40,]}>
                                                                        <Picker
                                                                            // enabled={!(canEditTextInput === false && VehicleResp.brand)}
                                                                            itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                                                            selectedValue={this.state.VehicleBrand}
                                                                            mode='dropdown'
                                                                            onValueChange={(itemValue, itemIndex) => this.setState({VehicleBrand: itemValue})}
                                                                        >
                                                                            {this.state.vehicleBrand.map((item, index) => {
                                                                                return (< Picker.Item
                                                                                    label={item.label}
                                                                                    value={item.value}
                                                                                    key={index}/>);
                                                                            })}
                                                                        </Picker>
                                                                    </View>
                                                                </View>

                                                                {/*VEHICLE Variant*/}
                                                                <View>
                                                                    <View style={[Styles.row, Styles.mTop15]}>
                                                                        <View
                                                                            style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                        <Text
                                                                            style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                            Variant</Text>
                                                                    </View>
                                                                    <View
                                                                        style={[Styles.bw1, Styles.bcAsh, Styles.padV5, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.mRt30, Styles.mLt40,]}>
                                                                        <Picker
                                                                            itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                                                            selectedValue={this.state.variant}
                                                                            mode='dropdown'
                                                                            onValueChange={(itemValue, itemIndex) => this.setState({variant: itemValue})}
                                                                        >
                                                                            {this.state.variantsList.map((item, index) => {
                                                                                return (< Picker.Item
                                                                                    label={item.label}
                                                                                    value={item.value}
                                                                                    key={index}/>);
                                                                            })}
                                                                        </Picker>
                                                                    </View>
                                                                </View>


                                                                {/*VEHICLE MODAL*/}
                                                                <View>
                                                                    <View style={[Styles.row, Styles.mTop15]}>
                                                                        <View
                                                                            style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                        <Text
                                                                            style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                            Model{Services.returnRedStart()}</Text>
                                                                    </View>
                                                                    <View
                                                                        style={[Styles.bw1, Styles.bcAsh, Styles.padV5, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.mRt30, Styles.mLt40,]}>
                                                                        <Picker
                                                                            itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                                                            selectedValue={this.state.VehicleModalName}
                                                                            mode='dropdown'
                                                                            // enabled={canEditTextInput === false && VehicleResp.model === null}
                                                                            onValueChange={(itemValue, itemIndex) => this.setState({VehicleModalName: itemValue}, () => {
                                                                                this.validateVehicleNum('')
                                                                            })}>
                                                                            {
                                                                                this.state.VehicleType === '4' || this.state.VehicleType === '3'
                                                                                    ?
                                                                                    this.state.fourVehicleModalList.map((item, index) => {
                                                                                        return (
                                                                                            < Picker.Item
                                                                                                label={item.label}
                                                                                                value={item.value}
                                                                                                key={index}/>);
                                                                                    })
                                                                                    :
                                                                                    this.state.twoVehicleModalList.map((item, index) => {
                                                                                        return (
                                                                                            < Picker.Item
                                                                                                label={item.label}
                                                                                                value={item.value}
                                                                                                key={index}/>);
                                                                                    })
                                                                            }
                                                                        </Picker>
                                                                    </View>
                                                                    {
                                                                        this.state.errorVehicleModalMessage ?
                                                                            <Text style={{
                                                                                color: 'red',
                                                                                fontFamily: 'Muli-Regular',
                                                                                paddingLeft: 20, marginBottom: 5
                                                                            }}>{this.state.errorVehicleModalMessage}</Text>
                                                                            :
                                                                            null
                                                                    }
                                                                </View>


                                                                {/*VEHICLE TONNAGE*/}
                                                                <View>
                                                                    <View style={[Styles.row, Styles.mTop15]}>
                                                                        <View
                                                                            style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleIconVoilet}</View>
                                                                        <Text
                                                                            style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                            Tonnage</Text>
                                                                    </View>
                                                                    <View
                                                                        style={[Styles.bw1, Styles.bcAsh, Styles.padV5, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.mRt30, Styles.mLt40,]}>
                                                                        <Picker
                                                                            itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                                                            selectedValue={this.state.VehicleTonnage}
                                                                            mode='dropdown'
                                                                            onValueChange={(itemValue, itemIndex) => this.setState({VehicleTonnage: itemValue})}
                                                                        >
                                                                            {this.state.tonnageList.map((item, index) => {
                                                                                return (< Picker.Item
                                                                                    label={item.label}
                                                                                    value={item.value}
                                                                                    key={index}/>);
                                                                            })}
                                                                        </Picker>
                                                                    </View>
                                                                </View>

                                                                {/*VEHICLE CLASS*/}
                                                                <View>
                                                                    <View style={[Styles.row, Styles.mTop15]}>
                                                                        <View
                                                                            style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                        <Text
                                                                            style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                            Class</Text>
                                                                    </View>
                                                                    <View
                                                                        style={[Styles.row, Styles.mRt30, Styles.mLt40, Styles.flexWrap]}>
                                                                        {this.state.vehicleClassList.map(chipsList => {
                                                                            return (
                                                                                <Chip key={chipsList.key}
                                                                                      disabled={this.state.UserFlow === 'NORMAL' ?
                                                                                          canEditTextInput === false && VehicleResp.vehicleClass : !canEditTextInput}
                                                                                      style={[Styles.m5, Styles.bw1, Styles.bcAsh, Styles.br15,
                                                                                          this.state.VehicleClass === chipsList.value ? Styles.bgRed : Styles.bgWhite]}
                                                                                      textStyle={[Styles.f16, Styles.ffMextrabold, this.state.VehicleClass === chipsList.value ? Styles.cWhite : Styles.colorBlue,]}
                                                                                      onPress={() => {
                                                                                          this.setState({VehicleClass: chipsList.value})
                                                                                      }}>{chipsList.label}</Chip>
                                                                            );
                                                                        })}
                                                                    </View>
                                                                </View>


                                                                {/*Upload VEHICLE RC PIC*/}
                                                                <View>
                                                                    <View
                                                                        style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                                        <View
                                                                            style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                                        <TouchableOpacity
                                                                            disabled={this.state.UserFlow === 'NORMAL' ?
                                                                                canEditTextInput === false && VehicleResp.rcUploadInfo : canEditTextInput === false}
                                                                            onPress={() => {
                                                                                // this.vehicleInformationImageUpload('VEHICLE_RC')
                                                                                this.setState({imageType:'VEHICLE_RC',imageSelectionModal:true})
                                                                            }}
                                                                            style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                            <Text
                                                                                style={[Styles.ffMregular,
                                                                                    this.state.UserFlow === 'NORMAL' ?
                                                                                        canEditTextInput === false && VehicleResp.rcUploadInfo : canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue,
                                                                                    Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                                Vehicle RC front side
                                                                                Pic{Services.returnRedStart()}</Text>
                                                                        </TouchableOpacity>

                                                                    </View>
                                                                    {
                                                                        VehicleResp.rcUploadInfo
                                                                            ?
                                                                            <View
                                                                                style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                                <TouchableOpacity
                                                                                    style={[Styles.row, Styles.aslCenter]}
                                                                                    onPress={() => {
                                                                                        this.setState({
                                                                                            imagePreview: true,
                                                                                            imagePreviewURL: VehicleResp.rcUploadInfo.displayName  ? VehicleResp.rcUploadInfo.displayName : ''
                                                                                        })
                                                                                    }}>
                                                                                    <Image
                                                                                    onLoadStart={() => this.setState({VehicleRCLoading: true})}
                                                                                    onLoadEnd={() => this.setState({VehicleRCLoading: false})}
                                                                                    style={[{
                                                                                        width: Dimensions.get('window').width / 2,
                                                                                        height: 120
                                                                                    }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                    source={VehicleResp.rcUploadInfo.displayName ? {uri: VehicleResp.rcUploadInfo.displayName} : null}
                                                                                />
                                                                                    <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                                                </TouchableOpacity>
                                                                                <ActivityIndicator
                                                                                    style={[Styles.ImageUploadActivityIndicator]}
                                                                                    animating={this.state.VehicleRCLoading}
                                                                                />
                                                                                <View style={[Styles.posAbsoluteChip]}>
                                                                                    {
                                                                                        canEditTextInput === false && VehicleResp.rcUploadInfo
                                                                                            ?
                                                                                            null
                                                                                            :
                                                                                            VehicleResp.rcUploadInfo
                                                                                                ?
                                                                                                <TouchableOpacity
                                                                                                    onPress={() => {
                                                                                                        this.deleteUploadedImage('rcUploadInfo', VehicleResp.rcUploadInfo.fileName)
                                                                                                    }}
                                                                                                    style={[Styles.bw1, Styles.br30, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                                                    <MaterialIcons
                                                                                                        name='close'
                                                                                                        size={28}
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


                                                                {/*Upload VEHICLE RC BACK SIDE PIC*/}
                                                                <View>
                                                                    <View
                                                                        style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                                        <View
                                                                            style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                                        <TouchableOpacity
                                                                            disabled={this.state.UserFlow === 'NORMAL' ?
                                                                                canEditTextInput === false && VehicleResp.rcBackSideInfo : canEditTextInput === false}
                                                                            onPress={() => {
                                                                                // this.vehicleInformationImageUpload('VEHICLE_RC_BACK')
                                                                                this.setState({imageType:'VEHICLE_RC_BACK',imageSelectionModal:true})
                                                                            }}
                                                                            style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                            <Text
                                                                                style={[Styles.ffMregular,
                                                                                    this.state.UserFlow === 'NORMAL' ?
                                                                                        canEditTextInput === false && VehicleResp.rcBackSideInfo : canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue,
                                                                                    Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                                Vehicle RC back side
                                                                                Pic{Services.returnRedStart()}</Text>
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                    {
                                                                        VehicleResp.rcBackSideInfo
                                                                            ?
                                                                            <View
                                                                                style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                                <TouchableOpacity
                                                                                    style={[Styles.row, Styles.aslCenter]}
                                                                                    onPress={() => {
                                                                                        this.setState({
                                                                                            imagePreview: true,
                                                                                            imagePreviewURL: VehicleResp.rcBackSideInfo.displayName  ? VehicleResp.rcBackSideInfo.displayName : ''
                                                                                        })
                                                                                    }}>
                                                                                    <Image
                                                                                    onLoadStart={() => this.setState({VehicleRCBackLoading: true})}
                                                                                    onLoadEnd={() => this.setState({VehicleRCBackLoading: false})}
                                                                                    style={[{
                                                                                        width: Dimensions.get('window').width / 2,
                                                                                        height: 120
                                                                                    }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                    source={VehicleResp.rcBackSideInfo.displayName ? {uri: VehicleResp.rcBackSideInfo.displayName} : null}
                                                                                />
                                                                                    <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                                                </TouchableOpacity>
                                                                                <ActivityIndicator
                                                                                    style={[Styles.ImageUploadActivityIndicator]}
                                                                                    animating={this.state.VehicleRCBackLoading}
                                                                                />
                                                                                <View style={[Styles.posAbsoluteChip]}>
                                                                                    {
                                                                                        canEditTextInput === false && VehicleResp.rcBackSideInfo
                                                                                            ?
                                                                                            null
                                                                                            :
                                                                                            VehicleResp.rcBackSideInfo
                                                                                                ?
                                                                                                <TouchableOpacity
                                                                                                    onPress={() => {
                                                                                                        this.deleteUploadedImage('rcBackSideInfo', VehicleResp.rcBackSideInfo.fileName)
                                                                                                    }}
                                                                                                    style={[Styles.bw1, Styles.br30, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                                                    <MaterialIcons
                                                                                                        name='close'
                                                                                                        size={28}
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

                                                                {/*Upload VEHICLE FRONT PIC*/}
                                                                <View>
                                                                    <View
                                                                        style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                                        <View
                                                                            style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                                        <TouchableOpacity
                                                                            disabled={this.state.UserFlow === 'NORMAL' ?
                                                                                canEditTextInput === false && VehicleResp.vehicleNoPlateImageInfo : canEditTextInput === false}
                                                                            onPress={() => {
                                                                                // this.vehicleInformationImageUpload('VEHICLE_FRONT_NUMBER_PLATE')
                                                                                this.setState({imageType:'VEHICLE_FRONT_NUMBER_PLATE',imageSelectionModal:true})
                                                                            }}
                                                                            style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                            <Text
                                                                                style={[Styles.ffMregular,
                                                                                    this.state.UserFlow === 'NORMAL' ?
                                                                                        canEditTextInput === false && VehicleResp.vehicleNoPlateImageInfo : canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue,
                                                                                    Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                                Vehicle Front
                                                                                Pic{Services.returnRedStart()}</Text>
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                    {
                                                                        VehicleResp.vehicleNoPlateImageInfo
                                                                            ?
                                                                            <View
                                                                                style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                                <TouchableOpacity
                                                                                    style={[Styles.row, Styles.aslCenter]}
                                                                                    onPress={() => {
                                                                                        this.setState({
                                                                                            imagePreview: true,
                                                                                            imagePreviewURL: VehicleResp.vehicleNoPlateImageInfo.displayName  ? VehicleResp.vehicleNoPlateImageInfo.displayName : ''
                                                                                        })
                                                                                    }}>
                                                                                <Image
                                                                                    onLoadStart={() => this.setState({VehicleFrontLoading: true})}
                                                                                    onLoadEnd={() => this.setState({VehicleFrontLoading: false})}
                                                                                    style={[{
                                                                                        width: Dimensions.get('window').width / 2,
                                                                                        height: 120
                                                                                    }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                    source={VehicleResp.vehicleNoPlateImageInfo.displayName ? {uri: VehicleResp.vehicleNoPlateImageInfo.displayName} : null}
                                                                                />
                                                                                    <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                                                </TouchableOpacity>
                                                                                <ActivityIndicator
                                                                                    style={[Styles.ImageUploadActivityIndicator]}
                                                                                    animating={this.state.VehicleFrontLoading}
                                                                                />
                                                                                <View style={[Styles.posAbsoluteChip]}>
                                                                                    {
                                                                                        canEditTextInput === false && VehicleResp.vehicleNoPlateImageInfo
                                                                                            ?
                                                                                            null
                                                                                            :
                                                                                            VehicleResp.vehicleNoPlateImageInfo
                                                                                                ?
                                                                                                <TouchableOpacity
                                                                                                    onPress={() => {
                                                                                                        this.deleteUploadedImage('vehicleNoPlateImageInfo', VehicleResp.vehicleNoPlateImageInfo.fileName)
                                                                                                    }}
                                                                                                    style={[Styles.bw1, Styles.br30, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                                                    <MaterialIcons
                                                                                                        name='close'
                                                                                                        size={28}
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

                                                            </View>
                                                            :
                                                            null
                                            }
                                        </ScrollView>

                                        {/*SAVE BUTTON*/}
                                        {
                                            this.state.mandatoryChecks === false
                                                ?
                                                <Text style={[Styles.cRed, Styles.ffMbold, {
                                                    paddingLeft: 30, marginBottom: 5
                                                }]}>* Fill Mandatory Fields</Text>
                                                :
                                                null
                                        }
                                        {
                                            this.state.UserFlow === 'NORMAL' || canEditTextInput
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.validateVehicleNum('onClickSave')
                                                    }}
                                                    style={[Styles.defaultbgColor, Styles.p10, Styles.m3, Styles.br10]}>
                                                    <Text
                                                        style={[Styles.aslCenter, Styles.cWhite, Styles.padV5, Styles.ffMbold, Styles.f16]}>UPDATE</Text>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                    </View>
                                    :
                                    null
                            }

                        </View>
                    </View>
                </Modal>


                {/*ADD VEHICLE DETAILS Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.ShowAddVehicleDetailsModal}
                    onRequestClose={() => {
                        this.setState({ShowAddVehicleDetailsModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgWhite, Styles.jSpaceBet]}>
                                <Appbar.Content title="Add Vehicle Information"
                                                titleStyle={[Styles.ffMbold, Styles.cBlk]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#000" style={{marginRight: 10}}
                                                        onPress={() => this.setState({ShowAddVehicleDetailsModal: false})}/>
                            </Appbar.Header>
                            <View style={[Styles.flex1, Styles.bgWhite]}>
                                <View style={[Styles.row, Styles.bgDarkRed, Styles.ProfileScreenCardshadow]}>
                                    <TouchableOpacity onPress={() => {
                                        this.setState({SelectedTab: 'VehicleRC'})
                                    }}
                                                      style={[Styles.flex1, Styles.aitCenter, Styles.padV10,
                                                          SelectedTab === 'VehicleRC' ? Styles.brdrBtm2White : Styles.brdrBtm2Red
                                                      ]}>
                                        <Text
                                            style={[Styles.cWhite, Styles.f18, Styles.pBtm5, SelectedTab === 'VehicleRC' ? Styles.ffMextrabold : Styles.ffMregular]}>Vehicle/RC</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => {
                                        this.setState({SelectedTab: 'Pollution'})
                                    }}
                                                      style={[Styles.flex1, Styles.aitCenter, Styles.padV10,
                                                          SelectedTab === 'Pollution' ? Styles.brdrBtm2White : Styles.brdrBtm2Red
                                                      ]}>
                                        <Text
                                            style={[Styles.cWhite, Styles.f18, Styles.pBtm5, SelectedTab === 'Pollution' ? Styles.ffMextrabold : Styles.ffMregular]}>Pollution</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => {
                                        this.setState({SelectedTab: 'Insurance'})
                                    }}
                                                      style={[Styles.flex1, Styles.aitCenter, Styles.padV10,
                                                          SelectedTab === 'Insurance' ? Styles.brdrBtm2White : Styles.brdrBtm2Red
                                                      ]}>
                                        <Text
                                            style={[Styles.cWhite, Styles.f18, Styles.pBtm5, SelectedTab === 'Insurance' ? Styles.ffMextrabold : Styles.ffMregular]}>Insurance</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={[Styles.p10]}>
                                    {
                                        SelectedTab === 'Insurance'
                                            ?
                                            <View style={[Styles.mBtm20]}>
                                                {/*Upload INSURANCE PIC*/}
                                                <View>
                                                    <View style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                        <View style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                // this.vehicleInformationImageUpload('INSURANCE')
                                                                this.setState({imageType:'INSURANCE',imageSelectionModal:true})
                                                            }}
                                                            style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                            <Text
                                                                style={[Styles.ffMregular, Styles.colorBlue,
                                                                    Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                Insurance Photo</Text>
                                                        </TouchableOpacity>

                                                    </View>
                                                    {
                                                        ImagesArray[0].insurancePic === ''
                                                            ?
                                                            null
                                                            :
                                                            <View
                                                                style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                <TouchableOpacity
                                                                    style={[Styles.row, Styles.aslCenter]}
                                                                    onPress={() => {
                                                                        this.setState({
                                                                            imagePreview: true,
                                                                            imagePreviewURL: ImagesArray[0].insurancePic  ?ImagesArray[0].insurancePic : ''
                                                                        })
                                                                    }}>
                                                                    <Image
                                                                    onLoadStart={() => this.setState({insurancePic: true})}
                                                                    onLoadEnd={() => this.setState({insurancePic: false})}
                                                                    style={[{
                                                                        width: Dimensions.get('window').width / 2,
                                                                        height: 120
                                                                    }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                    source={ImagesArray[0].insurancePic ? {uri: ImagesArray[0].insurancePic} : null}
                                                                />
                                                                    <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                                </TouchableOpacity>
                                                                <ActivityIndicator
                                                                    style={[Styles.ImageUploadActivityIndicator]}
                                                                    animating={this.state.insurancePic}
                                                                />
                                                            </View>
                                                    }
                                                </View>

                                                {/*INSURANCE PROVIDER NAME*/}
                                                <View>
                                                    <View style={[Styles.row, Styles.mTop15]}>
                                                        <View
                                                            style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                        <Text
                                                            style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Insurance
                                                            Provider Name</Text>
                                                    </View>
                                                    <TextInput
                                                        style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.colorBlue, Styles.f16]}
                                                        placeholder='Enter Insurance Provider Name'
                                                        autoCompleteType='off'
                                                        autoCapitalize="none"
                                                        blurOnSubmit={false}
                                                        // keyboardType='numeric'
                                                        value={this.state.InsuranceProviderName}
                                                        returnKeyType="done"
                                                        onSubmitEditing={() => {
                                                            Keyboard.dismiss()
                                                        }}
                                                        onChangeText={(InsuranceProviderName) => this.setState({InsuranceProviderName})}/>
                                                </View>

                                                <View>
                                                    <View style={[Styles.row, Styles.mTop15]}>
                                                        <View
                                                            style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleIconVoilet}</View>
                                                        <Text
                                                            style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Insurance
                                                            Number</Text>
                                                    </View>
                                                    <TextInput
                                                        style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.colorBlue, Styles.f16]}
                                                        placeholder='Enter Insurance Number'
                                                        autoCompleteType='off'
                                                        autoCapitalize="none"
                                                        blurOnSubmit={false}
                                                        // keyboardType='numeric'
                                                        value={this.state.InsuransePolicyNumber}
                                                        returnKeyType="done"
                                                        onSubmitEditing={() => {
                                                            Keyboard.dismiss()
                                                        }}
                                                        onChangeText={(InsuransePolicyNumber) => this.setState({InsuransePolicyNumber})}/>
                                                </View>


                                                <View>
                                                    <View style={[Styles.row, Styles.mTop15]}>
                                                        <View
                                                            style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.dob}</View>
                                                        <Text
                                                            style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Insurance
                                                            Expiry Date</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={() => this.toggleDatePicker(true)}
                                                        style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.row, Styles.jSpaceBet]}>
                                                        {
                                                            this.state.InsuranceExpiryDate === null
                                                                ?
                                                                <Text
                                                                    style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Select
                                                                    Expiry Date</Text>
                                                                :
                                                                <Text
                                                                    style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>{new Date(this.state.InsuranceExpiryDate).toDateString()}</Text>
                                                        }
                                                        {LoadSVG.date_picker_icon}
                                                        {this.state.showDate && <DateTimePicker
                                                            timeZoneOffsetInMinutes={0}
                                                            value={new Date()}
                                                            mode='date'
                                                            minimumDate={new Date()}
                                                            onChange={(event, selectedDate) => {
                                                                this.updateDate(selectedDate, 'InsuranceExpiryDate');
                                                            }}/>
                                                        }
                                                    </TouchableOpacity>
                                                    {
                                                        this.state.errorInsuranceMessage ?
                                                            <Text style={{
                                                                color: 'red',
                                                                fontFamily: 'Muli-Regular',
                                                                paddingLeft: 20, marginBottom: 5
                                                            }}>{this.state.errorInsuranceMessage}</Text>
                                                            :
                                                            null
                                                    }
                                                </View>
                                            </View>
                                            :
                                            SelectedTab === 'Pollution'
                                                ?
                                                <View style={[Styles.mBtm20]}>
                                                    {/*Upload POLLUTION PIC*/}
                                                    <View>
                                                        <View style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                            <View style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    // this.vehicleInformationImageUpload('POLLUTION')
                                                                    this.setState({imageType:'POLLUTION',imageSelectionModal:true})
                                                                }}
                                                                style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                <Text
                                                                    style={[Styles.ffMregular, Styles.colorBlue,
                                                                        Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                    Pollution Photo</Text>
                                                            </TouchableOpacity>

                                                        </View>
                                                        {
                                                            ImagesArray[2].PollutionPic === ''
                                                                ?
                                                                null
                                                                :
                                                                <View
                                                                    style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                    <TouchableOpacity
                                                                        style={[Styles.row, Styles.aslCenter]}
                                                                        onPress={() => {
                                                                            this.setState({
                                                                                imagePreview: true,
                                                                                imagePreviewURL: ImagesArray[2].PollutionPic  ? ImagesArray[2].PollutionPic : ''
                                                                            })
                                                                        }}>
                                                                    <Image
                                                                        onLoadStart={() => this.setState({PollutionPic: true})}
                                                                        onLoadEnd={() => this.setState({PollutionPic: false})}
                                                                        style={[{
                                                                            width: Dimensions.get('window').width / 2,
                                                                            height: 120
                                                                        }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                        source={ImagesArray[2].PollutionPic ? {uri: ImagesArray[2].PollutionPic} : null}
                                                                    />
                                                                        <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                                    </TouchableOpacity>
                                                                    <ActivityIndicator
                                                                        style={[Styles.ImageUploadActivityIndicator]}
                                                                        animating={this.state.PollutionPic}
                                                                    />
                                                                </View>
                                                        }
                                                    </View>


                                                    <View>
                                                        <View style={[Styles.row, Styles.mTop15]}>
                                                            <View
                                                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.dob}</View>
                                                            <Text
                                                                style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Pollution
                                                                Certificate Expiry Date</Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={() => this.togglePollutionPicker(true)}
                                                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.row, Styles.jSpaceBet]}
                                                        >
                                                            {
                                                                this.state.PollutionExpiryDate === null
                                                                    ?
                                                                    <Text
                                                                        style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Select
                                                                        Expiry Date</Text>
                                                                    :
                                                                    <Text
                                                                        style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>{new Date(this.state.PollutionExpiryDate).toDateString()}</Text>
                                                            }
                                                            {LoadSVG.date_picker_icon}
                                                            {this.state.showDatePollution && <DateTimePicker
                                                                timeZoneOffsetInMinutes={0}
                                                                value={new Date()}
                                                                mode='date'
                                                                minimumDate={new Date()}
                                                                onChange={(event, selectedDate) => {
                                                                    this.updatePollutionExpiry(selectedDate, 'PollutionExpiryDate');
                                                                }}/>
                                                            }
                                                        </TouchableOpacity>
                                                        {
                                                            this.state.errorPollutionMessage ?
                                                                <Text style={{
                                                                    color: 'red',
                                                                    fontFamily: 'Muli-Regular',
                                                                    paddingLeft: 20, marginBottom: 5
                                                                }}>{this.state.errorPollutionMessage}</Text>
                                                                :
                                                                null
                                                        }
                                                    </View>

                                                    {/*Upload ROADTAX PIC*/}
                                                    <View>
                                                        <View style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                            <View style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    // this.vehicleInformationImageUpload('ROADTAX')
                                                                    this.setState({imageType:'ROADTAX',imageSelectionModal:true})
                                                                }}
                                                                style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                <Text
                                                                    style={[Styles.ffMregular, Styles.colorBlue,
                                                                        Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                    Road Tax Photo</Text>
                                                            </TouchableOpacity>

                                                        </View>
                                                        {
                                                            ImagesArray[3].RoadTaxPic === ''
                                                                ?
                                                                null
                                                                :
                                                                <View
                                                                    style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                    <TouchableOpacity
                                                                        style={[Styles.row, Styles.aslCenter]}
                                                                        onPress={() => {
                                                                            this.setState({
                                                                                imagePreview: true,
                                                                                imagePreviewURL: ImagesArray[3].RoadTaxPic ? ImagesArray[3].RoadTaxPic : ''
                                                                            })
                                                                        }}>
                                                                    <Image
                                                                        onLoadStart={() => this.setState({RoadTaxPic: true})}
                                                                        onLoadEnd={() => this.setState({RoadTaxPic: false})}
                                                                        style={[{
                                                                            width: Dimensions.get('window').width / 2,
                                                                            height: 120
                                                                        }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                        source={ImagesArray[3].RoadTaxPic ? {uri: ImagesArray[3].RoadTaxPic} : null}
                                                                    />
                                                                        <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                                    </TouchableOpacity>
                                                                    <ActivityIndicator
                                                                        style={[Styles.ImageUploadActivityIndicator]}
                                                                        animating={this.state.RoadTaxPic}
                                                                    />
                                                                </View>
                                                        }
                                                    </View>


                                                    <View>
                                                        <View style={[Styles.row, Styles.mTop15]}>
                                                            <View
                                                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.dob}</View>
                                                            <Text
                                                                style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Road
                                                                Tax Expiry Date</Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={() => this.toggleDatePicker(true)}
                                                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.row, Styles.jSpaceBet]}>
                                                            {
                                                                this.state.RoadTaxExpiryDate === null
                                                                    ?
                                                                    <Text
                                                                        style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Select
                                                                        Expiry Date</Text>
                                                                    :
                                                                    <Text
                                                                        style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>{new Date(this.state.RoadTaxExpiryDate).toDateString()}</Text>
                                                            }
                                                            {LoadSVG.date_picker_icon}
                                                            {this.state.showDate && <DateTimePicker
                                                                timeZoneOffsetInMinutes={0}
                                                                value={new Date()}
                                                                mode='date'
                                                                minimumDate={new Date()}
                                                                onChange={(event, selectedDate) => {
                                                                    this.updateDate(selectedDate, 'RoadTaxExpiryDate');
                                                                }}/>
                                                            }
                                                        </TouchableOpacity>
                                                        {
                                                            this.state.errorRoadTaxMessage ?
                                                                <Text style={{
                                                                    color: 'red',
                                                                    fontFamily: 'Muli-Regular',
                                                                    paddingLeft: 20, marginBottom: 5
                                                                }}>{this.state.errorRoadTaxMessage}</Text>
                                                                :
                                                                null
                                                        }
                                                    </View>
                                                </View>
                                                :
                                                SelectedTab === 'VehicleRC'
                                                    ?
                                                    <View style={[Styles.mBtm20]}>

                                                        {/*VEHICLE REGISTRATION NUMBER*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.mTop15]}>
                                                                <View
                                                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                <Text
                                                                    style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                    Registration No{Services.returnRedStart()}</Text>
                                                            </View>
                                                            <View style={[Styles.row, Styles.mRt30, Styles.mLt40,]}>
                                                                <TextInput
                                                                    style={[{textTransform: 'uppercase'}, Styles.colorBlue,
                                                                        Styles.bw1, Styles.bcAsh, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.padH10, Styles.aslCenter]}
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
                                                                    style={[{textTransform: 'uppercase'}, Styles.colorBlue, Styles.bw1, Styles.bcAsh, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.padH10, Styles.aslCenter]}
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
                                                                    style={[{textTransform: 'uppercase'}, Styles.colorBlue, Styles.bw1, Styles.bcAsh, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.padH10, Styles.aslCenter]}
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
                                                                    style={[{textTransform: 'uppercase'}, Styles.colorBlue, Styles.bw1, Styles.bcAsh, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.padH20, Styles.aslCenter]}
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
                                                                        paddingLeft: 20, marginBottom: 5
                                                                    }}>{this.state.errorVehicleRegMessage}</Text>
                                                                    :
                                                                    null
                                                            }
                                                        </View>


                                                        {/*VEHICLE TYPE*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.mTop15]}>
                                                                <View
                                                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                <Text
                                                                    style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                    Type{Services.returnRedStart()}</Text>
                                                            </View>
                                                            <View
                                                                style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.jSpaceArd, Styles.row]}>
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        this.setState({VehicleType: '2'}, () => {
                                                                            this.validateVehicleNum('')
                                                                        })
                                                                    }}
                                                                    style={[Styles.bw1, Styles.bcAsh, Styles.padH20, Styles.padV5, Styles.br20,
                                                                        this.state.VehicleType === '2' ? Styles.bgAsh : Styles.bgWhite]}>
                                                                    <Image
                                                                        style={[Styles.aslCenter, Styles.img30]}
                                                                        source={LoadImages.vehicle_two}/>
                                                                </TouchableOpacity>
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        this.setState({VehicleType: '3'}, () => {
                                                                            this.validateVehicleNum('')
                                                                        })
                                                                    }}
                                                                    style={[Styles.bw1, Styles.bcAsh, Styles.padH20, Styles.padV5, Styles.br20,
                                                                        this.state.VehicleType === '3' ? Styles.bgAsh : Styles.bgWhite]}>
                                                                    <Image
                                                                        style={[Styles.aslCenter, Styles.img30]}
                                                                        source={LoadImages.vehicle_three}/>
                                                                </TouchableOpacity>
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        this.setState({VehicleType: '4'}, () => {
                                                                            this.validateVehicleNum('')
                                                                        })
                                                                    }}
                                                                    style={[Styles.bw1, Styles.bcAsh, Styles.padH20, Styles.padV5, Styles.br20,
                                                                        this.state.VehicleType === '4' ? Styles.bgAsh : Styles.bgWhite]}>
                                                                    <Image
                                                                        style={[Styles.aslCenter, Styles.img30]}
                                                                        source={LoadImages.vehicle_four}/>
                                                                </TouchableOpacity>
                                                            </View>
                                                            {
                                                                this.state.errorVehicleTypeMessage ?
                                                                    <Text style={{
                                                                        color: 'red',
                                                                        fontFamily: 'Muli-Regular',
                                                                        paddingLeft: 20, marginBottom: 5
                                                                    }}>{this.state.errorVehicleTypeMessage}</Text>
                                                                    :
                                                                    null
                                                            }
                                                        </View>

                                                        {/*VEHICLE BRAND*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.mTop15]}>
                                                                <View
                                                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                <Text
                                                                    style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                    Brand</Text>
                                                            </View>
                                                            <View
                                                                style={[Styles.bw1, Styles.bcAsh, Styles.padV5, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.mRt30, Styles.mLt40,]}>
                                                                <Picker
                                                                    itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                                                    selectedValue={this.state.VehicleBrand}
                                                                    mode='dropdown'
                                                                    onValueChange={(itemValue, itemIndex) => this.setState({VehicleBrand: itemValue})}
                                                                >
                                                                    {this.state.vehicleBrand.map((item, index) => {
                                                                        return (< Picker.Item
                                                                            label={item.label}
                                                                            value={item.value}
                                                                            key={index}/>);
                                                                    })}
                                                                </Picker>
                                                            </View>
                                                        </View>

                                                        {/*VEHICLE Variant*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.mTop15]}>
                                                                <View
                                                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                <Text
                                                                    style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                    Variant</Text>
                                                            </View>
                                                            <View
                                                                style={[Styles.bw1, Styles.bcAsh, Styles.padV5, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.mRt30, Styles.mLt40,]}>
                                                                <Picker
                                                                    itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                                                    selectedValue={this.state.variant}
                                                                    mode='dropdown'
                                                                    onValueChange={(itemValue, itemIndex) => this.setState({variant: itemValue})}
                                                                >
                                                                    {this.state.variantsList.map((item, index) => {
                                                                        return (< Picker.Item
                                                                            label={item.label}
                                                                            value={item.value}
                                                                            key={index}/>);
                                                                    })}
                                                                </Picker>
                                                            </View>
                                                        </View>

                                                        {/*VEHICLE MODAL*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.mTop15]}>
                                                                <View
                                                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                <Text
                                                                    style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                    Model{Services.returnRedStart()}</Text>
                                                            </View>
                                                            <View
                                                                style={[Styles.bw1, Styles.bcAsh, Styles.padV5, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.mRt30, Styles.mLt40,]}>
                                                                <Picker
                                                                    itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                                                    selectedValue={this.state.VehicleModalName}
                                                                    mode='dropdown'
                                                                    onValueChange={(itemValue, itemIndex) => this.setState({VehicleModalName: itemValue}, () => {
                                                                        this.validateVehicleNum('')
                                                                    })}>
                                                                    {
                                                                        this.state.VehicleType === '4' || this.state.VehicleType === '3'
                                                                            ?
                                                                            this.state.fourVehicleModalList.map((item, index) => {
                                                                                return (
                                                                                    < Picker.Item label={item.label}
                                                                                                  value={item.value}
                                                                                                  key={index}/>);
                                                                            })
                                                                            :
                                                                            this.state.twoVehicleModalList.map((item, index) => {
                                                                                return (
                                                                                    < Picker.Item label={item.label}
                                                                                                  value={item.value}
                                                                                                  key={index}/>);
                                                                            })
                                                                    }
                                                                </Picker>
                                                            </View>
                                                            {
                                                                this.state.errorVehicleModalMessage ?
                                                                    <Text style={{
                                                                        color: 'red',
                                                                        fontFamily: 'Muli-Regular',
                                                                        paddingLeft: 20, marginBottom: 5
                                                                    }}>{this.state.errorVehicleModalMessage}</Text>
                                                                    :
                                                                    null
                                                            }
                                                        </View>

                                                        {/*VEHICLE TONNAGE*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.mTop15]}>
                                                                <View
                                                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleIconVoilet}</View>
                                                                <Text
                                                                    style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                    Tonnage</Text>
                                                            </View>
                                                            <View
                                                                style={[Styles.bw1, Styles.bcAsh, Styles.padV5, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.mRt30, Styles.mLt40,]}>
                                                                <Picker
                                                                    itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                                                    selectedValue={this.state.VehicleTonnage}
                                                                    mode='dropdown'
                                                                    onValueChange={(itemValue, itemIndex) => this.setState({VehicleTonnage: itemValue})}
                                                                >
                                                                    {this.state.tonnageList.map((item, index) => {
                                                                        return (< Picker.Item
                                                                            label={item.label}
                                                                            value={item.value}
                                                                            key={index}/>);
                                                                    })}
                                                                </Picker>
                                                            </View>
                                                        </View>

                                                        {/*VEHICLE CLASS*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.mTop15]}>
                                                                <View
                                                                    style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.vehicleNew}</View>
                                                                <Text
                                                                    style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Vehicle
                                                                    Class</Text>
                                                            </View>
                                                            <View
                                                                style={[Styles.row, Styles.mRt30, Styles.mLt40, Styles.flexWrap]}>
                                                                {this.state.vehicleClassList.map(chipsList => {
                                                                    return (
                                                                        <Chip key={chipsList.key}
                                                                              style={[Styles.m5, Styles.bw1, Styles.bcAsh, Styles.br15,
                                                                                  this.state.VehicleClass === chipsList.value ? Styles.bgRed : Styles.bgWhite]}
                                                                              textStyle={[Styles.f16, Styles.ffMextrabold, this.state.VehicleClass === chipsList.value ? Styles.cWhite : Styles.colorBlue,]}
                                                                              onPress={() => {
                                                                                  this.setState({VehicleClass: chipsList.value})
                                                                              }}>{chipsList.label}</Chip>
                                                                    );
                                                                })}
                                                            </View>
                                                        </View>

                                                        {/*Upload VEHICLE_RC FRONT SIDE PIC*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                                <View
                                                                    style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        // this.vehicleInformationImageUpload('VEHICLE_RC')
                                                                        this.setState({imageType:'VEHICLE_RC',imageSelectionModal:true})
                                                                    }}
                                                                    style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                    <Text
                                                                        style={[Styles.ffMregular, Styles.colorBlue,
                                                                            Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                        Vehicle RC Front Side
                                                                        Photo{Services.returnRedStart()}</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                            {
                                                                ImagesArray[1].VehicleRcPic === ''
                                                                    ?
                                                                    null
                                                                    :
                                                                    <View
                                                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                        <TouchableOpacity
                                                                            style={[Styles.row, Styles.aslCenter]}
                                                                            onPress={() => {
                                                                                this.setState({
                                                                                    imagePreview: true,
                                                                                    imagePreviewURL: ImagesArray[1].VehicleRcPic ? ImagesArray[1].VehicleRcPic : ''
                                                                                })
                                                                            }}>
                                                                        <Image
                                                                            onLoadStart={() => this.setState({VehicleRcPic: true})}
                                                                            onLoadEnd={() => this.setState({VehicleRcPic: false})}
                                                                            style={[{
                                                                                width: Dimensions.get('window').width / 2,
                                                                                height: 120
                                                                            }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                            source={ImagesArray[1].VehicleRcPic ? {uri: ImagesArray[1].VehicleRcPic} : null}
                                                                        />
                                                                            <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                                        </TouchableOpacity>
                                                                        <ActivityIndicator
                                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                                            animating={this.state.VehicleRcPic}
                                                                        />
                                                                    </View>
                                                            }
                                                        </View>

                                                        {/*Upload VEHICLE_RC BACK SIDE PIC*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                                <View
                                                                    style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        // this.vehicleInformationImageUpload('VEHICLE_RC_BACK')
                                                                        this.setState({imageType:'VEHICLE_RC_BACK',imageSelectionModal:true})
                                                                    }}
                                                                    style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                    <Text
                                                                        style={[Styles.ffMregular, Styles.colorBlue,
                                                                            Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                        Vehicle RC Back Side
                                                                        Photo{Services.returnRedStart()}</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                            {
                                                                ImagesArray[4].VehicleRcBackPic === ''
                                                                    ?
                                                                    null
                                                                    :
                                                                    <View
                                                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                        <TouchableOpacity
                                                                            style={[Styles.row, Styles.aslCenter]}
                                                                            onPress={() => {
                                                                                this.setState({
                                                                                    imagePreview: true,
                                                                                    imagePreviewURL: ImagesArray[4].VehicleRcBackPic ? ImagesArray[4].VehicleRcBackPic  : ''
                                                                                })
                                                                            }}>
                                                                        <Image
                                                                            onLoadStart={() => this.setState({VehicleRcBackPic: true})}
                                                                            onLoadEnd={() => this.setState({VehicleRcBackPic: false})}
                                                                            style={[{
                                                                                width: Dimensions.get('window').width / 2,
                                                                                height: 120
                                                                            }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                            source={ImagesArray[4].VehicleRcBackPic ? {uri: ImagesArray[4].VehicleRcBackPic} : null}
                                                                        />
                                                                            <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                                        </TouchableOpacity>
                                                                        <ActivityIndicator
                                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                                            animating={this.state.VehicleRcBackPic}
                                                                        />
                                                                    </View>
                                                            }
                                                        </View>

                                                        {/*Upload FRONT PIC*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                                <View
                                                                    style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        // this.vehicleInformationImageUpload('VEHICLE_FRONT_NUMBER_PLATE')
                                                                        this.setState({imageType:'VEHICLE_FRONT_NUMBER_PLATE',imageSelectionModal:true})
                                                                    }}
                                                                    style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                    <Text
                                                                        style={[Styles.ffMregular, Styles.colorBlue,
                                                                            Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                        Vehicle Front
                                                                        Photo{Services.returnRedStart()}</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                            {
                                                                ImagesArray[5].VehicleFrontNumberPlatePic === ''
                                                                    ?
                                                                    null
                                                                    :
                                                                    <View
                                                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                        <TouchableOpacity
                                                                            style={[Styles.row, Styles.aslCenter]}
                                                                            onPress={() => {
                                                                                this.setState({
                                                                                    imagePreview: true,
                                                                                    imagePreviewURL: ImagesArray[5].VehicleFrontNumberPlatePic  ? ImagesArray[5].VehicleFrontNumberPlatePic   : ''
                                                                                })
                                                                            }}>
                                                                            <Image
                                                                            onLoadStart={() => this.setState({VehicleFrontNumberPlatePic: true})}
                                                                            onLoadEnd={() => this.setState({VehicleFrontNumberPlatePic: false})}
                                                                            style={[{
                                                                                width: Dimensions.get('window').width / 2,
                                                                                height: 120
                                                                            }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                            source={ImagesArray[5].VehicleFrontNumberPlatePic ? {uri: ImagesArray[5].VehicleFrontNumberPlatePic} : null}
                                                                        />
                                                                            <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                                        </TouchableOpacity>
                                                                        <ActivityIndicator
                                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                                            animating={this.state.VehicleFrontNumberPlatePic}
                                                                        />
                                                                    </View>
                                                            }
                                                        </View>


                                                    </View>
                                                    :
                                                    null
                                    }


                                </ScrollView>

                                {
                                    this.state.mandatoryChecks === false
                                        ?
                                        <Text style={[Styles.cRed, Styles.ffMbold, {
                                            paddingLeft: 30, marginBottom: 5
                                        }]}>* Fill Mandatory Fields</Text>
                                        :
                                        null
                                }

                                <TouchableOpacity
                                    onPress={() => {
                                        this.validateVehicleNum('onClickSave')
                                    }}
                                    style={[Styles.defaultbgColor, Styles.p10, Styles.m3, Styles.br10]}>
                                    <Text
                                        style={[Styles.aslCenter, Styles.cWhite, Styles.padV5, Styles.ffMbold, Styles.f16]}>ADD
                                        VEHICLE</Text>
                                </TouchableOpacity>


                            </View>
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
                            style={[Styles.bgWhite, Styles.aslCenter, Styles.p10,  {width: Dimensions.get('window').width - 80}]}>

                            <View style={[Styles.p10]}>
                                <Text style={[Styles.f22,Styles.cBlk,Styles.txtAlignCen,Styles.ffLBlack,Styles.pBtm10]}>Add Image</Text>
                                <View style={[Styles.marV15]}>
                                    <TouchableOpacity
                                        onPress={()=>{this.setState({imageSelectionModal:false},()=>{
                                            this.vehicleInformationImageUpload('CAMERA')
                                        })}}
                                        activeOpacity={0.7} style={[Styles.marV10,Styles.row,Styles.aitCenter]}>
                                        <FontAwesome name="camera" size={24} color="black" />
                                        <Text style={[Styles.f20,Styles.cBlk,Styles.ffLBold,Styles.padH10]}>Take Photo</Text>
                                    </TouchableOpacity>
                                    <Text style={[Styles.ffLBlack,Styles.brdrBtm1,Styles.mBtm15]}/>
                                    <TouchableOpacity
                                        onPress={()=>{this.setState({imageSelectionModal:false},()=>{
                                            this.vehicleInformationImageUpload('LIBRARY')
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
}

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
    }
});
