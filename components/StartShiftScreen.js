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
    PermissionsAndroid,
    Alert,
    TextInput as Input,
    Keyboard,
    KeyboardAvoidingView,
    Vibration,
    Image, Picker
} from "react-native";
import {
    Appbar, Card, DefaultTheme, List, RadioButton, Searchbar, Title,
} from "react-native-paper";
import {Styles, CText, CSpinner, SupervisorsModal, LoadImages, LoadSVG} from "./common";
import Utils from './common/Utils';
import Config from "./common/Config"
import Services from "./common/Services";
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/dist/FontAwesome';
import FastImage from 'react-native-fast-image';
import Ionicons from "react-native-vector-icons/dist/Ionicons";
// import SwipeButton from 'rn-swipe-button';
import HomeNoticeScreen from "./common/HomeNoticeScreen";
import {CDismissButton} from "./common";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";
import Geolocation from "react-native-geolocation-service";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import DeviceInfo from "react-native-device-info";
import AsyncStorage from "@react-native-community/async-storage";
import _ from "lodash";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import ImageZoom from "react-native-image-pan-zoom";

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

const windowWidth = Dimensions.get('window').width;

export default class StartShiftScreen extends Component {

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
        this.state = {
            spinnerBool: false,
            SupervisorDetails: '',
            CurrentShiftId: '',
            refreshing: false,
            ModalSupervisorVisible: false,
            StartShiftDetails: '',
            listOfPackages: '',
            KMreading: '0',
            PackagesDisplay: false, UserFlow: '', defaultOdometer: false,
            ModalWareHouse: false, ModalonDutyDelivery: false, currentUserId: '', ModalOpenAppURL: false,
            // latitude: null,
            // longitude: null,
            GPSasked: false, swipeActivated: false, ordersCount: 0,
            tripTypeList: [], tripTypeSelectionModal: false, selectedTripType: '', selectedTripValue: '', route: '',
            errorSupervisorsReason: null,
            supervisorsReason: '',checkOdometerReading:false,
            odometerImageURL:'',odometerImageFormData:'',
            imagePreview: false, imagePreviewURL: '',imageRotate:'0',
            imageSelectionModal:false,

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
            // this.requestLocationPermission();
            this.checkDeviceCompatablility();
            self.setState({
                CurrentShiftId: self.props.navigation.state.params.CurrentShiftId,
                UserFlow: self.props.navigation.state.params.UserFlow,
            })
            self.StartShiftDetails(self.props.navigation.state.params.UserFlow);
        });
    }

    checkDeviceCompatablility(){
        DeviceInfo.getApiLevel().then((apiLevel) => {
             if (apiLevel){
                if (apiLevel >= 29){
                    this.requestBackgroundPermission()
                }else {
                    this.requestLocationPermission()
                }
            }else {
                this.requestLocationPermission()
            }
        });
    }

    onBack = () => {
        if (this.state.UserFlow === "SITE_ADMIN" || this.state.UserFlow === 'ADMIN_ADHOC_FLOW') {
            return this.props.navigation.navigate('TeamListingScreen');
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
        // console.log("start shift screen error", error, error.response);
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

//API CALL TO GET START SHIFT DETAILS
    StartShiftDetails(UserFlow) {
        this.setState({spinnerBool: true})
        const self = this;
        const CurrentShiftId = self.props.navigation.state.params.CurrentShiftId;
        const currentUserId = self.props.navigation.state.params.currentUserId;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_STARTSHIFT_DETAILS + '?shiftId=' + CurrentShiftId + '&userId=' + currentUserId;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, function (response) {
                if (response.status === 200) {
                     if (response.data != null) {
                        let StartShiftDetails = response.data;
                        let supervisorList = []
                        if (StartShiftDetails.siteSupervisorsList) {
                            supervisorList = StartShiftDetails.siteSupervisorsList;
                        }
                        self.setState({
                            ordersCount: StartShiftDetails.ordersCount,
                            StartShiftDetails: StartShiftDetails,
                            SupervisorDetails: supervisorList,
                            checkOdometerReading: StartShiftDetails.checkOdometerReading,
                            startOdometerReading: StartShiftDetails.startOdometerReading,
                            route: StartShiftDetails.route,
                            tripTypeList: StartShiftDetails.tripTypes,
                            selectedTripType: StartShiftDetails.tripTypes[0].name,  //renamed as Operations Type in frontend
                            selectedTripValue: StartShiftDetails.tripTypes[0].key,
                            // tripTypeDetails: StartShiftDetails.requireTripType === true ? false :true,
                            tripSheetId: StartShiftDetails.tripSheetId,
                            partnerDetails: StartShiftDetails.partnerDetails,
                            refreshing: false,
                            spinnerBool: false,
                        },()=>{
                            if (StartShiftDetails.requireClientLoginId){
                                if (UserFlow === "NORMAL_ADHOC_FLOW"){
                                    self.setState({searchPhoneNumberOthers:true})
                                }else {
                                    self.setState({searchPhoneNumber:StartShiftDetails.phoneNumber,searchPhoneNumberOthers:false},()=>{
                                        self.getEnteredPhoneNumberProfiles(StartShiftDetails.phoneNumber)
                                    })
                                }
                            }
                        });

                        if (UserFlow === "SITE_ADMIN") {
                            self.setState({SupervisorEnteredReason: false})
                        } else {
                            self.setState({SupervisorEnteredReason: true})
                        }


                        if (StartShiftDetails.startOdometerReading != null) {
                            self.setState({
                                KMreading: StartShiftDetails.startOdometerReading === 999999 ? '0' : JSON.stringify(StartShiftDetails.startOdometerReading),
                                defaultOdometer: !(StartShiftDetails.startOdometerReading === 999999 || StartShiftDetails.startOdometerReading === 0)
                            })
                        }

                        if (StartShiftDetails.clientPackages != null) {
                            if (StartShiftDetails.clientPackages.length > 0) {
                                let PackagesList = StartShiftDetails.clientPackages;
                                const packagesInfo = [];
                                for (let i = 0; i < PackagesList.length; i++) {
                                    let sample = {};
                                    sample.value = JSON.stringify(PackagesList[i].count);
                                    sample.image = PackagesList[i].attributes.imageUrl;
                                    sample.displayName = PackagesList[i].displayName;
                                    sample.packageTypeId = PackagesList[i].packageTypeId;
                                    sample.includeInPackageCount = PackagesList[i].includeInPackageCount;
                                    sample.type = PackagesList[i].type;
                                    sample.maximumValue = PackagesList[i].maximumValue;
                                    sample.minimumValue = PackagesList[i].minimumValue;
                                    sample.statuses = PackagesList[i].statuses;
                                    packagesInfo.push(sample);
                                }
                                self.setState({listOfPackages: packagesInfo, spinnerBool: false});
                            }
                        } else {
                            self.setState({listOfPackages: [], spinnerBool: false});
                        }
                        self.packagesTotalCount()
                    } else {
                        Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
                        self.setState({StartShiftDetails: [], spinnerBool: false});
                    }
                }
            }, function (error) {
                 self.errorHandling(error)
            })
        });
    }

    PackagesIncrement(item, index) {
        let value = Math.trunc(parseInt(item.value));
         if (value > item.maximumValue - 1) {
            Utils.dialogBox('Maximum value is ' + item.maximumValue, '');
        } else {
            let tempItem = item;
            tempItem.value = (Math.trunc(Number(tempItem.value) + 1)).toString();
            let tempData = [];
            for (let i in this.state.listOfPackages) {
                if (i === index) {
                    tempData.push(tempItem);
                } else {
                    tempData.push(this.state.listOfPackages[i])
                }
            }
            this.setState({data: tempData});
            this.packagesTotalCount();
        }
    }

    PackagesDecrement(item, index) {
        if (item.value === '') {
            Utils.dialogBox('Please enter a value', '');
        } else {
            let value = Math.trunc(parseInt(item.value));
            if (value < 1) {
                Utils.dialogBox('Minimum value is 0', '');
            } else {
                let tempItem = item;
                tempItem.value = (Math.trunc(Number(tempItem.value) - 1)).toString();
                let tempData = [];
                for (let i in this.state.listOfPackages) {
                    if (i === index) {
                        tempData.push(tempItem);
                    } else {
                        tempData.push(this.state.listOfPackages[i])
                    }
                }
                this.setState({data: tempData});
                this.packagesTotalCount();
            }
        }
    }

    packagesTotalCount() {
        let textInputs = this.state.listOfPackages;
        let initialTotal = [];
        let finalTotal = [];
        for (let i = 0; i < textInputs.length; i++) {
            initialTotal.push(parseInt(textInputs[i].minimumValue));
            finalTotal.push(parseInt(textInputs[i].value));
        }
        let initialSum = initialTotal.reduce(function (a, b) {
            return a + b;
        }, 0);
        let finalSum = finalTotal.reduce(function (a, b) {
            return a + b;
        }, 0);

        if (finalSum > initialSum) {
            this.setState({PackagesDisplay: true}, () => {
            })
        } else {
            this.setState({PackagesDisplay: false}, () => {
            })
        }
    }

//PACKAGES TOTAL SET
    PackagesData(item, index) {
         return (
            <ScrollView
                persistentScrollbar={true}>
                <Card style={[styles.shadow, Styles.marV10]}>
                    <Card.Title
                        style={[Styles.p5, Styles.bw1, {borderColor: this.state.PackagesDisplay === true && this.state.listOfPackages[index].value > '0' ? 'green' : this.state.PackagesDisplay === true ? 'orange' : this.state.listOfPackages[index].value === '' || this.state.listOfPackages[index].value === '0' ? 'red' : '#add8e6'}]}
                        subtitleStyle={themeSubtitle}
                        titleStyle={[Styles.f16, Styles.cBlk, {fontFamily: 'Muli-Bold'}]}
                        title={item.displayName}
                        left={() => <FastImage style={[Styles.img40]}
                                               source={LoadImages.pickup}/>}
                        right={() =>
                            <View style={[Styles.row, {paddingRight: 10}]}>
                                <TouchableOpacity
                                    style={[Styles.aslCenter]}
                                    disabled={this.state.listOfPackages[index].value === JSON.stringify(item.minimumValue)}
                                    onPress={() => this.PackagesDecrement(item, index)}
                                >
                                    <Text style={[styles.IncrementButton, {
                                        borderColor: this.state.listOfPackages[index].value === JSON.stringify(item.minimumValue) ? '#f5f5f5' : '#000',
                                        color: this.state.listOfPackages[index].value === JSON.stringify(item.minimumValue) ? '#f5f5f5' : '#000'
                                    }]}>-</Text></TouchableOpacity>
                                <TextInput
                                    style={[Styles.txtAlignCen, {width: 80, fontWeight: 'bold', fontSize: 17}]}
                                    selectionColor={"black"}
                                    // maxLength={item.maximumValue.length}
                                    placeholderTextColor='#666'
                                    keyboardType='numeric'
                                    value={this.state.listOfPackages[index].value}
                                    onChangeText={(val) => {
                                        let tempItem = this.state.listOfPackages[index];
                                        if (val > tempItem.maximumValue) {
                                            Utils.dialogBox('Maximum value is ' + tempItem.maximumValue, '');
                                        } else if (val < 0) {
                                            // Utils.dialogBox('Minimum value is ' + tempItem.minimumValue, '');
                                        } else {
                                            var value = Math.trunc(parseInt(val));
                                             val = JSON.stringify(value)

                                            tempItem.value = val.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');
                                            let tempData = [];
                                            for (let i in this.state.listOfPackages) {
                                                if (i === index) {
                                                    tempData.push(tempItem);
                                                } else {
                                                    tempData.push(this.state.listOfPackages[i])
                                                }
                                            }
                                            this.setState({data: tempData});
                                            this.packagesTotalCount();
                                        }
                                    }
                                    }
                                />
                                <TouchableOpacity style={[Styles.aslCenter]}
                                                  disabled={this.state.listOfPackages[index].value === JSON.stringify(item.maximumValue)}
                                                  onPress={() => this.PackagesIncrement(item, index)}>
                                    <Text style={[styles.IncrementButton, {
                                        borderColor: this.state.listOfPackages[index].value === JSON.stringify(item.maximumValue) ? '#f5f5f5' : '#000',
                                        color: this.state.listOfPackages[index].value === JSON.stringify(item.maximumValue) ? '#f5f5f5' : '#000'
                                    }]}>+</Text></TouchableOpacity>
                            </View>
                        }
                    />
                </Card>
            </ScrollView>
        )
    }

//Odometer reading validate
    odometerReading(KMreading) {
        var value = Math.trunc(parseInt(KMreading));
         const updatedKMreading = JSON.stringify(value)

        let num = updatedKMreading.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');
        if (num > 0) {
            if (num >= 999999) {
                const tempValue = 999998;
                this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: true});
            } else {
                this.setState({defaultOdometer: true, KMreading: num})
            }
        } else {
            this.setState({defaultOdometer: false, KMreading: num})
        }
    };

    OdometerReadingValidate(item, operator) {
        if (item === '') {
            item = 0;
            this.setState({KMreading: JSON.stringify(item), defaultOdometer: false});
        } else {
            let value = Math.trunc(parseInt(item));
            if (operator === 'Increment') {
                if (value >= 999998) {
                    const tempValue = 999998;
                    this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: true});
                    Utils.dialogBox('Reached Maximum Value', '');
                } else {
                    const tempValue = value + 1;
                    this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: true},);
                }
            } else if (operator === 'Decrement') {
                if (value <= 0) {
                    // const tempValue = 0;
                    this.setState({KMreading: JSON.stringify(value), defaultOdometer: false});
                    // Utils.dialogBox('Reached Minimum Value', '');
                } else if (value > 999999) {
                    const tempValue = 999999 - 1;
                    this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: true});
                    Utils.dialogBox('Reached Maximum Value', '');
                } else {
                    const tempValue = value - 1;
                    if (tempValue === 0) {
                        this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: false})
                    } else {
                        this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: true});
                    }
                }
            }
        }
    }

    ValidateShiftStart() {
        const {latitude,longitude} = this.state;
        let body = {};
        if (longitude && latitude) {
            if (this.state.selectedTripValue === "NO_LOAD") {
                {
                    this.state.UserFlow === 'SITE_ADMIN' || this.state.UserFlow === 'NORMAL_ADHOC_FLOW' || this.state.UserFlow === 'ADMIN_ADHOC_FLOW'
                        ?
                        body = JSON.stringify({
                            'deliveredPackagesInfo': null,
                            'cashCollected': null,
                            "shiftEndedLocation": {"latitude": latitude, "longitude": longitude},
                            'tripType': this.state.selectedTripValue,
                            'reasonToEndShift': this.state.supervisorsReason,
                            'route': this.state.route,
                            'tripSheetId': this.state.tripSheetId,
                            'partnerDetails': this.state.partnerDetails,
                            'others':this.state.searchPhoneNumberOthers,
                            'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                        })
                        :
                        body = JSON.stringify({
                            'deliveredPackagesInfo': null,
                            'cashCollected': null,
                            "shiftEndedLocation": {"latitude": latitude, "longitude": longitude},
                            'tripType': this.state.selectedTripValue,
                            'route': this.state.route,
                            'tripSheetId': this.state.tripSheetId,
                            'partnerDetails': this.state.partnerDetails,
                            'others':this.state.searchPhoneNumberOthers,
                            'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                        })
                }
                 this.ReadingsCountSTART(body);
            } else {
                const StartShiftDetails = this.state.StartShiftDetails;
                var textInputs = this.state.listOfPackages;
                let pickUpPackagesInfo = [];
                for (let i = 0; i < textInputs.length; i++) {
                    let sample = {};
                    sample.type = textInputs[i].type;
                    sample.packageTypeId = textInputs[i].packageTypeId;
                    sample.includeInPackageCount = textInputs[i].includeInPackageCount;
                    sample.displayName = textInputs[i].displayName;
                    sample.maximumValue = textInputs[i].maximumValue;
                    sample.minimumValue = textInputs[i].minimumValue;
                    sample.count = parseInt(textInputs[i].value);
                    sample.statuses = textInputs[i].statuses;
                    pickUpPackagesInfo.push(sample);
                }
                {
                    StartShiftDetails.userRole === 1
                        ?
                        body = JSON.stringify({
                            'pickUpPackagesInfo': pickUpPackagesInfo,
                            'tripType': this.state.selectedTripValue,
                            'route': this.state.route,
                            'tripSheetId': this.state.tripSheetId,
                            'partnerDetails': this.state.partnerDetails,
                            'others':this.state.searchPhoneNumberOthers,
                            'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                        })
                        :
                        StartShiftDetails.userRole === 5
                            ?
                            body = JSON.stringify({
                                'startOdometerReading': this.state.KMreading,
                                'tripType': this.state.selectedTripValue,
                                'route': this.state.route,
                                'tripSheetId': this.state.tripSheetId,
                                'partnerDetails': this.state.partnerDetails,
                                'others':this.state.searchPhoneNumberOthers,
                                'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                            })
                            :
                            StartShiftDetails.userRole === 10
                                ?
                                body = JSON.stringify({
                                    'pickUpPackagesInfo': pickUpPackagesInfo,
                                    'startOdometerReading': this.state.KMreading,
                                    'tripType': this.state.selectedTripValue,
                                    'route': this.state.route,
                                    'tripSheetId': this.state.tripSheetId,
                                    'partnerDetails': this.state.partnerDetails,
                                    'others':this.state.searchPhoneNumberOthers,
                                    'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                                })
                                :
                                StartShiftDetails.userRole >= 15
                                    ?
                                    body = JSON.stringify({
                                        'pickUpPackagesInfo': null,
                                        'startOdometerReading': null,
                                        'tripType': null,
                                        'route': this.state.route,
                                        'tripSheetId': this.state.tripSheetId,
                                        'partnerDetails': this.state.partnerDetails,
                                        'others':this.state.searchPhoneNumberOthers,
                                        'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                                    })
                                    :
                                    null
                }
                 this.ReadingsCountSTART(body);
            }
        }else {
            this.validatingLocation()
            // Utils.dialogBox('No Lat Long Found', '');
        }
    }

    async startLocation() {
        await LocationService.startLocation((err) => {
            console.log(err)
        }, (msg) => {
            console.log(msg)
            // Utils.setToken('locationStatus', JSON.stringify(msg), function () {
            // });
        });
    }

    //API CALL to  STARTShift
    ReadingsCountSTART = (body) => {
        const CurrentShiftId = this.state.CurrentShiftId;
        const self = this;
      let apiURL;
        if (this.state.selectedTripValue === "NO_LOAD") {
            if (self.state.UserFlow === 'SITE_ADMIN' || self.state.UserFlow === 'NORMAL_ADHOC_FLOW' || self.state.UserFlow === 'ADMIN_ADHOC_FLOW') {
                apiURL = Config.routes.BASE_URL + Config.routes.END_SHIFT_BY_SUPERVISOR + CurrentShiftId;
            } else {
                apiURL = Config.routes.BASE_URL + Config.routes.END_SHIFT + CurrentShiftId;
            }
        } else {
            if (self.state.UserFlow === 'SITE_ADMIN'|| self.state.UserFlow === 'NORMAL_ADHOC_FLOW' || self.state.UserFlow === 'ADMIN_ADHOC_FLOW') {
                apiURL = Config.routes.BASE_URL + Config.routes.START_SHIFT_BY_SUPERVISOR + CurrentShiftId;
            } else {
                apiURL = Config.routes.BASE_URL + Config.routes.START_SHIFT + CurrentShiftId;
            }
        }
         self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, function (response) {
                if (response.status === 200) {
                     Vibration.vibrate()

                    let ReadingsCount = response.data;
                    if ((self.state.UserFlow === 'NORMAL'  ) && self.state.selectedTripValue !== "NO_LOAD") {
                        Utils.setToken('shiftId', CurrentShiftId, function (d) {
                        });
                        Utils.setToken('currentShiftStatus', JSON.stringify(ReadingsCount.status), function (d) {
                        });
                        self.startLocation();
                    }

                    self.setState({spinnerBool: false,}, () => {
                        self.props.navigation.navigate('Summary', {
                            AttendenceResponse: ReadingsCount,
                            UserFlow: self.state.UserFlow,
                            SupervisorDetails: self.state.SupervisorDetails
                        })
                    })
                }
            }, function (error) {
                 self.errorHandling(error)
            })
        });
    };

    async checkBackgroundLocation(){
        try {
            const grantedBackground = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
            );
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
                this.ValidateShiftStart()
            }else {
                Alert.alert('App needs Background Location Permissions', 'Select Allow all the time',
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
             Utils.dialogBox(err, '')
        }
    }


    validatingLocation() {
         if (this.state.longitude && this.state.latitude) {
            DeviceInfo.getApiLevel().then((apiLevel) => {
                 if (apiLevel){
                    if (apiLevel >= 29){
                        this.checkBackgroundLocation()
                    }else {
                        this.ValidateShiftStart()
                    }
                }else {
                    this.ValidateShiftStart()
                }
            });
        } else {
            Alert.alert('', 'Your Location data is missing, Please check your Location Settings',
                [{
                    text: 'enable', onPress: () => {
                        // this.requestLocationPermission();
                        this.checkDeviceCompatablility();
                    }
                }]);
        }
    }

     requestBackgroundPermission = async()=>{
        try {
            const grantedBackground = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION);
            if (grantedBackground === PermissionsAndroid.RESULTS.GRANTED) {
                await this.requestCurrentLocation()
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
             Utils.dialogBox(err, '')
        }
    }



     requestLocationPermission = async()=> {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                await this.requestCurrentLocation()
            } else {
                Utils.dialogBox('Location permission denied', '');
                this.props.navigation.goBack();
            }
        } catch (err) {
             Utils.dialogBox(err, '')
        }
    }

   requestCurrentLocation = async()=>{
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
            // {enableHighAccuracy: false, timeout: 10000, maximumAge: 100000}
            // {enableHighAccuracy: true, timeout: 25000, maximumAge: 3600000}
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );
    }

    checkGPSpermission() {
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({interval: 10000, fastInterval: 5000})
            .then(data => {
                 this.setState({GPSasked: true}, () => {
                    // this.requestLocationPermission()
                    this.checkDeviceCompatablility()
                })
            }).catch(err => {
             Utils.dialogBox('GPS permissions denied', '');
            this.props.navigation.goBack()
        });
    }

    swipeButtonStartShift(statusCheck) {
        return (
            <TouchableOpacity onPress={() => {
                    let resp = {}
                {
                    this.state.checkOdometerReading
                    ?
                        resp = Utils.isValueSelected(this.state.odometerImageURL, 'Please Upload Odometer Readings Pic')
                    :
                    resp = Utils.isValueSelected(true, 'Please Upload Odometer Readings Pic')
                }
                    if (resp.status === true) {
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
                    }else {
                        Utils.dialogBox(resp.message, '');
                    }
            }} style={[Styles.br5, {backgroundColor: statusCheck ? '#b2beb5' : this.state.selectedTripValue === "NO_LOAD" ? '#db2b30': '#36A84C'}]}
                              activeOpacity={0.7}
                              disabled={statusCheck}>
                <Text
                    style={[Styles.cWhite, Styles.f20, Styles.p10, Styles.aslCenter, Styles.ffMregular]}>{this.state.selectedTripValue === "NO_LOAD" ? 'END SHIFT' : "START SHIFT"}</Text>
            </TouchableOpacity>
        )
    }

    returnOdometerCard(){
        return(
            <Card  style={[styles.shadow, Styles.mTop10, {marginBottom: 15}]}>
                <Card.Title
                    style={[Styles.p5, Styles.bw1, {borderColor: this.state.KMreading === '' || this.state.KMreading === '0' ? 'red' : 'green'}]}
                    subtitleStyle={themeSubtitle}
                    titleStyle={[Styles.f16, Styles.cBlk, {fontFamily: 'Muli-Bold'}]}
                    title='KM reading'
                    left={() => <FastImage style={[Styles.img40]}
                                           source={LoadImages.odometer}/>}
                    right={() =>
                        <View
                            style={[Styles.row, Styles.aslCenter, {paddingRight: 10}]}>
                            <TouchableOpacity
                                style={[Styles.aslCenter]}
                                disabled={this.state.KMreading === '0'}
                                onPress={() => this.OdometerReadingValidate(this.state.KMreading, 'Decrement')}
                            >
                                <Text
                                    style={[styles.IncrementButton, {
                                        borderColor: this.state.KMreading === '0' ? '#f5f5f5' : '#000',
                                        color: this.state.KMreading === '0' ? '#f5f5f5' : '#000'
                                    }]}>-</Text></TouchableOpacity>
                            <TextInput
                                style={[Styles.txtAlignCen, {
                                    width: 80,
                                    fontWeight: 'bold',
                                    fontSize: 17
                                }]}
                                selectionColor={"black"}
                                maxLength={6}
                                keyboardType='numeric'
                                onChangeText={(KMreading) => this.odometerReading(KMreading)}
                                value={this.state.KMreading}
                            />
                            <TouchableOpacity
                                style={[Styles.aslCenter]}
                                disabled={this.state.KMreading === '999998'}
                                onPress={() => this.OdometerReadingValidate(this.state.KMreading, 'Increment')}
                            >
                                <Text
                                    style={[styles.IncrementButton, {
                                        borderColor: this.state.KMreading === '999998' ? '#f5f5f5' : '#000',
                                        color: this.state.KMreading === '999998' ? '#f5f5f5' : '#000'
                                    }]}>+</Text></TouchableOpacity>
                        </View>
                    }
                />
                {/*ODOMETER READINGS PIC*/}
                {
                    this.state.checkOdometerReading
                        ?
                        <View>
                            <View style={[Styles.row, Styles.aitCenter, Styles.mTop5,]}>
                                <TouchableOpacity
                                    onPress={() => {
                                        // this.selectImage()
                                        this.selectImage('CAMERA')
                                        // this.setState({imageSelectionModal:true})

                                        // this.setState({imageType:'PROFILE_PIC'},()=>{
                                        //     this.imageUpload('CAMERA')
                                        // })
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

    selectImage(uploadType) {
        const self = this;
        Services.checkImageUploadPermissions(uploadType, (response) => {
             let image = response.image
            let formData = response.formData
            let userImageUrl = image.path

                    self.setState({
                        spinnerBool: false,
                        odometerImageURL: image.path,
                        odometerImageFormData:formData
                    }, () => {
                        self.uploadImage(formData)
                        // Utils.dialogBox("Image Uploaded", '')
                    })
        })
    }

    uploadImage(formData){
        const self = this;
        let apiURL = Config.routes.BASE_URL + Config.routes.ODOMETER_READINGS_IMAGE + '&shiftId='+ self.state.StartShiftDetails.id + "&name=startOdometerReadingUpload"
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

    //API CALL to get profile based on phone number search
    getEnteredPhoneNumberProfiles(searchNumber,) {
        const {usersList, page} = this.state;
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_PROFILES_BASED_ON_PHONE_NUMBER_SEARCH + 'siteCode='+self.state.StartShiftDetails.attrs.siteCode +'&phoneNumber='+searchNumber ;
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


    rotate(){
        let newRotation = JSON.parse(this.state.imageRotate) + 90;
        if(newRotation >= 360){
            newRotation =- 360;
        }
        this.setState({
            imageRotate: JSON.stringify(newRotation),
        })
    }


    onRefresh() {
        //Clear old data of the list
        this.setState({dataSource: []});
        //Call the Service to get the latest data
        this.StartShiftDetails();
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
        const StartShiftDetails = this.state.StartShiftDetails;
        const {checkOdometerReading} =this.state;
        return (
            <View style={[{flex: 1, backgroundColor: "#fff"}]}>
                <HomeNoticeScreen/>
                {
                    this.state.StartShiftDetails
                        ?
                        <View style={[{flex: 1, backgroundColor: "#fff"}]}>
                            {this.renderSpinner()}
                            <Appbar.Header theme={theme} style={[Styles.bgDarkRed]}>
                                <Appbar.BackAction onPress={() => {
                                    this.onBack()
                                }}/>
                                <Appbar.Content theme={theme}
                                                title={new Date(this.state.StartShiftDetails.reportingTime).toDateString()}
                                                subtitle=""/>
                                <Appbar.Action icon="phone"
                                               onPress={() => this.setState({ModalSupervisorVisible: true})}/>
                                <Appbar.Action icon="autorenew" onPress={() => {
                                    this.StartShiftDetails()
                                }}/>
                            </Appbar.Header>

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
                                        <View style={[Styles.aslCenter]}>
                                            {
                                                StartShiftDetails.userRole === 1
                                                    ?
                                                    <FastImage style={[Styles.img70, Styles.p10]}
                                                               source={LoadImages.disabledDA}/>
                                                    :
                                                    StartShiftDetails.userRole === 5
                                                        ?
                                                        <FastImage style={[Styles.img70, Styles.p10]}
                                                                   source={LoadImages.disabledDriver}/>
                                                        :
                                                        StartShiftDetails.userRole === 10
                                                            ?
                                                            <FastImage style={[Styles.img70, Styles.p10]}
                                                                       source={LoadImages.disabledDDA}/>
                                                            :
                                                            StartShiftDetails.userRole === 15
                                                                ?
                                                                <FastImage style={[Styles.img70, Styles.p10]}
                                                                           source={LoadImages.disabledLabourer}/>
                                                                :
                                                                <FastImage style={[Styles.img70, Styles.p10]}
                                                                           source={LoadImages.disabledSupervisor}/>
                                            }
                                        </View>
                                        <View pointerEvents="none">
                                            <FastImage style={{width: 70, height: 70}}
                                                       source={LoadImages.disabledENDPOINT}/>
                                        </View>
                                    </View>
                                </View>
                                {/*TRIP TYPE DROPDOWN*/}
                                {
                                    StartShiftDetails.requireTripType && this.state.ordersCount === 0
                                        ?
                                        <View style={[Styles.marH10, Styles.flex1,Styles.marV10, {marginTop: 15}]}>
                                            <Text  style={[Styles.colorBlue, Styles.f16, Styles.ffMbold, Styles.marV10,Styles.marH5]}>Select
                                                Operations Type</Text>
                                            <Card style={[styles.shadow, ]}
                                                  onPress={() => {
                                                      this.setState({tripTypeSelectionModal: true})
                                                  }}>
                                                <Card.Title
                                                    style={[Styles.p5, Styles.bw1, {borderColor: this.state.selectedTripType === '' ? 'red' : 'green'}]}
                                                    subtitleStyle={themeSubtitle}
                                                    titleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                                    title={this.state.selectedTripType === '' ? 'SELECT OPERATIONS TYPE' : this.state.selectedTripType}
                                                    left={() => <MaterialIcons name="merge-type" size={45}
                                                                               color="#000"/>}
                                                    right={() => <Ionicons
                                                        style={[Styles.marH5, {paddingRight: 10}]}
                                                        name="ios-arrow-forward" size={35}
                                                        color="#000"/>}
                                                />
                                            </Card>
                                        </View>
                                        :
                                        null
                                }


                                {this.state.ordersCount > 0 ?
                                    // if ordersCount is greater than zero showing count of Orders
                                    <View style={[Styles.marH10, Styles.flex1, {marginTop: 15}]}>
                                        <Card
                                            style={[Styles.ProfileScreenCardshadow, Styles.mTop10,Styles.marH5, {marginBottom: 15}]}>
                                            <Card.Title
                                                style={[Styles.p5,]}
                                                subtitleStyle={themeSubtitle}
                                                titleStyle={[Styles.f16, Styles.cBlk,Styles.ffMbold]}
                                                title='Orders Count'
                                                left={() => <FastImage style={[Styles.img40]}
                                                                       source={LoadImages.pickup}/>}
                                                right={() =>
                                                    <View
                                                        style={[Styles.row, Styles.aslCenter, {paddingRight: 10}]}>
                                                        <Text style={[Styles.txtAlignCen, {
                                                            width: 80,
                                                            fontWeight: 'bold',
                                                            fontSize: 17
                                                        }]}>{this.state.ordersCount}</Text>
                                                    </View>
                                                }
                                            />
                                        </Card>
                                        {
                                            StartShiftDetails.userRole >= 15 || StartShiftDetails.userRole === 1
                                                ?
                                                null
                                                :
                                                this.returnOdometerCard()
                                        }
                                    </View>
                                    :
                                    //VIEW CONTAINS CLIENT-USERID,ODOMETER READINGS,PACKAGES
                                    this.state.selectedTripValue === "NO_LOAD"
                                        ?
                                        this.state.UserFlow === "SITE_ADMIN"
                                            ?
                                            // SUPERVISORS REASON TO END SHIFT
                                            <View style={[Styles.marH5]}>
                                                <Text
                                                    style={[Styles.colorBlue, Styles.f16, Styles.ffMbold, Styles.marH10]}>Reason
                                                    for supervisor ending shift</Text>
                                                <View style={[Styles.p5, Styles.m10, Styles.bw1,
                                                    {borderColor: this.state.supervisorsReason === '' || this.state.errorSupervisorsReason ? 'red' : 'green'}]}>
                                                    <TextInput
                                                        style={[]}
                                                        placeholder={'Enter Reason'}
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
                                        :
                                        <View
                                            style={[Styles.marH10, Styles.flex1, {marginTop: StartShiftDetails.requireTripType ? 0 : 15}]}>

                                            {/*user cominedID VIEW*/}
                                            {
                                                StartShiftDetails.requireClientLoginId
                                                ?
                                                    <View>
                                                    <View style={[Styles.bgWhite,Styles.p10,Styles.marH5,Styles.OrdersScreenCardshadow,
                                                        Styles.bw1, {borderColor: this.state.searchPhoneNumber.length === 10  &&
                                                            (this.state.phoneNumberSearchData ? this.state.phoneNumberSearchData.existedUser : false)
                                                                ? 'green' : 'red'}]}>
                                                        <View>
                                                            <Text
                                                                style={[Styles.ffRBold, Styles.f16,Styles.cGrey33,Styles.alignCenter]}>Client Login Id</Text>
                                                            <RadioButton.Group
                                                                onValueChange={searchPhoneNumberOthers => this.setState({searchPhoneNumberOthers},()=>{
                                                                    if (searchPhoneNumberOthers === false){
                                                                        this.getEnteredPhoneNumberProfiles(StartShiftDetails.phoneNumber)
                                                                    }else {
                                                                        this.setState({searchPhoneNumber:'',phoneNumberSearchData:[]})
                                                                    }
                                                                })}
                                                                value={this.state.searchPhoneNumberOthers}>
                                                                <View style={[Styles.row, Styles.aslCenter,]}>
                                                                    <View style={[Styles.row, Styles.alignCenter]}>
                                                                        <RadioButton value={false}/>
                                                                        <Text
                                                                            style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f16]}>Self</Text>
                                                                    </View>
                                                                    <View style={[Styles.row, Styles.alignCenter]}>
                                                                        <RadioButton value={true}/>
                                                                        <Text
                                                                            style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f16]}>Other</Text>
                                                                    </View>
                                                                </View>
                                                            </RadioButton.Group>
                                                        </View>

                                                        {
                                                            this.state.searchPhoneNumberOthers
                                                                ?
                                                                <Searchbar
                                                                    style={[Styles.bgWhite, Styles.mTop10, Styles.bw1]}
                                                                    isFocused="false"
                                                                    placeholder="Search Phone Number"
                                                                    maxLength={10}
                                                                    keyboardType={'numeric'}
                                                                    returnKeyType="done"
                                                                    onSubmitEditing={() => {Keyboard.dismiss()}}
                                                                    onChangeText={searchPhoneNumber => {
                                                                        this.setState({searchPhoneNumber}, () => {
                                                                            if (searchPhoneNumber.length === 10) {
                                                                                this.getEnteredPhoneNumberProfiles(this.state.searchPhoneNumber)
                                                                            }else {
                                                                                this.setState({phoneNumberSearchData:[]})
                                                                            }
                                                                        })
                                                                    }}
                                                                    value={this.state.searchPhoneNumber}
                                                                />
                                                                :
                                                                null
                                                        }

                                                        {
                                                            this.state.phoneNumberSearchData
                                                                ?
                                                                this.state.phoneNumberSearchData.existedUser
                                                                ?
                                                                <View>
                                                                    {Services.returnUserProfileCardShiftScreens(this.state.phoneNumberSearchData,this.state.searchPhoneNumber)}
                                                                </View>
                                                                    :
                                                                    this.state.phoneNumberSearchData.existedUser === false
                                                                    ?
                                                                    <Text style={[Styles.f16,Styles.ffRBold,Styles.cRed,Styles.padV5,Styles.aslStart]}>User not in the system,please enter the registered phone number</Text>
                                                                        :
                                                                        null
                                                                :
                                                                null
                                                        }
                                                    </View>
                                                    </View>
                                                    :
                                                    null
                                            }

                                            {/*ODOMETER READING*/}
                                            {
                                                StartShiftDetails.userRole >= 15 || StartShiftDetails.userRole === 1
                                                    ?
                                                    null
                                                    :
                                                    this.returnOdometerCard()
                                            }

                                            {/*PACKAGES LIST*/}
                                            {
                                                StartShiftDetails.userRole >= 15 || StartShiftDetails.userRole === 5
                                                    ?
                                                    null
                                                    :
                                                    <ScrollView
                                                        persistentScrollbar={true}
                                                        style={[Styles.flex1]}>
                                                        {
                                                            this.state.listOfPackages.length === 0
                                                                ?
                                                                <Card.Content
                                                                    style={[Styles.aslCenter, Styles.padV15]}>
                                                                    <Title
                                                                        style={[Styles.cBlk, Styles.f20, Styles.ffMregular, Styles.aslCenter]}>
                                                                        Something is wrong, Please call your
                                                                        supervisor and
                                                                        mention
                                                                        error 'Package Type Missing' in shifts.
                                                                    </Title>
                                                                </Card.Content>
                                                                :
                                                                <FlatList
                                                                    data={this.state.listOfPackages}
                                                                    renderItem={({
                                                                                     item,
                                                                                     index
                                                                                 }) => this.PackagesData(item, index)}
                                                                    keyExtractor={(index, item) => JSON.stringify(item) + index}
                                                                    extraData={this.state}
                                                                />
                                                        }
                                                    </ScrollView>
                                            }

                                            {/*ROUTE TEXTINPUT*/}
                                            {
                                                StartShiftDetails.userRole <= 15
                                                    ?
                                                    <View>
                                                        <Text
                                                            style={[Styles.colorBlue, Styles.f16, Styles.ffMbold, Styles.marH10]}>Enter
                                                            Route </Text>
                                                        <View style={[Styles.p5, Styles.m10, Styles.bw1,]}>
                                                            <TextInput
                                                                style={[]}
                                                                placeholder={'Enter Route'}
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
                                                StartShiftDetails.requireTripSheetId
                                                    ?
                                                    <View>
                                                        <Text
                                                            style={[Styles.colorBlue, Styles.f16, Styles.ffMbold, Styles.marH10]}>Enter Tripsheet Id </Text>
                                                        <View style={[Styles.p5, Styles.m10, Styles.bw1,]}>
                                                            <TextInput
                                                                style={[]}
                                                                placeholder={'Enter Trip Sheet Id'}
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
                                                StartShiftDetails.requirePartnerDetails
                                                    ?
                                                    <View>
                                                        <Text
                                                            style={[Styles.colorBlue, Styles.f16, Styles.ffMbold, Styles.marH10]}>Enter Partner Name</Text>
                                                        <View style={[Styles.p5, Styles.m10, Styles.bw1,]}>
                                                            <TextInput
                                                                style={[]}
                                                                placeholder={'Enter Partner Name'}
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

                                }


                            </ScrollView>

                            {/*WILL DISPLAY for >=15 ROLES ,SHOWING LOADER AND SHIFT STATUS*/}
                            {
                                StartShiftDetails.userRole >= 15
                                    ?
                                    Services.returnStatusText(StartShiftDetails.status)
                                    :
                                    null
                            }

                            {/* FOOTER BUTTON*/}


                            <Card style={[Styles.footerUpdateButtonStyles]}>
                                {
                                    this.state.ordersCount > 0
                                        ?
                                        StartShiftDetails.userRole === 5 || StartShiftDetails.userRole === 10
                                            ?
                                            this.swipeButtonStartShift(this.state.defaultOdometer !== true)
                                            :
                                        this.swipeButtonStartShift(false)
                                        :
                                        this.state.selectedTripValue === "NO_LOAD"
                                            ?
                                            this.state.SupervisorEnteredReason === false && this.state.UserFlow === 'SITE_ADMIN'
                                                ?
                                                this.swipeButtonStartShift(true)
                                                :
                                                this.swipeButtonStartShift(false)
                                            :
                                            StartShiftDetails.userRole === 1
                                                ?
                                                this.swipeButtonStartShift(!((StartShiftDetails.requireClientLoginId ? this.state.searchPhoneNumber.length === 10  &&
                                                    (this.state.phoneNumberSearchData ? this.state.phoneNumberSearchData.existedUser : false) : true) && this.state.PackagesDisplay === true))
                                                :
                                                StartShiftDetails.userRole === 5
                                                    ?
                                                    this.swipeButtonStartShift(this.state.defaultOdometer !== true)
                                                    :
                                                    StartShiftDetails.userRole === 10
                                                        ?
                                                        this.swipeButtonStartShift(!((StartShiftDetails.requireClientLoginId ? this.state.searchPhoneNumber.length === 10  &&
                                                            (this.state.phoneNumberSearchData ? this.state.phoneNumberSearchData.existedUser : false) :true) && this.state.defaultOdometer === true && this.state.PackagesDisplay === true))
                                                        :
                                                        StartShiftDetails.userRole >= 15
                                                            ?
                                                            this.swipeButtonStartShift(false)
                                                            :
                                                            null
                                }
                            </Card>


                            {/*MODALS START*/}

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
                                            {Services.returnWareHouseCards(this.state.StartShiftDetails)}
                                            <CDismissButton title={this.state.StartShiftDetails.clientName}
                                                            onPress={() => this.setState({
                                                                ModalWareHouse: false,
                                                                ModalOpenAppURL: true
                                                            })} showButton={'clientName'}/>
                                            <CDismissButton onPress={() => this.setState({ModalWareHouse: false})}
                                                            showButton={'dismiss'}/>
                                        </Card>

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
                                                <FastImage style={[Styles.aslCenter, Styles.img100, Styles.p10]}
                                                           source={LoadImages.siteWareHouse}/>
                                                <Title
                                                    style={[Styles.cBlk, Styles.f20, Styles.ffMbold, Styles.aslCenter,]}>{StartShiftDetails.clientName}-CLIENT</Title>
                                            </Card.Content>

                                            <TouchableOpacity
                                                disabled={StartShiftDetails.attributes.appLinkForAndroid === null}
                                                onPress={() => {
                                                    Linking.openURL(StartShiftDetails.attributes.appLinkForAndroid)
                                                }}>
                                                <View
                                                    style={[Styles.marV5, Styles.bcLYellow, Styles.bw1, Styles.row, Styles.bgWhite, Styles.jSpaceBet, Styles.p5]}>
                                                    <View style={[Styles.jSpaceArd, Styles.row]}>
                                                        <View style={[Styles.aitCenter, {width: 60, padding: 6}]}>
                                                            <FontAwesome name="mobile-phone" size={45}
                                                                         color="#000"/>
                                                        </View>
                                                        <View style={[Styles.aslCenter, {padding: 6}]}>
                                                            <Text
                                                                style={[Styles.cBlk, Styles.ffMbold, Styles.aslCenter, Styles.f18]}>APP
                                                                LINK {StartShiftDetails.attributes.appLinkForAndroid === null ? '(not available)' : null}</Text>
                                                        </View>
                                                    </View>
                                                    <View/>
                                                </View>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                disabled={StartShiftDetails.attributes.appLinkForWeb === null}
                                                onPress={() => {
                                                    Linking.openURL(StartShiftDetails.attributes.appLinkForWeb)
                                                }}>
                                                <View
                                                    style={[Styles.marV5, Styles.bcLYellow, Styles.bw1, Styles.row, Styles.bgWhite, Styles.jSpaceBet, Styles.p5]}>
                                                    <View style={[Styles.jSpaceArd, Styles.row]}>
                                                        <View style={[Styles.aitCenter, {width: 60, padding: 6}]}>
                                                            <FontAwesome name="laptop" size={45}
                                                                         color="#000"/>
                                                        </View>
                                                        <View style={[Styles.aslCenter, {padding: 6}]}>
                                                            <Text
                                                                style={[Styles.cBlk, Styles.ffMbold, Styles.aslCenter, Styles.f18]}>WEB
                                                                LINK {StartShiftDetails.attributes.appLinkForWeb === null ? '(not available)' : null}</Text>
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


                            {/*MODAL FOR SITE SUPERVISOR LIST VIEW*/}
                            <SupervisorsModal visible={this.state.ModalSupervisorVisible}
                                              closeModal={() => this.setState({ModalSupervisorVisible: false})}
                                              siteName={this.state.StartShiftDetails.siteName}
                                              children={this.state.SupervisorDetails}/>

                            {/*TRIP TYPE SELECTION client based*/}
                            <Modal transparent={true}
                                   visible={this.state.tripTypeSelectionModal}
                                   animated={true}
                                   animationType='slide'
                                   onRequestClose={() => {
                                       this.setState({tripTypeSelectionModal: false})
                                   }}>
                                <View style={[Styles.modalfrontPosition]}>
                                    <View
                                        style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                            width: Dimensions.get('window').width - 80,
                                        }]]}>
                                        <View style={[Styles.bgWhite, {height: Dimensions.get('window').height / 2}]}>
                                            <View style={Styles.aslCenter}>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.colorBlue, Styles.f20, Styles.m10, Styles.mBtm10]}>Select
                                                    Operations Type</Text>
                                            </View>
                                            <ScrollView>
                                                <List.Section>
                                                    {
                                                        this.state.tripTypeList.map(item => {
                                                            return (
                                                                <List.Item
                                                                    onPress={() => this.setState({
                                                                        tripTypeSelectionModal: false,
                                                                        selectedTripType: item.name,
                                                                        selectedTripValue: item.key,
                                                                        // tripTypeDetails: true
                                                                    })}
                                                                    style={{marign: 0, padding: 0,}}
                                                                    theme={theme}
                                                                    key={item.value}
                                                                    title={item.name}
                                                                    titleStyle={[Styles.ffMregular, Styles.colorBlue, Styles.f16, Styles.aslCenter, Styles.bw1, Styles.br100,
                                                                        this.state.selectedTripValue === item.key ? [Styles.cWhite, Styles.bgDarkRed, Styles.bw0] : [Styles.colorBlue, Styles.bgWhite, Styles.bw1],
                                                                        {
                                                                            width: 210,
                                                                            textAlign: 'center',
                                                                            paddingHorizontal: 5,
                                                                            paddingVertical: 10
                                                                        }]}
                                                                />
                                                            );
                                                        })
                                                    }
                                                </List.Section>
                                            </ScrollView>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => {
                                        this.setState({tripTypeSelectionModal: false})
                                    }} style={{marginTop: 20}}>
                                        {LoadSVG.cancelIcon}
                                    </TouchableOpacity>
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
                                                        this.selectImage('CAMERA')
                                                    })}}
                                                    activeOpacity={0.7} style={[Styles.marV10,Styles.row,Styles.aitCenter]}>
                                                    <FontAwesome name="camera" size={24} color="black" />
                                                    <Text style={[Styles.f20,Styles.cBlk,Styles.ffLBold,Styles.padH10]}>Take Photo</Text>
                                                </TouchableOpacity>
                                                <Text style={[Styles.ffLBlack,Styles.brdrBtm1,Styles.mBtm15]}/>
                                                <TouchableOpacity
                                                    onPress={()=>{this.setState({imageSelectionModal:false},()=>{
                                                        this.selectImage('LIBRARY')
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
                        :
                        <CSpinner/>
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
        appbar: {
            backgroundColor: "white"
        }
        ,
        container: {
            marginTop: 10
        }
        ,
        surface: {
            padding: 4,
            alignItems: "center",
            justifyContent: "center",
            elevation: 1
        }
        ,

        row: {
            marginLeft: 10,
            marginTop: 2,
            marginRight: 10
        }
        ,
        info: {
            fontSize: 14,
            marginLeft: 20,
            lineHeight: 20,
            marginTop: 5
        }
        ,
        infoP: {
            fontSize: 18,
            marginLeft: 20,
            lineHeight: 25,
            marginTop: 10,
        }
        ,
        IncrementButton: {
            borderWidth: 2,
            height: 30,
            width: 30,
            // borderColor: '#b2beb5',
            // paddingHorizontal: 12,
            // paddingVertical: 6,
            textAlign: "center",
            fontSize: 18
        }
        ,
        DecrementButton: {
            borderWidth: 2,
            height: 30,
            width: 30,
            // borderColor: '#b2beb5',
            // paddingHorizontal: 13,
            // paddingVertical: 6,
            textAlign: "center",
            fontSize: 18
        }
        ,
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
    }
);
