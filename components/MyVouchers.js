import React, {Component} from "react";
import {View, Text, ScrollView, TouchableOpacity, Modal, Dimensions, StyleSheet, TextInput} from "react-native";
import {Appbar, DefaultTheme, Title, Card} from "react-native-paper";
import {CSpinner, CText, LoadImages, LoadSVG, Styles} from "./common";
import OfflineNotice from "./common/OfflineNotice";
import Config from "./common/Config";
import Services from "./common/Services";
import Utils from "./common/Utils";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import {CheckBox} from "react-native-elements";

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

export class MyVouchers extends Component {
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
        this.state = {voucherDetailsModal: false, tabOne: true, tabTwo: false, editable: false};
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            self.getMyVouchers();
        });
    }

    errorHandling(error) {
        const self = this;
        console.log("error", error, error.response);
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
                Utils.dialogBox("Error loading My Referrals, Please contact Administrator ", '');
            }
        } else {
            self.setState({spinnerBool: false});
            Utils.dialogBox(error.message, '');
        }
    }

    getMyVouchers() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_MY_VOUCHERS;
        const body = {'deleted': false};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    console.log("All Vouchers", response);
                    self.setState({spinnerBool: false, allVouchers: response.data.content})
                }
            }, function (error) {
                self.errorHandling(error);
            })
        })
    };

    getCreatedByMeVouchers() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_CREATEDBYME_VOUCHERS;
        const body = {'deleted': false};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    console.log("GET_CREATEDBYME_VOUCHERS", response);
                    self.setState({spinnerBool: false, allVouchers: response.data.content})
                }
            }, function (error) {
                self.errorHandling(error);
            })
        })
    }

    updateVoucher() {

    }

    // getVoucherDetails(voucherId) {
    //     console.log('voucherid', voucherId)
    //     const self = this;
    //     const apiUrl = Config.routes.BASE_URL + Config.routes.GET_VOUCHERS_DETAILS + voucherId;
    //     const body = {};
    //     this.setState({spinnerBool: true}, () => {
    //         Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
    //             if (response.status === 200) {
    //                 console.log("Voucher Deatials", response);
    //                 self.setState({spinnerBool: false, voucherData: response.data})
    //             }
    //         }, function (error) {
    //             self.errorHandling(error);
    //         })
    //     })
    // }

    render() {
        return (
            <View style={[Styles.containerStyle]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <View style={[Styles.appbarBorder]}>
                    <Appbar.Header theme={theme} style={[Styles.bgWhite,]}>
                        <Appbar.Action icon="chevron-left" size={30} onPress={() => {
                            this.props.navigation.goBack()
                        }}/>
                        <Appbar.Content title="My Vouchers"/>
                    </Appbar.Header>
                </View>
                <View style={[Styles.flex1]}>
                    <View style={[Styles.row, Styles.bgWhite, Styles.mBtm5]}>
                        <TouchableOpacity style={[Styles.aslCenter, {
                            width: '50%', borderBottomWidth: this.state.tabOne === true ? 1 : null,
                            borderBottomColor: this.state.tabOne === true ? '#000' : null,
                        }]}
                                          onPress={() => this.setState({tabTwo: false, tabOne: true}, function () {
                                              this.getMyVouchers()
                                          })}><Text
                            style={[Styles.p10, Styles.ffMregular, Styles.f16, Styles.aslCenter]}>My
                            Vouchers</Text></TouchableOpacity>
                        <TouchableOpacity style={[Styles.aslCenter, {
                            width: '50%', borderBottomWidth: this.state.tabTwo === true ? 1 : null,
                            borderBottomColor: this.state.tabTwo === true ? '#000' : null
                        }]}
                                          onPress={() => this.setState({tabTwo: true, tabOne: false}, function () {
                                              this.getCreatedByMeVouchers()
                                          })}>
                            <Text style={[Styles.p10, Styles.ffMregular, Styles.f16, Styles.aslCenter]}>Created by
                                Me</Text></TouchableOpacity>
                    </View>
                    <ScrollView>
                        {
                            this.state.allVouchers ?
                                this.state.allVouchers.length > 0 ?
                                    this.state.allVouchers.map(voucher => (
                                        <View style={[Styles.padV15, Styles.padH20, Styles.row, Styles.jSpaceBet, {
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#dcdcdc'
                                        }]} key={voucher.id}>
                                            <View>
                                                <Text
                                                    style={[Styles.f30, Styles.ffMregular, Styles.colorBlue]}>&#8377;{' '}{voucher.voucherAmount}</Text>
                                                <Text
                                                    style={[Styles.f14, Styles.ffMregular, Styles.alignCenter, Styles.colorBlue]}>{new Date(voucher.voucherDate).toLocaleDateString()}</Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => this.setState({
                                                    voucherDetailsModal: true,
                                                    selectedVoucher: voucher,
                                                    voucherComment: voucher.comments,
                                                    voucherAmount: JSON.stringify(voucher.voucherAmount)
                                                })}
                                                style={[Styles.aslCenter, Styles.bgDWhite, Styles.p10, Styles.br10, Styles.padH20]}>
                                                <Text
                                                    style={[Styles.f16, Styles.ffMregular, Styles.colorBlue]}>{Services.returnVoucherStatus(voucher.status)}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )) :
                                    <Text
                                        style={[Styles.ffMbold, Styles.aslCenter, Styles.padV30, Styles.f18, Styles.colorBlue]}>No
                                        Vouchers added to you.</Text> : null
                        }
                    </ScrollView>
                </View>

                {/*Modal to show Voucher Details */}
                <Modal
                    transparent={true}
                    visible={this.state.voucherDetailsModal}
                    onRequestClose={() => {
                        this.setState({voucherDetailsModal: false, editable: false})
                    }}>
                    <View style={[Styles.bottomModalBg]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({voucherDetailsModal: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br30, Styles.mBtm20, {
                                width: Dimensions.get('window').width - 60,
                                height: Dimensions.get('window').height / 1.2
                            }]}>
                            {this.state.selectedVoucher ?
                                <ScrollView style={{padding: 8}}>
                                    <View style={[Styles.p5, Styles.pBtm10, Styles.row, Styles.jSpaceBet]}>
                                        <Text
                                            style={[Styles.cBlk, Styles.f18, Styles.ffMbold, Styles.colorBlue, Styles.aslCenter]}>Voucher
                                            Details</Text>
                                        {/*{this.state.selectedVoucher.status === 'APPROVAL_PENDING' ? !this.state.editable ?*/}
                                        {/*    <FontAwesome name="edit" size={24} color="black"*/}
                                        {/*                 onPress={() => this.setState({editable: true})}/> :*/}
                                        {/*    <FontAwesome name="close" size={24} color="black"*/}
                                        {/*                 onPress={() => this.setState({editable: false})}/> : null*/}
                                        {/*}*/}
                                    </View>
                                    {this.state.selectedVoucher.adhocVoucher ?
                                        <View style={[Styles.mTop10]}>
                                            <CheckBox
                                                containerStyle={{
                                                    backgroundColor: "#fff",
                                                    borderWidth: 0,
                                                }}
                                                title='Is Adhoc Payment Voucher'
                                                checkedColor='#36A84C'
                                                size={25}
                                                checked={this.state.selectedVoucher.adhocVoucher}
                                                onPress={() => this.setState({adhocVoucher: !this.state.adhocVoucher}, function () {
                                                })}
                                            />
                                        </View>
                                        : null}
                                    <View style={[Styles.mTop10]}>
                                        <Text style={[Styles.ffMregular, Styles.f16, Styles.colorBlue]}>Generated
                                            by</Text>
                                        <Text
                                            style={[styles.cardDesign, Styles.ffMbold, Styles.colorBlue]}>{this.state.selectedVoucher.attrs.createdBy || 'NA'}</Text>
                                    </View>
                                    <View style={[Styles.mTop10]}>
                                        <Text style={[Styles.ffMregular, Styles.f16, Styles.colorBlue]}>Generated
                                            to</Text>
                                        <Text
                                            style={[styles.cardDesign, Styles.ffMbold, Styles.colorBlue]}>{this.state.selectedVoucher.attrs.userName || 'NA'}</Text>
                                    </View>
                                    <View style={[Styles.mTop10]}>
                                        <Text style={[Styles.ffMregular, Styles.f16, Styles.colorBlue]}>Current
                                            Status</Text>
                                        <Text
                                            style={[styles.cardDesign, Styles.ffMbold, Styles.colorBlue]}>{Services.returnVoucherStatus(this.state.selectedVoucher.status)}</Text>
                                    </View>
                                    <View style={[Styles.mTop10]}>
                                        <Text style={[Styles.ffMregular, Styles.f16, Styles.colorBlue]}>Site Name</Text>
                                        <Text
                                            style={[styles.cardDesign, Styles.ffMbold, Styles.colorBlue]}>{this.state.selectedVoucher.attrs.siteName || 'NA'}</Text>
                                    </View>
                                    {this.state.selectedVoucher.adhocVoucher ?
                                        <View>
                                            <View style={[Styles.marV10]}>
                                                <Text
                                                    style={[Styles.ffMregular, Styles.f16, Styles.colorBlue]}>Voucher
                                                    Status</Text>
                                                <Text
                                                    style={[styles.cardDesign, Styles.ffMbold, Styles.colorBlue]}>{this.state.selectedVoucher.placement || 'NA'}</Text>
                                            </View>
                                            <View>
                                                <Text
                                                    style={[Styles.ffMregular, Styles.f16, Styles.colorBlue]}>Vehicle
                                                    Type</Text>
                                                <Text
                                                    style={[styles.cardDesign, Styles.ffMbold, Styles.colorBlue]}>{this.state.selectedVoucher.userVehicleType || 'NA'}</Text>
                                            </View>
                                        </View> : null}
                                    {!this.state.editable ?
                                        <View>
                                            <View style={[Styles.marV10]}>
                                                <Text
                                                    style={[Styles.ffMregular, Styles.f16, Styles.colorBlue]}>Amount</Text>
                                                <Text
                                                    style={[styles.cardDesign, Styles.ffMbold, Styles.colorBlue]}>{this.state.selectedVoucher.voucherAmount || 'NA'}</Text>
                                            </View>
                                            <View>
                                                <Text
                                                    style={[Styles.ffMregular, Styles.f16, Styles.colorBlue]}>Comment</Text>
                                                <Text
                                                    style={[styles.cardDesign, Styles.ffMbold, Styles.colorBlue]}>{this.state.selectedVoucher.comments || 'NA'}</Text>
                                            </View>
                                        </View>
                                        :
                                        <View>
                                            <View style={[Styles.mTop10]}>
                                                <Text
                                                    style={[Styles.ffMregular, Styles.f16, Styles.colorBlue]}>Amount</Text>
                                                <TextInput
                                                    style={[styles.cardDesign, Styles.ffMregular]}
                                                    value={this.state.voucherAmount}
                                                    onChangeText={(data) => this.setState({voucherAmount: data})}/>
                                            </View>
                                            <View style={[Styles.marV10]}>
                                                <Text
                                                    style={[Styles.ffMregular, Styles.f16, Styles.colorBlue]}>Comment</Text>
                                                <TextInput
                                                    style={[styles.cardDesign, Styles.ffMregular]}
                                                    value={this.state.voucherComment}
                                                    onChangeText={(data) => this.setState({voucherComment: data})}/>
                                            </View>
                                        </View>
                                    }

                                </ScrollView>
                                : null
                            }
                            {this.state.editable ?
                                <TouchableOpacity style={[Styles.marV30]} onPress={() => {
                                    this.updateVoucher()
                                }}>
                                    <View
                                        style={[Styles.mTop20, Styles.mBtm20, {backgroundColor: '#C91A1F'}]}>
                                        <Text
                                            style={[Styles.f18, Styles.ffMbold, Styles.cWhite, Styles.padH10, Styles.padV10, Styles.aslCenter]}>Update
                                            Voucher</Text>
                                    </View>
                                </TouchableOpacity> :
                                <TouchableOpacity style={[Styles.marV30]} onPress={() => {
                                    this.setState({voucherDetailsModal: false, editable: false})
                                }}>
                                    <View
                                        style={[Styles.p15, Styles.br5, Styles.marH30, {backgroundColor: '#f5f5f5'}]}>
                                        <Text
                                            style={[Styles.ffMregular, Styles.f16, Styles.colorBlue, {textAlign: 'center'}]}>tap
                                            to
                                            dismiss</Text>
                                    </View>
                                </TouchableOpacity>
                            }
                        </View>

                    </View>

                </Modal>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    cardDesign: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        fontSize: 18,
        marginTop: 3
    }
})
