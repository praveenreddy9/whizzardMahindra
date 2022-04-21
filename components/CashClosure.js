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
    Picker,
    Alert,
    Image,
    ActivityIndicator, StyleSheet, PermissionsAndroid
} from "react-native";
import {Appbar, Card, DefaultTheme, FAB, List, RadioButton, Searchbar, Title,} from "react-native-paper";
import OneSignal from "react-native-onesignal";
import HomeScreen from './HomeScreen';
import {CSpinner, LoadSVG, Styles, LoadImages} from "./common";
import Utils from './common/Utils';
import OfflineNotice from "./common/OfflineNotice";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import ImageZoom from "react-native-image-pan-zoom";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import Services from "./common/Services";
import _ from "lodash";
import Config from "./common/Config";
import AsyncStorage from "@react-native-community/async-storage";
import Ionicons from "react-native-vector-icons/dist/Ionicons";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import Geolocation from "react-native-geolocation-service";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";


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

const windowWidth = Dimensions.get('window').width;

export default class CashClosure extends React.Component {

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
            imageSelectionModal: false,
            currentLocation: [],
            // latitude: null,
            // longitude: null,
            GPSasked: false,
            swipeActivated: false,
            //latest
            imagePreview: false,
            imagePreviewURL: '',
            imageRotate: '0',

            openingDenominationList: [
                {name: 2000, count: 0, total: 0},
                {name: 500, count: 0, total: 0},
                {name: 200, count: 0, total: 0},
                {name: 100, count: 0, total: 0},
                {name: 50, count: 0, total: 0},
                {name: 20, count: 0, total: 0},
                {name: 10, count: 0, total: 0},
                {name: 5, count: 0, total: 0},
                {name: 2, count: 0, total: 0},
                {name: 1, count: 0, total: 0},
            ],
            depositedDenominationList: [
                {name: 2000, count: 0, total: 0},
                {name: 500, count: 0, total: 0},
                {name: 200, count: 0, total: 0},
                {name: 100, count: 0, total: 0},
                {name: 50, count: 0, total: 0},
                {name: 20, count: 0, total: 0},
                {name: 10, count: 0, total: 0},
                {name: 5, count: 0, total: 0},
                {name: 2, count: 0, total: 0},
                {name: 1, count: 0, total: 0},
                // {name:8999,count:0,total:0},
            ],
            cashCollectedDenominationList: [
                {name: 2000, count: 0, total: 0},
                {name: 500, count: 0, total: 0},
                {name: 200, count: 0, total: 0},
                {name: 100, count: 0, total: 0},
                {name: 50, count: 0, total: 0},
                {name: 20, count: 0, total: 0},
                {name: 10, count: 0, total: 0},
                {name: 5, count: 0, total: 0},
                {name: 2, count: 0, total: 0},
                {name: 1, count: 0, total: 0},
                // {name:8999,count:0,total:0},
            ],
            closingDenominationList: [
                {name: 2000, count: 0, total: 0},
                {name: 500, count: 0, total: 0},
                {name: 200, count: 0, total: 0},
                {name: 100, count: 0, total: 0},
                {name: 50, count: 0, total: 0},
                {name: 20, count: 0, total: 0},
                {name: 10, count: 0, total: 0},
                {name: 5, count: 0, total: 0},
                {name: 2, count: 0, total: 0},
                {name: 1, count: 0, total: 0},
                // {name:8999,count:0,total:0},
            ],
            noteDenominationList: [
                {name: 2000, count: 0, total: 0},
                {name: 500, count: 0, total: 0},
                {name: 200, count: 0, total: 0},
                {name: 100, count: 0, total: 0},
                {name: 50, count: 0, total: 0},
                {name: 20, count: 0, total: 0},
                {name: 10, count: 0, total: 0},
                {name: 5, count: 0, total: 0},
                {name: 2, count: 0, total: 0},
                {name: 1, count: 0, total: 0},
                // {name:8999,count:0,total:0},
            ],
            showDenominationModal: false,
            amountDepositAtBank: '',
            openingAmount: '',
            CODAmountCollected: '',
            depositedAmount: '',
            closingAmount: '',
            CODSystemAmount: '',
            shortCashAmount: '',
            createCashClosureModal: false,
            viewCashClosureModal: false,
            updateCashClosureModal: false,
            siteSelectionModal: false,
            searchedSiteList: [],
            searchString: '',
            sitesList: [],
            siteValue: '',
            amountNotDepositedReason: '',
            siteName: '',
            createdList: [],
            showTimepicker: false,
            warningModal: false,
            showHistoryModal: false, cashClosureDate: new Date(),submitPressed:false,saveButtonPressed:false,
            // StartTime: Services.returnCalculatedHours(new Date()),
            // StartTimeMin: Services.returnCalculatedMinutes(new Date()),
            page: 1,
            size: 10,
            isLoading: false,
            isRefreshing: false,
            refreshing: false,
        }
    }

    // openingDenominationList
    // depositedDenominationList
    // cashCollectedDenominationList
    // closingDenominationList

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        })
        // this._subscribe = this.props.navigation.addListener('didFocus', () => {
        AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
            this.requestLocationPermission()
            let tempRole = JSON.parse(userRole);
            self.setState({userRole: tempRole}, () => {
                self.getAllCreatedList('',1);
                // self.getFilterSites()
                // self.getSitesList()
            })
        })
        // });
    }

    getFilterSites() {
        const self = this;
        // const apiUrl = Config.routes.BASE_URL + Config.routes.GET_SITES_DROPDOWN;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_SITES_LIST;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    let list = response.data
                    self.setState({sitesList: list, searchedSiteList: list, spinnerBool: false,}, () => {
                        if (list.length === 1) {
                            self.setState({
                                siteValue: list[0].id,
                                siteName: list[0].attrs.siteLable
                            })
                        }
                    })
                }
            }, function (error) {
                self.errorHandling(error)
            })
        })
    };

    //get logged user sites
    getSitesList() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_CASH_CLOSURE_SITES_LIST;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    let list = response.data
                    self.setState({sitesList: list, searchedSiteList: list, spinnerBool: false,}, () => {
                        if (list.length === 1) {
                            self.setState({
                                siteValue: list[0].id,
                                siteName: list[0].attrs.siteLable
                            })
                            self.checkPreviousCashDetails(list[0].id)
                        }
                    })
                }
            }, function (error) {
                self.errorHandling(error)
            })
        })
    };

    //API CALL to get all created list
    getAllCreatedList(searchData,pageNo) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_ALL_CREATED_CASH_CLOSURES_MOBILE;
        const body = {
            // siteIds: [],
            // byUserNameAndRole: name,
            // page: self.state.page,
            siteName: searchData,
            page: pageNo,
            size: 20
        };
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    let data = response.data;
                    // console.log('all created list resp200',data);
                    self.setState({
                        createdList: pageNo === 1 ? data.content : [...self.state.createdList, ...data.content],
                        totalPages: data.totalPages,
                        isRefreshing: false,
                        submitPressed:false,saveButtonPressed:false,
                        spinnerBool: false,
                        page:pageNo,searchData:searchData})
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    };

    handleLoadMore = () => {
        this.state.page < this.state.totalPages ?
            this.setState({
                page: this.state.page + 1
            }, () => {
                this.getAllCreatedList(this.state.searchData,this.state.page);
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
    handleRefresh = () => {
        this.setState({
            isRefreshing: true,
        }, () => {
            this.getAllCreatedList(this.state.searchData,1);
        });
    };

    //API CALL to get previous day cash and today status
    checkPreviousCashDetails(siteId) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_PREVIOUS_CASH_DETAILS + siteId;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let data = response.data;
                    if (data.isCashClosureCreatedToDay) {
                        self.setState({spinnerBool: false, allowToCreate: false}, () => {
                            Utils.dialogBox('Already created for today', '')
                        })
                    } else {
                        self.setState({
                            spinnerBool: false,
                            openingDenominationList: data.openingAmountDenomination,
                            openingAmount: data.openingAmount,
                            isCashClosureCreatedToDay: data.isCashClosureCreatedToDay,
                            allowToCreate: true,
                            usingCreatedData: false
                        }, () => {
                            self.assignValues()
                        })
                    }

                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
        // console.log("cash closure error", error, error.response);
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

    counterValidation(count, counter, type, index, renderedDenomination) {
        const {
            selectedCard,
            openingDenominationList, depositedDenominationList, cashCollectedDenominationList, closingDenominationList
        } = this.state;

        let noteDenominationList;
        if (selectedCard === 'OPENING_AMOUNT') {
            noteDenominationList = [...this.state.openingDenominationList]
        } else if (selectedCard === 'DEPOSITED_AMOUNT') {
            noteDenominationList = [...this.state.depositedDenominationList]
        } else if (selectedCard === 'CLOSING_AMOUNT') {
            noteDenominationList = [...this.state.closingDenominationList]
        } else if (selectedCard === 'COD_AMOUNT') {
            noteDenominationList = [...this.state.cashCollectedDenominationList]
        };

        let TargetValue = Math.trunc(parseInt(100000));
        if (counter === 'Decrement') {
            if (count === '') {
                Utils.dialogBox('Please enter a value', '');
            } else {
                let value = Math.trunc(parseInt(count));
                if (value < 1) {
                    Utils.dialogBox('Minimum value is 0', '');
                } else {
                    let tempItem = (Math.trunc(Number(count) - 1));
                    let tempNoteList = renderedDenomination[index]


                    noteDenominationList[index] = {
                        ...noteDenominationList[index],
                        count: tempItem,
                        total: tempItem * tempNoteList.name
                    }
                    this.calculateCollection(noteDenominationList)
                }
            }

        } else if (counter === 'Increment') {
            let value = Math.trunc(parseInt(count));

            let tempItem = (Math.trunc(Number(count) + 1));
            let tempNoteList = renderedDenomination[index]

            noteDenominationList[index] = {
                ...noteDenominationList[index],
                count: tempItem,
                total: tempItem * tempNoteList.name
            }
            this.calculateCollection(noteDenominationList)
        } else {
            let value = count;
            // if (value > TargetValue) {
            //     Utils.dialogBox('Maximum value is ' + TargetValue, '');
            // } else
            // if (value < 0) {
            //     // Utils.dialogBox('Minimum value is ' + tempItem.minimumValue, '');
            // } else
            let tempItem = ''
            if (count === '') {
                // Utils.dialogBox('Please enter a value', '');
                tempItem = 0;
            } else {

                if (isNaN(value)) {
                    tempItem = parseInt(value.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, ''));
                } else {
                    tempItem = value === '' ? '' : parseInt(value.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, ''));
                }
            }
            let tempNoteList = renderedDenomination[index]


            noteDenominationList[index] = {
                ...noteDenominationList[index],
                count: tempItem,
                total: tempItem * tempNoteList.name
            }
            this.calculateCollection(noteDenominationList)
        }
    }

    calculateCollection(tempList) {
        let tempSum = tempList.reduce((n, {total}) => n + total, 0);
        const {
            selectedCard,
            openingDenominationList, depositedDenominationList, cashCollectedDenominationList, closingDenominationList
        } = this.state;

        let noteDenominationList;
        if (selectedCard === 'OPENING_AMOUNT') {
            this.setState({noteTotalCount: JSON.stringify(tempSum), openingDenominationList: tempList})
            // noteDenominationList = [...this.state.openingDenominationList]
        } else if (selectedCard === 'DEPOSITED_AMOUNT') {
            this.setState({noteTotalCount: JSON.stringify(tempSum), depositedDenominationList: tempList})
            // noteDenominationList = [...this.state.depositedDenominationList]
        } else if (selectedCard === 'CLOSING_AMOUNT') {
            this.setState({noteTotalCount: JSON.stringify(tempSum), closingDenominationList: tempList})
            // noteDenominationList = [...this.state.closingDenominationList]
        } else if (selectedCard === 'COD_AMOUNT') {
            this.setState({noteTotalCount: JSON.stringify(tempSum), cashCollectedDenominationList: tempList})
            // noteDenominationList = [...this.state.cashCollectedDenominationList]
        }
        ;
    }

    imageUpload(uploadType) {
        const self = this;
        // Services.checkImageUploadPermissions('LIBRARY',(response)=>{
        Services.checkImageUploadPermissions(uploadType, (response) => {
            let imageData = response.image
            let imageFormData = response.formData

            if (self.state.imageType === 'COD_SYSTEM_IMAGE') {
                self.setState({
                    spinnerBool: false,
                    codSystemImageUrl: imageData.path,
                    codSystemImageFormData: imageFormData
                }, () => {
                    Utils.dialogBox("Image Uploaded", '')
                })
            } else if (self.state.imageType === 'DEPOSITED_AMOUNT_IMAGE') {
                self.setState({
                    spinnerBool: false,
                    depositedAmountImageUrl: imageData.path,
                    depositedAmountImageFormData: imageFormData
                }, () => {
                    Utils.dialogBox("Image Uploaded", '')
                })
            } else if (self.state.imageType === 'DOCUMENT_THREE') {
                self.setState({
                    spinnerBool: false,
                    documentThreeUrl: imageData.path,
                    documentThreeFormData: imageFormData
                }, () => {
                    Utils.dialogBox("Image Uploaded", '')
                })
            } else {
                self.setState({
                    spinnerBool: false,
                    userImageUrl: imageData.path,
                    userImageFormData: imageFormData
                }, () => {
                    Utils.dialogBox("Image Uploaded", '')
                })
            }


        })
    }

    validatingLocation() {
        // console.log('Location validation cash closure', this.state.longitude, this.state.latitude)
        if (this.state.longitude && this.state.latitude) {
            if (this.state.swipeActivated) {
                this.checkUserLocation()
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

    async requestLocationPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                await Geolocation.getCurrentPosition(
                    (position) => {
                        const currentLocation = position.coords;
                        this.setState({
                            currentLocation: currentLocation,
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                        }, function () {
                            // console.log('end shift lat long',currentLocation.latitude,currentLocation.longitude)
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
                        } else {
                            // console.log(error.code, error.message);
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
            console.warn(err);
            Utils.dialogBox(err, '')
        }
    }

    checkGPSpermission() {
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({interval: 10000, fastInterval: 5000})
            .then(data => {
                // console.log('inside GPS check lat long',this.state.longitude,this.state.latitude);
                this.setState({GPSasked: true}, () => {
                    this.requestLocationPermission()
                })
            }).catch(err => {
            // console.log('error code GPS check ',err.code);
            Utils.dialogBox('GPS permissions denied', '');
            this.props.navigation.goBack()
        });
    }

    //API CALL to check user locaiton
    checkUserLocation() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.CHECK_USER_LOCATION + '?latitude=' + self.state.latitude + '&longitude=' + self.state.longitude + '&siteId=' + self.state.siteValue;
        const body = {};
        // console.log('check User Location apiURL', apiURL)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    let tempData = response.data;
                    // console.log(' check User Location resp200', tempData);
                    if (tempData.showWarning) {
                        self.setState({warningModal: true, spinnerBool: false,submitPressed:false,saveButtonPressed:false})
                    } else {
                        self.setState({spinnerBool: false}, () => {
                            self.createTodayCashClosure()
                        })
                    }
                    self.setState({
                        spinnerBool: false
                    })
                }
            }, (error) => {
                // console.log('error in check User Location');
                self.setState({submitPressed:false,saveButtonPressed:false})
                self.errorHandling(error)
            })
        });
    }

    //API CALL to get selected details list
    getSelectedDetails() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_DETAILS_OF_CASH_CLOSURE + self.state.cashClosureId;
        const body = {};
        // console.log('selected details apiURL',apiURL,'body==>',body);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let data = response.data;
                    // console.log('selected details resp200', data);
                    self.setState({spinnerBool: false, selectedCardDetails: data, usingCreatedData: true}, () => {
                        self.assignValues()
                    })
                }
            }, (error) => {
                // console.log('error in selected details');
                self.errorHandling(error)
            })
        });
    }

    formValidations() {
        // console.log('form Validations entered', this.state.partialSaved)
        if (this.state.partialSaved) {
            this.createTodayCashClosure()
        } else {
            // this.validateDetails()
            this.validateSubmitDetails()
        }

    }

    validateSubmitDetails() {
        const self = this;
        let resp;
        resp = Utils.checkIsValueEmpty(this.state.codSystemImageUrl, 'Please Upload COD System Image');
        if (resp.status === true) {
            resp = Utils.checkIsValueEmpty(this.state.amountDepositAtBank, 'Please select Amount Deposited or Not');
            if (resp.status === true) {
                if (this.state.amountDepositAtBank === 'YES') {
                    resp = Utils.checkIsValueEmpty(this.state.depositedAmountImageUrl, 'Please Upload Deposit Slip Image');
                    if (resp.status === true) {
                        this.finalStepValidation()
                    } else {
                        Utils.dialogBox(resp.message, '');
                        this.setState({buttonPressed:false,submitPressed:false,saveButtonPressed:false})
                    }
                } else {
                    this.finalStepValidation()
                }
            } else {
                Utils.dialogBox(resp.message, '');
                this.setState({buttonPressed:false,submitPressed:false,saveButtonPressed:false})
            }
        } else {
            Utils.dialogBox(resp.message, '');
            this.setState({buttonPressed:false,submitPressed:false,saveButtonPressed:false})
        }
    }

    finalStepValidation(){
        const self = this;
        let resp;
        resp = Utils.checkIsValueEmpty(this.state.userImageUrl, 'Please Upload Your Image');
        if (resp.status === true) {
            // this.setState({swipeActivated: true}, () => {
            //     this.validatingLocation()
            //     // this.createTodayCashClosure()
            // })
            Services.returnCurrentPosition((position)=>{
                this.setState({
                    currentLocation: position,
                    latitude: position.latitude,
                    longitude: position.longitude,
                    swipeActivated:true
                },()=>{this.validatingLocation()})
            })
        } else {
            Utils.dialogBox(resp.message, '');
            this.setState({submitPressed:false,saveButtonPressed:false})
        }
    }

    //call to set values
    assignValues() {
        const self = this;
        // console.log('assing usingCreatedData ==>', self.state.usingCreatedData);
        if (self.state.usingCreatedData) {
            let data = self.state.selectedCardDetails;
            let tempSiteName = data.attrs ? data.attrs.siteCode + '('+data.attrs.siteName + ')' :''
            this.setState({
                createdCashClosureDetails: data,
                // updateCashClosureModal: true,
                createCashClosureModal: true,
                allowToCreate: true,
                cashClosureId: data.id,
                cashClosureDate: data.cashClosureDate,
                openingAmount: data.openingAmount,
                openingDenominationList: data.openingAmountDenomination,
                amountDepositAtBank: data.depositedAtBank,
                amountNotDepositedReason: data.reason,
                depositedAmount: data.amountDeposited,
                depositedDenominationList: data.amountDepositedDenomination,
                CODAmountCollected: data.codCollected,
                cashCollectedDenominationList: data.codCollectedDenomination,
                closingAmount: data.closingBalance,
                closingDenominationList: data.closingBalanceDenomination,
                siteValue: data.siteId,
                siteName:tempSiteName,
                CODSystemAmount: JSON.stringify(data.systemCOD),
                shortCashAmount: data.shortCash,
                StartTime: data.depositedTime.hours,
                StartTimeMin: data.depositedTime.minutes,
                partialSaved: data.partialSaved,
                canEditTextInput: data.attrs.canEdit,
                cardStatus: data.attrs.status,
                alreadyCreated: true,
                //images set
                codSystemImageUrl: data.systemCodDocumentDetails ? data.systemCodDocumentDetails.url : '',
                codSystemImageFormData: data.systemCodDocumentDetails,
                depositedAmountImageUrl: data.bankDepositDocumentDetails ? data.bankDepositDocumentDetails.url : '',
                depositedAmountImageFormData: data.bankDepositDocumentDetails,
                documentThreeUrl: data.otherDocumentDetails ? data.otherDocumentDetails.url : '',
                documentThreeFormData: data.otherDocumentDetails,
                userImageUrl: data.userPhotoDetails ? data.userPhotoDetails.url : '',
                userImageFormData: data.userPhotoDetails,
                userPhotoUploded: false, systemCodUploded: false, depositedDocUploded: false, otherDocUploded: false,
                submitPressed:false,saveButtonPressed:false
            })
        } else {
            // createdCashClosureDetails

            let sampleData= [];
            sampleData.systemCodDocumentDetails = null;
            sampleData.bankDepositDocumentDetails = null;
            sampleData.otherDocumentDetails = null;
            sampleData.userPhotoDetails = null;
            this.setState({
                // openingDenominationList
                // depositedDenominationList
                // cashCollectedDenominationList
                // closingDenominationList
                createdCashClosureDetails:sampleData,
                createCashClosureModal: true,
                cashClosureDate: new Date(),
                cashClosureId: '',
                amountDepositAtBank: '',
                amountNotDepositedReason: '',
                depositedAmount: '0',
                depositedDenominationList: self.state.noteDenominationList,
                CODAmountCollected: '0',
                cashCollectedDenominationList: self.state.noteDenominationList,
                closingAmount: '0',
                closingDenominationList: self.state.noteDenominationList,
                CODSystemAmount: '0',
                shortCashAmount: '0',
                StartTime: '',
                StartTimeMin: '',
                partialSaved: true,
                canEditTextInput: true,
                alreadyCreated: false,
                cardStatus:'',
                //images set
                codSystemImageUrl: '',
                codSystemImageFormData: '',
                depositedAmountImageUrl: '',
                depositedAmountImageFormData: '',
                documentThreeUrl: '',
                documentThreeFormData: '',
                userImageUrl: '',
                userImageFormData: '',
                userPhotoUploded: false, systemCodUploded: false, depositedDocUploded: false, otherDocUploded: false,
                submitPressed:false,saveButtonPressed:false
            })
        }
    }

    validateDetails() {
        const self = this;
        let resp;
        resp = Utils.checkIsValueEmpty(this.state.siteValue, 'Select Station Code');
        if (resp.status === true) {
            resp = Utils.checkIsValueEmpty(this.state.amountDepositAtBank, 'Please select Amount Deposited or Not');
            if (resp.status === true) {
                if (this.state.amountDepositAtBank === 'YES') {
                    resp = Utils.isValidNumberEnteredCheckMorethan0(this.state.depositedAmount, 'Amount Deposited')
                    if (resp.status === true) {
                        resp = Utils.CompareTwoValues(this.state.openingAmount, this.state.depositedAmount,'Opening Amount','Deposited Amount', 'Deposited Amount Should be more than Opening')
                        if (resp.status === true) {
                            resp = Utils.checkIsValueEmpty(this.state.StartTime, 'Please select Deposited Time');
                            if (resp.status === true) {
                                resp = Utils.checkIsValueEmpty(this.state.depositedAmountImageUrl, 'Please Upload Deposited Image');
                                if (resp.status === true) {

                                    this.secondStepValidation()

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
                    resp = Utils.isValidReasonCheck(this.state.amountNotDepositedReason)
                    if (resp.status === true) {

                        this.secondStepValidation()

                    } else {
                        Utils.dialogBox(resp.message, '');
                    }
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
        resp = Utils.isValidNumberEnteredCheckMorethan0(this.state.CODSystemAmount, 'System COD Amount')
        if (resp.status === true) {
            resp = Utils.checkIsValueEmpty(this.state.codSystemImageUrl, 'Please Upload System COD Image');
            if (resp.status === true) {
                resp = Utils.isValidNumberEnteredCheckMorethan0(this.state.CODAmountCollected, 'COD Collected')
                if (resp.status === true) {
                    resp = Utils.isValidNumberEntered(this.state.closingAmount,'Closing Balance')
                    if (resp.status === true) {

                        resp = Utils.returnEqualComparedTotal(this.state.closingAmount,this.state.openingAmount,this.state.CODAmountCollected,this.state.amountDepositAtBank === 'YES' ? this.state.depositedAmount : 0)

                        if (resp.status === true) {


                            resp = Utils.checkIsValueEmpty(this.state.userImageUrl, 'Please Upload Your Image');
                            if (resp.status === true) {

                                // this.setState({swipeActivated: true}, () => {
                                //     this.validatingLocation()
                                // })
                                Services.returnCurrentPosition((position)=>{
                                    this.setState({
                                        currentLocation: position,
                                        latitude: position.latitude,
                                        longitude: position.longitude,
                                        swipeActivated:true
                                    },()=>{this.validatingLocation()})
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
    }

    //API call to update Today Cash Closure
    updateTodayCashClosure() {
        const {createdCashClosureDetails} = this.state;
        if (!createdCashClosureDetails.userPhotoDetails && this.state.userImageFormData) {
            this.setState({userPhotoUploded:true})
        }
        if (!createdCashClosureDetails.systemCodDocumentDetails && this.state.codSystemImageFormData) {
            this.setState({systemCodUploded:true})
        }
        if (!createdCashClosureDetails.bankDepositDocumentDetails && this.state.depositedAmountImageFormData) {
            this.setState({depositedDocUploded:true})
        }
        if (!createdCashClosureDetails.otherDocumentDetails && this.state.documentThreeFormData) {
            this.setState({otherDocUploded:true})
        }
        const self = this;

        let apiURL = Config.routes.BASE_URL + Config.routes.POST_DETAILS_OF_CASH_CLOSURE
        const hours = parseInt(self.state.StartTime);
        const minutes = parseInt(self.state.StartTimeMin);
        let tempTime = {hours: hours, minutes: minutes}
        const body = {
            openingAmount: this.state.openingAmount,
            openingAmountDenomination: this.state.openingDenominationList,
            depositedAtBank: this.state.amountDepositAtBank,
            reason: this.state.amountNotDepositedReason,
            amountDeposited: this.state.depositedAmount,
            amountDepositedDenomination: this.state.depositedDenominationList,
            codCollected: this.state.CODAmountCollected,
            codCollectedDenomination: this.state.cashCollectedDenominationList,
            closingBalance: this.state.closingAmount,
            closingBalanceDenomination: this.state.closingDenominationList,
            siteId: this.state.siteValue,
            systemCOD: this.state.CODSystemAmount,
            shortCash: this.state.shortCashAmount,
            depositedTime: tempTime,
            latitude: this.state.latitude,
            longitude: this.state.longitude,
            partialSaved: this.state.partialSaved,
            id:this.state.cashClosureId
        };
        // console.log('update Cash Closure body', body, 'apiURL==>', apiURL, 'body==', body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    self.setState({cashClosureId: response.data.id,createdCashClosureDetails:response.data}, () => {
                        self.checkUploadImages()
                    })
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }

    //API call to Create Today Cash Closure
    createTodayCashClosure() {
        const {createdCashClosureDetails} = this.state;
        if (!createdCashClosureDetails.userPhotoDetails && this.state.userImageFormData) {
            this.setState({userPhotoUploded:true})
        }
        if (!createdCashClosureDetails.systemCodDocumentDetails && this.state.codSystemImageFormData) {
            this.setState({systemCodUploded:true})
        }
        if (!createdCashClosureDetails.bankDepositDocumentDetails && this.state.depositedAmountImageFormData) {
            this.setState({depositedDocUploded:true})
        }
        if (!createdCashClosureDetails.otherDocumentDetails && this.state.documentThreeFormData) {
            this.setState({otherDocUploded:true})
        }

        const self = this;

        let apiURL = Config.routes.BASE_URL + Config.routes.POST_DETAILS_OF_CASH_CLOSURE;
        const hours = parseInt(self.state.StartTime);
        const minutes = parseInt(self.state.StartTimeMin);
        let tempTime = {hours: hours, minutes: minutes}
        const body = {
            openingAmount: this.state.openingAmount,
            openingAmountDenomination: this.state.openingDenominationList,
            depositedAtBank: this.state.amountDepositAtBank,
            reason: this.state.amountNotDepositedReason,
            amountDeposited: this.state.depositedAmount,
            amountDepositedDenomination: this.state.depositedDenominationList,
            codCollected: this.state.CODAmountCollected,
            codCollectedDenomination: this.state.cashCollectedDenominationList,
            closingBalance: this.state.closingAmount,
            closingBalanceDenomination: this.state.closingDenominationList,
            siteId: this.state.siteValue,
            systemCOD: this.state.CODSystemAmount,
            shortCash: this.state.shortCashAmount,
            depositedTime: tempTime,
            latitude: this.state.latitude,
            longitude: this.state.longitude,
            partialSaved: this.state.partialSaved,
            id:this.state.cashClosureId
        };
        // console.log('create Cash Closure body', body, 'apiURL==>', apiURL,'body==',body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    // console.log(' create Cash Closure resp', response.data)
                    self.setState({cashClosureId: response.data.id,submitPressed:false,saveButtonPressed:false}, () => {
                        self.checkUploadImages()
                    })
                }
            }, (error) => {
                // console.log('error in create cash closure');
                self.setState({submitPressed:false,saveButtonPressed:false})
                self.errorHandling(error)
            })
        });
    }

    //calling during update
    checkUploadImages() {
        // console.log('check UpdateImages');
        const {userPhotoUploded,systemCodUploded,depositedDocUploded,otherDocUploded,createdCashClosureDetails} =this.state;
        if(userPhotoUploded){
            this.uploadDocumentsBasedonType(this.state.userImageFormData, 'userPhoto')
        }else if (systemCodUploded){
            this.uploadDocumentsBasedonType(this.state.codSystemImageFormData, 'systemCodDoc')
        }else if (depositedDocUploded){
            this.uploadDocumentsBasedonType(this.state.depositedAmountImageFormData, 'bankDoc')
        }else if (otherDocUploded){
            this.uploadDocumentsBasedonType(this.state.documentThreeFormData, 'otherDoc')
        }else {
            this.finalConfirmation()
        }
    }

    //call for documents upload userPic,SystemCOD,DepositedPic,OtherPic
    uploadDocumentsBasedonType(formData, documentType) {
        const self = this;
        let apiURL = Config.routes.BASE_URL + Config.routes.DOCUMENTS_OF_CASH_CLOSURE + self.state.cashClosureId + '/' + documentType;
        const body = formData;
        // console.log(' document upload url', apiURL, 'body===', body)
        self.setState({spinnerBool: true}, () => {
            Services.AuthProfileHTTPRequest(apiURL, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log('image upload resp200', response,'documentType==>',documentType);

                    if (documentType === 'userPhoto'){
                        self.setState({userPhotoUploded:false},()=>{
                            self.checkUploadImages()
                        })
                    }else if (documentType === 'systemCodDoc'){
                        self.setState({systemCodUploded:false},()=>{
                            self.checkUploadImages()
                        })
                    }else if (documentType === 'bankDoc'){
                        self.setState({depositedDocUploded:false},()=>{
                            self.checkUploadImages()
                        })
                    }else if (documentType === 'otherDoc'){
                        self.setState({otherDocUploded:false},()=>{
                            self.checkUploadImages()
                        })
                    }else {
                        self.setState({spinnerBool:false},()=>{
                            self.checkUploadImages()
                        })
                    }
                }
            }, function (error) {
                self.errorHandling(error)
            });
        });
    }

    finalConfirmation() {
        this.setState({createCashClosureModal: false,updateCashClosureModal:false, spinnerBool: false,submitPressed:false,saveButtonPressed:false}, () => {
            {
                this.state.partialSaved
                    ?
                    Utils.dialogBox('Partially Saved', '')
                    :
                    Utils.dialogBox('Cash Closure Submitted for Today', '')
            }
            this.getAllCreatedList('',1)
        })
    }

    searchSite = (searchData) => {
        if (searchData) {
            let filteredData = this.state.sitesList.filter(function (item) {
                let tempName = item.attrs.siteLable;
                return tempName.toUpperCase().includes(searchData.toUpperCase());
            });
            this.setState({searchedSiteList: filteredData, searchString: searchData});
        } else {
            this.setState({searchedSiteList: this.state.sitesList, searchString: searchData})
        }
    }

    validateSystemCOD(count){
        let value = count;
        let tempItem = '';
        if (value === '') {
            tempItem = 0
        } else {
            if (isNaN(value)) {
                // console.log('into else --if',value)
                tempItem = parseInt(value.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, ''));
            } else {
                // console.log('into else --else',value)
                tempItem = value === '' ? '' : parseInt(value.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, ''));
            }
        }
        this.setState({CODSystemAmount: JSON.stringify(tempItem)})
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

    render() {
        const {
            selectedCard,
            canEditTextInput,
            noteDenominationList,
            openingDenominationList,
            depositedDenominationList,
            cashCollectedDenominationList,
            closingDenominationList,
            createdList,
            selectedCashClosureDetails,
            createdCashClosureDetails,
            editDenomination,
            userRole, usingCreatedData,isRefreshing
        } = this.state;
        if (this.state.refreshing) {
            return (
                <View style={{flex: 1, paddingTop: 20}}>
                    <ActivityIndicator/>
                </View>
            );
        }
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                {this.renderSpinner()}
                <OfflineNotice/>

                <View
                    style={[[Styles.flex1, Styles.bgLBlueWhite]]}>
                    <Appbar.Header style={[Styles.bgDarkRed, Styles.padV5]}>
                        <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                        <Appbar.Content
                            style={[Styles.padV5]}
                            subtitleStyle={[Styles.ffLBlack, Styles.cWhite]}
                            title={'Cash Closure'}
                            titleStyle={[Styles.ffLBlack]}/>
                    </Appbar.Header>
                    <View style={[Styles.flex1]}>


                        <View style={[Styles.mBtm5, Styles.flex1]}>
                            <Searchbar
                                style={{margin: 10}}
                                isFocused="false"
                                placeholder="Search by Site Code or Name"
                                onChangeText={searchData => {
                                    this.setState({searchData},()=>{
                                        this.getAllCreatedList(searchData,1)
                                    })
                                }}
                                onSubmitEditing={()=>{this.getAllCreatedList(this.state.searchData,1)}}
                                value={this.state.searchData}
                            />
                            {
                                createdList.length === 0
                                    ?
                                    <View style={[Styles.alignCenter, Styles.flex1]}>
                                        <Text
                                            style={[Styles.ffLBold, Styles.f18, Styles.colorBlue, Styles.pLeft15]}>No
                                            Cash Closures Created..</Text>
                                    </View>
                                    :
                                    <View style={[Styles.flex1]}>
                                        <Text
                                            style={[Styles.colorBlue, Styles.f18, Styles.ffMbold, Styles.aslStart, Styles.p5]}>Created
                                            List</Text>
                                        <FlatList
                                            data={createdList}
                                            style={[{flex: 1}]}
                                            renderItem={({item, index}) =>
                                                <View key={index}
                                                      style={[Styles.mBtm10, Styles.marH10]}>
                                                    <TouchableOpacity
                                                        activeOpacity={0.9}
                                                        onPress={() => {
                                                            this.setState({cashClosureId: item.id}, () => {
                                                                this.getSelectedDetails()
                                                            })

                                                        }}
                                                        style={[Styles.padH10, Styles.OrdersScreenCardshadow, Styles.bgWhite,
                                                            {
                                                                width: Dimensions.get('window').width - 20
                                                            }]}>
                                                        <View style={[Styles.row, Styles.jSpaceBet,]}>
                                                            <View>
                                                                <View style={[Styles.pTop5,]}>
                                                                    <Text
                                                                        style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.cashClosureDate}</Text>

                                                                    <Text
                                                                        style={[Styles.f16, Styles.pTop5, Styles.ffLBlack, item.attrs.status === "SUBMITTED" ? Styles.colorGreen : Styles.cOrangered]}>{_.startCase(item.attrs.status)}</Text>
                                                                </View>

                                                                <View style={[{paddingVertical: 12}]}/>
                                                            </View>
                                                            <View>
                                                                <View style={[Styles.aslStart]}>

                                                                    <View style={[Styles.row]}>
                                                                        <Text
                                                                            style={[Styles.f36, Styles.colorBlue, Styles.fWbold, Styles.ffLBlack, Styles.aslStart, Styles.pRight3]}>&#x20B9;</Text>
                                                                        <Text
                                                                            style={[Styles.f36, Styles.colorBlue, Styles.fWbold, Styles.ffLBlack, Styles.txtAlignRt,  {width: Dimensions.get('window').width/2.2}]}>{item.closingBalance}</Text>
                                                                    </View>
                                                                    <Text
                                                                        style={[Styles.f14, Styles.colorBlue, Styles.fWbold, Styles.ffLBlack, Styles.aslCenter]}>(Closing
                                                                        Balance)</Text>
                                                                </View>
                                                            </View>
                                                        </View>

                                                        <View>
                                                            <Text
                                                                style={[Styles.f24, Styles.colorBlue, Styles.fWbold, Styles.ffLBlack,]}>{item.attrs.createdBy}</Text>
                                                            <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                <Text
                                                                    style={[Styles.ffLBlack, Styles.f16, Styles.cDCyan]}>{item.attrs.siteCode}</Text>
                                                                {/*<View*/}
                                                                {/*    style={[Styles.row, Styles.alignCenter, {width: Dimensions.get("window").width / 2.4}]}>*/}
                                                                {/*    <Text numberOfLines={1}*/}
                                                                {/*          style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue]}>Deposited*/}
                                                                {/*        - {item.depositedAtBank} {item.depositedAtBank === 'YES' && item.amountDeposited ? '(' + item.amountDeposited + ')' : ''}</Text>*/}
                                                                {/*</View>*/}
                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => this.setState({
                                                                        showHistoryModal: true,
                                                                        // cardHistory: createdCashClosureDetails.history
                                                                        cardHistory: item.auditing
                                                                    })}
                                                                    style={[Styles.aslCenter, Styles.br5, Styles.bgOrangeYellow, Styles.marH2]}>
                                                                    <Text
                                                                        style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.f14,Styles.padH5]}>HISTORY</Text>
                                                                </TouchableOpacity>
                                                                <Text
                                                                    style={[Styles.f16, Styles.cVoiletPinkMix, Styles.ffLBlack,]}>{Services.getUserRoles(item.attrs.createdByUserRole)}</Text>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            }
                                            keyExtractor={(item, index) => index.toString()}
                                            refreshing={isRefreshing}
                                            onRefresh={this.handleRefresh}
                                            onEndReached={this.handleLoadMore}
                                            onEndReachedThreshold={1}
                                            contentContainerStyle={{paddingBottom: 50}}
                                            ListFooterComponent={this.renderFooter}
                                        />
                                    </View>
                            }
                        </View>
                    </View>
                </View>
                {
                    userRole <= '31'
                        ?
                        <View style={[{position: "absolute", bottom: 15, right: 20}]}>
                            <FAB
                                style={[Styles.bgPureRed, Styles.OrdersScreenCardshadow]}
                                icon="add"
                                // label={'ADD'}
                                color={'#fff'}
                                onPress={() => this.setState({
                                    createCashClosureModal: true,
                                    usingCreatedData: false,
                                    allowToCreate:false
                                }, () => {
                                    this.getSitesList()
                                })}
                                // onPress={() => this.checkPreviousCashDetails()}
                            />
                        </View>
                        :
                        null
                }


                {/*MODALS START*/}

                {/*CREATE CASH CLOSURE Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.createCashClosureModal}
                    onRequestClose={() => {
                        this.setState({createCashClosureModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <View
                                style={[[Styles.flex1, Styles.bgWhite]]}>
                                <Appbar.Header style={[Styles.bgDarkRed, Styles.padV5]}>
                                    <Appbar.Content
                                        style={[Styles.padV5]}
                                        subtitleStyle={[Styles.ffLBlack, Styles.cWhite]}
                                        // title={usingCreatedData ? 'Update Cash Closure' : 'Create Cash Closure'}
                                        title={this.state.cardStatus === "PARTIALLY_SAVED" || this.state.cardStatus === "PARTIAL_SAVED" ? 'Update Cash Closure' : this.state.cardStatus === "SUBMITTED" ? 'View Cash Closure' : 'Create Cash Closure'}
                                        titleStyle={[Styles.ffLBlack]}/>
                                    <MaterialCommunityIcons name="window-close" size={28}
                                                            color="#fff" style={{marginRight: 10}}
                                                            onPress={() => this.setState({createCashClosureModal: false})}/>
                                </Appbar.Header>
                                <View style={[Styles.flex1]}>
                                    <ScrollView style={[Styles.flex1]}>
                                        <View style={[Styles.flex1, Styles.padH10, Styles.mBtm15]}>

                                            {
                                                usingCreatedData
                                                    ?
                                                    <View
                                                        style={[Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.padH5]}>
                                                        <Title
                                                            style={[Styles.cBlk, Styles.f16, Styles.ffMbold]}>Site {Services.returnRedStart()}</Title>
                                                        <View>
                                                            <Text
                                                                style={[Styles.cBlk, Styles.f18, Styles.ffMbold]}>{this.state.siteName}</Text>
                                                        </View>
                                                    </View>
                                                    :
                                                    <View
                                                        style={[Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.padH5]}>
                                                        <Title
                                                            style={[Styles.cBlk, Styles.f16, Styles.ffMbold]}>Site {Services.returnRedStart()}</Title>
                                                        <TouchableOpacity
                                                            style={[Styles.mBtm10]}
                                                            onPress={() => {
                                                                this.setState({siteSelectionModal: true})
                                                            }}>
                                                            <View pointerEvents='none'>
                                                                <TextInput
                                                                    placeholder={'Select Station Code'}
                                                                    style={[Styles.cBlk, Styles.f16, Styles.ffMbold, Styles.bw1, Styles.bcGrey]}
                                                                    showSoftInputOnFocus={true}
                                                                    theme={theme}
                                                                    onFocus={() => {
                                                                        Keyboard.dismiss()
                                                                    }}
                                                                    // mode='outlined'
                                                                    placeholderTextColor='#000'
                                                                    blurOnSubmit={false}
                                                                    value={this.state.siteName}
                                                                />
                                                            </View>
                                                            <MaterialIcons name='expand-more' color='#000' size={35}
                                                                           style={{
                                                                               position: 'absolute',
                                                                               right: 15,
                                                                               top: 8
                                                                           }}/>
                                                        </TouchableOpacity>
                                                    </View>
                                            }


                                            {
                                                this.state.allowToCreate && createdCashClosureDetails
                                                    ?
                                                    <View>
                                                        {/*DATE CARD*/}
                                                        <View
                                                            style={[Styles.row, Styles.jSpaceBet, Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.p5]}>
                                                            <View style={[Styles.row, Styles.jSpaceBet, Styles.pBtm3]}>
                                                                <Title
                                                                    style={[Styles.cBlk, Styles.f16, Styles.ffMbold]}>Date {Services.returnRedStart()}</Title>
                                                            </View>
                                                            <TouchableOpacity
                                                                disabled={true}
                                                                activeOpacity={0.7}
                                                                style={[Styles.jSpaceBet, Styles.row]}>
                                                                {/*<Title*/}
                                                                {/*    style={[Styles.cBlk, Styles.f16, Styles.ffLBlack]}>{Services.returnDateMonthYearFormat(new Date())}</Title>*/}
                                                                <Title
                                                                    style={[Styles.cBlk, Styles.f16, Styles.ffLBlack]}>{Services.returnDateMonthYearFormat(this.state.cashClosureDate)}</Title>
                                                            </TouchableOpacity>
                                                        </View>

                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            onPress={() => {
                                                                this.setState({
                                                                    showDenominationModal: true,
                                                                    selectedCard: 'OPENING_AMOUNT',
                                                                    editDenomination: false
                                                                }, () => {
                                                                    this.calculateCollection(openingDenominationList)
                                                                })
                                                            }}
                                                            style={[Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.padH5]}>
                                                            <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                <Title
                                                                    style={[Styles.cBlk, Styles.f16, Styles.ffMbold]}>Opening
                                                                    Balance {Services.returnRedStart()}</Title>
                                                                <Title
                                                                    style={[Styles.cLightGrey, Styles.f16, Styles.ffMbold, Styles.brdrBtm1, {width: 100}]}>&#x20B9;{' '}{this.state.openingAmount}</Title>
                                                            </View>
                                                            <Title
                                                                style={[Styles.colorGreen, Styles.f14, Styles.ffMbold, Styles.aslEnd]}>(Denomination Table)</Title>
                                                        </TouchableOpacity>

                                                        {/*COD SYSTEM VIEW*/}
                                                        <View
                                                            style={[Styles.row, Styles.jSpaceBet, Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.padH5]}>
                                                            <View>
                                                                <Title
                                                                    style={[Styles.cBlk, Styles.f16, Styles.ffMbold]}>COD
                                                                    System{Services.returnRedStart()}</Title>
                                                                <View
                                                                    style={[Styles.row, Styles.brdrBtm1, {width: 100}]}>
                                                                    <Text
                                                                        style={[Styles.cBlk, Styles.f20, Styles.ffMbold, Styles.aslCenter]}>&#x20B9;{' '}</Text>
                                                                    <TextInput
                                                                        style={[Styles.txtAlignLt,canEditTextInput ? Styles.cBlk :Styles.cLightGrey, Styles.f16, Styles.ffMbold, {width: 90}]}
                                                                        selectionColor={"black"}
                                                                        editable={canEditTextInput}
                                                                        maxLength={8}
                                                                        keyboardType='numeric'
                                                                        returnKeyType="done"
                                                                        onSubmitEditing={() => {
                                                                            Keyboard.dismiss()
                                                                        }}
                                                                        // onChangeText={(value) => this.setState({CODSystemAmount: value})}
                                                                        onChangeText={(value) => this.validateSystemCOD(value)}
                                                                        value={this.state.CODSystemAmount}
                                                                    />
                                                                </View>
                                                                {/*SHORT CASH*/}
                                                                <View style={[Styles.row]}>
                                                                    <Title
                                                                        style={[Styles.cBlk, Styles.f14, Styles.ffMbold]}>(Short Cash{'  '}&#x20B9;{' '}
                                                                        <Title
                                                                            style={[Services.returnCalculatedShortCash(this.state.CODSystemAmount, this.state.CODAmountCollected) > 0 ? Styles.cRed : Styles.colorGreen, Styles.f14, Styles.ffMbold,Styles.padH1]}>
                                                                            {Services.returnCalculatedShortCash(this.state.CODSystemAmount, this.state.CODAmountCollected)}
                                                                        </Title>
                                                                        )</Title>
                                                                </View>
                                                            </View>
                                                            {/*COD SYSTEM IMAGE*/}
                                                            <View>
                                                                <View
                                                                    style={[Styles.row, Styles.aitCenter, Styles.marV5,]}>
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            // this.setState({
                                                                            //     imageType: 'COD_SYSTEM_IMAGE',
                                                                            //     imageSelectionModal: true
                                                                            // })
                                                                            this.setState({imageType: 'COD_SYSTEM_IMAGE'}, () => {
                                                                                this.imageUpload('CAMERA')
                                                                            })
                                                                        }}
                                                                        disabled={this.state.codSystemImageUrl || !canEditTextInput}
                                                                        activeOpacity={0.7}
                                                                        style={[Styles.row, Styles.bgLYellow, Styles.br5, Styles.aslCenter, Styles.p5,]}>
                                                                        {LoadSVG.cameraPic}
                                                                        <Text
                                                                            style={[Styles.f16, this.state.codSystemImageUrl || !canEditTextInput ? Styles.cDisabled : Styles.colorBlue, Styles.ffLBold, Styles.pRight15]}>COD
                                                                            System{Services.returnRedStart()}</Text>
                                                                    </TouchableOpacity>
                                                                    {
                                                                        createdCashClosureDetails.systemCodDocumentDetails
                                                                            ?
                                                                            null
                                                                            :
                                                                            this.state.codSystemImageUrl
                                                                                ?
                                                                                <MaterialIcons
                                                                                    onPress={() => {
                                                                                        this.setState({
                                                                                            picUploaded: false,
                                                                                            codSystemImageUrl: '',
                                                                                            codSystemImageFormData: ''
                                                                                        })
                                                                                    }}
                                                                                    name="delete" size={28} color="black"/>
                                                                                :
                                                                                null
                                                                    }
                                                                </View>

                                                                {
                                                                    this.state.codSystemImageUrl
                                                                        ?
                                                                        <View
                                                                            style={[Styles.aslCenter,]}>
                                                                            <TouchableOpacity
                                                                                style={[Styles.row, Styles.aslCenter]}
                                                                                onPress={() => {
                                                                                    this.setState({
                                                                                        imagePreview: true,
                                                                                        imagePreviewURL: this.state.codSystemImageUrl
                                                                                    })
                                                                                }}>
                                                                                <Image
                                                                                    onLoadStart={() => this.setState({imageLoading: true})}
                                                                                    onLoadEnd={() => this.setState({imageLoading: false})}
                                                                                    style={[{
                                                                                        width: Dimensions.get('window').width / 2.2,
                                                                                        height: 120
                                                                                    }, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                    source={this.state.codSystemImageUrl ? {uri: this.state.codSystemImageUrl} : null}
                                                                                />
                                                                            </TouchableOpacity>
                                                                            {Services.returnTripZoomIcon()}
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

                                                        {/*COD COLLECTED*/}
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            onPress={() => {
                                                                this.setState({
                                                                    showDenominationModal: true,
                                                                    selectedCard: 'COD_AMOUNT',
                                                                    editDenomination: canEditTextInput
                                                                }, () => {
                                                                    this.calculateCollection(cashCollectedDenominationList)
                                                                })
                                                            }}
                                                            style={[Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.padH5]}>
                                                            <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                <Title
                                                                    style={[Styles.cBlk, Styles.f16, Styles.ffMbold]}>COD
                                                                    Collected {Services.returnRedStart()}</Title>
                                                                <Title
                                                                    style={[canEditTextInput ? Styles.cBlk :Styles.cLightGrey, Styles.f16, Styles.ffMbold, Styles.brdrBtm1, {width: 100}]}>&#x20B9;{' '}{this.state.CODAmountCollected}</Title>
                                                            </View>
                                                            <Title
                                                                style={[Styles.colorGreen, Styles.f14, Styles.ffMbold, Styles.aslEnd]}>(Denomination Table)</Title>
                                                        </TouchableOpacity>

                                                        {/*Money Deposited at bank button*/}
                                                        <View>
                                                            <View
                                                                style={[Styles.row, Styles.jSpaceBet, Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.p5]}>
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Desposited
                                                                    at Bank{Services.returnRedStart()}</Text>
                                                                <RadioButton.Group
                                                                    onValueChange={amountDepositAtBank => this.setState({amountDepositAtBank})}
                                                                    value={this.state.amountDepositAtBank}>
                                                                    <View
                                                                        style={[Styles.row, Styles.aslCenter, Styles.padV3]}>
                                                                        <View style={[Styles.row, Styles.aslCenter]}>
                                                                            <RadioButton disabled={!canEditTextInput} value={'YES'}/>
                                                                            <Text
                                                                                style={[Styles.ffLBlack, Styles.padH5, Styles.aslCenter, Styles.f16]}>Yes</Text>
                                                                        </View>
                                                                        <View style={[Styles.row, Styles.aslCenter]}>
                                                                            <RadioButton disabled={!canEditTextInput} value={'NO'}/>
                                                                            <Text
                                                                                style={[Styles.ffLBlack, Styles.padH5, Styles.aslCenter, Styles.f16]}>No</Text>
                                                                        </View>
                                                                    </View>
                                                                </RadioButton.Group>
                                                            </View>

                                                            {
                                                                this.state.amountDepositAtBank === 'NO'
                                                                    ?
                                                                    <View
                                                                        style={[Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.padH5]}>
                                                                        <Title
                                                                            style={[Styles.cBlk, Styles.f16, Styles.ffMbold, Styles.aslStart]}>Enter
                                                                            Reason {Services.returnRedStart()}</Title>
                                                                        <TextInput label={'Enter Reason*'}
                                                                                   placeholder={'Type here'}
                                                                                   editable={canEditTextInput}
                                                                                   style={[Styles.marV5,canEditTextInput ? Styles.cBlk : Styles.cLightGrey]}
                                                                                   multiline={true}
                                                                                   theme={theme}
                                                                                   mode='outlined'
                                                                                   onSubmitEditing={() => {
                                                                                       Keyboard.dismiss()
                                                                                   }}
                                                                                   placeholderTextColor='#233167'
                                                                                   blurOnSubmit={false}
                                                                                   onChangeText={(amountNotDepositedReason) => this.setState({amountNotDepositedReason})}
                                                                                   value={this.state.amountNotDepositedReason}
                                                                        />
                                                                    </View>
                                                                    :
                                                                    this.state.amountDepositAtBank === 'YES'
                                                                        ?
                                                                        <View
                                                                            style={[Styles.row, Styles.jSpaceBet, Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.padH5]}>
                                                                            <View>
                                                                                <Title
                                                                                    style={[Styles.cBlk, Styles.f16, Styles.ffMbold]}>Amount
                                                                                    Deposited{Services.returnRedStart()}</Title>
                                                                                <TouchableOpacity
                                                                                    activeOpacity={0.7}
                                                                                    onPress={() => {
                                                                                        this.setState({
                                                                                            showDenominationModal: true,
                                                                                            selectedCard: 'DEPOSITED_AMOUNT',
                                                                                            editDenomination: canEditTextInput
                                                                                        }, () => {
                                                                                            this.calculateCollection(depositedDenominationList)
                                                                                        })
                                                                                    }}>
                                                                                    <Title
                                                                                        style={[canEditTextInput ?Styles.cBlk : Styles.cLightGrey, Styles.f16, Styles.ffMbold, Styles.brdrBtm1, {width: 100}]}>&#x20B9;{' '}{this.state.depositedAmount}</Title>
                                                                                </TouchableOpacity>
                                                                                <Title
                                                                                    style={[Styles.colorGreen, Styles.f14, Styles.ffMbold, Styles.aslStart]}>(Denomination
                                                                                    table)</Title>

                                                                                {/*DEPOSITED TIME CARD*/}
                                                                                <View>
                                                                                    <Title
                                                                                        style={[Styles.cBlk, Styles.f16, Styles.ffMbold]}>Time
                                                                                        of
                                                                                        Deposit {Services.returnRedStart()}</Title>
                                                                                    <TouchableOpacity
                                                                                        activeOpacity={0.7}
                                                                                        disabled={!canEditTextInput}
                                                                                        onPress={() => {
                                                                                            this.setState({showTimepicker: true})
                                                                                        }}
                                                                                        style={[Styles.row, Styles.bgLYellow, Styles.padH5, Styles.OrdersScreenCardshadow, {width: windowWidth / 4.4}]}>
                                                                                        <Text
                                                                                            style={[canEditTextInput ? Styles.cBlk : Styles.cLightGrey, Styles.f18, Styles.ffLBold, Styles.aslCenter]}>{this.state.StartTime || ' -- '}:{this.state.StartTimeMin === 0 ? '00' : this.state.StartTimeMin || ' -- '}</Text>
                                                                                        <Ionicons style={[Styles.pLeft15]}
                                                                                                  name="ios-clock" size={32}
                                                                                                  color="#000"/>
                                                                                    </TouchableOpacity>
                                                                                </View>
                                                                            </View>
                                                                            {/*DEPOSITED IMAGE*/}
                                                                            <View>
                                                                                <View
                                                                                    style={[Styles.row, Styles.aitCenter, Styles.marV5,]}>
                                                                                    <TouchableOpacity
                                                                                        onPress={() => {
                                                                                            // this.setState({
                                                                                            //     imageType: 'DEPOSITED_AMOUNT_IMAGE',
                                                                                            //     imageSelectionModal: true
                                                                                            // })
                                                                                            this.setState({imageType: 'DEPOSITED_AMOUNT_IMAGE'}, () => {
                                                                                                this.imageUpload('CAMERA')
                                                                                            })
                                                                                        }}
                                                                                        disabled={this.state.depositedAmountImageUrl || !canEditTextInput}
                                                                                        activeOpacity={0.7}
                                                                                        style={[Styles.row, Styles.bgLYellow, Styles.br5, Styles.aslCenter, Styles.p5,]}>
                                                                                        {LoadSVG.cameraPic}
                                                                                        <Text
                                                                                            style={[Styles.f16, this.state.depositedAmountImageUrl || !canEditTextInput ? Styles.cDisabled : Styles.colorBlue, Styles.ffLBold, Styles.pRight15]}>Deposit
                                                                                            slip{Services.returnRedStart()}</Text>
                                                                                    </TouchableOpacity>
                                                                                    {
                                                                                        createdCashClosureDetails.bankDepositDocumentDetails
                                                                                            ?
                                                                                            null
                                                                                            :
                                                                                            this.state.depositedAmountImageUrl
                                                                                                ?
                                                                                                <MaterialIcons
                                                                                                    onPress={() => {
                                                                                                        this.setState({
                                                                                                            picUploaded: false,
                                                                                                            depositedAmountImageUrl: '',
                                                                                                            depositedAmountImageFormData: ''
                                                                                                        })
                                                                                                    }}
                                                                                                    name="delete" size={28}
                                                                                                    color="black"/>
                                                                                                :
                                                                                                null
                                                                                    }
                                                                                </View>

                                                                                {
                                                                                    this.state.depositedAmountImageUrl
                                                                                        ?
                                                                                        <View
                                                                                            style={[Styles.aslCenter,]}>
                                                                                            <TouchableOpacity
                                                                                                style={[Styles.row, Styles.aslCenter]}
                                                                                                onPress={() => {
                                                                                                    this.setState({
                                                                                                        imagePreview: true,
                                                                                                        imagePreviewURL: this.state.depositedAmountImageUrl
                                                                                                    })
                                                                                                }}>
                                                                                                <Image
                                                                                                    onLoadStart={() => this.setState({imageLoading: true})}
                                                                                                    onLoadEnd={() => this.setState({imageLoading: false})}
                                                                                                    style={[{
                                                                                                        width: Dimensions.get('window').width / 2.2,
                                                                                                        height: 120
                                                                                                    }, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                                    source={this.state.depositedAmountImageUrl ? {uri: this.state.depositedAmountImageUrl} : null}
                                                                                                />
                                                                                            </TouchableOpacity>
                                                                                            {Services.returnTripZoomIcon()}
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
                                                        </View>

                                                        {/*CLOSING BALANCE*/}
                                                        <View>
                                                            <TouchableOpacity
                                                                activeOpacity={0.7}
                                                                onPress={() => {
                                                                    this.setState({
                                                                        showDenominationModal: true,
                                                                        selectedCard: 'CLOSING_AMOUNT',
                                                                        editDenomination: canEditTextInput
                                                                    }, () => {
                                                                        this.calculateCollection(closingDenominationList)
                                                                    })
                                                                }}
                                                                style={[Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.padH5]}>
                                                                <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                    <Title
                                                                        style={[Styles.cBlk, Styles.f16, Styles.ffMbold]}>Closing
                                                                        Balance {Services.returnRedStart()}</Title>
                                                                    <Title
                                                                        style={[canEditTextInput ? Styles.cBlk : Styles.cLightGrey, Styles.f16, Styles.ffMbold, Styles.brdrBtm1, {width: 100}]}>&#x20B9;{' '}{this.state.closingAmount}</Title>
                                                                </View>
                                                                <Text
                                                                    style={[Styles.cBlk, Styles.f14, Styles.ffMbold, Styles.aslEnd]}>(System
                                                                    Calculated {Services.returnCalculatedAmount(this.state.closingAmount, this.state.openingAmount, this.state.CODAmountCollected, this.state.amountDepositAtBank === 'YES' ? this.state.depositedAmount : 0)})</Text>
                                                                <Title
                                                                    style={[Styles.colorGreen, Styles.f14, Styles.ffMbold, Styles.aslEnd]}>(Denomination Table)</Title>
                                                            </TouchableOpacity>
                                                        </View>

                                                        {/*USER PROFILE PHOTO*/}
                                                        <View>
                                                            <View style={[Styles.row, Styles.aitCenter, Styles.marV5,]}>
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        this.setState({imageType: 'PROFILE_PIC'}, () => {
                                                                            this.imageUpload('CAMERA')
                                                                        })
                                                                    }}
                                                                    activeOpacity={0.7}
                                                                    disabled={this.state.userImageUrl || !canEditTextInput}
                                                                    style={[Styles.row, Styles.bgLYellow, Styles.br5, Styles.aslCenter, Styles.p5,]}>
                                                                    {LoadSVG.cameraPic}
                                                                    <Text
                                                                        style={[Styles.f16, this.state.userImageUrl || !canEditTextInput ? Styles.cDisabled : Styles.colorBlue, Styles.ffLBold, Styles.pRight15]}>Upload Your Photo{Services.returnRedStart()}</Text>
                                                                </TouchableOpacity>
                                                                {
                                                                    createdCashClosureDetails.userPhotoDetails
                                                                        ?
                                                                        null
                                                                        :
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
                                                                            <MaterialCommunityIcons name="resize"
                                                                                                    size={24}
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

                                                        {/*OTHER DOCUMENT UPLOAD*/}
                                                        <View>
                                                            <View
                                                                style={[Styles.row, Styles.aitCenter, Styles.marV5,]}>
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        // this.setState({
                                                                        //     imageType: 'DOCUMENT_THREE',
                                                                        //     imageSelectionModal: true
                                                                        // })
                                                                        this.setState({imageType: 'DOCUMENT_THREE'}, () => {
                                                                            this.imageUpload('CAMERA')
                                                                        })
                                                                    }}
                                                                    activeOpacity={0.7}
                                                                    disabled={this.state.documentThreeUrl || !canEditTextInput}
                                                                    style={[Styles.row, Styles.bgLYellow, Styles.br5, Styles.aslCenter, Styles.p5,]}>
                                                                    {LoadSVG.cameraPic}
                                                                    <Text
                                                                        style={[Styles.f16, this.state.documentThreeUrl || !canEditTextInput ? Styles.cDisabled : Styles.colorBlue, Styles.ffLBold, Styles.pRight15]}>Upload
                                                                        Other Document</Text>
                                                                </TouchableOpacity>
                                                                {
                                                                    createdCashClosureDetails.otherDocumentDetails
                                                                        ?
                                                                        null
                                                                        :
                                                                        this.state.documentThreeUrl
                                                                            ?
                                                                            <TouchableOpacity
                                                                                onPress={() => {
                                                                                    this.setState({
                                                                                        picUploaded: false,
                                                                                        documentThreeUrl: '',
                                                                                        documentThreeFormData: ''
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
                                                                this.state.documentThreeUrl
                                                                    ?
                                                                    <View
                                                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                        <TouchableOpacity
                                                                            style={[Styles.row, Styles.aslCenter]}
                                                                            onPress={() => {
                                                                                this.setState({
                                                                                    imagePreview: true,
                                                                                    imagePreviewURL: this.state.documentThreeUrl
                                                                                })
                                                                            }}>
                                                                            <Image
                                                                                onLoadStart={() => this.setState({imageLoading: true})}
                                                                                onLoadEnd={() => this.setState({imageLoading: false})}
                                                                                style={[{
                                                                                    width: Dimensions.get('window').width / 2,
                                                                                    height: 120
                                                                                }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                source={this.state.documentThreeUrl ? {uri: this.state.documentThreeUrl} : null}
                                                                            />
                                                                            <MaterialCommunityIcons
                                                                                name="resize" size={24}
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

                                                    </View>
                                                    :
                                                    <View style={[Styles.alignCenter, Styles.flex1]}>
                                                        {
                                                            this.state.siteValue
                                                                ?
                                                                <Text
                                                                    style={[Styles.ffLBold, Styles.f18, Styles.colorBlue, Styles.pLeft15]}>Already
                                                                    Created Today..</Text>
                                                                :
                                                                null
                                                        }
                                                    </View>
                                            }

                                        </View>
                                    </ScrollView>


                                    {/*FOOTER BUTTONS*/}
                                    <View>
                                        {
                                            this.state.allowToCreate && canEditTextInput
                                                ?
                                                <View
                                                    style={[Styles.row, Styles.p10, Styles.jSpaceArd, Styles.bgLBlueAsh]}>

                                                    <TouchableOpacity
                                                        activeOpacity={0.7}
                                                        onPress={() => {
                                                            this.setState({partialSaved: true,submitPressed:false,saveButtonPressed:true}, () => {
                                                                this.formValidations()
                                                            })
                                                        }}
                                                        disabled={this.state.saveButtonPressed}
                                                        style={[Styles.aslCenter, {width: windowWidth / 2}]}>
                                                        <Text
                                                            style={[Styles.ffMbold, Styles.br10, Styles.bgBlueGreenMix, Styles.cWhite, Styles.aslCenter, Styles.padH15, Styles.padV5, Styles.f16,]}>SAVE</Text>
                                                    </TouchableOpacity>

                                                    {
                                                        this.state.cardStatus === "PARTIALLY_SAVED" || this.state.cardStatus === "PARTIAL_SAVED" || this.state.cardStatus === "SUBMITTED"
                                                            ?
                                                            <TouchableOpacity
                                                                activeOpacity={0.7}
                                                                onPress={() => this.setState({
                                                                    showHistoryModal: true,
                                                                    // cardHistory: createdCashClosureDetails.history
                                                                    cardHistory: createdCashClosureDetails.auditing,
                                                                    submitPressed:false,saveButtonPressed:false
                                                                })}
                                                                style={[Styles.aslCenter, Styles.br10, Styles.bgOrangeYellow, Styles.marH5]}>
                                                                <Text
                                                                    style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>HISTORY</Text>
                                                            </TouchableOpacity>
                                                            :
                                                            null
                                                    }

                                                    <TouchableOpacity
                                                        activeOpacity={0.7}
                                                        onPress={() => {
                                                            this.setState({partialSaved: false,submitPressed:true,saveButtonPressed:false}, () => {
                                                                // this.validateDetails()
                                                                this.formValidations()
                                                            })
                                                        }}
                                                        disabled={this.state.submitPressed}
                                                        style={[Styles.aslCenter, {width: windowWidth / 2}]}>
                                                        <Text
                                                            style={[Styles.ffMbold, Styles.br10, Styles.bgGrn, Styles.cWhite, Styles.aslCenter, Styles.padH10, Styles.padV5, Styles.f16,]}>SUBMIT</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                :
                                                this.state.cardStatus === "PARTIALLY_SAVED" || this.state.cardStatus === "PARTIAL_SAVED" || this.state.cardStatus === "SUBMITTED"
                                                    ?
                                                    <TouchableOpacity
                                                        activeOpacity={0.7}
                                                        onPress={() => this.setState({
                                                            showHistoryModal: true,
                                                            // cardHistory: createdCashClosureDetails.history
                                                            cardHistory: createdCashClosureDetails.auditing,
                                                            submitPressed:false,saveButtonPressed:false
                                                        })}
                                                        style={[Styles.aslCenter, Styles.br10, Styles.bgOrangeYellow, Styles.m10]}>
                                                        <Text
                                                            style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>HISTORY</Text>
                                                    </TouchableOpacity>
                                                    :
                                                    null
                                        }
                                    </View>
                                </View>

                            </View>
                        </View>
                    </View>
                </Modal>

                {/*Denomination Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.showDenominationModal}
                    onRequestClose={() => {
                        // this.setState({showDenominationModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <View style={[Styles.flex1, Styles.bgWhite]}>
                                <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                                    <View style={[Styles.row, Styles.marH10, Styles.marV10]}>
                                        <Text style={[Styles.f20, Styles.ffRMedium, Styles.cWhite, Styles.aslCenter]}>{this.state.selectedCard === 'COD_AMOUNT' ? 'COD Amount' : _.startCase(_.lowerCase(this.state.selectedCard))} Counter</Text>
                                    </View>
                                    {
                                        selectedCard === 'OPENING_AMOUNT' || this.state.viewCashClosureModal || !editDenomination
                                            ?
                                            <MaterialCommunityIcons name="window-close" size={28}
                                                                    color="#fff" style={{marginRight: 10}}
                                                                    onPress={() => this.setState({showDenominationModal: false})}/>
                                            :
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (this.state.noteTotalCount >= 0) {
                                                        if (this.state.selectedCard === 'OPENING_AMOUNT') {
                                                            this.setState({
                                                                openingAmount: this.state.noteTotalCount,
                                                                showDenominationModal: false
                                                            })
                                                        } else if (this.state.selectedCard === 'DEPOSITED_AMOUNT') {
                                                            this.setState({
                                                                depositedAmount: this.state.noteTotalCount,
                                                                showDenominationModal: false
                                                            })
                                                        } else if (this.state.selectedCard === 'CLOSING_AMOUNT') {
                                                            this.setState({
                                                                closingAmount: this.state.noteTotalCount,
                                                                showDenominationModal: false
                                                            })
                                                        } else if (this.state.selectedCard === 'COD_AMOUNT') {
                                                            this.setState({
                                                                CODAmountCollected: this.state.noteTotalCount,
                                                                showDenominationModal: false
                                                            })
                                                        } else {
                                                            this.setState({showDenominationModal: false})
                                                        }

                                                    } else {
                                                        Utils.dialogBox('Please select amount', '')
                                                    }
                                                }}
                                                activeOpacity={0.7}
                                                style={[Styles.p5, Styles.bgGrn, Styles.br8, Styles.marH10]}>
                                                <Text
                                                    style={[Styles.f20, Styles.ffRMedium, Styles.cWhite, Styles.aslCenter, Styles.padH10]}>Save</Text>
                                            </TouchableOpacity>
                                    }
                                </Appbar.Header>
                                <View style={[Styles.flex1, Styles.bgWhite]}>
                                    {
                                        noteDenominationList
                                            ?
                                            <ScrollView style={[Styles.flex1, {paddingBottom: 60}]}>
                                                <View
                                                    style={[Styles.marH20, Styles.marV7, Styles.row, Styles.aslCenter, Styles.jSpaceBet, Styles.br5, Styles.padV10, Styles.padH20,
                                                        Styles.bgBlueGreenMix, Styles.OrdersScreenCardshadow, {
                                                            width: Dimensions.get('window').width - 20
                                                        }]}>
                                                    <View style={[Styles.aslCenter]}>
                                                        <Text
                                                            style={[Styles.f20, Styles.ffRRegular, Styles.cBlk, Styles.aslCenter]}>Note</Text>
                                                    </View>
                                                    <View style={[Styles.alignCenter]}>
                                                        <Text
                                                            style={[Styles.f20, Styles.ffRRegular, Styles.cBlk, Styles.aslStart, Styles.mRt10]}>Count</Text>
                                                    </View>
                                                    <View style={[Styles.alignCenter]}>
                                                        <Text
                                                            style={[Styles.f20, Styles.ffRRegular, Styles.cBlk, Styles.aslStart, Styles.mRt10]}>Total</Text>
                                                    </View>
                                                </View>
                                                <FlatList
                                                    // style={[Styles.aslCenter]}
                                                    data={selectedCard === 'OPENING_AMOUNT' ? openingDenominationList :
                                                        selectedCard === 'DEPOSITED_AMOUNT' ? depositedDenominationList :
                                                            selectedCard === 'CLOSING_AMOUNT' ? closingDenominationList :
                                                                selectedCard === 'COD_AMOUNT' ? cashCollectedDenominationList : []
                                                    }
                                                    renderItem={({item, index}) => {
                                                        let renderedDenomination = selectedCard === 'OPENING_AMOUNT' ? openingDenominationList :
                                                            selectedCard === 'DEPOSITED_AMOUNT' ? depositedDenominationList :
                                                                selectedCard === 'CLOSING_AMOUNT' ? closingDenominationList :
                                                                    selectedCard === 'COD_AMOUNT' ? cashCollectedDenominationList : []
                                                        return (
                                                            <View
                                                                style={[Styles.m3, Styles.row, Styles.jSpaceBet, Styles.marH10]}>
                                                                <View style={[Styles.alignCenter, Styles.bgDWhite,]}>
                                                                    {Services.returnCurrencyImages(item.name)}
                                                                    {/*<Text   style={[Styles.f16, Styles.ffRRegular, Styles.cBlk, Styles.aslCenter]}>{item.name}</Text>*/}
                                                                </View>
                                                                <View
                                                                    style={[Styles.row, Styles.jSpaceBet, Styles.bgLBlueAsh, Styles.padH5]}>
                                                                    <TouchableOpacity
                                                                        style={[Styles.aslCenter]}
                                                                        disabled={item.count === 0 || selectedCard === 'OPENING_AMOUNT' || !editDenomination}
                                                                        onPress={() => this.counterValidation(item.count, 'Decrement', 'deliveredPackages', index, renderedDenomination)}
                                                                    >
                                                                        <Text
                                                                            style={[item.count === 0 || selectedCard === 'OPENING_AMOUNT' || !editDenomination ? Styles.bgLightGrey : Styles.bgBlk,
                                                                                Styles.ffRRegular, Styles.padH10, Styles.padV5, Styles.cWhite, Styles.f18]}
                                                                        >-</Text></TouchableOpacity>
                                                                    <TextInput
                                                                        style={[Styles.txtAlignCen,
                                                                            selectedCard === 'OPENING_AMOUNT' || !editDenomination ? Styles.cLightGrey : Styles.cBlk,Styles.f17,
                                                                            {
                                                                                width: 60,
                                                                            }]}
                                                                        selectionColor={"black"}
                                                                        editable={(!(selectedCard === 'OPENING_AMOUNT' || !editDenomination))}
                                                                        maxLength={6}
                                                                        keyboardType='numeric'
                                                                        returnKeyType="done"
                                                                        onSubmitEditing={() => {
                                                                            Keyboard.dismiss()
                                                                        }}
                                                                        onChangeText={(value) => this.counterValidation(value, 'onChange', 'deliveredPackages', index, renderedDenomination)}
                                                                        value={item.count === '' ? item.count : JSON.stringify(item.count)}
                                                                    />
                                                                    <TouchableOpacity
                                                                        style={[Styles.aslCenter]}
                                                                        disabled={item.count === 999998 || selectedCard === 'OPENING_AMOUNT' || !editDenomination}
                                                                        onPress={() => this.counterValidation(item.count, 'Increment', 'deliveredPackages', index, renderedDenomination)}
                                                                    >
                                                                        <Text
                                                                            style={[item.count === 999998 || selectedCard === 'OPENING_AMOUNT' || !editDenomination ? Styles.bgLightGrey : Styles.bgBlk,
                                                                                Styles.ffRRegular, Styles.padH10, Styles.padV5, Styles.cWhite, Styles.f18]}
                                                                        >+</Text></TouchableOpacity>
                                                                </View>
                                                                <View
                                                                    style={[Styles.alignCenter, Styles.bgLightVoilet, {
                                                                        width: 80,
                                                                        backgroundColor: '#D1FFE9'
                                                                    }]}>
                                                                    <Text
                                                                        style={[Styles.f16, Styles.ffRBold, {color: '#03B675'}, Styles.aslCenter]}>{item.total}</Text>
                                                                </View>
                                                            </View>
                                                        )
                                                    }}
                                                    extraData={this.state}
                                                    keyExtractor={(item, index) => index.toString()}/>

                                                <View
                                                    style={[Styles.marH20, Styles.marV7, Styles.row, Styles.aslCenter, Styles.jSpaceBet, Styles.br5, Styles.padV10, Styles.padH20,
                                                        Styles.bgDullYellow, Styles.OrdersScreenCardshadow, {
                                                            width: Dimensions.get('window').width - 20
                                                        }]}>
                                                    <View style={[Styles.aslCenter]}>
                                                        <Text
                                                            style={[Styles.f20, Styles.ffRRegular, Styles.cBlk, Styles.aslCenter]}>Total
                                                            Count</Text>
                                                    </View>

                                                    <View style={[Styles.alignCenter]}>
                                                        <Text
                                                            style={[Styles.f20, Styles.ffRBold, Styles.cBlk, Styles.aslStart, Styles.mRt10]}>{this.state.noteTotalCount}</Text>
                                                    </View>
                                                </View>
                                            </ScrollView>
                                            :
                                            <View style={[Styles.flex1, Styles.aitCenter, Styles.jCenter]}>
                                                <Text style={[Styles.ffMbold, Styles.f20, Styles.alignCenter]}>No Data
                                                    Found..</Text>
                                            </View>
                                    }

                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/*MODAL for site station code selection*/}
                <Modal transparent={true}
                       visible={this.state.siteSelectionModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           this.setState({siteSelectionModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[[Styles.flex1, Styles.bgWhite, Styles.flex1, {
                                width: Dimensions.get('window').width,
                                height: Dimensions.get('window').height,
                            }]]}>
                            <Appbar.Header theme={theme} style={[Styles.bgDarkRed]}>
                                <Appbar.Content title={'Sites List'} titleStyle={[Styles.ffLBold]}/>
                                <MaterialCommunityIcons name="window-close" size={28}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() => this.setState({siteSelectionModal: false})}/>
                            </Appbar.Header>
                            <View style={[Styles.flex1]}>

                                <View style={[Styles.alignCenter, Styles.marV10]}>
                                    <Searchbar
                                        style={{
                                            width: Dimensions.get('window').width - 60,
                                            borderWidth: 1,
                                            backgroundColor: '#f5f5f5',
                                        }}
                                        isFocused="false"
                                        placeholder="Search a Site"
                                        onSubmitEditing={() => {
                                            this.searchSite(this.state.searchString), () => {
                                                Keyboard.dismiss()
                                            }
                                        }}
                                        value={this.state.searchString}
                                        onChangeText={(searchString) => {
                                            this.searchSite(searchString)
                                        }}
                                    />
                                </View>

                                {this.state.searchedSiteList.length > 0 ?
                                    <ScrollView
                                        showsVerticalScrollIndicator={true}
                                        style={{height: Dimensions.get('window').height - 120}}>
                                        <List.Section
                                            style={[Styles.row, Styles.flexWrap, Styles.aslStart, Styles.pLeft10]}>
                                            {this.state.searchedSiteList.map((list, index) => {
                                                // let colors = ['#D6D1B4', '#F3F2F2', '#FFEE93', '#ccf6d8', '#F8F1EC', '#ECF3AB', '#F4EDAB'];
                                                let colors = ['#f7e39a', '#fece79', '#f8a555', '#f48270', '#f27f93', '#f192bb', '#e4b7d4', '#8c8bc4', '#90c9e2', '#a1d9d8', '#98d0a9', '#c0d682'];
                                                let fontColors = ['#8B814C', '#8B8682', '#EEC900', '#519a4d', '#BC7642', '#D1E231', '#D6C537'];
                                                return (
                                                    <View
                                                        key={index}
                                                        style={this.state.siteValue === list.id ? {
                                                            backgroundColor: '#f3cc14', borderRadius: 10
                                                        } : null
                                                        }>
                                                        <TouchableOpacity
                                                            onPress={() => this.setState({
                                                                siteValue: list.id,
                                                                siteName: list.attrs.siteLable,
                                                                siteSelectionModal: false,
                                                            }, () => {
                                                                this.checkPreviousCashDetails(list.id)
                                                            })}
                                                            activeOpacity={0.9}
                                                            style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10,
                                                                {
                                                                    backgroundColor: colors[index % colors.length],
                                                                    width: Dimensions.get('window').width / 2.3,
                                                                    height: Dimensions.get('window').height / 6.5
                                                                }]}>
                                                            <View style={[Styles.p5, Styles.aslCenter]}>
                                                                <View style={[Styles.aslCenter, Styles.p3]}>
                                                                    {LoadSVG.addressDetailsIcon}
                                                                </View>
                                                                <Text
                                                                    style={[Styles.colorBlue, Styles.f18, Styles.ffLBold, Styles.aslCenter]}>{list.siteCode}</Text>
                                                                <Text
                                                                    numberOfLines={1}
                                                                    style={[Styles.colorBlue, Styles.f16, Styles.ffLBold, Styles.aslCenter]}>{list.name}</Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    </View>
                                                );
                                            })}
                                        </List.Section>
                                    </ScrollView>
                                    :
                                    <View style={[Styles.aslCenter, Styles.mTop20]}>
                                        <Text style={[Styles.ffLBold, Styles.f18, Styles.alignCenter]}>There are no
                                            Sites</Text>
                                    </View>
                                }
                            </View>
                        </View>
                    </View>
                </Modal>

                {/*MODAL for History */}
                <Modal transparent={true}
                       visible={this.state.showHistoryModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           this.setState({showHistoryModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[[Styles.bw1, Styles.aslCenter, Styles.padV15, Styles.padH5, Styles.br40, Styles.bgWhite, {
                                width: Dimensions.get('window').width - 20,
                                height: Dimensions.get('window').height - 160
                            }]]}>
                            <View style={Styles.alignCenter}>
                                <Text style={[Styles.ffLBold, Styles.colorBlue, Styles.f22,]}>Cash Closure
                                    History</Text>

                            </View>
                            {
                                this.state.cardHistory
                                    ?
                                    this.state.cardHistory.length > 0
                                        ?
                                        <ScrollView style={[Styles.mTop10, Styles.p3]}>
                                            <List.Section>
                                                {this.state.cardHistory.map((list, index) => {
                                                    return (
                                                        <View key={index}
                                                              style={[Styles.mBtm10, Styles.marH5]}>
                                                            <View
                                                                style={[Styles.padH10, Styles.OrdersScreenCardshadow, Styles.bgLBlueWhite,
                                                                    {
                                                                        width: Dimensions.get('window').width - 50
                                                                    }]}>

                                                                <View
                                                                    style={[Styles.row,Styles.padV5]}>
                                                                    {/*<Text style={[Styles.f18, Styles.colorBlue, Styles.ffLBlack,]}>{list.actionByUserName}{' '}({Services.getUserRolesShortName(list.actionByUserRole)})</Text>*/}
                                                                    <Text style={[Styles.f16, Styles.colorBlue, Styles.ffMregular,]}>{list}</Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    );
                                                })}
                                            </List.Section>
                                        </ScrollView>
                                        :
                                        <View style={[Styles.alignCenter, Styles.flex1]}>
                                            <Text style={[Styles.f18, Styles.ffLBlack, Styles.colorBlue]}>No History
                                                Found..</Text>
                                        </View>
                                    :
                                    <View style={[Styles.alignCenter, Styles.flex1]}>
                                        <Text style={[Styles.f18, Styles.ffLBlack, Styles.colorBlue]}>No History
                                            Found..</Text>
                                    </View>
                            }
                        </View>
                        <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                            this.setState({showHistoryModal: false})
                        }}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
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
                            style={[Styles.bgWhite, Styles.aslCenter, Styles.p10, {width: Dimensions.get('window').width - 80}]}>

                            <View style={[Styles.p10]}>
                                <Text
                                    style={[Styles.f22, Styles.cBlk, Styles.txtAlignCen, Styles.ffLBlack, Styles.pBtm10]}>Add
                                    Image</Text>
                                <View style={[Styles.marV15]}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            this.setState({imageSelectionModal: false}, () => {
                                                this.imageUpload('CAMERA')
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
                                                this.imageUpload('LIBRARY')
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

                {/*MODAL FOR SUCCESS*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.warningModal}
                    onRequestClose={() => {
                        this.setState({warningModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br15, {width: Dimensions.get('window').width - 60}]}>
                            <Card.Content style={[Styles.aslCenter, Styles.p5, Styles.pBtm18]}>
                                <View style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.mapIconBig}</View>
                                <Title
                                    style={[Styles.cRed, Styles.f20, Styles.ffLBold, Styles.aslCenter]}>WARNING :
                                    You are trying to Submit away from the site,Please try being at site.
                                </Title>
                            </Card.Content>
                            <Card.Content style={[Styles.row, Styles.aslCenter, Styles.p5, Styles.pBtm18,]}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => this.setState({warningModal: false, swipeActivated: false})}
                                    style={[Styles.aslCenter, Styles.br10, Styles.bgBlk, Styles.marH5]}>
                                    <Text
                                        style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.padV5, Styles.padH10, Styles.f16,]}> OK </Text>
                                </TouchableOpacity>
                            </Card.Content>
                        </View>
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
        );
    }
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF'
    },
    card: {
        flex: 1,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#E8E8E8',
        justifyContent: 'center',
        backgroundColor: 'white'
    },
    text: {
        textAlign: 'center',
        fontSize: 50,
        backgroundColor: 'transparent'
    },
    done: {
        textAlign: 'center',
        fontSize: 30,
        color: 'white',
        backgroundColor: 'transparent'
    }
})

