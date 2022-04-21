import React from "react";
import Config from "../common/Config";
import Services from "../common/Services";
import {
    ActivityIndicator, BackHandler,
    Dimensions,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import {Appbar, Button, Card, DefaultTheme, Title} from "react-native-paper";
import {CSpinner, LoadSVG, Styles} from "../common";
import {Column as Col, Row} from "react-native-flexbox-grid";
import Utils from "../common/Utils";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

export default class getUserHistory extends React.Component {

    constructor(props) {
        super(props);
        this.didFocus = props.navigation.addListener('didFocus', payload =>
            BackHandler.addEventListener('hardwareBackPress', this.onBack)
        );
        this.state = {
            data:[],
            spinnerBool: false,
            showPopup: false
        };
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    componentDidMount(): void {
        this.willBlur = this.props.navigation.addListener('willBlur', payload =>
            BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        );
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            const empId = self.props.navigation.state.params.empId;
            const locationData = self.props.navigation.state.params.location;
            // console.log("sadad===>", empId)
            self.setState({empId: empId, location: locationData}, function () {
                self.getSwiggyUserHistory(self.props.navigation.state.params.empId);
            })
        })
    }

    onBack = () => {
        return this.props.navigation.navigate('HomeScreen');

    };

    componentWillUnmount() {
        this.didFocus.remove();
        this.willBlur.remove();
        BackHandler.removeEventListener('hardwareBackPress', this.onBack);
    }

    getSwiggyUserHistory() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_SWIGGY_USER_HISTORY + self.state.empId;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    console.log("res data.content", response);
                    self.setState({
                        data: response.data,
                        spinnerBool: false
                    })
                }
            }, function (error) {
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
                        Utils.dialogBox("Error loading Swiggy Inventory Data, Please contact Administrator ", '');
                    }
                } else {
                    self.setState({spinnerBool: false});
                    Utils.dialogBox(error.message, '');
                }
            })
        })

    }

    render() {
        const {data} = this.state;
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                <Appbar.Header theme={theme} style={[Styles.bgWhite]}>
                    <Appbar.BackAction onPress={() => this.onBack()}/>
                    <Appbar.Content theme={theme} title={ 'Inventory'+ ' : ' + this.state.empId }/>
                    <Button mode="text"
                            onPress={() => this.props.navigation.navigate('postUserData', {
                                empId: this.state.empId,
                                location: this.state.location
                            })}>
                        <Text style={{
                            fontSize: 16,
                            textAlign: 'right',
                            fontWeight: 'bold',
                            color: '#5220f0'
                        }}> Add Entry</Text>
                    </Button>
                </Appbar.Header>
                {this.renderSpinner()}

                <View style={[Styles.padH10]}>
                    <View >
                        <Row size={12} nowrap style={[Styles.row, Styles.p5, Styles.aslCenter, Styles.alignCenter, {
                            marginBottom: 5
                        }]}>
                            <Col sm={4}>
                                <Text style={[Styles.ffMbold, Styles.f16]}>Name</Text>
                            </Col>
                            <Col sm={3}>
                                <Text style={[Styles.ffMbold, Styles.f16]}>Face Masks</Text>
                            </Col>
                            <Col sm={3}>
                                <Text style={[Styles.ffMbold, Styles.f16]}>Sanitizers</Text>
                            </Col>
                            <Col sm={2}>
                            </Col>
                        </Row>
                    </View>
                    {
                        data.length > 0 ?
                            <FlatList
                                data={data}
                                renderItem={({item, index}) => (
                                    <Row size={12}
                                         style={[Styles.p5, Styles.aslCenter, Styles.alignCenter, {
                                             backgroundColor: ((index % 2) === 0 ? '#f5f5f5' : '#fff')
                                         }
                                         ]}>
                                        <Col sm={4}>
                                            <Text
                                                style={[Styles.ffMregular, Styles.f14]}>{item.empName }</Text>
                                        </Col>
                                        <Col sm={3}>
                                            <Text
                                                style={[Styles.ffMregular, Styles.f14]}>{item.faceMasksCount }</Text>
                                        </Col>
                                        <Col sm={3}>
                                            <Text
                                                style={[Styles.ffMregular, Styles.f14]}>{item.sanitizerCount}</Text>
                                        </Col>
                                        <Col sm={2}>
                                            <MaterialIcons name='info-outline' size={25} color='#000' style={[Styles.p5]} onPress={()=>this.setState({itemData:item, showPopup:true})} />
                                        </Col>
                                    </Row>

                                )}
                                keyExtractor={(item, index) => index.toString()}
                                contentContainerStyle={{paddingBottom: 200}}
                            />
                            :
                            <View style={[Styles.aslCenter, Styles.alignCenter, Styles.marV40]}>
                                {LoadSVG.dataNotFound}
                                <Text
                                    style={[Styles.cBlk, Styles.f20, Styles.aslCenter, Styles.ffMregular, Styles.marV20]}>
                                    No data
                                    found..</Text>
                            </View>
                    }
                </View>

                <Modal
                    transparent={true}
                    visible={this.state.showPopup}
                    onRequestClose={() => {
                        this.setState({showPopup: false})
                    }}>
                    <View style={[Styles.bottomModalBg]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({showPopup: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        {this.state.itemData ?
                            <View
                                style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br30, Styles.mBtm20, {width: Dimensions.get('window').width - 60}]}>
                                <View style={[Styles.aslCenter, Styles.p5, Styles.pBtm18]}>
                                    <Title
                                        style={[Styles.cBlk, Styles.f18, Styles.ffMbold, Styles.aslCenter]}>User
                                        Details</Title>
                                </View>
                                <View style={[Styles.aslCenter, Styles.alignCenter]}>
                                    {this.state.itemData.attrs ? Services.getUserProfilePic(this.state.itemData.attrs.profilePicUrl) : null}

                                    <Text style={[style.item]}>Emp Id: <Text
                                        style={[style.itemValue]}>{this.state.itemData.empId}</Text></Text>
                                    <Text style={[style.item]}>Emp Name: <Text
                                        style={[style.itemValue]}>{this.state.itemData.empName}</Text></Text>
                                    <Text style={[style.item]}>Face Masks: <Text
                                        style={[style.itemValue]}>{this.state.itemData.faceMasksCount}</Text></Text>
                                    <Text style={[style.item]}>Sanitizers: <Text
                                        style={[style.itemValue]}>{this.state.itemData.sanitizerCount}</Text></Text>
                                    <Text style={[style.item]}>Grand Total: <Text
                                        style={[style.itemValue]}>{this.state.itemData.grandTotal}</Text></Text>
                                    <Text style={[style.item]}>Longitude: <Text
                                        style={[style.itemValue]}>{this.state.itemData.longitude}</Text></Text>
                                    <Text style={[style.item]}>Latitude: <Text
                                        style={[style.itemValue]}>{this.state.itemData.latitude}</Text></Text>
                                    <Text style={[style.item]}>Date: <Text
                                        style={[style.itemValue]}>{new Date(this.state.itemData.createdAt).toLocaleDateString()}</Text></Text>
                                    <Text style={[style.item]}>Time: <Text
                                        style={[style.itemValue]}>{ new Date(this.state.itemData.createdAt).toLocaleTimeString()}</Text></Text>
                                </View>

                                <TouchableOpacity style={[Styles.marV30]} onPress={() => {
                                    this.setState({showPopup: false})
                                }}>
                                    <View
                                        style={[Styles.p15, Styles.br5, Styles.marH30, {backgroundColor: '#f5f5f5'}]}>
                                        <Text style={[Styles.ffMregular, Styles.f16, {textAlign: 'center'}]}>tap to
                                            dismiss</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            : null}

                    </View>

                </Modal>
            </View>
        );
    }
}
const style = StyleSheet.create({
    item: {
        padding: 4,
        fontFamily:'Muli-Regular'
    },
    itemValue:{
        paddingLeft:5,
        fontWeight:'bold',
        fontSize:16
    }
})
