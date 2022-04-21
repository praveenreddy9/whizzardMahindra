import React, {Component} from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    BackHandler,
    TouchableOpacity,
    Linking,
    ImageBackground, Dimensions, TextInput, Picker, Modal, ActivityIndicator, PermissionsAndroid, Alert
} from "react-native";
import {Appbar, Card, Divider, Title} from 'react-native-paper';
import {CSpinner, LoadImages, LoadSVG, Styles} from "../common";
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import FastImage from "react-native-fast-image";
import VehicleDetailsScreen from "./VehicleDetailsScreen";
import Config from "../common/Config";
import Services from "../common/Services";
import Utils from "../common/Utils";
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";
import OfflineNotice from "../common/OfflineNotice";
import _ from "lodash";
import AsyncStorage from "@react-native-community/async-storage";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import PDFView from "react-native-view-pdf";
import RNFetchBlob from "rn-fetch-blob";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import ImageZoom from "react-native-image-pan-zoom";


const options = {
    title: 'Select Avatar',
    // customButtons: [{name: 'fb', title: 'Choose Photo from Facebook'}],
    allowsEditing: false,
    storageOptions: {
        skipBackup: true,
        path: 'images',
    },
    cropping:true,
    maxWidth: 1200, maxHeight: 800,
};


export default class NewProfileScreen extends Component {


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
            BackHandler.addEventListener('hardwareBackPress', this.onBack),
        );
        this.state = {
            spinnerBool: false,
            UserID: '',
            pendingFields: [],
            selectedProfileUserID: '',
            onFocusPendingItem: '',
            editProfileDetailsModal: false,
            bloodGroups: [{name: 'Select Blood Group', value: ''},
                {name: 'A+', value: 'A+'}, {name: 'A-', value: 'A-'},
                {name: 'B+', value: 'B+'}, {name: 'B-', value: 'B-'},
                {name: 'AB+', value: 'AB+'}, {name: 'AB-', value: 'AB-'},
                {name: 'O+', value: 'O+'}, {name: 'O-', value: 'O-'}],
            contactPersonName:'',
            emergencyContactNumber:'',
            bloodGroup:'',
            // clientEmployeeId:'',
            canUpdateData:true,
            insuranceCardModal:false,idCardDetailsModal:false,idCardInfo:[],contractDetailsModal:false,contractInfo:[],
            imagePreview: false, imagePreviewURL: '',imageRotate:'0',
            imageSelectionModal:false
        }
    }

    onBack = () => {
        if (this.state.UserFlow === 'SITE_ADMIN') {
            if (this.state.UserStatus === "ACTIVE" || this.state.UserStatus === "ACTIVATED") {
                if (this.state.selectedUserSiteDetails.toScreen === 'userShiftActions') {
                    return this.props.navigation.navigate('userShiftActions');
                } else {
                    return this.props.navigation.navigate('Pipeline');
                }
            } else {
                return this.props.navigation.navigate('PendingUsersScreen');
            }
        } else {
            if (this.state.UserStatus === "ACTIVE" || this.state.UserStatus === "ACTIVATED") {
                return this.props.navigation.navigate('HomeScreen');
            } else {
                return this.props.navigation.navigate('ProfileStatusScreen');
            }
        }
    };

    componentWillUnmount() {
        this.didFocus.remove();
        this.willBlur.remove();
        BackHandler.removeEventListener('hardwareBackPress', this.onBack);
        Services.checkMockLocationPermission((response) => {
            if (response){
                this.props.navigation.navigate('Login')
            }
        })
    }


    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    componentDidMount() {
        this.willBlur = this.props.navigation.addListener('willBlur', payload =>
            BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        );
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            AsyncStorage.getItem('Whizzard:selectedUserSiteDetails').then((selectedUserSiteDetails) => {
                const parsedSiteDetails = JSON.parse(selectedUserSiteDetails)
                self.setState({
                    UserFlow: self.props.navigation.state.params.UserFlow,
                    UserStatus: self.props.navigation.state.params.UserStatus,
                    UserID: self.props.navigation.state.params.selectedProfileUserID,
                    selectedUserSiteDetails: parsedSiteDetails
                }, () => {
                    self.getProfileDetails();
                });
            });
        });
    };

    errorHandling(error) {
        // console.log("profile screen error", error, error.response);
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

    //Storage Permissions to Download Image
    async requestDownloadPermissions() {
        if (Platform.OS === 'ios') {
            await this.downloadImage();
        } else {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Storage Permission Required',
                        message:
                            'Whizzard needs access to your storage to download Photos',
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    // console.log('Storage Permission Granted.');
                    this.downloadImage();
                } else {
                    alert('Storage Permission Not Granted');
                }
            } catch (err) {
                console.warn(err);
            }
        }
    }

    //will add an extension for path (now not using)
    getExtention = filename => {
        // To get the file extension
        // console.log('extension filename',filename);
        return /[.]/.exec(filename) ?
            /[^.]+$/.exec(filename) : undefined;
    };
    //to download image (using blob)
    downloadImage = async () => {
        let date = new Date();
        let image_URL = this.state.idCardInfo;

        const idInfo = [
            {file: this.state.idCardInfo.idCardFrontCopyUrl,title:'Whizzard Front side card'},
            {file: this.state.idCardInfo.idCardBackCopyUrl,title:'Whizzard Back side card'}
        ]
        // idInfo.push()
        // idInfo[0].file = this.state.idCardInfo.idCardFrontCopyUrl
        // idInfo[1].file = this.state.idCardInfo.idCardBackCopyUrl


        // console.log('id total idInfo',idInfo);


        idInfo.map((item) => {
            // console.log('id inside item',item);
            // let ext = this.getExtention(image_URL);
            // ext = '.' + ext[0];

            const {config, fs} = RNFetchBlob;
            let PictureDir = fs.dirs.PictureDir;
            // const extention = item.media.split(".").pop(); // get item extention
            let options = {
                fileCache: true,
                addAndroidDownloads: {
                    useDownloadManager: true,
                    // appendExt: extention,
                    notification: true,
                    // path:  PictureDir +  '/image_' +  Math.floor(date.getTime() + date.getSeconds() / 2) + ext,
                    path:  PictureDir +  '/image_' +  Math.floor(date.getTime() + date.getSeconds() / 2) + '.png',
                    // path:  PictureDir +  '/image_' +  Math.floor(date.getTime() + date.getSeconds() / 2) + '.pdf',
                    // title: 'Whizzard Id Card',
                    title: item.title,
                    mime: 'image/png',
                    description: 'Downloading Image',
                },
            };
            config(options)
                // .fetch('GET', image_URL)
                .fetch('GET', item.file)
                .then(res => {
                    // let status = res.info().status;
                    // console.log('download resp ==> ', JSON.stringify(res));
                    // alert('Image Downloaded Successfully.');
                    Utils.dialogBox('Downloaded Succesfully','')
                }).catch((errorMessage, statusCode) => {
                console.log('download error -> ', errorMessage, 'statusCode==>', statusCode);
            });
        })
    };

    //API CALL TO FETCH PROFILE DETAILS
    getProfileDetails() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_PROFILE_DETAILS + '?&userId=' + self.state.UserID;
        const body = '';
        this.setState({spinnerBool: true, pendingFields: []}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response) {
                    var data = response.data;
                    // console.log('profile resp 200', response.data);
                    Utils.setToken('userStatus', data.userStatus, function () {
                    });
                        AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                            data.userStatus === 'ACTIVATED'
                                ?
                                self.state.UserFlow === 'NORMAL'
                                    ?
                                    self.setState({canEditTextInput: userRole === '45'})
                                    :
                                    self.setState({canEditTextInput: self.state.UserFlow === 'SITE_ADMIN' && userRole === '45'})
                                :
                                self.setState({canEditTextInput: true})
                        });


                    if (self.state.canUpdateData) {
                        self.setState({
                            spinnerBool: false,
                            MyProfileResp: data,
                            checkProfileField: data,
                            contactPersonName: data.contactPersonName,
                            emergencyContactNumber: data.emergencyContactNumber,
                            bloodGroup: data.bloodGroup,
                            pendingFields: data.errors ? data.errors : [],
                        });
                    }else {
                        self.setState({
                            MyProfileResp: data,
                            UserID: data.userId,
                            pendingFields: data.errors ? data.errors : [],
                            spinnerBool: false,
                        });
                    }
                    const onFocusPendingItem = self.props.navigation.state.params.onFocusPendingItem;
                    if (onFocusPendingItem && self.state.canUpdateData === true && data.profilePicDetails === null){
                        self.checkPendingItem(onFocusPendingItem);
                    }

                }
            }, function (error) {
                // console.log(' getProfileDetails error', error, error.response);
                self.errorHandling(error)
            });
        });
    }

    checkPendingItem(onFocusPendingItem) {
        if(onFocusPendingItem === "Missing Profile pic" || onFocusPendingItem === "Missing Employee Id" || onFocusPendingItem === "User Number and Emergency Contact Number are same"){
            this.setState({editProfileDetailsModal:true})
        }
    }

    ValidateEmergencyDetails(button) {
        let resp = {};
        let result = {};
        resp = Utils.isValidEmergencyPersonName(this.state.contactPersonName);
        if (resp.status === true) {
            result.contactPersonName = resp.message;
            resp = Utils.isValidMobileNumber(this.state.emergencyContactNumber);
            if (resp.status === true) {
                result.emergencyContactNumber = resp.message;
                resp = Utils.isValueSelected(this.state.bloodGroup,'Please Select Blood Group');
                if (resp.status === true) {
                    result.bloodGroup = resp.message;
                    if (button === 'onClickSave'){
                        this.updateEmergencyContactInfo()
                    }
                } else {
                    Utils.dialogBox(resp.message, '')
                }
            } else {
                Utils.dialogBox(resp.message, '');
            }
        } else {
            Utils.dialogBox(resp.message,'');
        }
    }

    updateEmergencyContactInfo() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.UPDATE_EMERGENCY_INFORMATION_WEB + '?&userId=' + self.state.UserID;
        const body = {
            contactPersonName: self.state.contactPersonName,
            emergencyContactNumber: self.state.emergencyContactNumber,
            bloodGroup: self.state.bloodGroup,
        };
        // console.log('updateEmergencyContactInfo URL', apiUrl, body);
        this.setState({spinnerBool: true, pendingFields: []}, () => {
            Services.AuthHTTPRequest(apiUrl, 'PUT', body, function (response) {
                if (response) {
                    var data = response.data;
                    Utils.dialogBox('Profile Updated Successfully !', '')
                    self.setState({
                        spinnerBool: false,
                        editProfileDetailsModal:false
                    }, function () {
                        self.getProfileDetails()
                    });
                }
            }, function (error) {
                // console.log(' updateEmergencyContactInfo error', error.response);
                self.errorHandling(error)
            });
        });
    }

    getUserInsuranceCard() {
        const self = this;
        // const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_INSURANCE_CARD + '?userId='+self.state.UserID;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_INSURANCE_CARD + '?userId='+self.state.MyProfileResp.userId;;
        const body = {};
        // console.log('insurance apiUrl',apiUrl);
        this.setState({spinnerBool: true, pendingFields: []}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response) {
                    var data = response.data;
                    // console.log('dataaaa insuracne', data);
                    if(data.status.status === 'true') {
                        let initialData = data.status.memberData;
                        let insuranceCard =''
                        if (initialData[631]){
                            insuranceCard  = initialData[631].self.eacrd;
                        }else if (initialData[632]){
                            insuranceCard  = initialData[632].self.eacrd;
                        }else if (initialData[633]){
                            insuranceCard  = initialData[633].self.eacrd;
                        }else if (initialData[634]){
                            insuranceCard  = initialData[634].self.eacrd;
                        }
                        if (insuranceCard === ''){
                            Utils.dialogBox('Error fetching Insurance Details', '')
                        }else {
                            self.setState({insuranceCardModal:true, insuranceCard:insuranceCard})
                        }
                    }else{
                        Utils.dialogBox('Insurance Details not found', '')
                    }
                    self.setState({    spinnerBool: false  });
                }
            }, function (error) {
                // console.log(' insurance error', error.response, error);
                self.errorHandling(error)
            });
        });
    }

    getUserIdCardInfo() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_ID_CARD + '?userId='+self.state.MyProfileResp.userId;
        const body = {};
        // console.log('ID card apiUrl',apiUrl);
        this.setState({spinnerBool: true, pendingFields: []}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    var data = response.data;
                    // console.log('getUserIdCardInfo resp200', data);
                    self.setState({   spinnerBool: false,idCardInfo :data,idCardDetailsModal:true  });
                }
            }, function (error) {
                // console.log(' getUserIdCardInfo error', error.response, error);
                self.errorHandling(error)
            });
        });
    }
    getUserContractInfo() {
        const self = this;
        // const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_CONTRACT_DETAILS + self.state.UserID;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_CONTRACT_DETAILS + self.state.MyProfileResp.userId;
        const body = {};
        // console.log('ID card apiUrl',apiUrl);
        this.setState({spinnerBool: true, pendingFields: []}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log('getUserContractInfo resp200', response);
                    var data = response.data;
                    if (data.contractFound){
                        self.setState({spinnerBool: false,contractInfo :data.contractUrl,contractDetailsModal:data.contractFound,contractFound:data.contractFound  });
                    }else {
                        Utils.dialogBox('Contract Details not found', '');
                        self.setState({   spinnerBool: false});
                    }
                }
            }, function (error) {
                // console.log(' getUserContractInfo error', error.response, error);
                self.errorHandling(error)
            });
        });
    }





    updateProfilePic = (uploadType) => {
        const self = this;
        // Services.checkImageUploadPermissions('LIBRARY',(response)=>{
        //     Services.checkImageUploadPermissions('CAMERA', (response) => {
            Services.checkImageUploadPermissions(uploadType, (response) => {
            // console.log('service image retunr', response);
            let imageData = response.image
            let imageFormData = response.formData
            let userImageUrl = imageData.path

            let profilePicUploadURL = Config.routes.BASE_URL + Config.routes.UPLOAD_PROFILE_PIC + '?&userId=' + self.state.UserID;
             const body = imageFormData;
            this.setState({spinnerBool: true}, () => {
                Services.AuthProfileHTTPRequest(profilePicUploadURL, 'POST', body, function (response) {
                    // console.log("profilePicUpload resp", response);
                    if (response) {
                        self.getProfileDetails();
                        self.setState({spinnerBool: false, UserID: self.state.UserID}, () => {
                            Utils.dialogBox("Uploaded successfully", '', function () {
                            })
                        })
                        if(self.state.UserFlow === 'NORMAL' ){
                            // console.log('entered for pic into local')
                            if (response.data.profilePicUploadUrl){
                                Utils.setToken('profilePicUrl', response.data.profilePicUploadUrl, function () {
                                });
                            }else {
                                console.log('into else of profile pic')
                            }
                        }
                    }
                }, function (error) {
                    console.log(' upload pic error', error.response);
                    self.errorHandling(error)
                });
            });

        })
    };

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
        const {MyProfileResp, canEditTextInput, checkProfileField} = this.state;
        const resourceType = 'url';
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <Appbar.Header style={[Styles.defaultbgColor, {borderBottomWidth: 0}]}>
                    <Appbar.BackAction onPress={() => this.onBack()}/>
                    {
                        this.state.UserStatus === "ACTIVE"
                            ?
                            <Appbar.Content
                                title={this.state.UserFlow === 'SITE_ADMIN' ? "Update Profile" : "View Profile"}/>
                            // <Text style={[Styles.f18, Styles.cWhite, Styles.ffMbold, Styles.aslCenter]}>View Profile</Text>
                            :
                            <Appbar.Content title="Update Profile"/>
                        // <Text style={[Styles.f18, Styles.cWhite, Styles.ffMbold, Styles.aslCenter]}>Update Profile</Text>
                    }
                    <Appbar.Action icon='mode-edit'
                                   onPress={() => this.setState({editProfileDetailsModal: true})}/>
                </Appbar.Header>

                {MyProfileResp
                    ?
                    <ScrollView>
                        <View style={[Styles.defaultbgColor, Styles.alignCenter, Styles.p15]}>
                            {
                                MyProfileResp.profilePicDetails
                                    ?
                                    <TouchableOpacity
                                        style={[Styles.row, Styles.aslCenter]}
                                        onPress={() => {
                                            this.setState({
                                                imagePreview: true,
                                                imagePreviewURL: MyProfileResp.profilePicDetails.profilePicUrl  ? MyProfileResp.profilePicDetails.profilePicUrl  : ''
                                            })
                                        }}>
                                    <ImageBackground style={[Styles.img100, Styles.aslCenter, Styles.br50,]}
                                                     source={LoadImages.Thumbnail}>
                                        <Image
                                            style={[Styles.img100, Styles.aslCenter, Styles.br50]}
                                            source={MyProfileResp.profilePicDetails.profilePicUrl ? {uri: MyProfileResp.profilePicDetails.profilePicUrl} : null}/>
                                    </ImageBackground>
                                        <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                    </TouchableOpacity>
                                    :
                                    <FastImage style={[Styles.aslCenter, Styles.img100, Styles.br50]}
                                               source={LoadImages.user_pic}/>
                            }
                            <Text
                                style={[Styles.cWhite, Styles.ffMbold, Styles.f20, Styles.padV8]}>{_.startCase(MyProfileResp.fullName) || '--'}</Text>
                            {
                                MyProfileResp.siteName
                                    ?
                                    <Text style={[Styles.cWhite, Styles.ffMregular, Styles.f16]}>{MyProfileResp.siteName   + ' (' + (MyProfileResp.siteCode ) + ')'}</Text>
                                    :
                                    <Text style={[Styles.cWhite, Styles.ffMregular, Styles.f16]}>{ '--'+' '+ '--'}</Text>
                            }
                            {
                                MyProfileResp.contactNumber
                                    ?
                                    <View style={[Styles.row,Styles.jCenter,Styles.padV5]}>
                                        <Text style={[Styles.cWhite, Styles.ffMregular, Styles.f16]}>{Services.returnRoleName(MyProfileResp.role)}</Text>
                                        <Text style={[Styles.cWhite, Styles.ffMregular, Styles.f16,Styles.padH10 ]}>||</Text>
                                        <Text style={[Styles.cWhite, Styles.ffMregular, Styles.f16, ]}>{MyProfileResp.contactNumber}</Text>
                                    </View>
                                    :
                                    <View style={[Styles.row,Styles.jCenter,Styles.padV5]}>
                                    </View>
                            }

                        </View>
                        <View>
                            <View style={[styles.shadow]}>
                                <Card
                                    onPress={() => this.props.navigation.navigate('NewPersonalScreen', {
                                        selectedProfileUserID: MyProfileResp.userId,
                                        UserFlow: this.state.UserFlow
                                    })}
                                    style={[Styles.p10, styles.borderLine]}>
                                    <Card.Title title="Personal Information"
                                                subtitle={MyProfileResp.personalInfoRatio === 10 ? 'Not Started' : 'Aadhar, PAN, Address'}
                                                titleStyle={[Styles.ffMbold, Styles.f18]}
                                                subtitleStyle={[Styles.ffMregular, Styles.f12, Styles.padV5]}
                                                left={() => <View>{LoadSVG.userIconVoilet}</View>}
                                                right={() =>
                                                    <View style={[Styles.row, Styles.alignCenter]}>
                                                        <View style={[styles.circleStyle]}>
                                                            <Text>{MyProfileResp.personalInfoRatio ? MyProfileResp.personalInfoRatio : 0}%</Text>
                                                        </View>
                                                        <MaterialIcons name="chevron-right" size={32}   />
                                                    </View>
                                                }
                                    />
                                </Card>
                                <Card
                                    onPress={() => this.props.navigation.navigate('VehicleDetailsScreen', {
                                        selectedProfileUserID: MyProfileResp.userId,
                                        UserFlow: this.state.UserFlow
                                    })}
                                    style={[Styles.p10, styles.borderLine]}>
                                    <Card.Title title="Vehicle Details"
                                                subtitle={MyProfileResp.vehicleInfoRatio === 10 ? 'Not Started' : 'Tax, Pollution, Insurance, Fitness'}
                                                titleStyle={[Styles.ffMbold, Styles.f18]}
                                                subtitleStyle={[Styles.ffMregular, Styles.f12, Styles.padV5]}
                                                left={() => <View>{LoadSVG.vehicleNew}</View>}
                                                right={() =>
                                                    <View style={[Styles.row, Styles.alignCenter]}>
                                                        <View style={[styles.circleStyle]}>
                                                            <Text>{MyProfileResp.vehicleInfoRatio ? MyProfileResp.vehicleInfoRatio : 0}%</Text>
                                                        </View>
                                                        <MaterialIcons name="chevron-right" size={32}   />
                                                    </View>
                                                }
                                    />
                                </Card>
                                <Card
                                    onPress={() => this.props.navigation.navigate('BankDetailsScreen', {
                                        selectedProfileUserID: MyProfileResp.userId,
                                        UserFlow: this.state.UserFlow
                                    })}
                                    style={[Styles.p10, styles.shadow]}>
                                    <Card.Title title="Bank Details"
                                                subtitle={MyProfileResp.bankInfoRatio === 10 ? 'Not Started' : 'Bank, IFSC, Account'}
                                                titleStyle={[Styles.ffMbold, Styles.f18]}
                                                subtitleStyle={[Styles.ffMregular, Styles.f12, Styles.padV5]}
                                                left={() => <View>{LoadSVG.bankNew}</View>}
                                                right={() =>
                                                    <View style={[Styles.row, Styles.alignCenter]}>
                                                        <View style={[styles.circleStyle]}>
                                                            <Text>{MyProfileResp.bankInfoRatio ? MyProfileResp.bankInfoRatio : 0}%</Text>
                                                        </View>
                                                        <MaterialIcons name="chevron-right" size={32}/>
                                                    </View>
                                                }
                                    />
                                </Card>
                            </View>
                            <View style={[Styles.padH30, Styles.pTop20]}>
                                <Text style={[Styles.f18, Styles.ffMregular, {color: '#ccc'}]}>Other Account
                                    Info</Text>
                                <View
                                    style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                    <Text style={[Styles.ffMbold, Styles.f18]}>Blood Group</Text>
                                    <Text style={[Styles.ffMbold, Styles.f16]}>{MyProfileResp.bloodGroup ? MyProfileResp.bloodGroup : 'NA'}</Text>
                                </View>
                                <View
                                    style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                    <Text style={[Styles.ffMbold, Styles.f18]}>Emergency Contact</Text>
                                    <TouchableOpacity onPress={()=>{Linking.openURL(`tel:${MyProfileResp.emergencyContact}`)}}><Text style={[Styles.ffMbold, Styles.f16]}>{MyProfileResp.emergencyContact ? MyProfileResp.emergencyContact :'NA'}</Text></TouchableOpacity>
                                </View>
                                {
                                    MyProfileResp.userStatus === 'ACTIVATED'
                                        ?
                                <TouchableOpacity onPress={()=>this.getUserInsuranceCard()}
                                                  style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                    <Text style={[Styles.ffMbold, Styles.f18]}>Insurance Card</Text>
                                    <MaterialIcons name="chevron-right" size={32}/>
                                </TouchableOpacity>
                                        :
                                        null}

                                <TouchableOpacity onPress={()=>this.getUserIdCardInfo()}
                                                  style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                    <Text style={[Styles.ffMbold, Styles.f18]}>ID Card</Text>
                                    <MaterialIcons name="chevron-right" size={32}/>
                                </TouchableOpacity>
                                <View style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20]}>
                                    <Text style={[Styles.ffMbold, Styles.f18]}>Verification Status</Text>
                                    <Text style={[Styles.ffMbold, Styles.f16, Styles.colorGreen]}>{MyProfileResp.userStatus === 'ACTIVATED' ? 'Verified' : 'Pending'}</Text>
                                </View>
                                {
                                    MyProfileResp.userStatus === 'ACTIVATED'
                                    ?
                                        <TouchableOpacity onPress={()=>this.getUserContractInfo()}
                                                          style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                            <Text style={[Styles.ffMbold, Styles.f18]}>Contract Agreement</Text>
                                            {/*<Text style={[Styles.ffMbold, Styles.f16, Styles.colorGreen]}>View</Text>*/}
                                            <MaterialIcons name="chevron-right" size={32}/>
                                        </TouchableOpacity>
                                        :
                                        null
                                }
                            </View>
                            <Divider style={[styles.shadow, {borderWidth: 0}]}/>
                            <View style={[Styles.padH30, Styles.padV20]}>
                                <Text style={[Styles.f18, Styles.ffMregular, {color: '#ccc'}]}>User Activity</Text>
                                <View
                                    style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                    <Text style={[Styles.ffMbold, Styles.f18]}>You are referred by</Text>
                                    <Text style={[Styles.ffMbold, Styles.f16]}>{MyProfileResp.referredBy === null ? 'NA' : MyProfileResp.referredBy}</Text>
                                </View>
                                <View
                                    style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20]}>
                                    <Text style={[Styles.ffMbold, Styles.f18]}>Last Login</Text>
                                    {/*<Text style={[Styles.ffMbold, Styles.f16]}>13 July 2020 | 14:03 Hrs</Text>*/}
                                    <Text style={[Styles.ffMbold, Styles.f16]}>{MyProfileResp.userLastLogIn
                                        ? Services.returnConvertTimeToAMPM(new Date(this.state.MyProfileResp.userLastLogIn)) : 'NA'}</Text>
                                </View>
                            </View>
                            <Divider style={[styles.shadow]}/>
                            <View style={[Styles.padH30, Styles.pTop20]}>
                                <View style={[Styles.padV15,]}>
                                    <FastImage source={LoadImages.whizzard_inverted}
                                               style={[Styles.aslCenter, {width: 200, height: 40}]}/>
                                </View>
                                <View style={[Styles.row, Styles.jSpaceBet, Styles.pBtm10]}>
                                    {/*<Text style={[Styles.ffMregular, Styles.f16]}>V2.5.30</Text>*/}
                                    <Text style={[Styles.ffMblack, {color:Services.returnServerBasedColor()}]}>v.{Config.routes.APP_VERSION_NUMBER}</Text>
                                    <Text style={[Styles.ffMregular, Styles.f16]}>|</Text>
                                    <TouchableOpacity onPress={()=>Linking.openURL(`https://docs.google.com/document/d/e/2PACX-1vQOmqz0IMPq5e4b5Nv36CXcaDuqWLym8kOpLIHvm45H4o7XV4A0OxYO96I-C2knR4TI4AUFJp_MXSdD/pub`)}>
                                        <Text style={[Styles.ffMregular, Styles.f16]}>Terms & Conditions</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                    :
                    <CSpinner/>
                }

                {/*MODAL START*/}

                {/*Edit Profile Details Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.editProfileDetailsModal}
                    onRequestClose={() => {
                        this.setState({editProfileDetailsModal:false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1,]}>
                            {  this.state.spinnerBool === false  ?  null  :  <CSpinner/>  }
                            <Appbar.Header style={[Styles.bgDarkRed,  {elevation: 0}]}>
                                {/*<Appbar.BackAction onPress={() => this.setState({editProfileDetailsModal: false})}/>*/}
                                <Appbar.Content title="Edit Profile"
                                                titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() => this.setState({editProfileDetailsModal: false})}/>
                            </Appbar.Header>
                            {MyProfileResp && checkProfileField ?
                                <ScrollView
                                    style={[Styles.bw1, Styles.bgWhite, {
                                        width: Dimensions.get('window').width,
                                        height: Dimensions.get('window').height
                                    }]}>
                                    <View style={[Styles.p20, Styles.row, Styles.aitCenter]}>
                                        {
                                            MyProfileResp.profilePicDetails
                                                ?
                                                <TouchableOpacity
                                                    style={[Styles.row, Styles.aslCenter]}
                                                    onPress={() => {
                                                        this.setState({
                                                            imagePreview: true,
                                                            imagePreviewURL: MyProfileResp.profilePicDetails.profilePicUrl  ?MyProfileResp.profilePicDetails.profilePicUrl  : ''
                                                        })
                                                    }}>
                                                <ImageBackground
                                                    style={[Styles.img100, Styles.aslCenter, Styles.br50,]}
                                                    source={LoadImages.Thumbnail}>
                                                    <Image
                                                        style={[Styles.img100, Styles.aslCenter, Styles.br50]}
                                                        source={MyProfileResp.profilePicDetails.profilePicUrl ? {uri: MyProfileResp.profilePicDetails.profilePicUrl} : null}/>
                                                </ImageBackground>
                                                    <MaterialCommunityIcons name="resize"  size={24} color="black"/>
                                                </TouchableOpacity>
                                                :
                                                <FastImage style={[Styles.aslCenter, Styles.img100, Styles.br50]}
                                                           source={LoadImages.user_pic}/>
                                        }
                                        {
                                            this.state.UserFlow === 'NORMAL' || canEditTextInput
                                                ?
                                                <TouchableOpacity
                                                    // onPress={() => this.updateProfilePic()}>
                                                    onPress={() => this.setState({imageSelectionModal:true})}>
                                                    <Text
                                                    style={[Styles.colorRed, Styles.ffMbold, Styles.f18, Styles.pLeft15]}>Change
                                                    Image</Text>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }


                                    </View>
                                    <View>
                                        <View style={[Styles.padH25]}>
                                            <View style={[Styles.mBtm20]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.personalNew}</View>
                                                    <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15,Styles.cDisabled]}>Name</Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <View
                                                        style={[{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc',
                                                            paddingBottom: 10
                                                        }]}
                                                    ><Text
                                                        style={[Styles.f16, Styles.ffMregular, Styles.pLeft5,Styles.cDisabled]}>{MyProfileResp.fullName}</Text></View>
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm20]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.personalNew}</View>
                                                    <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15,Styles.cDisabled]}>Role</Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <View
                                                        style={[{borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10}]}
                                                    ><Text
                                                        style={[Styles.f16, Styles.ffMregular, Styles.pLeft5,Styles.cDisabled]}>{Services.returnRoleName(MyProfileResp.role)}</Text></View>
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm20]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.adharIocn}</View>
                                                    <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15,Styles.cDisabled]}>
                                                        Client Employee Id:</Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <View
                                                        style={[{borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10}]}
                                                    ><Text
                                                        style={[Styles.f16, Styles.ffMregular, Styles.pLeft5,Styles.cDisabled]}>{MyProfileResp.clientEmployeeId || 'NA'}</Text></View>
                                                </View>
                                            </View>

                                            <View style={[Styles.mBtm20]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.personalNew}</View>
                                                    <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Emergency
                                                        Contact
                                                        Person
                                                        Name{Services.returnRedStart()}</Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[Styles.f16, {
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }]}
                                                        placeholder='name'
                                                        editable={this.state.UserFlow === 'NORMAL' ?
                                                            !(canEditTextInput === false && checkProfileField.contactPersonName) :canEditTextInput}
                                                        value={this.state.contactPersonName}
                                                        onChangeText={(name) => this.setState({contactPersonName: name})}
                                                    />
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm20]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.mobileIcon}</View>
                                                    <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Contact
                                                        Number in
                                                        Emergency{Services.returnRedStart()}</Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <TextInput
                                                        style={[Styles.f16, {
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#ccc'
                                                        }]}
                                                        placeholder='mobile number'
                                                        editable={this.state.UserFlow === 'NORMAL' ?
                                                            !(canEditTextInput === false && checkProfileField.emergencyContactNumber):canEditTextInput}
                                                        keyboardType='numeric'
                                                        maxLength={10}
                                                        value={this.state.emergencyContactNumber}
                                                        onChangeText={(number) => this.setState({emergencyContactNumber: number})}
                                                    />
                                                </View>
                                            </View>
                                            <View style={[Styles.mBtm20]}>
                                                <View style={[Styles.row, Styles.aitCenter]}>
                                                    <View>{LoadSVG.bloodGroup}</View>
                                                    <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Your
                                                        Blood Group{Services.returnRedStart()}</Text>
                                                </View>
                                                <View style={{paddingLeft: 40}}>
                                                    <View
                                                        style={[Styles.bw1, Styles.br5, Styles.mTop5, {borderColor: this.state.reqFields ? 'red' : '#ccc',}]}>
                                                        <Picker
                                                            enabled={this.state.UserFlow === 'NORMAL' ?
                                                                !(canEditTextInput === false && checkProfileField.bloodGroup):canEditTextInput}
                                                            itemStyle={[Styles.ffMregular, Styles.f18]}
                                                            selectedValue={this.state.bloodGroup}
                                                            mode='dropdown'
                                                            onValueChange={(itemValue, itemIndex) => this.setState({bloodGroup: itemValue})}
                                                        >
                                                            {this.state.bloodGroups.map((item, index) => {
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
                                                        style={[Styles.defaultbgColor, Styles.p10, Styles.marV20]}
                                                        // onPress={() => this.updateEmergencyContactInfor()}>
                                                        onPress={() => this.ValidateEmergencyDetails('onClickSave')}>
                                                        <Text
                                                            style={[Styles.aslCenter, Styles.cWhite, Styles.padH10, Styles.padV5, Styles.ffMbold, Styles.f16]}>SAVE</Text>
                                                    </TouchableOpacity>
                                                    :
                                                    null
                                            }

                                        </View>
                                    </View>
                                </ScrollView>: null
                            }
                        </View>
                    </View>
                </Modal>

                {/*INSURANCE DETAILS MODAL*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.insuranceCardModal}
                    onRequestClose={() => {
                        this.setState({insuranceCardModal:false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.bgLYellow,]}>
                            <Appbar.Header style={[Styles.defaultbgColor, Styles.jSpaceBet]}>
                                <Appbar.Content title="Insurance Details"
                                                titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                                <MaterialCommunityIcons name="download" style={[Styles.padH20]} size={28} color="black"
                                                        onPress={()=>Linking.openURL(this.state.insuranceCard)}
                                />
                                <MaterialCommunityIcons name="window-close" size={28}
                                                        color="#000" style={{marginRight: 10}}
                                                        onPress={() => this.setState({insuranceCardModal: false})}/>
                            </Appbar.Header>
                            {/* Some Controls to change PDF resource */}
                            <PDFView
                                fadeInDuration={250.0}
                                style={[{  width: Dimensions.get('window').width,
                                    height: Dimensions.get('window').height-50 }]}
                                resource={this.state.insuranceCard}
                                resourceType={"url"}
                                onLoad={() => console.log(`PDF rendered from ${resourceType}`)}
                                onError={(error) => console.log('Cannot render PDF', error)}
                            />
                        </View>
                    </View>
                </Modal>

                {/*ID CARD MODAL*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.idCardDetailsModal}
                    onRequestClose={() => {
                        this.setState({idCardDetailsModal:false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.bgWhite,]}>
                            <Appbar.Header style={[Styles.defaultbgColor, Styles.jSpaceBet]}>
                                <Appbar.Content title="ID Card"
                                                titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                                <MaterialCommunityIcons name="download" style={[Styles.padH20]}
                                                        size={28} color="black"
                                                        onPress={()=>this.requestDownloadPermissions()}/>
                                <MaterialCommunityIcons name="window-close" size={28}
                                                        color="#000" style={{marginRight: 10}}
                                                        onPress={() => this.setState({idCardDetailsModal: false})}/>
                            </Appbar.Header>

                            <ScrollView
                                persistentScrollbar={true}
                                // showsVerticalScrollIndicator={true}
                                style={[{  width: Dimensions.get('window').width,
                                height: Dimensions.get('window').height-50 }]}>
                                {
                                    this.state.idCardInfo.idCardFrontCopyUrl
                                        ?
                                        <View>
                                            <Image
                                                onLoadStart={() => this.setState({idCardFrontLoading: true})}
                                                onLoadEnd={() => this.setState({idCardFrontLoading: false})}
                                                style={[{
                                                    width: Dimensions.get('window').width -50,
                                                    height: Dimensions.get('window').height-120
                                                }, Styles.marV15,Styles.bgWhite, Styles.aslCenter, Styles.ImgResizeModeStretch]}
                                                source={this.state.idCardInfo.idCardFrontCopyUrl ? {uri: this.state.idCardInfo.idCardFrontCopyUrl} : null}
                                            />
                                            <ActivityIndicator
                                                style={[Styles.ImageUploadActivityIndicator]}
                                                animating={this.state.idCardFrontLoading}
                                            />
                                        </View>
                                        :
                                        null
                                }

                                {
                                    this.state.idCardInfo.idCardBackCopyUrl
                                        ?
                                        <View>
                                            <Image
                                                onLoadStart={() => this.setState({idCardBackLoading: true})}
                                                onLoadEnd={() => this.setState({idCardBackLoading: false})}
                                                style={[{
                                                    width: Dimensions.get('window').width -50,
                                                    height: Dimensions.get('window').height-120
                                                }, Styles.marV15, Styles.aslCenter,Styles.bgWhite, Styles.ImgResizeModeStretch]}
                                                source={this.state.idCardInfo.idCardBackCopyUrl ? {uri: this.state.idCardInfo.idCardBackCopyUrl} : null}
                                            />
                                            <ActivityIndicator
                                                style={[Styles.ImageUploadActivityIndicator]}
                                                animating={this.state.idCardBackLoading}
                                            />
                                        </View>
                                        :
                                        null
                                }
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/*CONTRACT MODAL*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.contractDetailsModal}
                    onRequestClose={() => {
                        this.setState({contractDetailsModal:false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.bgLYellow,]}>
                            <Appbar.Header style={[Styles.defaultbgColor, Styles.jSpaceBet]}>
                                <Appbar.Content title="Contract Agreement"
                                                titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                                {/*<MaterialCommunityIcons name="download" style={[Styles.padH20]} size={28} color="black"*/}
                                {/*                        onPress={()=>Linking.openURL(this.state.contractInfo)}*/}
                                {/*/>*/}
                                <MaterialCommunityIcons name="window-close" size={28}
                                                        color="#000" style={{marginRight: 10}}
                                                        onPress={() => this.setState({contractDetailsModal: false})}/>
                            </Appbar.Header>
                            {/* Some Controls to change PDF resource */}
                            {
                                this.state.contractInfo
                                ?
                                    <PDFView
                                        fadeInDuration={250.0}
                                        style={[{  width: Dimensions.get('window').width,
                                            height: Dimensions.get('window').height-50 }]}
                                        resource={this.state.contractInfo}
                                        resourceType={"url"}
                                        onLoad={() => console.log(`PDF rendered from ${resourceType}`)}
                                        onError={(error) => console.log('Cannot render PDF', error)}
                                    />
                                    :
                                    <Text style={[Styles.colorBlue, Styles.f20, Styles.aslCenter, Styles.ffMregular,Styles.pTop20]}>No Contract Found....</Text>
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
                                            this.updateProfilePic('CAMERA')
                                        })}}
                                        activeOpacity={0.7} style={[Styles.marV10,Styles.row,Styles.aitCenter]}>
                                        <FontAwesome name="camera" size={24} color="black" />
                                        <Text style={[Styles.f20,Styles.cBlk,Styles.ffLBold,Styles.padH10]}>Take Photo</Text>
                                    </TouchableOpacity>
                                    <Text style={[Styles.ffLBlack,Styles.brdrBtm1,Styles.mBtm15]}/>
                                    <TouchableOpacity
                                        onPress={()=>{this.setState({imageSelectionModal:false},()=>{
                                            this.updateProfilePic('LIBRARY')
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
