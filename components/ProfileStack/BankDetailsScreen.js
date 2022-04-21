import React, {Component} from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Text,
    Modal,
    Dimensions,
    TouchableOpacity,
    TextInput, Keyboard, Image, ActivityIndicator, Alert
} from "react-native";
import {Appbar, Card,} from 'react-native-paper';
import {CSpinner, LoadSVG, Styles} from "../common";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
// import FastImage from "react-native-fast-image";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import Services from "../common/Services";
import OfflineNotice from "../common/OfflineNotice";
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";
import Utils from "../common/Utils";
import Config from "../common/Config";
import AsyncStorage from "@react-native-community/async-storage";
import _ from "lodash";
import {CheckBox} from "react-native-elements";
import ImageZoom from 'react-native-image-pan-zoom';


const options = {
    title: 'Select Avatar',
    // customButtons: [{name: 'fb', title: 'Choose Photo from Facebook'}],
    storageOptions: {
        skipBackup: true,
        path: 'images',
    },
    maxWidth: 1200, maxHeight: 800,
};

export default class BankDetailsScreen extends Component {
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
            ShowAddBankDetailsModal: false,
            BankName: '',
            BankBranchName: '',
            AddressLine1: '',
            AddressLine2: '',
            AddressLine3: '',
            BeneficaryName: '',
            BranchAddress: '',
            UserID: '',
            canUpdateData: true,
            showButton: false,
            selectedProfileUserID: '',
            // checkProfileField:[],
            expanded: true,
            //DropDown states
            showIdentityProof: true,
            showAddressDetails: false,
            //TextInput states
            BankAccountNumber: '',
            VerifyBankAccountNumber: '',
            IFSCcode: '',
            AccountHolderName: '',
            //Error message States
            errorBankAccountNumber: null,
            errorVerifyBankAccountNumber: null,
            errorIFSCcode: null,
            errorBankName: null,
            errorAccountHolderName: null,
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
            panVerifiedFirst: false, panDoc: '', panImageURL: '', userPanFound: false,
            BeneficiaryBankProofImageURL: '', BeneficiaryAadharImageURL: '',
            imagePreview: false, imagePreviewURL: '',imageRotate:'0',
            imageSelectionModal:false
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
            UserID: self.props.navigation.state.params.selectedProfileUserID,
            UserFlow: self.props.navigation.state.params.UserFlow,
        }, () => {
            self.getUserBankDetails();
        });
    };

    errorHandling(error) {
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
            } else if (error.response.status === 413) {
                self.setState({spinnerBool: false}, () => {
                    Utils.dialogBox('Request Entity Too Large', '');
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

    errorHandlingUpdatedChecks(error) {
        // console.log('errorHandlingUpdatedChecks error', error, error.response);
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
                Utils.dialogBox(error.response.data[0], '');
                // Alert.alert('', error.response.data);

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
    getUserBankDetails() {
        const self = this;
        const UserID = this.state.UserID;
        const apiUrl = Config.routes.BASE_URL + Config.routes.USER_BANK_ACCOUNT_DETAILS + '?&userId=' + UserID;
        const body = '';
        AsyncStorage.getItem('Whizzard:userStatus').then((userStatus) => {
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                {
                    userStatus === 'ACTIVATED'
                        ?
                        userRole === '45'
                            ?
                            self.setState({loggedUserRole: userRole, canEditTextInput: true})
                            :
                            self.setState({
                                loggedUserRole: userRole,
                                canEditTextInput: this.state.UserFlow === 'SITE_ADMIN' && userRole === '45'
                            })
                        :
                        self.setState({loggedUserRole: userRole, canEditTextInput: true})
                }
            });
        });
        this.setState({
            spinnerBool: true,
            PassbookLoading: true,
            otherProofLoading: true,
            PANLoading: true,
            BenAadharLoading: true,
            BenBankProofLoading: true
        }, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                // console.log("GET_BANK_ACCOUNT_DETAILS Res", response);
                if (response) {
                    let data = response.data;
                    // console.log('get ALL details in bank', response.data);
                    // console.log('get bank details canUpdateData', self.state.canUpdateData);
                    // console.log('get bank details userPanFound', self.state.userPanFound);

                    if (data.accountNumber && data.ifscCode && data.bankName && data.beneficiaryName && data.accountType && data.branchName && data.branchAddress) {
                        self.setState({showButton: false})
                    } else {
                        self.setState({showButton: true})
                    }

                    if (self.state.canUpdateData) {
                        self.setState({
                            spinnerBool: false, MyProfileResp: data,
                            BankAccountNumber: data.accountNumber ? data.accountNumber : '',
                            VerifyBankAccountNumber: data.accountNumber ? data.accountNumber : '',
                            IFSCcode: data.ifscCode ? _.toUpper(data.ifscCode) : '',
                            BankName: data.bankName ? data.bankName : '',
                            AccountHolderName: data.beneficiaryName ? data.beneficiaryName : '',
                            AccountType: data.accountType ? data.accountType : '',
                            BankBranchName: data.branchName ? data.branchName : '',
                            BranchAddress: data.branchAddress ? data.branchAddress : '',
                            checkProfileField: data,
                            panNumberDetails: data.beneficiaryInfo,
                            ownerInfo: data.beneficiary,
                        });

                        self.checkBeneficaryDetails(data.beneficiaryInfo)

                        if (data.ifscCode) {
                            self.checkIFSCCode(data.ifscCode)
                        }

                    } else {
                        self.setState({
                            spinnerBool: false, MyProfileResp: data,
                        });
                    }
                    if (self.state.userPanFound && self.state.canUpdateData === false) {
                        self.checkBeneficaryDetails(data.beneficiaryInfo)
                    }
                    const onFocusPendingItem = self.props.navigation.state.params.onFocusPendingItem;
                    if (onFocusPendingItem) {
                        self.checkPendingItem(onFocusPendingItem);
                    }
                }
            }, function (error) {
                // console.log("BANK getUserBankDetails error", error, error.response);
                self.errorHandling(error)
            });
        });
    }

    checkPendingItem(onFocusPendingItem) {
        // console.log('bank onFocusPendingItem', onFocusPendingItem);
        this.setState({ShowAddBankDetailsModal: true})
    }

    checkBeneficaryDetails(details) {
        const self = this;
        // console.log('checkBeneficaryDetails fun start details', details);
        const beneficiaryData = details
        self.setState({
            spinnerBool: false,
            panNumberDetails: beneficiaryData,
            OwnerBeneficaryId: beneficiaryData.id,
            OwnerPanCardNumber: beneficiaryData.panNumber,
            OwnerAccountName: beneficiaryData.beneficiaryName,
            OwnerAadharCardNumber: beneficiaryData.aadharCardNumber,
            OwnerBankAccountNumber: beneficiaryData.bankAccountNumber,
            OwnerPanInfo: beneficiaryData.panUploadInfo,
            OwnerBankIFSCcode: beneficiaryData.ifscCode,
            panImageURL: beneficiaryData.panUploadInfo ? beneficiaryData.panUploadInfo.panUploadUrl : '',
            panDoc: beneficiaryData.panUploadInfo,
            userPanFound: beneficiaryData.id ? true : false,
            BeneficiaryAadharImageURL: beneficiaryData.aadharUploadInfo ? beneficiaryData.aadharUploadInfo.aadharUploadUrl : '',
            BeneficiaryBankProofImageURL: beneficiaryData.bankUploadInfo ? beneficiaryData.bankUploadInfo.bankUploadUrl : '',
            benAadharPicFormData: beneficiaryData.aadharUploadInfo,
            benBankProofPicFormData: beneficiaryData.bankUploadInfo
        })
        if (beneficiaryData.ifscCode) {
            self.checkBeneficaryIFSCCode(beneficiaryData.ifscCode)
        }

    }


    //VALIDATING BANK ACCOUNT DETAILS
    validateBankInformation() {
        let resp;
        let result = {};
        result.userId = this.state.UserID;
        this.setState({mandatoryChecks: false})
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
                        result.accountNumber = resp.message;
                        this.setState({errorBankAccountNumber: null});
                        resp = Utils.isValidCompareBankAccountNumber(this.state.BankAccountNumber, this.state.VerifyBankAccountNumber);
                        if (resp.status === true) {
                            this.setState({errorVerifyBankAccountNumber: null});
                            resp = Utils.isValidBeneficiary(this.state.AccountHolderName);
                            if (resp.status === true) {
                                result.beneficiaryName = resp.message;
                                this.setState({errorAccountHolderName: null});
                                resp = Utils.isValueSelected(this.state.MyProfileResp.bankInfo, 'Please upload Bank Passbook Image');
                                if (resp.status === true) {
                                    result.accountType = this.state.AccountType
                                    result.branchName = this.state.BankBranchName
                                    result.branchAddress = this.state.BranchAddress

                                    this.setState({mandatoryChecks: true})
                                    this.updateBankAccountDetails();

                                } else {
                                    Utils.dialogBox(resp.message, '');
                                }
                            } else {
                                this.AccountHolderName.focus();
                                this.setState({errorAccountHolderName: resp.message});
                                // Utils.dialogBox(resp.message, '');
                            }
                        } else {
                            this.VerifyBankAccountNumber.focus();
                            this.setState({errorVerifyBankAccountNumber: resp.message});
                            // Utils.dialogBox(resp.message, '');
                        }
                    } else {
                        this.BankAccountNumber.focus();
                        this.setState({errorBankAccountNumber: resp.message});
                        // Utils.dialogBox(resp.message, '');
                    }
                } else {
                    this.BankName.focus();
                    this.setState({errorBankName: resp.message});
                    // Utils.dialogBox(resp.message, '');
                }
            } else {
                this.IFSCcode.focus();
                // this.checkBeneficaryIFSCCode(this.state.OwnerBankIFSCcode)
                this.setState({errorIFSCcode: 'Please enter Verified IFSC Code'});
            }
        } else {
            // this.IFSCcodeStart.focus();
            this.IFSCcode.focus();
            this.setState({errorIFSCcode: resp.message});
            // Utils.dialogBox(resp.message, '');
        }
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

                            resp = Utils.isValueSelected(this.state.panDoc, 'Please upload Beneficiary PAN Image');
                            if (resp.status === true) {

                                result.beneficiaryDetails.aadharCardNumber = this.state.OwnerAadharCardNumber;
                                result.beneficiaryDetails.panCardPhoto = this.state.panDoc;

                                if (this.state.userPanFound) {
                                    resp = Utils.isValueSelected(this.state.BeneficiaryBankProofImageURL, 'Please upload Beneficiary Bank Proof Image');
                                    if (resp.status === true) {
                                        this.setState({mandatoryChecks: true})
                                        if (this.state.IFSCcode || this.state.BankName || this.state.BankAccountNumber || this.state.VerifyBankAccountNumber || this.state.AccountHolderName) {
                                            // console.log('check inside ben bank proof')
                                            this.validateBankInformation();
                                        } else {
                                            this.updateBankAccountDetails();
                                        }
                                    } else {
                                        Utils.dialogBox(resp.message, '')
                                    }
                                } else {
                                    this.setState({mandatoryChecks: true})
                                    if (this.state.IFSCcode || this.state.BankName || this.state.BankAccountNumber || this.state.VerifyBankAccountNumber || this.state.AccountHolderName) {
                                        // console.log('check inside')
                                        this.validateBankInformation();
                                    } else {
                                        this.updateBankAccountDetails();
                                    }
                                }


                            } else {
                                Utils.dialogBox(resp.message, '')
                            }
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
                        self.setState({panDoc: formData, panImageURL: image.path, spinnerBool: false});
                        Utils.dialogBox('Beneficiary PAN uploaded successfully', '');
                    } else {
                        self.uploadBankImages(data, formData)
                    }
        })
    };


    uploadBankImages(data, formData) {
        const self = this;
        let INFO;
        if (data === 'BankPassbookUpload') {
            INFO = Config.routes.UPLOAD_BANK_DOCUMENT + '?&userId=' + self.state.UserID;
        } else if (data === 'BankOtherProofUpload') {
            INFO = Config.routes.OTHER_BANK_DOCUMENT + '?&userId=' + self.state.UserID;
        } else if (data === 'BeneficiaryBankProofUpload') {
            INFO = Config.routes.BENEFICIARY_BANK_PROOF_UPLOAD + '?&beneficiaryId=' + self.state.OwnerBeneficaryId;
        } else if (data === 'BeneficiaryAadharUpload') {
            INFO = Config.routes.BENEFICIARY_AADHAR_PIC_UPLOAD + '?&beneficiaryId=' + self.state.OwnerBeneficaryId;
        } else if (data === 'panCard') {
            INFO = Config.routes.BENEFICIARY_PAN_PIC_UPLOAD + '?&beneficiaryId=' + self.state.OwnerBeneficaryId;
        }
        let imageUploadURL = Config.routes.BASE_URL + INFO;
        const body = formData;
        // console.log(' image upload url', imageUploadURL, 'body===', body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthProfileHTTPRequest(imageUploadURL, 'POST', body, function (response) {
                // console.log("bank DocumentUpload resp", response);
                if (response.status === 200) {
                    // if (data === 'panCard' || data === 'BeneficiaryBankProofUpload' || data === 'BeneficiaryAadharUpload') {
                    //     self.checkBeneficaryDetails(self.state.MyProfileResp.beneficiaryInfo)
                    // } else {
                    //     self.getUserBankDetails();
                    // }

                    self.setState({spinnerBool: false, canUpdateData: false}, () => {
                        Utils.dialogBox("Uploaded successfully", '',)
                        self.getUserBankDetails();
                    })
                }
            }, function (error) {
                // console.log("bank DocumentUpload   img error", error.response, error);
                self.errorHandling(error)
            });
        });
    }

    deleteUploadedImage(fieldName, fileName) {
        const self = this;
        // console.log("fieldName", fieldName, fileName);
        const deleteImageURL = Config.routes.BASE_URL + Config.routes.DELETE_UPLOADED_IMAGE + '?fileName=' + fileName + '&fieldName=' + fieldName + '&userId=' + self.state.UserID;
        const body = {};
        // console.log('deleteImageURL', deleteImageURL);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(deleteImageURL, 'POST', body, function (response) {
                // console.log("deleteUploadedImageRes", response);
                if (response) {
                    self.setState({spinnerBool: false, canUpdateData: false}, () => {
                        Utils.dialogBox("Deleted successfully", '');
                        self.getUserBankDetails();
                    });
                }
            }, function (error) {
                // console.log(" bank DocumentUpload delete pic error", error.response);
                self.errorHandling(error)
            });
        });
    }


    //API CALL TO UPDATE PROFILE DETAILS== POST
    updateBankAccountDetails() {
        const self = this;
        const beneficiaryName = self.state.ownerInfo ? self.state.OwnerAccountName : '';
        const beneficiaryPanNumber = self.state.ownerInfo ? self.state.OwnerPanCardNumber : '';
        const beneficiaryAadharCardNumber = self.state.ownerInfo ? self.state.OwnerAadharCardNumber ? self.state.OwnerAadharCardNumber : '' : '';
        const beneficiaryBankAccountNumber = self.state.ownerInfo ? self.state.OwnerBankAccountNumber : '';
        const beneficiaryIfscCode = self.state.ownerInfo ? self.state.OwnerBankIFSCcode : '';

        const userId = self.state.UserID;
        const beneficiaryId = self.state.ownerInfo ? self.state.OwnerBeneficaryId === null ? '' : self.state.OwnerBeneficaryId : '';
        const isBeneficiary = self.state.ownerInfo;

        const ifscCode = self.state.IFSCcode ? self.state.IFSCcode : '';
        const accountNumber = self.state.BankAccountNumber ? self.state.BankAccountNumber : '';
        const bankName = self.state.BankName ? self.state.BankName : '';
        const accHolderName = self.state.AccountHolderName ? self.state.AccountHolderName : '';
        const accountType = self.state.AccountType ? self.state.AccountType : '';
        const branchName = self.state.BankBranchName ? self.state.BankBranchName : '';
        const branchAddress = self.state.BranchAddress ? self.state.BranchAddress : '';

        const apiURL = Config.routes.BASE_URL + Config.routes.UPDATE_BANK_ACCOUNT_DETAILS +
            '?&beneficiaryName=' + beneficiaryName + '&beneficiaryPanNumber=' + beneficiaryPanNumber + '&beneficiaryAadharCardNumber=' + beneficiaryAadharCardNumber
            + '&beneficiaryBankAccountNumber=' + beneficiaryBankAccountNumber + '&beneficiaryIfscCode=' + beneficiaryIfscCode
            + '&userId=' + userId + '&beneficiaryId=' + beneficiaryId + '&isBeneficiary=' + isBeneficiary
            + '&ifscCode=' + ifscCode + '&accountNumber=' + accountNumber + '&bankName=' + bankName + '&accHolderName=' + accHolderName
            + '&accountType=' + accountType + '&branchName=' + branchName + '&branchAddress=' + branchAddress;

        const body = self.state.ownerInfo ? self.state.panDoc : '';
        // console.log('bank update apiURL', apiURL, 'body==', body);
        this.setState({spinnerBool: true, mandatoryChecks: true}, () => {
            Services.AuthHTTPRequest(apiURL, 'POST', body, function (response) {
                // console.log('update BankAccount Details resp ', response);
                if (response.status === 200) {
                    // console.log('bank updated resp200', response.data);
                    // console.log('ress image', response);
                    self.setState({
                        spinnerBool: false,
                        canUpdateData: true,
                        errorBankAccountNumber: null,
                        errorVerifyBankAccountNumber: null,
                        errorIFSCcode: null,
                        errorBankName: null,
                        errorAccountHolderName: null,
                    }, () => {
                        Utils.dialogBox('Bank Details Updated', '');
                        self.getUserBankDetails();
                    });
                }
            }, function (error) {
                // console.log('update BankAccount Details error', error.response);
                // self.setState({ShowAddBankDetailsModal: false})
                self.errorHandlingUpdatedChecks(error)

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
                console.log("check IFSCCode error", error, error.response);
                self.errorHandling(error)
            });
        });
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
                console.log("check Beneficary IFSCCode error", error, error.response);
                self.errorHandling(error)
            });
        });
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
                    console.log('get pan user details resp200', response.data);
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
                                                panDoc: '',
                                                userPanFound: false,
                                                BeneficiaryAadharImageURL: '',
                                                BeneficiaryBankProofImageURL: '',
                                                benAadharPicFormData: '',
                                                benBankProofPicFormData: ''
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
                                                panDoc: panNumberStatus.panUploadInfo,
                                                userPanFound: true,
                                                BeneficiaryAadharImageURL: panNumberStatus.aadharUploadInfo ? panNumberStatus.aadharUploadInfo.aadharUploadUrl : '',
                                                BeneficiaryBankProofImageURL: panNumberStatus.bankUploadInfo ? panNumberStatus.bankUploadInfo.bankUploadUrl : '',
                                                benAadharPicFormData: panNumberStatus.aadharUploadInfo,
                                                benBankProofPicFormData: panNumberStatus.bankUploadInfo
                                            })
                                        }
                                    }
                                ]
                            )
                        }

                        self.checkBeneficaryDetails(panNumberStatus)


                        // if (panNumberStatus.ifscCode) {
                        //     self.checkBeneficaryIFSCCode(panNumberStatus.ifscCode)
                        // }

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
                            panDoc: '',
                            userPanFound: false,
                            BeneficiaryAadharImageURL: '',
                            BeneficiaryBankProofImageURL: '',
                            benAadharPicFormData: '',
                            benBankProofPicFormData: ''
                        })
                    }
                    self.setState({spinnerBool: false, panNumberStatus: panNumberStatus});
                }
            }, function (error) {
                console.log("error", error, error.response);
                self.errorHandling(error)
            });
        });
    }

    checkBankDetails() {
        if ( this.state.UserFlow === 'NORMAL'|| this.state.canEditTextInput) {
            if (this.state.ownerInfo) {
                if (this.state.OwnerPanCardNumber && this.state.OwnerBankIFSCcode && this.state.OwnerAccountName && this.state.OwnerBankAccountNumber
                    && this.state.panDoc && this.state.BeneficiaryBankProofImageURL) {
                    this.setState({ShowAddBankDetailsModal: false})
                } else {
                    Alert.alert('', 'Please complete all the fields under Beneficiary and click on Save to avoid loosing data');
                }
            } else {
                this.setState({ShowAddBankDetailsModal: false})
            }
        } else {
            this.setState({ShowAddBankDetailsModal: false})
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

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    render() {
        const {checkProfileField, canEditTextInput, MyProfileResp, panNumberDetails, userPanFound} = this.state;
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <Appbar.Header style={[Styles.defaultbgColor, {borderBottomWidth: 0}]}>
                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                    <Appbar.Content title="Bank Details" titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                </Appbar.Header>

                {/*PROFILE STATUS VIEW*/}
                {Services.showProfileScreensStatus('BANK')}

                <ScrollView>
                    <View style={[Styles.p10]}>
                        <Card style={[Styles.mBtm15, Styles.ProfileScreenCardshadow]}>
                            <Card.Title title="Account Information"
                                        titleStyle={[Styles.ffMbold, Styles.f18]}
                                        left={() => <MaterialCommunityIcons name="check-circle" size={32}
                                                                            color="#b3b3b3"/>}
                                        right={() =>
                                            <MaterialIcons name="chevron-right" size={32} color="#000"
                                                           style={[Styles.bgLWhite, Styles.br15, Styles.mRt10]}
                                                           onPress={() => MyProfileResp
                                                               ?
                                                               this.setState({ShowAddBankDetailsModal: true}, () => {
                                                                   this.checkBeneficaryDetails(MyProfileResp.beneficiaryInfo)
                                                               }) : null
                                                           }/>
                                        }
                            />
                        </Card>
                    </View>
                </ScrollView>


                {/*BANK DETAILS Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.ShowAddBankDetailsModal}
                    onRequestClose={() => {
                        // this.setState({ShowAddBankDetailsModal: false})
                        this.checkBankDetails()
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                                <Appbar.Content title="Account Information"
                                                titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() =>
                                                            // this.setState({ShowAddBankDetailsModal: false})
                                                            this.checkBankDetails()
                                                        }/>
                            </Appbar.Header>
                            {
                                MyProfileResp
                                    ?
                                    <View style={[Styles.flex1]}>
                                        <ScrollView style={[Styles.p10]}>

                                            <View style={[Styles.mBtm20]}>

                                                {/*BANK DETAILS VIEW*/}
                                                <View>

                                                    {/*IFSC CODE*/}
                                                    <View>
                                                        <View style={[Styles.row, Styles.mTop15]}>
                                                            <View
                                                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.ifscIcon}</View>
                                                            <Text
                                                                style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter,
                                                                    this.state.IFSCverified === false ? Styles.colorBlue : canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}>Bank's
                                                                IFSC Code{Services.returnRedStart()}</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.row, Styles.mRt30, Styles.mLt40]}>

                                                            <TextInput
                                                                style={[
                                                                    {textTransform: 'uppercase'},
                                                                    Styles.bw1, Styles.bcAsh, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.padH15,
                                                                    this.state.IFSCverified === false ? Styles.colorBlue : canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}
                                                                autoCapitalize='characters'
                                                                placeholder='A B C D 1 2 3 4 5 6 7'
                                                                mode='outlined'
                                                                editable={this.state.IFSCverified === false ? true
                                                                    :
                                                                    canEditTextInput}

                                                                autoCompleteType='off'
                                                                // placeholderTextColor='#233167'
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
                                                            {
                                                                canEditTextInput === true
                                                                    ?
                                                                    <TouchableOpacity
                                                                        onPress={() => this.checkIFSCCode(this.state.IFSCcode)}
                                                                        disabled={!this.state.IFSCcode ? true :
                                                                            this.state.errorIFSCcode ? true : false}
                                                                        style={[Styles.br5, Styles.aslCenter, Styles.mLt10, this.state.errorIFSCcode ? Styles.bgDisabled : Styles.bgBlk]}>
                                                                        <Text
                                                                            style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMextrabold, Styles.cWhite,]}>Validate</Text>
                                                                    </TouchableOpacity>
                                                                    :
                                                                    null
                                                            }

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
                                                        <View style={[Styles.row, Styles.mTop15]}>
                                                            <View
                                                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.bankNew}</View>
                                                            <Text
                                                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter,
                                                                    canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}>Bank
                                                                Name{Services.returnRedStart()}</Text>
                                                        </View>
                                                        <TextInput
                                                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.f16,
                                                                canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}
                                                            placeholder='Enter Bank Name'
                                                            autoCompleteType='off'
                                                            editable={canEditTextInput}
                                                            autoCapitalize="none"
                                                            blurOnSubmit={false}
                                                            // keyboardType='numeric'
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
                                                        <View style={[Styles.row, Styles.mTop15]}>
                                                            <View
                                                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.bankNew}</View>
                                                            <Text
                                                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter,
                                                                    canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}>Bank's
                                                                Branch Name </Text>
                                                        </View>
                                                        <TextInput
                                                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.f16,
                                                                canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}
                                                            placeholder='Enter Bank Branch Name'
                                                            autoCompleteType='off'
                                                            editable={canEditTextInput}
                                                            autoCapitalize="none"
                                                            blurOnSubmit={false}
                                                            // keyboardType='numeric'
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
                                                        <View style={[Styles.row, Styles.mTop15]}>
                                                            <View
                                                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.bankNew}</View>
                                                            <Text
                                                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter,
                                                                    canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}>Branch's
                                                                Address </Text>
                                                        </View>
                                                        <TextInput
                                                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.f16,
                                                                canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}
                                                            placeholder='Enter Branch Address'
                                                            multiline={true}
                                                            autoCompleteType='off'
                                                            editable={canEditTextInput}
                                                            autoCapitalize="none"
                                                            blurOnSubmit={false}
                                                            // keyboardType='numeric'
                                                            value={this.state.BranchAddress}
                                                            returnKeyType="done"
                                                            ref={(input) => {
                                                                this.BranchAddress = input;
                                                            }}
                                                            onSubmitEditing={() => {
                                                                Keyboard.dismiss()
                                                            }}
                                                            onChangeText={(BranchAddress) => this.setState({BranchAddress})}/>
                                                        {/*<TextInput*/}
                                                        {/*    multiline={true}*/}
                                                        {/*    numberOfLines={4}*/}
                                                        {/*    style={[Styles.bgWhite, Styles.f18, Styles.bw1, Styles.bcAsh, Styles.m15, ]}*/}
                                                        {/*    label='Branch Address'*/}
                                                        {/*    value={this.state.BranchAddress}*/}
                                                        {/*    onChangeText={BranchAddress => this.setState({BranchAddress})}*/}
                                                        {/*/>*/}
                                                    </View>

                                                    {/*ACCOUNT NUMBER*/}
                                                    <View>
                                                        <View style={[Styles.row, Styles.mTop15]}>
                                                            <View
                                                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.bankAccIcon}</View>
                                                            <Text
                                                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter,
                                                                    canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}>Account
                                                                Number{Services.returnRedStart()}</Text>
                                                        </View>
                                                        <TextInput
                                                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.f16,
                                                                canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}
                                                            placeholder='Enter account number'
                                                            autoCompleteType='off'
                                                            editable={canEditTextInput}
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
                                                        <View style={[Styles.row, Styles.mTop15]}>
                                                            <View
                                                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.bankAccIcon}</View>
                                                            <Text
                                                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter,
                                                                    canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}>Re-Write
                                                                Account Number{Services.returnRedStart()}</Text>
                                                        </View>
                                                        <TextInput
                                                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.f16,
                                                                canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}
                                                            placeholder='Confirm account number'
                                                            autoCompleteType='off'
                                                            editable={canEditTextInput}
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

                                                    {/*ACCOUNT TYPE*/}
                                                    <View>
                                                        <View style={[Styles.row, Styles.mTop15]}>
                                                            <View
                                                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.bankAccIcon}</View>
                                                            <Text
                                                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter,
                                                                    canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}>Account
                                                                Type</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.row, Styles.marV10, Styles.mRt30, Styles.mLt40,]}>
                                                            <TouchableOpacity
                                                                style={[Styles.bw1, Styles.br20, Styles.aslCenter, this.state.AccountType === 'Savings' ? [Styles.bcRed, Styles.bgRed] : [Styles.bcBlk, Styles.bgWhite]]}
                                                                disabled={!canEditTextInput}
                                                                onPress={() => {
                                                                    this.setState({AccountType: 'Savings'})
                                                                }}>
                                                                <Text
                                                                    style={[Styles.f16, Styles.padH10, Styles.padV5, this.state.AccountType === 'Savings' ? Styles.cWhite : canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue, Styles.ffMbold]}>Savings</Text>
                                                            </TouchableOpacity>

                                                            <TouchableOpacity
                                                                style={[Styles.marH20, Styles.bw1, Styles.br20, Styles.aslCenter, this.state.AccountType === 'Current' ? [Styles.bcRed, Styles.bgRed] : [Styles.bcBlk, Styles.bgWhite]]}
                                                                disabled={!canEditTextInput}
                                                                onPress={() => {
                                                                    this.setState({AccountType: 'Current'})
                                                                }}>
                                                                <Text
                                                                    style={[Styles.f16, Styles.padH10, Styles.padV5, this.state.AccountType === 'Current' ? Styles.cWhite : canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue, Styles.ffMbold]}>Current</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>

                                                    {/*Upload BANK PROOF PIC*/}
                                                    <View>
                                                        <View style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                            <View style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                            <TouchableOpacity
                                                                disabled={!canEditTextInput}
                                                                onPress={() => {
                                                                    // this.bankDocumentUpload('BankPassbookUpload')
                                                                    this.setState({imageType:'BankPassbookUpload',imageSelectionModal:true})
                                                                }}
                                                                style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                <Text
                                                                    style={[Styles.ffMregular, canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue, Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                    Bank Proof Pic{Services.returnRedStart()}</Text>
                                                            </TouchableOpacity>
                                                            {
                                                                canEditTextInput === false
                                                                    ?
                                                                    null
                                                                    :
                                                                    MyProfileResp.bankInfo
                                                                        ?
                                                                        <TouchableOpacity
                                                                            onPress={() => {
                                                                                this.deleteUploadedImage('bankInfo', MyProfileResp.bankInfo.fileName)
                                                                            }}
                                                                            style={[Styles.bw1, Styles.br5, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                            <Text
                                                                                style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMextrabold, Styles.cWhite]}>Delete</Text>
                                                                        </TouchableOpacity>
                                                                        :
                                                                        <Text
                                                                            style={[Styles.marH10, Styles.aslCenter, Styles.cAsh, Styles.ffMregular]}>ex:Pass-book</Text>
                                                            }
                                                        </View>
                                                        {
                                                            MyProfileResp.bankInfo
                                                                ?
                                                                <View
                                                                    style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                    {/*<Image*/}
                                                                    {/*    onLoadStart={() => this.setState({PassbookLoading: true})}*/}
                                                                    {/*    onLoadEnd={() => this.setState({PassbookLoading: false})}*/}
                                                                    {/*    style={[{*/}
                                                                    {/*        width: Dimensions.get('window').width / 2,*/}
                                                                    {/*        height: 120*/}
                                                                    {/*    }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}*/}
                                                                    {/*    source={MyProfileResp.bankInfo.bankUploadUrl ? {uri: MyProfileResp.bankInfo.bankUploadUrl} : null}*/}
                                                                    {/*/>*/}

                                                                    <TouchableOpacity
                                                                        style={[Styles.row, Styles.aslCenter]}
                                                                        onPress={() => {
                                                                             this.setState({
                                                                                imagePreview: true,
                                                                                imagePreviewURL: MyProfileResp.bankInfo.bankUploadUrl  ? MyProfileResp.bankInfo.bankUploadUrl  : ''
                                                                            })
                                                                        }}>
                                                                        <Image
                                                                            onLoadStart={() => this.setState({PassbookLoading: true})}
                                                                            onLoadEnd={() => this.setState({PassbookLoading: false})}
                                                                            style={[{
                                                                                width: Dimensions.get('window').width / 2,
                                                                                height: 120
                                                                            }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                            source={MyProfileResp.bankInfo.bankUploadUrl  ? {uri: MyProfileResp.bankInfo.bankUploadUrl } : null}
                                                                        />
                                                                        <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                                    </TouchableOpacity>
                                                                    <ActivityIndicator
                                                                        style={[Styles.ImageUploadActivityIndicator]}
                                                                        animating={this.state.PassbookLoading}
                                                                    />
                                                                </View>
                                                                :
                                                                null
                                                        }
                                                    </View>

                                                    {/*Upload Another PROOF*/}
                                                    {
                                                        MyProfileResp.bankInfo || MyProfileResp.otherBankProofDetails
                                                            ?
                                                            <View>
                                                                <View
                                                                    style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                                    <View
                                                                        style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                                    <TouchableOpacity
                                                                        disabled={!canEditTextInput}
                                                                        onPress={() => {
                                                                            // this.bankDocumentUpload('BankOtherProofUpload')
                                                                            this.setState({imageType:'BankOtherProofUpload',imageSelectionModal:true})
                                                                        }}
                                                                        style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                        <Text
                                                                            style={[Styles.ffMregular, canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue, Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                            Other Proof Pic</Text>
                                                                    </TouchableOpacity>
                                                                    {
                                                                        canEditTextInput === false
                                                                            ?
                                                                            null
                                                                            :
                                                                            MyProfileResp.otherBankProofDetails
                                                                                ?
                                                                                <TouchableOpacity
                                                                                    onPress={() => {
                                                                                        this.deleteUploadedImage('otherBankProofDetails', MyProfileResp.otherBankProofDetails.fileName)
                                                                                    }}
                                                                                    style={[Styles.bw1, Styles.br5, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                                    <Text
                                                                                        style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMextrabold, Styles.cWhite]}>Delete</Text>
                                                                                </TouchableOpacity>
                                                                                :
                                                                                <Text
                                                                                    style={[Styles.marH10, Styles.aslCenter, Styles.cAsh, Styles.ffMregular]}>ex:cheque</Text>
                                                                    }
                                                                </View>
                                                                {
                                                                    MyProfileResp.otherBankProofDetails
                                                                        ?
                                                                        <View
                                                                            style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50,}]}>
                                                                            {/*<Image*/}
                                                                            {/*    onLoadStart={() => this.setState({otherProofLoading: true})}*/}
                                                                            {/*    onLoadEnd={() => this.setState({otherProofLoading: false})}*/}
                                                                            {/*    style={[{*/}
                                                                            {/*        width: Dimensions.get('window').width / 2,*/}
                                                                            {/*        height: 120*/}
                                                                            {/*    }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}*/}
                                                                            {/*    source={MyProfileResp.otherBankProofDetails.otherBankProofsUploadUrl ? {uri: MyProfileResp.otherBankProofDetails.otherBankProofsUploadUrl} : null}*/}
                                                                            {/*/>*/}
                                                                            <TouchableOpacity
                                                                                style={[Styles.row, Styles.aslCenter]}
                                                                                onPress={() => {
                                                                                    this.setState({
                                                                                        imagePreview: true,
                                                                                        imagePreviewURL: MyProfileResp.otherBankProofDetails.otherBankProofsUploadUrl ? MyProfileResp.otherBankProofDetails.otherBankProofsUploadUrl : ''
                                                                                    })
                                                                                }}>
                                                                                <Image
                                                                                    onLoadStart={() => this.setState({otherProofLoading: true})}
                                                                                    onLoadEnd={() => this.setState({otherProofLoading: false})}
                                                                                    style={[{
                                                                                        width: Dimensions.get('window').width / 2,
                                                                                        height: 120
                                                                                    }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                    source={MyProfileResp.otherBankProofDetails.otherBankProofsUploadUrl ? {uri: MyProfileResp.otherBankProofDetails.otherBankProofsUploadUrl} : null}
                                                                                />
                                                                                <MaterialCommunityIcons
                                                                                    name="resize"
                                                                                    size={24}
                                                                                    color="black"/>
                                                                            </TouchableOpacity>
                                                                            <ActivityIndicator
                                                                                style={[Styles.ImageUploadActivityIndicator]}
                                                                                animating={this.state.otherProofLoading}
                                                                            />
                                                                        </View>
                                                                        :
                                                                        null
                                                                }
                                                            </View>
                                                            :
                                                            null
                                                    }


                                                    {/*Account Holder NAME*/}
                                                    <View>
                                                        <View style={[Styles.row, Styles.mTop15]}>
                                                            <View
                                                                style={[Styles.aslCenter, Styles.mRt10]}>{LoadSVG.userIconVoilet}</View>
                                                            <Text
                                                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter,
                                                                    canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}>
                                                                Account Holder Name{Services.returnRedStart()}
                                                            </Text>
                                                        </View>
                                                        <TextInput
                                                            style={[Styles.marV5, Styles.mRt30, Styles.mLt40, Styles.brdrBtm1, Styles.f16,
                                                                canEditTextInput === false ? Styles.cDisabled : Styles.colorBlue]}
                                                            placeholder='Full Name'
                                                            autoCompleteType='off'
                                                            editable={canEditTextInput}
                                                            autoCapitalize="none"
                                                            blurOnSubmit={false}
                                                            // keyboardType='numeric'
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

                                                </View>

                                                {/*OWNER BENEFICARY DETAILS*/}
                                                {
                                                    // MyProfileResp.userRole === 1 || MyProfileResp.userRole === 5 || MyProfileResp.userRole === 10
                                                    this.state.UserFlow === 'NORMAL' || canEditTextInput
                                                        ?
                                                        MyProfileResp.userRole <= 10
                                                            ?
                                                            <View>
                                                                {/*CHECKBOX FOR OWNER DETAILS*/}
                                                                <TouchableOpacity style={[Styles.row, {right: 10}]}
                                                                                  // disabled={canEditTextInput === false && checkProfileField.beneficiary}
                                                                                  disabled={canEditTextInput === false}
                                                                                  onPress={() => this.setState({ownerInfo: !this.state.ownerInfo})}>
                                                                    <CheckBox
                                                                        containerStyle={{
                                                                            backgroundColor: "#fff",
                                                                            borderWidth: 0,
                                                                        }}
                                                                        checkedColor='#36A84C'
                                                                        size={25}
                                                                        onPress={() => this.setState({ownerInfo: !this.state.ownerInfo}, () => {
                                                                            this.state.ownerInfo === true
                                                                                ?
                                                                                this.checkBeneficaryDetails(MyProfileResp.beneficiaryInfo)
                                                                                :
                                                                                null
                                                                        })}
                                                                        checked={this.state.ownerInfo}
                                                                        // disabled={canEditTextInput === false && checkProfileField.beneficiary}
                                                                        disabled={canEditTextInput === false}
                                                                    />
                                                                    <Text
                                                                        style={[Styles.f16, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter, {right: 16}]}>Enter
                                                                        Beneficiary information</Text>
                                                                </TouchableOpacity>

                                                                {
                                                                    this.state.ownerInfo === true
                                                                        ?
                                                                        <View
                                                                            style={[[Styles.aslCenter, Styles.bgWhite, Styles.p15, Styles.br40, Styles.bgWhite, Styles.flex1,
                                                                                Styles.OrdersScreenCardshadow, {
                                                                                    width: Dimensions.get('window').width - 40
                                                                                }]]}>

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
                                                                                                    Styles.bw1, Styles.bcAsh, Styles.marV5, Styles.br5, Styles.bgWhite, Styles.padH15, userPanFound ? Styles.cDisabled : Styles.colorBlue]}
                                                                                                autoCapitalize='characters'
                                                                                                placeholder='ex:A B C D 1 2 3 4 5 6 7'
                                                                                                mode='outlined'
                                                                                                editable={!userPanFound}
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
                                                                                                autoCompleteType='off'
                                                                                                editable={!userPanFound}
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
                                                                                            editable={!userPanFound}
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
                                                                                                editable={!(userPanFound && panNumberDetails.aadharCardNumber)}
                                                                                                style={[{
                                                                                                    borderBottomWidth: 1,
                                                                                                    borderBottomColor: '#ccc'
                                                                                                }, Styles.f16, userPanFound && panNumberDetails.aadharCardNumber ? Styles.cDisabled : Styles.colorBlue]}
                                                                                                placeholder='Aadhar Card No'
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
                                                                                                disabled={userPanFound && this.state.panImageURL}
                                                                                                onPress={() => {
                                                                                                    // this.bankDocumentUpload('panCard')
                                                                                                    this.setState({imageType:'panCard',imageSelectionModal:true})
                                                                                                }}
                                                                                                style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                                                <Text
                                                                                                    style={[Styles.ffMregular, userPanFound ? Styles.cDisabled : Styles.colorBlue,
                                                                                                        Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                                                    PAN Card
                                                                                                    Pic{Services.returnRedStart()}</Text>
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
                                                                                                        <MaterialCommunityIcons
                                                                                                            name="resize"
                                                                                                            size={24}
                                                                                                            color="black"/>
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
                                                                                    {
                                                                                        userPanFound
                                                                                            ?
                                                                                            <View>
                                                                                                <View
                                                                                                    style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                                                                    <View
                                                                                                        style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                                                                    <TouchableOpacity
                                                                                                        disabled={userPanFound && this.state.BeneficiaryBankProofImageURL}
                                                                                                        onPress={() => {
                                                                                                            // this.bankDocumentUpload('BeneficiaryBankProofUpload')
                                                                                                            this.setState({imageType:'BeneficiaryBankProofUpload',imageSelectionModal:true})
                                                                                                        }}
                                                                                                        style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                                                        <Text
                                                                                                            style={[Styles.ffMregular,
                                                                                                                userPanFound && this.state.BeneficiaryBankProofImageURL ? Styles.cDisabled : Styles.colorBlue,
                                                                                                                Styles.f16, Styles.p3, Styles.aslCenter]}>Upload
                                                                                                            Bank Proof
                                                                                                            Pic{Services.returnRedStart()}</Text>
                                                                                                    </TouchableOpacity>
                                                                                                </View>
                                                                                                {
                                                                                                    this.state.BeneficiaryBankProofImageURL
                                                                                                        ?
                                                                                                        <View
                                                                                                            style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 120,}]}>
                                                                                                            {/*<Image*/}
                                                                                                            {/*    onLoadStart={() => this.setState({BenBankProofLoading: true})}*/}
                                                                                                            {/*    onLoadEnd={() => this.setState({BenBankProofLoading: false})}*/}
                                                                                                            {/*    style={[{*/}
                                                                                                            {/*        width: Dimensions.get('window').width / 2,*/}
                                                                                                            {/*        height: 120*/}
                                                                                                            {/*    }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}*/}
                                                                                                            {/*    source={this.state.BeneficiaryBankProofImageURL ? {uri: this.state.BeneficiaryBankProofImageURL} : null}*/}
                                                                                                            {/*/>*/}

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
                                                                                                                <MaterialCommunityIcons
                                                                                                                    name="resize"
                                                                                                                    size={24}
                                                                                                                    color="black"/>
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
                                                                                            :
                                                                                            null
                                                                                    }


                                                                                    {/*Upload AADHAR CARD PIC*/}
                                                                                    {
                                                                                        userPanFound
                                                                                            ?
                                                                                            <View>
                                                                                                <View
                                                                                                    style={[Styles.row, Styles.aitCenter, Styles.marV15]}>
                                                                                                    <View
                                                                                                        style={{marginRight: 10}}>{LoadSVG.uploadIcon}</View>
                                                                                                    <TouchableOpacity
                                                                                                        disabled={userPanFound && this.state.BeneficiaryAadharImageURL}
                                                                                                        onPress={() => {
                                                                                                            // this.bankDocumentUpload('BeneficiaryAadharUpload')
                                                                                                            this.setState({imageType:'BeneficiaryAadharUpload',imageSelectionModal:true})
                                                                                                        }}
                                                                                                        style={[Styles.bw1, Styles.padV5, Styles.bcBlk, Styles.padH20]}>
                                                                                                        <Text
                                                                                                            style={[Styles.ffMregular,
                                                                                                                userPanFound && this.state.BeneficiaryAadharImageURL ? Styles.cDisabled : Styles.colorBlue,
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
                                                                                                            {/*<Image*/}
                                                                                                            {/*    onLoadStart={() => this.setState({BenAadharLoading: true})}*/}
                                                                                                            {/*    onLoadEnd={() => this.setState({BenAadharLoading: false})}*/}
                                                                                                            {/*    style={[{*/}
                                                                                                            {/*        width: Dimensions.get('window').width / 2,*/}
                                                                                                            {/*        height: 120*/}
                                                                                                            {/*    }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}*/}
                                                                                                            {/*    source={this.state.BeneficiaryAadharImageURL ? {uri: this.state.BeneficiaryAadharImageURL} : null}*/}
                                                                                                            {/*/>*/}

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
                                                                                                                <MaterialCommunityIcons
                                                                                                                    name="resize"
                                                                                                                    size={24}
                                                                                                                    color="black"/>
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
                                                                                            :
                                                                                            null
                                                                                    }

                                                                                </View>
                                                                            </ScrollView>

                                                                        </View>
                                                                        : null
                                                                }
                                                            </View>
                                                            :
                                                            null
                                                        :
                                                        null
                                                }

                                            </View>

                                        </ScrollView>
                                        {
                                            this.state.mandatoryChecks === false ?
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
                                                    // onPress={() => this.validateBankInformation()}
                                                    onPress={() => {
                                                        if (this.state.UserFlow === 'NORMAL' || canEditTextInput) {
                                                            if (MyProfileResp.userRole > 10) {
                                                                this.validateBankInformation()
                                                            } else {
                                                                if (this.state.ownerInfo === true) {
                                                                    this.validateOwnerInfo();
                                                                } else {
                                                                    this.validateBankInformation()
                                                                }
                                                            }

                                                        } else {
                                                            if (this.state.ownerInfo === true) {
                                                                this.validateOwnerInfo();
                                                            } else {
                                                                this.validateBankInformation()
                                                            }
                                                        }
                                                    }}
                                                    // disabled={
                                                    //     this.state.IFSCverified === false ? true
                                                    //     :
                                                    //     this.state.errorIFSCcode ? true : false
                                                    // }
                                                    style={[{backgroundColor: '#C91A1F'},
                                                        Styles.p10, Styles.m3, Styles.br10,
                                                        // {display: canEditTextInput === false && this.state.showButton === false ? "none" : 'flex'}
                                                    ]}>
                                                    <Text
                                                        style={[Styles.aslCenter, Styles.cWhite, Styles.padV5, Styles.ffMbold, Styles.f16]}>SAVE</Text>
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
                                            this.bankDocumentUpload('CAMERA')
                                        })}}
                                        activeOpacity={0.7} style={[Styles.marV10,Styles.row,Styles.aitCenter]}>
                                        <FontAwesome name="camera" size={24} color="black" />
                                        <Text style={[Styles.f20,Styles.cBlk,Styles.ffLBold,Styles.padH10]}>Take Photo</Text>
                                    </TouchableOpacity>
                                    <Text style={[Styles.ffLBlack,Styles.brdrBtm1,Styles.mBtm15]}/>
                                    <TouchableOpacity
                                        onPress={()=>{this.setState({imageSelectionModal:false},()=>{
                                            this.bankDocumentUpload('LIBRARY')
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


            </View>
        );
    }
}
