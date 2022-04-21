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
    Appbar, Avatar, Card, Surface, IconButton, DefaultTheme, Title, Paragraph, Divider, RadioButton, Searchbar,
} from "react-native-paper";
import {CButton, Styles, CText, CSpinner, LoadImages} from "./common";
import Utils from './common/Utils';
import Config from "./common/Config"
import Services from "./common/Services";
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/dist/FontAwesome';
import _ from 'lodash';
import FastImage from 'react-native-fast-image';
import Ionicons from "react-native-vector-icons/dist/Ionicons";
import OfflineNotice from './common/OfflineNotice';
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";


const width = Dimensions.get("window").width;


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

export default class UpdateShiftScreen extends Component {

    constructor(props) {
        super(props);
        this.props.navigation.addListener(
            'willBlur',() => {
                OneSignal.removeEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.removeEventListener('opened',HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.props.navigation.addListener(
            'didFocus',() => {
                OneSignal.addEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.addEventListener('opened',HomeScreen.prototype.onOpened.bind(this));
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
            UpdateShiftDetails: '',
            listOfPackages: '',
            ModalClientUserID: false,
            selectedClientUserID: '',
            clientID: '',
            clientIDButton: true,
            KMreading: '0',
            PackagesDisplay: false, UserFlow: '', defaultClientID: false, defaultOdometer: false,
            ModalWareHouse: false, ModalonDutyDelivery: false, currentUserId: '', ModalOpenAppURL: false,
            clientUserId:null,errorCreateClientID:null,route: '',filteredData:[],searchStrng:'',

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
        self.UpdateShiftDetails();
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
        const self = this;
        // console.log('errorHandling in update shift', error.response);
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
    UpdateShiftDetails() {
        const self = this;
        const CurrentShiftId = self.props.navigation.state.params.CurrentShiftId;
        const currentUserId = self.props.navigation.state.params.currentUserId;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_STARTSHIFT_DETAILS + '?shiftId=' + CurrentShiftId + '&userId=' + currentUserId;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, function (response) {
                if (response.status === 200) {
                    // console.log('UpdateShiftDetails res', response.data);
                    if (response.data != null) {
                        let UpdateShiftDetails = response.data;
                        let superVisorList = UpdateShiftDetails.siteSupervisorsList;
                        self.setState({
                            UpdateShiftDetails: UpdateShiftDetails,
                            SupervisorDetails: superVisorList,
                            clientUserIdList: UpdateShiftDetails.clientUserIds,
                            startOdometerReading: UpdateShiftDetails.startOdometerReading,
                            tripTypeList: UpdateShiftDetails.tripTypes,
                            selectedTripType: UpdateShiftDetails.tripTypes[0].name,
                            selectedTripValue: UpdateShiftDetails.tripTypes[0].key,
                            tripSheetId: UpdateShiftDetails.tripSheetId,
                            partnerDetails: UpdateShiftDetails.partnerDetails,
                            route: UpdateShiftDetails.route,
                            refreshing: false,
                            spinnerBool: false,filteredData:[],searchStrng:''
                        },()=>{
                            if (UpdateShiftDetails.requireClientLoginId){
                                let tempNumber = UpdateShiftDetails.clientLoginIdMobileNumber ? UpdateShiftDetails.clientLoginIdMobileNumber : UpdateShiftDetails.phoneNumber
                             self.setState({searchPhoneNumber:tempNumber,
                                 searchPhoneNumberOthers:UpdateShiftDetails.others},()=>{
                                        self.getEnteredPhoneNumberProfiles(tempNumber)
                             })
                            }
                        });

                        if (UpdateShiftDetails.startOdometerReading != null) {
                            if (UpdateShiftDetails.startOdometerReading === 0){
                                self.setState({
                                    KMreading: JSON.stringify(UpdateShiftDetails.startOdometerReading),
                                    defaultOdometer: false
                                })
                            } else {
                                self.setState({
                                    KMreading:UpdateShiftDetails.startOdometerReading===999999?'0': JSON.stringify(UpdateShiftDetails.startOdometerReading),
                                    defaultOdometer: true
                                })
                            }
                        }

                        if (UpdateShiftDetails.clientPackages != null) {
                            if (UpdateShiftDetails.clientPackages.length > 0) {
                                let PackagesList = UpdateShiftDetails.clientPackages;
                                const packagesInfo = [];
                                for (var i = 0; i < PackagesList.length; i++) {
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
                        self.setState({UpdateShiftDetails: [], spinnerBool: false});
                    }
                }
            }, function (error) {
                // console.log('update shift errror',error.response);
                self.errorHandling(error)
            })
        });
    }

    //API CALL to get profile based on phone number search
    getEnteredPhoneNumberProfiles(searchNumber,) {
        const {usersList, page} = this.state;
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_PROFILES_BASED_ON_PHONE_NUMBER_SEARCH + 'siteCode='+self.state.UpdateShiftDetails.attrs.siteCode +'&phoneNumber='+searchNumber ;
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
        const timeStart = new Date(item.reportingTime).getTime()
        var timeEnd = new Date().getTime();
        var hourDiff = timeEnd - timeStart; //in ms
        var secDiff = hourDiff / 1000; //in s
        var minDiff = hourDiff / 60 / 1000; //in minutes
        var hDiff = hourDiff / 3600 / 1000; //in hours
        var humanReadable = {};
        humanReadable.hours = Math.floor(hDiff);
        humanReadable.minutes = Math.floor(minDiff - 60 * humanReadable.hours);
        if (item.status === 'INIT') {
            return (
                <Text style={[Styles.f16, Styles.ffMregular, Styles.cBlk]}>Shift Yet to Start</Text>
            )
        } else {
            return (
                <Text style={[Styles.f16, Styles.ffMregular, Styles.cBlk]}>Marked Attendance at
                    <Text
                        style={[Styles.f18, Styles.ffMbold]}> {new Date(this.state.UpdateShiftDetails.reportingTime).getHours()}:{new Date(this.state.UpdateShiftDetails.reportingTime).getMinutes()}
                        {/*<CText*/}
                        {/*    cStyle={[Styles.aslStart, Styles.ffMbold, Styles.f16]}> ({humanReadable.hours === 0 && humanReadable.minutes === 0 ? '0 m' : humanReadable.hours === 0 ? null : humanReadable.hours + 'h '}{humanReadable.minutes === 0 ? null : humanReadable.minutes + 'm'} ago)</CText>*/}
                    </Text></Text>
            )
        }
    }


    PackagesIncrement(item, index) {
        var value = Math.trunc(parseInt(item.value));
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
            var value = Math.trunc(parseInt(item.value));
            if (value < 1) {
                Utils.dialogBox('Minium value is 0', '');
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
        var textInputs = this.state.listOfPackages;
        var initialTotal = [];
        let finalTotal = [];
        for (var i = 0; i < textInputs.length; i++) {
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
        // console.log('PackagesData item===',this.state.listOfPackages[index].value);
        return (
            <ScrollView
                persistentScrollbar={true}>
                <Card style={[styles.shadow, Styles.marV10]}>
                    <Card.Title
                        style={[Styles.p5, Styles.bw1, {borderColor: this.state.PackagesDisplay === true && this.state.listOfPackages[index].value > '0' ? 'green' : this.state.PackagesDisplay === true ? 'orange' : this.state.listOfPackages[index].value === '' || this.state.listOfPackages[index].value === '0' ? 'red' : 'green'}]}
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
                                    <Text style={[styles.IncrementButton,{borderColor:this.state.listOfPackages[index].value === JSON.stringify(item.minimumValue)?'#f5f5f5': '#000',color:this.state.listOfPackages[index].value === JSON.stringify(item.minimumValue)?'#f5f5f5': '#000'}]}>-</Text></TouchableOpacity>
                                <TextInput
                                    style={[Styles.txtAlignCen, {width: 80, fontWeight: 'bold', fontSize: 17}]}
                                    selectionColor={"black"}
                                    // maxLength={3}
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
                                            // console.log('value Tin',value)
                                            val = JSON.stringify(value)
                                            // console.log('val Tin',val)

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
                                    <Text style={[styles.IncrementButton,{borderColor:this.state.listOfPackages[index].value === JSON.stringify(item.maximumValue)?'#f5f5f5': '#000',color:this.state.listOfPackages[index].value === JSON.stringify(item.maximumValue)?'#f5f5f5': '#000'}]}>+</Text></TouchableOpacity>
                            </View>
                        }
                    />
                </Card>
            </ScrollView>
        )
    }

    //For Shift In Progress
    ShiftDurationTracking(item) {
        const timeStart = new Date(item.actualStartTime).getTime()
        var timeEnd = new Date().getTime();
        var hourDiff = timeEnd - timeStart; //in ms
        var secDiff = hourDiff / 1000; //in s
        var minDiff = hourDiff / 60 / 1000; //in minutes
        var hDiff = hourDiff / 3600 / 1000; //in hours
        var humanReadable = {};
        humanReadable.hours = Math.floor(hDiff);
        humanReadable.minutes = Math.floor(minDiff - 60 * humanReadable.hours);
        // console.log(humanReadable); //{hours: 0, minutes: 30}
        // this.setState({ ShiftDuration: humanReadable })
        return (
            <Text
                style={[Styles.ffMbold, Styles.f16]}> ({humanReadable.hours === 0 && humanReadable.minutes === 0 ? '0 m' : humanReadable.hours === 0 ? null : humanReadable.hours + 'h '}{humanReadable.minutes === 0 ? null : humanReadable.minutes + 'm'} ago)</Text>
        )
    }


//Odometer reading validate
    odometerReading(KMreading) {
        var value = Math.trunc(parseInt(KMreading));
        // console.log('value Tin',value)
        const updatedKMreading = JSON.stringify(value)
        let num = updatedKMreading.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');
        if (num > 0) {
            if (num >= 999999) {
                const tempValue = 999998;
                this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: true});
            }else {
                this.setState({defaultOdometer: true, KMreading: num})
            }
        } else {
            this.setState({defaultOdometer: false, KMreading: num})
        }

    }

    //clientUserIdSelect from assigned in web ,calls fun flatlist from pop-up
    clientUserIdSelect(item) {
        return (
            <TouchableOpacity onLongPress={() => Utils.dialogBox(item.clientUserId, '')}
                              onPress={() => {
                                  this.setState({
                                      ModalClientUserID: false,
                                      selectedClientUserID: item.clientUserId,
                                      defaultClientID: true,
                                      clientUserId: item.id,
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

    OdometerReadingValidate(item, operator) {
        if (item === '') {
            item = 0;
            this.setState({KMreading: JSON.stringify(item), defaultOdometer: false});
        } else {
            var value = Math.trunc(parseInt(item));
            if (operator === 'Increment') {
                if (value >= 999999) {
                    const tempValue = 999998;
                    this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: true});
                    Utils.dialogBox('Reached Maximum Value', '');
                } else {
                    const tempValue = value + 1;
                    this.setState({KMreading: JSON.stringify(tempValue), defaultOdometer: true},);
                }
            } else if (operator === 'Decrement') {
                if (value <= 0) {
                    const tempValue = 0;
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
        const UpdateShiftDetails = this.state.UpdateShiftDetails;
        var textInputs = this.state.listOfPackages;
        let pickUpPackagesInfo = [];
        for (var i = 0; i < textInputs.length; i++) {
            let sample = {};
            sample.type = textInputs[i].type;
            sample.packageTypeId = textInputs[i].packageTypeId;
            sample.includeInPackageCount = textInputs[i].includeInPackageCount;
            sample.displayName = textInputs[i].displayName;
            sample.maximumValue = textInputs[i].maximumValue;
            sample.minimumValue = textInputs[i].minimumValue;
            sample.statuses = textInputs[i].statuses;
            sample.count = parseInt(textInputs[i].value);
            pickUpPackagesInfo.push(sample);
        }
        let body = {};
        {
            UpdateShiftDetails.userRole === 1
                ?
                body = JSON.stringify({
                    'pickUpPackagesInfo': pickUpPackagesInfo,
                    'clientUserIdInfo': {id: this.state.clientUserId, clientUserId: this.state.selectedClientUserID},
                    'tripType': this.state.selectedTripValue,
                    'route': this.state.route,
                    'clientEmployeeId': this.state.clientEmployeeId,
                    'tripSheetId': this.state.tripSheetId,
                    'partnerDetails': this.state.partnerDetails,
                    'others':this.state.searchPhoneNumberOthers,
                    'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                })
                :
                UpdateShiftDetails.userRole === 5
                    ?
                    body = JSON.stringify({
                        'startOdometerReading': this.state.KMreading,
                        // 'clientUserIdInfo': {id: this.state.clientUserId, clientUserId: this.state.selectedClientUserID},
                        'tripType': this.state.selectedTripValue,
                        'route': this.state.route,
                        'clientEmployeeId': this.state.clientEmployeeId,
                        'tripSheetId': this.state.tripSheetId,
                        'partnerDetails': this.state.partnerDetails,
                        'others':this.state.searchPhoneNumberOthers,
                        'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                    })
                    :
                    UpdateShiftDetails.userRole === 10
                        ?
                        body = JSON.stringify({
                            'pickUpPackagesInfo': pickUpPackagesInfo,
                            'startOdometerReading': this.state.KMreading,
                            'tripType': this.state.selectedTripValue,
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
                        UpdateShiftDetails.userRole >= 15
                            ?
                            body = JSON.stringify({
                                'pickUpPackagesInfo': null,
                                'startOdometerReading': null,
                                'clientUserIdInfo': null,
                                'route': null,
                                'tripType': this.state.selectedTripValue,
                                'clientEmployeeId': this.state.clientEmployeeId,
                                'tripSheetId': this.state.tripSheetId,
                                'partnerDetails': this.state.partnerDetails,
                                'others':this.state.searchPhoneNumberOthers,
                                'clientLoginIdMobileNumber':this.state.searchPhoneNumber
                            })
                            :
                            null
        }
        // console.log('body', body);
        this.ReadingsCountUPDATE(body);
    }

    //API CALL to UpdateShift after  STARTShift  or Before
    ReadingsCountUPDATE = (body) => {
        // console.log('ReadingsCountUPDATE body====', body);
        const CurrentShiftId = this.state.CurrentShiftId;
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.UPDATE_SHIFT + CurrentShiftId;
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, function (response) {
                if (response.status === 200) {
                    let updateData = response.data;
                    // console.log('ValidateUpdate resp200', updateData);
                    self.setState({spinnerBool: false,})
                    Utils.dialogBox(updateData.message, '');
                    self.props.navigation.goBack()
                }
            }, function (error) {
                // console.log('update errore', error, error.response);
                if (error.response) {
                    if (error.response.status === 403) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox("Token Expired,Please Login Again", '');
                        self.props.navigation.navigate('Login');
                    } else if (error.response.status === 500) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox(error.response.data.message, '');
                    } else if (error.response.status === 400) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox(error.response.data.message, '');
                    } else {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
                    }
                } else {
                    self.setState({spinnerBool: false});
                    Utils.dialogBox(error.message, '');
                }
            })
        });
    };

    onRefresh() {
        //Clear old data of the list
        this.setState({dataSource: []});
        //Call the Service to get the latest data
        this.UpdateShiftDetails();
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
        const UpdateShiftDetails = this.state.UpdateShiftDetails;
         return (
            <View style={[{flex: 1, backgroundColor: "#fff"}]}>
                <OfflineNotice/>
                {
                    this.state.UpdateShiftDetails
                        ?
                        <View style={[{flex: 1, backgroundColor: "#fff"}]}>
                            {this.renderSpinner()}

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
                                                        const tempList = this.state.UpdateShiftDetails.clientUserIds;
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
                                                            style={[{height:Dimensions.get('window').width / 1.3}]}>
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
                                                        onChangeText={(clientID) => this.setState({clientID:clientID.trim()}, () => {

                                                            if (Utils.validateClientUserID(clientID).status === true) {
                                                                this.setState({clientIDButton: false, errorCreateClientID:null});
                                                            } else {
                                                                this.setState({clientIDButton: true, errorCreateClientID: Utils.validateClientUserID(clientID).message,});
                                                            }
                                                            // clientID === '' || clientID.trim().length === 0 ? this.setState({clientIDButton: true}) : this.setState({clientIDButton: false})
                                                        })}
                                                        value={this.state.clientID}
                                                    />
                                                </View>
                                                {
                                                    this.state.errorCreateClientID ?
                                                        <Text style={[Styles.cRed,Styles.f16,Styles.ffMregular,Styles.mBtm10]}>{this.state.errorCreateClientID}</Text>
                                                        :
                                                        null
                                                }
                                                <Text  style={[Styles.colorBlue, Styles.f14, Styles.ffMbold, Styles.aslCenter]}>Ex: VAN/SPVAN_WHIZ/104969578</Text>
                                                <Card.Actions style={[Styles.row, Styles.jSpaceBet, Styles.padV5]}>
                                                    <Button title='CANCEL' color={'#000'} compact={true}
                                                            style={[Styles.cBlk]}
                                                            onPress={() => this.setState({ModalClientUserID: false})}></Button>
                                                    <Button title='UPDATE' disabled={this.state.clientIDButton}
                                                            color={'#000'}
                                                            compact={true}
                                                            onPress={() => this.setState({
                                                                ModalClientUserID: false,
                                                                selectedClientUserID: this.state.clientID,
                                                                clientUserId:'',
                                                                defaultClientID: true
                                                            })}></Button>
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
                                        <Card style={[Styles.p10]} theme={theme}>
                                            <Card.Content style={[Styles.aslCenter, Styles.p5]}>
                                                <FastImage style={[Styles.aslCenter, Styles.img100, Styles.p10]}
                                                           source={LoadImages.siteWareHouse}/>
                                                <Title
                                                    style={[Styles.cBlk, Styles.f20, Styles.ffMbold, Styles.aslCenter,]}>{this.state.UpdateShiftDetails.siteName}</Title>
                                            </Card.Content>

                                            <Card.Title theme={theme}
                                                        titleStyle={[Styles.f16, Styles.ffMregular]}
                                                        style={[Styles.marV5, Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                        title={this.ShiftDuration(this.state.UpdateShiftDetails)}
                                                        left={() => <FastImage style={{width: 40, height: 40}}
                                                                               source={LoadImages.markedAttendance}/>}
                                            />
                                            <Card.Title theme={theme}
                                                        titleStyle={[Styles.f16, Styles.ffMregular]}
                                                        style={[Styles.marV5, Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                        title={<Text>
                                                            Expected Shift Duration <Text style={{
                                                            fontFamily: 'Muli-Bold',
                                                            fontSize: 18
                                                        }}>{this.state.UpdateShiftDetails.attributes.expectedDuration}</Text>
                                                        </Text>}
                                                        left={() => <Ionicons style={[Styles.marH5]} name="ios-alarm"
                                                                              size={40}
                                                                              color="red"/>}
                                            />
                                            <TouchableOpacity onPress={() => {
                                                this.setState({ModalWareHouse: false, ModalOpenAppURL: true})
                                            }}>
                                                <Card.Title theme={theme}
                                                            titleStyle={[Styles.f16, Styles.ffMregular]}
                                                            style={[Styles.marV5, Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                            title={this.state.UpdateShiftDetails.clientName}
                                                            left={() => <FastImage style={{width: 50, height: 60}}
                                                                                   source={LoadImages.routePoint}/>}
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[Styles.marV5]} onPress={() => {
                                                this.setState({ModalWareHouse: false})
                                            }}>
                                                <Card.Title theme={theme}
                                                            titleStyle={[Styles.f16, Styles.ffMregular, Styles.aslCenter]}
                                                            title='tap to dismiss'/>
                                            </TouchableOpacity>
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
                                                    style={[Styles.cBlk, Styles.f20, Styles.ffMbold, Styles.aslCenter,]}>{UpdateShiftDetails.clientName}-CLIENT</Title>
                                            </Card.Content>

                                            <TouchableOpacity
                                                disabled={UpdateShiftDetails.attributes.appLinkForAndroid=== null ? true :false} onPress={() => {
                                                Linking.openURL(UpdateShiftDetails.attributes.appLinkForAndroid)
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
                                                                LINK {UpdateShiftDetails.attributes.appLinkForAndroid=== null ? '(not available)' : null}</Text>
                                                        </View>
                                                    </View>
                                                    <View></View>
                                                </View>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                disabled={UpdateShiftDetails.attributes.appLinkForWeb=== null ? true :false}
                                                onPress={() => {
                                                    Linking.openURL(UpdateShiftDetails.attributes.appLinkForWeb)
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
                                                                LINK {UpdateShiftDetails.attributes.appLinkForWeb=== null ? '(not available)' : null}</Text>
                                                        </View>
                                                    </View>
                                                    <View></View>
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
                                                    UpdateShiftDetails.userRole === 1
                                                        ?
                                                        <FastImage style={[Styles.aslCenter, Styles.img100, Styles.m15]}
                                                                   source={LoadImages.activeDA}/>
                                                        :
                                                        UpdateShiftDetails.userRole === 5
                                                            ?
                                                            <FastImage
                                                                style={[Styles.aslCenter, Styles.img100, Styles.m10]}
                                                                source={LoadImages.activeDriver}/>
                                                            :
                                                            UpdateShiftDetails.userRole === 10
                                                                ?
                                                                <FastImage
                                                                    style={[Styles.aslCenter, Styles.img100, Styles.m10]}
                                                                    source={LoadImages.activeDDA}/>
                                                                :
                                                                UpdateShiftDetails.userRole === 15
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
                                                    style={[Styles.aslCenter, Styles.cBlk, Styles.f20, Styles.ffMbold]}>{UpdateShiftDetails.siteName}</Title>
                                            </Card.Content>

                                            <Card style={[styles.shadow, Styles.marV5]}>
                                                <Card.Title theme={theme}
                                                            titleStyle={[Styles.f16, Styles.ffMregular]}
                                                            style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                            title={<CText
                                                                cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>Shift Started at
                                                                <CText
                                                                    cStyle={[Styles.padV3, Styles.aslStart, Styles.cBlk, Styles.f18,Styles.ffMregular]}> {new Date(UpdateShiftDetails.actualStartTime).getHours()}:{new Date(UpdateShiftDetails.actualStartTime).getMinutes()}{this.ShiftDurationTracking(UpdateShiftDetails)}</CText></CText>}
                                                            left={() => <FastImage style={{width: 50, height: 60}}
                                                                                   source={LoadImages.warehouse}/>}
                                                />
                                            </Card>

                                            {
                                                UpdateShiftDetails.userRole === 1 || UpdateShiftDetails.userRole === 10
                                                    ?
                                                    <Card style={[styles.shadow, Styles.marV5]}>
                                                        <Card.Title theme={theme}
                                                                    titleStyle={[Styles.f16, Styles.ffMregular]}
                                                                    style={[Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                                                                    title={<CText
                                                                        cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{this.state.UpdateShiftDetails.pickUpPackagesCount}
                                                                        <CText
                                                                            cStyle={[Styles.padV3, Styles.aslStart, Styles.cBlk, Styles.f16,Styles.ffMregular]}>{' '}shift items to complete</CText></CText>}
                                                                    left={() => <FastImage style={{width: 40, height: 40}}
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
                                                                    cStyle={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{this.state.UpdateShiftDetails.clientName}</CText>}
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

                            {/*MODAL FOR SUPERVISOR LIST VIEW*/}
                            <Modal
                                transparent={true}
                                visible={this.state.ModalSupervisorVisible}
                                onRequestClose={() => {
                                    this.setState({ModalSupervisorVisible: false})
                                }}>
                                <View style={[Styles.modalfrontPosition]}>
                                    <TouchableOpacity onPress={() => {
                                        this.setState({ModalSupervisorVisible: false})
                                    }} style={[Styles.modalbgPosition]}>
                                    </TouchableOpacity>

                                    <View
                                        style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, {width: Dimensions.get('window').width - 20}]}>
                                        <Card.Content style={[Styles.aslCenter, Styles.p5, Styles.pBtm18]}>
                                            <FontAwesome name='phone' size={70} color="orange"
                                                         style={[Styles.aslCenter, Styles.p10]}/>
                                            <Title
                                                style={[Styles.cBlk, Styles.f18, Styles.ffMbold, Styles.aslCenter]}>{this.state.UpdateShiftDetails.siteName ? this.state.UpdateShiftDetails.siteName : '--'} Site</Title>
                                            <Title
                                                style={[Styles.cBlk, Styles.f18, Styles.ffMbold, Styles.aslCenter]}>Supervisor(s)</Title>
                                        </Card.Content>
                                        {
                                            this.state.SupervisorDetails.length === 0
                                                ?
                                                <Card.Title theme={theme}
                                                            style={[Styles.marV5, Styles.bgWhite, {fontFamily: "Muli-Bold"}]}
                                                            subtitle="site supervisor"
                                                            title="No Supervisor assigned"
                                                            left={() => <Avatar.Icon icon="contact-phone" size={40}
                                                                                     style={[Styles.aslCenter, Styles.p5]}/>}
                                                />
                                                :

                                                <ScrollView
                                                    persistentScrollbar={true}
                                                    showsHorizontalScrollIndicator={true}
                                                    style={[{height: this.state.SupervisorDetails.length === 1 ? 80 : this.state.SupervisorDetails.length === 2 ? 165 : Dimensions.get('window').height / 2.5}]}>
                                                    <FlatList
                                                        data={this.state.SupervisorDetails}
                                                        renderItem={({item}) => Services.getSupervisorList(item)}
                                                        extraData={this.state}
                                                        keyExtractor={(item, index) => index.toString()}/>
                                                </ScrollView>
                                        }

                                        <TouchableOpacity style={[Styles.marV5]} onPress={() => {
                                            this.setState({ModalSupervisorVisible: false})
                                        }}>
                                            <Card.Title theme={theme}
                                                        titleStyle={[Styles.f16, Styles.ffMregular, Styles.aslCenter]}
                                                        title='tap to dismiss'/>
                                        </TouchableOpacity>
                                    </View>

                                </View>

                            </Modal>


                            <Appbar.Header theme={theme} style={[Styles.bgWhite]}>
                                <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                                <Appbar.Content theme={theme}
                                                title={UpdateShiftDetails.status === 'INIT' ? new Date().toDateString() : new Date(this.state.UpdateShiftDetails.reportingTime).toDateString()}
                                                subtitle=""/>
                                <Appbar.Action icon="phone"
                                               onPress={() => this.setState({ModalSupervisorVisible: true})}/>
                                <Appbar.Action icon="autorenew" onPress={() => {
                                    this.UpdateShiftDetails()
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
                                        <TouchableOpacity onPress={() => {
                                            this.setState({ModalonDutyDelivery: true})
                                        }}
                                                          disabled={UpdateShiftDetails.status == 'SHIFT_IN_PROGRESS' ? false : true}
                                                          style={[Styles.aslCenter]}>
                                            {
                                                UpdateShiftDetails.userRole === 1
                                                    ?
                                                    UpdateShiftDetails.status === 'SHIFT_IN_PROGRESS'
                                                        ?
                                                        <FastImage style={[Styles.img70, Styles.p10]}
                                                                   source={LoadImages.activeDA}/>
                                                        :
                                                        <FastImage style={[Styles.img70, Styles.p10]}
                                                                   source={LoadImages.disabledDA}/>
                                                    :
                                                    UpdateShiftDetails.userRole === 5
                                                        ?
                                                        UpdateShiftDetails.status === 'SHIFT_IN_PROGRESS'
                                                            ?
                                                            <FastImage style={[Styles.img70, Styles.p10]}
                                                                       source={LoadImages.activeDriver}/>
                                                            :
                                                            <FastImage style={[Styles.img70, Styles.p10]}
                                                                       source={LoadImages.disabledDriver}/>
                                                        :
                                                        UpdateShiftDetails.userRole === 10
                                                            ?
                                                            UpdateShiftDetails.status === 'SHIFT_IN_PROGRESS'
                                                                ?
                                                                <FastImage style={[Styles.img70, Styles.p10]}
                                                                           source={LoadImages.activeDDA}/>
                                                                :
                                                                <FastImage style={[Styles.img70, Styles.p10]}
                                                                           source={LoadImages.activeDDA}/>
                                                            :
                                                            UpdateShiftDetails.userRole === 15
                                                                ?
                                                                UpdateShiftDetails.status === 'SHIFT_IN_PROGRESS'
                                                                    ?
                                                                    <FastImage style={[Styles.img70, Styles.p10]}
                                                                               source={LoadImages.activeLabourer}/>
                                                                    :
                                                                    <FastImage style={[Styles.img70, Styles.p10]}
                                                                               source={LoadImages.disabledLabourer}/>
                                                                :
                                                                UpdateShiftDetails.status === 'SHIFT_IN_PROGRESS'
                                                                    ?
                                                                    <FastImage style={[Styles.img70, Styles.p10]}
                                                                               source={LoadImages.activeSupervisor}/>
                                                                    :
                                                                    <FastImage style={[Styles.img70, Styles.p10]}
                                                                               source={LoadImages.disabledSupervisor}/>
                                            }
                                        </TouchableOpacity>
                                        <View pointerEvents="none">
                                            <FastImage style={{width: 70, height: 70}}
                                                       source={LoadImages.disabledENDPOINT}/>
                                        </View>
                                    </View>
                                </View>

                                {/*VIEW CONTAINS CLIENT-USERID,ODOMETER READINGS,PACKAGES*/}
                                <View style={[Styles.marH10, Styles.flex1, {marginTop: 15}]}>

                                    {/*user cominedID VIEW*/}
                                    {
                                        UpdateShiftDetails.requireClientLoginId
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
                                                                    this.getEnteredPhoneNumberProfiles(UpdateShiftDetails.phoneNumber)
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
                                        UpdateShiftDetails.userRole >= 15 || UpdateShiftDetails.userRole === 1
                                            ?
                                            null
                                            :
                                            <Card style={[styles.shadow, Styles.mTop10, {marginBottom: 15}]}>
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
                                                                disabled={this.state.KMreading ==='0'}
                                                                onPress={() => this.OdometerReadingValidate(this.state.KMreading, 'Decrement')}
                                                            >
                                                                <Text
                                                                    style={[styles.IncrementButton,{borderColor:this.state.KMreading ==='0'?'#f5f5f5': '#000',color:this.state.KMreading ==='0'?'#f5f5f5': '#000'}]}>-</Text></TouchableOpacity>
                                                            <TextInput
                                                                style={[Styles.txtAlignCen, {
                                                                    width: 70,
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
                                                                disabled={this.state.KMreading ==='999998'}
                                                                onPress={() => this.OdometerReadingValidate(this.state.KMreading, 'Increment')}
                                                            >
                                                                <Text
                                                                    style={[styles.IncrementButton,{borderColor:this.state.KMreading ==='999998'?'#f5f5f5': '#000',color:this.state.KMreading ==='999998'?'#f5f5f5': '#000'}]}>+</Text></TouchableOpacity>
                                                        </View>
                                                    }
                                                />
                                            </Card>

                                    }

                                    {/*PACKAGES LIST*/}
                                    {
                                        UpdateShiftDetails.userRole >= 15 || UpdateShiftDetails.userRole === 5
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
                                                            <Title
                                                                style={[Styles.cBlk, Styles.f20, Styles.ffMregular, Styles.aslCenter]}>
                                                                Something is wrong, Please call your supervisor and
                                                                mention
                                                                error 'Package Type Missing' in shifts.
                                                            </Title>
                                                        </Card.Content>
                                                        :
                                                        <FlatList
                                                            data={this.state.listOfPackages}
                                                            renderItem={({item, index}) => this.PackagesData(item, index)}
                                                            keyExtractor={(index, item) => JSON.stringify(item) + index}
                                                            extraData={this.state}
                                                        />
                                                }
                                            </ScrollView>
                                    }
                                </View>

                                {/*ROUTE TEXTINPUT*/}
                                {
                                    UpdateShiftDetails.userRole <= 15
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
                                    UpdateShiftDetails.requireTripSheetId
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
                                    UpdateShiftDetails.requirePartnerDetails
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


                            </ScrollView>

                            {/*WILL DISPLAY for >=15 ROLES ,SHOWING LOADER AND SHIFT STATUS*/}
                            {
                                UpdateShiftDetails.userRole >= 15
                                    ?
                                    Services.returnStatusText(UpdateShiftDetails.status)
                                    :
                                    null
                            }


                            {/* FOOTER BUTTON*/}
                            <View style={[Styles.footerUpdateButtonStyles]}>
                                {
                                    UpdateShiftDetails.userRole === 1
                                        ?
                                        <TouchableOpacity onPress={() => {
                                            this.ValidateShiftStart(UpdateShiftDetails)
                                        }} style={[Styles.br30, {
                                            backgroundColor: (UpdateShiftDetails.requireClientLoginId ? this.state.searchPhoneNumber.length === 10  &&
                                                (this.state.phoneNumberSearchData ? this.state.phoneNumberSearchData.existedUser : false) : true)
                                        && this.state.PackagesDisplay === true  ? '#000' : '#b2beb5'
                                        }]}
                                                          disabled={(UpdateShiftDetails.requireClientLoginId ? this.state.searchPhoneNumber.length === 10  &&
                                                              (this.state.phoneNumberSearchData ? this.state.phoneNumberSearchData.existedUser : false) : true)
                                                          && this.state.PackagesDisplay === true? false : true}>
                                            <CText
                                                cStyle={[Styles.cWhite, Styles.f20, Styles.p10, Styles.aslCenter, Styles.ffMregular]}>UPDATE
                                                SHIFT</CText>
                                        </TouchableOpacity>
                                        :
                                        UpdateShiftDetails.userRole === 5
                                            ?
                                            <TouchableOpacity onPress={() => {
                                                this.ValidateShiftStart(UpdateShiftDetails)
                                            }} style={[Styles.br30, {
                                                backgroundColor:  this.state.defaultOdometer === true ? '#000' : '#b2beb5'
                                            }]}
                                                              disabled={ this.state.defaultOdometer === true ? false : true}>
                                                <CText
                                                    cStyle={[Styles.cWhite, Styles.f20, Styles.p10, Styles.aslCenter, Styles.ffMregular]}>UPDATE
                                                    SHIFT</CText>
                                            </TouchableOpacity>
                                            :
                                            UpdateShiftDetails.userRole === 10
                                                ?
                                                <TouchableOpacity onPress={() => {
                                                    this.ValidateShiftStart(UpdateShiftDetails)
                                                }} style={[Styles.br30, {
                                                    backgroundColor:(UpdateShiftDetails.requireClientLoginId ? this.state.searchPhoneNumber.length === 10  &&
                                                        (this.state.phoneNumberSearchData ? this.state.phoneNumberSearchData.existedUser : false) : true)
                                                    && this.state.defaultOdometer === true && this.state.PackagesDisplay === true ? '#000' : '#b2beb5'
                                                }]} disabled={(UpdateShiftDetails.requireClientLoginId ? this.state.searchPhoneNumber.length === 10  &&
                                                    (this.state.phoneNumberSearchData ? this.state.phoneNumberSearchData.existedUser : false) : true)
                                                && this.state.defaultOdometer === true && this.state.PackagesDisplay === true ? false : true}>
                                                    <CText
                                                        cStyle={[Styles.cWhite, Styles.f20, Styles.p10, Styles.aslCenter, Styles.ffMregular]}>UPDATE
                                                        SHIFT</CText>
                                                </TouchableOpacity>
                                                :
                                                UpdateShiftDetails.userRole >= 15
                                                    ?
                                                    <TouchableOpacity onPress={() => {
                                                        this.ValidateShiftStart(UpdateShiftDetails)
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
        borderColor: '#b2beb5',
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
