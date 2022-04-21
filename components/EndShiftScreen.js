import React, {Component} from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Dimensions,
    TouchableOpacity,
    FlatList,
    ScrollView,
    Linking,
    BackHandler,
    Modal,
    ActivityIndicator,
    Button,
    NativeModules,
    Alert,
    PermissionsAndroid,
    TextInput as Input,
    Keyboard, KeyboardAvoidingView, Vibration, Image
} from "react-native";
import {
    Appbar, Card, DefaultTheme, Title, ProgressBar, RadioButton, Searchbar
} from "react-native-paper";
import {Styles, CText, CSpinner, SupervisorsModal, LoadImages, CDismissButton, LoadSVG} from "./common";
import Utils from './common/Utils';
import Config from "./common/Config"
import Services from "./common/Services";
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/dist/FontAwesome';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import AsyncStorage from "@react-native-community/async-storage";
import FastImage from 'react-native-fast-image'
// import SwipeButton from "rn-swipe-button";
import HomeNoticeScreen from './common/HomeNoticeScreen';
import Geolocation from "react-native-geolocation-service";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import ImageZoom from "react-native-image-pan-zoom";
import state from "@react-native-community/netinfo/src/internal/state";
import _ from "lodash";

let LocationService = NativeModules.LocationService;


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
};

export default class EndShiftScreen extends Component {

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
        this.didFocus = props.navigation.addListener('didFocus', payload =>
            BackHandler.addEventListener('hardwareBackPress', this.onBack)
        );
        // Services.checkGPSpermissions()
        this.state = {
            spinnerBool: false,
            SupervisorDetails: '',
            CurrentShiftId: '',
            refreshing: false,
            ModalSupervisorVisible: false,
            kilometer: '',
            EndShiftDetails: '',
            listOfPackages: [],
            KMreading: '0',
            PackagesDisplay: true,
            UserFlow: '',
            PackagesTypeNULL: false,
            ModalWareHouse: false,
            ModalonDutyDelivery: false,
            defaultOdometer: false,
            packagesCount: '0',
            currentUserId: '',
            ModalOpenAppURL: false,
            showPackageStatuesModal: false,
            selectedPackageStatusList: [],
            finalSum: 0,
            currentLocation: [],
            // latitude: null,
            // longitude: null,
            GPSasked: false,
            swipeActivated: false,
            errorSupervisorsReason: null,
            supervisorsReason: '',
            route: '',
            imagePreview: false, imagePreviewURL: '',imageRotate:'0',
            tollImageUrl:'',tollImageFormData:'',tollExpensesModal:false,tollAmount:'0',
            adhocAmount:'',durationWarningModal:false,checkOdometerReading:false,
            odometerImageURL:'',odometerImageFormData:'',
            liteUserShiftSummaryModal:false,imageSelectionModal:false,

            searchPhoneNumber:'',searchPhoneNumberOthers:false,
        };
    }

    componentDidMount() {
        this.willBlur = this.props.navigation.addListener('willBlur', payload =>
            BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        );
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
            this.requestLocationPermission();
            self.setState({
                CurrentShiftId: self.props.navigation.state.params.CurrentShiftId,
                UserFlow: self.props.navigation.state.params.UserFlow,
            })
            self.EndShiftDetails(self.props.navigation.state.params.UserFlow);
        });
    }

    onBack = () => {
        if (this.state.UserFlow === "SITE_ADMIN"|| this.state.UserFlow === 'ADMIN_ADHOC_FLOW') {
            return this.props.navigation.navigate('TeamListingScreen');
        }else if (this.state.UserFlow === "NORMAL_ADHOC_FLOW") {
            return this.props.navigation.navigate('CreateNonRegisteredAdhocShift');
        } else {
            return this.props.navigation.navigate('HomeScreen');
        }
    };


    componentWillUnmount() {
        this.didFocus.remove();
        this.willBlur.remove();
        BackHandler.removeEventListener('hardwareBackPress', this.onBack);
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
        // console.log("end shift error", error, error.response);
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


//API CALL to get END SHIFT DETAILS
    EndShiftDetails(UserFlow) {
        const self = this;
        const CurrentShiftId = self.props.navigation.state.params.CurrentShiftId;
        const currentUserId = self.props.navigation.state.params.currentUserId;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_STARTSHIFT_DETAILS + '?shiftId=' + CurrentShiftId + '&userId=' + currentUserId;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, function (response) {
                if (response.status === 200) {
                    if (response.data != null) {
                        // console.log('end shift screen resp200', response.data);
                        let EndShiftDetails = response.data;
                        let supervisorList = [];
                        if (EndShiftDetails.siteSupervisorsList) {
                            supervisorList = EndShiftDetails.siteSupervisorsList;
                        }
                        self.setState({
                            checkOdometerReading: EndShiftDetails.checkOdometerReading,
                            adhocShiftAmountPaid: EndShiftDetails.adhocShiftAmountPaid ? JSON.stringify(EndShiftDetails.adhocShiftAmountPaid):'',
                            adhocAmount: EndShiftDetails.adhocShiftAmountPaid ? JSON.stringify(EndShiftDetails.adhocShiftAmountPaid):'',
                            EndShiftDetails: EndShiftDetails,
                            SupervisorDetails: supervisorList,
                            route: EndShiftDetails.route,
                            tripSheetId: EndShiftDetails.tripSheetId,
                            partnerDetails: EndShiftDetails.partnerDetails,
                            refreshing: false,
                            spinnerBool: false,
                            cashCollected: '0',
                        },()=>{
                            if (EndShiftDetails.requireClientLoginId){
                                self.setState({searchPhoneNumber:EndShiftDetails.clientLoginIdMobileNumber,searchPhoneNumberOthers:EndShiftDetails.others,},()=>{
                                    self.getEnteredPhoneNumberProfiles(EndShiftDetails.clientLoginIdMobileNumber)
                                })
                            }
                        });

                        if (UserFlow === "SITE_ADMIN") {
                            self.setState({SupervisorEnteredReason: false})
                        } else {
                            // if (self.state.UserFlow === "NORMAL_ADHOC_FLOW"|| self.state.UserFlow === 'ADMIN_ADHOC_FLOW'){
                            //     self.setState({SupervisorEnteredReason: true,supervisorsReason:'Adhoc Shift ending'})
                            // }else {
                                self.setState({SupervisorEnteredReason: true})
                            // }

                        }


                        if (EndShiftDetails.userRole === 1 || EndShiftDetails.userRole === 10) {
                            if (EndShiftDetails.pickUpPackagesInfo != null) {
                                if (EndShiftDetails.pickUpPackagesInfo.length > 0) {
                                    let PackagesList = EndShiftDetails.pickUpPackagesInfo;
                                    const packagesInfo = [];
                                    for (let i = 0; i < PackagesList.length; i++) {
                                        let sample = {};
                                        sample.value = JSON.stringify(PackagesList[i].count);
                                        sample.packageTypeImageUpload = PackagesList[i].packageTypeImageUpload;
                                        sample.displayName = PackagesList[i].displayName;
                                        sample.includeInPackageCount = PackagesList[i].includeInPackageCount;
                                        sample.packageTypeId = PackagesList[i].packageTypeId;
                                        sample.type = PackagesList[i].type;
                                        sample.maximumValue = PackagesList[i].count;
                                        sample.minimumValue = PackagesList[i].minimumValue;
                                        sample.statuses = PackagesList[i].statuses;
                                        sample.statusTotalCount = 0;
                                        packagesInfo.push(sample);
                                    }
                                    self.setState({listOfPackages: packagesInfo, spinnerBool: false});
                                }
                            } else {
                                self.setState({listOfPackages: [], spinnerBool: false});
                            }
                        }
                        self.checkPackagesStatus();
                        if (EndShiftDetails.userRole === 5 || EndShiftDetails.userRole === 10) {
                            self.setState({KMreading: JSON.stringify(self.state.EndShiftDetails.startOdometerReading)})
                        }
                    } else {
                        Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
                        self.setState({EndShiftDetails: [], spinnerBool: false});
                    }
                }
            }, function (error) {
                self.errorHandling(error)
            })
        });
    }


//For Shift In Progress
    ShiftDuration(item) {
        const timeStart = new Date(item.actualStartTime).getTime()
        let timeEnd = new Date().getTime();
        let hourDiff = timeEnd - timeStart; //in ms
        let secDiff = hourDiff / 1000; //in s
        let minDiff = hourDiff / 60 / 1000; //in minutes
        let hDiff = hourDiff / 3600 / 1000; //in hours
        let humanReadable = {};
        humanReadable.hours = Math.floor(hDiff);
        humanReadable.minutes = Math.floor(minDiff - 60 * humanReadable.hours);
        return (
            <Text
                style={[Styles.ffMbold, Styles.f16]}> ({humanReadable.hours === 0 && humanReadable.minutes === 0 ? '0 m' : humanReadable.hours === 0 ? null : humanReadable.hours + 'h '}{humanReadable.minutes === 0 ? null : humanReadable.minutes + 'm'} ago)</Text>
        )
    }

//Odometer reading validate
    odometerReading(KMreading) {
        let value = Math.trunc(parseInt(KMreading));
        const updatedKMreading = JSON.stringify(value);

        let num = updatedKMreading.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');

        if (num > this.state.EndShiftDetails.startOdometerReading) {
            this.setState({defaultOdometer: true, KMreading: num})
        } else {
            this.setState({defaultOdometer: false, KMreading: num})
        }
    }

    onRefresh() {
        //Clear old data of the list
        this.setState({dataSource: []});
        //Call the Service to get the latest data
        this.EndShiftDetails();
    }


//calls for increment,decrement,changes odometer status on button
    OdometerReadingValidate(item, operator) {
        if (item === '') {
            item = 0;
            this.setState({KMreading: JSON.stringify(item), defaultOdometer: false});
        } else {
            let value = Math.trunc(parseInt(item));
            if (operator === 'Increment') {
                if (value >= 999999) {
                    const tempValue = 999999;
                    this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: true});
                    Utils.dialogBox('Reached Maximum Value', '');
                } else {
                    const tempValue = value + 1;
                    this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: true},);
                }
            } else if (operator === 'Decrement') {
                if (value <= this.state.EndShiftDetails.startOdometerReading) {
                    // const tempValue = this.state.EndShiftDetails.startOdometerReading;
                    this.setState({KMreading: JSON.stringify(value), defaultOdometer: false});
                    // Utils.dialogBox('Reached Minimum Value', '');
                } else if (value > 999999) {
                    const tempValue = 999999 - 1;
                    this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: true});
                    Utils.dialogBox('Reached Maximum Value', '');
                } else {
                    const tempValue = value - 1;
                    if (tempValue === this.state.EndShiftDetails.startOdometerReading) {
                        this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: false})
                    } else {
                        this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: true});
                    }
                }
            }
        }
    }


    //cashCollected validate
    CashCollectedValidate(cash) {
        cash = cash.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');

        if (cash > 300000) {
            this.setState({cashCollected: '300000'})
            Utils.dialogBox('Maximum Value is 300000', '');
        } else if (cash < 0) {
            this.setState({cashCollected: '0'})
            // Utils.dialogBox('Minimum Value is 0', '');
        } else {
            this.setState({cashCollected: cash})
        }
    }

    //tollAmount validate
    tollAmountValidate(cash) {
        cash = cash.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');

        if (cash > 300000) {
            this.setState({cashCollected: '300000'})
            Utils.dialogBox('Maximum Value is 300000', '');
        } else if (cash < 0) {
            this.setState({tollAmount: '0'})
            // Utils.dialogBox('Minimum Value is 0', '');
        } else {
            this.setState({tollAmount: cash})
        }
    }


    ValidateShiftEnd() {
        const {EndShiftDetails,latitude,longitude} = this.state;

            let textInputs = this.state.listOfPackages;
            let deliveredPackagesInfo = [];
            if(EndShiftDetails.userRole === 1 || EndShiftDetails.userRole === 10){
                for (let i = 0; i < textInputs.length; i++) {
                    let sample = {};
                    sample.type = textInputs[i].displayName;
                    sample.packageTypeId = textInputs[i].packageTypeId;
                    sample.includeInPackageCount = textInputs[i].includeInPackageCount;
                    sample.displayName = textInputs[i].displayName;
                    sample.type = textInputs[i].type;
                    sample.maximumValue = textInputs[i].maximumValue;
                    sample.minimumValue = textInputs[i].minimumValue;
                    sample.statuses = textInputs[i].statuses;
                    sample.count = parseInt(textInputs[i].value);
                    deliveredPackagesInfo.push(sample);
                }
            }

            let tempBody = {}
            {
                EndShiftDetails.userRole === 10
                    ?
                    tempBody = {
                        'deliveredPackagesInfo': deliveredPackagesInfo,
                        'endOdometerReading': this.state.KMreading,
                        'cashCollected': this.state.cashCollected,
                        "shiftEndedLocation": {"latitude": latitude, "longitude": longitude},
                        reasonToEndShift: this.state.supervisorsReason,
                        'route': this.state.route,
                        'tripSheetId': this.state.tripSheetId,
                        'partnerDetails': this.state.partnerDetails,
                        'others':this.state.searchPhoneNumberOthers,
                        'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                }
                    :
                    EndShiftDetails.userRole === 5
                        ?
                        tempBody = {
                            'endOdometerReading': this.state.KMreading,
                            "shiftEndedLocation": {"latitude": latitude, "longitude": longitude},
                            reasonToEndShift: this.state.supervisorsReason,
                            'route': this.state.route,
                            'tripSheetId': this.state.tripSheetId,
                            'partnerDetails': this.state.partnerDetails,
                            'others':this.state.searchPhoneNumberOthers,
                            'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                        }
                        :
                        EndShiftDetails.userRole === 1
                            ?
                            tempBody = {
                                'deliveredPackagesInfo': deliveredPackagesInfo,
                                'cashCollected': this.state.cashCollected,
                                "shiftEndedLocation": {"latitude": latitude, "longitude": longitude},
                                reasonToEndShift: this.state.supervisorsReason,
                                'route': this.state.route,
                                'tripSheetId': this.state.tripSheetId,
                                'partnerDetails': this.state.partnerDetails,
                                'others':this.state.searchPhoneNumberOthers,
                                'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                            }
                            :
                            EndShiftDetails.userRole >= 15
                                ?
                                tempBody = {
                                    'deliveredPackagesInfo': null,
                                    'cashCollected': null,
                                    'clientUserIdInfo': null,
                                    "shiftEndedLocation": {"latitude": latitude, "longitude": longitude},
                                    reasonToEndShift: this.state.supervisorsReason,
                                    'route': this.state.route,
                                    'tripSheetId': this.state.tripSheetId,
                                    'partnerDetails': this.state.partnerDetails,
                                    'others':this.state.searchPhoneNumberOthers,
                                    'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                                }
                                :
                                null
            }
            if (this.state.UserFlow === 'NORMAL_ADHOC_FLOW' || this.state.UserFlow === 'ADMIN_ADHOC_FLOW'){
                if (this.state.adhocShiftAmountPaid){
                    tempBody.adhocShiftAmountPaid=this.state.adhocAmount
                }
            }
            let body = JSON.stringify(tempBody)
            this.ReadingsCountEND(body);
    }

    async stopLocation() {
        await LocationService.stopLocation((err) => {
            console.log(err)
        }, (msg) => {
            AsyncStorage.removeItem('Whizzard:shiftId');
        });
    }

    //API CALL to ENDSHIFT
    ReadingsCountEND = (body) => {
        const self = this;
        let apiURL;
        if (self.state.UserFlow === 'SITE_ADMIN' || self.state.UserFlow === 'NORMAL_ADHOC_FLOW' || this.state.UserFlow === 'ADMIN_ADHOC_FLOW') {
            apiURL = Config.routes.BASE_URL + Config.routes.END_SHIFT_BY_SUPERVISOR + this.state.CurrentShiftId;
        } else {
            apiURL = Config.routes.BASE_URL + Config.routes.END_SHIFT + this.state.CurrentShiftId;
        }
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, function (response) {
                if (response.status === 200) {
                    Vibration.vibrate()
                    let ReadingsCount = response.data;
                    self.stopLocation()

                    AsyncStorage.removeItem("Whizzard:currentShiftStatus");
                    AsyncStorage.removeItem("Whizzard:shiftId");
                    self.setState({spinnerBool: false,durationWarningModal: false,liteUserShiftSummaryModal:false}, () => {
                        self.props.navigation.navigate('Summary', {
                            AttendenceResponse: ReadingsCount,
                            UserFlow: self.state.UserFlow,
                            SupervisorDetails: self.state.SupervisorDetails
                        })
                    })
                }
            }, function (error) {
                // console.log('end shift errror', error, error.response, error.response.data);
                if (error.response) {
                   if (error.response.status === 500) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox(error.response.data.message, '');
                        {
                            self.state.UserFlow === 'SITE_ADMIN'
                                ?
                                self.onBack()
                                :
                                null
                        }
                    }else {
                       self.errorHandling(error)
                   }
                } else {
                    self.errorHandling(error)
                }
            })
        });
    };

    calculateOdometerDayReadings() {
        if (this.state.KMreading - this.state.EndShiftDetails.startOdometerReading <= 999) {
            return (
                <View style={[Styles.row, Styles.p5, Styles.aslCenter,]}>
                    <Text style={[Styles.aslCenter, Styles.f18, Styles.ffMbold,
                        {color: this.state.KMreading - this.state.EndShiftDetails.startOdometerReading <= 0 ? 'red' : "#000"}]}>
                        {this.state.KMreading - this.state.EndShiftDetails.startOdometerReading} kms </Text>
                    <Text style={[Styles.padH2, Styles.aslCenter, Styles.ffMregular,]}>for today's shift</Text>
                </View>
            )
        } else {
            Utils.dialogBox('reading difference should be less than 1000', '')
            return (
                <Text style={[Styles.p5, Styles.aslCenter, Styles.ffMregular, Styles.cRed]}> reading difference should
                    be less than 1000</Text>
            )
        }
    }


    validatingLocation() {
         if (this.state.longitude && this.state.latitude) {
            if (this.state.swipeActivated) {
                if (this.state.UserFlow === 'NORMAL_ADHOC_FLOW' || this.state.UserFlow === 'ADMIN_ADHOC_FLOW') {
                    this.setState({liteUserShiftSummaryModal:true})
                } else {
                    let tempMinutes = Services.returnCalculatedShiftDuration(this.state.EndShiftDetails.actualStartTime)
                    if (tempMinutes < 120) {
                        this.setState({durationWarningModal: true})
                    } else {
                        this.ValidateShiftEnd()
                    }
                }
            }
        } else {
            Alert.alert('', 'Your Location data is missing,Please check your Location Settings',
                [{
                    text: 'enable', onPress: () => {
                        this.requestLocationPermission();
                    }
                }]);
        }
    }


     requestLocationPermission = async()=> {
        // this.getCurrentLocation()
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                await Geolocation.getCurrentPosition(
                    (position) => {
                        const currentLocation = position.coords;
                        this.setState({
                            currentLocation: currentLocation,
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                        }, function () {
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
                        } else {
                            Utils.dialogBox(error.message, '')
                            this.props.navigation.goBack()
                        }
                    },
                    {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
                );
            } else {
                Utils.dialogBox('Location permission denied', '');
                this.props.navigation.goBack();
            }
        } catch (err) {
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


    swipeButtonEndShift(statusCheck) {
        return (
            <TouchableOpacity onPress={() => {
                let resp;
                {
                    this.state.UserFlow === 'NORMAL_ADHOC_FLOW' || this.state.UserFlow === 'ADMIN_ADHOC_FLOW'
                        ?
                        this.state.adhocShiftAmountPaid
                        ?
                        resp = Utils.isValidAmountCheck(this.state.adhocAmount, 'Adhoc Amount')
                            :
                            resp = Utils.isValueSelected(true, 'Adhoc Amount')
                        :
                        resp = Utils.isValueSelected(true, 'Adhoc Amount')
                }
                if (resp.status === true) {
                    {
                        this.state.checkOdometerReading
                            ?
                            resp = Utils.isValueSelected(this.state.odometerImageURL, 'Please Upload Odometer Readings Pic')
                            :
                            resp = Utils.isValueSelected(true, 'Please Upload Odometer Readings Pic')
                    }
                    if (resp.status === true) {
                    Alert.alert('Are you sure you want to end the shift?', alert,
                        [{text: 'Cancel'}, {
                            text: 'OK', onPress: () => {
                                Services.returnCurrentPosition((position)=>{
                                    this.setState({
                                        currentLocation: position,
                                        latitude: position.latitude,
                                        longitude: position.longitude,
                                        swipeActivated:true
                                    },()=>{this.validatingLocation()})
                                })
                                // this.setState({swipeActivated: true}, () => {
                                //     this.validatingLocation()
                                // })
                            }
                        }]
                    )
                } else {
                    Utils.dialogBox(resp.message, '');
                }
                } else {
                    Utils.dialogBox(resp.message, '');
                }
            }
            }
                              style={[Styles.br5, {backgroundColor: statusCheck ? '#b2beb5' : '#db2b30'}]}
                              activeOpacity={0.7}
                              disabled={statusCheck}>
                <Text style={[Styles.cWhite, Styles.f20, Styles.p10, Styles.aslCenter, Styles.ffMregular]}>END
                    SHIFT</Text>
            </TouchableOpacity>
        )
    }


    PackagesIncrement(item, index) {
        let value = Math.trunc(parseInt(item.count));
        let TargetValue = Math.trunc(parseInt(this.state.TargetValue));
        if (value > TargetValue - 1) {
            Utils.dialogBox('Maximum value is ' + TargetValue, '');
        } else {
            let tempItem = item;
            tempItem.count = (Math.trunc(Number(tempItem.count) + 1));
            let tempData = [];
            for (let i in this.state.selectedPackageStatusList) {
                if (i === index) {
                    tempData.push(tempItem);
                } else {
                    tempData.push(this.state.selectedPackageStatusList[i])
                }
            }
            // this.setState({selectedPackageStatusList: tempData});
            this.packagesTotalCount(tempData);
        }
    }


    PackagesDecrement(item, index) {
        if (item.count === '') {
            Utils.dialogBox('Please enter a value', '');
        } else {
            let value = Math.trunc(parseInt(item.count));
            if (value < 1) {
                Utils.dialogBox('Minimum value is 0', '');
            } else {
                let tempItem = item;
                tempItem.count = (Math.trunc(Number(tempItem.count) - 1));
                let tempData = [];
                for (let i in this.state.selectedPackageStatusList) {
                    if (i === index) {
                        tempData.push(tempItem);
                    } else {
                        tempData.push(this.state.selectedPackageStatusList[i])
                    }
                }
                // this.setState({selectedPackageStatusList: tempData});
                this.packagesTotalCount(tempData);
            }
        }
    }


    //Calls 3Times,fun Used for packages status on button by calculating packages count
    packagesTotalCount(tempData) {
        // var textInputs = this.state.selectedPackageStatusList;
        let textInputs = tempData;
        let TargetValue = this.state.TargetValue;
        let finalTotal = [];
        let PackagesTypeNULL = []
        for (let i = 0; i < textInputs.length; i++) {
            finalTotal.push(parseInt(textInputs[i].count === '' ? 0 : textInputs[i].count));
            if (textInputs[i].count === '') {
                PackagesTypeNULL.push(textInputs[i].status);
             }
        }

        let finalSum = finalTotal.reduce(function (a, b) {
            return a + b;
        }, 0);

        this.setState({finalSum: finalSum})

        if (finalSum >= TargetValue) {
            this.setState({PackageStatusButton: false}, () => {
             })
        } else {
            this.setState({PackageStatusButton: true}, () => {
             })
        }

        if (PackagesTypeNULL.length > 0) {
            this.setState({PackageStatusButton: false})
        } else {
            this.setState({PackageStatusButton: true})
        }

    }


    updatePackagesStatusList(packageData, index) {
         const self = this;
        self.setState({TargetValue: JSON.parse(packageData.value)})
        let finalTotal = [];
        if (packageData.statuses != null) {
            if (packageData.statuses.length > 0) {
                let statusesList = packageData.statuses;
                const packagesInfo = [];
                for (let i = 0; i < statusesList.length; i++) {
                    let sample = {};
                    sample.count = statusesList[i].count;
                    sample.status = statusesList[i].status;
                    sample.primary = statusesList[i].primary;
                    packagesInfo.push(sample);
                    finalTotal.push(parseInt(statusesList[i].count === '' ? 0 : statusesList[i].count));
                }
                 let finalSum = finalTotal.reduce(function (a, b) {
                    return a + b;
                }, 0);
                 self.setState({
                    selectedPackageStatusList: packagesInfo,
                    selectedPackageData: packageData,
                    finalSum: finalSum,
                     showPackageStatuesModal: true
                });
            }
        } else {
             self.setState({
                selectedPackageStatusList: [],
                selectedPackageData: packageData,
                finalSum: 0,
                 showPackageStatuesModal: true,
            });
        }

        this.packagesTotalCount(packageData.statuses)
    }


    //PACKAGES TOTAL SET
    showPackageList(item, index) {
        const {finalSum} = this.state;
        const TargetValue = this.state.TargetValue;
        let fontColors = ['#519a4d', '#BC7642', '#D1E231', '#D6C537'];
        return (
            <ScrollView
                persistentScrollbar={true}>
                <Card style={[styles.shadow, Styles.marV10]}>
                    <Card.Title
                        style={[Styles.p5, Styles.bw1,]}
                        subtitleStyle={themeSubtitle}
                        titleStyle={[Styles.f16, Styles.ffMbold, {color: fontColors[index % fontColors.length]}]}
                        title={this.state.selectedPackageStatusList[index].status}
                        right={() =>
                            <View style={[Styles.row, {paddingRight: 10}]}>
                                <TouchableOpacity
                                    style={[Styles.aslCenter]}
                                    disabled={this.state.selectedPackageStatusList[index].count === 0}
                                    onPress={() => this.PackagesDecrement(item, index)}
                                >
                                    <Text style={[styles.IncrementButton,]}>-</Text></TouchableOpacity>
                                <TextInput
                                    style={[Styles.txtAlignCen, Styles.ffMbold, Styles.f16, {width: 60}]}
                                    selectionColor={"black"}
                                    // maxLength={3}
                                    placeholderTextColor='#666'
                                    keyboardType='numeric'
                                    value={this.state.selectedPackageStatusList[index].count === '' ? this.state.selectedPackageStatusList[index].count : JSON.stringify(this.state.selectedPackageStatusList[index].count)}
                                    onChangeText={(val) => {
                                        let tempItem = this.state.selectedPackageStatusList[index];

                                        if (val > TargetValue) {
                                            Utils.dialogBox('Maximum value is ' + TargetValue, '');
                                        } else if (val < 0) {
                                            // Utils.dialogBox('Minimum value is ' + tempItem.minimumValue, '');
                                        } else {
                                             if (isNaN(val)) {
                                                tempItem.count = val.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');
                                            } else {
                                                tempItem.count = val === '' ? '' : parseInt(val.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, ''));
                                            }

                                            let tempData = [];
                                            for (let i in this.state.selectedPackageStatusList) {
                                                if (i === index) {
                                                    tempData.push(tempItem);
                                                } else {
                                                    tempData.push(this.state.selectedPackageStatusList[i])
                                                }
                                            }
                                            this.packagesTotalCount(tempData);
                                        }
                                    }
                                    }
                                />
                                <TouchableOpacity style={[Styles.aslCenter]}
                                                  disabled={this.state.finalSum >= this.state.TargetValue}
                                                  onPress={() => this.PackagesIncrement(item, index)}>
                                    <Text style={[styles.IncrementButton]}>+</Text></TouchableOpacity>
                            </View>
                        }
                    />
                </Card>
            </ScrollView>
        )
    }

    //based on packageDisplay condition button disable or not
    checkPackagesStatus() {
        let tempData = [];
        for (let i in this.state.listOfPackages) {
            if (JSON.parse(this.state.listOfPackages[i].value) !== this.state.listOfPackages[i].statusTotalCount) {
                tempData.push(false);
            }
        }
         if (tempData.length === 0) {
            this.setState({PackagesDisplay: true})
        } else {
            this.setState({PackagesDisplay: false})
        }
    }

    returnOdometerCard() {
        return (
            <Card style={[Styles.OrdersScreenCardshadow, Styles.mTop20, Styles.bw1, {
                marginBottom: 15,
                borderColor: this.state.KMreading - this.state.EndShiftDetails.startOdometerReading <= 0 ||
                this.state.KMreading - this.state.EndShiftDetails.startOdometerReading > 999 ||
                this.state.KMreading < this.state.EndShiftDetails.startOdometerReading ? 'red' : 'green'
            }]}>
                <View>
                    <Card.Title
                        style={[Styles.p5]}
                        subtitleStyle={themeSubtitle}
                        titleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                        title='KM reading'
                        left={() => <FastImage style={[Styles.img40]}
                                               source={LoadImages.odometer}/>}
                        right={() =>
                            <View style={[Styles.row, {paddingRight: 10}]}>
                                <TouchableOpacity
                                    style={[Styles.aslCenter]}
                                    disabled={this.state.KMreading === '0' || this.state.KMreading <= this.state.EndShiftDetails.startOdometerReading}
                                    onPress={() => this.OdometerReadingValidate(this.state.KMreading, 'Decrement')}
                                >
                                    <Text
                                        style={[styles.IncrementButton, {
                                            borderColor: this.state.KMreading === '0' || this.state.KMreading <= this.state.EndShiftDetails.startOdometerReading ? '#f5f5f5' : '#000',
                                            color: this.state.KMreading === '0' || this.state.KMreading <= this.state.EndShiftDetails.startOdometerReading ? '#f5f5f5' : '#000'
                                        }]}>-</Text></TouchableOpacity>
                                <TextInput
                                    style={[Styles.txtAlignCen, {
                                        width: 80,
                                        fontWeight: 'bold'
                                    }]}
                                    selectionColor={"black"}
                                    maxLength={6}
                                    keyboardType='numeric'
                                    onChangeText={(KMreading) => this.odometerReading(KMreading)}
                                    value={this.state.KMreading}
                                />
                                <TouchableOpacity
                                    style={[Styles.aslCenter]}
                                    disabled={this.state.KMreading === '999999'}
                                    onPress={() => this.OdometerReadingValidate(this.state.KMreading, 'Increment')}
                                >
                                    <Text
                                        style={[styles.IncrementButton, {
                                            borderColor: this.state.KMreading === '999999' ? '#f5f5f5' : '#000',
                                            color: this.state.KMreading === '999999' ? '#f5f5f5' : '#000'
                                        }]}>+</Text></TouchableOpacity>
                            </View>
                        }
                    />
                    <View
                        style={{
                            borderTopWidth: 1,
                            borderTopColor: 'green',
                            textAlign: 'center'
                        }}>
                        {this.calculateOdometerDayReadings()}
                    </View>
                </View>
                {/*ODOMETER READINGS PIC*/}
                {
                    this.state.checkOdometerReading
                        ?
                        <View>
                            <View style={[Styles.row, Styles.aitCenter, Styles.mTop5,]}>
                                <TouchableOpacity
                                    onPress={() => {
                                        // this.selectImage()
                                        // this.setState({imageType:'odometerImage',imageSelectionModal:true})

                                        this.setState({imageType:'odometerImage'},()=>{
                                            this.selectImage('CAMERA')
                                        })
                                    }}
                                    activeOpacity={0.7}
                                    style={[Styles.row, Styles.bgLYellow, Styles.br5, Styles.aslCenter, Styles.p5,]}>
                                    {LoadSVG.cameraPic}
                                    <Text
                                        style={[Styles.f16, this.state.odometerImageURL ? Styles.cDisabled : Styles.colorBlue, Styles.ffLBold, Styles.pRight15]}>Upload
                                        Odometer Pic{Services.returnRedStart()}</Text>
                                </TouchableOpacity>
                                {
                                    this.state.odometerImageURL
                                        ?
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({
                                                    picUploaded: false,
                                                    odometerImageURL: '',
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
                                this.state.odometerImageURL
                                    ?
                                    <View
                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 30,}]}>
                                        <TouchableOpacity
                                            style={[Styles.row, Styles.aslCenter]}
                                            onPress={() => {
                                                this.setState({
                                                    imagePreview: true,
                                                    imagePreviewURL: this.state.odometerImageURL
                                                })
                                            }}>
                                            <Image
                                                onLoadStart={() => this.setState({imageLoading: true})}
                                                onLoadEnd={() => this.setState({imageLoading: false})}
                                                style={[{
                                                    width: Dimensions.get('window').width / 2,
                                                    height: 120
                                                }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                source={this.state.odometerImageURL ? {uri: this.state.odometerImageURL} : null}
                                            />
                                            <MaterialCommunityIcons name="resize" size={24}
                                                                    color="black"/>
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
                        :
                        null
                }
            </Card>
        )
    }


    uploadTollDetails(){
        const self = this;
        let apiURL = Config.routes.BASE_URL + Config.routes.TOLL_EXPENSES + '?&shiftId=' + self.state.CurrentShiftId + '&tollExpense='+self.state.tollAmount;
        const body = self.state.tollImageFormData;
        this.setState({spinnerBool: true}, () => {
            Services.AuthProfileHTTPRequest(apiURL, 'POST', body, function (response) {
                 if (response.status === 200) {
                    self.setState({spinnerBool: false, tollDetailsUpdated: true,tollExpensesModal:false}, () => {
                        Utils.dialogBox("Details updated successfully", '')
                    })
                }
            }, function (error) {
                 self.errorHandling(error)
            });
        });
    }

    selectImage(uploadType) {
        const self = this;
        const type = self.state.imageType;
        Services.checkImageUploadPermissions(uploadType, (response) => {
             let image = response.image
            let formData = response.formData
            let userImageUrl = image.path

            if (type === 'odometerImage'){
                self.setState({
                    spinnerBool: false,
                    odometerImageURL: image.path,
                    odometerImageFormData:formData
                }, () => {
                    self.uploadImage(formData)
                })
            }else {
                self.setState({spinnerBool: false, tollImageUrl:image.path,tollImageFormData:formData}, () => {
                    Utils.dialogBox("Toll Image Uploaded", '')
                })
            }
        })
    }

    uploadImage(formData){
        const self = this;
        let apiURL = Config.routes.BASE_URL + Config.routes.ODOMETER_READINGS_IMAGE + '&shiftId='+ self.state.EndShiftDetails.id + "&name=endOdometerReadingUpload";
        const body = formData;
        self.setState({spinnerBool: true}, () => {
            Services.AuthProfileHTTPRequest(apiURL, 'POST', body, function (response) {
                if (response.status === 200) {
                    self.setState({spinnerBool: false, },()=>{
                        Utils.dialogBox("Image Uploaded", '')
                    })
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

    //API CALL to get profile based on phone number search
    getEnteredPhoneNumberProfiles(searchNumber,) {
        const {usersList, page} = this.state;
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_PROFILES_BASED_ON_PHONE_NUMBER_SEARCH + 'siteCode='+self.state.EndShiftDetails.attrs.siteCode +'&phoneNumber='+searchNumber ;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, function (response) {
                if (response.status === 200) {
                    self.setState({
                        spinnerBool: false,
                        searchPhoneNumber:searchNumber,
                        phoneNumberSearchData:response.data,
                    })
                }
            }, function (error) {
                self.errorHandling(error)
            });
        })
    }


    render() {
        if (this.state.refreshing) {
            return (
                //loading view while data is loading
                <View style={[Styles.flex1, Styles.alignCenter]}>
                    <ActivityIndicator/>
                </View>
            );
        }
        const {checkOdometerReading,EndShiftDetails} =this.state;
        return (
            <View style={[Styles.flex1]}>
                <HomeNoticeScreen/>

                        <View style={[Styles.flex1,Styles.bgWhite]}>
                            {this.renderSpinner()}

                            <Appbar.Header theme={theme} style={[Styles.bgDarkRed]}>
                                <Appbar.BackAction onPress={() => {
                                    this.onBack()
                                }}/>
                                <Appbar.Content theme={theme}
                                                title={EndShiftDetails ? new Date(EndShiftDetails.reportingTime).toDateString():new Date().toDateString()}
                                                subtitle=""/>
                                <Appbar.Action icon="list" size={30} onPress={() => {
                                    this.props.navigation.navigate('OrdersListScreen', {CurrentShiftId: EndShiftDetails.shiftId,selectedChip:''});
                                }}/>
                                <Appbar.Action icon="phone"
                                               onPress={() => this.setState({ModalSupervisorVisible: true})}/>
                                <Appbar.Action icon="autorenew" onPress={() => {
                                    this.EndShiftDetails()
                                }}/>
                            </Appbar.Header>

                            {
                                EndShiftDetails
                                    ?
                                    <View style={[Styles.flex1]}>
                                        {/*ScollView scrolls all Data*/}
                                        <ScrollView
                                            persistentScrollbar={true}
                                            style={[Styles.flex1]}>

                                            {/*SHIFT STATUS IMAGES*/}
                                            <View>
                                                <View style={[Styles.shiftImagePositionAbs]}>
                                                </View>
                                                <View style={[Styles.row, Styles.p15, Styles.jSpaceBet,]}>
                                                    <TouchableOpacity onPress={() => {
                                                        this.setState({ModalWareHouse: true})
                                                    }}>
                                                        <FastImage style={{width: 70, height: 70}}
                                                                   source={LoadImages.siteWareHouse}/>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={[Styles.aslCenter]} onPress={() => {
                                                        this.setState({ModalonDutyDelivery: true})
                                                    }}>
                                                        {
                                                            EndShiftDetails.userRole === 1
                                                                ?
                                                                <FastImage style={[Styles.img70, Styles.p10]}
                                                                           source={LoadImages.activeDA}/>
                                                                :
                                                                EndShiftDetails.userRole === 5
                                                                    ?
                                                                    <FastImage style={[Styles.img70, Styles.p10]}
                                                                               source={LoadImages.activeDriver}/>
                                                                    :
                                                                    EndShiftDetails.userRole === 10
                                                                        ?
                                                                        <FastImage style={[Styles.img70, Styles.p10]}
                                                                                   source={LoadImages.activeDDA}/>
                                                                        :
                                                                        EndShiftDetails.userRole === 15
                                                                            ?
                                                                            <FastImage
                                                                                style={[Styles.img70, Styles.p10]}
                                                                                source={LoadImages.activeLabourer}/>
                                                                            :
                                                                            <FastImage
                                                                                style={[Styles.img70, Styles.p10]}
                                                                                source={LoadImages.activeSupervisor}/>
                                                        }
                                                    </TouchableOpacity>
                                                    <View pointerEvents="none">
                                                        <FastImage style={{width: 70, height: 70}}
                                                                   source={LoadImages.disabledENDPOINT}/>
                                                    </View>
                                                </View>
                                            </View>

                                            {
                                                EndShiftDetails.showOrderDetails
                                                    ?
                                                    <View style={[Styles.marH10, Styles.flex1, {marginTop: 15}]}>
                                                        {
                                                            EndShiftDetails.userRole >= 15 || EndShiftDetails.userRole === 1
                                                                ?
                                                                null
                                                                :
                                                                this.returnOdometerCard()
                                                        }
                                                        {
                                                            //amount collected from orders
                                                            EndShiftDetails.cashOnDelivery > 0 ?
                                                                <Card
                                                                    style={[Styles.ProfileScreenCardshadow, Styles.marH5, Styles.mTop10, {marginBottom: 15}]}>
                                                                    <Card.Title
                                                                        style={[Styles.p5,]}
                                                                        subtitleStyle={themeSubtitle}
                                                                        titleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                                                        title='Cash on Delivery'
                                                                        left={() => <FastImage style={[Styles.img40]}
                                                                                               source={LoadImages.pickup}/>}
                                                                        right={() =>
                                                                            <View
                                                                                style={[Styles.row, Styles.aslCenter, {paddingRight: 10}]}>
                                                                                <Text style={[Styles.txtAlignCen, {
                                                                                    width: 130,
                                                                                    fontWeight: 'bold',
                                                                                    fontSize: 17
                                                                                }]}>{EndShiftDetails.cashOnDelivery}</Text>
                                                                            </View>
                                                                        }
                                                                    />
                                                                </Card>
                                                                : null
                                                        }

                                                        {
                                                            EndShiftDetails.count.length > 0
                                                                ?
                                                                EndShiftDetails.count.map((list, index) => {
                                                                    return (
                                                                        list.count > 0
                                                                            ?
                                                                            <View key={index}>
                                                                                <Card
                                                                                    onPress={() => {
                                                                                        this.props.navigation.navigate('OrdersListScreen', {
                                                                                            CurrentShiftId: this.state.EndShiftDetails.shiftId,
                                                                                            selectedChip: list.status
                                                                                        })
                                                                                    }}
                                                                                    style={[Styles.ProfileScreenCardshadow, Styles.mTop10, Styles.marH5, {marginBottom: 15}]}>
                                                                                    <Card.Title
                                                                                        style={[Styles.p5,]}
                                                                                        subtitleStyle={themeSubtitle}
                                                                                        titleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                                                                        title={Services.getOrderStatus(list.status)}
                                                                                        left={() => <FastImage
                                                                                            style={[Styles.img40]}
                                                                                            source={LoadImages.pickup}/>}
                                                                                        right={() =>
                                                                                            <View
                                                                                                style={[Styles.row, Styles.aslCenter, {paddingRight: 10}]}>
                                                                                                <Text
                                                                                                    style={[Styles.aslCenter, Styles.ffMbold, Styles.f17, Styles.pRight10, {}]}>{list.count}</Text>
                                                                                                <MaterialIcons
                                                                                                    name="chevron-right"
                                                                                                    size={32}/>
                                                                                            </View>
                                                                                        }
                                                                                    />
                                                                                </Card>
                                                                            </View>
                                                                            :
                                                                            null
                                                                    )
                                                                })
                                                                :
                                                                null
                                                        }
                                                    </View>
                                                    :
                                                    null
                                            }

                                            {/*//VIEW CONTAINS CLIENT-USERID,ODOMETER READINGS,PACKAGES*/}
                                            <View style={[Styles.marH10, Styles.flex1]}>

                                                {/*user cominedID VIEW*/}
                                                {
                                                    EndShiftDetails.enteredShiftDataAtStart
                                                        ?
                                                        EndShiftDetails.requireClientLoginId
                                                            ?
                                                            <View>
                                                                <View
                                                                    style={[Styles.bgWhite, Styles.p10, Styles.marH5, Styles.OrdersScreenCardshadow,
                                                                        Styles.bw1, {
                                                                            borderColor: this.state.searchPhoneNumber.length === 10 &&
                                                                            (this.state.phoneNumberSearchData ? this.state.phoneNumberSearchData.existedUser : false)
                                                                                ? 'green' : 'red'
                                                                        }]}>
                                                                    <View>
                                                                        <Text
                                                                            style={[Styles.ffRBold, Styles.f16, Styles.cGrey33, Styles.alignCenter]}>Client
                                                                            Login Id </Text>
                                                                        <RadioButton.Group
                                                                            onValueChange={searchPhoneNumberOthers => this.setState({searchPhoneNumberOthers}, () => {
                                                                                if (searchPhoneNumberOthers === false) {
                                                                                    this.getEnteredPhoneNumberProfiles(EndShiftDetails.phoneNumber)
                                                                                } else {
                                                                                    this.getEnteredPhoneNumberProfiles(EndShiftDetails.clientLoginIdMobileNumber)
                                                                                }
                                                                            })}
                                                                            value={this.state.searchPhoneNumberOthers}>
                                                                            <View
                                                                                style={[Styles.row, Styles.aslCenter,]}>
                                                                                <View
                                                                                    style={[Styles.row, Styles.alignCenter]}>
                                                                                    <RadioButton disabled={true}
                                                                                                 value={false}/>
                                                                                    <Text
                                                                                        style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f16]}>Self</Text>
                                                                                </View>
                                                                                <View
                                                                                    style={[Styles.row, Styles.alignCenter]}>
                                                                                    <RadioButton disabled={true}
                                                                                                 value={true}/>
                                                                                    <Text
                                                                                        style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f16]}>Other</Text>
                                                                                </View>
                                                                            </View>
                                                                        </RadioButton.Group>
                                                                    </View>

                                                                    {
                                                                        this.state.phoneNumberSearchData
                                                                            ?
                                                                            this.state.phoneNumberSearchData.existedUser
                                                                                ?
                                                                                <View>
                                                                                    {Services.returnUserProfileCardShiftScreens(this.state.phoneNumberSearchData, this.state.searchPhoneNumber)}
                                                                                </View>
                                                                                :
                                                                                this.state.phoneNumberSearchData.existedUser === false
                                                                                    ?
                                                                                    <Text
                                                                                        style={[Styles.f16, Styles.ffRBold, Styles.cRed, Styles.padV5, Styles.aslStart]}>User
                                                                                        not in the system,please enter
                                                                                        the registered phone
                                                                                        number</Text>
                                                                                    :
                                                                                    null
                                                                            :
                                                                            null
                                                                    }
                                                                </View>
                                                            </View>
                                                            :
                                                            null
                                                        :
                                                        null
                                                }

                                                {/*ODOMETER READING*/}
                                                {
                                                    !EndShiftDetails.showOrderDetails
                                                        ?
                                                        EndShiftDetails.userRole >= 15 || EndShiftDetails.userRole === 1
                                                            ?
                                                            null
                                                            :
                                                            this.returnOdometerCard()
                                                        :
                                                        null
                                                }

                                                {
                                                    EndShiftDetails.enteredShiftDataAtStart
                                                        ?
                                                        <View style={[Styles.flex1]}>
                                                            {/*CASH COLLECTED*/}
                                                            {
                                                                EndShiftDetails.userRole >= 15 || EndShiftDetails.userRole === 5
                                                                    ?
                                                                    null
                                                                    :
                                                                    <Card style={[styles.shadow, Styles.marV15]}>
                                                                        <Card.Title
                                                                            style={[Styles.p5, Styles.bw1, {borderColor: this.state.cashCollected === '' ? 'red' : 'green'}, Styles.row, Styles.jSpaceBet]}
                                                                            subtitleStyle={themeSubtitle}
                                                                            titleStyle={[Styles.f16, Styles.cBlk, {fontFamily: 'Muli-Bold'}]}
                                                                            title='Cash Collected'
                                                                            left={() => <FontAwesome name="inr"
                                                                                                     size={45}
                                                                                                     color="orange"
                                                                                                     style={{paddingLeft: 5}}/>}
                                                                            right={() =>
                                                                                <View
                                                                                    style={[Styles.row, Styles.aslCenter, {paddingRight: 10}]}>
                                                                                    <TextInput
                                                                                        style={[Styles.txtAlignRt, {
                                                                                            width: 85,
                                                                                            borderBottomWidth: 1,
                                                                                            borderBottomColor: '#ddd',
                                                                                            paddingRight: 5,
                                                                                            fontWeight: 'bold',
                                                                                            fontSize: 18
                                                                                        }]}
                                                                                        selectionColor={"black"}
                                                                                        maxLength={6}
                                                                                        keyboardType='numeric'
                                                                                        onChangeText={(cashCollected) => this.CashCollectedValidate(cashCollected)}
                                                                                        // value={EndShiftDetails.cashOnDelivery ? EndShiftDetails.cashOnDelivery.toFixed(1) : this.state.cashCollected}
                                                                                        value={this.state.cashCollected}
                                                                                        writingDirection={'rtl'}
                                                                                    />
                                                                                </View>
                                                                            }
                                                                        />
                                                                    </Card>

                                                            }

                                                            {/*PACKAGES LIST*/}
                                                            {
                                                                EndShiftDetails.userRole >= 15 || EndShiftDetails.userRole === 5
                                                                    ?
                                                                    null
                                                                    :
                                                                    <ScrollView
                                                                        persistentScrollbar={true}
                                                                        style={[Styles.flex1, Styles.bw1, Styles.bcWhite]}>
                                                                        <Text
                                                                            style={[Styles.colorBlue, Styles.f16, Styles.ffMbold]}>PACKAGES:</Text>
                                                                        {
                                                                            this.state.listOfPackages.length === 0
                                                                                ?
                                                                                <Card.Content
                                                                                    style={[Styles.aslCenter, Styles.padV15, Styles.marH10]}>
                                                                                    <Title
                                                                                        style={[Styles.cBlk, Styles.f20, Styles.ffMregular]}>No
                                                                                        Packages
                                                                                        Assigned,please contact
                                                                                        supervisor</Title>
                                                                                </Card.Content>
                                                                                :
                                                                                <FlatList
                                                                                    style={[Styles.marH10]}
                                                                                    data={this.state.listOfPackages}
                                                                                    renderItem={({item, index}) =>
                                                                                        <View>
                                                                                            {
                                                                                                JSON.parse(item.value) === 0 ?
                                                                                                    null
                                                                                                    :
                                                                                                    <View
                                                                                                        style={[Styles.progressBarPositionAbs]}>
                                                                                                    </View>
                                                                                            }
                                                                                            <Card
                                                                                                style={[styles.shadow, Styles.marV10, Styles.bw1, {borderColor: item.statusTotalCount === JSON.parse(item.value) ? '#fff' : 'red'}]}

                                                                                                onPress={() => JSON.parse(item.value) === 0 ? null : this.updatePackagesStatusList(item, index)}>
                                                                                                <Card.Title
                                                                                                    style={[Styles.p5, Styles.bw1, Styles.bcAsh]}
                                                                                                    subtitleStyle={themeSubtitle}
                                                                                                    titleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                                                                                    title={item.displayName}
                                                                                                    left={() =>
                                                                                                        <FastImage
                                                                                                            style={[Styles.img40]}
                                                                                                            source={LoadImages.pickup}/>}
                                                                                                    right={() =>
                                                                                                        <View>
                                                                                                            <Text
                                                                                                                style={[Styles.ffMbold, Styles.f18, {paddingRight: 10}]}>{item.statusTotalCount}/{item.value}</Text>
                                                                                                        </View>
                                                                                                    }
                                                                                                />
                                                                                            </Card>
                                                                                        </View>}
                                                                                    keyExtractor={(index, item) => JSON.stringify(item) + index}
                                                                                    extraData={this.state}
                                                                                />
                                                                        }
                                                                    </ScrollView>
                                                            }

                                                            {/*Adhoc Amount TEXTINPUT*/}
                                                            {
                                                                this.state.UserFlow === 'NORMAL_ADHOC_FLOW' || this.state.UserFlow === 'ADMIN_ADHOC_FLOW'
                                                                    ?
                                                                    this.state.adhocShiftAmountPaid
                                                                        ?
                                                                        <View
                                                                            style={[Styles.bgWhite,Styles.OrdersScreenCardshadow, Styles.m5]}>
                                                                            <Text
                                                                                style={[Styles.colorBlue, Styles.f16, Styles.ffMbold, Styles.marH10]}>Adhoc
                                                                                Amount{Services.returnRedStart()}</Text>
                                                                            <View
                                                                                style={[Styles.row, Styles.aslCenter]}>
                                                                                <Text
                                                                                    style={[Styles.cOrangered, Styles.aslCenter, Styles.f40, Styles.ffLBold, Styles.mLt10]}>&#x20B9;</Text>
                                                                                <View
                                                                                    style={[Styles.p5, Styles.m10, Styles.bw1, Styles.bcAsh, Styles.flex1]}>
                                                                                    <TextInput
                                                                                        placeholder={'Type here'}
                                                                                        keyboardType={'numeric'}
                                                                                        selectionColor={"black"}
                                                                                        onChangeText={(adhocAmount) => this.setState({adhocAmount: adhocAmount})}
                                                                                        value={this.state.adhocAmount}
                                                                                    />
                                                                                </View>
                                                                            </View>
                                                                        </View>
                                                                        :
                                                                        null
                                                                    :
                                                                    null
                                                            }

                                                            {/*TOLL DETAILS VIEW*/}
                                                            {
                                                                EndShiftDetails.userRole >= 15 || this.state.UserFlow === "NORMAL_ADHOC_FLOW" || this.state.UserFlow === 'ADMIN_ADHOC_FLOW'
                                                                    ?
                                                                    null
                                                                    :
                                                                    <View
                                                                        style={[Styles.row, Styles.aitCenter, Styles.marV10, Styles.padH5]}>
                                                                        <TouchableOpacity
                                                                            onPress={() => {
                                                                                this.setState({tollExpensesModal: true})
                                                                            }}
                                                                            activeOpacity={0.7}
                                                                            style={[Styles.row, Styles.bgLYellow, Styles.br5, Styles.aslCenter, Styles.p5, Styles.OrdersScreenCardshadow]}>
                                                                            {LoadSVG.cameraPic}
                                                                            <Text
                                                                                style={[Styles.f16, Styles.colorBlue, Styles.ffMregular, Styles.pRight15]}>Upload
                                                                                Toll Expenses</Text>
                                                                        </TouchableOpacity>
                                                                        {
                                                                            this.state.tollDetailsUpdated
                                                                                ?
                                                                                <View
                                                                                    style={[Styles.aslCenter, Styles.mLt10]}>
                                                                                    <Text
                                                                                        style={[Styles.f16, Styles.ffMbold, Styles.colorGreen]}>Completed</Text>
                                                                                </View>
                                                                                :
                                                                                null
                                                                        }
                                                                    </View>
                                                            }

                                                            {/*ROUTE TEXTINPUT*/}
                                                            {
                                                                EndShiftDetails.userRole <= 15
                                                                    ?
                                                                    <View
                                                                        style={[Styles.bgWhite,Styles.OrdersScreenCardshadow, Styles.m5]}>
                                                                        <Text
                                                                            style={[Styles.colorBlue, Styles.f16, Styles.ffMbold, Styles.marH10]}>Enter
                                                                            Route </Text>
                                                                        <View
                                                                            style={[Styles.p5, Styles.m10, Styles.bw1,Styles.bcAsh]}>
                                                                            <TextInput
                                                                                placeholder={'Type here'}
                                                                                multiline={true}
                                                                                selectionColor={"black"}
                                                                                onChangeText={(route) => this.setState({route})}
                                                                                value={this.state.route}
                                                                            />
                                                                        </View>
                                                                    </View>
                                                                    :
                                                                    null
                                                            }

                                                            {/*TRIP SHEET ID*/}
                                                            {
                                                                EndShiftDetails.requireTripSheetId
                                                                    ?
                                                                    <View
                                                                        style={[Styles.bgWhite,Styles.OrdersScreenCardshadow, Styles.m5]}>
                                                                        <Text
                                                                            style={[Styles.colorBlue, Styles.f16, Styles.ffMbold, Styles.marH10]}>Enter
                                                                            Tripsheet Id </Text>
                                                                        <View
                                                                            style={[Styles.p5, Styles.m10, Styles.bw1,Styles.bcAsh]}>
                                                                            <TextInput
                                                                                placeholder={'Type here'}
                                                                                multiline={true}
                                                                                selectionColor={"black"}
                                                                                onChangeText={(tripSheetId) => this.setState({tripSheetId})}
                                                                                value={this.state.tripSheetId}
                                                                            />
                                                                        </View>
                                                                    </View>
                                                                    :
                                                                    null
                                                            }

                                                            {/*PARTNER NAME*/}
                                                            {
                                                                EndShiftDetails.requirePartnerDetails
                                                                    ?
                                                                    <View
                                                                        style={[Styles.bgWhite,Styles.OrdersScreenCardshadow, Styles.m5]}>
                                                                        <Text
                                                                            style={[Styles.colorBlue, Styles.f16, Styles.ffMbold, Styles.marH10]}>Enter
                                                                            Partner Name</Text>
                                                                        <View
                                                                            style={[Styles.p5, Styles.m10, Styles.bw1,Styles.bcAsh]}>
                                                                            <TextInput
                                                                                placeholder={'Type here'}
                                                                                multiline={true}
                                                                                selectionColor={"black"}
                                                                                onChangeText={(partnerDetails) => this.setState({partnerDetails})}
                                                                                value={this.state.partnerDetails}
                                                                            />
                                                                        </View>
                                                                    </View>
                                                                    :
                                                                    null
                                                            }
                                                        </View>
                                                        :
                                                        null
                                                }

                                                {/*SUPERVISORS REASON TO END SHIFT*/}
                                                {
                                                    this.state.UserFlow === 'SITE_ADMIN'
                                                        ?
                                                        <View
                                                            style={[Styles.bgWhite,Styles.OrdersScreenCardshadow, Styles.m5, Styles.bw1,
                                                                {borderColor: this.state.supervisorsReason === '' || this.state.errorSupervisorsReason ? 'red' : 'green'}]}>
                                                            <Text
                                                                style={[Styles.colorBlue, Styles.f16, Styles.ffMbold, Styles.marH10]}>Reason
                                                                for supervisor ending shift</Text>
                                                            <View style={[Styles.p5, Styles.m10, Styles.bw1,Styles.bcAsh]}>
                                                                <TextInput
                                                                    placeholder={'Type here'}
                                                                    multiline={true}
                                                                    selectionColor={"black"}
                                                                    onChangeText={(supervisorsReason) => this.setState({supervisorsReason: supervisorsReason}, () => {
                                                                        if (Utils.isValidReason(supervisorsReason).status === true) {
                                                                            this.setState({
                                                                                errorSupervisorsReason: null,
                                                                                SupervisorEnteredReason: true
                                                                            });
                                                                        } else {
                                                                            this.setState({
                                                                                errorSupervisorsReason: Utils.isValidReason(supervisorsReason).message,
                                                                                SupervisorEnteredReason: false
                                                                            });
                                                                        }
                                                                    })}
                                                                    value={this.state.supervisorsReason}
                                                                />
                                                            </View>
                                                            {
                                                                this.state.errorSupervisorsReason ?
                                                                    <Text
                                                                        style={[Styles.cRed, Styles.f14, Styles.ffMregular, Styles.mBtm10, Styles.marH10]}>{this.state.errorSupervisorsReason}</Text>
                                                                    :
                                                                    null
                                                            }
                                                        </View>
                                                        :
                                                        null
                                                }

                                            </View>



                                        </ScrollView>

                                        {/*WILL DISPLAY for >=15 ROLES ,SHOWING LOADER AND SHIFT STATUS*/}
                                        {
                                            EndShiftDetails.userRole >= 15
                                                ?
                                                Services.returnStatusText(EndShiftDetails.status)
                                                :
                                                null
                                        }

                                        {/* FOOTER BUTTON*/}
                                        <Card style={[Styles.footerUpdateButtonStyles]}>
                                            {
                                                EndShiftDetails.showOrderDetails
                                                    ?
                                                    EndShiftDetails.pendingOrdersCount === 0
                                                        ?
                                                        EndShiftDetails.userRole === 5 || EndShiftDetails.userRole === 10
                                                            ?
                                                            this.swipeButtonEndShift(this.state.KMreading - this.state.EndShiftDetails.startOdometerReading === 0 || this.state.KMreading - this.state.EndShiftDetails.startOdometerReading > 999 || this.state.KMreading < this.state.EndShiftDetails.startOdometerReading || this.state.KMreading === '')
                                                            :
                                                            this.swipeButtonEndShift(false)
                                                        :
                                                        this.swipeButtonEndShift(true)
                                                    :
                                                    this.state.SupervisorEnteredReason === false && this.state.UserFlow === 'SITE_ADMIN'
                                                        ?
                                                        this.swipeButtonEndShift(true)
                                                        :
                                                        EndShiftDetails.userRole === 1
                                                            ?
                                                            this.swipeButtonEndShift(this.state.cashCollected === '' || this.state.PackagesDisplay === false ? true : false)
                                                            :
                                                            EndShiftDetails.userRole === 5
                                                                ?
                                                                this.swipeButtonEndShift(this.state.KMreading - this.state.EndShiftDetails.startOdometerReading === 0 || this.state.KMreading - this.state.EndShiftDetails.startOdometerReading > 999 || this.state.KMreading < this.state.EndShiftDetails.startOdometerReading || this.state.KMreading === '' ? true : false)
                                                                :
                                                                EndShiftDetails.userRole === 10
                                                                    ?
                                                                    this.swipeButtonEndShift(this.state.KMreading - this.state.EndShiftDetails.startOdometerReading === 0 || this.state.KMreading - this.state.EndShiftDetails.startOdometerReading > 999 || this.state.KMreading < this.state.EndShiftDetails.startOdometerReading || this.state.KMreading === '' || this.state.cashCollected === '' || this.state.PackagesDisplay === false ? true : false)
                                                                    :
                                                                    EndShiftDetails.userRole >= 15
                                                                        ?
                                                                        this.swipeButtonEndShift(false)
                                                                        :
                                                                        null
                                            }
                                        </Card>
                                    </View>
                                    :
                                    // <CSpinner/>
                                null

                            }
                            {/*MODALS START*/}
                            {
                                EndShiftDetails
                                    ?
                                    <View>

                                        {/*MODAL FOR SUMMARY OF ADHOC SHIFT*/}
                                        <Modal
                                            transparent={true}
                                            animated={true}
                                            animationType='slide'
                                            visible={this.state.liteUserShiftSummaryModal}
                                            onRequestClose={() => {
                                                // this.setState({liteUserShiftSummaryModal: false})
                                            }}>
                                            <View style={[Styles.modalfrontPosition]}>
                                                <View
                                                    style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br15, {width: Dimensions.get('window').width - 60}]}>
                                                    <Card.Content style={[Styles.aslCenter, Styles.p5, Styles.pBtm18]}>
                                                        <Text
                                                            style={[Styles.f18, Styles.ffLBold, Styles.aslCenter, Styles.marV10, Styles.colorBlue, Styles.brdrBtm1]}>LITE
                                                            USER SHIFT DETAILS</Text>
                                                        <View style={[Styles.p5]}>
                                                            <Text
                                                                style={[Styles.ffLBold, Styles.cOrangered, Styles.f18]}>{_.startCase(_.toLower(EndShiftDetails.attributes.userName)) || '--'}</Text>
                                                        </View>
                                                        <View style={[Styles.p5]}>
                                                            <Text
                                                                style={[Styles.ffLRegular, Styles.colorBlue, Styles.f18]}><Text
                                                                style={[Styles.ffLBold, Styles.colorBlue]}>Role:</Text> {Services.getUserRoles(EndShiftDetails.userRole) || '--'}
                                                            </Text></View>
                                                        <View style={[Styles.p5]}>
                                                            <Text
                                                                style={[Styles.ffLRegular, Styles.colorBlue, Styles.f18]}><Text
                                                                style={[Styles.ffLBold, Styles.colorBlue]}>Payment
                                                                Type:</Text> {EndShiftDetails.adhocPaymentMode || '--'}
                                                            </Text></View>

                                                        <View style={[Styles.p5]}>
                                                            <Text
                                                                style={[Styles.ffLRegular, Styles.colorBlue, Styles.f18]}><Text
                                                                style={[Styles.ffLBold, Styles.colorBlue]}>Date:</Text> {EndShiftDetails.shiftDateStr || '--'}
                                                            </Text></View>

                                                        <View style={[Styles.p5]}>
                                                            <Text
                                                                style={[Styles.ffLRegular, Styles.colorBlue, Styles.f18]}><Text
                                                                style={[Styles.ffLBold, Styles.colorBlue]}>Shift
                                                                Duration:</Text> {Services.shiftDurationHHMM(EndShiftDetails) || '--'}
                                                            </Text></View>

                                                        {
                                                            this.state.adhocShiftAmountPaid
                                                                ?
                                                                <View style={[Styles.p5]}>
                                                                    <Text
                                                                        style={[Styles.ffLRegular, Styles.colorBlue, Styles.f18]}><Text
                                                                        style={[Styles.ffLBold, Styles.colorBlue]}>Amount:</Text> &#x20B9; {this.state.adhocAmount || '--'}
                                                                    </Text></View>
                                                                :
                                                                null
                                                        }

                                                    </Card.Content>
                                                    <View
                                                        style={[Styles.row, Styles.jSpaceArd, Styles.p10, Styles.mBtm10]}>
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            onPress={() => this.setState({
                                                                liteUserShiftSummaryModal: false,
                                                                swipeActivated: false
                                                            })}
                                                            style={[Styles.aslCenter, Styles.br5,Styles.bgBlk, Styles.width120]}>
                                                            <Text
                                                                style={[Styles.ffMbold,Styles.cWhite, Styles.aslCenter, Styles.padH5, Styles.padV7, Styles.f16,]}>CANCEL</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                let tempMinutes = Services.returnCalculatedShiftDuration(this.state.EndShiftDetails.actualStartTime)
                                                                if (tempMinutes < 120) {
                                                                    this.setState({
                                                                        durationWarningModal: true,
                                                                        liteUserShiftSummaryModal: false
                                                                    })
                                                                } else {
                                                                    this.ValidateShiftEnd()
                                                                }
                                                            }}
                                                            activeOpacity={0.7}
                                                            style={[Styles.aslCenter, Styles.br5,Styles.bgGrn, Styles.width120]}>
                                                            <Text
                                                                style={[Styles.ffMbold, Styles.cWhite, Styles.aslCenter, Styles.padH5, Styles.padV7, Styles.f16,]}>PROCEED</Text>
                                                        </TouchableOpacity>
                                                    </View>

                                                </View>
                                            </View>
                                        </Modal>


                                        {/*MODAL FOR SUCCESS*/}
                                        <Modal
                                            transparent={true}
                                            animated={true}
                                            animationType='slide'
                                            visible={this.state.durationWarningModal}
                                            onRequestClose={() => {
                                                this.setState({durationWarningModal: false})
                                            }}>
                                            <View style={[Styles.modalfrontPosition]}>
                                                <View
                                                    style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br15, {width: Dimensions.get('window').width - 60}]}>
                                                    <Card.Content style={[Styles.aslCenter, Styles.p5, Styles.pBtm18]}>
                                                        <Image
                                                            style={[Styles.aslCenter, {height: 150, width: 150}]}
                                                            source={LoadImages.timerImage}/>
                                                        <Title
                                                            style={[Styles.colorBlue, Styles.f20, Styles.ffLBold, Styles.aslCenter]}>WARNING
                                                            : You are ending your shift in less than 2 Hours. This may
                                                            not be accounted for your payout.
                                                        </Title>
                                                        <Title
                                                            style={[Styles.cRed, Styles.f16, Styles.ffLBold, Styles.aslCenter]}>(
                                                            Shift
                                                            Duration {Services.shiftDurationHHMM(this.state.EndShiftDetails)} )</Title>
                                                    </Card.Content>

                                                    <View
                                                        style={[Styles.row, Styles.jSpaceArd, Styles.p10, Styles.mBtm10]}>
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            onPress={() => this.setState({
                                                                durationWarningModal: false,
                                                                swipeActivated: false
                                                            })}
                                                            style={[Styles.aslCenter, Styles.br5,Styles.bgBlk, Styles.width120]}>
                                                            <Text
                                                                style={[Styles.ffMbold,Styles.cWhite, Styles.aslCenter, Styles.padH5, Styles.padV7, Styles.f16,]}>CANCEL</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => this.setState({durationWarningModal: false}, () => {
                                                                this.ValidateShiftEnd()
                                                            })}
                                                            activeOpacity={0.7}
                                                            style={[Styles.aslCenter, Styles.br5,Styles.bgGrn, Styles.width120]}>
                                                            <Text
                                                                style={[Styles.ffMbold, Styles.cWhite, Styles.aslCenter, Styles.padH5, Styles.padV7, Styles.f16,]}>PROCEED</Text>
                                                        </TouchableOpacity>
                                                    </View>

                                                </View>
                                            </View>
                                        </Modal>

                                        {/*MODAL FOR WAREHOUSE DETAILS*/}
                                        <Modal
                                            transparent={true}
                                            visible={this.state.tollExpensesModal}
                                            onRequestClose={() => {
                                                this.setState({tollExpensesModal: false})
                                            }}>
                                            <View style={[Styles.modalfrontPosition]}>
                                                {this.state.spinnerBool === false ? null : <CSpinner/>}
                                                <View
                                                    style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 20}]}>

                                                    <View style={[Styles.marH10, Styles.marV15]}>
                                                        <View style={[Styles.aslCenter, Styles.mBtm10]}>
                                                            <Text
                                                                style={[Styles.f18, Styles.colorBlue, Styles.ffMbold]}>Toll
                                                                Bill Details</Text>
                                                        </View>

                                                        <Card style={[Styles.OrdersScreenCardshadow, Styles.m10,]}>
                                                            <Card.Title
                                                                subtitleStyle={themeSubtitle}
                                                                titleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                                                title='Toll Amount'
                                                                left={() => <FontAwesome name="inr" size={28}
                                                                                         color="orange"
                                                                                         style={[Styles.aslCenter, Styles.pLeft5]}/>}
                                                                right={() =>
                                                                    <View
                                                                        style={[Styles.row, Styles.aslCenter, {paddingRight: 10}]}>
                                                                        <TextInput
                                                                            style={[Styles.txtAlignRt, {
                                                                                width: 85,
                                                                                borderBottomWidth: 1,
                                                                                borderBottomColor: '#ddd',
                                                                                paddingRight: 5,
                                                                                fontWeight: 'bold',
                                                                                fontSize: 18
                                                                            }]}
                                                                            selectionColor={"black"}
                                                                            maxLength={6}
                                                                            keyboardType='numeric'
                                                                            onChangeText={(tollAmount) => this.tollAmountValidate(tollAmount)}
                                                                            value={this.state.tollAmount}
                                                                            writingDirection={'rtl'}
                                                                        />
                                                                    </View>
                                                                }
                                                            />
                                                        </Card>
                                                        <View
                                                            style={[Styles.row, Styles.aitCenter, Styles.marV5, Styles.padH10]}>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    // this.imageUpload()
                                                                    this.setState({
                                                                        imageType: 'tollImage',
                                                                        imageSelectionModal: true
                                                                    })
                                                                }}
                                                                activeOpacity={0.7}
                                                                disabled={this.state.tollImageUrl}
                                                                style={[Styles.row, Styles.bgLWhite, Styles.br5, Styles.aslCenter, Styles.p5,]}>
                                                                {LoadSVG.cameraPic}
                                                                <Text
                                                                    style={[Styles.f16, this.state.tollImageUrl ? Styles.cDisabled : Styles.colorBlue, Styles.ffMregular, Styles.pRight15]}>Upload
                                                                    Toll Bill Photo</Text>
                                                            </TouchableOpacity>
                                                            {
                                                                this.state.tollImageUrl
                                                                    ?
                                                                    this.state.tollDetailsUpdated === false
                                                                        ?
                                                                        <TouchableOpacity
                                                                            onPress={() => {
                                                                                this.setState({
                                                                                    picUploaded: false,
                                                                                    tollImageUrl: '',
                                                                                    tollImageFormData: ''
                                                                                })
                                                                            }}
                                                                            style={[Styles.bw1, Styles.br5, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                            <Text
                                                                                style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMextrabold, Styles.cWhite]}>Delete</Text>
                                                                        </TouchableOpacity>
                                                                        :
                                                                        null
                                                                    :
                                                                    null
                                                            }
                                                        </View>

                                                        {
                                                            this.state.tollImageUrl
                                                                ?
                                                                <View
                                                                    style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                    <TouchableOpacity
                                                                        style={[Styles.row, Styles.aslCenter]}
                                                                        onPress={() => {
                                                                            this.setState({
                                                                                imagePreview: true,
                                                                                imagePreviewURL: this.state.tollImageUrl
                                                                            })
                                                                        }}>
                                                                        <Image
                                                                            onLoadStart={() => this.setState({imageLoading: true})}
                                                                            onLoadEnd={() => this.setState({imageLoading: false})}
                                                                            style={[{
                                                                                width: Dimensions.get('window').width / 2,
                                                                                height: 120
                                                                            }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                            source={this.state.tollImageUrl ? {uri: this.state.tollImageUrl} : null}
                                                                        />
                                                                        <MaterialCommunityIcons name="resize" size={24}
                                                                                                color="black"/>
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
                                                    <View
                                                        style={[Styles.row, Styles.jSpaceArd, Styles.p10, Styles.mBtm10]}>
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            onPress={() => this.setState({tollExpensesModal: false})}
                                                            style={[Styles.aslCenter, Styles.br5, Styles.bgBlk]}>
                                                            <Text
                                                                style={[Styles.ffMbold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>CANCEL</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            disabled={this.state.tollDetailsUpdated}
                                                            onPress={() => {
                                                                if (this.state.tollAmount) {
                                                                    if (this.state.tollImageUrl) {
                                                                        this.uploadTollDetails()
                                                                    } else {
                                                                        Utils.dialogBox('Please upload toll amount pic', '');
                                                                    }
                                                                } else {
                                                                    Utils.dialogBox('please enter toll amount', '');
                                                                }
                                                            }}
                                                            style={[Styles.aslCenter, Styles.br5, this.state.tollDetailsUpdated ? Styles.bgDisabled : Styles.bgGrn]}>
                                                            <Text
                                                                style={[Styles.ffMbold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>CONFIRM</Text>
                                                        </TouchableOpacity>
                                                    </View>

                                                </View>
                                            </View>
                                        </Modal>


                                        {/*MODAL FOR WAREHOUSE DETAILS*/}
                                        <Modal
                                            transparent={true}
                                            visible={this.state.ModalWareHouse}
                                            onRequestClose={() => {
                                                this.setState({ModalWareHouse: false})
                                            }}>
                                            <View style={[Styles.modalfrontPosition]}>
                                                <CDismissButton onPress={() => this.setState({ModalWareHouse: false})}
                                                                showButton={'modalBgDismiss'}/>
                                                <View
                                                    style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 20}]}>
                                                    <Card style={[Styles.p10]} theme={theme}>
                                                        {Services.returnWareHouseCards(this.state.EndShiftDetails)}
                                                        <CDismissButton title={this.state.EndShiftDetails.clientName}
                                                                        onPress={() => this.setState({
                                                                            ModalWareHouse: false,
                                                                            ModalOpenAppURL: true
                                                                        })} showButton={'clientName'}/>
                                                        <CDismissButton
                                                            onPress={() => this.setState({ModalWareHouse: false})}
                                                            showButton={'dismiss'}/>
                                                    </Card>

                                                </View>
                                            </View>
                                        </Modal>

                                        {/*{Modal for statues check packages pop up}*/}
                                        <Modal
                                            transparent={true}
                                            visible={this.state.showPackageStatuesModal}
                                            onRequestClose={() => {
                                                this.setState({showPackageStatuesModal: false})
                                            }}>
                                            <View style={[Styles.modalfrontPosition]}>
                                                <TouchableOpacity onPress={() => {
                                                    this.setState({showPackageStatuesModal: false})
                                                }} style={[Styles.modalbgPosition]}>
                                                </TouchableOpacity>
                                                <View
                                                    style={[Styles.bw1, {backgroundColor: '#fff'}, Styles.aslCenter, {width: Dimensions.get('window').width - 20}]}>
                                                    {this.state.selectedPackageData ?
                                                        <ScrollView style={[Styles.p10]} theme={theme}>
                                                            <Card.Content
                                                                style={[Styles.aslCenter, Styles.p5, Styles.row]}>
                                                                <FastImage
                                                                    style={[Styles.aslCenter, Styles.img50, Styles.p10]}
                                                                    source={LoadImages.pickup}/>
                                                                <Title
                                                                    style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.mLt10, Styles.cBlk]}>
                                                                    {this.state.selectedPackageData.displayName} (
                                                                    <Title
                                                                        style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, {
                                                                            color: this.state.finalSum < this.state.TargetValue ? '#FFA500' : this.state.finalSum === this.state.TargetValue ? '#000' : this.state.finalSum > this.state.TargetValue ? 'red' : '#000'
                                                                        }]}> {this.state.finalSum} </Title>
                                                                    /{this.state.TargetValue})</Title>

                                                            </Card.Content>
                                                            <FlatList data={this.state.selectedPackageStatusList}
                                                                      renderItem={({
                                                                                       item,
                                                                                       index
                                                                                   }) => this.showPackageList(item, index)}
                                                                      keyExtractor={(index, item) => JSON.stringify(item) + index}
                                                                      extraData={this.state}/>
                                                            <Card.Actions
                                                                style={[Styles.row, Styles.jSpaceArd, Styles.pTop10, Styles.pBtm5]}>
                                                                <Button title=' CANCEL ' color={'#000'} compact={true}
                                                                        onPress={() => this.setState({showPackageStatuesModal: false})}/>
                                                                <Button title=' SAVE '
                                                                        disabled={this.state.PackageStatusButton === false || this.state.finalSum > this.state.TargetValue}
                                                                        color={'#000'}
                                                                        compact={true}
                                                                        onPress={() => {
                                                                            let tempData = [];
                                                                            for (let i in this.state.listOfPackages) {
                                                                                if (this.state.listOfPackages[i].displayName === this.state.selectedPackageData.displayName) {
                                                                                    let tempArray = this.state.listOfPackages[i]
                                                                                    tempArray.statuses = this.state.selectedPackageStatusList
                                                                                    tempArray.statusTotalCount = this.state.finalSum
                                                                                    tempData.push(tempArray);
                                                                                } else {
                                                                                    tempData.push(this.state.listOfPackages[i]);
                                                                                }
                                                                            }
                                                                            this.setState({
                                                                                listOfPackages: tempData,
                                                                                finalSum: 0,
                                                                                showPackageStatuesModal: false
                                                                            }, () => {
                                                                                this.checkPackagesStatus()
                                                                            });
                                                                        }
                                                                        }>></Button>
                                                            </Card.Actions>
                                                        </ScrollView> : null
                                                    }

                                                </View>
                                            </View>
                                        </Modal>

                                        {/*MODAL FOR APP URL SITE CLICK*/}
                                        <Modal
                                            transparent={true}
                                            visible={this.state.ModalOpenAppURL}
                                            onRequestClose={() => {
                                                this.setState({ModalOpenAppURL: false})
                                            }}>
                                            <View style={[Styles.modalfrontPosition]}>
                                                <TouchableOpacity onPress={() => {
                                                    this.setState({ModalOpenAppURL: false})
                                                }} style={[Styles.modalbgPosition]}>
                                                </TouchableOpacity>
                                                <View
                                                    style={[Styles.bw1, {backgroundColor: '#fff'}, Styles.aslCenter, {width: Dimensions.get('window').width - 20}]}>
                                                    <Card style={[Styles.p10]} theme={theme}>
                                                        <Card.Content style={[Styles.aslCenter, Styles.p5]}>
                                                            <FastImage
                                                                style={[Styles.aslCenter, Styles.img100, Styles.p10]}
                                                                source={LoadImages.siteWareHouse}/>
                                                            <Title
                                                                style={[Styles.cBlk, Styles.f20, Styles.ffMbold, Styles.aslCenter,]}>{EndShiftDetails.clientName}-CLIENT</Title>
                                                        </Card.Content>

                                                        <TouchableOpacity
                                                            disabled={EndShiftDetails.attributes.appLinkForAndroid === null}
                                                            onPress={() => {
                                                                Linking.openURL(EndShiftDetails.attributes.appLinkForAndroid)
                                                            }}>
                                                            <View
                                                                style={[Styles.marV5, Styles.bcLYellow, Styles.bw1, Styles.row, Styles.bgWhite, Styles.jSpaceBet, Styles.p5]}>
                                                                <View style={[Styles.jSpaceArd, Styles.row]}>
                                                                    <View style={[Styles.aitCenter, {
                                                                        width: 60,
                                                                        padding: 6
                                                                    }]}>
                                                                        <FontAwesome name="mobile-phone" size={45}
                                                                                     color="#000"/>
                                                                    </View>
                                                                    <View style={[Styles.aslCenter, {padding: 6}]}>
                                                                        <Text
                                                                            style={[Styles.cBlk, Styles.ffMbold, Styles.aslCenter, Styles.f18]}>APP
                                                                            LINK {EndShiftDetails.attributes.appLinkForAndroid === null ? '(not available)' : null}</Text>
                                                                    </View>
                                                                </View>
                                                                <View/>
                                                            </View>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            disabled={EndShiftDetails.attributes.appLinkForWeb === null}
                                                            onPress={() => {
                                                                Linking.openURL(EndShiftDetails.attributes.appLinkForWeb)
                                                            }}>
                                                            <View
                                                                style={[Styles.marV5, Styles.bcLYellow, Styles.bw1, Styles.row, Styles.bgWhite, Styles.jSpaceBet, Styles.p5]}>
                                                                <View style={[Styles.jSpaceArd, Styles.row]}>
                                                                    <View style={[Styles.aitCenter, {
                                                                        width: 60,
                                                                        padding: 6
                                                                    }]}>
                                                                        <FontAwesome name="laptop" size={45}
                                                                                     color="#000"/>
                                                                    </View>
                                                                    <View style={[Styles.aslCenter, {padding: 6}]}>
                                                                        <Text
                                                                            style={[Styles.cBlk, Styles.ffMbold, Styles.aslCenter, Styles.f18]}>WEB
                                                                            LINK {EndShiftDetails.attributes.appLinkForWeb === null ? '(not available)' : null}</Text>
                                                                    </View>
                                                                </View>
                                                                <View/>
                                                            </View>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity style={[Styles.marV5]} onPress={() => {
                                                            this.setState({ModalOpenAppURL: false})
                                                        }}>
                                                            <Card.Title theme={theme}
                                                                        titleStyle={[Styles.f16, Styles.ffMregular, Styles.aslCenter]}
                                                                        title='tap to dismiss'/>
                                                        </TouchableOpacity>
                                                    </Card>

                                                </View>
                                            </View>
                                        </Modal>

                                        {/*MODAL FOR ON DUTY DELIVERY DETAILS*/}
                                        <Modal
                                            transparent={true}
                                            visible={this.state.ModalonDutyDelivery}
                                            onRequestClose={() => {
                                                this.setState({ModalonDutyDelivery: false})
                                            }}>
                                            <View style={[Styles.modalfrontPosition]}>
                                                <TouchableOpacity onPress={() => {
                                                    this.setState({ModalonDutyDelivery: false})
                                                }} style={[Styles.modalbgPosition]}>
                                                </TouchableOpacity>
                                                <View
                                                    style={[Styles.bw1, {backgroundColor: '#fff'}, Styles.aslCenter, {width: Dimensions.get('window').width - 20}]}>
                                                    <View style={[Styles.p10]} theme={theme}>
                                                        <Card.Content style={[Styles.aslCenter, Styles.p5]}>
                                                            {
                                                                EndShiftDetails.userRole === 1
                                                                    ?
                                                                    <FastImage
                                                                        style={[Styles.aslCenter, Styles.img100, Styles.m15]}
                                                                        source={LoadImages.activeDA}/>
                                                                    :
                                                                    EndShiftDetails.userRole === 5
                                                                        ?
                                                                        <FastImage
                                                                            style={[Styles.aslCenter, Styles.img100, Styles.m10]}
                                                                            source={LoadImages.activeDriver}/>
                                                                        :
                                                                        EndShiftDetails.userRole === 10
                                                                            ?
                                                                            <FastImage
                                                                                style={[Styles.aslCenter, Styles.img100, Styles.m10]}
                                                                                source={LoadImages.activeDDA}/>
                                                                            :
                                                                            EndShiftDetails.userRole === 15
                                                                                ?
                                                                                <FastImage
                                                                                    style={[Styles.aslCenter, Styles.img100, Styles.m10]}
                                                                                    source={LoadImages.activeLabourer}/>
                                                                                :
                                                                                <FastImage
                                                                                    style={[Styles.aslCenter, Styles.img100, Styles.m10]}
                                                                                    source={LoadImages.activeSupervisor}/>
                                                            }

                                                            <Title
                                                                style={[Styles.aslCenter, Styles.cBlk, Styles.f20, Styles.ffMbold]}>{EndShiftDetails.siteName}</Title>
                                                        </Card.Content>

                                                        <Card style={[styles.shadow, Styles.marV5]}>
                                                            <Card.Title theme={theme}
                                                                        titleStyle={[Styles.f16, Styles.ffMregular]}
                                                                        style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                                        title={<CText
                                                                            cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>Shift
                                                                            Started at
                                                                            <CText
                                                                                cStyle={[Styles.padV3, Styles.aslStart, Styles.cBlk, Styles.f18, Styles.ffMregular]}> {EndShiftDetails.attributes.markedAttendanceTime}{this.ShiftDuration(EndShiftDetails)}</CText></CText>}
                                                                        left={() => <FastImage
                                                                            style={{width: 50, height: 60}}
                                                                            source={LoadImages.warehouse}/>}
                                                            />
                                                        </Card>

                                                        {
                                                            EndShiftDetails.userRole === 1 || EndShiftDetails.userRole === 10
                                                                ?
                                                                <Card style={[styles.shadow, Styles.marV5]}>
                                                                    <Card.Title theme={theme}
                                                                                titleStyle={[Styles.f16, Styles.ffMregular]}
                                                                                style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                                                title={<CText
                                                                                    cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{this.state.EndShiftDetails.pickUpPackagesCount}
                                                                                    <CText
                                                                                        cStyle={[Styles.padV3, Styles.aslStart, Styles.cBlk, Styles.f16, Styles.ffMregular]}>{' '}shift
                                                                                        items to
                                                                                        complete</CText></CText>}
                                                                                left={() => <FastImage
                                                                                    style={{width: 40, height: 40}}
                                                                                    source={LoadImages.delivery}/>}
                                                                    />
                                                                </Card>
                                                                :
                                                                null
                                                        }
                                                        <TouchableOpacity onPress={() => {
                                                            this.setState({
                                                                ModalonDutyDelivery: false,
                                                                ModalOpenAppURL: true
                                                            })
                                                        }}>
                                                            <Card style={[styles.shadow, Styles.marV5]}>
                                                                <Card.Title theme={theme}
                                                                            titleStyle={[Styles.f16, Styles.ffMregular]}
                                                                            style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                                            title={<CText
                                                                                cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{this.state.EndShiftDetails.clientName}</CText>}
                                                                            left={() => <FastImage
                                                                                style={{width: 50, height: 60}}
                                                                                source={LoadImages.routePoint}/>}
                                                                />
                                                            </Card>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity style={[Styles.marV5]} onPress={() => {
                                                            this.setState({ModalonDutyDelivery: false})
                                                        }}>
                                                            <Card.Title theme={theme}
                                                                        titleStyle={[Styles.f16, Styles.ffMregular, Styles.aslCenter]}
                                                                        title='tap to dismiss'/>
                                                        </TouchableOpacity>
                                                    </View>

                                                </View>
                                            </View>
                                        </Modal>

                                        {/*MODAL FOR SITE SUPERVISOR LIST VIEW*/}
                                        <SupervisorsModal visible={this.state.ModalSupervisorVisible}
                                                          closeModal={() => this.setState({ModalSupervisorVisible: false})}
                                                          siteName={this.state.EndShiftDetails.siteName}
                                                          children={this.state.SupervisorDetails}/>



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
                                                                        <TouchableOpacity
                                                                            style={[Styles.row, Styles.marH10]}
                                                                            onPress={() => {
                                                                                this.rotate()
                                                                            }}>
                                                                            <Text
                                                                                style={[Styles.colorBlue, Styles.f18, Styles.padH5]}>ROTATE</Text>
                                                                            <FontAwesome name="rotate-right" size={24}
                                                                                         color="black"
                                                                            />
                                                                        </TouchableOpacity>
                                                                    </View>

                                                                    <ImageZoom
                                                                        cropWidth={Dimensions.get('window').width}
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
                                                                        this.selectImage('CAMERA')
                                                                    })
                                                                }}
                                                                activeOpacity={0.7}
                                                                style={[Styles.marV10, Styles.row, Styles.aitCenter]}>
                                                                <FontAwesome name="camera" size={24} color="black"/>
                                                                <Text
                                                                    style={[Styles.f20, Styles.cBlk, Styles.ffLBold, Styles.padH10]}>Take
                                                                    Photo</Text>
                                                            </TouchableOpacity>
                                                            <Text
                                                                style={[Styles.ffLBlack, Styles.brdrBtm1, Styles.mBtm15]}/>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    this.setState({imageSelectionModal: false}, () => {
                                                                        this.selectImage('LIBRARY')
                                                                    })
                                                                }}
                                                                activeOpacity={0.7}
                                                                style={[Styles.marV10, Styles.row, Styles.aitCenter]}>
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

                                    </View>
                                    :
                                    null
                            }
                            {/*MODALS END*/}
                        </View>
            </View>
        );
    }
};

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
    info: {
        fontSize: 14,
        marginLeft: 20,
        lineHeight: 20,
        marginTop: 5
    },
    infoP: {
        fontSize: 18,
        marginLeft: 20,
        lineHeight: 25,
        marginTop: 10,
    },
    IncrementButton: {
        borderWidth: 2,
        height: 30,
        width: 30,
        // borderColor: '#b2beb5',
        // paddingHorizontal: 12,
        // paddingVertical: 6,
        textAlign: "center",
        fontSize: 18
    },
    DecrementButton: {
        borderWidth: 2,
        height: 30,
        width: 30,
        // borderColor: '#b2beb5',
        // paddingHorizontal: 13,
        // paddingVertical: 6,
        textAlign: "center",
        fontSize: 18
    },
    shadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
        marginLeft: 5,
        marginRight: 5
    }
});
