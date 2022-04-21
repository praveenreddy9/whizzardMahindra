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
    BackHandler, Modal, ActivityIndicator, Button, TextInput as Input, Keyboard, KeyboardAvoidingView
} from "react-native";
import {
    Appbar, Card, DefaultTheme, Title, ProgressBar, RadioButton
} from "react-native-paper";
import {Styles, CText, CSpinner, LoadImages, SupervisorsModal} from "./common";
import Utils from './common/Utils';
import Config from "./common/Config"
import Services from "./common/Services";
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/dist/FontAwesome';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import Octicons from 'react-native-vector-icons/dist/Octicons';
import FastImage from 'react-native-fast-image'
import OfflineNotice from './common/OfflineNotice';
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";


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

export default class CompletedShiftScreen extends Component {

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
            spinnerBool: false,
            SupervisorDetails: '',
            CurrentShiftId: '',
            clientUserIdList: '',
            refreshing: false,
            ModalSupervisorVisible: false,
            kilometer: '',
            CompletedShiftDetails: '',
            listOfPackages: [],
            ModalClientUserID: false,
            selectedClientUserID: '',
            clientID: '',
            clientUserId: null,
            clientIDButton: true,
            KMreading: '0',
            PackagesDisplay: true,
            UserFlow: '',
            PackagesTypeNULL: false,
            ModalWareHouse: false,
            ModalonDutyDelivery: false,
            ModalshiftEnded: false,
            defaultOdometer: false,
            packagesCount: '0',
            defaultClientID: false,
            currentUserId: '',
            ModalOpenAppURL: false,
            errorCreateClientID: null,
            toOpenPackages: false,
            selectedPackageStatusList: [],
            finalSum: 0,
            pickUpPackagesInfo: [],
            pickUpInitialInfo: [],
            pickUpPackagesDisplay: true,
            pickupPackagesModal: false, route: '',filteredData:[],searchStrng:'',

            searchPhoneNumber:'',searchPhoneNumberOthers:false,
        };

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
            CurrentShiftId: self.props.navigation.state.params.CurrentShiftId,
            UserFlow: self.props.navigation.state.params.UserFlow,
        })
        self.CompletedShiftDetails();
    };


    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    };

    errorHandling(error) {
        const self = this;
        console.log('errorHandling in completed shift', error.response);
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

//API CALL FOR UPDATE SHIFT DETAILS after Shift End
    CompletedShiftDetails() {
        const self = this;
        const CurrentShiftId = self.props.navigation.state.params.CurrentShiftId;
        const currentUserId = self.props.navigation.state.params.currentUserId;
        const getShiftDetails = Config.routes.BASE_URL + Config.routes.GET_STARTSHIFT_DETAILS + '?shiftId=' + CurrentShiftId + '&userId=' + currentUserId;
        const body = '';
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(getShiftDetails, "GET", body, function (response) {
                let i;
                if (response.status === 200) {
                    // console.log('CompletedShiftDetails res', response.data);
                    if (response.data != null) {
                        let CompletedShiftDetails = response.data;
                        let superVisorList = []
                        if (CompletedShiftDetails.siteSupervisorsList) {
                            superVisorList = CompletedShiftDetails.siteSupervisorsList;
                        }
                        self.setState({
                            CompletedShiftDetails: CompletedShiftDetails,
                            SupervisorDetails: superVisorList,
                            clientUserIdList: CompletedShiftDetails.clientUserIds,
                            route: CompletedShiftDetails.route,
                            adhocShiftAmountPaid: CompletedShiftDetails.adhocShiftAmountPaid ? JSON.stringify(CompletedShiftDetails.adhocShiftAmountPaid):'',
                            adhocAmount: CompletedShiftDetails.adhocShiftAmountPaid ? JSON.stringify(CompletedShiftDetails.adhocShiftAmountPaid):'',
                             clientEmployeeId: CompletedShiftDetails.clientEmployeeId,
                            tripSheetId: CompletedShiftDetails.tripSheetId,
                            partnerDetails: CompletedShiftDetails.partnerDetails,
                            refreshing: false,
                            spinnerBool: false,
                            cashCollected: '0',
                            filteredData: [], searchStrng: ''
                        },()=>{
                            if (CompletedShiftDetails.requireClientLoginId){
                                self.setState({searchPhoneNumber:CompletedShiftDetails.clientLoginIdMobileNumber,searchPhoneNumberOthers:CompletedShiftDetails.others,},()=>{
                                    self.getEnteredPhoneNumberProfiles(CompletedShiftDetails.clientLoginIdMobileNumber)
                                })
                            }
                        });

                        if (CompletedShiftDetails.userRole === 5 || CompletedShiftDetails.userRole === 10) {
                            if (CompletedShiftDetails.endOdometerReading != null) {
                                self.setState({
                                    KMreading: JSON.stringify(CompletedShiftDetails.endOdometerReading),
                                    defaultOdometer: true
                                })
                            }
                        }


                        // if (CompletedShiftDetails.requiresClientUserId === false) {
                        //     self.setState({defaultClientID: true})
                        // }
                        // //it will be set by length
                        // if (CompletedShiftDetails.clientUserIds != null) {
                        //     if (CompletedShiftDetails.clientUserIds.length === 1) {
                        //         self.setState({
                        //             selectedClientUserID: CompletedShiftDetails.clientUserIds[0].clientUserId,
                        //             defaultClientID: true
                        //         })
                        //     }
                        // }
                        // //it has already selected client id
                        // if (CompletedShiftDetails.clientUserIdInfo != null) {
                        //     self.setState({
                        //         selectedClientUserID: CompletedShiftDetails.clientUserIdInfo.clientUserId,
                        //         clientUserId: CompletedShiftDetails.clientUserIdInfo.id,
                        //         defaultClientID: true
                        //     })
                        // }
                        if (CompletedShiftDetails.cashCollected != null) {
                            self.setState({
                                cashCollected: JSON.stringify(CompletedShiftDetails.cashCollected)
                            })
                        }

                        if (CompletedShiftDetails.userRole === 1 || CompletedShiftDetails.userRole === 10) {
                            if (CompletedShiftDetails.deliveredPackagesInfo != null) {
                                if (CompletedShiftDetails.deliveredPackagesInfo.length > 0) {
                                    let PackagesList = CompletedShiftDetails.deliveredPackagesInfo;
                                    const packagesInfo = [];
                                    for (let i = 0; i < PackagesList.length; i++) {
                                        let sample = {};
                                        sample.value = JSON.stringify(PackagesList[i].count);
                                        sample.packageTypeImageUpload = PackagesList[i].packageTypeImageUpload;
                                        sample.displayName = PackagesList[i].displayName;
                                        sample.packageTypeId = PackagesList[i].packageTypeId;
                                        sample.includeInPackageCount = PackagesList[i].includeInPackageCount;
                                        sample.type = PackagesList[i].type;
                                        sample.maximumValue = PackagesList[i].maximumValue;
                                        sample.minimumValue = PackagesList[i].minimumValue;
                                        sample.statuses = PackagesList[i].statuses;
                                        sample.statusTotalCount = JSON.parse(PackagesList[i].count);
                                        packagesInfo.push(sample);
                                    }
                                    self.setState({listOfPackages: packagesInfo, spinnerBool: false});
                                }
                            } else {
                                self.setState({listOfPackages: [], spinnerBool: false});
                            }

                            const packagesInfo = [];
                            if (CompletedShiftDetails.pickUpPackagesInfo != null) {
                                if (CompletedShiftDetails.pickUpPackagesInfo.length > 0) {
                                    let PackagesList = CompletedShiftDetails.pickUpPackagesInfo;

                                    for (i = 0; i < PackagesList.length; i++) {
                                        let sample = {};
                                        sample.value = JSON.stringify(PackagesList[i].count);
                                        sample.packageTypeImageUpload = PackagesList[i].packageTypeImageUpload;
                                        sample.displayName = PackagesList[i].displayName;
                                        sample.packageTypeId = PackagesList[i].packageTypeId;
                                        sample.includeInPackageCount = PackagesList[i].includeInPackageCount;
                                        sample.type = PackagesList[i].type;
                                        sample.maximumValue = PackagesList[i].maximumValue;
                                        sample.minimumValue = PackagesList[i].minimumValue;
                                        sample.statuses = PackagesList[i].statuses;
                                        sample.packagesInitialCount = JSON.stringify(PackagesList[i].count);
                                        // sample.statusTotalCount = JSON.parse(PackagesList[i].count);
                                        sample.statusTotalCount = 0;
                                        packagesInfo.push(sample);
                                    }
                                    self.setState({
                                        pickUpPackagesInfo: packagesInfo,
                                        pickUpInitialInfo: packagesInfo,
                                        spinnerBool: false
                                    });
                                }
                            } else {
                                self.setState({pickUpPackagesInfo: [], pickUpInitialInfo: [], spinnerBool: false});
                            }
                            self.pickUpPackagesTotalCount(packagesInfo)
                        }

                        // self.packagesTotalCount()
                        self.checkPackagesStatus();


                    } else {
                        Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
                        self.setState({CompletedShiftDetails: [], spinnerBool: false});
                    }
                }
            }, function (error) {
                // console.log("get completed shift error", error.response);
                self.errorHandling(error);
            })
        });
    }

    //API CALL to get profile based on phone number search
    getEnteredPhoneNumberProfiles(searchNumber,) {
        const {usersList, page} = this.state;
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_PROFILES_BASED_ON_PHONE_NUMBER_SEARCH + 'siteCode='+self.state.CompletedShiftDetails.attrs.siteCode +'&phoneNumber='+searchNumber ;
        const body = {};
        // console.log("profile search body", body,'apiURL==>',apiURL);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, function (response) {
                if (response.status === 200) {
                    // console.log("profile search resp200", response);
                    self.setState({
                        spinnerBool: false,
                        searchPhoneNumber:searchNumber,
                        phoneNumberSearchData:response.data,
                        selectedClientUserID:'',
                        clientEmployeeId:''
                    })
                }
            }, function (error) {
                // console.log('profile search error',error, error.response)
                self.errorHandling(error)
            });
        })
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
        // console.log(humanReadable); //{hours: 0, minutes: 30}
        // this.setState({ ShiftDuration: humanReadable })
        return (
            <Text
                style={[Styles.ffMbold, Styles.f16]}> ({humanReadable.hours === 0 && humanReadable.minutes === 0 ? '0 m' : humanReadable.hours === 0 ? null : humanReadable.hours + 'h '}{humanReadable.minutes === 0 ? null : humanReadable.minutes + 'm'} ago)</Text>
        )
    }


    //clientUserIdSelect from assigned in web ,calls fun flatlist from pop-up
    clientUserIdSelect(item) {
        return (
            <TouchableOpacity onLongPress={() => Utils.dialogBox(item.clientUserId, '')}
                              onPress={() => {
                                  this.setState({
                                      ModalClientUserID: false,
                                      selectedClientUserID: item.clientUserId,
                                      clientUserId: item.id,
                                      defaultClientID: true
                                  })
                              }}>
                <Card style={[styles.shadow, Styles.marV5]}>
                    <Card.Title theme={theme}
                                titleStyle={[Styles.f16, Styles.cBlk]}
                                style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite, {fontFamily: "Muli-Regular"}]}
                                title={item.clientUserId}
                                right={() => <Ionicons style={[Styles.marH5, {paddingRight: 10}]}
                                                       name="ios-arrow-forward" size={40}
                                                       color="#000"/>}
                    />
                </Card>
            </TouchableOpacity>
        )
    }


//Odometer reading validate
    odometerReading(KMreading) {
        let value = Math.trunc(parseInt(KMreading));
        // console.log('value Tin',value)
        const updatedKMreading = JSON.stringify(value);

        let num = updatedKMreading.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');

        if (num > this.state.CompletedShiftDetails.startOdometerReading) {
            this.setState({defaultOdometer: true, KMreading: num})
        } else {
            this.setState({defaultOdometer: false, KMreading: num})
        }
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
                if (value <= this.state.CompletedShiftDetails.startOdometerReading) {
                    // const tempValue = this.state.CompletedShiftDetails.startOdometerReading;
                    this.setState({KMreading: JSON.stringify(value), defaultOdometer: false});
                    // Utils.dialogBox('Reached Minimum Value', '');
                } else if (value > 999999) {
                    const tempValue = 999999 - 1;
                    this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: true});
                    Utils.dialogBox('Reached Maximum Value', '');
                } else {
                    const tempValue = value - 1;
                    if (tempValue === this.state.CompletedShiftDetails.startOdometerReading) {
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

    ValidateShiftCompleted() {
        const CompletedShiftDetails = this.state.CompletedShiftDetails;
        var textInputs = this.state.listOfPackages;
        let deliveredPackagesInfo = [];
        for (let i = 0; i < textInputs.length; i++) {
            let sample = {};
            sample.type = textInputs[i].type;
            sample.packageTypeId = textInputs[i].packageTypeId;
            sample.includeInPackageCount = textInputs[i].includeInPackageCount;
            sample.displayName = textInputs[i].displayName;
            sample.maximumValue = textInputs[i].maximumValue;
            sample.minimumValue = textInputs[i].minimumValue;
            sample.statuses = textInputs[i].statuses;
            sample.count = parseInt(textInputs[i].value);
            deliveredPackagesInfo.push(sample);
        }
        var tempData = this.state.pickUpPackagesInfo;
        let pickUpPackagesInfo = [];
        for (let i = 0; i < tempData.length; i++) {
            let sample = {};
            sample.type = tempData[i].type;
            sample.packageTypeId = tempData[i].packageTypeId;
            sample.includeInPackageCount = tempData[i].includeInPackageCount;
            sample.displayName = tempData[i].displayName;
            sample.maximumValue = tempData[i].maximumValue;
            sample.minimumValue = tempData[i].minimumValue;
            sample.statuses = tempData[i].statuses;
            sample.count = parseInt(tempData[i].value);
            pickUpPackagesInfo.push(sample);
        }
        let body ={};
        {
            CompletedShiftDetails.userRole === 10
                ?
                body = JSON.stringify({
                    'deliveredPackagesInfo': deliveredPackagesInfo,
                    'pickUpPackagesInfo': pickUpPackagesInfo,
                    'endOdometerReading': this.state.KMreading,
                    'cashCollected': this.state.cashCollected,
                    'clientUserIdInfo': {id: this.state.clientUserId, clientUserId: this.state.selectedClientUserID},
                    'route': this.state.route,
                    'clientEmployeeId': this.state.clientEmployeeId,
                    'tripSheetId': this.state.tripSheetId,
                    'partnerDetails': this.state.partnerDetails,
                    'others':this.state.searchPhoneNumberOthers,
                    'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                })
                :
                CompletedShiftDetails.userRole === 5
                    ?
                    body = JSON.stringify({
                        'endOdometerReading': this.state.KMreading,
                        // 'clientUserIdInfo': {id: this.state.clientUserId, clientUserId: this.state.selectedClientUserID},
                        'route': this.state.route,
                        'clientEmployeeId': this.state.clientEmployeeId,
                        'tripSheetId': this.state.tripSheetId,
                        'partnerDetails': this.state.partnerDetails,
                        'others':this.state.searchPhoneNumberOthers,
                        'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                    })
                    :
                    CompletedShiftDetails.userRole === 1
                        ?
                        body = JSON.stringify({
                            'deliveredPackagesInfo': deliveredPackagesInfo,
                            'pickUpPackagesInfo': pickUpPackagesInfo,
                            'cashCollected': this.state.cashCollected,
                            'clientUserIdInfo': {
                                id: this.state.clientUserId,
                                clientUserId: this.state.selectedClientUserID
                            },
                            'route': this.state.route,
                            'clientEmployeeId': this.state.clientEmployeeId,
                            'tripSheetId': this.state.tripSheetId,
                            'partnerDetails': this.state.partnerDetails,
                            'others':this.state.searchPhoneNumberOthers,
                            'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                        })
                        :
                        CompletedShiftDetails.userRole >= 15
                            ?
                            body = JSON.stringify({
                                'deliveredPackagesInfo': null,
                                'pickUpPackagesInfo': null,
                                'cashCollected': null,
                                'clientUserIdInfo': null,
                                'route': null,
                                'clientEmployeeId': this.state.clientEmployeeId,
                                'tripSheetId': this.state.tripSheetId,
                                'partnerDetails': this.state.partnerDetails,
                                'others':this.state.searchPhoneNumberOthers,
                                'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                            })
                            :
                            null
        }

        // console.log('body====', body);
        this.ReadingsCountCOMPLETE(body);
    }

    //API CALL to UpdateShift after  STARTShift  or Before
    ReadingsCountCOMPLETE = (body) => {
        const CurrentShiftId = this.state.CurrentShiftId;
        // console.log('ReadingsCountCOMPLETE body', body);
        const self = this;
        const UpdateCompletedURL = Config.routes.BASE_URL + Config.routes.UPDATE_SHIFT + CurrentShiftId;
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(UpdateCompletedURL, "PUT", body, function (response) {
                if (response.status === 200) {
                    let updateData = response.data;
                    // console.log('ReadingsCountCOMPLETE end resp200', updateData);
                    self.setState({spinnerBool: false,})
                    Utils.dialogBox(updateData.message, '');
                    self.props.navigation.goBack()
                }
            }, function (error) {
                // console.log("update completed shift error", error.response);
                self.errorHandling(error);
            })
        });
    };

    odometerMaximum() {
        if (this.state.KMreading - this.state.CompletedShiftDetails.startOdometerReading <= 999) {
            return (
                <Text
                    style={[Styles.p5, Styles.aslCenter, Styles.ffMregular]}>{this.state.KMreading - this.state.CompletedShiftDetails.startOdometerReading} kms
                    for today's shift</Text>
            )
        } else {
            Utils.dialogBox('reading difference should be less than 1000', '')
            return (
                <Text style={[Styles.p5, Styles.aslCenter, Styles.ffMregular, Styles.cRed]}> reading difference should
                    be less than 1000</Text>
            )
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
            this.setState({PackageStatusButton: false})
        } else {
            this.setState({PackageStatusButton: true})
        }

        if (PackagesTypeNULL.length > 0) {
            this.setState({PackageStatusButton: false})
        } else {
            this.setState({PackageStatusButton: true})
        }

    }

    //DELIVERED PACKAGES TOTAL SET
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

                                        // if ((parseInt(val) + this.state.finalSum) >= TargetValue) {
                                        //     Utils.dialogBox('Maximum value is ===' + TargetValue, '');
                                        // }else {

                                        if (val > TargetValue) {
                                            Utils.dialogBox('Maximum value is ' + TargetValue, '');
                                        } else if (val < 0) {
                                            // Utils.dialogBox('Minimum value is ' + tempItem.minimumValue, '');
                                        } else {
                                            // console.log('else val ',val);
                                            if (isNaN(val)) {
                                                // console.log("Value is Not Number",val);
                                                tempItem.count = val.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');
                                            } else {
                                                // console.log("Value is Number",val);
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
                                            // this.setState({selectedPackageStatusList: tempData});
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

    //DELIVERED PACKAGES INCREMENT
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

    //DELIVERED PACKAGES DECREMENT
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

    //DELIVERED PACKAGES STATUES CHECK
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

    //DELIVERED PACKAGES STATUES VALIDATION
    updatePackagesStatusList(packageData, index) {
        // console.log('updatePackagesStatusList packageData item', packageData);
        const self = this;
        self.setState({TargetValue: JSON.parse(packageData.value)})
        let finalTotal = [];
        if (packageData.statuses != null) {
            if (packageData.statuses.length > 0) {
                let statusesList = packageData.statuses;
                const packagesInfo = [];
                for (var i = 0; i < statusesList.length; i++) {
                    let sample = {};
                    sample.count = statusesList[i].count;
                    // sample.count = statusesList.length === 1?JSON.parse(packageData.value): statusesList[i].count;
                    sample.status = statusesList[i].status;
                    sample.primary = statusesList[i].primary;
                    packagesInfo.push(sample);
                    finalTotal.push(parseInt(statusesList[i].count === '' ? 0 : statusesList[i].count));
                }
                // console.log('packagesInfo',packagesInfo);
                let finalSum = finalTotal.reduce(function (a, b) {
                    return a + b;
                }, 0);
                self.setState({
                    selectedPackageStatusList: packagesInfo,
                    selectedPackageData: packageData,
                    finalSum: finalSum,
                    toOpenPackages: true
                });
            }
        } else {
            // console.log('else packagesInfo',packageData);
            self.setState({
                selectedPackageStatusList: [],
                selectedPackageData: packageData,
                finalSum: 0,
                toOpenPackages: true,
            });
        }

        this.packagesTotalCount(packageData.statuses)
    }


    //PICK UP PACKAGES TOTAL SET
    pickUpPackagesData(item, index) {
        // console.log('pickUpPackagesData item-->', item);
        return (
            <ScrollView
                persistentScrollbar={true}>
                <Card style={[styles.shadow, Styles.marV10]}>
                    <Card.Title
                        style={[Styles.p5, Styles.bw1,
                            {
                                borderColor: this.state.pickUpPackagesDisplay === true && this.state.pickUpPackagesInfo[index].value > '0' ? 'green'
                                    : this.state.pickUpPackagesDisplay === true ? 'orange'
                                        : this.state.pickUpPackagesInfo[index].value === '' || this.state.pickUpPackagesInfo[index].value === '0' ? 'red' : '#add8e6'
                            }
                        ]}
                        subtitleStyle={themeSubtitle}
                        titleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                        title={item.displayName}
                        left={() => <FastImage style={[Styles.img40]} source={LoadImages.pickup}/>}
                        right={() =>
                            <View style={[Styles.row, {paddingRight: 10}]}>
                                <TouchableOpacity
                                    style={[Styles.aslCenter]}
                                    disabled={this.state.pickUpPackagesInfo[index].value === JSON.stringify(item.minimumValue)}
                                    onPress={() => this.pickUpPackagesDecrement(item, index)}
                                >
                                    <Text style={[styles.IncrementButton,
                                        {
                                            borderColor: this.state.pickUpPackagesInfo[index].value === JSON.stringify(item.minimumValue) ? '#f5f5f5' : '#000',
                                            color: this.state.pickUpPackagesInfo[index].value === JSON.stringify(item.minimumValue) ? '#f5f5f5' : '#000'
                                        }
                                    ]}>-</Text></TouchableOpacity>
                                <TextInput
                                    style={[Styles.txtAlignCen, {width: 80, fontWeight: 'bold', fontSize: 17}]}
                                    selectionColor={"black"}
                                    // maxLength={item.maximumValue.length}
                                    placeholderTextColor='#666'
                                    keyboardType='numeric'
                                    value={this.state.pickUpPackagesInfo[index].value}
                                    onChangeText={(val) => {
                                        let tempItem = this.state.pickUpPackagesInfo[index];
                                        if (val > tempItem.maximumValue) {
                                            Utils.dialogBox('Maximum value is ' + tempItem.maximumValue, '');
                                        } else if (val < 0) {
                                            // Utils.dialogBox('Minimum value is ' + tempItem.minimumValue, '');
                                        } else {
                                            // console.log('on chnage into else====>val',val);
                                            let value = Math.trunc(val === '' ? '' : parseInt(val));
                                            val = JSON.stringify(value)

                                            tempItem.value = val.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');

                                            let tempData = [];
                                            for (let i in this.state.pickUpPackagesInfo) {
                                                if (i === index) {
                                                    tempData.push(tempItem);
                                                } else {
                                                    tempData.push(this.state.pickUpPackagesInfo[i])
                                                }
                                            }
                                            this.pickUpPackagesTotalCount(tempData)
                                        }
                                    }
                                    }
                                />
                                <TouchableOpacity style={[Styles.aslCenter]}
                                                  disabled={this.state.pickUpPackagesInfo[index].value === JSON.stringify(item.maximumValue)}
                                                  onPress={() => this.pickUpPackagesIncrement(item, index)}>
                                    <Text style={[styles.IncrementButton, {
                                        borderColor: this.state.pickUpPackagesInfo[index].value === JSON.stringify(item.maximumValue) ? '#f5f5f5' : '#000',
                                        color: this.state.pickUpPackagesInfo[index].value === JSON.stringify(item.maximumValue) ? '#f5f5f5' : '#000'
                                    }]}>+</Text></TouchableOpacity>
                            </View>
                        }
                    />
                </Card>
            </ScrollView>
        )
    }

    //PICK UP PACKAGES INCREMENT
    pickUpPackagesIncrement(item, index) {
        let value = Math.trunc(parseInt(item.value));
        // console.log('item increment',item)
        if (value > item.maximumValue - 1) {
            Utils.dialogBox('Maximum value is ' + item.maximumValue, '');
        } else {
            let tempItem = item;
            tempItem.value = (Math.trunc(Number(tempItem.value) + 1)).toString();
            let tempData = [];
            for (let i in this.state.pickUpPackagesInfo) {
                if (i === index) {
                    tempData.push(tempItem);
                } else {
                    tempData.push(this.state.pickUpPackagesInfo[i])
                }
            }
            // this.setState({data: tempData});
            this.pickUpPackagesTotalCount(tempData);
        }
    }

    //PICK UP PACKAGES DECREMENT
    pickUpPackagesDecrement(item, index) {
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
                for (let i in this.state.pickUpPackagesInfo) {
                    if (i === index) {
                        tempData.push(tempItem);
                    } else {
                        tempData.push(this.state.pickUpPackagesInfo[i])
                    }
                }
                // this.setState({data: tempData});
                this.pickUpPackagesTotalCount(tempData);
            }
        }
    }

    //PICK UP PACKAGES VALIDATIONS
    pickUpPackagesTotalCount(updatingData) {
        // console.log('pickup tempData', updatingData);
        // var textInputs = this.state.pickUpPackagesInfo;
        let textInputs = updatingData;
        let initialTotal = [];
        let finalTotal = [];
        let PackagesTypeNULL = []
        for (let i = 0; i < textInputs.length; i++) {
            initialTotal.push(parseInt(textInputs[i].minimumValue));
            finalTotal.push(parseInt(textInputs[i].value === '' ? 0 : textInputs[i].value));
            if (textInputs[i].value === '') {
                PackagesTypeNULL.push(textInputs[i].status);
            }
        }

        // for (var i = 0; i < textInputs.length; i++) {
        //     initialTotal.push(parseInt(textInputs[i].minimumValue));
        //     finalTotal.push(parseInt(textInputs[i].value === '' ? 0 : textInputs[i].value));
        // }
        // console.log('pickup initialTotal ===>', initialTotal, '===finalTotal===>', finalTotal);
        let initialSum = initialTotal.reduce(function (a, b) {
            return a + b;
        }, 0);
        let finalSum = finalTotal.reduce(function (a, b) {
            return a + b;
        }, 0);

        // console.log('pickup initialSum ===>',initialSum,'===finalSum===>',finalSum);
        // if (finalSum > initialSum) {
        //     this.setState({pickUpPackagesDisplay: true})
        // } else {
        //     this.setState({pickUpPackagesDisplay: false})
        // }

        if (PackagesTypeNULL.length > 0 || finalSum === 0) {
            this.setState({pickUpPackagesDisplay: false})
        } else {
            this.setState({pickUpPackagesDisplay: true})
        }
    }

    cancelPickupPackages() {
        let PackagesList = this.state.pickUpPackagesInfo;
        const packagesInfo = [];
        // console.log('cancel PackagesList',PackagesList);
        for (let i = 0; i < PackagesList.length; i++) {
            let sample = PackagesList[i];
            // sample.value = JSON.stringify(sample.packagesInitialCount);
            sample.value = sample.packagesInitialCount;
            packagesInfo.push(sample);
        }
        // console.log('cancel packages',packagesInfo);
        this.setState({
            pickUpPackagesInfo: packagesInfo,
            pickupPackagesModal: false
        })
        this.pickUpPackagesTotalCount(packagesInfo);
    }


    onRefresh() {
        //Clear old data of the list
        this.setState({dataSource: []});
        //Call the Service to get the latest data
        this.CompletedShiftDetails();
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
        const CompletedShiftDetails = this.state.CompletedShiftDetails;
        return (
            <View style={[{flex: 1, backgroundColor: "#fff"}]}>
                <OfflineNotice/>
                {
                    this.state.CompletedShiftDetails
                        ?
                        <View style={[{flex: 1, backgroundColor: "#fff"}]}>
                            {this.renderSpinner()}

                            <Appbar.Header theme={theme} style={[Styles.bgWhite]}>
                                <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                                <Appbar.Content theme={theme}
                                                title={new Date(this.state.CompletedShiftDetails.reportingTime).toDateString()}
                                                subtitle=""/>
                                <Appbar.Action icon="phone"
                                               onPress={() => this.setState({ModalSupervisorVisible: true})}/>
                                <Appbar.Action icon="autorenew" onPress={() => {
                                    this.CompletedShiftDetails()
                                }}/>
                            </Appbar.Header>

                            {/*MODAL FOR CLIENT-USER ID SELECT*/}
                            <Modal
                                transparent={true}
                                visible={this.state.ModalClientUserID}
                                onRequestClose={() => {
                                    this.setState({ModalClientUserID: false})
                                }}>
                                <View style={[Styles.modalfrontPosition]}>
                                    <TouchableOpacity onPress={() => {
                                        this.setState({ModalClientUserID: false})
                                    }} style={[Styles.modalbgPosition]}>
                                    </TouchableOpacity>
                                    <View
                                        style={[Styles.bw1, Styles.bgWhite, { width: Dimensions.get('window').width,
                                            height: Dimensions.get('window').height}]}>
                                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                                        <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                                            <Appbar.Content
                                                title={'Client UserId'}
                                                titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                                            <MaterialCommunityIcons name="window-close" size={32}
                                                                    color="#fff" style={{marginRight: 10}}
                                                                    onPress={() => this.setState({
                                                                        ModalClientUserID: false
                                                                    })}/>
                                        </Appbar.Header>
                                        <ScrollView style={[Styles.padH10]} theme={theme}>
                                            <KeyboardAvoidingView
                                                behavior=  "padding"
                                                keyboardVerticalOffset={60}
                                                style={[Styles.flex1]}>
                                            <Card.Content style={[Styles.aslCenter, Styles.padV15]}>
                                                <Title style={[Styles.cBlk, Styles.f16, Styles.ffMregular]}>SEARCH <Text
                                                    style={{fontFamily: 'Muli-Bold'}}>EXISTING</Text> USER
                                                    ID's</Title>
                                            </Card.Content>
                                            {/*SEARCH BOX*/}
                                            <View style={[Styles.alignCenter, Styles.marV5]}>
                                                <Input
                                                    style={{
                                                        height: 50,
                                                        width: 250,
                                                        borderWidth: 1,
                                                        borderRadius: 50,
                                                        backgroundColor: '#f5f5f5',
                                                        padding: 10,
                                                        fontFamily: 'Muli-Regular'
                                                    }}
                                                    placeholder='Search Client UserId'
                                                    autoCompleteType='off'
                                                    placeholderTextColor='#233167'
                                                    autoCapitalize="none"
                                                    blurOnSubmit={false}
                                                    returnKeyType="done"
                                                    onSubmitEditing={() => {
                                                        Keyboard.dismiss();
                                                    }}
                                                    value={this.state.searchStrng}
                                                    onChangeText={(searchStrng) => this.setState({searchStrng}, () => {
                                                        const tempList = this.state.CompletedShiftDetails.clientUserIds;
                                                        if (searchStrng === ''|| searchStrng.length === 0) {
                                                            this.setState({clientUserIdList:tempList,filteredData:tempList})
                                                        } else {
                                                            let filteredData = tempList.filter(function (item) {
                                                                return item.clientUserId.toUpperCase().includes(searchStrng.toUpperCase());
                                                            });
                                                            this.setState({clientUserIdList: filteredData,filteredData:filteredData});
                                                        }
                                                    })}
                                                />
                                                <MaterialIcons name='search' color='#000' size={30}
                                                               style={{position: 'absolute', right: 65, top: 12}}/>
                                                {
                                                    this.state.filteredData.length > 0
                                                        ?
                                                        <Text style={[Styles.aslCenter,Styles.f16,Styles.colorBlue]}>({this.state.filteredData.length} found)</Text>
                                                        :null}
                                            </View>
                                            <ScrollView
                                                persistentScrollbar={true}
                                                showsHorizontalScrollIndicator={true}>
                                                {
                                                    this.state.clientUserIdList.length === 0
                                                        ?
                                                        <Card.Content style={[Styles.aslCenter, Styles.padV15]}>
                                                            <Title style={[Styles.cBlk, Styles.f20, Styles.ffMregular,Styles.p2]}>No
                                                                Client User-Id's Assigned</Title>
                                                        </Card.Content>
                                                        :
                                                        <ScrollView
                                                            persistentScrollbar={true}
                                                            style={[{height: Dimensions.get('window').width / 1.3}]}>
                                                            <FlatList
                                                                data={this.state.clientUserIdList}
                                                                renderItem={({item}) => this.clientUserIdSelect(item)}
                                                                extraData={this.state}
                                                                keyExtractor={(item, index) => index.toString()}/>
                                                        </ScrollView>
                                                }
                                            </ScrollView>
                                            <CText cStyle={[{
                                                borderBottomWidth: 1,
                                                borderBottomColor: '#000',
                                                marginHorizontal: 70,
                                                paddingVertical: 10
                                            }]}>
                                            </CText>
                                            <View style={[Styles.padV10]}>
                                                <View style={[Styles.row, Styles.jSpaceBet]}>
                                                    <Title
                                                        style={[Styles.cBlk, Styles.f14, Styles.ffMregular]}>ENTER <Text
                                                        style={{fontFamily: 'Muli-Bold'}}>NEW</Text> USER
                                                        ID</Title>
                                                    <Button title='SKIP' disabled={true} color={'red'}/>
                                                </View>
                                                <View
                                                    style={[Styles.p5, Styles.marV10, Styles.bw1, {borderColor: this.state.clientID === '' || this.state.clientID.trim().length === 0 ? 'red' : 'green'}]}>
                                                    <TextInput
                                                        style={[]}
                                                        selectionColor={"black"}
                                                        onChangeText={(clientID) => this.setState({clientID: clientID.trim()}, () => {

                                                            if (Utils.validateClientUserID(clientID).status === true) {
                                                                this.setState({
                                                                    clientIDButton: false,
                                                                    errorCreateClientID: null
                                                                });
                                                            } else {
                                                                this.setState({
                                                                    clientIDButton: true,
                                                                    errorCreateClientID: Utils.validateClientUserID(clientID).message,
                                                                });
                                                            }

                                                            // clientID === '' || clientID.trim().length === 0 ? this.setState({clientIDButton: true}) : this.setState({clientIDButton: false})
                                                        })}
                                                        value={this.state.clientID}
                                                    />
                                                </View>
                                                {
                                                    this.state.errorCreateClientID ?
                                                        <Text
                                                            style={[Styles.cRed, Styles.f16, Styles.ffMregular, Styles.mBtm10]}>{this.state.errorCreateClientID}</Text>
                                                        :
                                                        null
                                                }
                                                <Text
                                                    style={[Styles.colorBlue, Styles.f14, Styles.ffMbold, Styles.aslCenter]}>Ex:
                                                    VAN/SPVAN_WHIZ/104969578</Text>
                                                <Card.Actions style={[Styles.row, Styles.jSpaceBet, Styles.padV5]}>
                                                    <Button title=' CANCEL ' color={'#000'} compact={true}
                                                            style={[Styles.cBlk]}
                                                            onPress={() => this.setState({ModalClientUserID: false})}/>
                                                    <Button title=' UPDATE ' disabled={this.state.clientIDButton}
                                                            color={'#000'}
                                                            compact={true}
                                                            onPress={() => this.setState({
                                                                ModalClientUserID: false,
                                                                selectedClientUserID: this.state.clientID,
                                                                clientUserId: '',
                                                                defaultClientID: true
                                                            })}/>
                                                </Card.Actions>
                                            </View>
                                            </KeyboardAvoidingView>
                                        </ScrollView>
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
                                    <TouchableOpacity onPress={() => {
                                        this.setState({ModalWareHouse: false})
                                    }} style={[Styles.modalbgPosition]}>
                                    </TouchableOpacity>
                                    <View
                                        style={[Styles.bw1, {backgroundColor: '#fff'}, Styles.aslCenter, {width: Dimensions.get('window').width - 20}]}>
                                        <View style={[Styles.p10]} theme={theme}>
                                            <Card.Content style={[Styles.aslCenter, Styles.p5]}>
                                                <FastImage style={[Styles.aslCenter, Styles.img100, Styles.p10]}
                                                           source={LoadImages.siteWareHouse}/>
                                                <Title
                                                    style={[Styles.cBlk, Styles.f20, Styles.ffMbold, Styles.aslCenter,]}>{this.state.CompletedShiftDetails.siteName}</Title>
                                            </Card.Content>

                                            <Card style={[styles.shadow, Styles.marV5]}>
                                                <Card.Title theme={theme}
                                                            titleStyle={[Styles.f16, Styles.ffMregular]}
                                                            style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                            title={<CText
                                                                cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>Marked
                                                                Attendance at
                                                                <CText
                                                                    cStyle={[Styles.padV3, Styles.aslStart, Styles.cBlk, Styles.f18, {fontFamily: "Muli-Bold"}]}> {new Date(CompletedShiftDetails.reportingTime).getHours()}:{new Date(CompletedShiftDetails.reportingTime).getMinutes()}</CText></CText>}
                                                            left={() => <FastImage style={{width: 40, height: 40}}
                                                                                   source={LoadImages.markedAttendance}/>}
                                                />
                                            </Card>
                                            <Card style={[styles.shadow, Styles.marV5]}>
                                                <Card.Title theme={theme}
                                                            titleStyle={[Styles.f16, Styles.ffMregular]}
                                                            style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                            title={
                                                                <Text>
                                                                    Expected Shift Duration <Text style={{
                                                                    fontFamily: 'Muli-Bold',
                                                                    fontSize: 18
                                                                }}>{this.state.CompletedShiftDetails.attributes.expectedDuration}</Text>
                                                                </Text>
                                                            }
                                                            left={() => <Ionicons style={[Styles.marH5]}
                                                                                  name="ios-alarm"
                                                                                  size={40}
                                                                                  color="red"/>}
                                                />
                                            </Card>
                                            <TouchableOpacity onPress={() => {
                                                this.setState({ModalWareHouse: false, ModalOpenAppURL: true})
                                            }}>
                                                <Card style={[styles.shadow, Styles.marV5]}>
                                                    <Card.Title theme={theme}
                                                                titleStyle={[Styles.f16, Styles.ffMregular]}
                                                                style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                                title={this.state.CompletedShiftDetails.clientName}
                                                                left={() => <FastImage style={{width: 50, height: 60}}
                                                                                       source={LoadImages.routePoint}/>}
                                                    />
                                                </Card>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[Styles.marV5]} onPress={() => {
                                                this.setState({ModalWareHouse: false})
                                            }}>
                                                <Card.Title theme={theme}
                                                            titleStyle={[Styles.f16, Styles.ffMregular, Styles.aslCenter]}
                                                            title='tap to dismiss'/>
                                            </TouchableOpacity>
                                        </View>

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
                                                    style={[Styles.cBlk, Styles.f20, Styles.ffMbold, Styles.aslCenter,]}>{CompletedShiftDetails.clientName}-CLIENT</Title>
                                            </Card.Content>

                                            <TouchableOpacity
                                                disabled={CompletedShiftDetails.attributes.appLinkForAndroid === null}
                                                onPress={() => {
                                                    Linking.openURL(CompletedShiftDetails.attributes.appLinkForAndroid)
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
                                                                LINK {CompletedShiftDetails.attributes.appLinkForAndroid === null ? '(not available)' : null}</Text>
                                                        </View>
                                                    </View>
                                                    <View/>
                                                </View>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                disabled={CompletedShiftDetails.attributes.appLinkForWeb === null}
                                                onPress={() => {
                                                    Linking.openURL(CompletedShiftDetails.attributes.appLinkForWeb)
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
                                                                LINK {CompletedShiftDetails.attributes.appLinkForWeb === null ? '(not available)' : null}</Text>
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
                                                    CompletedShiftDetails.userRole === 1
                                                        ?
                                                        <FastImage style={[Styles.aslCenter, Styles.img100, Styles.m15]}
                                                                   source={LoadImages.activeDA}/>
                                                        :
                                                        CompletedShiftDetails.userRole === 5
                                                            ?
                                                            <FastImage
                                                                style={[Styles.aslCenter, Styles.img100, Styles.m10]}
                                                                source={LoadImages.activeDriver}/>
                                                            :
                                                            CompletedShiftDetails.userRole === 10
                                                                ?
                                                                <FastImage
                                                                    style={[Styles.aslCenter, Styles.img100, Styles.m10]}
                                                                    source={LoadImages.activeDDA}/>
                                                                :
                                                                CompletedShiftDetails.userRole === 15
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
                                                    style={[Styles.aslCenter, Styles.cBlk, Styles.f20, Styles.ffMbold]}>{CompletedShiftDetails.siteName}</Title>
                                            </Card.Content>

                                            <Card style={[styles.shadow, Styles.marV5]}>
                                                <Card.Title theme={theme}
                                                            titleStyle={[Styles.f16, Styles.ffMregular]}
                                                            style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                            title={<CText
                                                                cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>Shift
                                                                Started at
                                                                <CText
                                                                    cStyle={[Styles.padV3, Styles.aslStart, Styles.cBlk, Styles.f18, Styles.ffMregular]}> {new Date(CompletedShiftDetails.actualStartTime).getHours()}:{new Date(CompletedShiftDetails.actualStartTime).getMinutes()}{this.ShiftDuration(CompletedShiftDetails)}</CText></CText>}
                                                            left={() => <FastImage style={{width: 50, height: 60}}
                                                                                   source={LoadImages.warehouse}/>}
                                                />
                                            </Card>

                                            {
                                                CompletedShiftDetails.userRole === 1 || CompletedShiftDetails.userRole === 10
                                                    ?
                                                    <Card style={[styles.shadow, Styles.marV5]}>
                                                        <Card.Title theme={theme}
                                                                    titleStyle={[Styles.f16, Styles.ffMregular]}
                                                                    style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                                    title={<CText
                                                                        cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{this.state.CompletedShiftDetails.pickUpPackagesCount}
                                                                        <CText
                                                                            cStyle={[Styles.padV3, Styles.aslStart, Styles.cBlk, Styles.f16, Styles.ffMregular]}>{' '}shift
                                                                            items to complete</CText></CText>}
                                                                    left={() => <FastImage
                                                                        style={{width: 40, height: 40}}
                                                                        source={LoadImages.delivery}/>}
                                                        />
                                                    </Card>
                                                    :
                                                    null
                                            }
                                            <TouchableOpacity onPress={() => {
                                                this.setState({ModalonDutyDelivery: false, ModalOpenAppURL: true})
                                            }}>
                                                <Card style={[styles.shadow, Styles.marV5]}>
                                                    <Card.Title theme={theme}
                                                                titleStyle={[Styles.f16, Styles.ffMregular]}
                                                                style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                                title={<CText
                                                                    cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{this.state.CompletedShiftDetails.clientName}</CText>}
                                                                left={() => <FastImage style={{width: 50, height: 60}}
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

                            {/*MODAL FOR SHIFT ENDED DETAILS*/}
                            <Modal
                                transparent={true}
                                visible={this.state.ModalshiftEnded}
                                onRequestClose={() => {
                                    this.setState({ModalshiftEnded: false})
                                }}>
                                <View style={[Styles.modalfrontPosition]}>
                                    <TouchableOpacity onPress={() => {
                                        this.setState({ModalshiftEnded: false})
                                    }} style={[Styles.modalbgPosition]}>
                                    </TouchableOpacity>
                                    <View
                                        style={[Styles.bw1, {backgroundColor: '#fff'}, Styles.aslCenter, {width: Dimensions.get('window').width - 20}]}>
                                        <View style={[Styles.p10]} theme={theme}>
                                            <Card.Content style={[Styles.aslCenter, Styles.p5]}>
                                                <FastImage
                                                    style={[Styles.aslCenter, Styles.img70, Styles.m10]}
                                                    source={LoadImages.activeENDPOINT}/>
                                                <Title
                                                    style={[Styles.aslCenter, Styles.cBlk, Styles.f20, Styles.ffMbold]}>{CompletedShiftDetails.siteName}</Title>
                                            </Card.Content>

                                            <Card style={[styles.shadow, Styles.marV5]}>
                                                <Card.Title theme={theme}
                                                            titleStyle={[Styles.f16, Styles.ffMregular]}
                                                            style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                            title={<CText
                                                                cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>completed
                                                                shift
                                                                <CText
                                                                    cStyle={[Styles.padV3, Styles.aslStart, Styles.cBlk, Styles.f16, Styles.ffMregular]}>{new Date(CompletedShiftDetails.actualEndTime).getHours()}:{new Date(CompletedShiftDetails.actualEndTime).getMinutes()} ({CompletedShiftDetails.durationStr})</CText></CText>}
                                                            left={() => <FastImage style={{width: 40, height: 40}}
                                                                                   source={LoadImages.ended_Shift}/>}
                                                />
                                            </Card>

                                            {
                                                CompletedShiftDetails.cashCollected === 0
                                                    ?
                                                    null
                                                    :
                                                    <Card style={[styles.shadow, Styles.marV5]}>
                                                        <Card.Title theme={theme}
                                                                    titleStyle={[Styles.f16, Styles.ffMregular]}
                                                                    style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                                    title={<CText
                                                                        cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{CompletedShiftDetails.cashCollected}
                                                                        <CText
                                                                            cStyle={[Styles.padV3, Styles.aslStart, Styles.cBlk, Styles.f16, Styles.ffMregular]}>{' '}cash
                                                                            collected</CText></CText>}
                                                                    left={() => <FontAwesome name="inr" size={45}
                                                                                             color="orange"/>}
                                                        />
                                                    </Card>
                                            }
                                            {
                                                CompletedShiftDetails.userRole === 1 || CompletedShiftDetails.userRole === 10
                                                    ?
                                                    <Card style={[styles.shadow, Styles.marV5]}>
                                                        <Card.Title theme={theme}
                                                                    titleStyle={[Styles.f16, Styles.ffMregular]}
                                                                    style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                                    title={<CText
                                                                        cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{CompletedShiftDetails.deliveredPackagesCount}/{CompletedShiftDetails.pickUpPackagesCount}
                                                                        <CText
                                                                            cStyle={[Styles.padV3, Styles.aslStart, Styles.cBlk, Styles.f16, Styles.ffMregular]}>{' '}packages
                                                                            delivered</CText></CText>}
                                                                    left={() => <FastImage
                                                                        style={{width: 40, height: 40}}
                                                                        source={LoadImages.delivery}/>}
                                                        />
                                                    </Card>
                                                    :
                                                    null
                                            }
                                            {
                                                CompletedShiftDetails.userRole === 5 || CompletedShiftDetails.userRole === 10
                                                    ?
                                                    <Card style={[styles.shadow, Styles.marV5]}>
                                                        <Card.Title theme={theme}
                                                                    titleStyle={[Styles.f16, Styles.ffMregular]}
                                                                    style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                                    title={<CText
                                                                        cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{CompletedShiftDetails.tripDistance}{' '}km
                                                                        <CText
                                                                            cStyle={[Styles.padV3, Styles.aslStart, Styles.cBlk, Styles.f16, Styles.ffMregular]}>{' '}for
                                                                            this shift</CText></CText>}
                                                                    left={() => <FastImage
                                                                        style={{width: 40, height: 40}}
                                                                        source={LoadImages.odometer}/>}
                                                        />
                                                    </Card>
                                                    :
                                                    null
                                            }

                                            <TouchableOpacity style={[Styles.marV5]} onPress={() => {
                                                this.setState({ModalshiftEnded: false})
                                            }}>
                                                <Card.Title theme={theme}
                                                            titleStyle={[Styles.f16, Styles.ffMregular, Styles.aslCenter]}
                                                            title='tap to dismiss'/>
                                            </TouchableOpacity>
                                        </View>

                                    </View>
                                </View>
                            </Modal>

                            {/*{Modal for statues check packages pop up}*/}
                            <Modal
                                transparent={true}
                                visible={this.state.toOpenPackages}
                                onRequestClose={() => {
                                    this.setState({toOpenPackages: false})
                                }}>
                                <View style={[Styles.modalfrontPosition]}>
                                    <TouchableOpacity onPress={() => {
                                        this.setState({toOpenPackages: false})
                                    }} style={[Styles.modalbgPosition]}>
                                    </TouchableOpacity>
                                    <View
                                        style={[Styles.bw1, {backgroundColor: '#fff'}, Styles.aslCenter, {width: Dimensions.get('window').width - 20}]}>
                                        {this.state.selectedPackageData ?
                                            <ScrollView style={[Styles.p10]} theme={theme}>
                                                <Card.Content style={[Styles.aslCenter, Styles.p5, Styles.row]}>
                                                    <FastImage style={[Styles.aslCenter, Styles.img50, Styles.p10]}
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
                                                            onPress={() => this.setState({toOpenPackages: false})}/>
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
                                                                // console.log('tempData', tempData);
                                                                this.setState({
                                                                    listOfPackages: tempData,
                                                                    finalSum: 0,
                                                                    toOpenPackages: false
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


                            {/*MODAL FOR SITE SUPERVISOR LIST VIEW*/}
                            <SupervisorsModal visible={this.state.ModalSupervisorVisible}
                                              closeModal={() => this.setState({ModalSupervisorVisible: false})}
                                              siteName={this.state.CompletedShiftDetails.siteName}
                                              children={this.state.SupervisorDetails}/>


                            {/*{Modal for PICKUP PACKAGES UPDATE}*/}
                            <Modal
                                transparent={true}
                                visible={this.state.pickupPackagesModal}
                                onRequestClose={() => {
                                    // this.setState({pickupPackagesModal: false})
                                    this.cancelPickupPackages()
                                }}>
                                <View style={[Styles.modalfrontPosition]}>
                                    <TouchableOpacity onPress={() => {
                                        this.cancelPickupPackages()
                                        // this.setState({pickupPackagesModal: false})
                                    }} style={[Styles.modalbgPosition]}>
                                    </TouchableOpacity>
                                    <View
                                        style={[Styles.bw1, {backgroundColor: '#fff'}, Styles.aslCenter, {width: Dimensions.get('window').width - 20}]}>
                                        {this.state.pickUpPackagesInfo
                                            ?
                                            <ScrollView style={[Styles.p10]} theme={theme}>
                                                <Card.Content style={[Styles.aslCenter, Styles.p5, Styles.row]}>
                                                    <FastImage style={[Styles.aslCenter, Styles.img50, Styles.p10]}
                                                               source={LoadImages.pickup}/>
                                                    <Title
                                                        style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.mLt10, Styles.cBlk]}>Pickup
                                                        Packages</Title>
                                                </Card.Content>

                                                <ScrollView
                                                    persistentScrollbar={true}
                                                    style={[Styles.flex1]}>
                                                    {
                                                        this.state.pickUpPackagesInfo.length === 0
                                                            ?
                                                            <Card.Content style={[Styles.aslCenter, Styles.padV15]}>
                                                                <Title
                                                                    style={[Styles.cBlk, Styles.f20, Styles.ffMregular, Styles.aslCenter]}>
                                                                    Something is wrong, Please call your supervisor and
                                                                    mention
                                                                    error 'Package Type Missing' in shifts.
                                                                </Title>
                                                            </Card.Content>
                                                            :
                                                            <FlatList
                                                                data={this.state.pickUpPackagesInfo}
                                                                renderItem={({
                                                                                 item,
                                                                                 index
                                                                             }) => this.pickUpPackagesData(item, index)}
                                                                keyExtractor={(index, item) => JSON.stringify(item) + index}
                                                                extraData={this.state}
                                                            />
                                                    }
                                                </ScrollView>

                                                <Card.Actions
                                                    style={[Styles.row, Styles.jSpaceArd, Styles.pTop10, Styles.pBtm5]}>
                                                    <Button title=' CANCEL ' color={'#000'} compact={true}
                                                            onPress={() => {
                                                                this.cancelPickupPackages()
                                                            }}/>
                                                    {
                                                        this.state.pickUpPackagesInfo.length === 0
                                                            ? null
                                                            :
                                                            <Button title='SAVE' color={'#000'} compact={true}
                                                                    disabled={this.state.pickUpPackagesDisplay === false}
                                                                    onPress={() => {
                                                                        let PackagesList = this.state.pickUpPackagesInfo;
                                                                        const packagesInfo = [];
                                                                        // console.log('SAVE end PackagesList initial',PackagesList);
                                                                        for (let i = 0; i < PackagesList.length; i++) {
                                                                            let sample = PackagesList[i];
                                                                            sample.value = PackagesList[i].value;

                                                                            let tempList = PackagesList[i].statuses;

                                                                            for (let p = 0; p < tempList.length; p++) {
                                                                                let initalList = tempList[p];
                                                                                initalList.count = 0;
                                                                                // console.log('inital list==>',initalList)
                                                                                // tempList.push(initalList)
                                                                            }

                                                                            // sample.statuses = PackagesList[i].statuses;
                                                                            sample.packagesInitialCount = PackagesList[i].value;
                                                                            sample.statusTotalCount = 0;
                                                                            packagesInfo.push(sample);
                                                                        }
                                                                        // console.log('SAVE end PackagesList final',packagesInfo);
                                                                        this.setState({
                                                                            listOfPackages: packagesInfo,
                                                                            pickUpPackagesInfo: packagesInfo,
                                                                            pickupPackagesModal: false,
                                                                        }, () => {
                                                                            this.checkPackagesStatus()
                                                                        })
                                                                    }}/>
                                                    }
                                                </Card.Actions>
                                            </ScrollView> : null
                                        }

                                    </View>
                                </View>
                            </Modal>


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
                                                CompletedShiftDetails.userRole === 1
                                                    ?
                                                    <FastImage style={[Styles.img70, Styles.p10]}
                                                               source={LoadImages.activeDA}/>
                                                    :
                                                    CompletedShiftDetails.userRole === 5
                                                        ?
                                                        <FastImage style={[Styles.img70, Styles.p10]}
                                                                   source={LoadImages.activeDriver}/>
                                                        :
                                                        CompletedShiftDetails.userRole === 10
                                                            ?
                                                            <FastImage style={[Styles.img70, Styles.p10]}
                                                                       source={LoadImages.activeDDA}/>
                                                            :
                                                            CompletedShiftDetails.userRole === 15
                                                                ?
                                                                <FastImage style={[Styles.img70, Styles.p10]}
                                                                           source={LoadImages.activeLabourer}/>
                                                                :
                                                                <FastImage style={[Styles.img70, Styles.p10]}
                                                                           source={LoadImages.activeSupervisor}/>
                                            }
                                        </TouchableOpacity>
                                        {
                                            CompletedShiftDetails.status === "SHIFT_ENDED"
                                                ?
                                                <TouchableOpacity onPress={() => {
                                                    this.setState({ModalshiftEnded: true})
                                                }}>
                                                    <FastImage style={{width: 70, height: 70}}
                                                               source={LoadImages.activeENDPOINT}/>
                                                </TouchableOpacity>
                                                :
                                                <View pointerEvents="none">
                                                    <FastImage style={{width: 70, height: 70}}
                                                               source={LoadImages.disabledENDPOINT}/>
                                                </View>
                                        }
                                    </View>
                                </View>


                                {/*VIEW CONTAINS CLIENT-USERID,ODOMETER READINGS,PACKAGES*/}
                                <View style={[Styles.marH10, Styles.flex1]}>

                                    {/*user cominedID VIEW*/}
                                    {
                                        CompletedShiftDetails.requireClientLoginId
                                            ?
                                            <View>
                                                <View style={[Styles.bgWhite,Styles.p10,Styles.marH5,Styles.OrdersScreenCardshadow,
                                                    Styles.bw1, {borderColor: this.state.searchPhoneNumber.length === 10  &&
                                                        (this.state.phoneNumberSearchData ? this.state.phoneNumberSearchData.existedUser : false)
                                                            ? 'green' : 'red'}]}>
                                                    <View>
                                                        <Text
                                                            style={[Styles.ffRBold, Styles.f16,Styles.cGrey33,Styles.alignCenter]}>Client Login Id </Text>
                                                        <RadioButton.Group
                                                            onValueChange={searchPhoneNumberOthers => this.setState({searchPhoneNumberOthers},()=>{
                                                                if (searchPhoneNumberOthers === false){
                                                                    this.getEnteredPhoneNumberProfiles(CompletedShiftDetails.phoneNumber)
                                                                }else {
                                                                    this.getEnteredPhoneNumberProfiles(CompletedShiftDetails.clientLoginIdMobileNumber)
                                                                }
                                                            })}
                                                            value={this.state.searchPhoneNumberOthers}>
                                                            <View style={[Styles.row, Styles.aslCenter,]}>
                                                                <View style={[Styles.row, Styles.alignCenter]}>
                                                                    <RadioButton disabled={true} value={false}/>
                                                                    <Text
                                                                        style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f16]}>Self</Text>
                                                                </View>
                                                                <View style={[Styles.row, Styles.alignCenter]}>
                                                                    <RadioButton disabled={true} value={true}/>
                                                                    <Text
                                                                        style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f16]}>Other</Text>
                                                                </View>
                                                            </View>
                                                        </RadioButton.Group>
                                                    </View>

                                                    {/*{*/}
                                                    {/*    this.state.searchPhoneNumberOthers*/}
                                                    {/*        ?*/}
                                                    {/*        <Searchbar*/}
                                                    {/*            style={[Styles.bgWhite, Styles.mTop10, Styles.bw1]}*/}
                                                    {/*            // isFocused="false"*/}
                                                    {/*            placeholder="Search Phone Number"*/}
                                                    {/*            maxLength={10}*/}
                                                    {/*            editable={false}*/}
                                                    {/*            keyboardType={'numeric'}*/}
                                                    {/*            returnKeyType="done"*/}
                                                    {/*            onSubmitEditing={() => {Keyboard.dismiss()}}*/}
                                                    {/*            onChangeText={searchPhoneNumber => {*/}
                                                    {/*                this.setState({searchPhoneNumber}, () => {*/}
                                                    {/*                    if (searchPhoneNumber.length === 10) {*/}
                                                    {/*                        this.getEnteredPhoneNumberProfiles(this.state.searchPhoneNumber)*/}
                                                    {/*                    }else {*/}
                                                    {/*                        this.setState({phoneNumberSearchData:[]})*/}
                                                    {/*                    }*/}
                                                    {/*                })*/}
                                                    {/*            }}*/}
                                                    {/*            value={this.state.searchPhoneNumber}*/}
                                                    {/*        />*/}
                                                    {/*        :*/}
                                                    {/*        null*/}
                                                    {/*}*/}

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
                                        CompletedShiftDetails.userRole >= 15 || CompletedShiftDetails.userRole === 1
                                            ?
                                            null
                                            :
                                            <Card style={[styles.shadow, Styles.mTop20, Styles.bw1, {
                                                marginBottom: 15,
                                                borderColor: this.state.KMreading - this.state.CompletedShiftDetails.startOdometerReading > 999 ||
                                                this.state.KMreading < this.state.CompletedShiftDetails.startOdometerReading ? 'red' : 'green'
                                            }]}>
                                                <View>
                                                    <Card.Title
                                                        style={[Styles.p5]}
                                                        subtitleStyle={themeSubtitle}
                                                        titleStyle={[Styles.f16, Styles.cBlk, {fontFamily: 'Muli-Bold'}]}
                                                        title='KM reading'
                                                        left={() => <FastImage style={[Styles.img40]}
                                                                               source={LoadImages.odometer}/>}
                                                        right={() =>
                                                            <View style={[Styles.row, {paddingRight: 10}]}>
                                                                <TouchableOpacity
                                                                    style={[Styles.aslCenter]}
                                                                    disabled={this.state.KMreading === '0' || this.state.KMreading <= this.state.CompletedShiftDetails.startOdometerReading}
                                                                    onPress={() => this.OdometerReadingValidate(this.state.KMreading, 'Decrement')}
                                                                >
                                                                    <Text
                                                                        style={[styles.IncrementButton, {
                                                                            borderColor: this.state.KMreading === '0' || this.state.KMreading <= this.state.CompletedShiftDetails.startOdometerReading ? '#f5f5f5' : '#000',
                                                                            color: this.state.KMreading === '0' || this.state.KMreading <= this.state.CompletedShiftDetails.startOdometerReading ? '#f5f5f5' : '#000'
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
                                                        {this.odometerMaximum()}
                                                    </View>

                                                </View>
                                            </Card>


                                    }
                                    {/*CASH COLLECTED*/}
                                    {
                                        CompletedShiftDetails.userRole >= 15 || CompletedShiftDetails.userRole === 5
                                            ?
                                            null
                                            :
                                            <Card style={[styles.shadow, Styles.marV15]}>
                                                <Card.Title
                                                    style={[Styles.p5, Styles.bw1, {borderColor: this.state.cashCollected === '' ? 'red' : 'green'}, Styles.row, Styles.jSpaceBet]}
                                                    subtitleStyle={themeSubtitle}
                                                    titleStyle={[Styles.f16, Styles.cBlk, {fontFamily: 'Muli-Bold'}]}
                                                    title='Cash Collected'
                                                    left={() => <FontAwesome name="inr" size={45}
                                                                             color="orange" style={{paddingLeft: 5}}/>}
                                                    right={() =>
                                                        <View style={[Styles.row, Styles.aslCenter]}>
                                                            <TextInput
                                                                style={[Styles.txtAlignRt, {
                                                                    width: 85,
                                                                    borderBottomWidth: 1,
                                                                    borderBottomColor: '#ddd',
                                                                    paddingRight: 5,
                                                                    fontWeight: 'bold',
                                                                    fontSize: 17
                                                                }]}
                                                                selectionColor={"black"}
                                                                maxLength={6}
                                                                keyboardType='numeric'
                                                                onChangeText={(cashCollected) => this.CashCollectedValidate(cashCollected)}
                                                                value={this.state.cashCollected}
                                                                writingDirection={'rtl'}
                                                            />
                                                        </View>
                                                    }
                                                />
                                            </Card>

                                    }

                                    {
                                        CompletedShiftDetails.userRole >= 15 || CompletedShiftDetails.userRole === 5
                                            ?
                                            null
                                            :
                                            <Card
                                                style={[styles.shadow, Styles.marV15,]}
                                                onPress={() => {
                                                    this.setState({pickupPackagesModal: true})
                                                }}>
                                                <Card.Title
                                                    style={[Styles.p5, Styles.bw1, {borderColor: this.state.pickUpPackagesDisplay ? 'green' : 'red'}]}
                                                    subtitleStyle={themeSubtitle}
                                                    titleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                                    title={'Update Pickup Packages Count'}
                                                    left={() => <Octicons name="request-changes" size={28}
                                                                          color="#000"/>}
                                                    right={() => <Ionicons
                                                        style={[Styles.marH5, {paddingRight: 10}]}
                                                        name="ios-arrow-forward" size={28}
                                                        color="#000"/>}
                                                />
                                            </Card>
                                    }

                                    {/*PACKAGES LIST*/}
                                    {
                                        CompletedShiftDetails.userRole >= 15 || CompletedShiftDetails.userRole === 5
                                            ?
                                            null
                                            :
                                            <ScrollView
                                                persistentScrollbar={true}
                                                style={[Styles.flex1]}>
                                                {
                                                    this.state.listOfPackages.length === 0
                                                        ?
                                                        <Card.Content style={[Styles.aslCenter, Styles.padV15]}>
                                                            <Title style={[Styles.cBlk, Styles.f20, Styles.ffMregular]}>No
                                                                Packages
                                                                Assigned,please contact supervisor</Title>
                                                        </Card.Content>
                                                        :
                                                        <FlatList
                                                            data={this.state.listOfPackages}
                                                            renderItem={({item, index}) =>

                                                                <View>
                                                                    {
                                                                        JSON.parse(item.value) === 0 ?
                                                                            null
                                                                            :
                                                                            <View
                                                                                style={[Styles.progressBarPositionAbs]}>
                                                                                <ProgressBar color={'green'}
                                                                                             progress={(item.statuses[0].count) / JSON.parse(item.value)}/>
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
                                                                            left={() => <FastImage
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

                                    {/*ROUTE TEXTINPUT*/}
                                    {
                                        CompletedShiftDetails.userRole <= 15
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
                                                        onChangeText={(route) => this.setState({route: route})}
                                                        value={this.state.route}
                                                    />
                                                </View>
                                            </View>
                                            :
                                            null
                                    }

                                    {/*TRIP SHEET ID*/}
                                    {
                                        CompletedShiftDetails.requireTripSheetId
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
                                        CompletedShiftDetails.requirePartnerDetails
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


                            </ScrollView>

                            {/*WILL DISPLAY for >=15 ROLES ,SHOWING LOADER AND SHIFT STATUS*/}
                            {
                                CompletedShiftDetails.userRole >= 15
                                    ?
                                    Services.returnStatusText(CompletedShiftDetails.status)
                                    :
                                    null
                            }

                            {/* FOOTER BUTTON*/}
                            <View style={[Styles.footerUpdateButtonStyles]}>
                                {
                                    CompletedShiftDetails.userRole === 1
                                        ?
                                        <TouchableOpacity onPress={() => {
                                            this.ValidateShiftCompleted()
                                        }} style={[Styles.br30, {
                                            backgroundColor: this.state.cashCollected === '' || this.state.PackagesDisplay === false || this.state.pickUpPackagesDisplay === false ? '#b2beb5' : '#000'
                                        }]}
                                                          disabled={ this.state.cashCollected === '' || this.state.PackagesDisplay === false || this.state.pickUpPackagesDisplay === false ? true : false}>
                                            <CText
                                                cStyle={[Styles.cWhite, Styles.f20, Styles.p10, Styles.aslCenter, Styles.ffMregular]}>UPDATE
                                                SHIFT</CText>
                                        </TouchableOpacity>
                                        :
                                        CompletedShiftDetails.userRole === 5
                                            ?
                                            <TouchableOpacity onPress={() => {
                                                this.ValidateShiftCompleted()
                                            }} style={[Styles.br30, {
                                                backgroundColor: this.state.KMreading - this.state.CompletedShiftDetails.startOdometerReading > 999 || this.state.KMreading < this.state.CompletedShiftDetails.startOdometerReading || this.state.KMreading === '' ? '#b2beb5' : '#000'
                                            }]}
                                                              disabled={this.state.KMreading - this.state.CompletedShiftDetails.startOdometerReading > 999 || this.state.KMreading < this.state.CompletedShiftDetails.startOdometerReading || this.state.KMreading === '' ? true : false}>
                                                <CText
                                                    cStyle={[Styles.cWhite, Styles.f20, Styles.p10, Styles.aslCenter, Styles.ffMregular]}>UPDATE
                                                    SHIFT</CText>
                                            </TouchableOpacity>
                                            :
                                            CompletedShiftDetails.userRole === 10
                                                ?
                                                <TouchableOpacity onPress={() => {
                                                    this.ValidateShiftCompleted()
                                                }} style={[Styles.br30, {
                                                    backgroundColor:
                                                        this.state.KMreading - this.state.CompletedShiftDetails.startOdometerReading > 999 || this.state.KMreading < this.state.CompletedShiftDetails.startOdometerReading || this.state.KMreading === '' || this.state.cashCollected === '' || this.state.PackagesDisplay === false || this.state.pickUpPackagesDisplay === false ? '#b2beb5' : '#000'
                                                }]}
                                                                  disabled={ this.state.KMreading - this.state.CompletedShiftDetails.startOdometerReading > 999 || this.state.KMreading < this.state.CompletedShiftDetails.startOdometerReading || this.state.KMreading === '' || this.state.cashCollected === '' || this.state.PackagesDisplay === false || this.state.pickUpPackagesDisplay === false ? true : false}>
                                                    <CText
                                                        cStyle={[Styles.cWhite, Styles.f20, Styles.p10, Styles.aslCenter, Styles.ffMregular]}>UPDATE
                                                        SHIFT</CText>
                                                </TouchableOpacity>
                                                :
                                                CompletedShiftDetails.userRole >= 15
                                                    ?
                                                    <TouchableOpacity onPress={() => {
                                                        this.ValidateShiftCompleted()
                                                    }} style={[Styles.br30, {
                                                        backgroundColor: '#000'
                                                    }]}
                                                                      disabled={false}>
                                                        <CText
                                                            cStyle={[Styles.cWhite, Styles.f20, Styles.p10, Styles.aslCenter, Styles.ffMregular]}>UPDATE
                                                            SHIFT</CText>
                                                    </TouchableOpacity>
                                                    :
                                                    null
                                }
                            </View>


                        </View>
                        :
                        <CSpinner/>
                }
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
