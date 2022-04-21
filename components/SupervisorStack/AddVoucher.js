import React, {Component} from "react";
import {
    View,
    Text,
    Dimensions,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView, Modal, Keyboard
} from "react-native";
import {Appbar, Card, DefaultTheme, List, RadioButton} from "react-native-paper";
import {CSpinner, LoadSVG, Styles} from "../common";
import OfflineNotice from "../common/OfflineNotice";
import Services from "../common/Services";
import _ from "lodash";
import Config from "../common/Config";
import Utils from "../common/Utils";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import AsyncStorage from "@react-native-community/async-storage";
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";
import {CheckBox} from "react-native-elements";

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

export class AddVoucher extends Component {
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
            voucherTypeList: [{name: 'Office Maintenance', Value: '1'},
                {name: 'Travelling Expenses', Value: '2'},
                {name: 'Staff Welfare', Value: '3'},
                {name: 'Printing & Stationery', Value: '4'},
                {name: 'Repairs &  Maintenance', Value: '5'},
                {name: 'Others', Value: '6'}],
            voucherName: 'Please select voucher',
            userId: '', userDetails: [], userProfile: [], sitesList: [], selectedSite: 'Please select site',
            voucherTypeModal: false,
            siteModal: false,
            adhocVoucher: false,
            vehicleList: [],
            vehicleModal: false,
            selectedVehicle: 'Please select vehicle',
            voucherVerifyOPTModal: false
        };
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    componentDidMount() {
        const self = this;
        AsyncStorage.getItem('Whizzard:selectedUserSiteDetails').then((selectedUserSiteDetails) => {
            self.setState({
                userId: self.props.navigation.state.params.userId,
                userDetails: self.props.navigation.state.params.userDetails,
                selectedUserSiteDetails: JSON.parse(selectedUserSiteDetails),
            }, function () {
                // console.log('params userDetails', self.state.userDetails);
                // console.log('params selectedUserSiteDetails', self.state.selectedUserSiteDetails);
                self.getInitiateVoucherDetails(self.state.selectedUserSiteDetails);
            })
        })
    }

    errorHandling(error) {
        console.log("Add voucher screen error", error, error.response);
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
                Utils.dialogBox("Error loading Vouchers, Please contact Administrator ", '');
            }
        } else {
            self.setState({spinnerBool: false});
            Utils.dialogBox(error.message, '');
        }
    }

    getInitiateVoucherDetails(selectedUserSiteDetails) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_INITIATE_VOUCHER_DETAILS + self.state.userId;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log("getInitiateVoucherDetails rsp 200", response.data);

                    if (selectedUserSiteDetails.siteId) {
                        self.setState(
                            {
                                selectedSite: selectedUserSiteDetails.siteName,
                                selectedSiteId: selectedUserSiteDetails.siteId
                            }
                        )
                    }

                    self.setState({
                        spinnerBool: false,
                        userDetails: response.data,
                        userProfile: response.data.userProfile,
                        sitesList: response.data.sitesList,
                        vehicleList: response.data.userProfile.vehicleList
                    })
                }
            }, function (error) {
                self.errorHandling(error)
            })
        })
    };


    validateVoucher() {
        let resp = {};
        let result = {};
        resp = Utils.isEmptySite(this.state.selectedSiteId);
        if (resp.status === true) {
            result.selectedSiteId = resp.message;
            resp = Utils.isValidVoucherType(this.state.voucherType);
            if (resp.status === true) {
                result.voucherType = resp.message;
                resp = Utils.isValidVoucherAmount(this.state.voucherAmount);
                if (resp.status === true) {
                    result.voucherAmount = resp.message;
                    resp = Utils.isEmptyComment(this.state.voucherComment);
                    if (resp.status === true) {
                        result.voucherComment = resp.message;
                        let body = {
                            adhocVoucher: this.state.adhocVoucher,
                            userId: this.state.userProfile.userId,
                            panCardNumber: this.state.userProfile.panCardNumber,
                            mobileNumber: this.state.userProfile.attrs.mobileNumber,
                            voucherDate: new Date(),
                            placement: this.state.placement,
                            userVehicleType: parseInt(this.state.userVehicleType),
                            siteId: this.state.selectedSiteId,
                            voucherType: this.state.voucherType,
                            voucherAmount: this.state.voucherAmount,
                            comments: this.state.voucherComment
                        };
                        {
                            this.setState({voucherData: body})
                            this.validateVoucherAPI(body)
                        }
                    } else {
                        Utils.dialogBox('Please enter comment', '')
                    }
                } else {
                    Utils.dialogBox(resp.message, '')
                }
            } else {
                Utils.dialogBox(resp.message, '')
            }
        } else {
            Utils.dialogBox(resp.message, '')
        }
    }

    validateAdhocVoucher() {
        let resp = {};
        let result = {};
        resp = Utils.isEmptySite(this.state.selectedSiteId);
        if (resp.status === true) {
            result.selectedSiteId = resp.message;
            resp = Utils.isValidVoucherType(this.state.voucherType);
            if (resp.status === true) {
                result.voucherType = resp.message;
                resp = Utils.isEmptyGender(this.state.placement);
                if (resp.status === true) {
                    result.placement = resp.message;
                    resp = Utils.isEmptyVehicleType(this.state.userVehicleType)
                    if (resp.status === true) {
                        result.userVehicleType = resp.message;
                        resp = Utils.isValidVoucherAmount(this.state.voucherAmount);
                        if (resp.status === true) {
                            result.voucherAmount = resp.message;
                            resp = Utils.isEmptyComment(this.state.voucherComment);
                            if (resp.status === true) {
                                result.voucherComment = resp.message;
                                let body = {
                                    adhocVoucher: this.state.adhocVoucher,
                                    userId: this.state.userProfile.userId,
                                    panCardNumber: this.state.userProfile.panCardNumber,
                                    mobileNumber: this.state.userProfile.attrs.mobileNumber,
                                    voucherDate: new Date(),
                                    placement: this.state.placement,
                                    userVehicleType: parseInt(this.state.userVehicleType),
                                    siteId: this.state.selectedSiteId,
                                    voucherType: this.state.voucherType,
                                    voucherAmount: this.state.voucherAmount,
                                    comments: this.state.voucherComment
                                };
                                {
                                    this.setState({voucherData: body})
                                    this.validateVoucherAPI(body)
                                }
                            } else {
                                Utils.dialogBox('Please enter comment', '')
                            }
                        } else {
                            Utils.dialogBox(resp.message, '')
                        }
                    } else {
                        Utils.dialogBox(resp.message, '')
                    }
                } else {
                    Utils.dialogBox('Please select Voucher Status', '')
                }
            } else {
                Utils.dialogBox(resp.message, '')
            }
        } else {
            Utils.dialogBox(resp.message, '')
        }
    }

    validateVoucherAPI(data) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.VALIDATE_VOUCHER_DETAILS;
        const body = data;
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    if (response.data === true) {
                        self.setState({voucherVerifyOPTModal: true}, function () {
                            self.getVoucherOtp(this.state.userProfile.attrs.mobileNumber)
                        })
                    }
                }
            }, function (error) {
                self.errorHandling(error)
            })
        })
    }

    getVoucherOtp(mobileNumber) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_OTP_TO_VALIDATE_VOUCHER + '?phoneNumber=' + mobileNumber;
        const body = '';
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    console.log('voucherOtp', response.data)
                }
            }, function (error) {
                self.errorHandling(error)
            })
        })
    }

    validateVoucherOtp() {
        let resp = {};
        let result = {};
        resp = Utils.isValidCode(this.state.voucherCode);
        if (resp.status === true) {
            result.voucherCode = resp.message;
            const self = this;
            const apiUrl = Config.routes.BASE_URL + Config.routes.POST_VOUCHER_DETAILS + '?code=' + self.state.voucherCode;
            const body = self.state.voucherData;
            // console.log('asdasd', apiUrl, body)
            this.setState({spinnerBool: true}, () => {
                Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                    if (response.status === 200) {
                        console.log('voucherVali', response.data)
                        Utils.dialogBox('Voucher Verified and Added Successfully', '');
                        self.setState({spinnerBool: false}, () => {
                            self.props.navigation.goBack()
                        });
                    }
                }, function (error) {
                    console.log('error', error, error.response);
                    if (error.response) {
                        if (error.response.status === 403) {
                            self.setState({spinnerBool: false});
                            Utils.dialogBox("Token Expired,Please Login Again", '');
                            self.props.navigation.navigate('Login');
                        } else if (error.response.status === 500) {
                            self.setState({spinnerBool: false});
                            Utils.dialogBox(error.response.data[0].message, '');
                        } else if (error.response.status === 400) {
                            self.setState({spinnerBool: false});
                            Utils.dialogBox(error.response.data[0].message, '');
                        } else {
                            self.setState({spinnerBool: false});
                            Utils.dialogBox("Error loading My Vouchers, Please contact Administrator ", '');
                        }
                    } else {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox(error.message, '');
                    }
                })
            })
        } else {
            Utils.dialogBox(resp.message, '');
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <View style={[Styles.appbarBorder]}>
                    <Appbar.Header theme={theme} style={[Styles.bgWhite,]}>
                        <Appbar.Action icon="chevron-left" size={30} onPress={() => {
                            this.props.navigation.goBack()
                        }}/>
                        <Appbar.Content title="Add Voucher (Paid to)"/>
                    </Appbar.Header>
                </View>
                {this.state.userProfile ?
                    <ScrollView style={[Styles.flex1]}>

                        <Card style={[{
                            padding: 7,
                            borderRadius: 0, marginBottom: 10
                        }]}>
                            {
                                this.state.userProfile.attrs
                                    ?
                                    <Card.Title
                                        theme={theme}
                                        style={[Styles.marH10]}
                                        title={_.startCase(_.toLower(this.state.userProfile.attrs.fullName))}
                                        titleStyle={[Styles.ffMbold, Styles.f16]}
                                        subtitleStyle={[Styles.ffMregular, {color: '#1b1b1b'}]}
                                        subtitle={Services.getUserRoles(this.state.userProfile.userRole)}
                                        left={() => Services.getUserProfilePic(this.state.userProfile.attrs.profilePicUrl)}
                                    />
                                    :
                                    <Card.Title
                                        theme={theme}
                                        style={[Styles.marH10]}
                                        title={'--'}
                                        titleStyle={[Styles.ffMbold, Styles.f16]}
                                        subtitleStyle={[Styles.ffMregular, {color: '#1b1b1b'}]}
                                        subtitle={'--'}
                                        left={() => Services.getUserProfilePic('')}
                                    />
                            }

                        </Card>
                        <View style={[Styles.marH25]}>
                            <View>
                                <CheckBox
                                    containerStyle={{
                                        backgroundColor: "#fff",
                                        borderWidth: 0,
                                    }}
                                    title='Is Adhoc Payment Voucher'
                                    checkedColor='#36A84C'
                                    size={25}
                                    checked={this.state.adhocVoucher}
                                    onPress={() => this.setState({adhocVoucher: !this.state.adhocVoucher}, function () {
                                    })}
                                />
                            </View>
                            {this.state.userProfile.attrs ?
                                <View style={[Styles.mBtm10]}>
                                    <Text style={[Styles.ffMregular, Styles.pBtm5]}>Mobile Number</Text>
                                    <Text
                                        style={[styles.field, Styles.ffMregular]}>{this.state.userProfile.attrs.mobileNumber}</Text>
                                </View> : null
                            }
                            {this.state.userProfile.panCardNumber ?
                                <View style={[Styles.mBtm10]}>
                                    <Text style={[Styles.ffMregular, Styles.pBtm5]}>PAN Card Number</Text>
                                    <Text
                                        style={[styles.field, Styles.ffMregular, {textTransform: 'uppercase'}]}>{this.state.userProfile.panCardNumber.replace(/^.{6}/g, 'XXXXXX')}</Text>
                                </View> : null
                            }
                            <View style={[Styles.mBtm10]}>
                                <Text style={[Styles.ffMregular, Styles.pBtm5]}>Select Date <Text>*</Text></Text>
                                <Text
                                    style={[styles.field, Styles.ffMregular]}>{new Date().toLocaleDateString()}</Text>
                            </View>
                            <View style={[Styles.mBtm10]}>
                                <Text style={[Styles.ffMregular, Styles.pBtm5]}>Site Name</Text>
                                <TouchableOpacity
                                    style={{borderWidth: 1, borderRadius: 5, marginBottom: 10}}
                                    onPress={() => this.setState({siteModal: true})}>
                                    <View pointerEvents='none'>
                                        <TextInput label='Select site*'
                                                   style={[Styles.ffMregular, {padding: 10, color: "#000"}]}
                                                   editable={false}
                                                   theme={theme}
                                                   onFocus={() => {
                                                       Keyboard.dismiss()
                                                   }}
                                                   mode='outlined'
                                                   placeholderTextColor='#000'
                                                   value={this.state.selectedSite}
                                        />
                                    </View>
                                    <MaterialIcons name='expand-more' color='#9e9e9e' size={30}
                                                   style={{position: 'absolute', right: 15, top: 10}}/>
                                </TouchableOpacity>
                            </View>
                            <View>
                                <Text style={[Styles.ffMregular, Styles.pBtm5]}>Voucher Type <Text>*</Text></Text>
                                <TouchableOpacity onPress={() => this.setState({voucherTypeModal: true})}
                                                  style={{borderWidth: 1, borderRadius: 5, marginBottom: 10}}>
                                    <View pointerEvents='none'>
                                        <TextInput label='Select Voucher Type*'
                                                   style={[Styles.ffMregular, {padding: 10, color: "#000"}]}
                                                   editable={false}
                                                   theme={theme}
                                                   onFocus={() => {
                                                       Keyboard.dismiss()
                                                   }}
                                                   mode='outlined'
                                                   placeholderTextColor='#000'
                                                   value={this.state.voucherName}
                                        />
                                    </View>
                                    <MaterialIcons name='expand-more' color='#9e9e9e' size={30}
                                                   style={{position: 'absolute', right: 15, top: 10}}/>
                                </TouchableOpacity>
                                <View>
                                    {this.state.adhocVoucher ?
                                        <View>
                                            <Text style={[Styles.ffMregular, Styles.pBtm5]}>Voucher Status*</Text>
                                            <RadioButton.Group
                                                onValueChange={placement => this.setState({placement})}
                                                value={this.state.placement}
                                            >
                                                <View style={[Styles.row]}>
                                                    <View style={[Styles.row, Styles.aslCenter]}>
                                                        <RadioButton value="Replacement"/>
                                                        <Text
                                                            style={[Styles.ffMregular, Styles.padH5, Styles.aslCenter]}>Replacement</Text>
                                                    </View>
                                                    <View style={[Styles.row, Styles.aslCenter]}>
                                                        <RadioButton value="Additional"/>
                                                        <Text
                                                            style={[Styles.ffMregular, Styles.padH5, Styles.aslCenter]}>Additional</Text>
                                                    </View>
                                                </View>
                                            </RadioButton.Group>

                                            <Text style={[Styles.ffMregular, Styles.pBtm5]}>Select
                                                Vehicle<Text>*</Text></Text>
                                            {this.state.vehicleList ?
                                                <TouchableOpacity
                                                    onPress={() => this.setState({vehicleModal: true})}
                                                    style={{
                                                        borderWidth: 1,
                                                        borderRadius: 5,
                                                        marginBottom: 10
                                                    }}>
                                                    <View pointerEvents='none'>
                                                        <TextInput label='Select Vehicle*'
                                                                   style={[Styles.ffMregular, {
                                                                       padding: 10,
                                                                       color: "#000"
                                                                   }]}
                                                                   editable={false}
                                                                   theme={theme}
                                                                   onFocus={() => {
                                                                       Keyboard.dismiss()
                                                                   }}
                                                                   mode='outlined'
                                                                   placeholderTextColor='#000'
                                                                   value={this.state.selectedVehicle}
                                                        />
                                                    </View>
                                                    <MaterialIcons name='expand-more' color='#9e9e9e' size={30}
                                                                   style={{
                                                                       position: 'absolute',
                                                                       right: 15,
                                                                       top: 10
                                                                   }}/>
                                                </TouchableOpacity> : null}
                                        </View> : null
                                    }
                                </View>
                                <View style={[Styles.mBtm10]}>
                                    <Text style={[Styles.ffMregular, Styles.pBtm5]}>Enter
                                        Amount <Text>*</Text></Text>
                                    <TextInput
                                        style={[styles.field, Styles.ffMregular]}
                                        maxLength={4}
                                        value={this.state.voucherAmount}
                                        keyboardType='numeric'
                                        onChangeText={(data) => {
                                            if (data > 2500) {
                                                Utils.dialogBox('Please enter amount lessthan 2500', '')
                                            } else {
                                                this.setState({voucherAmount: data})
                                            }
                                        }}/>
                                </View>
                                <View style={[Styles.mBtm10]}>
                                    <Text style={[Styles.ffMregular, Styles.pBtm5]}>Enter
                                        Comment <Text>*</Text></Text>
                                    <TextInput
                                        style={[styles.field, Styles.ffMregular]}
                                        value={this.state.voucherComment}
                                        onChangeText={(data) => this.setState({voucherComment: data})}/>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => this.state.adhocVoucher ? this.validateAdhocVoucher() : this.validateVoucher()}
                                style={[Styles.mTop20, Styles.mBtm20, {backgroundColor: this.state.showSignup === false ? '#cccccc' : '#C91A1F'}, Styles.bcRed, Styles.br5,]}>
                                <Text
                                    style={[Styles.f18, Styles.ffMbold, Styles.cWhite, Styles.padH10, Styles.padV10, Styles.aslCenter]}>
                                    {this.state.adhocVoucher ? 'CREATE ADHOC VOUCHER' : 'CREATE VOUCHER'}</Text>
                            </TouchableOpacity>

                            {/* Voucher Types Modal*/}
                            <Modal transparent={true} visible={this.state.voucherTypeModal}
                                   onRequestClose={() => {
                                       this.setState({voucherTypeModal: false})
                                   }}>
                                <View style={[Styles.modalfrontPosition]}>
                                    <View
                                        style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                            width: Dimensions.get('window').width - 80,
                                        }]]}>
                                        <View
                                            style={[Styles.bgWhite, {height: Dimensions.get('window').height / 2,}]}>
                                            <View style={Styles.alignCenter}>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select
                                                    Voucher Type</Text>
                                            </View>
                                            <ScrollView persistentScrollbar={true}>
                                                <List.Section>
                                                    {
                                                        this.state.voucherTypeList.map(voucherType => {
                                                            return (
                                                                <List.Item
                                                                    onPress={() => this.setState({
                                                                        voucherTypeModal: false,
                                                                        voucherName: voucherType.name,
                                                                        voucherType: voucherType.name,
                                                                    })}
                                                                    style={{marign: 0, padding: 0,}}
                                                                    theme={theme}
                                                                    key={voucherType.Value}
                                                                    title={voucherType.name}
                                                                    titleStyle={[Styles.ffMregular, Styles.colorBlue, Styles.f16, Styles.aslCenter, Styles.bw1, Styles.br100,
                                                                        {
                                                                            width: 210,
                                                                            textAlign: 'center',
                                                                            paddingHorizontal: 5,
                                                                            paddingVertical: 10,
                                                                            backgroundColor: this.state.voucherType === voucherType.name ? '#C91A1F' : '#fff',
                                                                            color: this.state.voucherType === voucherType.name ? '#fff' : '#233167',
                                                                            borderWidth: this.state.voucherType === voucherType.name ? 0 : 1,
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
                                        this.setState({voucherTypeModal: false})
                                    }} style={{marginTop: 20}}>
                                        {LoadSVG.cancelIcon}
                                    </TouchableOpacity>
                                </View>
                            </Modal>

                            {/*Site Modal*/}
                            <Modal transparent={true} visible={this.state.siteModal}
                                   onRequestClose={() => {
                                       this.setState({siteModal: false})
                                   }}>
                                <View style={[Styles.modalfrontPosition]}>
                                    <View
                                        style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                            width: Dimensions.get('window').width - 80,
                                        }]]}>
                                        <View
                                            style={[Styles.bgWhite, {height: Dimensions.get('window').height / 2,}]}>
                                            <View style={Styles.alignCenter}>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select
                                                    Site</Text>
                                            </View>
                                            <ScrollView persistentScrollbar={true}>
                                                <List.Section>
                                                    {
                                                        this.state.sitesList.map(site => {
                                                            return (
                                                                <List.Item
                                                                    onPress={() => this.setState({
                                                                        siteModal: false,
                                                                        selectedSite: site.name,
                                                                        selectedSiteId: site.siteId
                                                                    })}
                                                                    style={{marign: 0, padding: 0,}}
                                                                    theme={theme}
                                                                    key={site.siteId}
                                                                    title={site.name}
                                                                    titleStyle={[Styles.ffMregular, Styles.colorBlue, Styles.f16, Styles.aslCenter, Styles.bw1, Styles.br100,
                                                                        {
                                                                            width: 210,
                                                                            textAlign: 'center',
                                                                            paddingHorizontal: 5,
                                                                            paddingVertical: 10,
                                                                            backgroundColor: this.state.selectedSite === site.name ? '#C91A1F' : '#fff',
                                                                            color: this.state.selectedSite === site.name ? '#fff' : '#233167',
                                                                            borderWidth: this.state.selectedSite === site.siteId ? 0 : 1,
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
                                        this.setState({siteModal: false})
                                    }} style={{marginTop: 20}}>
                                        {LoadSVG.cancelIcon}
                                    </TouchableOpacity>
                                </View>
                            </Modal>

                            {/* Vehicle Modal*/}
                            <Modal transparent={true} visible={this.state.vehicleModal}
                                   onRequestClose={() => {
                                       this.setState({vehicleModal: false})
                                   }}>
                                <View style={[Styles.modalfrontPosition]}>
                                    <View
                                        style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                            width: Dimensions.get('window').width - 80,
                                        }]]}>
                                        <View
                                            style={[Styles.bgWhite, {height: Dimensions.get('window').height / 2,}]}>
                                            <View style={Styles.alignCenter}>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select
                                                    Vehicle</Text>
                                            </View>
                                            <ScrollView persistentScrollbar={true}>
                                                {this.state.vehicleList.length > 0 ?
                                                    <List.Section>
                                                        {
                                                            this.state.vehicleList.map(vehicle => {
                                                                return (
                                                                    <List.Item
                                                                        onPress={() => this.setState({
                                                                            vehicleModal: false,
                                                                            userVehicleType: vehicle.vehicleType,
                                                                            selectedVehicle: vehicle.vehicleRegistrationNumber + ' (' + vehicle.vehicleType + ') '
                                                                        })}
                                                                        style={{marign: 0, padding: 0,}}
                                                                        theme={theme}
                                                                        key={vehicle.id}
                                                                        title={vehicle.vehicleRegistrationNumber + ' (' + vehicle.vehicleType + ') '}
                                                                        titleStyle={[Styles.ffMregular, Styles.colorBlue, Styles.f16, Styles.aslCenter, Styles.bw1, Styles.br100,
                                                                            {
                                                                                width: 210,
                                                                                textAlign: 'center',
                                                                                paddingHorizontal: 5,
                                                                                paddingVertical: 10,
                                                                                backgroundColor: this.state.userVehicleType === vehicle.vehicleType ? '#C91A1F' : '#fff',
                                                                                color: this.state.userVehicleType === vehicle.vehicleType ? '#fff' : '#233167',
                                                                                borderWidth: this.state.userVehicleType === vehicle.vehicleType ? 0 : 1,
                                                                            }]}
                                                                    />
                                                                );
                                                            })
                                                        }
                                                    </List.Section>
                                                    : <Text
                                                        style={[Styles.colorBlue, Styles.ffMregular, Styles.alignCenter, Styles.f18, Styles.mTop15]}>No
                                                        Vehicles assigned to you..!</Text>}
                                            </ScrollView>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => {
                                        this.setState({vehicleModal: false})
                                    }} style={{marginTop: 20}}>
                                        {LoadSVG.cancelIcon}
                                    </TouchableOpacity>
                                </View>
                            </Modal>
                            {/* OTP verification Modal*/}
                            <Modal transparent={true} visible={this.state.voucherVerifyOPTModal}>
                                <View style={[Styles.modalfrontPosition]}>
                                        <View
                                            style={[Styles.bw1, Styles.bgWhite,Styles.p15,  {width: Dimensions.get('window').width - 50}]}>
                                            <ScrollView style={[{height:Dimensions.get('window').height/ 2.7}]}>
                                                <View style={[ Styles.mTop40, Styles.p10]}>
                                                <Text style={[Styles.ffMregular, Styles.pBtm5]}>Voucher
                                                    OTP <Text>*</Text></Text>
                                                <TextInput
                                                    style={[Styles.ffMregular, styles.field]}
                                                    value={this.state.voucherCode}
                                                    onChangeText={(voucherCode) => this.setState({voucherCode: voucherCode})}/>
                                                <TouchableOpacity
                                                    onPress={() => this.validateVoucherOtp()}
                                                    style={[Styles.mTop20, Styles.mBtm20, {backgroundColor: this.state.showSignup === false ? '#cccccc' : '#C91A1F'}, Styles.bcRed, Styles.br5,]}>
                                                    <Text
                                                        style={[Styles.f18, Styles.ffMbold, Styles.cWhite, Styles.padH10, Styles.padV10, Styles.aslCenter]}>Verify
                                                        OTP</Text>
                                                </TouchableOpacity>
                                                </View>
                                            </ScrollView>
                                        </View>
                                </View>
                            </Modal>
                        </View>
                    </ScrollView> : null
                }
            </View>
        )
    }
}

const
    styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: "#fff"
        },
        field: {
            padding: 10,
            borderWidth: 1,
            borderRadius: 5,
        }
    });
