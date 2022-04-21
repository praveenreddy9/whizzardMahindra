import * as React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    FlatList,
    Modal,
    Dimensions,
    TextInput,
    Keyboard,
    Button,
    DatePickerAndroid,
    Picker,
    Alert,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    RefreshControl
} from "react-native";
import {Appbar, Card, Chip, DefaultTheme, List, TextInput as Input, Title, RadioButton} from "react-native-paper";
import OneSignal from "react-native-onesignal";
import HomeScreen from './HomeScreen';
import {CSpinner, LoadImages, LoadSVG, Styles} from "./common";
import Utils from './common/Utils';
import OfflineNotice from "./common/OfflineNotice";
import Config from "./common/Config";
import Services from "./common/Services";
import {Column as Col, Row} from "react-native-flexbox-grid";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import Ionicons from "react-native-vector-icons/dist/Ionicons";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import AsyncStorage from "@react-native-community/async-storage";
import _ from 'lodash';
import item from "react-native-calendars/src/calendar-list/item";
import ImageZoom from "react-native-image-pan-zoom";


const colors = ['#D6D1B4', '#F3F2F2', '#FFEE93', '#ccf6d8', '#ECF3AB', '#F8F1EC', '#F4EDAB'];

const theme = {
    ...DefaultTheme,
    fonts: {
        ...DefaultTheme.fonts,
        regular: 'Muli-Regular',
    },
    colors: {
        ...DefaultTheme.colors,
        text: '#233167',
        primary: '#233167', fontWeight: 'bold'
    },

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

export default class TripSummaryReport extends React.Component {

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
            reportsList: [], page: 1, size: 20, totalElements: 0, refreshing: false,
            spinnerBool: false,
            selectedReportData: [], sitesList: [],tempDeliveredPackages:[],
            showReportsModal: false, accessToEditData: false, showShiftData: false,
            tripTypeSelectionModal: false, packageSelectionModal: false, filtersModal: false,
            tripTypeList: [
                // {value: 'REGULAR', name: 'Regular', key: 1},
                // {value: 'IHS 6 hrs', name: 'IHS 6 hrs', key: 2},
                // {value: 'IHS 12 hrs', name: 'IHS 12 hrs', key: 3},
                // {value: 'Permanent 6 hrs', name: 'Permanent 6 hrs', key: 4},
                // {value: 'Permanent 12 hrs', name: 'Permanent 12 hrs', key: 5},
                // {value: 'NOLOAD', name: 'No Load', key: 6},
                // {value: 'Absent', name: 'Absent', key: 7},
            ],
            filterFromDate: Services.returnYesterdayDate(), filterToDate: Services.returnYesterdayDate(),
            filterVehilceType: 'All', filterVerifiedType: 'All', filterRole: 'All', filterSiteId: 'All',
            vehicleTypeList: [{value: 'All', label: 'All', key: 0},
                {value: '2', label: '2 Wheeler', key: 1},
                {value: '3', label: '3 Wheeler', key: 2},
                {value: '4', label: '4 Wheeler', key: 3}],
            verifiedTypeList: [
                {value: 'All', label: 'All', key: 1},
                {value: 'verified', label: 'Verified', key: 2},
                {value: 'unVerified', label: 'Un-Verified', key: 3}],
            rolesList: [{value: 'All', label: 'All', key: 0},
                {value: '1', label: 'Associate', key: 1},
                {value: '5', label: 'Driver', key: 2},
                {value: '10', label: 'Driver & Associate', key: 3},
                {value: '19', label: 'Process Associate', key: 4},
                {value: '25', label: 'Shift Lead', key: 5},
            ],
            imagePreview: false, imagePreviewURL: '',imageRotate:'0',
        }
    }

    componentDidMount() {
        const self = this;
        AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
            let tempRole = JSON.parse(userRole)
            // console.log('userRole', tempRole, typeof (tempRole))
            self.setState({userRole: tempRole}, () => {
                self.getTripSummaryReportList();
                self.getTripTypesList();
                self.getLoggedUserSites();
            })
        })
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }


    errorHandling(error) {
        console.log("trip summary report error", error, error.response);
        const self = this;
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
                Utils.dialogBox("Error loading Shifts, Please contact Administrator ", '');
            }
        } else {
            self.setState({spinnerBool: false});
            Utils.dialogBox(error.message, '');
        }
    }

    //API CALL FOR ShiftsList
    getTripTypesList() {
        const self = this;
        let userId = self.state.userId;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_TRIP_TYPES_LIST;
        const body = {}
        // console.log('Trip types apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    // console.log(' trip types List 200', responseList);
                    self.setState({
                        tripTypeList: responseList,
                        spinnerBool: false,
                    });
                }
            }, (error) => {
                // console.log('error in trip types list');
                self.errorHandling(error)
            })
        });
    };

    getLoggedUserSites() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_LOGGED_USER_SITES;
        const body = {
            businessUnits: [],
            cityIds: [],
            regionIds: [],
            states: [],
            // page: self.state.page,
            // size: 15
        };
        // console.log('get LoggedUser Sites apiUrl==>',apiUrl,'body==>', body,)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("Sites resp200", response.data);
                    let tempResponse = response.data
                    tempResponse.push({id: '', siteLable: 'All'})
                    tempResponse.unshift(tempResponse.pop());
                    self.setState({
                        sitesList: tempResponse,
                        spinnerBool: false
                    })
                }
            }, function (error) {
                // console.log('get LoggedUser Sites error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };


    //API CALL FOR ShiftsList
    getTripSummaryReportList() {
        const self = this;
        let userId = self.state.userId;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_TRIP_SUMMARY_REPORTS;
        const {page, reportsList} = self.state;
        const body = {
            businessUnits: [],
            cityIds: [],
            clientIds: [],
            endDateStr: Services.returnCalendarFormat(this.state.filterToDate),
            roles: this.state.filterRole === 'All' ? [] : [this.state.filterRole] ,
            siteIds: this.state.filterSiteId === 'All' ? [] : [this.state.filterSiteId] ,
            startDateStr: Services.returnCalendarFormat(this.state.filterFromDate),
            // startDateStr: '2021-04-22',
            states: [],
            // userIds: ['5e3a418080d0107b1eb86b24'],
            // userIds: ['5ff11624ceba2ccf1f2d3192'],
            userIds: [],
            vehicleType: this.state.filterVehilceType === 'All' ? '': this.state.filterVehilceType ,
            verified: this.state.filterVerifiedType,
            page: page,
            size: 15,
            sort: "tripDateStr,asc"
        }
        // console.log('get Trip Summary ReportList apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    // console.log(' getShifts List 200', responseList);
                    self.setState({
                        // reportsList: response.data.content,
                        reportsList: page === 1 ? response.data.content : [...reportsList, ...response.data.content],
                        totalPages: response.data.totalPages,
                        totalElements: response.data.totalElements,
                        spinnerBool: false,
                        filtersModal: false,
                        showReportsModal: false, refreshing: false,
                        accessToEditData: false
                    });
                }
            }, (error) => {
                // console.log('error in reports List');
                self.errorHandling(error)
            })
        });
    }

    handleRefresh = () => {
        //Clear old data of the list
        this.setState({page: 1, reportsList: []});
        //Call the Service to get the latest data
        this.getTripSummaryReportList();
    };

    handleLoadMore = () => {
        // console.log('handleLoadMore', this.state.page,this.state.totalPages);
        this.state.page < this.state.totalPages ?
            this.setState({
                page: this.state.page + 1
            }, () => {
                // console.log('this.state.page ----', this.state.page);
                this.getTripSummaryReportList();
            })
            :
            null
    };
    renderFooter = () => {
        return (
            this.state.page < this.state.totalPages ?
                <View>
                    <ActivityIndicator animating size="large"/>
                </View> :
                null
        );
    };

    updateTripDetails(item) {
        let inValidTrip = false;
        if (this.state.selectedTripValue === 'NOLOAD' || this.state.selectedTripValue === 'Absent' || this.state.selectedTripValue === "ABSENT" ||
            this.state.selectedTripValue === "NO_LOAD" || this.state.selectedTripValue === 'No Load') {
            inValidTrip = true;
        }
        // console.log('inValidTrip',inValidTrip);
        let body = {
            "tripSummaryReportId": item.id,
            "tripType": this.state.selectedTripValue,
            "tripSheetId": inValidTrip ? null : this.state.tripSheetId,
            "remarks":  this.state.remarks,
            "route": inValidTrip ? null : this.state.route,
            "clientUserId": inValidTrip ? null : this.state.clientUserId,
            "startingKM": inValidTrip ? 0 : this.state.startingKM ? JSON.parse(this.state.startingKM) : '',
            "endingKm": inValidTrip ? 0 : this.state.endingKm ? JSON.parse(this.state.endingKm) : '',
            "packages": item.packages,
            "deliveredPackages":inValidTrip ? item.deliveredPackages : this.state.tempDeliveredPackages
        }
        this.updateTrip(body)
        // console.log('update body',body);
    }

    //API CALL to update trip
    updateTrip(data) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.UPDATE_TRIP_DETAILS;
        const body = [data];
        // console.log('updateTrip apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, (response) => {
                if (response.status === 200) {
                    // console.log('updateTrip List 200', response.data);
                    self.setState({
                        spinnerBool: false, page: 1, reportsList: [],accessToEditData:false
                    }, () => {
                        self.getTripSummaryReportList();
                    });
                }
            }, (error) => {
                // console.log('error in updateTrip');
                self.errorHandling(error)
            })
        });
    }

    validateTripDetails(selectedReportData,button) {
        let tempData = selectedReportData

        if (this.state.selectedTripValue === 'NOLOAD' || this.state.selectedTripValue === 'Absent' ||this.state.selectedTripValue === "ABSENT" ||
            this.state.selectedTripValue === "NO_LOAD" || this.state.selectedTripValue === 'No Load'){
            this.confirmTripDetails(tempData, button)
        }else {
            let role = tempData.role

            if (role === 1) {
                if (tempData.packages) {
                    if (this.state.totalDeliveredCount === this.state.pickupPackages) {
                        this.confirmTripDetails(tempData, button)
                    } else {
                        Utils.dialogBox('Pickup and Delivered count must be equal', '');
                    }
                } else {
                    this.confirmTripDetails(tempData, button)
                }
            } else if (role === 5) {
                if (this.state.startingKM <= this.state.endingKm) {
                    this.confirmTripDetails(tempData, button)
                } else {
                    Utils.dialogBox('End KM readings are less than start', '');
                }
            } else if (role === 10) {
                if (this.state.startingKM <= this.state.endingKm) {
                    if (tempData.packages) {
                        if (this.state.totalDeliveredCount === this.state.pickupPackages) {
                            this.confirmTripDetails(tempData, button)
                        } else {
                            Utils.dialogBox('Pickup and Delivered count must be equal', '');
                        }
                    } else {
                        this.confirmTripDetails(tempData, button)
                    }
                } else {
                    Utils.dialogBox('End KM readings are less than start', '');
                }
            }
        }
    }

    confirmTripDetails(tempData,button) {
        if (button=== 'VERIFY') {
            Alert.alert('You are verifying ' + tempData.attrs.userName + ' Trip', alert,
                [{text: 'Cancel'}, {
                    text: 'Yes', onPress: () => {
                        this.verifyTripDetails(tempData.id)
                    }
                }]
            )
        }else {
            this.updateTripDetails(tempData)
        }
    }

    //API CALL to verify trip
    verifyTripDetails(tripID) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.VERIFY_TRIP_DETAILS + tripID;
        const body = {}
        // console.log('verify Trip Details apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, (response) => {
                if (response.status === 200) {
                    // console.log(' verify Trip Details List 200', response.data);
                    self.setState({
                        spinnerBool: false, page: 1, reportsList: []
                    }, () => {
                        self.getTripSummaryReportList();
                    });
                }
            }, (error) => {
                // console.log('error in verify Trip Details');
                self.errorHandling(error)
            })
        });
    }


    useSelectedDataReport(item) {
        // let tempTotal = item.attempts + item.totalDeliveries + item.customerReturnsPickedUpCount + item.rejectedCount
        console.log('selected item', item);
        let tempPackages = item.deliveredPackages;
        let tempSum = tempPackages.reduce((n, {count}) => n + count, 0);

        // console.log('tempSum==',tempSum);

        this.setState({
            selectedReportData: item,
            route: item.route,
            remarks: item.remarks,
            clientUserId: item.clientUserId,
            tripSheetId: item.tripSheetId,
            startingKM: JSON.stringify(item.startingKM),
            endingKm: JSON.stringify(item.endingKm),
            pickupPackages: JSON.stringify(item.packages),
            totalDeliveredCount: JSON.stringify(tempSum),
            tempDeliveredPackages:item.deliveredPackages,
            selectedTripValue: item.tripType,
            selectedTripType: item.tripType,
            showReportsModal: true
        })
    };

    noLoadSelectedValidation(item, value) {
        // console.log('no load function hit',value)
        // let tempTotal = item.attempts + item.totalDeliveries + item.customerReturnsPickedUpCount + item.rejectedCount
        let tempPackages = item.deliveredPackages;
        let tempSum = tempPackages.reduce((n, {count}) => n + count, 0);
        let inValidTrip = false;
        if (value === 'NOLOAD' || value === 'Absent' ||value === "ABSENT" ||
            value === "NO_LOAD" || value === 'No Load') {
            inValidTrip = true;
        }
        this.setState({
            selectedReportData: item,
            // load: inValidTrip ? '0' : JSON.stringify(item.load),
            // touchPoints: inValidTrip ? '0' : JSON.stringify(item.touchPoints),
            route: inValidTrip ? 'NA' : item.route,
            clientUserId: inValidTrip ? 'NA' : item.clientUserId,
            // remarks: value === 'NOLOAD' || value === 'Absent' ? 'NA' : item.remarks,
            tripSheetId: inValidTrip ? 'NA' : item.tripSheetId,
            startingKM: inValidTrip ? '0' : JSON.stringify(item.startingKM),
            endingKm: inValidTrip ? '0' : JSON.stringify(item.endingKm),
            pickupPackages: inValidTrip ? '0' : JSON.stringify(item.packages),
            totalDeliveredCount: inValidTrip ? '0' : JSON.stringify(tempSum),
            deliveredPackages: inValidTrip ? '0' : item.deliveredPackages,
            tempDeliveredPackages: inValidTrip ? '0' : item.deliveredPackages,
            // deliveredPackages: inValidTrip ? '0' : JSON.stringify(item.totalDeliveries),
            // attempts: inValidTrip ? '0' : JSON.stringify(item.attempts),
            // rejectedCount: inValidTrip ? '0' : JSON.stringify(item.rejectedCount),
            // cReturnCancelled: inValidTrip ? '0' : JSON.stringify(item.customerReturnsCancelledCount),
            // cReturnPickedUp: inValidTrip ? '0' : JSON.stringify(item.customerReturnsPickedUpCount),
            selectedTripValue: this.state.selectedTripValue,
            selectedTripType: this.state.selectedTripType,

        })
    };

    OdometerReadingValidate(item, operator, settingValue) {
        // console.log('validation settingvalue', settingValue, 'item', item);
        // endingKm
        if (operator === 'onChange') {
            var value = Math.trunc(parseInt(item));
            // console.log('value Tin',value)
            const initialValue = JSON.stringify(value)

            let num = initialValue.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');
            if (num > 0) {
                if (num >= 999999) {
                    const tempValue = 999998;
                    if (settingValue === 'startingKM') {
                        this.setState({startingKM: JSON.stringify(tempValue)})
                    } else if (settingValue === 'endingKm') {
                        this.setState({endingKm: JSON.stringify(tempValue)})
                    } else if (settingValue === 'load') {
                        this.setState({load: JSON.stringify(tempValue)})
                    } else if (settingValue === 'touchPoints') {
                        this.setState({touchPoints: JSON.stringify(tempValue)})
                    }
                } else {
                    if (settingValue === 'startingKM') {
                        this.setState({startingKM: num})
                    } else if (settingValue === 'endingKm') {
                        this.setState({endingKm: num})
                    } else if (settingValue === 'load') {
                        this.setState({load: num})
                    } else if (settingValue === 'touchPoints') {
                        this.setState({touchPoints: num})
                    }
                }
            } else {
                if (settingValue === 'startingKM') {
                    this.setState({startingKM: num})
                } else if (settingValue === 'endingKm') {
                    this.setState({endingKm: num})
                } else if (settingValue === 'load') {
                    this.setState({load: num})
                } else if (settingValue === 'touchPoints') {
                    this.setState({touchPoints: num})
                }
            }
        } else {
            if (item === '') {
                item = 0;
                if (settingValue === 'startingKM') {
                    this.setState({startingKM: JSON.stringify(item)})
                } else if (settingValue === 'endingKm') {
                    this.setState({endingKm: JSON.stringify(item)})
                } else if (settingValue === 'load') {
                    this.setState({load: JSON.stringify(item)})
                } else if (settingValue === 'touchPoints') {
                    this.setState({touchPoints: JSON.stringify(item)})
                }
            } else {
                let value = Math.trunc(parseInt(item));
                if (operator === 'Increment') {
                    if (value >= 999998) {
                        const tempValue = 999998;
                        if (settingValue === 'startingKM') {
                            this.setState({startingKM: JSON.stringify(tempValue)})
                        } else if (settingValue === 'endingKm') {
                            this.setState({endingKm: JSON.stringify(tempValue)})
                        } else if (settingValue === 'load') {
                            this.setState({load: JSON.stringify(tempValue)})
                        } else if (settingValue === 'touchPoints') {
                            this.setState({touchPoints: JSON.stringify(tempValue)})
                        }
                        Utils.dialogBox('Reached Maximum Value', '');
                    } else {
                        const tempValue = value + 1;
                        if (settingValue === 'startingKM') {
                            this.setState({startingKM: JSON.stringify(tempValue)})
                        } else if (settingValue === 'endingKm') {
                            this.setState({endingKm: JSON.stringify(tempValue)})
                        } else if (settingValue === 'load') {
                            this.setState({load: JSON.stringify(tempValue)})
                        } else if (settingValue === 'touchPoints') {
                            this.setState({touchPoints: JSON.stringify(tempValue)})
                        }
                    }
                } else if (operator === 'Decrement') {
                    if (value <= 0) {
                        // const tempValue = 0;
                        if (settingValue === 'startingKM') {
                            this.setState({startingKM: JSON.stringify(value)})
                        } else if (settingValue === 'endingKm') {
                            this.setState({endingKm: JSON.stringify(value)})
                        } else if (settingValue === 'load') {
                            this.setState({load: JSON.stringify(value)})
                        } else if (settingValue === 'touchPoints') {
                            this.setState({touchPoints: JSON.stringify(value)})
                        }
                        // Utils.dialogBox('Reached Minimum Value', '');
                    } else if (value > 999999) {
                        const tempValue = 999999 - 1;
                        if (settingValue === 'startingKM') {
                            this.setState({startingKM: JSON.stringify(tempValue)})
                        } else if (settingValue === 'endingKm') {
                            this.setState({endingKm: JSON.stringify(tempValue)})
                        } else if (settingValue === 'load') {
                            this.setState({load: JSON.stringify(tempValue)})
                        } else if (settingValue === 'touchPoints') {
                            this.setState({touchPoints: JSON.stringify(tempValue)})
                        }
                        Utils.dialogBox('Reached Maximum Value', '');
                    } else {
                        const tempValue = value - 1;
                        if (tempValue === 0) {
                            if (settingValue === 'startingKM') {
                                this.setState({startingKM: JSON.stringify(tempValue)})
                            } else if (settingValue === 'endingKm') {
                                this.setState({endingKm: JSON.stringify(tempValue)})
                            } else if (settingValue === 'load') {
                                this.setState({load: JSON.stringify(tempValue)})
                            } else if (settingValue === 'touchPoints') {
                                this.setState({touchPoints: JSON.stringify(tempValue)})
                            }
                        } else {
                            if (settingValue === 'startingKM') {
                                this.setState({startingKM: JSON.stringify(tempValue)})
                            } else if (settingValue === 'endingKm') {
                                this.setState({endingKm: JSON.stringify(tempValue)})
                            } else if (settingValue === 'load') {
                                this.setState({load: JSON.stringify(tempValue)})
                            } else if (settingValue === 'touchPoints') {
                                this.setState({touchPoints: JSON.stringify(tempValue)})
                            }
                        }
                    }
                }
            }
        }
    }


    deliveredPackageValidation(count, counter, type,index) {
        // console.log('deliver validations count',count,'counter===>',counter,'type===',type,'index==>',index);
        let TargetValue = Math.trunc(parseInt(this.state.pickupPackages));
        if (counter === 'Decrement') {
            if (count === '') {
                Utils.dialogBox('Please enter a value', '');
            } else {
                let value = Math.trunc(parseInt(count));
                if (value < 1) {
                    Utils.dialogBox('Minimum value is 0', '');
                } else {
                    let tempItem = (Math.trunc(Number(count) - 1));
                    let tempDeliveredPackages = [...this.state.tempDeliveredPackages]
                    tempDeliveredPackages[index] = {
                        ...tempDeliveredPackages[index],
                        count:tempItem
                    }
                    // console.log('tempDeliveredPackages decrement',tempDeliveredPackages);
                    this.calculatePackages(tempDeliveredPackages)
                    // this.setState({tempDeliveredPackages})
                }
            }

        } else if (counter === 'Increment') {
            let value = Math.trunc(parseInt(count));
            if (value > TargetValue - 1) {
                Utils.dialogBox('Maximum value is ' + TargetValue, '');
            } else {
                let tempItem = (Math.trunc(Number(count) + 1));

                let tempDeliveredPackages = [...this.state.tempDeliveredPackages]
                tempDeliveredPackages[index] = {
                    ...tempDeliveredPackages[index],
                   count:tempItem
                }
                // console.log('tempDeliveredPackages increment',tempDeliveredPackages);
                this.calculatePackages(tempDeliveredPackages)
                // this.setState({tempDeliveredPackages})

            }
        } else {
            let value = count;
            if (value > TargetValue) {
                Utils.dialogBox('Maximum value is ' + TargetValue, '');
            } else if (value < 0) {
                // Utils.dialogBox('Minimum value is ' + tempItem.minimumValue, '');
            } else if (count === '') {
                Utils.dialogBox('Please enter a value', '');
            } else {
                let tempItem = ''
                if (isNaN(value)) {
                    tempItem = value.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');
                } else {
                    tempItem = value === '' ? '' : parseInt(value.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, ''));
                }

                let tempDeliveredPackages = [...this.state.tempDeliveredPackages]
                tempDeliveredPackages[index] = {
                    ...tempDeliveredPackages[index],
                    count:tempItem
                }
                // console.log('tempDeliveredPackages increment',tempDeliveredPackages);
                this.calculatePackages(tempDeliveredPackages)
                // this.setState({tempDeliveredPackages})

            }
        }
    }

    // calculatePackages(deliveredPackages, attempts, rejectedCount, cReturnPickedUp) {
    calculatePackages(packagesList) {
        let tempSum = packagesList.reduce((n, {count}) => n + count, 0);

        this.setState({totalDeliveredCount: JSON.stringify(tempSum),tempDeliveredPackages:packagesList})
    }

    revertValues() {
        let oldData = this.state.selectedReportData;
        // console.log('revert values',oldData);
        // let tempTotal = oldData.attempts + oldData.totalDeliveries + oldData.customerReturnsPickedUpCount + oldData.rejectedCount
        let tempPackages = oldData.deliveredPackages;
        let tempSum = tempPackages.reduce((n, {count}) => n + count, 0);
        this.setState({
            pickupPackages: JSON.stringify(oldData.packages),
            totalDeliveredCount: JSON.stringify(tempSum),
            packageSelectionModal: false,
            tempDeliveredPackages:oldData.deliveredPackages
            // deliveredPackages: JSON.stringify(oldData.totalDeliveries),
            // attempts: JSON.stringify(oldData.attempts),
            // rejectedCount: JSON.stringify(oldData.rejectedCount),
            // cReturnCancelled: JSON.stringify(oldData.customerReturnsCancelledCount),
            // cReturnPickedUp: JSON.stringify(oldData.customerReturnsPickedUpCount)
        })
    }

    datePicker(option) {
        const self = this;
        try {
            const {action, year, month, day} = DatePickerAndroid.open({
                date: new Date(),
                maxDate: new Date(),
                // minDate: null,
                // mode: 'spinner',
            }).then((response) => {
                // console.log('date pciker response',response)

                if (response.action === "dateSetAction") {
                    let tempDate = new Date()
                    tempDate = new Date(response.year, response.month, response.day)
                    if (option === 'filterToDate') {
                        var filterToDate = Services.returnCalendarFormat(tempDate);
                        var filterFromDate = Services.returnCalendarFormat(this.state.filterFromDate);

                        if (filterFromDate <= filterToDate) {
                            self.setState({filterToDate: tempDate});
                        } else {
                            Utils.dialogBox('Selected Date is less than from date', '')
                        }
                    } else {
                        self.setState({filterFromDate: tempDate, filterToDate: tempDate});
                    }

                }
            });
        } catch ({code, message}) {
            console.warn('Cannot open date picker', message);
        }
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
        const {reportsList, selectedReportData, accessToEditData,tempDeliveredPackages} = this.state;
        // const colors = ['#D6D1B4', '#F3F2F2', '#FFEE93', '#ccf6d8', '#F8F1EC', '#ECF3AB', '#F4EDAB'];
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                {this.renderSpinner()}
                <OfflineNotice/>
                <Appbar.Header style={[Styles.bgDarkRed]}>
                    <Appbar.Action icon="menu" size={30} onPress={() => {
                        this.props.navigation.openDrawer();
                    }}/>
                    <Appbar.Content title={"Trip Reports" + '(' + this.state.totalElements + ')'}/>
                    <FontAwesome name="filter" size={30} style={{color: '#fff', paddingRight: 6}} onPress={() => {
                        this.setState({filtersModal: true})
                    }}/>
                </Appbar.Header>
                {this.renderSpinner()}
                <View style={{flex: 1, alignItems: 'center', backgroundColor: '#dcdcdc'}}>
                    <Row size={12} nowrap style={[Styles.row, Styles.p10, Styles.alignCenter, Styles.bgOrangeYellow, {
                        marginBottom: 5
                    }]}>
                        <Col sm={4}>
                            <Text style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Name</Text>
                        </Col>
                        <Col sm={2}>
                            <Text style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Site</Text>
                        </Col>
                        <Col sm={4}>
                            <Text style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Trip Type</Text>
                        </Col>
                        <Col sm={2}>
                            <Text style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Status</Text>
                        </Col>
                        <Col sm={1}>
                            {/*<Text style={[Styles.ffMbold, Styles.f16]}>Time</Text>*/}
                        </Col>
                    </Row>
                    <View style={[Styles.row, Styles.aslCenter]}>
                        <View style={[Styles.flex1]} refreshControl={
                            <RefreshControl
                                refreshing={this.state.refreshing}
                                onRefresh={this.getTripSummaryReportList.bind(this)}/>
                        }>
                            {
                                reportsList.length === 0
                                    ?
                                    <Text
                                        style={[Styles.colorBlue, Styles.f20, Styles.aslCenter, Styles.ffMbold, Styles.pTop20]}>No
                                        Trip
                                        Reports Found....</Text>
                                    :
                                    null
                            }
                                <FlatList
                                    style={[Styles.mBtm20]}
                                    data={reportsList}
                                    renderItem={({item, index}) => (
                                        <TouchableOpacity onPress={() => this.setState({
                                            // selectedReportData: item,
                                            // showReportsModal: true,
                                            tempDeliveredPackages:item.deliveredPackages,
                                            accessToEditData:false
                                        }, () => {
                                            this.useSelectedDataReport(item)
                                        })}>
                                            <Row size={12} nowrap
                                                 style={[Styles.row, Styles.p10, Styles.alignCenter,
                                                     {backgroundColor: ((index % 2) === 0 ? '#f5f5f5' : '#fff')}
                                                 ]}>
                                                <Col sm={4}>
                                                    <View>
                                                        <Text
                                                            style={[Styles.ffMregular, Styles.f14,]}>{_.startCase(_.toLower(item.attrs.userName))  || '---'}{'(' + Services.getUserRolesShortName(item.role) + ')'}</Text>
                                                        {
                                                            item.vehicleType
                                                                ?
                                                                <Image
                                                                    style={[ {height: 25, width: 25}]}
                                                                    source={item.vehicleType === 2 ? LoadImages.vehicle_two : item.vehicleType === 3 ? LoadImages.vehicle_three : item.vehicleType === 4 ? LoadImages.vehicle_four : null}
                                                                />
                                                                :
                                                                null
                                                        }
                                                    </View>
                                                </Col>
                                                <Col sm={2}>
                                                        <Text  style={[Styles.ffMregular, Styles.f14, Styles.alignCenter]}>{item.attrs.siteCode || '---'}</Text>
                                                </Col>

                                                <Col sm={3}>
                                                    <View style={[Styles.alignCenter]}>
                                                        <Text
                                                            style={[Styles.ffMregular, Styles.f16, Styles.alignCenter]}>{_.startCase(_.toLower(item.tripType))}</Text>
                                                    </View>
                                                </Col>
                                                <Col sm={3}>
                                                    <View style={[Styles.alignCenter]}>
                                                        {
                                                            item.verified
                                                                ?
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.colorGreen, Styles.f16, Styles.alignCenter]}>Verified</Text>
                                                                :
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.cRed, Styles.f16, Styles.alignCenter,]}>Pending</Text>
                                                        }
                                                        <Text  style={[Styles.ffMregular, Styles.colorBlue, Styles.f12, Styles.alignCenter,]}>({item.tripDateStr})</Text>
                                                    </View>
                                                </Col>
                                                {/*<Col sm={1}>*/}
                                                {/*    <FontAwesome name="info-circle" size={30} color="#000"*/}
                                                {/*                 onPress={() => this.setState({*/}
                                                {/*                     selectedReportData: item,*/}
                                                {/*                     showReportsModal: true*/}
                                                {/*                 })}*/}
                                                {/*    />*/}
                                                {/*</Col>*/}
                                            </Row>
                                        </TouchableOpacity>

                                    )}
                                    keyExtractor={(item, index) => index.toString()}
                                    refreshing={this.state.refreshing}
                                    onRefresh={this.handleRefresh}
                                    onEndReached={this.handleLoadMore}
                                    contentContainerStyle={{marginBottom: 50}}
                                    onEndReachedThreshold={1}
                                    ListFooterComponent={this.renderFooter}
                                />
                        </View>
                    </View>
                </View>


                {/*MODALS START*/}

                {/*Selected REPORT DETIALS Modal */}
                <Modal
                    transparent={true}
                    visible={this.state.showReportsModal}
                    onRequestClose={() => {
                        this.setState({showReportsModal: false})
                    }}>
                    <View style={[Styles.aitCenter, Styles.jCenter, {
                        backgroundColor: 'rgba(0, 0, 0 ,0.7)',
                        top: 0,
                        bottom: 0,
                        flex: 1
                    }]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({showReportsModal: false, accessToEditData: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <View
                            style={[Styles.bgWhite,Styles.flex1, {
                                width: Dimensions.get('window').width,
                                height: Dimensions.get('window').height
                            }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                                <Appbar.Content
                                    title={(selectedReportData.attrs ? _.startCase(_.toLower(selectedReportData.attrs.userName)) : '--' || '--') + ' (' + Services.getUserRolesShortName(selectedReportData.role) + ')'}
                                    titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() => this.setState({
                                                            showReportsModal: false,
                                                            accessToEditData: false
                                                        })}/>
                            </Appbar.Header>
                            {selectedReportData ?
                                <View style={[Styles.flex1, Styles.p10, Styles.pBtm18]}>
                                    {
                                        selectedReportData.attrs
                                            ?
                                            <View style={[Styles.row, Styles.flexWrap, Styles.padV5]}>
                                                <View
                                                    style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                    style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                    style={[Styles.ffMbold, Styles.colorBlue]}>Date:</Text> {selectedReportData.tripDateStr || '--'}
                                                </Text>
                                                </View>
                                                <View
                                                    style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                    style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                    style={[Styles.ffMbold, Styles.colorBlue]}>PAN:</Text> {selectedReportData.attrs.panCardNumber || '--'}
                                                </Text></View>


                                                {
                                                    this.state.showShiftData
                                                        ?
                                                        <View style={[Styles.row, Styles.flexWrap]}>
                                                            <View
                                                                style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>Mobile:</Text> {selectedReportData.attrs.phoneNumber || '--'}
                                                            </Text></View>
                                                            <View
                                                                style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>Site
                                                                Code:</Text> {selectedReportData.attrs.siteCode || '--'}
                                                            </Text></View>
                                                            <View
                                                                style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>Attendance:</Text> {selectedReportData.attendance ? 'Yes' : 'No'}
                                                            </Text></View>
                                                            <View
                                                                style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>Skip
                                                                Scan:</Text> {selectedReportData.skipScan ? 'Yes' : 'No'}
                                                            </Text></View>
                                                            <View
                                                                style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>Shift
                                                                Started:</Text> {Services.returnHMformatFromTimeStamp(selectedReportData.shiftStartedTime)}
                                                            </Text></View>
                                                            <View
                                                                style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>Shift
                                                                Ended:</Text> {Services.returnHMformatFromTimeStamp(selectedReportData.shiftEndedTime)}
                                                            </Text></View>
                                                            <View
                                                                style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>Trip
                                                                Number:</Text> {selectedReportData.tripNumber || '--'}
                                                            </Text></View>
                                                            <View
                                                                style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>Trip
                                                                Distance:</Text> {selectedReportData.tripDistance || '--'}
                                                            </Text></View>
                                                            <View
                                                                style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>VehicleNo:</Text> {selectedReportData.attrs.vehicleRegNo || '--'}
                                                            </Text></View>
                                                            <View
                                                                style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>Vehicle
                                                                Type:</Text> {selectedReportData.vehicleType || '--'} Wheeler
                                                            </Text></View>
                                                            <View
                                                                style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>Vehicle
                                                                Model:</Text> {selectedReportData.attrs.vehicleModal || '--'}
                                                            </Text></View>
                                                            <View
                                                                style={[Styles.p5, {width: Dimensions.get('window').width / 2.2}]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>Vehicle
                                                                Variant:</Text> {selectedReportData.attrs.variant || '--'}
                                                            </Text></View>
                                                            <View style={[Styles.p5]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>Client Emp
                                                                ID:</Text> {selectedReportData.attrs.clientEmployeeId || '--'}
                                                            </Text></View>

                                                            <View style={[Styles.p5,]}><Text
                                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                                style={[Styles.ffMbold, Styles.colorBlue]}>Shift Ended
                                                                by Supervisor:</Text>
                                                                {selectedReportData.shiftEndedBy ? selectedReportData.shiftEndedBy + ' ( ' + selectedReportData.reasonToEndShift + ' )' : '--'}
                                                            </Text></View>
                                                        </View>
                                                        :
                                                        null
                                                }
                                                <TouchableOpacity activeOpacity={0.6}
                                                                  onPress={() => {
                                                                      this.setState({showShiftData: !this.state.showShiftData})
                                                                  }}
                                                                  style={[Styles.m5, Styles.bgLYellow, Styles.p2, Styles.br10,]}>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.colorBlue]}>{this.state.showShiftData ? ' Show less ' : ' Show more ..'} </Text>
                                                </TouchableOpacity>

                                            </View>
                                            :
                                            null
                                    }
{/*APPROVAL BUTTON VIEW*/}
                                    <View style={[Styles.mBtm10, Styles.row, Styles.jSpaceBet, Styles.marH15]}>
                                        {/*<Text style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.padV10, Styles.colorBlue]}>{selectedReportData.attrs ? selectedReportData.attrs.userName :'--' || '--'}{' ('+Services.getUserRolesShortName(selectedReportData.role)+')'}</Text>*/}
                                        {
                                            // selectedReportData.verified && this.state.userRole < 30    //less than 30 no access
                                            //     ?
                                            //     null
                                            //     :
                                                accessToEditData
                                                    ?
                                                    <TouchableOpacity
                                                        onPress={() => this.setState({accessToEditData: !this.state.accessToEditData}, () => {
                                                            this.useSelectedDataReport(selectedReportData)
                                                        })}
                                                        style={[Styles.br5, Styles.aslCenter, Styles.bgRed, Styles.OrdersScreenCardshadow]}>
                                                        <Text
                                                            style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMbold, Styles.cWhite]}>CANCEL
                                                            EDIT</Text>
                                                    </TouchableOpacity>
                                                    :
                                                    <TouchableOpacity
                                                        onPress={() => this.setState({accessToEditData: !this.state.accessToEditData})}
                                                        style={[Styles.br5, Styles.aslCenter, Styles.bgGrn, Styles.OrdersScreenCardshadow]}>
                                                        <Text
                                                            style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMbold, Styles.cWhite]}>EDIT
                                                            DETAILS</Text>
                                                    </TouchableOpacity>
                                        }

                                        {
                                            selectedReportData.verified
                                                ?
                                                // <Text  style={[Styles.ffMbold, Styles.colorGreen, Styles.f16, Styles.alignCenter]}>Verified</Text>
                                                <TouchableOpacity
                                                   disabled={true}
                                                    style={[Styles.br5, Styles.aslCenter, Styles.bgGrn, Styles.OrdersScreenCardshadow]}>
                                                    <Text style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMbold, Styles.cWhite]}>Verified</Text>
                                                </TouchableOpacity>
                                                :
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.validateTripDetails(selectedReportData,'VERIFY')
                                                    }}
                                                    style={[Styles.br5, Styles.aslCenter, Styles.bgOrangeYellow, Styles.OrdersScreenCardshadow]}>
                                                    <Text
                                                        style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMbold, Styles.cWhite]}>VERIFY</Text>
                                                </TouchableOpacity>
                                        }
                                    </View>

                                    <ScrollView persistentScrollbar={true}
                                                style={[Styles.flex1]}>
                                        <KeyboardAvoidingView
                                            behavior=  "padding"
                                            keyboardVerticalOffset={60}
                                            style={[Styles.flex1]}>

                                            {/*TRIP TYPE DROPDOWN*/}
                                            <View style={[Styles.marH10, Styles.flex1, Styles.m10]}>
                                                <Text
                                                    style={[Styles.colorBlue, Styles.f16, Styles.ffMbold, Styles.marV10, Styles.marH5]}>Trip
                                                    Type</Text>
                                                <TouchableOpacity
                                                    // disabled={  !(this.state.selectedTripValue === 'NOLOAD' || this.state.selectedTripValue === 'Absent') && !accessToEditData  }
                                                    disabled={!accessToEditData}
                                                    activeOpacity={0.7} onPress={() => {
                                                    this.setState({tripTypeSelectionModal: true})
                                                }}>
                                                    <Card style={[Styles.OrdersScreenCardshadow]}>
                                                        <Card.Title
                                                            style={[Styles.p5]}
                                                            titleStyle={[Styles.f16, Styles.ffMbold, accessToEditData ? Styles.cBlk : Styles.cDisabled]}
                                                            title={this.state.selectedTripType === '' ? 'SELECT TRIP TYPE' : _.startCase(_.toLower(this.state.selectedTripType))}
                                                            // left={() => <MaterialIcons name="merge-type" size={45}
                                                            //                            color="#000"/>}
                                                            right={() => <Ionicons
                                                                style={[Styles.marH5, {paddingRight: 10}]}
                                                                name="ios-arrow-forward" size={35}
                                                                color={accessToEditData ? "#000" : "#cccccc"}/>}
                                                        />
                                                    </Card>
                                                </TouchableOpacity>
                                            </View>

                                            {/*REMARKS */}
                                            <View style={[Styles.m10, Styles.OrdersScreenCardshadow]}>
                                                <Input label='Remarks*'
                                                       mode='outlined'
                                                       placeholder={'Enter Remarks'}
                                                       theme={theme}
                                                       disabled={!accessToEditData}
                                                       autoCompleteType='off'
                                                       placeholderTextColor='#233167'
                                                       autoCapitalize="none"
                                                       blurOnSubmit={false}
                                                       returnKeyType="done"
                                                       value={this.state.remarks}
                                                       onSubmitEditing={() => {
                                                           Keyboard.dismiss();
                                                       }}
                                                       onChangeText={(remarks) => this.setState({remarks})}/>
                                            </View>

                                            {
                                                this.state.selectedTripValue === 'NOLOAD' || this.state.selectedTripValue === 'Absent' ||this.state.selectedTripValue === "ABSENT" ||
                                                this.state.selectedTripValue === "NO_LOAD" || this.state.selectedTripValue === 'No Load'
                                                    ?
                                                    null
                                                    :
                                                    <View>
                                                        {/*ROUTE */}
                                                        <View style={[Styles.m10, Styles.OrdersScreenCardshadow]}>
                                                            <Input label='Route*'
                                                                   mode='outlined'
                                                                   placeholder={'Enter Route'}
                                                                   theme={theme}
                                                                   disabled={!accessToEditData}
                                                                   autoCompleteType='off'
                                                                   placeholderTextColor='#233167'
                                                                   autoCapitalize="none"
                                                                   blurOnSubmit={false}
                                                                   returnKeyType="done"
                                                                   value={this.state.route}
                                                                   onSubmitEditing={() => {
                                                                       Keyboard.dismiss();
                                                                   }}
                                                                   onChangeText={(route) => this.setState({route})}/>
                                                        </View>

                                                        {/*clientUserId */}
                                                        <View style={[Styles.m10, Styles.OrdersScreenCardshadow]}>
                                                            <Input label='Client UserId*'
                                                                   mode='outlined'
                                                                   placeholder={'Enter client UserId'}
                                                                   theme={theme}
                                                                   disabled={!accessToEditData}
                                                                   autoCompleteType='off'
                                                                   placeholderTextColor='#233167'
                                                                   autoCapitalize="none"
                                                                   blurOnSubmit={false}
                                                                   returnKeyType="done"
                                                                   value={this.state.clientUserId}
                                                                   onSubmitEditing={() => {
                                                                       Keyboard.dismiss();
                                                                   }}
                                                                   onChangeText={(clientUserId) => this.setState({clientUserId})}/>
                                                        </View>



                                                        {/*TripSheetID */}
                                                        <View style={[Styles.m10, Styles.OrdersScreenCardshadow]}>
                                                            <Input label='TripSheet ID*'
                                                                   mode='outlined'
                                                                   placeholder={'Enter TripSheet ID'}
                                                                   theme={theme}
                                                                   disabled={!accessToEditData}
                                                                   autoCompleteType='off'
                                                                   placeholderTextColor='#233167'
                                                                   autoCapitalize="none"
                                                                   blurOnSubmit={false}
                                                                   returnKeyType="done"
                                                                   value={this.state.tripSheetId}
                                                                   onSubmitEditing={() => {
                                                                       Keyboard.dismiss();
                                                                   }}
                                                                   onChangeText={(tripSheetId) => this.setState({tripSheetId})}/>
                                                        </View>

                                                        {
                                                            selectedReportData.role === 5 || selectedReportData.role === 10
                                                                ?
                                                                <View>
                                                                    {/*START KM READING*/}
                                                                    <Card style={[Styles.OrdersScreenCardshadow, Styles.m10]}>
                                                                        <Card.Title
                                                                            style={[Styles.p5]}
                                                                            subtitleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                                                            titleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                                                            title='Start KM reading'
                                                                            right={() =>
                                                                                <View
                                                                                    style={[Styles.row, Styles.aslCenter, {paddingRight: 10}]}>
                                                                                    <TouchableOpacity
                                                                                        style={[Styles.aslCenter]}
                                                                                        disabled={this.state.startingKM === '0' || !accessToEditData}
                                                                                        onPress={() => this.OdometerReadingValidate(this.state.startingKM, 'Decrement', 'startingKM')}
                                                                                    >
                                                                                        <Text
                                                                                            style={[Styles.IncrementButton, {
                                                                                                borderColor: this.state.startingKM === '0' || !accessToEditData ? '#f5f5f5' : '#000',
                                                                                                color: this.state.startingKM === '0' || !accessToEditData ? '#f5f5f5' : '#000'
                                                                                            }]}>-</Text></TouchableOpacity>
                                                                                    <TextInput
                                                                                        style={[Styles.txtAlignCen, {
                                                                                            width: 80,
                                                                                            fontWeight: 'bold',
                                                                                            fontSize: 17
                                                                                        }]}
                                                                                        selectionColor={"black"}
                                                                                        editable={accessToEditData}
                                                                                        maxLength={6}
                                                                                        keyboardType='numeric'
                                                                                        onChangeText={(startingKM) => this.OdometerReadingValidate(startingKM, 'onChange', 'startingKM')}
                                                                                        value={this.state.startingKM}
                                                                                    />
                                                                                    <TouchableOpacity
                                                                                        style={[Styles.aslCenter]}
                                                                                        disabled={this.state.startingKM === '999998' || !accessToEditData}
                                                                                        onPress={() => this.OdometerReadingValidate(this.state.startingKM, 'Increment', 'startingKM')}
                                                                                    >
                                                                                        <Text
                                                                                            style={[Styles.IncrementButton, {
                                                                                                borderColor: this.state.startingKM === '999998' || !accessToEditData ? '#f5f5f5' : '#000',
                                                                                                color: this.state.startingKM === '999998' || !accessToEditData ? '#f5f5f5' : '#000'
                                                                                            }]}>+</Text></TouchableOpacity>
                                                                                </View>
                                                                            }
                                                                        />
                                                                    </Card>

                                                                    {/*END KM READING*/}
                                                                    <Card style={[Styles.OrdersScreenCardshadow, Styles.m10]}>
                                                                        <Card.Title
                                                                            style={[Styles.p5]}
                                                                            subtitleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                                                            titleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                                                            title='End KM reading'
                                                                            right={() =>
                                                                                <View
                                                                                    style={[Styles.row, Styles.aslCenter, {paddingRight: 10}]}>
                                                                                    <TouchableOpacity
                                                                                        style={[Styles.aslCenter]}
                                                                                        disabled={this.state.endingKm === '0' || !accessToEditData}
                                                                                        onPress={() => this.OdometerReadingValidate(this.state.endingKm, 'Decrement', 'endingKm')}
                                                                                    >
                                                                                        <Text
                                                                                            style={[Styles.IncrementButton, {
                                                                                                borderColor: this.state.endingKm === '0' || !accessToEditData ? '#f5f5f5' : '#000',
                                                                                                color: this.state.endingKm === '0' || !accessToEditData ? '#f5f5f5' : '#000'
                                                                                            }]}>-</Text></TouchableOpacity>
                                                                                    <TextInput
                                                                                        style={[Styles.txtAlignCen, {
                                                                                            width: 80,
                                                                                            fontWeight: 'bold',
                                                                                            fontSize: 17
                                                                                        }]}
                                                                                        selectionColor={"black"}
                                                                                        editable={accessToEditData}
                                                                                        maxLength={6}
                                                                                        keyboardType='numeric'
                                                                                        onChangeText={(endingKm) => this.OdometerReadingValidate(endingKm, 'onChange', 'endingKm')}
                                                                                        value={this.state.endingKm}
                                                                                    />
                                                                                    <TouchableOpacity
                                                                                        style={[Styles.aslCenter]}
                                                                                        disabled={this.state.endingKm === '999998' || !accessToEditData}
                                                                                        onPress={() => this.OdometerReadingValidate(this.state.endingKm, 'Increment', 'endingKm')}
                                                                                    >
                                                                                        <Text
                                                                                            style={[Styles.IncrementButton, {
                                                                                                borderColor: this.state.endingKm === '999998' || !accessToEditData ? '#f5f5f5' : '#000',
                                                                                                color: this.state.endingKm === '999998' || !accessToEditData ? '#f5f5f5' : '#000'
                                                                                            }]}>+</Text></TouchableOpacity>
                                                                                </View>
                                                                            }
                                                                        />
                                                                    </Card>
                                                                </View>
                                                                :
                                                                null
                                                        }

                                                        {
                                                            selectedReportData.role === 1 || selectedReportData.role === 10
                                                                ?
                                                                <View>
                                                                        {/*PACKAGES LIST DROPDOWN*/}
                                                                        <View style={[Styles.marH10, Styles.flex1, Styles.m10]}>
                                                                            <Card style={[Styles.OrdersScreenCardshadow]}
                                                                                  onPress={() => {
                                                                                      this.setState({packageSelectionModal: true})
                                                                                  }}>
                                                                                <Card.Title
                                                                                    style={[Styles.p5]}
                                                                                    titleStyle={[Styles.f16, Styles.ffMbold,accessToEditData?Styles.cBlk: Styles.cDisabled]}
                                                                                    title={'PACKAGES ' + '( ' + this.state.totalDeliveredCount + '/' + this.state.pickupPackages + ')'}
                                                                                    left={() => <MaterialIcons name="merge-type" size={45}
                                                                                                               color="#000"/>}
                                                                                    right={() => <Ionicons
                                                                                        style={[Styles.marH5, {paddingRight: 10}]}
                                                                                        name="ios-arrow-forward" size={35}
                                                                                        color={"#000"}/>}
                                                                                />
                                                                            </Card>
                                                                        </View>
                                                                    </View>
                                                                :
                                                                null
                                                        }

                                                        {
                                                            selectedReportData
                                                                ?
                                                                // ODOMETER IMAGES
                                                                <View>
                                                                    {/*START ODOMETER READINGS PIC*/}
                                                                    {
                                                                        selectedReportData.startOdometerReadingUploadUrl
                                                                            ?
                                                                            <View>
                                                                                <View style={[Styles.row, Styles.aitCenter, Styles.mTop5,]}>
                                                                                    <View
                                                                                        style={[Styles.row, Styles.bgLYellow, Styles.br5, Styles.aslCenter, Styles.p5,]}>
                                                                                        {LoadSVG.cameraPic}
                                                                                        <Text
                                                                                            style={[Styles.f16,Styles.colorBlue, Styles.ffLBold, Styles.pRight15]}>Start Odometer Pic{Services.returnRedStart()}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                {
                                                                                    selectedReportData.startOdometerReadingUploadUrl
                                                                                        ?
                                                                                        <View
                                                                                            style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 30,}]}>
                                                                                            <TouchableOpacity
                                                                                                style={[Styles.row, Styles.aslCenter]}
                                                                                                onPress={() => {
                                                                                                    this.setState({
                                                                                                        imagePreview: true,
                                                                                                        imagePreviewURL: selectedReportData.startOdometerReadingUploadUrl
                                                                                                    })
                                                                                                }}>
                                                                                                <Image
                                                                                                    onLoadStart={() => this.setState({imageLoading: true})}
                                                                                                    onLoadEnd={() => this.setState({imageLoading: false})}
                                                                                                    style={[{
                                                                                                        width: Dimensions.get('window').width / 2,
                                                                                                        height: 120
                                                                                                    }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                                    source={selectedReportData.startOdometerReadingUploadUrl ? {uri: selectedReportData.startOdometerReadingUploadUrl} : null}
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

                                                                    {/*END ODOMETER READINGS PIC*/}
                                                                    {
                                                                        selectedReportData.endOdometerReadingUploadUrl
                                                                            ?
                                                                            <View>
                                                                                <View style={[Styles.row, Styles.aitCenter, Styles.mTop5,]}>
                                                                                    <View
                                                                                        style={[Styles.row, Styles.bgLYellow, Styles.br5, Styles.aslCenter, Styles.p5,]}>
                                                                                        {LoadSVG.cameraPic}
                                                                                        <Text
                                                                                            style={[Styles.f16,Styles.colorBlue, Styles.ffLBold, Styles.pRight15]}>End Odometer Pic{Services.returnRedStart()}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                {
                                                                                    selectedReportData.endOdometerReadingUploadUrl
                                                                                        ?
                                                                                        <View
                                                                                            style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 30,}]}>
                                                                                            <TouchableOpacity
                                                                                                style={[Styles.row, Styles.aslCenter]}
                                                                                                onPress={() => {
                                                                                                    this.setState({
                                                                                                        imagePreview: true,
                                                                                                        imagePreviewURL: selectedReportData.endOdometerReadingUploadUrl
                                                                                                    })
                                                                                                }}>
                                                                                                <Image
                                                                                                    onLoadStart={() => this.setState({imageLoading: true})}
                                                                                                    onLoadEnd={() => this.setState({imageLoading: false})}
                                                                                                    style={[{
                                                                                                        width: Dimensions.get('window').width / 2,
                                                                                                        height: 120
                                                                                                    }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                                    source={selectedReportData.endOdometerReadingUploadUrl ? {uri: selectedReportData.endOdometerReadingUploadUrl} : null}
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
                                                                </View>
                                                                :
                                                                null
                                                        }
                                                    </View>
                                            }

                                    </KeyboardAvoidingView>
                                    </ScrollView>

                                    {
                                        accessToEditData
                                            ?
                                            <View style={[Styles.row, Styles.jSpaceArd, Styles.marV5, Styles.pTop10]}>
                                                <TouchableOpacity
                                                    onPress={() => this.setState({accessToEditData: !this.state.accessToEditData}, () => {
                                                        this.useSelectedDataReport(selectedReportData)
                                                    })}
                                                    style={[Styles.br5, Styles.aslCenter, Styles.bgBlk, Styles.OrdersScreenCardshadow]}>
                                                    <Text
                                                        style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMbold, Styles.cWhite]}>CANCEL</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => {    this.validateTripDetails(selectedReportData,'UPDATE')  }}
                                                    style={[Styles.br5, Styles.aslCenter, Styles.bgGrn, Styles.OrdersScreenCardshadow]}>
                                                    <Text
                                                        style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMbold, Styles.cWhite]}> UPDATE </Text>
                                                </TouchableOpacity>
                                            </View>
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

                {/*TRIP TYPE SELECTION client based*/}
                <Modal transparent={true}
                       visible={this.state.tripTypeSelectionModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           this.setState({tripTypeSelectionModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                width: Dimensions.get('window').width - 80,
                            }]]}>
                            <View style={[Styles.bgWhite, {height: Dimensions.get('window').height / 1.6}]}>
                                <View style={Styles.aslCenter}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.colorBlue, Styles.f20, Styles.m10, Styles.mBtm10]}>Select
                                        Trip Type</Text>
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
                                                        }, () => {
                                                            this.noLoadSelectedValidation(selectedReportData, item.key)
                                                        })
                                                        }
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
                                                                paddingVertical: 10,
                                                                // backgroundColor: '#fff',
                                                                // color:  '#233167',
                                                                // borderWidth:  1,
                                                                // backgroundColor: this.state.selectedTripValue === role.key ? '#C91A1F' : '#fff',
                                                                // color: this.state.selectedTripValue === role.key ? '#fff' : '#233167',
                                                                // borderWidth: this.state.selectedTripValue === role.key ? 0 : 1,
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

                {/*packages calculations modal,pickup,delivered*/}
                <Modal transparent={true}
                       visible={this.state.packageSelectionModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           // this.setState({packageSelectionModal: false,tempDeliveredPackages:selectedReportData.deliveredPackages})
                           this.revertValues()
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                width: Dimensions.get('window').width - 30,
                            }]]}>
                            <View style={[Styles.bgWhite, {height: Dimensions.get('window').height / 1.3}]}>
                                <View>
                                    <Text
                                        style={[Styles.ffMbold, Styles.aslCenter, Styles.colorBlue, Styles.f20, Styles.m10, Styles.mBtm10]}>Packages
                                        count: {this.state.totalDeliveredCount}/{this.state.pickupPackages}</Text>

                                    {
                                        this.state.totalDeliveredCount !== this.state.pickupPackages
                                            ?
                                            <Text
                                                style={[Styles.ffMregular, Styles.aslCenter, Styles.cRed, Styles.f14]}>Total
                                                Pickup and Delivered count must be equal</Text>
                                            :
                                            null
                                    }


                                    {/*PICKUP PACKAGES*/}
                                    <Card style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.bgLGreen]}>
                                        <Card.Title
                                            style={[Styles.p5]}
                                            subtitleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                            titleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                            title='Pickup Packages'
                                            right={() =>
                                                <View style={[Styles.row, Styles.aslCenter, {paddingRight: 20}]}>
                                                    <Text
                                                        style={[Styles.ffMbold, Styles.aslCenter, Styles.colorBlue, Styles.f20]}>{this.state.pickupPackages}</Text>

                                                </View>
                                            }
                                        />
                                    </Card>

                                    <ScrollView
                                        persistentScrollbar={true}
                                        style={[{height: Dimensions.get('window').height / 2}]}>
                                        <FlatList
                                            data={tempDeliveredPackages}
                                            renderItem={({  item,  index  }) =>
                                                <Card style={[Styles.OrdersScreenCardshadow, Styles.m10]}>
                                                    <Card.Title
                                                        style={[Styles.p5]}
                                                        subtitleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                                        titleStyle={[Styles.f16, Styles.cBlk, Styles.ffMbold]}
                                                        title={item.name}
                                                        right={() =>
                                                            <View
                                                                style={[Styles.row, Styles.aslCenter, {paddingRight: 10}]}>
                                                                <TouchableOpacity
                                                                    style={[Styles.aslCenter]}
                                                                    disabled={item.count === 0 || !accessToEditData}
                                                                    onPress={() => this.deliveredPackageValidation(tempDeliveredPackages[index].count, 'Decrement', 'deliveredPackages',index)}
                                                                >
                                                                    <Text
                                                                        style={[Styles.IncrementButton, {
                                                                            borderColor: item.count === 0 || !accessToEditData ? '#f5f5f5' : '#000',
                                                                            color: item.count === 0 || !accessToEditData ? '#f5f5f5' : '#000'
                                                                        }]}>-</Text></TouchableOpacity>
                                                                <TextInput
                                                                    style={[Styles.txtAlignCen, {
                                                                        width: 80,
                                                                        fontWeight: 'bold',
                                                                        fontSize: 17
                                                                    }]}
                                                                    selectionColor={"black"}
                                                                    editable={accessToEditData}
                                                                    maxLength={6}
                                                                    keyboardType='numeric'
                                                                    onChangeText={(value) => this.deliveredPackageValidation(value, 'onChange', 'deliveredPackages',index)}
                                                                    // value={tempDeliveredPackages[index].value}
                                                                    value={item.count === '' ? item.count : JSON.stringify(item.count)}
                                                                />
                                                                <TouchableOpacity
                                                                    style={[Styles.aslCenter]}
                                                                    disabled={item.count === 999998 || !accessToEditData}
                                                                    onPress={() => this.deliveredPackageValidation(item.count, 'Increment', 'deliveredPackages',index)}
                                                                >
                                                                    <Text
                                                                        style={[Styles.IncrementButton, {
                                                                            borderColor: item.count === 999998 || !accessToEditData ? '#f5f5f5' : '#000',
                                                                            color: item.count === 999998 || !accessToEditData ? '#f5f5f5' : '#000'
                                                                        }]}>+</Text></TouchableOpacity>
                                                            </View>
                                                        }
                                                    />
                                                </Card>

                                            }
                                            keyExtractor={(index, item) => JSON.stringify(item) + index}
                                            extraData={this.state}/>
                                    </ScrollView>


                                </View>
                                {
                                    accessToEditData
                                        ?
                                        <Card.Actions
                                            style={[Styles.row, Styles.jSpaceArd, Styles.pTop10, Styles.pBtm5]}>
                                            <Button title=' CANCEL ' color={'#000'} compact={true}
                                                    onPress={() => this.revertValues()}/>
                                            <Button title=' SAVE '
                                                    disabled={this.state.totalDeliveredCount !== this.state.pickupPackages}
                                                    color={'#000'}
                                                    compact={true}
                                                    onPress={() => {
                                                        // let sample = this.state.selectedReportData
                                                        // sample.deliveredPackages = this.state.tempDeliveredPackages;
                                                        // console.log('saved sample',sample)
                                                        this.setState({
                                                            packageSelectionModal: false,
                                                            // selectedReportData:sample
                                                        });
                                                    }
                                                    }>></Button>
                                        </Card.Actions>
                                        :
                                        null
                                }
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => {
                            // this.setState({packageSelectionModal: false,tempDeliveredPackages:selectedReportData.deliveredPackages})
                            this.revertValues()
                        }} style={{marginTop: 20}}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/*filters*/}
                <Modal transparent={true}
                       visible={this.state.filtersModal}
                       animated={true}
                       animationType='fade'
                       onRequestClose={() => {
                           this.setState({filtersModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[[ Styles.bgWhite,Styles.flex1, {
                                width: Dimensions.get('window').width ,
                                height: Dimensions.get('window').height,
                            }]]}>
                            <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                                <Appbar.Content
                                    title={'Select Filters'}
                                    titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() => this.setState({
                                                            filtersModal: false,
                                                            accessToEditData: false
                                                        })}/>
                            </Appbar.Header>
                                <ScrollView persistentScrollbar={true}>
                                    {/*FROM DATE*/}
                                    <Card style={[Styles.OrdersScreenCardshadow, Styles.m10]}
                                          onPress={() => {
                                              this.datePicker('filterFromDate')
                                          }}>
                                        <Card.Title
                                            style={[Styles.bgWhite]}
                                            // title={new Date().toDateString()}
                                            title={Services.returnCalendarFormat(this.state.filterFromDate)}
                                            titleStyle={[Styles.f18, Styles.ffMbold]}
                                            subtitle={'From Date'}
                                            rightStyle={[Styles.marH10]}
                                            right={() => <FontAwesome name="calendar" size={30} color="#000"
                                            />}
                                        />
                                    </Card>

                                    {/*TO DATE*/}
                                    <Card style={[Styles.OrdersScreenCardshadow, Styles.m10]}
                                          onPress={() => {
                                              this.datePicker('filterToDate')
                                          }}>
                                        <Card.Title
                                            style={[Styles.bgWhite]}
                                            // title={new Date().toDateString()}
                                            title={Services.returnCalendarFormat(this.state.filterToDate)}
                                            titleStyle={[Styles.f18, Styles.ffMbold]}
                                            subtitle={'To Date'}
                                            rightStyle={[Styles.marH10]}
                                            right={() => <FontAwesome name="calendar" size={30} color="#000"
                                            />}
                                        />
                                    </Card>

                                    {/*VEHICLE TYPE*/}
                                    <Text
                                        style={[Styles.ffMregular, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.mTop10, Styles.marH10]}>Select
                                        Vehicle Type</Text>
                                    <Card style={[Styles.OrdersScreenCardshadow, Styles.marH10, Styles.mBtm10]}>
                                        <Picker
                                            itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                            selectedValue={this.state.filterVehilceType}
                                            mode='dropdown'
                                            onValueChange={(itemValue, itemIndex) => this.setState({filterVehilceType: itemValue})}
                                        >
                                            {this.state.vehicleTypeList.map((item, index) => {
                                                return (< Picker.Item
                                                    label={item.label}
                                                    value={item.value}
                                                    key={index}/>);
                                            })}
                                        </Picker>
                                    </Card>

                                    {/*SITES DROPDOWN*/}
                                    <Text
                                        style={[Styles.ffMregular, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.mTop10, Styles.marH10]}>Select
                                        Site</Text>
                                    <Card style={[Styles.OrdersScreenCardshadow, Styles.marH10, Styles.mBtm10]}>
                                        <Picker
                                            itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                            selectedValue={this.state.filterSiteId}
                                            mode='dropdown'
                                            onValueChange={(itemValue, itemIndex) => this.setState({filterSiteId: itemValue})}
                                        >
                                            {this.state.sitesList.map((item, index) => {
                                                return (< Picker.Item
                                                    label={item.id ? item.attrs.siteLable : item.siteLable}
                                                    value={item.id}
                                                    key={index}/>);
                                            })}
                                        </Picker>
                                    </Card>

                                    {/*VERIFIED TYPE*/}
                                    <Text
                                        style={[Styles.ffMregular, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.mTop10, Styles.marH10]}>Select
                                        Verified</Text>
                                    <Card style={[Styles.OrdersScreenCardshadow, Styles.marH10, Styles.mBtm10]}>
                                        <Picker
                                            itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                            selectedValue={this.state.filterVerifiedType}
                                            mode='dropdown'
                                            onValueChange={(itemValue, itemIndex) => this.setState({filterVerifiedType: itemValue})}
                                        >
                                            {this.state.verifiedTypeList.map((item, index) => {
                                                return (< Picker.Item
                                                    label={item.label}
                                                    value={item.value}
                                                    key={index}/>);
                                            })}
                                        </Picker>
                                    </Card>

                                    {/*ROLES LIST*/}
                                    <Text
                                        style={[Styles.ffMregular, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.mTop10, Styles.marH10]}>Select
                                        Role</Text>
                                    <Card style={[Styles.OrdersScreenCardshadow, Styles.marH10, Styles.mBtm10]}>
                                        <Picker
                                            itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                            selectedValue={this.state.filterRole}
                                            mode='dropdown'
                                            onValueChange={(itemValue, itemIndex) => this.setState({filterRole: itemValue})}
                                        >
                                            {this.state.rolesList.map((item, index) => {
                                                return (< Picker.Item
                                                    label={item.label}
                                                    value={item.value}
                                                    key={index}/>);
                                            })}
                                        </Picker>
                                    </Card>

                                    <Card.Actions
                                        style={[Styles.row, Styles.jSpaceArd, Styles.pTop20, Styles.pBtm5]}>
                                        <Button title='Reset Filters ' color={'#1e90ff'} compact={true}
                                                onPress={() => this.setState({
                                                    filterFromDate: Services.returnYesterdayDate(),
                                                    filterToDate: Services.returnYesterdayDate(),
                                                    filterVehilceType: 'All',
                                                    filterVerifiedType: 'All',
                                                    filterRole: 'All',
                                                    filterSiteId: 'All',
                                                    reportsList: [],
                                                    page: 1
                                                }, () => {
                                                    this.getTripSummaryReportList();
                                                })}/>
                                        <Button title=' Search '
                                                color={'#36A84C'}
                                                compact={true}
                                                onPress={() => {
                                                    this.setState({reportsList: [], page: 1}, () => {
                                                        this.getTripSummaryReportList();
                                                    })
                                                }
                                                }>></Button>
                                    </Card.Actions>

                                </ScrollView>

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

                {/*MODALS END*/}

            </View>
        );
    }
};

