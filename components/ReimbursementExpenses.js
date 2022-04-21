import React, {Component} from "react";
import {
    ActivityIndicator,
    Alert,
    Button,
    DatePickerAndroid,
    Dimensions,
    FlatList,
    Image,
    Keyboard,
    Modal,
    Picker,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import {
    Appbar,
    Card,
    Colors,
    DefaultTheme,
    FAB,
    List,
    RadioButton,
    Searchbar,
    TextInput,
    Title
} from "react-native-paper";
import Config from "./common/Config";
import Services from "./common/Services";
import Utils from "./common/Utils";
import {CSpinner, LoadImages, LoadSVG, Styles} from "./common";
import OfflineNotice from './common/OfflineNotice';
import FontAwesome from "react-native-vector-icons/FontAwesome";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import AsyncStorage from "@react-native-community/async-storage";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import ImageZoom from "react-native-image-pan-zoom";
import _ from "lodash";
import MonthSelectorCalendar from "react-native-month-selector";


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

export class ReimbursementExpenses extends Component {

    newImagesArray = [];
    newImagesFormData = [];
    totalImagesCollection = [];
    deletedImagesCollection = [];

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
            page: 1,
            size: 10,
            isLoading: false,
            isRefreshing: false,
            refreshing: false,
            spinnerBool: false,
            categoryType: 'STATION',
            categoryTypeList: [],
            reimbursementTypeModal: false,
            reimbursementTypeList: [],
            reimbursementTypeValue: '',
            reimbursementTypeName: '',
            reimbursementSubTypeModal: false,
            reimbursementSubTypeList: [],
            reimbursementSubTypeValue: '',
            reimbursementSubTypeName: '',
            expenseType: 'Invoice',
            expenseTypeNumber: '',
            gstBill: true,
            expenseDate: new Date(),
            siteSelectionModal: false,
            sitesList: [],
            siteValue: '',
            siteName: '',
            bussinessUnitModal: false,
            bussinessUnitList: [],
            bussinessUnitValue: '',
            stateSelectionModal: false,
            statesList: [],
            stateSelectionName: '',
            imagePreview: false,
            imagePreviewURL: '',
            imageRotate: '0',
            expenseImageUrl: '',
            expenseImageFormData: '',
            description: '',
            merchantName: '',
            merchantPhoneNumber: '',
            createReimbursementModal: false,
            chipsList: [
                {status: 'PENDING', name: 'Pending', value: 2, show: true},
                {status: 'APPROVED', name: 'Approved', value: 1, show: true},
                {status: 'TOPAY', name: 'To Pay', value: 6, show: false},
                {status: 'PAID', name: 'Paid', value: 5, show: true},
                {status: 'REJECTED', name: 'Rejected', value: 4, show: true},
                {status: 'DELETED', name: 'Deleted', value: 3, show: false},
            ],
            expensesList: [],
            actualAmount: '',
            gstAmount: '',
            expenseOtherReason: '',
            reimbursementOtherReason: '',
            selectedExpense: [],
            showRejectUserModal: false,
            rejectReason: '',
            errorRejectReason: null,
            searchedSiteList: [],
            searchString: '',
            successModal: false,
            timer: 4,
            successMessage: '',
            successTicketNo: '',
            showSubCategory: false,
            showSelfExpenses: true,
            filtersModal: false,
            finalSiteId: '',
            finalRole: '',
            filterdSiteId: '',
            filterdRole: '',
            showUserReportsModal: false,
            userExpensesList: [],
            userExpensesTotalAmount: '',
            paidList: [],
            viewExpenseModal: false,
            toPayList: [],
            expenseSearchName: '',
            dateFilterModal: false,
            month: new Date().getMonth(),
            year: new Date().getFullYear(),
            paidDateSelection: new Date(),
            imageFileArray: [],
            showExpensesHistoryModal: false, imagesCollection: [],
            imageSelectionModal:false
        };
    }

    componentDidMount() {
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        })
        AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
            AsyncStorage.getItem('Whizzard:userId').then((userId) => {
                let tempRole = JSON.parse(userRole);
                // console.log('expense userId',userId,typeof(userId))
                let tempAccess = false
                if (userId === '5e3a417f80d0107b1eb86b0e') {
                    tempAccess = true
                }
                this.setState({
                    userRole: tempRole,
                    loggedUserId: userId,
                    specialAccess: tempAccess,
                }, () => {
                    // this.getSitesList()
                    // this.getStates()
                    // this.getBusinessUnits()
                    this.getExpensesList('PENDING', 1)
                })
            })
            // })
        });
    }

    componentDidUpdate() {
        if (this.state.timer === 1) {
            clearInterval(this.interval);
            // this.setState({successModal:false})
        }
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
        console.log('Reimbursement screen error', error, error.response)
        // error.response.data[0]
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
                Utils.dialogBox("Request Failed", '');
            }
        } else {
            self.setState({spinnerBool: false});
            Utils.dialogBox(error.message, '');
        }
    }

    getFilterRoles() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_EXPENSE_ROLES + self.state.selectedChip;
        const body = {};
        // console.log('get roles body', body,'apiUrl===',apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log("get filter roles resp200", response);
                    let tempResponse = []
                    tempResponse = response.data
                    // tempResponse.push({value: '', key: 'Select Role'})
                    // tempResponse.unshift(tempResponse.pop());
                    self.setState({rolesFilterList: tempResponse, spinnerBool: false, filtersModal: true})
                    self.getFilterSitesList()
                }
            }, function (error) {
                // console.log('get roles error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getFilterSitesList() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_EXPENSE_SITES + self.state.selectedChip;
        const body = {};
        // console.log('get sites body', body,'apiUrl===',apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log("filter sites list resp200", response);
                    let tempResponse = response.data
                    // tempResponse.push({id: '', siteLable: 'Select Site'})
                    // tempResponse.unshift(tempResponse.pop());
                    self.setState({sitesFilterList: tempResponse, spinnerBool: false,})
                }
            }, function (error) {
                // console.log('get sites error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getSitesList() {
        const self = this;
        // const apiUrl = Config.routes.BASE_URL + Config.routes.GET_SITES_DROPDOWN;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_SITES_LIST;
        const body = {};
        // console.log('get sites body', body,'apiUrl===',apiUrl);
        this.setState({spinnerBool: true}, () => {
            // Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log("expense sites resp200", response.data);
                    self.setState({sitesList: response.data, searchedSiteList: response.data, spinnerBool: false,})
                    self.getStates()    //to get states list to create
                }
            }, function (error) {
                // console.log('get sites error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getSitesDetails(siteId) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_SITES_DETAILS + siteId;
        const body = {};
        // console.log('get Sites Details body', body, 'apiUrl===', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log("get Sites Details resp200", response);
                    let tempData = response.data;
                    self.setState({
                        siteDetails: response.data,
                        stateSelectionName: tempData.state,
                        bussinessUnitValue: tempData.businessUnit,
                        cityValue: tempData.city, cityName: tempData.city,
                        clientValue: tempData.clientName + '(' + tempData.clientCode + ')',
                        clientName: tempData.clientName + tempData.clientCode,
                        spinnerBool: false,
                    })
                }
            }, function (error) {
                // console.log('get Sites Details error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getStates() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_ALL_STATES;
        const body = {};
        // console.log('get States body', body, 'apiUrl===', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("get States resp200", response);
                    self.setState({statesList: response.data, spinnerBool: false})
                    self.getBusinessUnits()    //to get bussiness units list to create
                }
            }, function (error) {
                // console.log('get States error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getBusinessUnits() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_ALL_BUSINESS_UNITS;
        const body = {};
        // console.log('get Business body', body, 'apiUrl===', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log("get Business resp200", response);
                    self.setState({bussinessUnitList: response.data, spinnerBool: false})
                    self.getReimbursementTypes('Station', true)
                }
            }, function (error) {
                // console.log('get Business error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getReimbursementTypes(type, canUpdateCheck) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_REIMBURSEMENT_TYPES + type;
        const body = {};
        // console.log('get Reimbursement Types body', body,'apiUrl===',apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log("types resp200", response.data);
                    if (canUpdateCheck) {
                        self.setState({
                            reimbursementTypeList: response.data,
                            spinnerBool: false,
                            reimbursementTypeModal: false,
                            reimbursementTypeValue: '',
                            reimbursementTypeName: '',
                            reimbursementSubTypeModal: false,
                            reimbursementSubTypeValue: '',
                            reimbursementSubTypeName: '',
                            reimbursementOtherReason: '',
                            expenseOtherReason: ''
                        })
                    } else {
                        self.setState({
                            reimbursementTypeList: response.data,
                            spinnerBool: false
                        })
                    }
                }
            }, function (error) {
                // console.log('get Reimbursement Types error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getReimbursementSubTypes(type) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_EXPENSES_TYPES + type + '/' + self.state.categoryType;
        const body = {};
        // console.log('get Reimbursement sub-Types body', body,'apiUrl===',apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log("sub-types resp200", response.data);
                    self.setState({
                        reimbursementSubTypeList: response.data,
                        showSubCategory: response.data.length > 0,
                        spinnerBool: false, reimbursementSubTypeModal: false,
                        // reimbursementSubTypeValue: '', reimbursementSubTypeName: '', expenseOtherReason: '',
                    })
                }
            }, function (error) {
                // console.log('get Reimbursement sub-Types error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };


    formValidation() {
        let resp = {};
        let result = {};

        if (this.state.categoryType === 'CENTRAL' || this.state.categoryType === "central") {
            resp = Utils.checkIsValueEmpty(this.state.bussinessUnitValue, 'Select Bussiness Unit');
            if (resp.status === true) {
                resp = Utils.checkIsValueEmpty(this.state.stateSelectionName, 'Select State');
                if (resp.status === true) {
                    this.reimbursementValidation()
                } else {
                    Utils.dialogBox(resp.message, '');
                }
            } else {
                Utils.dialogBox(resp.message, '');
            }
        } else {
            resp = Utils.checkIsValueEmpty(this.state.siteValue, 'Select Station Code');
            if (resp.status === true) {
                this.reimbursementValidation()
            } else {
                Utils.dialogBox(resp.message, '');
            }
        }
    }

    reimbursementValidation() {
        let resp = {}

        resp = Utils.checkIsValueEmpty(this.state.reimbursementTypeValue, 'Select Expense Category');
        if (resp.status === true) {

            if (_.startCase(_.toLower(this.state.reimbursementTypeValue)) === 'Other' || _.startCase(_.toLower(this.state.reimbursementTypeValue)) === 'Others') {
                resp = Utils.checkIsValidReason(this.state.reimbursementOtherReason, 'Expense Reason');
                if (resp.status === true) {
                    this.expenseValidation()
                } else {
                    Utils.dialogBox(resp.message, '');
                }
            } else {
                this.expenseValidation()
            }
        } else {
            Utils.dialogBox(resp.message, '');
        }
    }

    expenseValidation() {
        let resp = {}

        resp = Utils.checkIsValueEmpty(this.state.reimbursementSubTypeValue || this.state.reimbursementSubTypeList.length === 0, 'Select Expense Sub-Category');
        if (resp.status === true) {
            if (_.startCase(_.toLower(this.state.reimbursementSubTypeValue)) === 'Other' || _.startCase(_.toLower(this.state.reimbursementSubTypeValue)) === 'Others') {
                resp = Utils.checkIsValidReason(this.state.expenseOtherReason, 'Expense Sub-Category Reason');
                if (resp.status === true) {
                    this.secondFormValidaions()
                } else {
                    Utils.dialogBox(resp.message, '');
                }
            } else {
                this.secondFormValidaions()
            }
        } else {
            Utils.dialogBox(resp.message, '');
        }
    }

    secondFormValidaions() {
        let resp = {};
        let result = {};

        resp = Utils.checkIsValueEmpty(this.state.reimbursementTypeValue, 'Select Expense Category');
        if (resp.status === true) {
            resp = Utils.checkIsValueEmpty(this.state.reimbursementSubTypeValue || this.state.reimbursementSubTypeList.length === 0, 'Select Expense Sub-Category');
            if (resp.status === true) {
                resp = Utils.checkIsValidReason(this.state.description, 'Description');
                if (resp.status === true) {
                    resp = Utils.checkIsValidReason(this.state.merchantName, 'Merchant Name');
                    if (resp.status === true) {
                        resp = Utils.checkIsValueNULL(this.state.expenseTypeNumber, this.state.expenseType + 'Number');
                        if (resp.status === true) {


                            if (this.state.gstBill === true) {
                                resp = Utils.checkIsValueNULL(this.state.actualAmount, 'Actual Amount');
                                if (resp.status === true) {
                                    resp = Utils.checkIsValueNULL(this.state.gstAmount, 'GST Amount');
                                    if (resp.status === true) {
                                        this.thirdFormValidations()
                                    } else {
                                        Utils.dialogBox(resp.message, '');
                                    }
                                } else {
                                    Utils.dialogBox(resp.message, '');
                                }
                            } else {
                                resp = Utils.checkIsValueNULL(this.state.totalAmount, 'Total Amount')
                                if (resp.status === true) {

                                    this.thirdFormValidations()

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

    thirdFormValidations() {
        let resp = {};
        // totalAmount

        // resp = Utils.checkIsValueEmpty(this.state.expenseImageUrl, 'Please Upload Expense Image');
        resp = Utils.checkIsValueEmpty(this.state.imagesCollection.length > 0, 'Please Upload Expense Image');
        if (resp.status === true) {
            if (this.state.merchantPhoneNumber) {
                resp = Utils.checkIsValidMobileNumber(this.state.merchantPhoneNumber, 'of Merchant');
                if (resp.status === true) {
                    this.createExpenseRequest()
                } else {
                    Utils.dialogBox(resp.message, '');
                }
            } else {
                this.createExpenseRequest()
            }
        } else {
            Utils.dialogBox(resp.message, '');
        }
    }

    createExpenseRequest() {
        const self = this;
        let tempExpense = self.state.reimbursementSubTypeList.length === 0 ? '' : self.state.reimbursementSubTypeValue;
        let tempData = '?siteId=' + self.state.siteValue + '&expenseDate=' + Services.returnCalendarFormat(self.state.expenseDate)
            + '&category=' + self.state.categoryType + '&reimbursementType=' + self.state.reimbursementTypeValue
            + '&expenseType=' + tempExpense
            + '&description=' + self.state.description
            + '&totalAmount=' + self.state.totalAmount
            + '&preGstAmount=' + self.state.actualAmount + '&gstAmount=' + self.state.gstAmount
            + '&merchantName=' + self.state.merchantName + '&merchantMobile=' + self.state.merchantPhoneNumber + '&invoiceOrVoucherNo=' + self.state.expenseTypeNumber
            // +'&receiptType='+self.state.expenseType
            + '&gst=' + this.state.gstBill
            // + 'siteName='+self.state.siteName
            // + '&reimbursementTypeName='+self.state.reimbursementSubTypeName
            // + '&expenseTypeName='+ self.state.reimbursementSubTypeName
            + '&businessUnit=' + self.state.bussinessUnitValue
            + '&state=' + self.state.stateSelectionName
            + '&expenseReason=' + self.state.expenseOtherReason
            + '&reimbursementReason=' + self.state.reimbursementOtherReason
            + '&fileName=' + self.state.finalFileName
            + '&filePath=' + self.state.finalFilePath
            + '&contentType=' + self.state.finalContentType

        let apiUrl;
        if (self.state.selectedButton === 'CREATE') {
            apiUrl = Config.routes.BASE_URL + Config.routes.ADD_EXPENSES + tempData
        } else {
            apiUrl = Config.routes.BASE_URL + Config.routes.EDIT_EXPENSE + self.state.expenseId + tempData
        }
        // let body = self.state.expenseImageFormData
        let body = {}
        // console.log('create expense body', body, 'apiUrl===', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("create Expense Request resp200", response);

                    self.setState({
                        spinnerBool: false,
                        selectedExpense: response.data
                    }, () => {
                        if (self.newImagesFormData.length > 0 || self.deletedImagesCollection.length > 0) {
                            self.checkImagesUpload()
                        } else {
                            self.finishCreatedExpense()
                        }
                    })
                }
            }, function (error) {
                // console.log('create Expense Request error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    finishCreatedExpense() {
        // console.log('final created Fun entered')
        const self = this;
        let selectedExpense = self.state.selectedExpense

        let tempMessage;
        if (self.state.selectedButton === 'CREATE') {
            tempMessage = 'Created Successfully'
            // Utils.dialogBox('Created Successfully', '');
        } else {
            tempMessage = 'Updated Successfully'
            // Utils.dialogBox('Updated Successfully', '');
        }

        self.setState({
            spinnerBool: false,
            selectedExpense: selectedExpense,
            expenseId: selectedExpense.id,
            createReimbursementModal: false,
            successModal: true,
            successMessage: tempMessage,
            successTicketNo: selectedExpense.expenseNumber,
            filtersSelected: false, finalSiteId: '', finalRole: '',filterSiteId: '',filterRoleId: '',
        }, () => {
            self.state.selectedChip === 'DELETED' || self.state.selectedChip === 'REJECTED'
                ?
                self.getExpensesList(self.state.selectedChip, 1)
                :
                self.getExpensesList('PENDING', 1)
        })
    }

    checkImagesUpload() {
        let tempList = this.newImagesFormData
        let deletedList = this.deletedImagesCollection
        // console.log('check Images upload',tempList,'===>length==>',tempList.length);
        // console.log('check deletedList',deletedList,'===>length==>',deletedList.length);
        if (tempList.length > 0) {
            this.sendNewImages(tempList[0])
        } else if (deletedList.length > 0) {
            this.deleteOldImages(deletedList[0])
        } else {
            this.finishCreatedExpense()
        }
    }

    sendNewImages(formData) {
        const self = this;
        let apiURL = Config.routes.BASE_URL + Config.routes.EXTRA_EXPENSE_IMAGE_UPLOAD + self.state.selectedExpense.id;
        const body = formData;
        // console.log('send new image upload url', apiURL, 'body===', body)
        self.setState({spinnerBool: true}, () => {
            Services.AuthProfileHTTPRequest(apiURL, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log('send new image upload resp200', response)
                    self.newImagesFormData.shift()
                    // console.log('inside image check data',self.newImagesFormData,'length==>',self.newImagesFormData.length);
                    self.setState({
                        spinnerBool: false,
                    }, () => {
                        self.checkImagesUpload()
                    })
                }
            }, function (error) {
                // console.log("send new img error", error.response, error);
                self.errorHandling(error)
            });
        });
    }

    deleteOldImages(data) {
        const self = this
        let apiURL = Config.routes.BASE_URL + Config.routes.DELETE_EXPENSE_IMAGE + '&filePath=' + data[0].filePath + '&expenseId=' + self.state.selectedExpense.id;
        const body = {};
        // console.log('OLD image delete url', apiURL, 'body===', body)
        self.setState({spinnerBool: true}, () => {
            Services.AuthDeleteImageHTTPRequest(apiURL, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log('OLD delete resp200', response)
                    self.deletedImagesCollection.shift()
                    // console.log('inside image delete data',self.deletedImagesCollection,'length==>',self.deletedImagesCollection.length);
                    self.setState({
                        spinnerBool: false,
                    }, () => {
                        self.checkImagesUpload()
                    })
                }
            }, function (error) {
                // console.log("delete error", error.response, error);
                self.errorHandling(error)
            });
        });
    }

    approveExpense(type) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.UPDATE_EXPENSE;
        const body = {
            // status:"approve",
            status: type,
            id: self.state.expenseId,
            reason: self.state.rejectReason
        };
        // console.log('approve Expense body', body, 'apiUrl===', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'PUT', body, function (response) {
                if (response.status === 200) {
                    // console.log("approve Expense resp200", response);
                    let temp = type === 'APPROVE' ? 'APPROVED' : type === 'DELETE' ? 'DELETED'
                        : type === 'REJECT' ? 'REJECTED' : type === 'PAID' ? 'PAID' : type === 'REVERT' ? 'REVERTED' : 'PENDING'
                    {
                        type === 'APPROVE' || type === 'PAID' || type === 'REVERT'
                            ?
                            null
                            :
                            Utils.dialogBox(temp + ' Successfully', '');
                    }

                    let tempMessage = temp + ' Successfully'
                    self.setState({
                        spinnerBool: false,
                        createReimbursementModal: false,
                        showRejectUserModal: false,
                        rejectReason: '',
                        successModal: type === 'APPROVE' || type === 'PAID' || type === 'REVERT',
                        successMessage: tempMessage,
                        successTicketNo: self.state.selectedExpense.expenseNumber,
                        filtersSelected: false, finalSiteId: '', finalRole: '',filterSiteId: '',filterRoleId: '',
                    }, () => {
                        type === 'PAID'
                            ?
                            self.getPaidExpenseList()
                            :
                            type === 'REVERT'
                                ?
                                self.getExpensesList('PENDING', 1)
                                :
                                type === 'APPROVE' && self.state.userRole === 27
                                    ?
                                    self.getToPayExpenseList()
                                    :
                                    self.getExpensesList(temp, 1)
                        // self.getPaidExpenseList()
                    })
                }
            }, function (error) {
                // console.log('approve Expense error', error, error.response, error.response.data);
                self.errorHandling(error)
                // Utils.dialogBox(error.response.data[0],'')
            })
        })
    };

    toPayUserExpense(type) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.UPDATE_TO_PAY_EXPENSE + self.state.toPayUserId;
        const body = {
            //  status: type,
            // id: self.state.expenseId,
            // reason: self.state.rejectReason
        };
        // console.log('to pay Expense body', body, 'apiUrl===', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("to pay Expense resp200", response);

                    let tempMessage = type + ' Successfully'
                    self.setState({
                        spinnerBool: false,
                        createReimbursementModal: false,
                        viewExpenseModal: false,
                        showUserReportsModal: false,
                        successModal: type === 'PAID',
                        successMessage: tempMessage,
                        successTicketNo: '',
                        filtersSelected: false, finalSiteId: '', finalRole: '',filterSiteId: '',filterRoleId: '',
                    }, () => {
                        type === 'PAID'
                            ?
                            self.getPaidExpenseList()
                            :
                            null
                    })
                }
            }, function (error) {
                // console.log('to pay Expense error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getExpensesList(status, pageNo) {
        const {expensesList, page} = this.state;
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_CREATED_EXPENSES_LIST + status;
        const body = {
            page: pageNo,
            size: 20,
            self: self.state.showSelfExpenses,
            siteIds: this.state.finalSiteId ? [this.state.finalSiteId] : [],
            roles: this.state.finalRole ? [this.state.finalRole] : [],
            userName: self.state.expenseSearchName
        };
        // console.log('get Expenses List body', body, 'apiUrl===', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("get Expenses List resp200", response.data.content);
                    self.setState({
                        // expensesList: response.data.content,
                        selectedChip: status,
                        expensesList: pageNo === 1 ? response.data.content : [...expensesList, ...response.data.content],
                        totalPages: response.data.totalPages,
                        isRefreshing: false,
                        spinnerBool: false,
                        page: pageNo
                    })
                }
            }, function (error) {
                self.setState({expensesList: []})
                // console.log('get Expenses List error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getExpenseDetails(expenseId) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_EXPENSES_DETAILS + expenseId;
        const body = {};
        // console.log('get Expenses Details body', body, 'apiUrl===', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log("get Expenses Details resp200", response.data);
                    self.assignPendingValues(response.data)
                    self.setState({
                        expenseDetails: response.data,
                        spinnerBool: false
                    })
                }
            }, function (error) {
                // console.log('get Expenses Details error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    handleLoadMore = () => {
        // console.log("handleLoadMore page", this.state.page);
        this.state.page < this.state.totalPages ?
            this.setState({
                page: this.state.page + 1
            }, () => {
                this.getExpensesList(this.state.selectedChip, this.state.page);
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
            this.getExpensesList(this.state.selectedChip, 1);
        });
    };

    getPaidMonthlyReport(userId) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_MONTHLY_USER_REPORT + userId;
        const body = {
            month: Services.returnCalendarMonthYearNumber(new Date(self.state.paidDateSelection))
        };
        // console.log('get Monthly Report body', body, 'apiUrl===', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("get Monthly Report resp200", response.data);
                    self.setState({
                        spinnerBool: false,
                        showUserReportsModal: true,
                        userExpensesList: response.data.expenses,
                        userExpensesTotalAmount: response.data.totalAmount,
                        toPayUserId: userId
                    })
                }
            }, function (error) {
                // console.log('get Monthly Report error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getToPayMonthlyReport(userId) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_TO_PAY_MONTHLY_USER_REPORT + userId;
        const body = {};
        // console.log('get to Pay Monthly Report body', body, 'apiUrl===', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("get to pay Monthly Report resp200", response.data);
                    self.setState({
                        spinnerBool: false,
                        showUserReportsModal: true,
                        userExpensesList: response.data.expenses,
                        userExpensesTotalAmount: response.data.totalAmount,
                        toPayUserId: userId
                    })
                }
            }, function (error) {
                // console.log('get to pay Monthly Report error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getPaidExpenseList() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_PAID_EXPENSE_LIST;
        const body = {
            self: self.state.showSelfExpenses,
            siteIds: this.state.finalSiteId ? [this.state.finalSiteId] : [],
            roles: this.state.finalRole ? [this.state.finalRole] : [],
            userName: self.state.expenseSearchName,
            month: Services.returnCalendarMonthYearNumber(new Date(self.state.paidDateSelection))
        }
        // console.log('get Paid Expense List body', body, 'apiUrl===', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("get Paid Expense List resp200", response.data);
                    self.setState({
                        spinnerBool: false,
                        selectedChip: 'PAID',
                        paidList: response.data,
                        viewExpenseModal: false
                    })
                }
            }, function (error) {
                // console.log('get Paid Expense List error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getToPayExpenseList() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_TO_PAY_EXPENSE_LIST;
        const body = {
            self: self.state.showSelfExpenses,
            siteIds: this.state.finalSiteId ? [this.state.finalSiteId] : [],
            roles: this.state.finalRole ? [this.state.finalRole] : [],
            userName: self.state.expenseSearchName
        }
        // console.log('get To Pay Expense List body', body, 'apiUrl===', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("get To Pay Expense List resp200", response.data);
                    self.setState({
                        spinnerBool: false,
                        selectedChip: 'TOPAY',
                        toPayList: response.data,
                        paidList: response.data
                    })
                }
            }, function (error) {
                // console.log('get To Pay Expense List error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    assignPendingValues(list) {
        // console.log('can update list data', list);
        // let tempStatusCheck = !(list.status === "APPROVED" || list.status === "PAID" || this.state.loggedUserId !== list.attrs.createdUserId)
        let tempStatusCheck = !(list.status === "APPROVED" || list.status === "PAID" || this.state.loggedUserId !== list.createdBy)
        this.setState({
            categoryType: _.startCase(_.toUpper(list.category)),
            reimbursementTypeValue: list.reimbursementType, reimbursementTypeName: list.reimbursementTypeName,
            reimbursementSubTypeValue: list.expenseType,
            expenseTypeNumber: list.invoiceOrVoucherNo,
            // gstBill:list.isGst,
            gstBill: list.gst,
            totalAmount: JSON.stringify(list.totalAmount),
            expenseDate: new Date(list.expenseDate),
            siteValue: list.siteId,
            // siteName: list.attrs.siteName,
            siteName: list.siteDetails.siteName,
            // bussinessUnitValue: list.businessUnit,
            bussinessUnitValue: list.category === 'CENTRAL' ? list.businessUnit : list.siteDetails.businessUnit,
            // stateSelectionName: list.state,
            stateSelectionName: list.category === 'CENTRAL' ? list.state : list.siteDetails.state,

            // expenseImageUrl: list.attrs.expenseDoc1Url, expenseImageFormData: list.expenseFileUploadDetails,
            // expenseImageUrl: list.expenseFileUploadDetails[0].expenseDocUrl,
            // expenseImageFormData: list.expenseFileUploadDetails[0],
            description: list.description,
            merchantName: list.merchantName, merchantPhoneNumber: list.merchantMobile,
            expenseOtherReason: list.expenseReason,
            reimbursementOtherReason: list.reimbursementReason,
            actualAmount: JSON.stringify(list.preGstAmount),
            gstAmount: JSON.stringify(list.gstAmount),
            status: list.status,
            expenseId: list.id,
            createReimbursementModal: true,
            selectedExpense: list,
            // canEditTextInput:tempStatusCheck ,
            // canEditTextInput: list.canEdit && this.state.loggedUserId === list.attrs.createdUserId,
            canEditTextInput: list.canEdit && this.state.loggedUserId === list.createdBy,
            // sameUser: this.state.loggedUserId === list.attrs.createdUserId,
            sameUser: this.state.loggedUserId === list.createdBy,
            ticketNo: list.expenseNumber,
            finalFileName: '',
            finalFilePath: '',
            finalContentType: '',
            // otherExpenseImageUrl: list.attrs.expenseDoc2Url,
            // otherExpenseImageFormData: '',
            showSubCategory: !!list.expenseType,
            expenseCreatedName: list.siteDetails.createdBy,
            expenseCreatedRole: list.siteDetails.createdUserRole,
            imagesCollection: list.expenseFileUploadDetails,
        }, () => {
            this.newImagesArray = [];
            this.newImagesFormData = [];
            this.totalImagesCollection = list.expenseFileUploadDetails;
            {
                _.startCase(_.toUpper(list.category)) === 'STATION'
                    ?
                    this.getSitesDetails(list.siteId)
                    :
                    null
            }

            {
                tempStatusCheck
                    ?
                    this.getReimbursementTypes(list.category, false)
                    :
                    null
            }
            {
                tempStatusCheck
                    ?
                    this.getReimbursementSubTypes(list.reimbursementType)
                    :
                    null
            }
        })
    }

    assignNewValues() {
        this.setState({
            categoryType: 'STATION',
            reimbursementTypeValue: '', reimbursementTypeName: '',
            reimbursementSubTypeValue: '', reimbursementSubTypeName: '',
            expenseType: 'Invoice', expenseTypeNumber: '', gstBill: true,
            totalAmount: '',
            expenseDate: new Date(),
            siteValue: '', siteName: '',
            bussinessUnitValue: '',
            stateSelectionName: '',
            expenseImageUrl: '', expenseImageFormData: '',
            description: '', merchantName: '', merchantPhoneNumber: '',
            expenseOtherReason: '',
            reimbursementOtherReason: '',
            actualAmount: '',
            gstAmount: '',
            status: 'NEW',
            createReimbursementModal: true,
            canEditTextInput: true,
            sameUser: true,
            ticketNo: '',
            finalFileName: '',
            finalFilePath: '',
            finalContentType: '',
            otherExpenseImageUrl: '',
            otherExpenseImageFormData: '',
            showSubCategory: false,
            selectedExpense: [],
            imagesCollection: [],
        }, () => {
            this.newImagesArray = [];
            this.newImagesFormData = [];
            this.totalImagesCollection = [];
            this.getSitesList()  //to get sites list to create
        })
    }

    assignNonEditableValues(list) {
        // console.log('non-editable list data', list);
        this.setState({
            categoryType: _.startCase(_.toUpper(list.category)),
            reimbursementTypeValue: list.reimbursementType,
            reimbursementOtherReason: list.reimbursementReason,
            reimbursementSubTypeValue: list.expenseType,
            expenseOtherReason: list.expenseReason,
            expenseTypeNumber: list.invoiceOrVoucherNo,
            gstBill: list.gst,
            totalAmount: JSON.stringify(list.totalAmount),
            expenseDate: new Date(list.expenseDate),
            siteValue: list.category === 'CENTRAL' ? " " : list.siteDetails.siteId,
            siteName: list.category === 'CENTRAL' ? " " : list.siteDetails.siteName,
            clientValue: list.category === 'CENTRAL' ? " " : list.siteDetails.clientName,
            clientName: list.category === 'CENTRAL' ? " " : list.siteDetails.clientName,
            bussinessUnitValue: list.category === 'CENTRAL' ? list.businessUnit : list.siteDetails.businessUnit,
            cityValue: list.category === 'CENTRAL' ? " " : list.siteDetails.city,
            stateSelectionName: list.category === 'CENTRAL' ? list.state : list.siteDetails.state,
            // expenseImageUrl: list.expenseFileUploadDetails.expenseDoc1Url,
            // expenseImageUrl: list.expenseFileUploadDetails[0].expenseDocUrl,
            // otherExpenseImageUrl: list.expenseSecondFileUploadDetails ? list.expenseSecondFileUploadDetails.expenseDoc2Url : '',
            description: list.description,
            merchantName: list.merchantName,
            merchantPhoneNumber: list.merchantMobile,


            actualAmount: JSON.stringify(list.preGstAmount),
            gstAmount: JSON.stringify(list.gstAmount),
            status: list.status,
            expenseId: list.id,
            selectedExpense: list,
            // canEditTextInput:tempStatusCheck ,
            // canEditTextInput: list.canEdit && this.state.loggedUserId === list.attrs.createdUserId,
            canEditTextInput: list.canEdit && this.state.loggedUserId === list.createdBy,
            // sameUser: this.state.loggedUserId === list.attrs.createdUserId,
            sameUser: this.state.loggedUserId === list.createdBy,
            ticketNo: list.expenseNumber,
            showSubCategory: !!list.expenseType,
            createReimbursementModal: true,
            expenseCreatedName:list.siteDetails ? list.siteDetails.createdBy : '',
            expenseCreatedRole:list.siteDetails ? list.siteDetails.createdUserRole : '',
            imagesCollection: list.expenseFileUploadDetails,
        }, () => {
            this.newImagesArray = [];
            this.newImagesFormData = [];
            this.totalImagesCollection = list.expenseFileUploadDetails;
        })
    }

    searchSite = (searchData) => {
        if (searchData) {
            let filteredData = this.state.sitesList.filter(function (item) {
                // let tempName = item.name;
                let tempName = item.attrs.siteLable;
                return tempName.toUpperCase().includes(searchData.toUpperCase());
            });
            this.setState({searchedSiteList: filteredData, searchString: searchData});
        } else {
            this.setState({searchedSiteList: this.state.sitesList, searchString: searchData})
        }
    }

    returnActionedUserDetails(item) {
        let selectedChip = this.state.selectedChip
        return (
            <View style={[Styles.row]}>
                <Text
                    style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue,]}>{selectedChip === 'PENDING' ? 'Created' : selectedChip === 'TOPAY' ? 'Approved' : _.startCase(_.toLower(selectedChip))}  </Text>
                {
                    selectedChip === 'DELETED' && item.attrs.deletedAt
                        ?
                        <Text
                            style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.pBtm5]}>{Services.returnDateMonthYearFormat(item.attrs.deletedAt)}</Text>
                        :
                        selectedChip === 'REJECTED' && item.attrs.rejectedAt
                            ?
                            <Text
                                style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.pBtm5]}>{Services.returnDateMonthYearFormat(item.attrs.rejectedAt)}</Text>
                            :
                            selectedChip === 'PAID' && item.attrs.paidAt
                                ?
                                <Text
                                    style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.pBtm5]}>{Services.returnDateMonthYearFormat(item.attrs.paidAt)}</Text>
                                :
                                (selectedChip === 'APPROVED' || selectedChip === 'TOPAY') && item.attrs.approvedAt
                                    ?
                                    <Text
                                        style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.pBtm5]}>{Services.returnDateMonthYearFormat(item.attrs.approvedAt)}</Text>
                                    :
                                    selectedChip === 'PENDING' && item.attrs.createdAt
                                        ?
                                        <Text
                                            style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.pBtm5]}>{Services.returnDateMonthYearFormat(item.attrs.createdAt)}</Text>
                                        :
                                        <Text
                                            style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.pBtm5]}>{Services.returnDateMonthYearFormat(new Date())}</Text>
                }
            </View>
        )
    }


    datePicker() {
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
                    self.setState({expenseDate: tempDate})
                }
            });
        } catch ({code, message}) {
            console.warn('Cannot open date picker', message);
        }
    }



    imageUpload(uploadType) {
        const self = this;
        const type = self.state.imageType;
        Services.checkImageUploadPermissions(uploadType, (response) => {
            // console.log('service image retunr', response);
            let image = response.image
            let formData = response.formData
            let userImageUrl = image.path

                    let sampleImageData = {}
                    sampleImageData.expenseDocUrl = image.path
                    sampleImageData.fileContentType = image.mime
                    sampleImageData.fileName = image.path
                    sampleImageData.filePath = image.path
                    sampleImageData.temporary = true

                    // console.log(' postImages imagas formData', formData)

                    if (type === 'EXPENSE_IMAGE' || type === 'INITIAL') {
                        let tempList = this.state.imagesCollection
                        this.newImagesArray.push(sampleImageData);
                        this.newImagesFormData.push(formData);
                        tempList.push(sampleImageData)

                        self.setState({
                            spinnerBool: false,
                            imagesCollection: tempList
                        }, () => {
                            Utils.dialogBox("Image Uploaded", '')
                        })
                    } else if (type === 'OTHER_EXPENSE_IMAGE' || type === 'THIRD_EXPENSE' || type === 'FOURTH_EXPENSE' || type === 'FIFTH_EXPENSE') {
                        let apiURL = Config.routes.BASE_URL + Config.routes.EXTRA_EXPENSE_IMAGE_UPLOAD + self.state.selectedExpense.id;
                        const body = formData;
                        // console.log(' image upload url', apiURL, 'body===', body)
                        self.setState({spinnerBool: true}, () => {
                            Services.AuthProfileHTTPRequest(apiURL, 'POST', body, function (response) {
                                if (response.status === 200) {
                                    // console.log('image upload resp200', response)
                                    self.setState({
                                        ImageData: image, spinnerBool: false,
                                        // otherExpenseImageUrl: image.path,
                                        otherExpenseImageFormData: formData,
                                        finalFileName: response.data.fileName,
                                        finalFilePath: response.data.filePath,
                                        finalContentType: response.data.fileContentType,
                                    })
                                    if (type === 'THIRD_EXPENSE') {
                                        self.setState({thirdExpenseURL: image.path})
                                    } else if (type === 'FOURTH_EXPENSE') {
                                        self.setState({fourthExpenseURL: image.path})
                                    } else if (type === 'FIFTH_EXPENSE') {
                                        self.setState({fifthExpenseURL: image.path})
                                    } else {
                                        self.setState({otherExpenseImageUrl: image.path})
                                    }
                                }
                            }, function (error) {
                                // console.log("img error", error.response, error);
                                self.errorHandling(error)
                            });
                        });
                    }
        })
    }


    deleteExpenseImage(filePath, expenseId, index) {
        const self = this
        let apiURL = Config.routes.BASE_URL + Config.routes.DELETE_EXPENSE_IMAGE + '&filePath=' + filePath + '&expenseId=' + expenseId;
        const body = {};
        // console.log(' image delete url', apiURL, 'body===', body)
        self.setState({spinnerBool: true}, () => {
            Services.AuthDeleteImageHTTPRequest(apiURL, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log('delete upload resp200', response)
                    let removed = self.state.imagesCollection.splice(index, 1)
                    // self.deletedImagesCollection = removed
                    self.setState({
                        // picUploaded: false,
                        // expenseImageUrl: '',
                        // expenseImageFormData: '',
                        spinnerBool: false,
                    })
                }
            }, function (error) {
                // console.log("delete error", error.response, error);
                self.errorHandling(error)
            });
        });
    }

    removeImages(filePath, expenseId, index) {
        // console.log('remove image fun start')
        const self = this
        // console.log('imagesCollection start',self.state.imagesCollection)
        // console.log('newImagesFormData start',self.newImagesFormData,self.newImagesArray)
        if (self.state.imagesCollection[index].temporary) {
            self.state.imagesCollection.splice(index, 1)
            // if (self.newImagesFormData)
            for (let i = 0; i < self.newImagesArray.length; i++) {
                // console.log('inside loop formDAta filepath',self.newImagesArray[i].filePath)
                // console.log('inside loop delete filepath',filePath)
                if (self.newImagesArray[i].filePath === filePath) {
                    self.newImagesArray.splice(i, 1)
                    self.newImagesFormData.splice(i, 1)
                }
            }
            // console.log('newImagesFormData END',self.newImagesFormData,self.newImagesArray)
            self.setState({imagesCollection: self.state.imagesCollection})
        } else {
            let tempRemoved = self.state.imagesCollection.splice(index, 1)

            self.deletedImagesCollection.push(tempRemoved)
            // console.log('imagesCollection',self.state.imagesCollection)
            // console.log('removed',tempRemoved);
            // console.log('Total deletedImagesCollection',self.deletedImagesCollection);
            self.setState({imagesCollection: self.state.imagesCollection})
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

    render() {
        const {
            expensesList, status, userRole, selectedExpense, canEditTextInput, loggedUserId,
            sameUser, specialAccess, showSubCategory, selectedChip, showSelfExpenses, paidList, toPayList,
            imagesCollection
        } = this.state;
        return (
            <View style={[Styles.flex1, Styles.bgDWhite]}>
                {this.renderSpinner()}
                <OfflineNotice/>
                <Appbar.Header theme={theme} style={[Styles.bgDarkRed]}>
                    {/*<Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>*/}
                    <Appbar.Action icon="menu" size={30} onPress={() => {
                        this.props.navigation.openDrawer();
                    }}/>
                    <Appbar.Content title="Expenses" titleStyle={[Styles.ffLBlack]}/>
                    {
                       selectedChip === 'DELETED' || this.state.userRole === 30 || (this.state.userRole === 45 && this.state.specialAccess === false )
                            ?
                            null
                            :
                            <View
                                style={[Styles.bgDarkRed, Styles.aslCenter, Styles.padV5, Styles.padH10, Styles.row, Styles.br25,]}>
                                <Text
                                    style={[Styles.ffLBlack, Styles.f16, Styles.aslCenter, Styles.cWhite]}>Others</Text>
                                <MaterialCommunityIcons name={showSelfExpenses ? "toggle-switch" : "toggle-switch-off"}
                                                        size={40} color="#fff" style={[Styles.padH5]}
                                                        onPress={() => {
                                                            this.setState({showSelfExpenses: !showSelfExpenses}, () => {
                                                                selectedChip === 'TOPAY'
                                                                    ?
                                                                    // this.getToPayExpenseList()
                                                                    this.getExpensesList('APPROVED', 1)
                                                                    :
                                                                selectedChip === 'PAID'
                                                                    ?
                                                                    this.getPaidExpenseList()
                                                                    :
                                                                    (selectedChip === 'APPROVED' && this.state.userRole === 27)
                                                                ? this.getToPayExpenseList()
                                                                        :
                                                                    this.getExpensesList(selectedChip, 1)
                                                            })
                                                        }}/>
                                <Text style={[Styles.ffLBlack, Styles.f16, Styles.aslCenter, Styles.cWhite]}>Self</Text>
                            </View>
                    }
                </Appbar.Header>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: 10
                }}>
                    {/* CHIPS SECTION */}
                    <ScrollView horizontal={true}
                                showsHorizontalScrollIndicator={false}
                                style={[Styles.row]}>
                        {this.state.chipsList.map((chipsList, index) => {
                            // chipsList: [
                            //     {status: 'PENDING', name: 'Pending', value: 2, show: true},
                            //     {status: 'APPROVED', name: 'Approved', value: 1, show: true},
                            //     {status: 'TOPAY', name: 'To Pay', value: 6, show: false},
                            //     {status: 'PAID', name: 'Paid', value: 5, show: true},
                            //     {status: 'REJECTED', name: 'Rejected', value: 4, show: true},
                            //     {status: 'DELETED', name: 'Deleted', value: 3, show: false},
                            // ],

                            if (
                                (chipsList.status === 'PENDING') || (chipsList.status === 'REJECTED') || (chipsList.status === 'DELETED' && showSelfExpenses)
                                || (this.state.userRole === 27 ? (showSelfExpenses ?  chipsList.status === 'APPROVED' : chipsList.status === 'TOPAY') : chipsList.status === 'APPROVED')
                                || (chipsList.status === 'PAID')
                                // || (chipsList.status === 'TOPAY')
                                // (chipsList.status === 'TOPAY' && this.state.userRole === 27)
                                // || (chipsList.status === 'DELETED' && showSelfExpenses)
                                // || (this.state.userRole === 27 ? chipsList.status !== 'APPROVED' : chipsList.show)
                                // || (chipsList.show)
                            ) {
                                return (
                                    <View key={index}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({
                                                    selectedChip: chipsList.status,
                                                    filtersSelected: false, finalSiteId: '', finalRole: '',filterSiteId: '',filterRoleId: '',
                                                    // expenseSearchName:''
                                                }, () => {
                                                    chipsList.status === 'TOPAY'
                                                        ?
                                                        this.getToPayExpenseList()
                                                        :
                                                        chipsList.status === 'PAID'
                                                            ?
                                                            this.getPaidExpenseList()
                                                            :
                                                            this.getExpensesList(chipsList.status, 1)
                                                })
                                            }}
                                            activeOpacity={0.7}
                                            style={[Styles.row, Styles.aslCenter, Styles.p5, Styles.m3, Styles.OrdersScreenCardshadow, {
                                                // backgroundColor: this.state.selectedChip === chipsList.status ? Services.getExpensesStatus(chipsList.status) : '#808080',
                                            }]}>
                                            <Text
                                                style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.padH5, {
                                                    color: this.state.selectedChip === chipsList.status ? Services.getExpensesStatus(chipsList.status) : '#233167',
                                                }]}>{chipsList.name}</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            }
                        })
                        }
                    </ScrollView>
                </View>


                {/*SEARCH BAR*/}
                <View style={[Styles.marV5, Styles.row, Styles.jSpaceBet, Styles.marH10]}>
                    {
                        selectedChip === 'PAID'
                            ?
                            <View style={[Styles.aslCenter]}>
                                <FontAwesome onPress={() => {
                                    this.setState({dateFilterModal: true})
                                }} name="calendar" size={30} color="#000"
                                />
                                <Text
                                    style={[Styles.colorBlue, Styles.ffLBlack]}>{Services.returnCalendarMonthYearNumber(this.state.paidDateSelection)}</Text>
                            </View>
                            :
                            null
                    }
                    <Searchbar
                        style={[{
                            width: selectedChip === 'PAID' ? Dimensions.get('window').width - 80 : Dimensions.get('window').width - 60,
                            // borderWidth: 1,
                            // backgroundColor: '#f5f5f5',
                            borderBottomWidth: 1
                        }]}
                        isFocused="false"
                        placeholder="Search a User"
                        onSubmitEditing={() => {
                            selectedChip === 'TOPAY'
                                ?
                                this.getToPayExpenseList()
                                :
                                selectedChip === 'PAID'
                                    ?
                                    this.getPaidExpenseList()
                                    :
                                    this.getExpensesList(this.state.selectedChip, this.state.page), () => {
                                Keyboard.dismiss()
                            }
                        }
                        }
                        value={this.state.expenseSearchName}
                        onChangeText={(expenseSearchName) => {
                            this.setState({expenseSearchName: expenseSearchName}, () => {
                                selectedChip === 'TOPAY'
                                    ?
                                    this.getToPayExpenseList()
                                    :
                                    selectedChip === 'PAID'
                                        ?
                                        this.getPaidExpenseList()
                                        :
                                        this.getExpensesList(this.state.selectedChip, this.state.page)
                            })
                        }}
                    />
                </View>


                <View style={[Styles.flex1, Styles.alignCenter]}>

                    {
                        selectedChip === 'PAID' || selectedChip === 'TOPAY'
                            ?
                            paidList.length === 0
                                ?
                                <View style={[Styles.aslCenter]}>
                                    {/*<Image*/}
                                    {/*    style={[Styles.alignCenter, {height: 200, width: 200}]}*/}
                                    {/*    source={LoadImages.emptyIndicator}/>*/}
                                    <Text  style={[Styles.ffLBold, Styles.f18, Styles.colorBlue,Styles.alignCenter,Styles.pLeft15]}>No Expenses Found..</Text>
                                </View>
                                :
                                <View style={[Styles.mBtm5, Styles.flex1]}>
                                    <FlatList
                                        data={paidList}
                                        style={[{flex: 1}]}
                                        renderItem={({item, index}) =>
                                            <View key={index}
                                                  style={[Styles.mBtm10, Styles.marH10]}>
                                                <TouchableOpacity
                                                    activeOpacity={0.9}
                                                    onPress={() => {
                                                        this.setState({
                                                            expenseUserName: item.userDetails.fullName,
                                                            sameUser: this.state.loggedUserId === item.userDetails.id
                                                        }, () => {
                                                            selectedChip === 'TOPAY'
                                                                ?
                                                                this.getToPayMonthlyReport(item.userDetails.id)
                                                                :
                                                                this.getPaidMonthlyReport(item.userDetails.id)
                                                        })
                                                    }}
                                                    style={[Styles.padH10, Styles.OrdersScreenCardshadow, Styles.bgWhite,
                                                        {
                                                            width: Dimensions.get('window').width - 20,
                                                            borderLeftColor: Services.getExpensesStatus(selectedChip),
                                                            borderLeftWidth: 10,
                                                            // backgroundColor:Services.getExpensesStatus(item.status)
                                                        }]}>
                                                    <View style={[Styles.row, Styles.jSpaceBet,]}>
                                                        <View>
                                                            <View style={[Styles.row, Styles.pTop5,]}>
                                                                <Text
                                                                    style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Expenses
                                                                    Count</Text>
                                                                <Text
                                                                    style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.totalExpenses}</Text>
                                                            </View>

                                                            <View style={[Styles.row]}>
                                                                <Text
                                                                    style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue,]}>{_.startCase(_.toLower(selectedChip))}  </Text>
                                                                {
                                                                    item.paidAt
                                                                        ?
                                                                        <Text
                                                                            style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>on {Services.returnDateMonthYearFormat(item.paidAt)}</Text>
                                                                        :
                                                                        null
                                                                }
                                                            </View>


                                                            <View style={[{paddingVertical: 12}]}/>
                                                        </View>

                                                        <View>
                                                            <View style={[Styles.aslStart]}>

                                                                <View style={[Styles.row]}>
                                                                    <Text
                                                                        style={[Styles.f36, Styles.colorBlue, Styles.fWbold, Styles.ffLBlack, Styles.aslStart, Styles.pRight3]}>&#x20B9;</Text>
                                                                    <Text
                                                                        style={[Styles.f36, Styles.colorBlue, Styles.fWbold, Styles.ffLBlack, Styles.txtAlignRt, {width: 110}]}>{item.totalAmount}</Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </View>

                                                    <View>
                                                        <Text
                                                            style={[Styles.f24, Styles.colorBlue, Styles.fWbold, Styles.ffLBlack,]}>{item.userDetails.fullName}</Text>
                                                        <View style={[Styles.row, Styles.jSpaceBet]}>
                                                            <Text
                                                                style={[Styles.ffLBlack, Styles.f16, Styles.cDCyan]}>{item.userSiteDetails.siteCode}</Text>
                                                            <View
                                                                style={[Styles.row, Styles.alignCenter, {width: Dimensions.get("window").width / 2.8}]}>
                                                                <Text numberOfLines={1}
                                                                      style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue]}>{item.userSiteDetails.city}</Text>
                                                            </View>
                                                            <Text
                                                                style={[Styles.f16, Styles.cVoiletPinkMix, Styles.ffLBlack,]}>{Services.getUserRoles(item.userDetails.role)}</Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        }
                                        keyExtractor={(item, index) => index.toString()}
                                        // refreshing={this.state.isRefreshing}
                                        // onRefresh={this.handleRefresh}
                                        // onEndReached={this.handleLoadMore}
                                        // onEndReachedThreshold={1}
                                        contentContainerStyle={{paddingBottom: 50}}
                                        // ListFooterComponent={this.renderFooter}
                                    />
                                </View>
                            :
                            expensesList.length === 0
                                ?
                                <View style={[Styles.aslCenter]}>
                                    {/*<Image*/}
                                    {/*    style={[Styles.alignCenter, {height: 200, width: 200}]}*/}
                                    {/*    source={LoadImages.emptyIndicator}/>*/}
                                    <Text  style={[Styles.ffLBold, Styles.f18, Styles.colorBlue,Styles.alignCenter,Styles.pLeft15]}>No Expenses Found..</Text>
                                </View>
                                :
                                <View style={[Styles.mBtm5, Styles.flex1]}>
                                    <FlatList
                                        data={expensesList}
                                        style={[{flex: 1}]}
                                        renderItem={({item, index}) =>
                                            <View key={index}
                                                  style={[Styles.mBtm10, Styles.marH10]}>
                                                <TouchableOpacity
                                                    activeOpacity={0.9}
                                                    onPress={() => {
                                                        // this.assignPendingValues(item)
                                                        this.getExpenseDetails(item.id)
                                                    }}
                                                    style={[Styles.padH10, Styles.OrdersScreenCardshadow, Styles.bgWhite,

                                                        {
                                                            width: Dimensions.get('window').width - 20,
                                                            // borderLeftColor: Services.getExpensesStatus(item.status),
                                                            borderLeftColor: Services.getExpensesStatus(selectedChip),
                                                            borderLeftWidth: 10,
                                                            // backgroundColor:Services.getExpensesStatus(item.status)
                                                        }]}>
                                                    <View style={[Styles.row, Styles.jSpaceBet,]}>
                                                        <View>
                                                            <View style={[Styles.row, Styles.pTop5, Styles.jSpaceBet,]}>
                                                                <View style={[Styles.row]}>
                                                                    <Text
                                                                        style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Ticket
                                                                        # </Text>
                                                                    <Text
                                                                        style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.expenseNumber}</Text>
                                                                </View>
                                                                <View style={[Styles.row]}>
                                                                    <Text
                                                                        style={[Styles.f16, Styles.cRed, Styles.ffLBlack,]}>{Services.getUserRolesShortName(item.attrs.createdUserRole)}</Text>
                                                                </View>
                                                            </View>
                                                            {
                                                                this.returnActionedUserDetails(item)
                                                            }
                                                        </View>

                                                        <View>
                                                            <View style={[Styles.aslStart]}>

                                                                <View style={[Styles.row]}>
                                                                    <Text
                                                                        style={[Styles.f36, Styles.colorBlue, Styles.fWbold, Styles.ffLBlack, Styles.aslStart, Styles.pRight3]}>&#x20B9;</Text>
                                                                    <Text
                                                                        style={[Styles.f36, Styles.colorBlue, Styles.fWbold, Styles.ffLBlack, Styles.txtAlignRt, {width: 110}]}>{item.totalAmount}</Text>
                                                                </View>
                                                            </View>
                                                            {/*<MaterialIcons name="chevron-right" size={32} style={[Styles.aslCenter]}/>*/}
                                                            {/*</View>*/}
                                                        </View>
                                                    </View>

                                                    <View>
                                                        {
                                                            selectedChip === 'REJECTED'
                                                                ?
                                                                <View style={[Styles.row, Styles.flexWrap]}>
                                                                    <Text
                                                                        style={[Styles.f14, Styles.colorBlue, Styles.aslStart, Styles.ffLBlack]}>
                                                                        <Text
                                                                            style={[Styles.f14, Styles.colorBlue, Styles.aslStart, Styles.ffLBlack, Styles.bgLPink]}> {Services.getUserRoles(item.attrs.rejectedUserRole)} </Text>-{item.attrs.rejectedReason}
                                                                    </Text>
                                                                </View>
                                                                :
                                                                // selectedChip === 'PENDING'
                                                                // selectedChip === 'PENDING' && !item.canEdit
                                                                selectedChip !== 'DELETED'
                                                                    ?
                                                                    <Text
                                                                        style={[Styles.f14, Styles.colorBlue, Styles.aslStart, Styles.ffLBlack, Styles.bgLBlueAsh, Styles.p3]}>{_.split(item.attrs.approvedStatus,'_').join(' ')}</Text>
                                                                    :
                                                                    null
                                                        }
                                                        <View style={[{paddingVertical: 12}]}/>
                                                        <Text
                                                            style={[Styles.f24, Styles.colorBlue, Styles.fWbold, Styles.ffLBlack,]}>{item.attrs.createdBy}</Text>
                                                        <View style={[Styles.row, Styles.jSpaceBet]}>
                                                            <Text
                                                                style={[Styles.ffLBlack, Styles.f16, item.category === 'CENTRAL' || item.category === 'central' ? Styles.cVoiletPinkMix : Styles.cDCyan]}>{item.category === 'CENTRAL' || item.category === 'central' ? _.startCase(_.toLower(item.category)) : item.attrs.siteCode}</Text>
                                                            <View
                                                                style={[Styles.row, Styles.alignCenter, {width: Dimensions.get("window").width / 2.8}]}>
                                                                <Text numberOfLines={1}
                                                                      style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue]}>{_.startCase(_.toLower(item.reimbursementType))}
                                                                    {
                                                                        item.expenseType
                                                                            ?
                                                                            <Text
                                                                                style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue,]}> | {_.startCase(_.toLower(item.expenseType))}
                                                                                {/*style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue,]}> | {_.startCase(_.toLower(item.expenseType)).substring(0, 10)}*/}
                                                                            </Text>
                                                                            :
                                                                            null
                                                                    }</Text>
                                                            </View>
                                                            <Text
                                                                style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{Services.returnDateMonthYearFormat(item.expenseDate)}</Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        }
                                        keyExtractor={(item, index) => index.toString()}
                                        refreshing={this.state.isRefreshing}
                                        onRefresh={this.handleRefresh}
                                        onEndReached={this.handleLoadMore}
                                        onEndReachedThreshold={1}
                                        contentContainerStyle={{paddingBottom: 50}}
                                        ListFooterComponent={this.renderFooter}/>
                                </View>
                    }

                </View>

                <View style={[{position: "absolute", bottom: 15, right: showSelfExpenses ? 80 : 20}]}>
                    <FAB
                        style={[this.state.filtersSelected ? Styles.bgOrangeYellow : Styles.bgPureRed, Styles.OrdersScreenCardshadow]}
                        icon="filter-list"
                        // label={'ADD'}
                        color={'#fff'}
                        onPress={() => {
                                this.setState({filtersModal: true},()=>{
                                    this.getFilterRoles()
                                })
                        }}
                    />
                </View>

                {
                    showSelfExpenses
                        ?
                        <View style={[{position: "absolute", bottom: 15, right: 20}]}>
                            <FAB
                                style={[Styles.bgPureRed, Styles.OrdersScreenCardshadow]}
                                icon="add"
                                // label={'ADD'}
                                color={'#fff'}
                                onPress={() =>{
                                    this.assignNewValues()
                                }}
                            />
                        </View>
                        :
                        null
                }


                {/*MODAL for creation */}
                <Modal transparent={true}
                       visible={this.state.createReimbursementModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           this.setState({createReimbursementModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[[Styles.flex1, Styles.bgWhite, {
                                width: Dimensions.get('window').width,
                                height: Dimensions.get('window').height,
                            }]]}>
                            <Appbar.Header theme={theme} style={[Styles.bgDarkRed, Styles.padV5]}>
                                <Appbar.Content
                                    style={[Styles.padV5]}
                                    subtitle={this.state.ticketNo ? 'Ticket No # ' + this.state.ticketNo : null}
                                    subtitleStyle={[Styles.ffLBlack, Styles.cWhite]}
                                    title={status === 'NEW' ? "Add Expense" : canEditTextInput ? "Update Expense" : "View Expense"}
                                    titleStyle={[Styles.ffLBlack]}/>
                                <MaterialCommunityIcons name="window-close" size={28}
                                                        style={[Styles.marV10]}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() => this.setState({createReimbursementModal: false})}/>
                            </Appbar.Header>
                            <View style={[Styles.flex1]}>
                                <ScrollView style={[Styles.flex1]}>
                                    <View style={[Styles.flex1, Styles.padH10, Styles.mBtm15]}>

                                        {/*DATE CARD*/}
                                        <View
                                            style={[Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.padH5]}>
                                            <View style={[Styles.row, Styles.jSpaceBet, Styles.pBtm3]}>
                                                <Title style={[Styles.cBlk, Styles.f16, Styles.ffMbold]}>Expense
                                                    Date {Services.returnRedStart()}</Title>
                                            </View>
                                            <TouchableOpacity
                                                disabled={!canEditTextInput}
                                                activeOpacity={0.7}
                                                style={[Styles.jSpaceBet, Styles.row]}
                                                onPress={() => {
                                                    this.datePicker()
                                                }}>
                                                <Title
                                                    style={[Styles.cBlk, Styles.f16, Styles.ffLBlack]}>{new Date(this.state.expenseDate).toDateString()}</Title>
                                                <FontAwesome name="calendar" size={30} color="#000"
                                                             style={[Styles.padH10]}/>
                                            </TouchableOpacity>
                                        </View>

                                        {/*Main Category radio button*/}
                                        <View
                                            style={[Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.p5]}>
                                            <Text style={[Styles.ffLBlack, Styles.f18, Styles.aslStart]}>Main
                                                Category {Services.returnRedStart()}</Text>
                                            <RadioButton.Group
                                                disabled={!canEditTextInput}
                                                onValueChange={categoryType => this.setState({categoryType}, () => {
                                                    this.getReimbursementTypes(categoryType, true)
                                                    if (categoryType === 'STATION') {
                                                        if (this.state.siteValue) {
                                                            this.getSitesDetails(this.state.siteValue)
                                                        } else {
                                                            this.setState({bussinessUnitValue: ''})
                                                        }
                                                    } else {
                                                        this.setState({bussinessUnitValue: ''})
                                                    }
                                                })}
                                                value={this.state.categoryType}>
                                                <View style={[Styles.row, Styles.aslCenter, Styles.padV3]}>
                                                    <View style={[Styles.row, Styles.aslCenter]}>
                                                        <RadioButton value={"STATION"} disabled={!canEditTextInput}/>
                                                        <Text
                                                            style={[Styles.ffLBlack, Styles.padH5, Styles.aslCenter, Styles.f16]}>Station</Text>
                                                    </View>
                                                    <View style={[Styles.row, Styles.aslCenter]}>
                                                        <RadioButton value={"CENTRAL"} disabled={!canEditTextInput}/>
                                                        <Text
                                                            style={[Styles.ffLBlack, Styles.padH5, Styles.aslCenter, Styles.f16]}>Central</Text>
                                                    </View>
                                                </View>
                                            </RadioButton.Group>
                                        </View>

                                        {
                                            this.state.categoryType === 'CENTRAL' || this.state.categoryType === "central"
                                                ?
                                                <View>
                                                    {/*Business Unit code*/}
                                                    <TouchableOpacity
                                                        style={[Styles.marV5]}
                                                        disabled={!canEditTextInput}
                                                        onPress={() => {
                                                            this.setState({bussinessUnitModal: true})
                                                        }}>
                                                        <View pointerEvents='none'>
                                                            <TextInput label={'Select Business Unit *'}
                                                                       showSoftInputOnFocus={true}
                                                                       disabled={!canEditTextInput}
                                                                       theme={theme}
                                                                       onFocus={() => {
                                                                           Keyboard.dismiss()
                                                                       }}
                                                                       mode='outlined'
                                                                       placeholderTextColor='#233167'
                                                                       blurOnSubmit={false}
                                                                // value={this.state.bussinessUnitValue}
                                                                       value={_.startCase(this.state.bussinessUnitValue)}
                                                            />
                                                        </View>
                                                        <MaterialIcons name='expand-more' color='#9e9e9e' size={35}
                                                                       style={{
                                                                           position: 'absolute',
                                                                           right: 15,
                                                                           top: 18
                                                                       }}/>
                                                    </TouchableOpacity>

                                                    {/*State Selection Card*/}
                                                    <TouchableOpacity
                                                        style={[Styles.marV5]}
                                                        disabled={!canEditTextInput}
                                                        onPress={() => {
                                                            this.setState({stateSelectionModal: true})
                                                        }}>
                                                        <View pointerEvents='none'>
                                                            <TextInput label={'Select State*'}
                                                                       showSoftInputOnFocus={true}
                                                                       disabled={!canEditTextInput}
                                                                       theme={theme}
                                                                       onFocus={() => {
                                                                           Keyboard.dismiss()
                                                                       }}
                                                                       mode='outlined'
                                                                       placeholderTextColor='#233167'
                                                                       blurOnSubmit={false}
                                                                       value={this.state.stateSelectionName}
                                                            />
                                                        </View>
                                                        <MaterialIcons name='expand-more' color='#9e9e9e' size={35}
                                                                       style={{
                                                                           position: 'absolute',
                                                                           right: 15,
                                                                           top: 18
                                                                       }}/>
                                                    </TouchableOpacity>

                                                </View>
                                                :
                                                <View>
                                                    {/*site station code*/}
                                                    <TouchableOpacity
                                                        style={[Styles.marV5]}
                                                        disabled={!canEditTextInput}
                                                        onPress={() => {
                                                            this.setState({siteSelectionModal: true})
                                                        }}>
                                                        <View pointerEvents='none'>
                                                            <TextInput label={'Select Station Code *'}
                                                                       showSoftInputOnFocus={true}
                                                                       disabled={!canEditTextInput}
                                                                       theme={theme}
                                                                       onFocus={() => {
                                                                           Keyboard.dismiss()
                                                                       }}
                                                                       mode='outlined'
                                                                       placeholderTextColor='#233167'
                                                                       blurOnSubmit={false}
                                                                       value={this.state.siteName}
                                                            />
                                                        </View>
                                                        <MaterialIcons name='expand-more' color='#9e9e9e' size={35}
                                                                       style={{
                                                                           position: 'absolute',
                                                                           right: 15,
                                                                           top: 18
                                                                       }}/>
                                                    </TouchableOpacity>

                                                    {
                                                        (this.state.categoryType === 'STATION' || this.state.categoryType === 'station') && this.state.siteName
                                                            // this.state.siteName
                                                            ?
                                                            <View
                                                                style={[Styles.OrdersScreenCardshadow, Styles.row, Styles.flexWrap, Styles.bgLWhite, Styles.p5, Styles.marV5]}>
                                                                <View
                                                                    style={[Styles.row, {width: Dimensions.get('window').width / 2.2}]}>
                                                                    {/*<Text*/}
                                                                    {/*    style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.aslCenter, Styles.pRight5]}>Client:</Text>*/}
                                                                    <Text
                                                                        style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.aslCenter]}>{this.state.clientValue}</Text>
                                                                </View>

                                                                <View
                                                                    style={[Styles.row, Styles.jEnd, {width: Dimensions.get('window').width / 2.3}]}>
                                                                    {/*<Text*/}
                                                                    {/*    style={[Styles.f16, Styles.colorBlue, Styles.ffLBold, Styles.aslCenter, Styles.pRight5]}>Bussiness*/}
                                                                    {/*    Unit:</Text>*/}
                                                                    <Text
                                                                        style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.aslCenter]}>{this.state.bussinessUnitValue}</Text>
                                                                </View>

                                                                <View
                                                                    style={[Styles.row, {width: Dimensions.get('window').width / 2.2}]}>
                                                                    {/*<Text  style={[Styles.f16, Styles.colorBlue, Styles.ffLBold, Styles.aslCenter, Styles.pRight5]}>City:</Text>*/}
                                                                    <Text
                                                                        style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.aslCenter]}>{_.startCase(_.toLower(this.state.cityValue))}</Text>
                                                                </View>

                                                                <View
                                                                    style={[Styles.row, Styles.jEnd, {width: Dimensions.get('window').width / 2.3}]}>
                                                                    {/*<Text style={[Styles.f16, Styles.colorBlue, Styles.ffLBold, Styles.aslCenter, Styles.pRight5]}>State:</Text>*/}
                                                                    <Text
                                                                        style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.aslCenter]}>{_.startCase(_.toLower(this.state.stateSelectionName))}</Text>
                                                                </View>

                                                            </View>
                                                            :
                                                            null
                                                    }
                                                </View>
                                        }


                                        {/*Reimbursement Type*/}
                                        <TouchableOpacity
                                            disabled={!canEditTextInput}
                                            style={[Styles.marV5]}
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                this.setState({reimbursementTypeModal: true})
                                            }}>
                                            <View pointerEvents='none'>
                                                <TextInput label={'Expense Type*'}
                                                           showSoftInputOnFocus={true}
                                                           style={{paddingRight: 40}}
                                                           disabled={!canEditTextInput}
                                                           theme={theme}
                                                           onFocus={() => {
                                                               Keyboard.dismiss()
                                                           }}
                                                           mode='outlined'
                                                           placeholderTextColor='#233167'
                                                           blurOnSubmit={false}
                                                           multiline={true}
                                                    // value={this.state.reimbursementTypeName}
                                                           value={_.startCase(_.toLower(this.state.reimbursementTypeValue))}
                                                />
                                            </View>
                                            <MaterialIcons name='expand-more' color='#9e9e9e' size={35}
                                                           style={{position: 'absolute', right: 15, top: 18}}/>
                                        </TouchableOpacity>

                                        {
                                            _.startCase(_.toLower(this.state.reimbursementTypeValue)) === 'Other' || _.startCase(_.toLower(this.state.reimbursementTypeValue)) === 'Others'
                                                ?
                                                <TextInput label={'Expense Reason*'}
                                                           placeholder={'Type here'}
                                                           style={[Styles.marV5]}
                                                           disabled={!canEditTextInput}
                                                           multiline={true}
                                                           theme={theme}
                                                           mode='outlined'
                                                           onSubmitEditing={() => {
                                                               Keyboard.dismiss()
                                                           }}
                                                           placeholderTextColor='#233167'
                                                           blurOnSubmit={false}
                                                           onChangeText={(reimbursementOtherReason) => this.setState({reimbursementOtherReason})}
                                                           value={this.state.reimbursementOtherReason}
                                                /> :
                                                null
                                        }

                                        {/*Expense Sub-Category*/}
                                        {
                                            showSubCategory
                                                ?
                                                <TouchableOpacity
                                                    disabled={!canEditTextInput}
                                                    style={[Styles.marV5]}
                                                    activeOpacity={0.7}
                                                    onPress={() => {
                                                        this.setState({reimbursementSubTypeModal: true})
                                                    }}>
                                                    <View pointerEvents='none'>
                                                        <TextInput label={'Expense Sub-Category*'}
                                                                   showSoftInputOnFocus={true}
                                                                   disabled={!canEditTextInput}
                                                                   theme={theme}
                                                                   onFocus={() => {
                                                                       Keyboard.dismiss()
                                                                   }}
                                                                   mode='outlined'
                                                                   placeholderTextColor='#233167'
                                                                   blurOnSubmit={false}
                                                            // value={this.state.reimbursementSubTypeName}
                                                                   value={_.startCase(_.toLower(this.state.reimbursementSubTypeValue))}
                                                        />
                                                    </View>
                                                    <MaterialIcons name='expand-more' color='#9e9e9e' size={35}
                                                                   style={{position: 'absolute', right: 15, top: 18}}/>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                        {
                                            _.startCase(_.toLower(this.state.reimbursementSubTypeValue)) === 'Other' || _.startCase(_.toLower(this.state.reimbursementSubTypeValue)) === 'Others'
                                                ?
                                                <TextInput label={'Sub-Category Reason*'}
                                                           style={[Styles.marV5]}
                                                           disabled={!canEditTextInput}
                                                           multiline={true}
                                                           theme={theme}
                                                           mode='outlined'
                                                           onSubmitEditing={() => {
                                                               Keyboard.dismiss()
                                                           }}
                                                           placeholderTextColor='#233167'
                                                           blurOnSubmit={false}
                                                           onChangeText={(expenseOtherReason) => this.setState({expenseOtherReason})}
                                                           value={this.state.expenseOtherReason}
                                                /> :
                                                null
                                        }

                                        <TextInput label={'Description*'}
                                                   placeholder={'Type here'}
                                                   style={[Styles.marV5]}
                                                   disabled={!canEditTextInput}
                                                   theme={theme}
                                                   multiline={true}
                                                   mode='outlined'
                                                   onSubmitEditing={() => {
                                                       Keyboard.dismiss()
                                                   }}
                                                   placeholderTextColor='#233167'
                                                   blurOnSubmit={false}
                                                   onChangeText={(description) => this.setState({description})}
                                                   value={this.state.description}
                                        />

                                        <TextInput label={'Merchant Name*'}
                                                   placeholder={'Type here'}
                                                   style={[Styles.marV5]}
                                                   disabled={!canEditTextInput}
                                                   theme={theme}
                                                   mode='outlined'
                                                   onSubmitEditing={() => {
                                                       Keyboard.dismiss()
                                                   }}
                                                   placeholderTextColor='#233167'
                                                   blurOnSubmit={false}
                                                   onChangeText={(merchantName) => this.setState({merchantName})}
                                                   value={this.state.merchantName}
                                        />

                                        <TextInput label={'Merchant Phone Number'}
                                                   placeholder={'Type here'}
                                                   theme={theme}
                                                   disabled={!canEditTextInput}
                                                   mode='outlined'
                                                   keyboardType='numeric'
                                                   onSubmitEditing={() => {
                                                       Keyboard.dismiss()
                                                   }}
                                                   placeholderTextColor='#233167'
                                                   blurOnSubmit={false}
                                                   onChangeText={(merchantPhoneNumber) => this.setState({merchantPhoneNumber})}
                                                   value={this.state.merchantPhoneNumber}
                                        />

                                        <TextInput label={'Invoice Number*'}
                                                   placeholder={'Type here'}
                                                   theme={theme}
                                                   disabled={!canEditTextInput}
                                                   mode='outlined'
                                                   onSubmitEditing={() => {
                                                       Keyboard.dismiss()
                                                   }}
                                                   placeholderTextColor='#233167'
                                                   blurOnSubmit={false}
                                                   onChangeText={(expenseTypeNumber) => this.setState({expenseTypeNumber})}
                                                   value={this.state.expenseTypeNumber}
                                        />

                                        <View
                                            style={[Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.p5]}>
                                            <Text style={[Styles.ffMbold, Styles.f18, Styles.aslStart]}>Is GST
                                                Bill {Services.returnRedStart()} ?</Text>
                                            <RadioButton.Group
                                                disabled={!canEditTextInput}
                                                onValueChange={gstBill => this.setState({gstBill})}
                                                value={this.state.gstBill}
                                            >
                                                <View style={[Styles.row, Styles.aslCenter, Styles.padV3]}>
                                                    <View style={[Styles.row, Styles.aslCenter]}>
                                                        <RadioButton value={true} disabled={!canEditTextInput}/>
                                                        <Text
                                                            style={[Styles.ffLBlack, Styles.padH5, Styles.aslCenter, Styles.f16]}>Yes</Text>
                                                    </View>
                                                    <View style={[Styles.row, Styles.aslCenter]}>
                                                        <RadioButton value={false} disabled={!canEditTextInput}/>
                                                        <Text
                                                            style={[Styles.ffLBlack, Styles.padH5, Styles.aslCenter, Styles.f16]}>No</Text>
                                                    </View>
                                                </View>
                                            </RadioButton.Group>
                                            {
                                                this.state.gstBill === true
                                                    ?
                                                    <View>
                                                        <TextInput label={'Actual Amount *'}
                                                                   placeholder={'Type here'}
                                                                   theme={theme}
                                                                   disabled={!canEditTextInput}
                                                                   mode='outlined'
                                                                   maxLength={5}
                                                                   onSubmitEditing={() => {
                                                                       Keyboard.dismiss()
                                                                   }}
                                                                   placeholderTextColor='#233167'
                                                                   blurOnSubmit={false}
                                                                   keyboardType='numeric'
                                                                   onChangeText={(actualAmount) => this.setState({actualAmount})}
                                                                   value={this.state.actualAmount}
                                                        />

                                                        <TextInput label={'GST Amount *'}
                                                                   placeholder={'Type here'}
                                                                   theme={theme}
                                                                   disabled={!canEditTextInput}
                                                                   maxLength={5}
                                                                   mode='outlined'
                                                                   onSubmitEditing={() => {
                                                                       Keyboard.dismiss()
                                                                   }}
                                                                   placeholderTextColor='#233167'
                                                                   blurOnSubmit={false}
                                                                   keyboardType='numeric'
                                                                   onChangeText={(gstAmount) => this.setState({gstAmount})}
                                                                   value={this.state.gstAmount}
                                                        />
                                                    </View>
                                                    :
                                                    <TextInput label={'Total Amount *'}
                                                               placeholder={'Type here'}
                                                               theme={theme}
                                                               disabled={!canEditTextInput}
                                                               mode='outlined'
                                                               maxLength={5}
                                                               onSubmitEditing={() => {
                                                                   Keyboard.dismiss()
                                                               }}
                                                               placeholderTextColor='#233167'
                                                               blurOnSubmit={false}
                                                               keyboardType='numeric'
                                                               onChangeText={(totalAmount) => this.setState({totalAmount})}
                                                               value={this.state.totalAmount}
                                                    />
                                            }
                                        </View>


                                        {
                                            imagesCollection.length > 0
                                                ?
                                                imagesCollection.map((list, index) => {
                                                    return (
                                                        <View key={index}>
                                                            <View style={[Styles.row, Styles.aitCenter, Styles.marV5,]}>
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        // this.imageUpload('EXPENSE_IMAGE')
                                                                        this.setState({imageType:'EXPENSE_IMAGE',imageSelectionModal:true})
                                                                    }}
                                                                    activeOpacity={0.7}
                                                                    disabled={list.expenseDocUrl || !canEditTextInput}
                                                                    style={[Styles.row, Styles.bgLWhite, Styles.br5, Styles.aslCenter, Styles.p5,]}>
                                                                    {LoadSVG.cameraPic}
                                                                    <Text
                                                                        style={[Styles.f16, list.expenseDocUrl ? Styles.cDisabled : Styles.colorBlue, Styles.ffLBlack, Styles.pRight15]}>Expense
                                                                        Image-{index + 1}</Text>
                                                                </TouchableOpacity>
                                                                {
                                                                    canEditTextInput
                                                                        ?
                                                                        list.expenseDocUrl
                                                                            ?
                                                                            <TouchableOpacity
                                                                                onPress={() => {
                                                                                    // status !== 'NEW'
                                                                                    // ?
                                                                                    //  this.deleteExpenseImage(list.filePath,this.state.selectedExpense.id,index)
                                                                                    //     :
                                                                                    this.removeImages(list.filePath, this.state.selectedExpense.id, index)
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
                                                                list.expenseDocUrl
                                                                    ?
                                                                    <View
                                                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                        <TouchableOpacity
                                                                            style={[Styles.row, Styles.aslCenter]}
                                                                            onPress={() => {
                                                                                this.setState({
                                                                                    imagePreview: true,
                                                                                    imagePreviewURL: list.expenseDocUrl
                                                                                })
                                                                            }}>
                                                                            <Image
                                                                                onLoadStart={() => this.setState({imageLoading: true})}
                                                                                onLoadEnd={() => this.setState({imageLoading: false})}
                                                                                style={[{
                                                                                    width: Dimensions.get('window').width / 2,
                                                                                    height: 120
                                                                                }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                source={list.expenseDocUrl ? {uri: list.expenseDocUrl} : null}
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
                                                    )
                                                })
                                                :
                                                null
                                        }

                                        {
                                            canEditTextInput
                                                ?
                                                imagesCollection.length < 5
                                                    ?
                                                    <View style={[Styles.row, Styles.aitCenter, Styles.marV5,]}>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                // this.imageUpload('INITIAL')
                                                                this.setState({imageType:'INITIAL',imageSelectionModal:true})
                                                            }}
                                                            activeOpacity={0.7}
                                                            style={[Styles.row, Styles.bgLWhite, Styles.br5, Styles.aslCenter, Styles.p5,]}>
                                                            {LoadSVG.cameraPic}
                                                            <Text
                                                                style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack, Styles.pRight15]}>Add
                                                                Expense Image</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                    :
                                                    null
                                                :
                                                null
                                        }
                                    </View>
                                </ScrollView>


                                {/*FOOTER BUTTONS*/}
                                <View
                                    style={[Styles.row, Styles.p10, Styles.mBtm10, canEditTextInput ? Styles.jSpaceArd : '']}>

                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => this.setState({createReimbursementModal: false})}
                                        style={[Styles.aslCenter, Styles.br10, Styles.bgBlk, Styles.marH5]}>
                                        <Text
                                            style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>CANCEL</Text>
                                    </TouchableOpacity>
                                    {
                                        selectedExpense.expenseHistory
                                            ?
                                            selectedExpense.expenseHistory.length > 0
                                                ?
                                                <TouchableOpacity
                                                    activeOpacity={0.7}
                                                    onPress={() => this.setState({showExpensesHistoryModal: true})}
                                                    style={[Styles.aslCenter, Styles.br10, Styles.bgBlueGreenMix, Styles.marH5]}>
                                                    <Text
                                                        style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>HISTORY</Text>
                                                </TouchableOpacity>
                                                :
                                                null
                                            :
                                            null
                                    }

                                    {
                                        status !== 'NEW'
                                            // canEditTextInput
                                            ?
                                            <View style={[Styles.row, Styles.jSpaceArd]}>
                                                {
                                                    selectedExpense.attrs
                                                        ?
                                                        // status !== 'APPROVED' && status !== 'PAID' && !sameUser
                                                        // status === 'PENDING' && !sameUser && userRole !==45 && (selectedExpense.attrs.createdUserRole < userRole || userRole === 27 )
                                                        selectedChip === 'PENDING' && !sameUser && (this.state.expenseCreatedRole < userRole || specialAccess || userRole === 27)
                                                            ?
                                                            <TouchableOpacity
                                                                activeOpacity={0.7}
                                                                onPress={() => Alert.alert('You are Approving the expense for ' + this.state.expenseCreatedName, alert,
                                                                    [
                                                                        {text: 'Cancel'},
                                                                        {
                                                                            text: 'OK', onPress: () => {
                                                                                this.approveExpense('APPROVE')
                                                                            }
                                                                        }
                                                                    ]
                                                                )}
                                                                style={[Styles.aslCenter, Styles.br10, Styles.bgGrn, Styles.marH10]}>
                                                                <Text
                                                                    style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>APPROVE</Text>
                                                            </TouchableOpacity>
                                                            :
                                                            null
                                                        :
                                                        null
                                                }


                                                {
                                                    // status === 'PENDING' && sameUser
                                                    // sameUser && status !== 'APPROVED' && status !== 'PAID'
                                                    sameUser && canEditTextInput && (selectedChip === 'PENDING' || selectedChip === 'DELETED' || selectedChip === 'REJECTED')
                                                        // && (status === 'PENDING' || status === 'DELETED' || status === 'REJECTED')
                                                        ?
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            onPress={() => {
                                                                this.setState({selectedButton: 'UPDATE'}, () => {
                                                                    this.formValidation()
                                                                })
                                                            }}
                                                            style={[Styles.aslCenter, Styles.br10, Styles.bgGrn]}>
                                                            <Text
                                                                style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>UPDATE</Text>
                                                        </TouchableOpacity>
                                                        :
                                                        null
                                                }

                                                {
                                                    // status === 'PENDING' && sameUser
                                                    canEditTextInput && sameUser && status !== "DELETED"
                                                        ?
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            onPress={() => this.setState({
                                                                showRejectUserModal: true,
                                                                selectedButton: 'DELETE'
                                                            })}
                                                            style={[Styles.aslCenter, Styles.br10, Styles.bgDarkRed, Styles.marH10]}>
                                                            <Text
                                                                style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>DELETE</Text>
                                                        </TouchableOpacity>
                                                        :
                                                        null
                                                }
                                                {

                                                        (selectedChip === 'PENDING') && !sameUser && (this.state.expenseCreatedRole < userRole || userRole === 27 || specialAccess)
                                                            ?
                                                            <TouchableOpacity
                                                                activeOpacity={0.7}
                                                                onPress={() => this.setState({
                                                                    showRejectUserModal: true,
                                                                    selectedButton: 'REJECT'
                                                                })}
                                                                style={[Styles.aslCenter, Styles.br10, Styles.bgDarkRed, Styles.marH10]}>
                                                                <Text
                                                                    style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>REJECT</Text>
                                                            </TouchableOpacity>
                                                            :
                                                            null
                                                }
                                                {
                                                    // (status === 'DELETED' || status === 'REJECTED') && sameUser
                                                    // (status === 'DELETED' || status === 'REJECTED') && sameUser
                                                    (selectedChip === 'DELETED' || selectedChip === 'REJECTED') && sameUser
                                                        ?
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            onPress={() => this.setState({
                                                                showRejectUserModal: true,
                                                                selectedButton: 'REVERT'
                                                            })}
                                                            style={[Styles.aslCenter, Styles.br10, Styles.bgDarkRed, Styles.marH10]}>
                                                            <Text
                                                                style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>REVERT</Text>
                                                        </TouchableOpacity>
                                                        :
                                                        null
                                                }
                                            </View>
                                            :
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    this.setState({selectedButton: 'CREATE'}, () => {
                                                        this.formValidation()
                                                        // this.createExpenseRequest()
                                                    })
                                                }}
                                                style={[Styles.aslCenter, Styles.br10, Styles.bgGrn]}>
                                                <Text
                                                    style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>CREATE</Text>
                                            </TouchableOpacity>
                                    }
                                </View>
                            </View>

                        </View>
                    </View>
                </Modal>


                {/*MODAL for paid user Expenses List */}
                <Modal transparent={true}
                       visible={this.state.showUserReportsModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           this.setState({showUserReportsModal: false})
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
                                    title={this.state.expenseUserName + "'s History"}
                                    titleStyle={[Styles.ffLBlack]}/>
                                <MaterialCommunityIcons name="window-close" size={28}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() => this.setState({showUserReportsModal: false})}/>
                            </Appbar.Header>
                            <View style={[Styles.row, Styles.aslCenter, Styles.m10, Styles.mBtm20]}>
                                {/* userExpensesList:[],*/}
                                {/*userExpensesTotalAmount:'',*/}
                                <Text style={[Styles.ffLBold, Styles.colorBlue, Styles.f18,]}>Total Amount:</Text>
                                <Text
                                    style={[Styles.ffLBold, Styles.fWbold, Styles.colorBlue, Styles.f18,]}>{' '}&#x20B9;{' '}{this.state.userExpensesTotalAmount}</Text>
                            </View>
                            {this.state.userExpensesList.length > 0 ?
                                <View style={[Styles.flex1]}>
                                    <ScrollView style={[Styles.flex1]}>
                                        <List.Section style={[Styles.flex1]}>
                                            {this.state.userExpensesList.map((item, index) => {
                                                return (
                                                    <View key={index}
                                                          style={[Styles.mBtm10, Styles.marH10]}>
                                                        <TouchableOpacity
                                                            activeOpacity={0.9}
                                                            onPress={() => {
                                                                // this.assignPendingValues(item)
                                                                this.assignNonEditableValues(item)
                                                            }}
                                                            style={[Styles.padH10, Styles.OrdersScreenCardshadow, Styles.bgWhite,

                                                                {
                                                                    width: Dimensions.get('window').width - 20,
                                                                    borderLeftColor: Services.getExpensesStatus(item.status),
                                                                    borderLeftWidth: 10,
                                                                    // backgroundColor:Services.getExpensesStatus(item.status)
                                                                }]}>
                                                            <View style={[Styles.row, Styles.jSpaceBet,]}>
                                                                <View>


                                                                    <View style={[Styles.row, Styles.pTop5,]}>
                                                                        <Text
                                                                            style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Ticket
                                                                            # </Text>
                                                                        <Text
                                                                            style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{item.expenseNumber}</Text>
                                                                    </View>
                                                                    {
                                                                        this.returnActionedUserDetails(item)
                                                                    }
                                                                    <View style={[{paddingVertical: 12}]}/>
                                                                </View>

                                                                <View>
                                                                    <View style={[Styles.aslStart]}>
                                                                        <View style={[Styles.row]}>
                                                                            <Text
                                                                                style={[Styles.f36, Styles.colorBlue, Styles.fWbold, Styles.ffLBlack, Styles.aslStart, Styles.pRight3]}>&#x20B9;</Text>
                                                                            <Text
                                                                                style={[Styles.f36, Styles.colorBlue, Styles.fWbold, Styles.ffLBlack, Styles.txtAlignRt, {width: 110}]}>{item.totalAmount}</Text>
                                                                        </View>
                                                                    </View>
                                                                </View>
                                                            </View>

                                                            <View>
                                                                {/*<Text style={[Styles.f24, Styles.colorBlue,Styles.fWbold,  Styles.ffLBlack,]}>{item.attrs.createdBy}</Text>*/}
                                                                <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                    <Text
                                                                        style={[Styles.ffLBlack, Styles.f16, item.category === 'CENTRAL' || item.category === 'central' ? Styles.cVoiletPinkMix : Styles.cDCyan]}>{item.category === 'CENTRAL' || item.category === 'central' ? _.startCase(_.toLower(item.category)) : item.siteDetails.siteCode}</Text>
                                                                    <View
                                                                        style={[Styles.row, Styles.alignCenter, {width: Dimensions.get('window').width / 2.8}]}>
                                                                        <Text numberOfLines={1}
                                                                              style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue]}>{_.startCase(_.toLower(item.reimbursementType))}
                                                                            {
                                                                                item.expenseType
                                                                                    ?
                                                                                    <Text
                                                                                        // style={[Styles.ffLBlack,Styles.aslStart, Styles.f16, Styles.colorBlue,]}> | {_.startCase(_.toLower(item.expenseType)).substring(0, 10)}
                                                                                        style={[Styles.ffLBlack, Styles.aslStart, Styles.f16, Styles.colorBlue,]}> | {_.startCase(_.toLower(item.expenseType))}
                                                                                    </Text>
                                                                                    :
                                                                                    null
                                                                            }</Text>
                                                                    </View>
                                                                    <Text
                                                                        style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{Services.returnDateMonthYearFormat(item.expenseDate)}</Text>
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>
                                                    </View>
                                                );
                                            })}
                                        </List.Section>
                                    </ScrollView>
                                    <View style={[Styles.mBtm15]}>
                                        {
                                            selectedChip === 'TOPAY'
                                                ?
                                                userRole === 27
                                                    ?
                                                    <TouchableOpacity
                                                        activeOpacity={0.7}
                                                        onPress={() => Alert.alert('You are Paying for ' + this.state.expenseUserName + ' Expense of' + ' ' + this.state.userExpensesTotalAmount, alert,
                                                            [
                                                                {text: 'Cancel'},
                                                                {
                                                                    text: 'PAY', onPress: () => {
                                                                        // this.approveExpense('PAID')
                                                                        this.toPayUserExpense('PAID')
                                                                    }
                                                                }
                                                            ]
                                                        )}
                                                        style={[Styles.aslCenter, Styles.br10, Styles.bgGrn, Styles.marH10]}>
                                                        <Text
                                                            style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.padH15, Styles.padV10, Styles.f18,]}>PAY
                                                            ({this.state.userExpensesTotalAmount})</Text>
                                                    </TouchableOpacity>
                                                    :
                                                    null
                                                :
                                                null
                                        }
                                    </View>
                                </View>
                                :
                                <View style={[{height: 100}, Styles.mBtm10]}>
                                    <Text style={[Styles.ffLBold, Styles.f16, {textAlign: 'center'}]}>No Expenses
                                        Found</Text>
                                </View>
                            }
                        </View>
                    </View>
                </Modal>

                {/*MODAL for Expenses History */}
                <Modal transparent={true}
                       visible={this.state.showExpensesHistoryModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           this.setState({showExpensesHistoryModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[[Styles.bw1, Styles.aslCenter, Styles.bgWhite, Styles.padV15, Styles.padH5, Styles.br40, Styles.bgWhite, {
                                width: Dimensions.get('window').width - 20,
                                height: Dimensions.get('window').height - 160
                            }]]}>
                            <View style={Styles.alignCenter}>
                                <Text style={[Styles.ffLBold, Styles.colorBlue, Styles.f22, Styles.mBtm5]}>Expense
                                    History</Text>
                                <View style={[Styles.row]}>
                                    <Text
                                        style={[Styles.ffLBlack, Styles.f16, Styles.colorBlue, Styles.pRight5]}>Ticket
                                        # </Text>
                                    <Text
                                        style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{this.state.selectedExpense.expenseNumber}</Text>
                                </View>
                            </View>
                            {
                                this.state.selectedExpense.expenseHistory
                                    ?
                                    this.state.selectedExpense.expenseHistory.length > 0
                                        ?
                                        <ScrollView style={[Styles.bgWhite, Styles.mTop15, Styles.p3]}>
                                            <List.Section>
                                                {this.state.selectedExpense.expenseHistory.map((list, index) => {
                                                    return (
                                                        <View key={index}
                                                              style={[Styles.mBtm10, Styles.marH10]}>
                                                            <View
                                                                style={[Styles.padH10, Styles.OrdersScreenCardshadow, Styles.bgWhite,
                                                                    {
                                                                        width: Dimensions.get('window').width - 60,
                                                                        borderLeftColor: Services.getExpensesStatus(list.actionStatus),
                                                                        borderLeftWidth: 10,
                                                                        // backgroundColor:Services.getExpensesStatus(item.status)
                                                                    }]}>

                                                                <View
                                                                    style={[Styles.row, Styles.jSpaceBet, Styles.padV5]}>
                                                                    <Text
                                                                        style={[Styles.f18, Styles.colorBlue, Styles.ffLBlack,]}>{list.actionBy}{' '}({Services.getUserRolesShortName(list.userRole)})</Text>
                                                                </View>
                                                                <View
                                                                    style={[Styles.padV5]}>
                                                                    <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                        <Text
                                                                            style={[Styles.f14, Styles.ffLBlack, {color: Services.getExpensesStatus(list.actionStatus)}]}>{list.actionStatus}</Text>
                                                                        <Text
                                                                            style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{Services.returnDateMonthYearFormat(list.actionTime)}</Text>
                                                                        <Text
                                                                            style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,]}>{Services.convertTimeStamptoBlueColorHM(list.actionTime)}</Text>
                                                                    </View>
                                                                    {
                                                                        list.actionReason
                                                                            ?
                                                                            <View style={[Styles.row, Styles.flexWrap]}>
                                                                                <Text
                                                                                    style={[Styles.f14, Styles.ffLRegular, Styles.colorBlue]}><Text
                                                                                    style={[Styles.f14, Styles.ffLBlack, Styles.colorBlue]}>Reason: </Text>{list.actionReason}
                                                                                </Text>
                                                                            </View>
                                                                            :
                                                                            null
                                                                    }
                                                                </View>
                                                            </View>
                                                        </View>
                                                    );
                                                })}
                                            </List.Section>
                                        </ScrollView>
                                        :
                                        null
                                    :
                                    <View style={[Styles.row, Styles.alignCenter, Styles.padV5]}>
                                        <Text style={[Styles.f14, Styles.ffLBlack, Styles.colorBlue]}>No History
                                            Found</Text>
                                    </View>
                            }
                        </View>
                        <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                            this.setState({showExpensesHistoryModal: false})
                        }}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
                    </View>
                </Modal>


                {/*MODAL for Reimbursement Category Selection */}
                <Modal transparent={true}
                       visible={this.state.reimbursementTypeModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           this.setState({reimbursementTypeModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[[Styles.bw1, Styles.aslCenter, Styles.bgWhite, Styles.padV15, Styles.padH5, Styles.br40, Styles.bgWhite, {
                                width: Dimensions.get('window').width - 20,
                                height: this.state.reimbursementTypeList.length > 0 ? Dimensions.get('window').height / 1.6 : 200,
                            }]]}>
                            <View style={Styles.alignCenter}>
                                <Text style={[Styles.ffLBold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Expense
                                    Categories</Text>
                            </View>
                            {this.state.reimbursementTypeList.length > 0 ?
                                <ScrollView style={{height: Dimensions.get('window').height / 2}}>
                                    <List.Section style={[Styles.row, Styles.flexWrap]}>
                                        {this.state.reimbursementTypeList.map((list, index) => {
                                            // let colors = ['#D6D1B4', '#F3F2F2', '#FFEE93', '#ccf6d8', '#F8F1EC', '#ECF3AB', '#F4EDAB'];
                                            let colors = ['#f7e39a', '#fece79', '#f8a555', '#f48270', '#f27f93', '#f192bb', '#e4b7d4', '#8c8bc4', '#90c9e2', '#a1d9d8', '#98d0a9', '#c0d682'];
                                            let fontColors = ['#8B814C', '#8B8682', '#EEC900', '#519a4d', '#BC7642', '#D1E231', '#D6C537'];
                                            return (
                                                <View
                                                    key={index}
                                                    style={[this.state.reimbursementTypeValue === list.value ? {
                                                        backgroundColor: '#f3cc14', borderRadius: 10
                                                    } : null
                                                    ]}>
                                                    <TouchableOpacity
                                                        onPress={() => this.setState({
                                                            reimbursementTypeName: list.key,
                                                            reimbursementTypeValue: list.value,
                                                            reimbursementTypeModal: false,
                                                            reimbursementOtherReason: ''
                                                        }, function () {
                                                            this.getReimbursementSubTypes(list.value);
                                                        })}
                                                        activeOpacity={0.9}
                                                        style={[Styles.OrdersScreenCardshadow, Styles.marH5, Styles.marV10, Styles.br10,
                                                            {
                                                                backgroundColor: colors[index % colors.length],
                                                                width: Dimensions.get('window').width / 3.6
                                                            }]}>
                                                        <View style={[Styles.alignCenter, Styles.p5]}>
                                                            {Services.returnExpenseIcons(list.key, 28, '#233167')}
                                                            {/*<FontAwesome name="address-card" size={24}*/}
                                                            {/*             color={'#233167'}/>*/}
                                                            <Text
                                                                style={[Styles.colorBlue, Styles.f16, Styles.ffLBold,]}>{list.key}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </List.Section>
                                </ScrollView>
                                :
                                <View style={[{height: 100}, Styles.mBtm10]}>
                                    <Text style={[Styles.ffLBlack, Styles.f16, {textAlign: 'center'}]}>There are no
                                        Categories</Text>
                                </View>
                            }
                        </View>
                        <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                            this.setState({reimbursementTypeModal: false})
                        }}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/*MODAL for Reimbursement Sub-Category Selection */}
                <Modal transparent={true}
                       visible={this.state.reimbursementSubTypeModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           this.setState({reimbursementSubTypeModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[[Styles.bw1, Styles.alignCenter, Styles.bgWhite, Styles.padV15, Styles.padH5, Styles.br40, Styles.bgWhite, {
                                width: Dimensions.get('window').width - 60,
                                height: this.state.reimbursementSubTypeList.length > 0 ? Dimensions.get('window').height / 1.8 : 200,
                            }]]}>
                            <View style={Styles.alignCenter}>
                                <Text style={[Styles.ffLBold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Expense
                                    Sub-Type</Text>
                            </View>
                            {this.state.reimbursementSubTypeList.length > 0 ?
                                <ScrollView style={{height: Dimensions.get('window').height / 2}}>
                                    <List.Section style={[Styles.row, Styles.flexWrap]}>
                                        {this.state.reimbursementSubTypeList.map((list, index) => {
                                            // let colors = ['#D6D1B4', '#F3F2F2', '#FFEE93', '#ccf6d8', '#F8F1EC', '#ECF3AB', '#F4EDAB'];
                                            let colors = ['#f7e39a', '#fece79', '#f8a555', '#f48270', '#f27f93', '#f192bb', '#e4b7d4', '#8c8bc4', '#90c9e2', '#a1d9d8', '#98d0a9', '#c0d682'];
                                            let fontColors = ['#8B814C', '#8B8682', '#EEC900', '#519a4d', '#BC7642', '#D1E231', '#D6C537'];
                                            return (
                                                <View
                                                    key={index}
                                                    style={this.state.reimbursementSubTypeValue === list.value ? {
                                                        backgroundColor: '#f3cc14', borderRadius: 10
                                                    } : null
                                                    }>
                                                    <TouchableOpacity
                                                        onPress={() => this.setState({
                                                            reimbursementSubTypeName: list.key,
                                                            reimbursementSubTypeValue: list.value,
                                                            reimbursementSubTypeModal: false,
                                                            expenseOtherReason: ''
                                                        })}
                                                        activeOpacity={0.9}
                                                        style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10,
                                                            {
                                                                backgroundColor: colors[index % colors.length],
                                                                width: Dimensions.get('window').width / 2.8,
                                                                // height: Dimensions.get('window').height / 6.5
                                                            }]}>
                                                        <View style={[Styles.alignCenter, Styles.p5]}>
                                                            {Services.returnExpenseIcons(list.key, 28, '#233167')}
                                                            {/*<FontAwesome name="address-card" size={24}*/}
                                                            {/*             color={'#233167'}/>*/}
                                                            {/*<Text style={[Styles.colorBlue, Styles.f14, Styles.ffMbold,]}>({list.siteCode})</Text>*/}
                                                            <Text
                                                                style={[Styles.colorBlue, Styles.f16, Styles.ffLBold,]}>{list.key}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </List.Section>
                                </ScrollView>
                                :
                                <View style={[{height: 100}, Styles.mBtm10]}>
                                    <Text style={[Styles.ffLBlack, Styles.f16, {textAlign: 'center'}]}>There are no
                                        Sub-Categories</Text>
                                </View>
                            }
                        </View>
                        <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                            this.setState({reimbursementSubTypeModal: false})
                        }}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
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
                                                                this.getSitesDetails(list.id)
                                                            })}
                                                            activeOpacity={0.9}
                                                            style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10,
                                                                {
                                                                    backgroundColor: colors[index % colors.length],
                                                                    width: Dimensions.get('window').width / 2.3,
                                                                    height: Dimensions.get('window').height / 6.5
                                                                }]}>
                                                            <View style={[Styles.p5, Styles.aslCenter]}>
                                                                {/*<FontAwesome name="address-card" size={30}*/}
                                                                {/*             style={[Styles.aslCenter,Styles.p3]}*/}
                                                                {/*             color={'#233167'}/>*/}
                                                                {/*<FastImage style={[Styles.img40]}*/}
                                                                {/*           source={LoadImages.siteWareHouse}/>*/}
                                                                <View style={[Styles.aslCenter, Styles.p3]}>
                                                                    {LoadSVG.addressDetailsIcon}
                                                                </View>
                                                                <Text
                                                                    style={[Styles.colorBlue, Styles.f18, Styles.ffLBold, Styles.aslCenter]}>{list.siteCode}</Text>
                                                                <Text
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


                {/*MODAL for Bussiness Unit */}
                <Modal transparent={true}
                       visible={this.state.bussinessUnitModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           this.setState({bussinessUnitModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[[Styles.bw1, Styles.aslCenter, Styles.bgWhite, Styles.padV15, Styles.padH10, Styles.br40, Styles.bgWhite, {
                                width: Dimensions.get('window').width - 20,
                                height: this.state.bussinessUnitList.length > 0 ? Dimensions.get('window').height / 1.6 : 200,
                            }]]}>
                            <View style={Styles.alignCenter}>
                                <Text style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select
                                    Bussiness Unit</Text>
                            </View>
                            {this.state.bussinessUnitList.length > 0 ?
                                <ScrollView style={{height: Dimensions.get('window').height / 2}}>
                                    <List.Section style={[Styles.row, Styles.flexWrap]}>
                                        {this.state.bussinessUnitList.map((list, index) => {
                                            let colors = ['#f7e39a', '#fece79', '#f8a555', '#f48270', '#f27f93', '#f192bb', '#e4b7d4', '#8c8bc4', '#90c9e2', '#a1d9d8', '#98d0a9', '#c0d682'];
                                            return (
                                                <View
                                                    key={index}
                                                    style={this.state.bussinessUnitValue === list.value ? {
                                                        backgroundColor: '#f3cc14', borderRadius: 10
                                                    } : null
                                                    }>
                                                    <TouchableOpacity
                                                        onPress={() => this.setState({
                                                            bussinessUnitValue: list.value,
                                                            bussinessUnitModal: false,
                                                        })}
                                                        activeOpacity={0.9}
                                                        style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10,
                                                            {
                                                                backgroundColor: colors[index % colors.length],
                                                                width: Dimensions.get('window').width / 2.5,
                                                                // height: Dimensions.get('window').height / 6.5
                                                            }]}>
                                                        <View style={[Styles.alignCenter, Styles.p5]}>
                                                            {/*{Services.returnExpenseIcons(list.key, 28, '#233167')}*/}
                                                            <MaterialIcons name="style" size={30}
                                                                           style={[Styles.aslCenter, Styles.p3]}
                                                                           color={'#233167'}/>
                                                            <Text
                                                                style={[Styles.colorBlue, Styles.f16, Styles.ffLBold,]}>{_.startCase(list.value)}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </List.Section>
                                </ScrollView>
                                :
                                <View style={[{height: 100}, Styles.mBtm10]}>
                                    <Text style={[Styles.ffMregular, Styles.f16, {textAlign: 'center'}]}>There are no
                                        Bussiness Units</Text>
                                </View>
                            }
                        </View>
                        <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                            this.setState({bussinessUnitModal: false})
                        }}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
                    </View>
                </Modal>


                {/*MODAL for State Selection */}
                <Modal transparent={true}
                       visible={this.state.stateSelectionModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           this.setState({stateSelectionModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[[Styles.bw1, Styles.aslCenter, Styles.bgWhite, Styles.p15, Styles.br40, Styles.bgWhite, {
                                width: Dimensions.get('window').width - 40,
                                height: this.state.statesList.length > 0 ? Dimensions.get('window').height / 1.3 : 200,
                            }]]}>
                            <View style={Styles.alignCenter}>
                                <Text style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm10]}>Select
                                    State</Text>
                            </View>
                            {this.state.statesList.length > 0 ?
                                <ScrollView style={{height: Dimensions.get('window').height / 2}}>
                                    <List.Section style={[Styles.row, Styles.flexWrap]}>
                                        {this.state.statesList.map((list, index) => {
                                            let colors = ['#f7e39a', '#fece79', '#f8a555', '#f48270', '#f27f93', '#f192bb', '#e4b7d4', '#8c8bc4', '#90c9e2', '#a1d9d8', '#98d0a9', '#c0d682'];
                                            return (
                                                <View
                                                    key={index}
                                                    style={this.state.stateSelectionName === list.name ? {
                                                        backgroundColor: '#f3cc14', borderRadius: 10
                                                    } : null
                                                    }>
                                                    <TouchableOpacity
                                                        onPress={() => this.setState({
                                                            stateSelectionName: list.name,
                                                            stateSelectionModal: false
                                                        })}
                                                        activeOpacity={0.9}
                                                        style={[Styles.OrdersScreenCardshadow, Styles.m10, Styles.br10,
                                                            {
                                                                backgroundColor: colors[index % colors.length],
                                                                width: Dimensions.get('window').width / 2.8,
                                                                // height: Dimensions.get('window').height / 6.5
                                                            }]}>
                                                        <View style={[Styles.alignCenter, Styles.p5]}>
                                                            <MaterialCommunityIcons name="city-variant" size={30}
                                                                                    style={[Styles.aslCenter, Styles.p3]}
                                                                                    color={'#233167'}/>
                                                            <Text
                                                                style={[Styles.colorBlue, Styles.f16, Styles.ffLBold,]}>{list.name}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </List.Section>
                                </ScrollView>
                                :
                                <View style={[{height: 100}, Styles.mBtm10]}>
                                    <Text style={[Styles.ffMregular, Styles.f16, {textAlign: 'center'}]}>There are no
                                        States</Text>
                                </View>
                            }
                        </View>
                        <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                            this.setState({stateSelectionModal: false})
                        }}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/*Modal for REJECT USER*/}
                <Modal
                    transparent={true}
                    visible={this.state.showRejectUserModal}
                    animationType='slide'
                    onRequestClose={() => {
                        this.setState({showRejectUserModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br30, Styles.mBtm20, {
                                width: Dimensions.get('window').width - 40,
                                height: Dimensions.get('window').height / 2.6
                            }]}>
                            {selectedExpense.attrs ?
                                <ScrollView style={[Styles.marH20]}>

                                    <View style={[Styles.mBtm10]}>
                                        {/*this.state.expenseCreatedName this.state.expenseCreatedRole*/}
                                        <Text
                                            // style={[Styles.f18, Styles.ffLBold, Styles.aslCenter, Styles.pTop10, Styles.colorBlue]}>{selectedExpense.attrs.createdBy}'s
                                            style={[Styles.f18, Styles.ffLBold, Styles.aslCenter, Styles.pTop10, Styles.colorBlue]}>{this.state.expenseCreatedName}'s
                                            Expense</Text>
                                        <Text
                                            style={[Styles.f18, Styles.ffLBold, Styles.aslCenter, Styles.padV5, Styles.colorBlue]}>Ticket
                                            No# {selectedExpense.expenseNumber}</Text>
                                        <View style={[Styles.row, Styles.mTop15]}>
                                            <Text
                                                style={[Styles.f18, Styles.colorBlue, Styles.ffLBold, Styles.aslCenter]}>Enter
                                                Reason to {_.startCase(_.toLower(this.state.selectedButton))}</Text>
                                        </View>
                                        <TextInput
                                            style={[Styles.marV5, Styles.brdrBtm1, Styles.colorBlue, Styles.f16, Styles.mBtm5]}
                                            placeholder={'Type here'}
                                            multiline={true}
                                            autoCompleteType='off'
                                            autoCapitalize="none"
                                            blurOnSubmit={false}
                                            value={this.state.rejectReason}
                                            returnKeyType="done"
                                            onSubmitEditing={() => {
                                                Keyboard.dismiss()
                                            }}
                                            onChangeText={(rejectReason) => this.setState({rejectReason}, () => {
                                                let resp = {};
                                                resp = Utils.isValidRejectReason(this.state.rejectReason);
                                                if (resp.status === true) {
                                                    this.setState({errorRejectReason: null});
                                                } else {
                                                    this.setState({errorRejectReason: resp.message});
                                                }
                                            })}/>
                                        {
                                            this.state.errorRejectReason ?
                                                <Text style={{
                                                    color: 'red',
                                                    fontFamily: 'Muli-Regular',
                                                    paddingLeft: 20
                                                }}>{this.state.errorRejectReason}</Text>
                                                :
                                                null
                                        }
                                    </View>

                                    <View style={[Styles.row, Styles.jSpaceBet, Styles.mTop10]}>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => this.setState({
                                                showRejectUserModal: false,
                                                rejectReason: ''
                                            })}
                                            style={[Styles.aslCenter, Styles.br10, Styles.bgBlk, Styles.marH5]}>
                                            <Text
                                                style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>CANCEL</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                let resp = {};
                                                resp = Utils.isValidRejectReason(this.state.rejectReason);
                                                if (resp.status === true) {
                                                    this.setState({errorRejectReason: null});
                                                    this.approveExpense(this.state.selectedButton)
                                                } else {
                                                    this.setState({errorRejectReason: resp.message});
                                                }
                                            }}
                                            style={[Styles.aslCenter, Styles.br10, Styles.bgDarkRed, Styles.marH5]}>
                                            <Text
                                                style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.p5, Styles.f16,]}>{this.state.selectedButton}</Text>
                                        </TouchableOpacity>
                                    </View>

                                </ScrollView>

                                : null
                            }

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
                                                titleStyle={[Styles.ffLBold]}/>
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
                        <TouchableOpacity onPress={() => {
                            this.setState({successModal: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            this.setState({successModal: false})
                        }}
                                          style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br15, {width: Dimensions.get('window').width - 100}]}>
                            <Card.Content style={[Styles.aslCenter, Styles.p5, Styles.pBtm18]}>
                                {LoadSVG.success_Icon}
                                <Title
                                    style={[Styles.colorGreen, Styles.f20, Styles.ffLBold, Styles.aslCenter]}>Woohoo!</Title>
                            </Card.Content>
                            <Card.Content style={[Styles.aslCenter, Styles.p5, Styles.pBtm18,]}>
                                {
                                    this.state.successTicketNo
                                        ?
                                        <Title style={[Styles.colorBlue, Styles.f20, Styles.ffLBold, Styles.aslCenter]}>Ticket
                                            No# {this.state.successTicketNo}</Title>
                                        :
                                        <Title
                                            style={[Styles.colorBlue, Styles.f20, Styles.ffLBold, Styles.aslCenter]}>{this.state.expenseUserName}'s
                                            Expense</Title>
                                }
                                <Title
                                    style={[Styles.colorBlue, Styles.f20, Styles.ffLBold, Styles.aslCenter]}>{this.state.successMessage}</Title>
                            </Card.Content>
                        </TouchableOpacity>
                        {/*<TouchableOpacity style={{marginTop: 20}} onPress={() => {*/}
                        {/*    this.setState({successModal: false})*/}
                        {/*}}>*/}
                        {/*    {LoadSVG.cancelIcon}*/}
                        {/*</TouchableOpacity>*/}
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
                            style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                width: Dimensions.get('window').width - 30,
                            }]]}>
                            <View style={[Styles.bgWhite, {height: Dimensions.get('window').height / 1.3}]}>
                                <ScrollView>
                                    <Text
                                        style={[Styles.ffLBlack, Styles.aslCenter, Styles.colorBlue, Styles.f20, Styles.m10, Styles.mBtm10]}>Select
                                        filters</Text>

                                    {/*SITES DROPDOWN*/}
                                    <Text
                                        style={[Styles.ffLBlack, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.mTop10, Styles.marH10]}>Select
                                        Site</Text>
                                    <Card style={[Styles.OrdersScreenCardshadow, Styles.marH10, Styles.mBtm10]}>
                                        {
                                            this.state.sitesFilterList
                                                ?
                                                <Picker
                                                    itemStyle={[Styles.ffLBlack, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                                    selectedValue={this.state.filterSiteId}
                                                    mode='dropdown'
                                                    onValueChange={(itemValue, itemIndex) => this.setState({filterSiteId: itemValue})}
                                                >
                                                    {this.state.sitesFilterList.map((item, index) => {
                                                        return (< Picker.Item
                                                            label={item.id ? item.attrs.siteLable : item.siteLable}
                                                            value={item.id}
                                                            key={index}/>);
                                                    })}
                                                </Picker>
                                                :
                                                null
                                        }
                                    </Card>

                                    {/*ROLES LIST*/}
                                    <Text
                                        style={[Styles.ffLBlack, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.mTop10, Styles.marH10]}>Select
                                        Role</Text>
                                    <Card style={[Styles.OrdersScreenCardshadow, Styles.marH10, Styles.mBtm10]}>
                                        {
                                            this.state.rolesFilterList
                                                ?
                                                <Picker
                                                    itemStyle={[Styles.ffLBlack, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                                    selectedValue={this.state.filterRoleId}
                                                    mode='dropdown'
                                                    onValueChange={(itemValue, itemIndex) => this.setState({filterRoleId: itemValue})}
                                                >
                                                    {
                                                        this.state.rolesFilterList.map((item, index) => {
                                                            return (< Picker.Item
                                                                // label={Services.returnRoleName(item.key)}
                                                                label={_.startCase(_.toLower(item.key))}
                                                                value={item.value}
                                                                key={index}/>);
                                                        })
                                                    }
                                                </Picker>
                                                :
                                                null
                                        }
                                    </Card>


                                    <Card.Actions
                                        style={[Styles.row, Styles.jSpaceArd, Styles.pTop10, Styles.pBtm5]}>
                                        <Button title='Reset Filters ' color={'#1e90ff'} compact={true}
                                                onPress={() => {
                                                    this.setState({
                                                        filtersSelected: false, finalSiteId: '', finalRole: '',
                                                        filterSiteId: '',
                                                        filterRoleId: '',
                                                        filtersModal: false
                                                    }, () => {
                                                        this.getExpensesList(this.state.selectedChip, 1)
                                                    })
                                                }}
                                        />
                                        <Button title=' Search '
                                                color={'#36A84C'}
                                                disabled={!(this.state.filterSiteId || this.state.filterRoleId)}
                                                compact={true}
                                                onPress={() => {
                                                    this.setState({
                                                        filtersSelected: true,
                                                        finalSiteId: this.state.filterSiteId,
                                                        finalRole: this.state.filterRoleId,
                                                        filtersModal: false
                                                    }, () => {
                                                        this.getExpensesList(this.state.selectedChip, 1)
                                                    })
                                                }}
                                        />
                                    </Card.Actions>


                                </ScrollView>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => {
                            this.setState({filtersModal: false})
                        }} style={{marginTop: 20}}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/*MODAL FOR MONTH_YEAR filter*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.dateFilterModal}
                    onRequestClose={() => {
                        this.setState({dateFilterModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({dateFilterModal: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br15, {width: Dimensions.get('window').width - 100}]}>
                            <MonthSelectorCalendar
                                onMonthTapped={(date) => {
                                    // let tempDate = Services.returnCalendarMonthYearNumber(date)
                                    let tempDate = new Date(date)
                                    // console.log('final tempDate', tempDate)
                                    this.setState({paidDateSelection: tempDate, dateFilterModal: false}, () => {
                                        this.getPaidExpenseList()
                                    })
                                }}
                            />
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
                                            this.imageUpload('CAMERA')
                                        })}}
                                        activeOpacity={0.7} style={[Styles.marV10,Styles.row,Styles.aitCenter]}>
                                        <FontAwesome name="camera" size={24} color="black" />
                                        <Text style={[Styles.f20,Styles.cBlk,Styles.ffLBold,Styles.padH10]}>Take Photo</Text>
                                    </TouchableOpacity>
                                    <Text style={[Styles.ffLBlack,Styles.brdrBtm1,Styles.mBtm15]}/>
                                    <TouchableOpacity
                                        onPress={()=>{this.setState({imageSelectionModal:false},()=>{
                                            this.imageUpload('LIBRARY')
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
    appbar: {
        backgroundColor: "white"
    },
    section: {
        backgroundColor: "white"
    },
    container: {
        flex: 1,
        backgroundColor: "white"
    },
    time: {
        marginTop: 20,
        marginRight: 10
    },
    item: {
        borderBottomColor: Colors.grey200,
        borderBottomWidth: 1
    }
});
