import React, {Component} from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    BackHandler,
    Modal,
    Linking,
    TouchableOpacity,
    ScrollView,
    FlatList, TextInput, KeyboardAvoidingView, Keyboard, Picker, ActivityIndicator, Alert
} from "react-native";
import {Appbar, Avatar, Card, Surface, IconButton, DefaultTheme, Title, Button, Searchbar} from "react-native-paper";
import {Styles, CText, CSpinner, LoadSVG} from "../common";
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";
import Utils from "../common/Utils";
import Config from "../common/Config";
import Services from "../common/Services";
import OfflineNotice from "../common/OfflineNotice";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import Entypo from "react-native-vector-icons/dist/Entypo";
import {CheckBox} from "react-native-elements";
import _ from "lodash";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import AsyncStorage from "@react-native-community/async-storage";


const theme = {
    ...DefaultTheme,
    fonts: {
        ...DefaultTheme.fonts,
        regular: 'Muli-Regular'
    },
    colors: {
        ...DefaultTheme.colors,
        text: '#233167',
        primary: '#233167', underlineColor: 'transparent'
    }
};

export default class PendingUsersScreen extends Component {
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
            usersList: [],rolesList:[],sitesList:[],userRole:'',
            showAcceptModal: false, showChangePassword: false,showRejectUserModal:false,RejectReason:'',errorRejectReason:null,
            AcceptRoleValue:'',AcceptSiteValue:'',
            AcceptReason:'',errorAcceptReason:null,isContractor:false,errorRoleValue:null,errorSiteValue:null,
            password: '',
            confirmPassword: '',
            ErrorMessage: '',
            isValidPassword: null,
            errorPassMessage: null,
            isValidCPassword: null,
            errorCPassMessage: null,
            errorMobileMessage: null,
            showButton: false,
            refreshing: false,
            data: [],
            page: 1,
            spinnerBool: false,
            size: 10,
            isLoading: false,
            ascendingOrder: true,
            userProfileRemarks:[],showRemarksList:false,
            SearchBarView: false,searchData:''

        }
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
        // this._subscribe = this.props.navigation.addListener('didFocus', () => {
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                self.setState({userRole:JSON.parse(userRole),page:1, usersList: []},()=>{
                    // self.getPendingUsersList('',1);
                    self.getPendingUsersRoles();
                    // self.getPendingUsersSites();
                })
        });
        // });
    }

    handleLoadMore = () => {
        this.state.page < this.state.totalPages ?
            this.setState({
                page: this.state.page + 1
            }, () => {
                this.getPendingUsersList(this.state.searchData,this.state.page);
            }) :null
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
        //Clear old data of the list
        this.setState({page:1, usersList: []});
        //Call the Service to get the latest data
        this.getPendingUsersList(this.state.searchData,1);
    };


    errorHandling(error) {
        // console.log("pending users screen error", error, error.response);
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

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    getPendingUsersList(searchData,pageNo) {
        const {data, page,usersList} = this.state;
        this.setState({isLoading: true});
        const self = this;
        const body = {
            page: pageNo,
            sort: "name,desc",
            size: 10,
            userName: searchData
        };
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_PENDING_USERS_LIST;
        // console.log("get Pending UsersList apiURL", apiURL,'body==',body);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, function (response) {
                if (response.status === 200) {
                    // console.log("getPending UsersList resp", response.data);
                    self.setState({
                        usersList: pageNo === 1 ?  response.data.content : [...usersList, ... response.data.content],
                        totalPages: response.data.totalPages,
                        totalCount:response.data.totalElements,
                        page:pageNo,
                        spinnerBool: false, refreshing: false,
                    })
                }
            }, function (error) {
                // console.log('getPending UsersList error', error, error.response);
                self.errorHandling(error);
            })
        })
    }

    getPendingUsersRoles() {
        const self = this;
        const body = {};
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_PENDING_USERS_ROLES_LIST;
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, function (response) {
                if (response.status === 200) {
                    // console.log('pending users roles list',response.data);
                    const list =response.data;
                    list.push({value: '', key: 'Select a Role' })
                    self.setState({
                        rolesList:list,
                        spinnerBool: false
                    })
                    self.getPendingUsersSites()
                }
            }, function (error) {
                self.errorHandling(error);
            })
        })
    }
    getPendingUsersSites() {
        const self = this;
        const body = {};
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_PENDING_USERS_SITES_LIST;
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, function (response) {
                if (response.status === 200) {
                    // console.log('pending users sites list',response.data);
                    // const list = response.data.content;
                    // list.push({id: '', name: 'Select a Site' })
                    let list = response.data.content;
                    let sample = {id: '', name: 'Select a Site'}
                    list.unshift(sample)
                    self.setState({
                        sitesList:list,
                        spinnerBool: false
                    })
                    self.getPendingUsersList('',1);
                }
            }, function (error) {
                self.errorHandling(error);
            })
        })
    }


    //update password for selected User
    updatePassword(password) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL +  Config.routes.UPDATE_PENDING_USERS_PASSWORD;
        const body = JSON.stringify({
            newPassword: password,
            userId: this.state.selectedUserDetails.id
        }) ;
        // console.log('updatePassword body',apiUrl, body);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    self.setState({showChangePassword:false,spinnerBool: false});
                    Utils.dialogBox('Password Updated', '');
                }
            }, function (error) {
                self.errorHandling(error);
            });
        });
    }


    validatePassword = (button) => {
        let resp = {};
        let result = {};
        resp = Utils.isValidPassword(this.state.password);
        if (resp.status === true) {
            result.password = resp.message;
            this.setState({isValidPassword: true, errorPassMessage: ''});
            resp = Utils.isValidCPassword(this.state.password, this.state.confirmPassword);
            if (resp.status === true) {
                result.password = resp.message;
                this.setState({isValidCPassword: true, errorCPassMessage: '', showButton: true});

                if (button === 'onClickSave'){
                    this.updatePassword(this.state.password)
                }
            } else {
                this.setState({isValidCPassword: false, errorCPassMessage: resp.message, showButton: false});
            }
        } else {
            this.setState({isValidPassword: false, errorPassMessage: resp.message, showButton: false});
        }
    }

    //REJECT USER
    rejectUser(reason) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL +  Config.routes.REJECT_PENDING_USER+this.state.selectedUserDetails.id + '?&reason='+reason;
        const body =  {} ;
        // console.log('rejectUser apiUrl', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'PUT', body, function (response) {
                if (response.status === 200) {
                    // console.log("rejectUser response", response);
                    self.setState({showRejectUserModal:false,spinnerBool: false,page:1, usersList: []});
                    self.getPendingUsersList('',1)
                    Utils.dialogBox('User Rejected', '');
                }
            }, function (error) {
                // console.log("rejectUser error", error.response,error);
                self.errorHandling(error);
            });
        });
    }



    ValidateAcceptUser = (button) => {
        let resp = {};
        let result = {};
        resp = Utils.isValueSelected(this.state.AcceptRoleValue,'Please select a Role');
        if (resp.status === true) {
            result.role = resp.message;
            this.setState({  errorRoleValue: null});
            resp = Utils.isValueSelected(this.state.AcceptSiteValue,'Please select a Site');
            if (resp.status === true) {
                result.site = resp.message;
                this.setState({errorSiteValue:null });
                resp = Utils.isValidRemarks(this.state.AcceptReason);
                if (resp.status === true) {
                    result.remarks = resp.message;
                    this.setState({errorAcceptReason: null});


                    if (button === 'onClickSave'){
                        this.acceptUser(result)
                    }

                } else {
                    this.setState({errorAcceptReason: resp.message});
                }
            } else {
                this.setState({  errorSiteValue: resp.message });
            }
        } else {
            this.setState({  errorRoleValue: resp.message });
        }
    }


    //ACCEPT USER
    acceptUser(result) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL +  Config.routes.ACCEPT_PENDING_USER+
            this.state.selectedUserDetails.id + '?&remarks='+ result.remarks + '&role='+ result.role + '&status='+ 'ACTIVATED' + '&site='+ result.site;
        const body =  {} ;
        // console.log('acceptUser apiUrl', apiUrl);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'PUT', body, function (response) {
                if (response.status === 200) {
                    // console.log("acceptUser response", response);
                    self.setState({showAcceptModal:false,spinnerBool: false,page:1, usersList: []});
                    Utils.dialogBox('User Accepted', '');
                    self.getPendingUsersList('',1)
                }
            }, function (error) {
                // console.log("acceptUser error", error.response,error);
                self.errorHandling(error);
            });
        });
    }

    listOfPendingUsers(list){
        const {userRole}=this.state;
        return (
            <View style={[Styles.row, Styles.p10]}>
                <View style={[Styles.flex1]}>
                    <Card style={[Styles.OrdersScreenCardshadow,]}>
                        <Card.Title
                            // left={() => null}
                            title={_.startCase(_.toLower(list.fullName))}
                            titleStyle={[Styles.f16, Styles.ffMbold, Styles.colorBlue]}
                            subtitleStyle={[Styles.f14, Styles.ffMbold]}
                            // subtitle={ Services.getUserRoles(list.role) }
                            // subtitle={'Pending Fields (' + list.missingFields.length + ')'}
                            subtitle={<Text style={[Styles.colorBlue]}>{Services.getUserRolesShortName(list.role)}-<Text style={[Styles.cRed]}>Pending Fields({list.missingFields.length})</Text></Text>}
                            right={() =>
                                <View style={[Styles.row, Styles.mRt15]}>

                                    {
                                        userRole === 45
                                        ?
                                            <View style={[Styles.row]}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    this.setState({selectedUserDetails: list,showButton:false,password: '',
                                                        confirmPassword: '',
                                                        ErrorMessage: '',
                                                        isValidPassword: null,
                                                        errorPassMessage: null,
                                                        isValidCPassword: null,
                                                        errorCPassMessage: null,
                                                        errorMobileMessage: null, }, () => {
                                                        this.setState({showChangePassword: true})
                                                    })
                                                }}
                                                style={[Styles.marH10, Styles.aslCenter]}>
                                                <FontAwesome name="key" size={21} color="black"
                                                             style={[Styles.br20, Styles.aslCenter, Styles.bgLWhite, Styles.p10]}/>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[Styles.aslCenter,Styles.marH10]}
                                                onPress={() => {
                                                    this.setState({selectedUserDetails: list,RejectReason:''}, () => {
                                                        this.setState({showRejectUserModal: true})
                                                    })
                                                }}>
                                                <MaterialIcons name="cancel" size={32}
                                                               color="red"
                                                               style={[Styles.bgLWhite, Styles.br20, Styles.aslCenter,Styles.p5]}/>
                                            </TouchableOpacity>
                                            </View>
                                        :
                                        null
                                    }

                                    <TouchableOpacity
                                        style={[Styles.aslCenter]}
                                        onPress={() => {
                                            this.setState({selectedUserDetails: list,AcceptRoleValue:'',AcceptSiteValue:'',AcceptReason:'',isContractor:false}, () => {
                                                this.setState({showAcceptModal: true,showRemarksList:false,AcceptSiteValue:list.primarySite?list.primarySite:'',
                                                    AcceptRoleValue:list.role?list.role:''})
                                            })
                                        }}>
                                        <MaterialIcons name="chevron-right" size={32}
                                                       color="#000"
                                                       style={[Styles.bgLWhite, Styles.br20, Styles.aslCenter]}/>
                                    </TouchableOpacity>

                                </View>
                            }>
                        </Card.Title>
                    </Card>
                </View>
            </View>
        )
    }

    checkPendingListText(textField){
        // console.log('textField',textField);
        if(textField){
            if (textField === "Missing Profile pic" || textField === "Missing Employee Id" || textField === "User Number and Emergency Contact Number are same"){
                this.setState({showAcceptModal: false}, () => {
                     this.props.navigation.navigate('NewProfileScreen', {
                        UserFlow: 'SITE_ADMIN',
                        UserStatus: "PENDING",
                        selectedProfileUserID: this.state.selectedUserDetails.id,
                         onFocusPendingItem:textField
                    })
                })
            }else if (textField === "Missing Aadhaar front copy" || textField === "Missing AadhaarCard Number" ||   textField === "Missing Aadhaar Back Copy"
                || textField === "Missing PAN Card Number" ||  textField === "Missing PAN Card Photo"
                || textField === "Missing Driving License Front Copy" || textField === "Missing Driving License Back Copy" || textField === "Missing Driving License Number"
                || textField === "Missing Family Details"
                || textField === "Missing Address details" || textField === "Missing Landmark" || textField === "Missing Pin Code"
                || textField === "Missing Local Address details"
                || textField === "Missing Permanent Address details" || textField === "Missing Permanent Landmark" || textField === "Missing Permanent PinCode"){
                this.setState({showAcceptModal: false}, () => {
                    this.props.navigation.navigate('NewPersonalScreen', {
                        UserFlow: 'SITE_ADMIN',
                        UserStatus: "PENDING",
                        selectedProfileUserID: this.state.selectedUserDetails.id,
                        onFocusPendingItem:textField
                    })
                })
            }  else if (textField === "Missing Vehicle RC"  ){
                this.setState({showAcceptModal: false}, () => {
                    this.props.navigation.navigate('VehicleDetailsScreen', {
                        UserFlow: 'SITE_ADMIN',
                        UserStatus: "PENDING",
                        selectedProfileUserID: this.state.selectedUserDetails.id,
                     })
                })
            } else if (textField === "Missing Bank Details" ||   textField === "Missing Bank Proof Photo" ){
                this.setState({showAcceptModal: false}, () => {
                    this.props.navigation.navigate('BankDetailsScreen', {
                        UserFlow: 'SITE_ADMIN',
                        UserStatus: "PENDING",
                        selectedProfileUserID: this.state.selectedUserDetails.id,
                        onFocusPendingItem:textField
                     })
                })
            }
        }else {
            this.setState({showAcceptModal: false}, () => {
                this.props.navigation.navigate('NewProfileScreen', {
                    UserFlow: 'SITE_ADMIN',
                    UserStatus: "PENDING",
                    selectedProfileUserID: this.state.selectedUserDetails.id,
                    onFocusPendingItem:null
                })
            })
        }
    }


    render() {
        const {data, refreshing,usersList,userRole,selectedUserDetails} = this.state;
        if (this.state.refreshing) {
            return (
                //loading view while data is loading
                <View style={[Styles.flex1, Styles.alignCenter]}>
                    <ActivityIndicator/>
                </View>
            );
        }
        return (
            <View style={[[Styles.flex1, Styles.bgDash]]}>
                {this.renderSpinner()}
                <OfflineNotice/>
                <View style={[Styles.bgWhite, Styles.AuthScreenHeadershadow]}>
                    <Appbar.Header style={Styles.bgWhite}>
                        {/*<Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>*/}
                        <Appbar.Action icon="menu" size={30} onPress={() => {
                            this.props.navigation.openDrawer();
                        }}/>
                        <Appbar.Content  title={"Pending Users" + ' (' + (this.state.totalCount ? this.state.totalCount : '0') + ')'}
                                         titleStyle={[Styles.ffMextrabold,Styles.colorBlue]}/>
                        {
                            this.state.SearchBarView
                                ?
                                <Appbar.Action onPress={() => {  this.setState({SearchBarView: !this.state.SearchBarView,searchData:''},()=>{
                                    this.getPendingUsersList('',1);
                                })
                                }} icon={ "cancel"}
                                               color={  'red'}/>
                                :
                                <Appbar.Action onPress={() => {
                                    this.setState({SearchBarView: !this.state.SearchBarView})
                                }} icon={ "search"}
                                               color={  "#000" }/>

                        }
                    </Appbar.Header>
                </View>
                {
                    this.state.SearchBarView === true
                        ?
                        <Searchbar
                            style={{margin: 10}}
                            isFocused="false"
                            placeholder="Search by Name"
                            onChangeText={searchData => {
                                this.setState({searchData: searchData},()=>{
                                    this.getPendingUsersList(searchData,1)
                                })
                            }}
                            onSubmitEditing={()=>{this.getPendingUsersList(this.state.searchData,1)}}
                            value={this.state.searchData}
                        />
                        :
                        null
                }
                <View style={[Styles.flex1]}>
                    {
                        usersList.length > 0
                            ?
                            <FlatList
                                data={usersList}
                                renderItem={({item}) => ( this.listOfPendingUsers(item))}
                                keyExtractor={(item, index) => index.toString()}
                                refreshing={refreshing}
                                onRefresh={this.handleRefresh}
                                onEndReached={this.handleLoadMore}
                                onEndReachedThreshold={1}
                                ListFooterComponent={this.renderFooter}
                                contentContainerStyle={{marginBottom: 50}}
                            />
                            :
                            <Text
                                style={[Styles.ffMbold, Styles.aslCenter, Styles.padV30, Styles.f18, Styles.colorBlue]}>No
                                Pending Users</Text>
                    }
                </View>


                {/*Modal for USERS ACCEPT LIST */}
                <Modal
                    transparent={true}
                    visible={this.state.showAcceptModal}
                    animationType='slide'
                    onRequestClose={() => {
                        this.setState({showAcceptModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({showAcceptModal: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        {  this.state.spinnerBool === false  ?  null  :  <CSpinner/>  }
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br30, Styles.mBtm20, {
                                width: Dimensions.get('window').width - 40,
                                height: Dimensions.get('window').height - 120
                            }]}>
                            {this.state.selectedUserDetails ?
                                <ScrollView style={[Styles.flex1]}>
                                    <Text style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.pTop10, Styles.cRed]}>{_.startCase(_.toLower(this.state.selectedUserDetails.fullName))}</Text>


                                    <Card style={[Styles.OrdersScreenCardshadow,Styles.marV10,Styles.marH15]}>
                                        <Card.Title
                                            title={'Remarks List'}
                                            titleStyle={[Styles.f16, Styles.ffMbold, Styles.colorBlue]}
                                            right={() =>
                                                <View style={[Styles.row, Styles.mRt15]}>
                                                    <TouchableOpacity style={[Styles.aslCenter]}
                                                                      onPress={()=>{this.setState({showRemarksList:!this.state.showRemarksList})}} >
                                                        <Entypo name={ this.state.showRemarksList === false ?"chevron-down":"chevron-up"} size={32}
                                                                color="#000" style={[Styles.bgLWhite, Styles.br20, Styles.aslCenter]}/>
                                                    </TouchableOpacity>
                                                </View>
                                            }>
                                        </Card.Title>
                                        {
                                             this.state.showRemarksList
                                                ?
                                                 this.state.selectedUserDetails.userProfileRemarks
                                                    ?
                                                    <View
                                                        style={[Styles.aslCenter, Styles.padH10,Styles.mBtm10]}>
                                                        {
                                                            this.state.selectedUserDetails.userProfileRemarks.length > 0
                                                                ?
                                                                this.state.selectedUserDetails.userProfileRemarks.map(function (item, index) {
                                                                    return (
                                                                        <View key={index}
                                                                              style={[Styles.aslStart, Styles.marV5, ]}>
                                                                            <Text
                                                                                style={[Styles.f14, Styles.ffMbold, Styles.aslCenter, Styles.colorBlue,Styles.flexWrap]}>{index+1}.{item.remarks}</Text>
                                                                        </View>
                                                                    )
                                                                })
                                                                :
                                                                <Text  style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.padV20, Styles.colorBlue]}>No Remarks</Text>
                                                        }
                                                    </View>
                                                    :
                                                     <Text  style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.padV20, Styles.colorBlue]}>No Remarks</Text>
                                                :
                                               null
                                        }
                                    </Card>
                                    {
                                        this.state.showRemarksList
                                        ?
                                            null
                                            :
                                            <ScrollView style={[Styles.flex1]}>

                                                {
                                                    this.state.selectedUserDetails.missingFields.length === 0 && userRole === 45
                                                        ?
                                                        // ACCEPT USER VIEW
                                                        <ScrollView style={[Styles.padH20]}>
                                                            <Text
                                                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.padV10, Styles.colorBlue]}>Accept
                                                                User </Text>
                                                            <View
                                                                style={[Styles.bw1, Styles.bcAsh, Styles.padV5, Styles.marV5, Styles.br5, Styles.marV10, Styles.bgWhite, Styles.ProfileScreenCardshadow]}>
                                                                <Picker
                                                                    itemStyle={[Styles.ffMregular, Styles.f18]}
                                                                    selectedValue={this.state.AcceptRoleValue}
                                                                    mode='dropdown'
                                                                    onValueChange={(itemValue, itemIndex) => this.setState({AcceptRoleValue: itemValue})}
                                                                >
                                                                    {this.state.rolesList.map((item, index) => {
                                                                        return (
                                                                            < Picker.Item label={Services.returnRoleName(item.key)}
                                                                                          value={item.value}
                                                                                          key={index}/>);
                                                                    })}
                                                                </Picker>
                                                            </View>
                                                            {
                                                                this.state.errorRoleValue ?
                                                                    <Text style={{
                                                                        color: 'red',
                                                                        fontFamily: 'Muli-Regular',
                                                                        paddingLeft: 20, marginBottom: 10
                                                                    }}>{this.state.errorRoleValue}</Text>
                                                                    :
                                                                    null
                                                            }

                                                            <View
                                                                style={[Styles.bw1, Styles.bcAsh, Styles.padV5, Styles.marV10, Styles.br5, Styles.bgWhite, Styles.ProfileScreenCardshadow]}>
                                                                <Picker
                                                                    itemStyle={[Styles.ffMregular, Styles.f18]}
                                                                    selectedValue={this.state.AcceptSiteValue}
                                                                    mode='dropdown'
                                                                    onValueChange={(itemValue, itemIndex) => this.setState({AcceptSiteValue: itemValue})}
                                                                >
                                                                    {this.state.sitesList.length > 0
                                                                        ?
                                                                        this.state.sitesList.map((item, index) => {
                                                                            return (
                                                                                < Picker.Item label={item.name}
                                                                                              value={item.id}
                                                                                              key={index}/>);
                                                                        }) :
                                                                        < Picker.Item label={'NO SITES'}/>
                                                                    }
                                                                </Picker>
                                                            </View>
                                                            {
                                                                this.state.errorSiteValue ?
                                                                    <Text style={{
                                                                        color: 'red',
                                                                        fontFamily: 'Muli-Regular',
                                                                        paddingLeft: 20, marginBottom: 10
                                                                    }}>{this.state.errorSiteValue}</Text>
                                                                    :
                                                                    null
                                                            }


                                                            {/*ACCEPT REASON*/}
                                                            <View>
                                                                <View style={[Styles.row, Styles.mTop15]}>
                                                                    <Text
                                                                        style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Remarks</Text>
                                                                </View>
                                                                <TextInput
                                                                    style={[Styles.marV5, Styles.brdrBtm1, Styles.colorBlue, Styles.f16]}
                                                                    placeholder='Enter Remarks'
                                                                    multiline={true}
                                                                    autoCompleteType='off'
                                                                    autoCapitalize="none"
                                                                    blurOnSubmit={false}
                                                                    value={this.state.AcceptReason}
                                                                    returnKeyType="done"
                                                                    ref={(input) => {
                                                                        this.AcceptReason = input;
                                                                    }}
                                                                    onSubmitEditing={() => {
                                                                        Keyboard.dismiss()
                                                                    }}
                                                                    onChangeText={(AcceptReason) => this.setState({AcceptReason}, () => {
                                                                        let resp = {};
                                                                        resp = Utils.isValidRemarks(this.state.AcceptReason);
                                                                        if (resp.status === true) {
                                                                            this.setState({errorAcceptReason: null});
                                                                        } else {
                                                                            this.setState({errorAcceptReason: resp.message});
                                                                        }
                                                                    })}/>
                                                                {
                                                                    this.state.errorAcceptReason ?
                                                                        <Text style={{
                                                                            color: 'red',
                                                                            fontFamily: 'Muli-Regular',
                                                                            paddingLeft: 20, marginBottom: 10
                                                                        }}>{this.state.errorAcceptReason}</Text>
                                                                        :
                                                                        null
                                                                }
                                                            </View>


                                                            {/*isContractor CHECKBOX*/}
                                                            {/*<TouchableOpacity style={[Styles.row, {right: 10}]}*/}
                                                            {/*                  onPress={() => this.setState({isContractor: !this.state.isContractor})}>*/}
                                                            {/*    <CheckBox*/}
                                                            {/*        containerStyle={{*/}
                                                            {/*            backgroundColor: "#fff",*/}
                                                            {/*            borderWidth: 0,*/}
                                                            {/*        }}*/}
                                                            {/*        checkedColor='#36A84C'*/}
                                                            {/*        size={25}*/}
                                                            {/*        onPress={() => this.setState({isContractor: !this.state.isContractor})}*/}
                                                            {/*        checked={this.state.isContractor}*/}
                                                            {/*    />*/}
                                                            {/*    <Text*/}
                                                            {/*        style={[Styles.f16, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter, {right: 16}]}>Contractor</Text>*/}
                                                            {/*</TouchableOpacity>*/}
                                                        </ScrollView>
                                                        :
                                                        // PENDING FIELDS LIST
                                                        <View style={[Styles.flex1]}>
                                                            <Text
                                                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.padV10, Styles.cRed]}>Pending
                                                                Profile Fields
                                                                ({this.state.selectedUserDetails.missingFields.length})</Text>
                                                            <ScrollView
                                                                style={[Styles.aslCenter, Styles.bw1, Styles.bcBlue, Styles.padH10,
                                                                    {height: Dimensions.get('window').height / (this.state.selectedUserDetails.missingFields.length === 0 ? 4 : 3)}]}>
                                                                {
                                                                    this.state.selectedUserDetails.missingFields.length > 0
                                                                        ?
                                                                        <FlatList
                                                                            data={this.state.selectedUserDetails.missingFields}
                                                                            renderItem={({item}) => ( <TouchableOpacity
                                                                                // disabled={userRole !== 45}
                                                                                 onPress={()=>this.checkPendingListText(item)}
                                                                                  style={[Styles.aslCenter, Styles.bw1, Styles.bcAsh, Styles.p10, Styles.marV5, {width: Dimensions.get('window').width - 95}]}>
                                                                                <Text  style={[Styles.f14, Styles.ffMbold, Styles.aslCenter, Styles.colorBlue]}>{item}</Text>
                                                                            </TouchableOpacity>)}
                                                                            keyExtractor={(item, index) => index.toString()}
                                                                        />
                                                                        :
                                                                        <View  style={[Styles.aslCenter, Styles.p10, Styles.marV5, {width: Dimensions.get('window').width - 95}]}>
                                                                            <Text
                                                                                style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.colorBlue]}>No
                                                                                Pending Fields</Text>
                                                                        </View>
                                                                }
                                                            </ScrollView>
                                                        </View>
                                                }



                                                        <View style={[Styles.row, Styles.jSpaceBet, Styles.mTop10, Styles.padH20]}>
                                                            <TouchableOpacity
                                                                onPress={() => this.setState({showAcceptModal: false}, () => {
                                                                    // this.props.navigation.navigate('profile', {
                                                                    this.props.navigation.navigate('NewProfileScreen', {
                                                                        UserFlow: 'SITE_ADMIN',
                                                                        UserStatus: "PENDING",
                                                                        selectedProfileUserID: this.state.selectedUserDetails.id,
                                                                        onFocusPendingItem:null
                                                                    })
                                                                })}
                                                                style={[Styles.br5, Styles.aslCenter, Styles.bgOrangeYellow, Styles.m3]}>
                                                                <Text
                                                                    style={[Styles.f16, Styles.padH5, Styles.padV10, Styles.ffMextrabold, Styles.cWhite]}>EDIT
                                                                    PROFILE</Text>
                                                            </TouchableOpacity>
                                                            {
                                                                userRole === 45
                                                                    ?
                                                            <TouchableOpacity
                                                                disabled={this.state.selectedUserDetails.missingFields.length >= 1}
                                                                onPress={() => {
                                                                    this.ValidateAcceptUser('onClickSave')
                                                                }}
                                                                style={[Styles.br5, Styles.aslCenter, this.state.selectedUserDetails.missingFields.length >= 1 ? Styles.bgDisabled : Styles.bgGrn, Styles.m3]}>
                                                                <Text
                                                                    style={[Styles.f16, Styles.padH5, Styles.padV10, Styles.ffMextrabold, Styles.cWhite]}>ACCEPT</Text>
                                                            </TouchableOpacity>
                                                                    :
                                                                    null
                                                            }
                                                        </View>

                                            </ScrollView>

                                    }

                                </ScrollView>

                                : null
                            }

                            <TouchableOpacity style={[Styles.marV30]} onPress={() => {
                                this.setState({showAcceptModal: false})
                            }}>
                                <View
                                    style={[Styles.p15, Styles.br5, Styles.marH30, {backgroundColor: '#f5f5f5'}]}>
                                    <Text
                                        style={[Styles.ffMregular, Styles.f16, Styles.colorBlue, {textAlign: 'center'}]}>tap
                                        to
                                        dismiss</Text>
                                </View>
                            </TouchableOpacity>

                        </View>

                    </View>

                </Modal>


                {/*Modal for PASSWORD CHANGE */}
                <Modal
                    transparent={true}
                    visible={this.state.showChangePassword}
                    animationType='slide'
                    onRequestClose={() => {
                        this.setState({showChangePassword: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({showChangePassword: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        {  this.state.spinnerBool === false  ?  null  :  <CSpinner/>  }
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br30, Styles.mBtm20, {
                                width: Dimensions.get('window').width - 40,
                                height: Dimensions.get('window').height / 1.5
                            }]}>
                            {this.state.selectedUserDetails ?
                                <ScrollView style={[Styles.marH20]}>
                                    <Text style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.pTop10, Styles.cRed]}>{this.state.selectedUserDetails.fullName}</Text>
                                    <View style={[Styles.marV20]}>
                                        <Text
                                            style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.padV10, Styles.cRed]}>Reset
                                            Password </Text>
                                    </View>


                                    <View>
                                        <TextInput label='New Password*'
                                                   style={[Styles.marV5, Styles.brdrBtm1, Styles.colorBlue, Styles.f16]}
                                                   theme={theme}
                                                   mode='outlined'
                                                   autoCompleteType='off'
                                                   placeholderTextColor='#233167'
                                                   autoCapitalize="none"
                                                   blurOnSubmit={false}
                                                   returnKeyType="next"
                                                   placeholder='New Password *'
                                                   secureTextEntry={true}
                                                   value={this.state.password}
                                                   ref={(input) => {
                                                       this.password = input;
                                                   }}
                                                   onSubmitEditing={() => {
                                                       this.confirmPassword.focus();
                                                   }}
                                                   onChangeText={(password) => this.setState({password}, function () {
                                                       this.validatePassword()
                                                   })}/>
                                        {
                                            this.state.errorPassMessage ?
                                                <Text style={{
                                                    color: 'red',
                                                    fontFamily: 'Muli-Regular',
                                                    paddingLeft: 20, marginBottom: 10
                                                }}>{this.state.errorPassMessage}</Text>
                                                :
                                                <Text/>
                                        }
                                        {this.state.isValidPassword === true ?
                                            Services.successIcon()
                                            :
                                            this.state.isValidPassword === false ?
                                                Services.errorIcon() : null
                                        }
                                    </View>
                                    <View>
                                        <TextInput label='Confirm Password*'
                                                   style={[Styles.marV5, Styles.brdrBtm1, Styles.colorBlue, Styles.f16]}
                                                   theme={theme}
                                                   mode='outlined'
                                                   autoCompleteType='off'
                                                   placeholderTextColor='#233167'
                                                   autoCapitalize="none"
                                                   blurOnSubmit={false}
                                                   returnKeyType="done"
                                                   placeholder='Confirm Password *'
                                                   secureTextEntry={true}
                                                   value={this.state.confirmPassword}
                                                   ref={(input) => {
                                                       this.confirmPassword = input;
                                                   }}
                                                   onSubmitEditing={() => {
                                                       Keyboard.dismiss()
                                                   }}
                                                   onChangeText={(confirmPassword) => this.setState({confirmPassword}, function () {
                                                       this.validatePassword();
                                                   })}/>
                                        {
                                            this.state.errorCPassMessage ?
                                                <Text style={{
                                                    color: 'red',
                                                    fontFamily: 'Muli-Regular',
                                                    paddingLeft: 20, marginBottom: 10
                                                }}>{this.state.errorCPassMessage}</Text>
                                                :
                                                <Text/>
                                        }
                                        {this.state.isValidCPassword === true ?
                                            Services.successIcon()
                                            :
                                            this.state.isValidCPassword === false ?
                                                Services.errorIcon() : null
                                        }
                                    </View>


                                    <TouchableOpacity
                                        onPress={() => this.validatePassword('onClickSave')}
                                        style={[Styles.mTop40, Styles.mBtm10, {backgroundColor: '#C91A1F'}, Styles.bcRed, Styles.br5,]}>
                                        <Text
                                            style={[Styles.f18, Styles.ffMbold, Styles.cWhite, Styles.padH10, Styles.padV10, Styles.aslCenter]}>Change
                                            Password</Text>
                                    </TouchableOpacity>

                                </ScrollView>

                                : null
                            }

                            <TouchableOpacity style={[Styles.marV30]} onPress={() => {
                                this.setState({showChangePassword: false})
                            }}>
                                <View
                                    style={[Styles.p15, Styles.br5, Styles.marH30, {backgroundColor: '#f5f5f5'}]}>
                                    <Text
                                        style={[Styles.ffMregular, Styles.f16, Styles.colorBlue, {textAlign: 'center'}]}>tap
                                        to
                                        dismiss</Text>
                                </View>
                            </TouchableOpacity>

                        </View>

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
                        <TouchableOpacity onPress={() => {
                            this.setState({showRejectUserModal: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        {  this.state.spinnerBool === false  ?  null  :  <CSpinner/>  }
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br30, Styles.mBtm20, {
                                width: Dimensions.get('window').width - 40,
                                height: Dimensions.get('window').height / 2
                            }]}>
                            {this.state.selectedUserDetails ?
                                <ScrollView style={[Styles.marH20]}>

                                    <View>
                                        <Text style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.pTop10, Styles.cRed]}>{this.state.selectedUserDetails.fullName}</Text>
                                        <View style={[Styles.row, Styles.mTop15]}>
                                            <Text
                                                style={[Styles.f18, Styles.colorBlue, Styles.ffMbold, Styles.aslCenter]}>Reject
                                                Reason</Text>
                                        </View>
                                        <TextInput
                                            style={[Styles.marV5, Styles.brdrBtm1, Styles.colorBlue, Styles.f16]}
                                            placeholder='Enter Reject Reason'
                                            multiline={true}
                                            autoCompleteType='off'
                                            autoCapitalize="none"
                                            blurOnSubmit={false}
                                            value={this.state.RejectReason}
                                            returnKeyType="done"
                                            ref={(input) => {
                                                this.RejectReason = input;
                                            }}
                                            onSubmitEditing={() => {
                                                Keyboard.dismiss()
                                            }}
                                            onChangeText={(RejectReason) => this.setState({RejectReason}, () => {
                                                let resp = {};
                                                resp = Utils.isValidReason(this.state.RejectReason);
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
                                                    paddingLeft: 20, marginBottom: 10
                                                }}>{this.state.errorRejectReason}</Text>
                                                :
                                                null
                                        }
                                    </View>


                                    <TouchableOpacity
                                        onPress={() => {
                                            let resp = {};
                                            resp = Utils.isValidReason(this.state.RejectReason);
                                            if (resp.status === true) {
                                                this.setState({errorRejectReason: null});
                                                this.rejectUser(this.state.RejectReason)
                                            } else {
                                                this.setState({errorRejectReason: resp.message});
                                            }
                                        }}
                                        style={[Styles.mTop40, Styles.mBtm10, {backgroundColor: '#C91A1F'}, Styles.bcRed, Styles.br5,]}>
                                        <Text
                                            style={[Styles.f18, Styles.ffMbold, Styles.cWhite, Styles.padH10, Styles.padV10, Styles.aslCenter]}>Reject
                                            User</Text>
                                    </TouchableOpacity>

                                </ScrollView>

                                : null
                            }

                            <TouchableOpacity style={[Styles.marV30]} onPress={() => {
                                this.setState({showRejectUserModal: false})
                            }}>
                                <View
                                    style={[Styles.p15, Styles.br5, Styles.marH30, {backgroundColor: '#f5f5f5'}]}>
                                    <Text
                                        style={[Styles.ffMregular, Styles.f16, Styles.colorBlue, {textAlign: 'center'}]}>tap
                                        to
                                        dismiss</Text>
                                </View>
                            </TouchableOpacity>

                        </View>

                    </View>

                </Modal>
            </View>
        );
    }
}

