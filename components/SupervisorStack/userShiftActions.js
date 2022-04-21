import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Linking,
    StyleSheet,
    Modal,
    Dimensions,
    ScrollView, BackHandler, Alert
} from 'react-native';
import Config from "../common/Config";
import Services from "../common/Services";
import {CSpinner, CText, LoadImages, LoadSVG, Styles} from "../common";
import OfflineNotice from "../common/OfflineNotice";
import {Appbar, Card, Title, List, RadioButton, TextInput} from "react-native-paper";
import _ from "lodash";
import Icon from "react-native-vector-icons/dist/MaterialIcons";
import FastImage from "react-native-fast-image";
import Utils from "../common/Utils";
import {CDismissButton} from "../common/CDismissButton";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AntDesign from "react-native-vector-icons/AntDesign";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-community/async-storage";
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";

export default class userShiftActions extends React.Component {

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
            userDetails: '',
            dayStatus: '',
            selectedUserSiteDetails: '',
            cancelShiftReasonModal: false,
            cancelShiftReasonsList: [{reason: 'Planned Leave', value: '1'},
                {reason: 'Sick', value: '2'},
                {reason: 'Absent', value: '3'},
                {reason: 'Holiday', value: '4'},
                {reason: 'Vehicle Issue', value: '5'},
                {reason: 'No Volume', value: '7'},
                {reason: 'Others', value: '6'}],
            showButton: false, otherReasontoCancel: '',

        }
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    onBack = () => {
        return this.props.navigation.navigate('TeamListingScreen');
    };

    componentDidMount() {
        this.willBlur = this.props.navigation.addListener('willBlur', payload =>
            BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        );
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
        AsyncStorage.getItem('Whizzard:selectedUserSiteDetails').then((selectedUserSiteDetails) => {
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                const parsedSiteDetails = JSON.parse(selectedUserSiteDetails)
                self.setState({
                    userRole: userRole,
                    dayStatus: parsedSiteDetails.dayStatus,
                    selectedUserSiteDetails: parsedSiteDetails,
                }, function () {
                    self.isShiftActionsAllowed(parsedSiteDetails);
                    // console.log('parsedSiteDetails SHIFT ACTIONS ', parsedSiteDetails);
                });
            });
        });
        });
    }

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

    //error handling
    errorHandling(error) {
        // console.log("user shift action screen error", error, error.response);
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


    isShiftActionsAllowed(parsedSiteDetails) {
        const self = this;
        // console.log('isShiftActionsAllowed parsedSiteDetails', parsedSiteDetails);
        const actionsUrl = Config.routes.BASE_URL + Config.routes.IS_SHIFT_ACTIONS_ALLOWED + '?shiftId=' + parsedSiteDetails.shiftId + '&userId=' + parsedSiteDetails.userId + '&daysToAdd=' + self.state.dayStatus;
        const body = {};
        // console.log('actions url',actionsUrl,'body==>',body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(actionsUrl, 'PUT', body, function (response) {
                // console.log('isShiftActionsAllowed resp200', response.data);
                const result = response.data;
                self.setState({
                    isAllowedAction: result.allowActions,
                    userDetails: result,
                    spinnerBool: false
                })
            }, function (error) {
                self.setState({spinnerBool: false})
                // console.log('isShiftActionsAllowed error--', error, error.response);
                self.errorHandling(error);
            })
        })
    }

    validateCancelShiftReason() {
        if (this.state.CancelShiftReason) {
            if (this.state.cancelReasonValue === '6') {
                if (this.state.otherReasontoCancel) {
                    this.setState({
                        cancelShiftReasonModal: false,
                        CancelShiftReason: this.state.otherReasontoCancel
                    }, () => {
                        this.CancelShift(this.state.userDetails.shiftId)
                    })
                } else {
                    Utils.dialogBox('Please enter other Reason to Cancel the Shift', '')
                }

            } else {
                this.setState({
                    cancelShiftReasonModal: false,
                }, () => {
                    this.CancelShift(this.state.userDetails.shiftId)
                })
            }

        } else {
            Utils.dialogBox('Please select Reason to Cancel the Shift', '')
        }
    }

    //API CALL to  Cancel Shift
    CancelShift = (shiftId) => {
        const self = this;
        // console.log('self.state.CancelShiftReason', self.state.CancelShiftReason);
        const CancelShift = Config.routes.BASE_URL + Config.routes.CANCEL_SHIFT;
        const body = JSON.stringify({
            "shiftId": shiftId,
            "reason": self.state.CancelShiftReason
        });
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(CancelShift, "PUT", body, function (response) {
                if (response.status === 200) {
                    const parsedData = response.data;
                    // console.log("CancelShift resp200====", parsedData);
                    self.setState({spinnerBool: false, CancelShiftReason: ''}, () => {
                        Utils.dialogBox(parsedData.message, '');
                        self.props.navigation.navigate('TeamListingScreen');
                    })
                }
            }, function (error) {
                self.errorHandling(error);
                self.isShiftActionsAllowed();
            })
        });
    };


    render() {
        const {userDetails} = this.state;
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <Appbar.Header style={Styles.bgWhite}>
                    <Appbar.Action icon="chevron-left" size={30} onPress={() => {
                        // this.props.navigation.goBack()
                        // this.props.navigation.navigate('TeamListingScreen');
                        this.onBack()
                    }}/>
                </Appbar.Header>

                {/*MODAL to cancel the shift with reason*/}
                <Modal
                    transparent={true}
                    visible={this.state.cancelShiftReasonModal}
                    onRequestClose={() => {
                        this.setState({cancelShiftReasonModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <CDismissButton onPress={() => this.setState({cancelShiftReasonModal: false})}
                                        showButton={'modalBgDismiss'}/>

                        <View style={[Styles.bgWhite, Styles.br15, Styles.mBtm30, {
                            width: Dimensions.get('window').width - 60,
                            height: this.state.cancelReasonValue === '6' ? Dimensions.get('window').height - 200 : Dimensions.get('window').height - 300,
                        }]}>

                            <View style={[Styles.p15, {paddingLeft: 25}]}>
                                <Title style={[Styles.ffMbold, Styles.f20, Styles.aslStart]}>Cancel Shift</Title>
                            </View>
                            <ScrollView style={[Styles.pBtm10]} persistentScrollbar={true}>
                                <View style={[Styles.padV10, Styles.bcAsh, {borderBottomWidth: 1, borderTopWidth: 1,}]}>
                                    {this.state.cancelShiftReasonsList.map(item => {
                                        return (
                                            <View key={item.value}>
                                                <RadioButton.Group
                                                    style={[Styles.row, Styles.aslCenter]}
                                                    onValueChange={cancelReasonValue => this.setState({
                                                        cancelReasonValue,
                                                        CancelShiftReason: item.reason,
                                                        showButton: true, otherReasontoCancel: ''
                                                    })}
                                                    value={this.state.cancelReasonValue}
                                                >
                                                    <View style={[Styles.row, Styles.p5, {paddingLeft: 25}]}>
                                                        <RadioButton style={[{paddingTop: 2}]} value={item.value}
                                                                     color='green'/>
                                                        <Text style={[Styles.aslCenter, Styles.ffMbold, Styles.f18, {
                                                            paddingTop: 0,
                                                            paddingLeft: 15
                                                        }]}>{item.reason}</Text>
                                                    </View>
                                                </RadioButton.Group>
                                            </View>
                                        );
                                    })}
                                    {
                                        this.state.cancelReasonValue === '6'
                                            ?
                                            <View style={[Styles.padH15]}>
                                                <TextInput
                                                    multiline={true}
                                                    numberOfLines={8}
                                                    style={[Styles.bgWhite, Styles.f18, Styles.bw1, Styles.bcAsh, Styles.m15, {height: 140}]}
                                                    label='Reason to Cancel Shift'
                                                    value={this.state.otherReasontoCancel}
                                                    onChangeText={otherReasontoCancel => this.setState({otherReasontoCancel})}
                                                />
                                            </View>
                                            :
                                            null
                                    }
                                </View>

                                <View style={[Styles.row, Styles.jSpaceArd, Styles.p10]}>
                                    <TouchableOpacity onPress={() => this.setState({cancelShiftReasonModal: false})}
                                                      style={[Styles.aslCenter, Styles.br10, {backgroundColor: '#e3e3e3'}]}>
                                        <Text
                                            style={[Styles.ffMbold, Styles.aslCenter, Styles.padH10, Styles.padV10, Styles.f18,]}>CANCEL</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity disabled={this.state.showButton === false}
                                                      onPress={() => this.validateCancelShiftReason()}
                                                      style={[Styles.aslCenter, Styles.br10, {backgroundColor: this.state.showButton === false ? '#e3e3e3' : '#58a84b'}]}>
                                        <Text
                                            style={[Styles.ffMbold, Styles.cWhite, Styles.aslCenter, Styles.padH10, Styles.padV10, Styles.f18,]}>SUBMIT</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>


                        </View>
                    </View>
                </Modal>

                {
                    this.state.userDetails ?
                        <View style={[Styles.flex1]}>
                            <View style={[Styles.aslCenter, Styles.alignCenter]}>
                                <View style={{position: 'relative'}}>
                                    {Services.getUserProfilePic(this.state.userDetails.profilePicUrl)}
                                    <View style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: -20,
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <View style={{backgroundColor: "#fff", padding: 2, borderRadius: 25}}>
                                            <Text style={{
                                                height: 14,
                                                width: 14,
                                                backgroundColor: Services.getShiftStatusColours(this.state.userDetails.shiftStatus),
                                                borderRadius: 25
                                            }}> </Text>
                                        </View>
                                    </View>
                                </View>
                                <Text
                                    style={[Styles.ffMbold, Styles.f18, Styles.pTop5]}>{_.startCase(_.toLower(this.state.userDetails.userName))}</Text>
                                <Text
                                    style={[Styles.ffMregular]}>{(Services.getUserRoles(userDetails.role)) + ' ( ' + Services.getShiftTimings(userDetails) + ' )'}</Text>
                                <Text style={[Styles.ffMregular]}>{Services.getShiftStatusName(this.state.userDetails.shiftStatus)}</Text>
                                <View style={[Styles.row, Styles.marV20]}>
                                    {
                                        userDetails.userStatus === "NOT_REGISTERED"
                                            ?
                                            <View >
                                                <Text
                                                    style={[Styles.ffMbold, Styles.padV10, Styles.padH30, Styles.cWhite, Styles.f18, Styles.mRt5, Styles.br5,Styles.bgBlk]}>{_.startCase(userDetails.userStatus)}</Text>
                                            </View>
                                            :
                                            <TouchableOpacity
                                                onPress={() => this.props.navigation.navigate('CreateShift', {
                                                    toUserDetails: {
                                                        userId: this.state.userDetails.userId,
                                                        userName: this.state.userDetails.userName,
                                                        phoneNumber: this.state.userDetails.userPhone,
                                                        role: this.state.userDetails.role,
                                                        userProfilePic: this.state.userDetails.profilePicUrl,
                                                        dayStatus: this.state.selectedUserSiteDetails.dayStatus,
                                                        siteId: this.state.selectedUserSiteDetails.siteId,
                                                        siteName: this.state.selectedUserSiteDetails.siteName,
                                                        screenName: 'userShiftActions'
                                                    }
                                                })}
                                                disabled={this.state.dayStatus === -1}>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.padV10, Styles.padH30, Styles.cWhite, Styles.f18, Styles.mRt5, Styles.br5,
                                                        this.state.dayStatus === -1 ? {backgroundColor: '#ccc'} : {backgroundColor: "#000"}]}>Assign
                                                    Shift</Text>
                                            </TouchableOpacity>
                                    }
                                    <TouchableOpacity onPress={() => {
                                        Linking.openURL(`tel:${this.state.userDetails.userPhone}`)
                                    }}>
                                        <Text
                                            style={[Styles.ffMregular, Styles.p10, Styles.cWhite, Styles.bgGrn, Styles.br5]}>
                                            <Icon name="call" size={24}/>
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>


                            <ScrollView
                                style={[{
                                    borderTopWidth: 1,
                                    borderTopColor: '#CCC'
                                }, Styles.pTop20, Styles.flex1, Styles.m20]}>

                                {this.state.userDetails.shiftStatus === 'INIT' && this.state.isAllowedAction === true && this.state.dayStatus === 0
                                    ?
                                    <TouchableOpacity onPress={() => this.props.navigation.navigate('ScanQRcode', {
                                        UserShiftResponse: this.state.userDetails,
                                        allowSkipQRCode: this.state.userDetails.allowSkipQRCode,
                                        UserFlow:userDetails.userStatus === "NOT_REGISTERED" ? 'ADMIN_ADHOC_FLOW' : 'SITE_ADMIN'
                                    })} style={[styles.shiftAction]}>
                                        <FastImage source={LoadImages.adminMarkAttend}
                                                   style={{width: 20, height: 23, marginRight: 15}}/>
                                        <Text style={[Styles.ffMbold, Styles.f16]}>Mark Attendance</Text>
                                    </TouchableOpacity>
                                    :
                                    this.state.userDetails.shiftStatus === 'ATTENDANCE_MARKED' && this.state.dayStatus === 0   ?
                                        <TouchableOpacity
                                            onPress={() => this.props.navigation.navigate('StartShiftScreen', {
                                                CurrentShiftId: this.state.userDetails.shiftId,
                                                currentUserId: this.state.userDetails.userId,
                                                UserFlow: userDetails.userStatus === "NOT_REGISTERED" ? 'ADMIN_ADHOC_FLOW' : 'SITE_ADMIN'
                                            })} style={[styles.shiftAction]}>
                                             <MaterialCommunityIcons name="map-marker-path" size={24} color='#000'
                                                                    style={{marginRight: 20, marginLeft: 2}} />
                                            <Text style={[Styles.ffMbold, Styles.f16]}>Start Shift</Text>
                                        </TouchableOpacity>
                                        :
                                        this.state.userDetails.shiftStatus === 'SHIFT_IN_PROGRESS' && this.state.dayStatus === 0 ?
                                            <TouchableOpacity
                                                onPress={() => this.props.navigation.navigate('EndShiftScreen', {
                                                    CurrentShiftId: this.state.userDetails.shiftId,
                                                    currentUserId: this.state.userDetails.userId,
                                                    UserFlow: userDetails.userStatus === "NOT_REGISTERED" ? 'ADMIN_ADHOC_FLOW' : 'SITE_ADMIN'
                                                })} style={[styles.shiftAction]}>
                                                <FastImage source={LoadImages.disabled_endpoint}
                                                           style={{width: 21, height: 21, marginRight: 15}}/>
                                                <Text style={[Styles.ffMbold, Styles.f16]}>End Shift</Text>
                                            </TouchableOpacity>
                                            :
                                            null
                                }
                                {this.state.dayStatus === -1 ? null :
                                    this.state.userDetails.shiftStatus === "INIT" ?
                                        <TouchableOpacity onPress={() => {
                                            this.setState({cancelShiftReasonModal: true})
                                        }} style={[styles.shiftAction]}>
                                            <FastImage source={LoadImages.cancelShift}
                                                       style={{width: 21, height: 21, marginRight: 15}}/>
                                            <Text style={[Styles.ffMbold, Styles.f16]}>Cancel Shift</Text>
                                        </TouchableOpacity> : null
                                }
                                {
                                    this.state.userDetails.shiftStatus === "ATTENDANCE_MARKED" || this.state.userDetails.shiftStatus === "SHIFT_IN_PROGRESS" || this.state.userDetails.shiftStatus === "SHIFT_ENDED"
                                    || this.state.userDetails.shiftStatus === "SHIFT_ENDED_BY_SUPERVISOR" ?
                                        <TouchableOpacity
                                            onPress={() => this.props.navigation.navigate('MyTripsMapView', {shiftId: this.state.userDetails.shiftId})}
                                            style={[styles.shiftAction]}>
                                            {/*<FastImage source={LoadImages.updateShift}*/}
                                            {/*           style={{width: 21, height: 21, marginRight: 15}}/>*/}
                                            <FontAwesome name="map-pin" size={22} color="gray"
                                                         style={{marginRight: 20, marginLeft: 2}}/>
                                            <Text style={[Styles.ffMbold, Styles.f16]}>Trip View</Text>
                                        </TouchableOpacity> : null
                                }
                                {
                                    this.state.userDetails.role > 10 || this.state.userDetails.shiftStatus === 'SHIFT_CANCELLED_BY_SUPERVISOR' ||
                                    this.state.userDetails.shiftStatus === 'SHIFT_ENDED' || this.state.userDetails.shiftStatus === 'SHIFT_ENDED_BY_SUPERVISOR'
                                    || this.state.userDetails.shiftStatus === 'SHIFT_SUSPENDED' ||
                                    this.state.dayStatus === -1 || this.state.userDetails.shiftStatus === 'REPORTED_ABSENT' ?
                                        null :
                                        <TouchableOpacity
                                            onPress={() => this.props.navigation.navigate('UpdateShiftScreen', {
                                                UserFlow: 'SUPERVISOR',
                                                CurrentShiftId: this.state.userDetails.shiftId,
                                                currentUserId: this.state.userDetails.userId
                                            })}
                                            style={[styles.shiftAction]}>
                                            <FastImage source={LoadImages.updateShift}
                                                       style={{width: 21, height: 21, marginRight: 15}}/>
                                            <Text style={[Styles.ffMbold, Styles.f16]}>Update Shift</Text>
                                        </TouchableOpacity>
                                }
                                {
                                    this.state.userDetails.role > 10 || this.state.userDetails.shiftStatus === 'SHIFT_CANCELLED_BY_SUPERVISOR' || this.state.userDetails.shiftStatus === 'SHIFT_SUSPENDED' || this.state.userDetails.shiftStatus === 'REPORTED_ABSENT' ?
                                        null :
                                        this.state.userDetails.shiftStatus === 'SHIFT_ENDED' || this.state.userDetails.shiftStatus === 'SHIFT_ENDED_BY_SUPERVISOR' ?
                                            <TouchableOpacity
                                                onPress={() => this.props.navigation.navigate('CompletedShiftScreen', {
                                                    UserFlow: 'SUPERVISOR',
                                                    CurrentShiftId: this.state.userDetails.shiftId,
                                                    currentUserId: this.state.userDetails.userId
                                                })}
                                                style={[styles.shiftAction]}>
                                                <FastImage source={LoadImages.updateShift}
                                                           style={{width: 21, height: 21, marginRight: 15}}/>
                                                <Text style={[Styles.ffMbold, Styles.f16]}>Update Shift</Text>
                                            </TouchableOpacity> : null
                                }
                                {
                                    this.state.userDetails.shiftStatus === 'INIT' || this.state.userDetails.shiftStatus === 'SHIFT_SUSPENDED' || this.state.userDetails.shiftStatus === 'REPORTED_ABSENT' || this.state.userDetails.shiftStatus === 'SHIFT_CANCELLED_BY_SUPERVISOR' ?
                                        null :
                                        this.state.userDetails.shiftStatus === "SHIFT_ENDED" || this.state.userDetails.shiftStatus === "SHIFT_ENDED_BY_SUPERVISOR"
                                            ?
                                            <TouchableOpacity
                                                onPress={() =>
                                                    this.props.navigation.navigate('ShiftSummary', {shiftId: this.state.userDetails.shiftId})}
                                                style={[styles.shiftAction]}>
                                                <FastImage source={LoadImages.termsImage}
                                                           style={{width: 21, height: 21, marginRight: 15}}/>
                                                <Text style={[Styles.ffMbold, Styles.f16]}>Shift Summary</Text>
                                            </TouchableOpacity>
                                            :
                                            null
                                }


                                {
                                    userDetails.userStatus === "NOT_REGISTERED"
                                        ? null
                                        :
                                        <View>
                                            {/*{*/}
                                            {/*    this.state.userDetails.shiftStatus === 'SHIFT_ENDED' ?*/}
                                            {/*        <TouchableOpacity*/}
                                            {/*            onPress={() => this.props.navigation.navigate('ShiftExpensesScreen')}*/}
                                            {/*            style={[styles.shiftAction]}>*/}
                                            {/*            <FontAwesome name="rupee" size={22} color="gray"*/}
                                            {/*                         style={{marginRight: 20, marginLeft: 2}}/>*/}
                                            {/*            <Text style={[Styles.ffMbold, Styles.f16]}>Add Expenses</Text>*/}
                                            {/*        </TouchableOpacity> : null*/}
                                            {/*}*/}
                                            {/*{*/}
                                            {/*    this.state.userDetails.shiftStatus === 'SHIFT_CANCELLED_BY_SUPERVISOR' ?*/}
                                            {/*        null :*/}
                                            {/*        <TouchableOpacity*/}
                                            {/*            onPress={() => this.props.navigation.navigate('AddVoucher', {*/}
                                            {/*                userDetails: this.state.userDetails,*/}
                                            {/*                userId: this.state.userDetails.userId*/}
                                            {/*            })}*/}
                                            {/*            style={[styles.shiftAction]}>*/}
                                            {/*            <AntDesign name="pluscircleo" size={21} color="gray"*/}
                                            {/*                       style={{marginRight: 18, marginLeft: 2}}/>*/}
                                            {/*            <Text style={[Styles.ffMbold, Styles.f16]}>Add Voucher</Text>*/}
                                            {/*        </TouchableOpacity>*/}
                                            {/*}*/}

                                            <TouchableOpacity
                                                onPress={() => this.props.navigation.navigate('NewProfileScreen', {
                                                    UserFlow: 'SITE_ADMIN',
                                                    UserStatus: "ACTIVATED",
                                                    selectedProfileUserID: this.state.userDetails.userId,
                                                    onFocusPendingItem: null
                                                })}
                                                style={[styles.shiftAction]}>
                                                <MaterialIcons name="person" size={21} color="black"
                                                               style={{marginRight: 18, marginLeft: 2}}/>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.f16]}>{this.state.userRole === '45' ? 'Update Profile' : 'View Profile'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                }
                                <TouchableOpacity
                                    onPress={() =>
                                        this.props.navigation.navigate('CalendarShifts', {userId: this.state.userDetails.userId})}
                                    style={[styles.shiftAction]}>
                                    <MaterialIcons name="person" size={21} color="black"
                                                   style={{marginRight: 18, marginLeft: 2}}/>
                                    <Text style={[Styles.ffMbold, Styles.f16]}>Calendar Shifts</Text>
                                </TouchableOpacity>

                            </ScrollView>
                        </View> :
                        null
                }
            </View>
        );
    }
};

const styles = StyleSheet.create({
    shiftAction: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#CCC',
        marginHorizontal: 30,
        marginBottom: 10
    }
})
