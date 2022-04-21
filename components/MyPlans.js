import React, {Component} from "react";
import {
    View,
    Text,
    StyleSheet, FlatList, TouchableOpacity, Alert,
} from "react-native";
import {Appbar, Card, Colors, DefaultTheme, List} from "react-native-paper";
import Config from "./common/Config";
import Services from "./common/Services";
import Utils from "./common/Utils";
import {CSpinner, CText, LoadSVG, Styles} from "./common";
import OfflineNotice from './common/OfflineNotice';
import {Row, Column as Col} from "react-native-flexbox-grid";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import AsyncStorage from "@react-native-community/async-storage";

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

export class MyPlans extends Component {
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
            plansList:[],
        };
    }


    componentDidMount() {
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            AsyncStorage.getItem('Whizzard:userId').then((userId) => {
                this.setState({userId:userId},()=>{
                    this.getAllPlans()
                })
        });
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        });
    }

    componentWillUnmount() {
        // this.didFocus.remove();
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
        // console.log("screen error", error, error.response);
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


    getAllPlans() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_PLANS;
        const body = {
            // page: 1,
            // size: 10,
            sort: "Name,asc",
            userId:self.state.userId
        };
        // console.log('getAllPlans body', body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("getAllPlans resp200", response.data);
                    self.setState({
                        spinnerBool: false,
                        plansList:response.data.content
                    })
                }
            }, function (error) {
                // console.log('getAllPlans error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    render() {
        const {plansList} =this.state
        return (
            <View style={styles.container}>
                {this.renderSpinner()}
                <OfflineNotice/>
                <Appbar.Header theme={theme} style={styles.appbar}>
                    {/*<Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>*/}
                    <Appbar.Action icon="menu" size={30} onPress={() => {
                        this.props.navigation.openDrawer();
                    }}/>
                    <Appbar.Content title="My Plans"/>
                </Appbar.Header>
                {this.renderSpinner()}
                <View style={{flex: 1, alignItems: 'center', backgroundColor: '#dcdcdc', paddingBottom: 30}}>

                    <Row size={12} nowrap style={[Styles.row, Styles.p10, Styles.alignCenter, Styles.bgOrangeYellow]}>
                        <Col sm={5}>
                            <Text style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Name</Text>
                        </Col>
                        <Col sm={5}>
                            <Text style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Plan</Text>
                        </Col>
                        <Col sm={2}>
                            <Text style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Info</Text>
                        </Col>
                    </Row>
                    <View style={[Styles.row, Styles.aslCenter,]}>
                        {
                            plansList.length > 0 ?
                                <FlatList
                                    style={[Styles.mBtm30]}
                                    data={plansList}
                                    renderItem={({item, index}) => (
                                        <TouchableOpacity
                                            disabled={!item.attrs.planName}
                                            onPress={()=>{Alert.alert(item.attrs.planName)}}>
                                            <Row size={12} nowrap
                                                 style={[Styles.row, Styles.p10, Styles.alignCenter,{
                                                     backgroundColor:((index % 2) === 0 ? '#f5f5f5' : '#fff')
                                                 }
                                                 ]}>
                                                <Col sm={5}>
                                                 <Text  style={[Styles.ffMregular, Styles.f14,Styles.aslStart]}>{item.attrs.userName || '---'}</Text>
                                                </Col>
                                                <Col sm={5}>
                                               <Text  style={[Styles.ffMregular, Styles.f14,Styles.padH1,Styles.aslCenter]}>{item.attrs.planName || '---'}</Text>
                                                </Col>
                                                <Col sm={2}>
                                                    <View style={[Styles.alignCenter]}>
                                                        <FontAwesome name="info-circle" size={26} color="#000" />
                                                    </View>
                                                </Col>
                                            </Row>
                                        </TouchableOpacity>

                                    )}
                                    keyExtractor={(item, index) => index.toString()}
                                    // refreshing={isRefreshing}
                                    // onRefresh={this.handleRefresh}
                                    // onEndReached={this.handleLoadMore}
                                    contentContainerStyle={{paddingBottom: 20}}
                                    onEndReachedThreshold={1}
                                    // ListFooterComponent={this.renderFooter}
                                />
                                :
                                <Text style={[Styles.colorBlue, Styles.f20, Styles.aslCenter, Styles.ffMbold,Styles.pTop20]}>No Plans Found....</Text>
                        }
                    </View>
                </View>
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
