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
    FlatList, Alert
} from "react-native";
import {Column as Col, Row} from "react-native-flexbox-grid";
import {Appbar, Avatar, Card, Surface, IconButton, DefaultTheme, Title} from "react-native-paper";
import {Styles, CText, CSpinner} from "./common";
import _ from "lodash";
import OfflineNotice from './common/OfflineNotice';
import Services from "./common/Services";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";


const width = Dimensions.get("window").width;
const height = Dimensions.get("window").height;

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};
export default class Summary extends Component {

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
            BackHandler.addEventListener('hardwareBackPress', this.onBack)
        );
        this.state = {
            AttendenceResponse: '', spinnerBool: false, SupervisorDetails: '', PreSummaryModal: false,
            subPackagesModal: false
        };
    }

    componentDidMount() {
        this.willBlur = this.props.navigation.addListener('willBlur', payload =>
            BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        );
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            let shiftResponse = self.props.navigation.state.params.AttendenceResponse
            self.setState({
                AttendenceResponse:shiftResponse,
                UserFlow: self.props.navigation.state.params.UserFlow,
                SupervisorDetails: self.props.navigation.state.params.SupervisorDetails
            }, () => {
                {
                    (shiftResponse.userRole === 1 || shiftResponse.userRole === 10) && ( shiftResponse.status === 'SHIFT_ENDED' || shiftResponse.status === "SHIFT_ENDED_BY_SUPERVISOR" && shiftResponse.deliveredPackagesInfo)
                        ? this.getAllTypesOfPackages()
                        : null
                }
                // console.log('====summary response===', shiftResponse, '==USERFLOW===', this.state.UserFlow, '===SupervisorDetails===', self.state.SupervisorDetails);
                Services.checkMockLocationPermission((response) => {
                    if (response){
                        this.props.navigation.navigate('Login')
                    }
                })
            })
        });
    }

    onBack = () => {
        if (this.state.UserFlow === "SITE_ADMIN") {
            return this.props.navigation.navigate('TeamListingScreen');
        } else {
            if (this.state.AttendenceResponse.status === 'SHIFT_IN_PROGRESS') {
                return this.props.navigation.navigate('EndShiftScreen', {
                    CurrentShiftId: this.state.AttendenceResponse.id,
                    currentUserId: this.state.AttendenceResponse.userId,
                    UserFlow: (this.state.UserFlow === 'NORMAL_ADHOC_FLOW' || this.state.UserFlow === 'ADMIN_ADHOC_FLOW') ? this.state.UserFlow: 'NORMAL'
                })
            } else {
                if (this.state.UserFlow === 'ADMIN_ADHOC_FLOW'){
                    return this.props.navigation.navigate('TeamListingScreen');
                }else if (this.state.UserFlow === 'NORMAL_ADHOC_FLOW'){
                    return this.props.navigation.navigate('CreateNonRegisteredAdhocShift');
                }else {
                    return this.props.navigation.navigate('HomeScreen');
                }
            }
        }
    };

    componentWillUnmount() {
        this.didFocus.remove();
        this.willBlur.remove();
        BackHandler.removeEventListener('hardwareBackPress', this.onBack);
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    ShiftDuration(item) {
        var timeStart = new Date(item.reportingTime ? item.reportingTime : item.actualStartTime ).getTime();
        var timeEnd = new Date(item.actualEndTime).getTime();
        var hourDiff = timeEnd - timeStart; //in ms
        var secDiff = hourDiff / 1000; //in s
        var minDiff = hourDiff / 60 / 1000; //in minutes
        var hDiff = hourDiff / 3600 / 1000; //in hours
        var humanReadable = {};
        humanReadable.hours = Math.floor(hDiff);
        humanReadable.minutes = Math.floor(minDiff - 60 * humanReadable.hours);
        // console.log(humanReadable); //{hours: 0, minutes: 30}
        return (
            <CText cStyle={[Styles.f20, Styles.padV3, Styles.aslStart,Styles.ffLRegular]}>
                Total Duration:<CText
                cStyle={[Styles.f20, Styles.cBlk, Styles.padV3, Styles.aslStart,Styles.ffLBold]}> {humanReadable.hours}h {humanReadable.minutes} min </CText></CText>
        )

    }

    hoursMinutesFormat(time) {
        return (
            <CText cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, {fontFamily: "Muli-Regular"}]}>
                {new Date(time).getHours() <= 9 ? "0" + new Date(time).getHours() : new Date(time).getHours()}:
                {new Date(time).getMinutes() <= 9 ? "0" + new Date(time).getMinutes() : new Date(time).getMinutes()}
            </CText>
        )
    }

    showOrHidePackages(data) {
        if (data === true) {
            this.setState({showPackages: true})
        } else {
            this.setState({showPackages: false})
        }
    }

    //Will form an array with pickup and delivery packages
    getAllTypesOfPackages = () => {
        const deliveryPackages = this.state.AttendenceResponse.deliveredPackagesInfo; //data from params
        const pickupPackages = this.state.AttendenceResponse.pickUpPackagesInfo; //data from API
        const EndShiftArray = [];
        for (var i = 0; i < pickupPackages.length; i++) {
            for (var j = 0; j < deliveryPackages.length; j++) {
                if (pickupPackages[i].type === deliveryPackages[j].type) {
                    let sample = {};
                    sample.type = pickupPackages[i].type;
                    sample.pickupCount = pickupPackages[i].count;
                    sample.deliveryCount = deliveryPackages[j].count;
                    sample.statuses = deliveryPackages[j].statuses
                    EndShiftArray.push(sample);
                }
            }
        }
        this.setState({packagesData: EndShiftArray}, () => {
        });
    };

    DriverCollected() {
        return (
            <Row size={12} style={styles.row}>
                <Col sm={6}>
                    <Surface style={[styles.surface, {width: 185, height: 100}]}>
                        <Image style={{width: 159, height: 54}} source={require("../assets/images/odo_small.png")}/>
                    </Surface>
                </Col>
                <Col sm={3}>
                    <Surface style={[styles.surface, {width: 90, height: 100}]}>
                        <Text style={{fontFamily: "Muli-Bold"}}>STARTING</Text>
                        {this.state.AttendenceResponse.status === 'ATTENDANCE_MARKED'
                            ? <CText
                                cStyle={{fontFamily: "Muli-Regular"}}>{this.state.AttendenceResponse.startOdometerReading}</CText>
                            : <CText
                                cStyle={{fontFamily: "Muli-Regular"}}>{this.state.AttendenceResponse.startOdometerReading}</CText>
                        }
                    </Surface>
                </Col>
                <Col sm={3}>
                    <Surface style={[styles.surface, {width: 90, height: 100}]}>
                        <Text style={{fontFamily: "Muli-Bold"}}>ENDING</Text>
                        {this.state.AttendenceResponse.status === 'SHIFT_ENDED' || this.state.AttendenceResponse.status === "SHIFT_ENDED_BY_SUPERVISOR"
                            ? <CText
                                cStyle={{fontFamily: "Muli-Regular"}}>{this.state.AttendenceResponse.endOdometerReading}</CText>
                            : <CText cStyle={{fontFamily: "Muli-Regular"}}>--</CText>
                        }
                    </Surface>
                </Col>
            </Row>
        )
    }

    AssociateCollected() {
        return (
            <TouchableOpacity onPress={() => {
                this.setState({PreSummaryModal: true})
            }}>
                < Row size={12} style={styles.row}>
                    <Col sm={6}>
                        <Surface style={[styles.surface, {width: 185, height: 100}]}>
                            <Image style={{width: 153, height: 54}}
                                   source={require("../assets/images/Group-1600.png")}/>
                        </Surface>
                    </Col>
                    <Col sm={6}>
                        <Surface
                            style={[styles.surface, {width: 190, height: 100}]}>
                            <Text style={{fontFamily: "Muli-Bold"}}>PACKAGES</Text>
                            {
                                this.state.AttendenceResponse.pickUpPackagesInfo === null
                                    ? null
                                    : this.state.AttendenceResponse.status === 'SHIFT_IN_PROGRESS'
                                    ? <Text
                                        style={{fontFamily: "Muli-Regular"}}>{this.state.AttendenceResponse.pickUpPackagesCount}</Text>
                                    :
                                    this.state.AttendenceResponse.status === 'SHIFT_ENDED' || this.state.AttendenceResponse.status === "SHIFT_ENDED_BY_SUPERVISOR"
                                        ?
                                        this.state.AttendenceResponse.deliveredPackagesInfo
                                            ? <Text
                                                // style={{fontFamily: "Muli-Regular"}}>{this.state.AttendenceResponse.deliveredPackagesCount}/{this.state.AttendenceResponse.pickUpPackagesCount}</Text>
                                                style={[Styles.ffMregular]}>{this.state.AttendenceResponse.deliveredPackagesCount}</Text>
                                            : null
                                        :
                                        null
                            }
                        </Surface>
                    </Col>
                </Row>
            </TouchableOpacity>
        )
    }

    CashCollected() {
        return (
            <Row size={12}
                 style={[{marginLeft: 10, marginTop: 2,}]}>
                <Col sm={6}>
                    <Surface style={[styles.surface, {width: 185, height: 100}]}>
                        <Image style={{width: 150, height: 54}}
                               source={require("../assets/images/cash_small.png")}/>
                    </Surface>
                </Col>
                <Col sm={6}>
                    <Surface style={[styles.surface, {width: 183, height: 100}]}>
                        <Text style={{fontFamily: "Muli-Bold"}}>CASH COLLECTED</Text>
                        {/* <Text>&#8377; 17296.00 </Text> */}
                        <Text
                            style={{fontFamily: "Muli-Regular"}}>&#8377; {this.state.AttendenceResponse.cashCollected}</Text>
                    </Surface>
                </Col>
            </Row>
        )
    }

    //SUPERVISOR-DETAILS IMAGE,DATA
    SuprevisorsList(item) {
        // console.log('SuprevisorsList', item)
        return (
            <Card style={[styles.shadow, Styles.mBtm10, Styles.padH5, Styles.marH10, Styles.marV5, {borderRadius: 0,}]}>
                <Card.Title theme={theme}
                            style={[Styles.bgWhite, {fontFamily: "Muli-Regular"}]}
                    // subtitle="Site Supervisor"
                            title={_.startCase(item.userName)}
                            left={() => Services.getUserProfilePic(item.profilePicUrl)}
                            right={() => <IconButton icon="phone" onPress={() => {
                                Linking.openURL(`tel:${item.phoneNumber}`)
                            }}/>
                            }
                />
            </Card>
        )
    }

    //Packages Pop-up from Flatlist
    PackagesList(item) {
        return (
            <Card theme={theme}
                  style={[Styles.marV5, Styles.marH10, {marginTop: 5}]}>
                <Card.Content style={[Styles.row, Styles.jSpaceBet]}>
                    <Title>{item.type}</Title>
                    <Title></Title>
                    <Title
                        style={{fontFamily: 'Muli-Bold'}}>{item.count}
                    </Title>
                </Card.Content>
            </Card>
        )
    }

    //Packages Pop-up from Flatlist
    PackagesDelivered(item) {
        // console.log('PackagesDelivered item',item)
        return (
            <ScrollView>
                <Card theme={theme} onPress={() => this.setState({subPackagesModal: true, subPackagesData: item})}
                      style={[Styles.marV5, Styles.marH10, {marginTop: 5}]}>
                    <Card.Content style={[Styles.row, Styles.jSpaceBet]}>
                        <Title>{item.type}</Title>
                        <Title></Title>
                        <Title
                            style={[Styles.ffMbold]}>{item.deliveryCount}/{item.pickupCount}
                            {/*style={[Styles.ffMbold]}>{item.deliveryCount}*/}
                        </Title>
                    </Card.Content>
                </Card>
                <Modal
                    transparent={true}
                    visible={this.state.subPackagesModal}
                    onRequestClose={() => {
                        this.setState({subPackagesModal: false})
                    }}>
                    <View style={[Styles.aitCenter, Styles.jCenter, {
                        backgroundColor: 'rgba(0, 0, 0 ,0.7)',
                        top: 0,
                        bottom: 0,
                        flex: 1
                    }]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({subPackagesModal: false})
                        }}
                                          style={[{
                                              flex: 1,
                                              position: 'absolute',
                                              top: 0,
                                              bottom: 0,
                                              left: 0,
                                              right: 0
                                          }]}>
                        </TouchableOpacity>
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, {width: Dimensions.get('window').width - 50}]}>
                            <Card theme={theme} onPress={() => this.setState({subPackagesModal: true})}
                                  style={[Styles.marV5, Styles.marH10, {marginTop: 5}]}>
                                {this.state.subPackagesData ?
                                    <Card.Content style={[Styles.row, Styles.jSpaceBet]}>
                                        <Title>{this.state.subPackagesData.type}</Title>
                                        <Title></Title>
                                        <Title
                                            style={[Styles.ffMbold]}>{this.state.subPackagesData.deliveryCount}/{this.state.subPackagesData.pickupCount}
                                            {/*style={[Styles.ffMbold]}>{this.state.subPackagesData.deliveryCount}*/}
                                        </Title>
                                    </Card.Content>
                                    : null}
                            </Card>
                            <ScrollView
                                persistentScrollbar={true}
                                style={{height: Dimensions.get('window').height / 3}}>
                                {this.state.subPackagesData ?
                                    <FlatList data={this.state.subPackagesData.statuses} renderItem={({item}) =>
                                        <View style={[Styles.row, Styles.jSpaceBet, Styles.marH20, Styles.p5]}>
                                            <Text
                                                style={[Styles.f16, Styles.ffMregular, Styles.txtAlignLt]}>{item.status}</Text>
                                            <Text
                                                style={[Styles.f16, Styles.ffMregular, Styles.txtAlignRt]}>{item.count}</Text>
                                        </View>
                                    }/>
                                    : null}
                            </ScrollView>
                        </View>
                    </View>

                </Modal>
            </ScrollView>
        )
    }


    Associate_AttResp_Pickup() {
        return (
            <View style={{padding: 10}}>
                <View style={[Styles.row, Styles.jSpaceBet, {paddingHorizontal: 15, paddingVertical: 10}]}>
                    <Text style={{fontSize: 24, fontFamily: 'Muli-Bold', color: '#000'}}>Total Packages</Text>
                    <Text style={{
                        fontSize: 24,
                        fontFamily: 'Muli-Bold',
                        color: '#000'
                    }}>{this.state.AttendenceResponse.pickUpPackagesCount}</Text>
                </View>
                <View>
                    <FlatList
                        style={[]}
                        data={this.state.AttendenceResponse.pickUpPackagesInfo}
                        renderItem={({item}) => this.PackagesList(item)}
                        extraData={this.state}
                        keyExtractor={(item, index) => index.toString()}/>
                </View>
            </View>
        )
    }


    Associate_AttResp_Delivered() {
        return (
            <View style={{padding: 10}}>
                <View style={[Styles.row, Styles.jSpaceBet, {paddingHorizontal: 15, paddingVertical: 10}]}>
                    <Text style={{fontSize: 24, fontFamily: 'Muli-Bold', color: '#000'}}>Total Packages</Text>
                    <Text style={{
                        fontSize: 24,
                        fontFamily: 'Muli-Bold',
                        color: '#000'
                    }}>{this.state.AttendenceResponse.deliveredPackagesCount}/{this.state.AttendenceResponse.pickUpPackagesCount}</Text>
                    {/*}}>{this.state.AttendenceResponse.deliveredPackagesCount}</Text>*/}
                </View>
                <View>
                    <FlatList
                        style={[]}
                        data={this.state.packagesData}
                        renderItem={({item}) => this.PackagesDelivered(item)}
                        extraData={this.state}
                        keyExtractor={(item, index) => index.toString()}/>
                </View>
            </View>
        )
    }

    render() {
        const {AttendenceResponse} = this.state;
        return (
            <View style={[{flex: 1, backgroundColor: "#f1f5f4"}]}>
                <OfflineNotice/>
                {
                    this.state.AttendenceResponse
                        ?
                        <View style={[{flex: 1, backgroundColor: "#f1f5f4"}]}>
                            <View style={[Styles.flex1]}>
                                {this.renderSpinner()}

                                {/* HEADER CHANGES FOR SHIFT STATUS*/}
                                <Appbar.Header theme={theme} style={[Styles.bgDarkRed]}>
                                    <Appbar.BackAction onPress={() => {
                                        this.onBack()
                                    }}/>
                                    <Appbar.Content title="Shift Summary" titleStyle={[Styles.ffLBold]}/>
                                    {/*<Appbar.Action icon="more-horiz" onPress={() => { }} />*/}
                                </Appbar.Header>

                                <Surface style={{
                                    width: Dimensions.get("window").width,
                                    paddingVertical: 20,
                                    paddingLeft: 20,
                                    alignSelf: 'flex-start'
                                }}>
                                    {
                                        AttendenceResponse.status === 'SHIFT_IN_PROGRESS'
                                            ?
                                            <View>
                                                <CText
                                                    cStyle={[Styles.f20, Styles.aslStart,Styles.ffLRegular]}>Shift
                                                    Status: <CText
                                                        cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart,Styles.ffLBold]}> SHIFT
                                                        STARTED</CText></CText>
                                                <CText
                                                    cStyle={[Styles.f20, Styles.padV3, Styles.aslStart,Styles.ffLRegular]}>Shift
                                                    Started at <CText
                                                        cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart,Styles.ffLBold]}>{this.hoursMinutesFormat(AttendenceResponse.actualStartTime)}</CText></CText>
                                                <CText
                                                    cStyle={[Styles.f20, Styles.padV3, Styles.aslStart,Styles.ffLRegular]}>
                                                    Marked At Site: <CText
                                                    cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart,Styles.ffLBold]}>
                                                    {AttendenceResponse.markedAtSite === false ? 'No' : 'Yes'}
                                                </CText>
                                                </CText>
                                                {
                                                    AttendenceResponse.vehicleType
                                                        ?
                                                        <CText
                                                            cStyle={[Styles.f20, Styles.padV3, Styles.aslStart, Styles.ffLRegular]}>
                                                            Vehicle Type: <CText
                                                            cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, Styles.ffLBold]}>
                                                            {AttendenceResponse.vehicleType} Wheeler
                                                        </CText>
                                                        </CText>
                                                        :
                                                        null
                                                }
                                                {
                                                    AttendenceResponse.adhocPaymentMode
                                                        ?
                                                        <CText
                                                            cStyle={[Styles.f20, Styles.aslStart, Styles.ffLRegular]}>
                                                            Payment Type:
                                                            <CText  cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, Styles.ffLBold]}> {AttendenceResponse.adhocPaymentMode}</CText>
                                                            {
                                                                AttendenceResponse.adhocShiftAmountPaid
                                                                    ?
                                                                    <CText
                                                                        cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, Styles.ffLBold]}> ( &#x20B9; {AttendenceResponse.adhocShiftAmountPaid} )</CText>
                                                                    : null
                                                            }
                                                        </CText>
                                                        :
                                                        null
                                                }
                                            </View>
                                            :
                                            AttendenceResponse.status === 'SHIFT_ENDED' || AttendenceResponse.status === "SHIFT_ENDED_BY_SUPERVISOR"
                                                ?
                                                <View>
                                                    <CText
                                                        cStyle={[Styles.f20, Styles.aslStart,Styles.ffLRegular]}>Shift
                                                        Status: <CText
                                                            cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart,Styles.ffLBold]}>SHIFT
                                                            ENDED</CText></CText>
                                                    <CText
                                                        cStyle={[Styles.f20, Styles.padV3, Styles.aslStart,Styles.ffLRegular]}>
                                                        Shift Duration: <CText
                                                        cStyle={[Styles.f20, Styles.cBlk, Styles.padV3, Styles.aslStart,Styles.ffLBold]}>{AttendenceResponse.durationStr}</CText></CText>
                                                    <CText
                                                        cStyle={[Styles.f20, Styles.aslStart,Styles.ffLRegular]}>
                                                        Marked At Site: <CText
                                                        cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart,Styles.ffLBold]}>
                                                        {AttendenceResponse.markedAtSite === false ? 'No' : 'Yes'}
                                                    </CText>
                                                    </CText>
                                                    {
                                                        AttendenceResponse.vehicleType
                                                            ?
                                                            <CText
                                                                cStyle={[Styles.f20, Styles.padV3, Styles.aslStart, Styles.ffLRegular]}>
                                                                Vehicle Type: <CText
                                                                cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, Styles.ffLBold]}>
                                                                {AttendenceResponse.vehicleType} Wheeler
                                                            </CText>
                                                            </CText>
                                                            :
                                                            null
                                                    }
                                                    {
                                                        AttendenceResponse.cashOnDelivery ?
                                                            <CText
                                                                cStyle={[Styles.f20, Styles.padV3, Styles.aslStart,Styles.ffLRegular]}>
                                                                Cash on Delivery: <CText
                                                                cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart,Styles.ffLBold]}>
                                                                {AttendenceResponse.cashOnDelivery ? AttendenceResponse.cashOnDelivery.toFixed(1) : 'NA'}
                                                            </CText>
                                                            </CText>
                                                            : null
                                                    }
                                                    {/*{this.ShiftDuration(AttendenceResponse)}*/}

                                                    {
                                                        AttendenceResponse.adhocPaymentMode
                                                            ?
                                                            <CText
                                                                cStyle={[Styles.f20, Styles.aslStart, Styles.ffLRegular]}>
                                                                Payment Type:
                                                                <CText  cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, Styles.ffLBold]}> {AttendenceResponse.adhocPaymentMode}</CText>
                                                                {
                                                                    AttendenceResponse.adhocShiftAmountPaid
                                                                        ?
                                                                        <CText
                                                                            cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, Styles.ffLBold]}> ( &#x20B9; {AttendenceResponse.adhocShiftAmountPaid} )</CText>
                                                                        : null
                                                                }
                                                            </CText>
                                                            :
                                                            null
                                                    }
                                                </View>
                                                :
                                                null
                                    }
                                </Surface>


                                {/* MODAL FOR PRE-SUMMARY SHIFT END */}
                                <Modal
                                    transparent={true}
                                    visible={this.state.PreSummaryModal}
                                    onRequestClose={() => {
                                        this.setState({PreSummaryModal: false})
                                    }}>
                                    <View style={[Styles.aitCenter, Styles.jCenter, {
                                        backgroundColor: 'rgba(0, 0, 0 ,0.7)',
                                        top: 0,
                                        bottom: 0,
                                        flex: 1
                                    }]}>
                                        <TouchableOpacity onPress={() => {
                                            this.setState({PreSummaryModal: false})
                                        }}
                                                          style={[{
                                                              flex: 1,
                                                              position: 'absolute',
                                                              top: 0,
                                                              bottom: 0,
                                                              left: 0,
                                                              right: 0
                                                          }]}>
                                        </TouchableOpacity>
                                        <View
                                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 50}]}>
                                            <Card.Title theme={theme}
                                                        style={[Styles.pTop5, Styles.bgWhite,Styles.ffMregular]}
                                                        subtitleStyle={[Styles.ffMregular]}
                                                        subtitle=""
                                                        title="Packages Summary"
                                            />
                                            <ScrollView
                                                persistentScrollbar={true}
                                                style={{height: Dimensions.get('window').height / 1.5}}>
                                                {
                                                    this.state.AttendenceResponse.userRole === 1 || this.state.AttendenceResponse.userRole === 10
                                                        ?
                                                        this.state.AttendenceResponse.status === 'SHIFT_IN_PROGRESS'
                                                            ?
                                                            this.Associate_AttResp_Pickup()
                                                            :
                                                            this.state.AttendenceResponse.deliveredPackagesInfo
                                                                ?
                                                                this.Associate_AttResp_Delivered()
                                                                :
                                                                null
                                                        :
                                                        null
                                                }
                                            </ScrollView>
                                        </View>
                                    </View>

                                </Modal>


                                {/*Container Contains Empty Field, DRIVER,ASSOCIATE and Both */}
                                <ScrollView
                                    persistentScrollbar={true}
                                    style={[Styles.marV10]}>
                                    {
                                       AttendenceResponse.status === 'ATTENDANCE_MARKED'
                                            ?
                                            null
                                            :
                                            <View>
                                                {
                                                   AttendenceResponse.userRole >= 15
                                                        ? null
                                                        :
                                                        AttendenceResponse.userRole === 10
                                                            //both ODOMETER and PACKAGE COUNT
                                                            ?
                                                            <View>
                                                                {this.DriverCollected()}
                                                                {this.AssociateCollected()}
                                                            </View>
                                                            :
                                                            AttendenceResponse.userRole === 5 //only ODOMETER READINGS
                                                                ?
                                                                this.DriverCollected()
                                                                :
                                                                AttendenceResponse.userRole === 1 //only PACKAGES COUNT
                                                                    ?
                                                                    this.AssociateCollected()
                                                                    :
                                                                    null
                                                }

                                                {/* CASH COLLECTED*/}
                                                {
                                                    (AttendenceResponse.userRole === 1 || AttendenceResponse.userRole === 10) && (AttendenceResponse.status === 'SHIFT_ENDED' || AttendenceResponse.status === "SHIFT_ENDED_BY_SUPERVISOR")
                                                            ?
                                                            this.CashCollected()
                                                            :
                                                            null
                                                }

                                                {/* FLATLIST FOR SUPERVISOR DETAILS VIEW */}
                                                {this.state.SupervisorDetails
                                                    ?
                                                    this.state.SupervisorDetails.length === 0 || this.state.SupervisorDetails === null
                                                        ?
                                                        <Card.Title theme={theme}
                                                                    style={[Styles.marV5, Styles.bgWhite,Styles.ffMbold]}
                                                                    title="No Supervisor assigned"
                                                                    left={() => <Avatar.Icon icon="contact-phone"
                                                                                             size={55}
                                                                                             style={[Styles.aslCenter, Styles.p5]}/>}
                                                        />
                                                        :
                                                        <View>
                                                            <FlatList
                                                                style={[Styles.mTop10, Styles.marH10]}
                                                                data={this.state.SupervisorDetails}
                                                                renderItem={({item}) => Services.getSupervisorList(item, 'summary')}
                                                                extraData={this.state}
                                                                keyExtractor={(item, index) => index.toString()}/>
                                                        </View>
                                                    :
                                                    null
                                                }
                                            </View>
                                    }
                                </ScrollView>


                            </View>


                        </View>
                        :
                        <CSpinner/>
                }
            </View>
        );
    }
}

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
    inline: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 5,
        padding: 8
    }
});
