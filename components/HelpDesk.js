import * as React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    FlatList,
    Modal,
    Dimensions,
    TextInput,
    Keyboard,
    Button,
    Picker,
    Alert,
    Image,
    ActivityIndicator, StyleSheet
} from "react-native";
import {Appbar, DefaultTheme, RadioButton, Title,} from "react-native-paper";
import OneSignal from "react-native-onesignal";
import HomeScreen from './HomeScreen';
import {CSpinner, LoadSVG, Styles,LoadImages} from "./common";
import Utils from './common/Utils';
import OfflineNotice from "./common/OfflineNotice";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import ImageZoom from "react-native-image-pan-zoom";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import Services from "./common/Services";
import _ from "lodash";


const colors = ['#D6D1B4', '#F3F2F2', '#FFEE93', '#ccf6d8', '#ECF3AB', '#F8F1EC', '#F4EDAB'];

const theme = {
    ...DefaultTheme,
    fonts: {
        ...DefaultTheme.fonts,
        regular: 'Muli-Regular',
    },
    colors: {
        ...DefaultTheme.colors,
        text: '#233167',
        primary: '#233167', fontWeight: 'bold'
    },

};

const windowWidth = Dimensions.get('window').width;

export default class HelpDesk extends React.Component {

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

            //latest
            imagePreview: false,
            imagePreviewURL: '',
            imageRotate: '0',

            noteDenominationList:[
                {noteName:2000,count:0,total:0},
                {noteName:500,count:0,total:0},
                {noteName:200,count:0,total:0},
                {noteName:100,count:0,total:0},
                {noteName:50,count:0,total:0},
                {noteName:20,count:0,total:0},
                {noteName:10,count:0,total:0},
                {noteName:5,count:0,total:0},
                {noteName:2,count:0,total:0},
                {noteName:1,count:0,total:0},
                // {noteName:8999,count:0,total:0},
            ],
            showDenominationModal:false,

        }
    }

    componentDidMount() {
        const self = this;

    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
        console.log("trip summary report error", error, error.response);
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
                Utils.dialogBox("Error loading Shifts, Please contact Administrator ", '');
            }
        } else {
            self.setState({spinnerBool: false});
            Utils.dialogBox(error.message, '');
        }
    }




    render() {
        const {noteDenominationList} = this.state;
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                {this.renderSpinner()}
                <OfflineNotice/>


                <View
                    style={[[Styles.flex1, Styles.bgWhite]]}>
                    <Appbar.Header style={[Styles.bgDarkRed, Styles.padV5]}>
                        <Appbar.Content
                            style={[Styles.padV5]}
                            subtitleStyle={[Styles.ffLBlack, Styles.cWhite]}
                            title={'Help Desk'}
                            titleStyle={[Styles.ffLBlack]}/>
                    </Appbar.Header>
                    <View style={[Styles.flex1]}>
                        <ScrollView style={[Styles.flex1]}>
                            <View style={[Styles.flex1, Styles.padH10, Styles.mBtm15]}>

                                {/*DATE CARD*/}
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    // onPress={()=>{this.props.navigation.navigate('BankDetailsScreen')}}
                                onPress={()=>{
                                    this.props.navigation.navigate('BankDetailsScreen', {
                                        UserFlow: 'SITE_ADMIN',
                                        UserStatus: "PENDING",
                                        selectedProfileUserID: '',
                                        onFocusPendingItem:''
                                    })
                                }}
                                    style={[Styles.row,Styles.jSpaceBet,Styles.marV10, Styles.OrdersScreenCardshadow, Styles.bgLWhite, Styles.padH5]}>
                                    <View style={[Styles.row, Styles.jSpaceBet, Styles.pBtm3]}>
                                        <Title style={[Styles.cBlk, Styles.f16, Styles.ffMbold]}>Update Bank Details Screen</Title>
                                    </View>
                                    {/*<Title style={[Styles.cBlk, Styles.f16, Styles.ffLBlack]}>{Services.returnDateMonthYearFormat(new Date())}</Title>*/}
                                    {LoadSVG.chevronDown}
                                </TouchableOpacity>



                            </View>
                        </ScrollView>

                    </View>

                </View>

                {/*MODALS START*/}

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

                {/*MODALS END*/}

            </View>
        );
    }
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF'
    },
    card: {
        flex: 1,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#E8E8E8',
        justifyContent: 'center',
        backgroundColor: 'white'
    },
    text: {
        textAlign: 'center',
        fontSize: 50,
        backgroundColor: 'transparent'
    },
    done: {
        textAlign: 'center',
        fontSize: 30,
        color: 'white',
        backgroundColor: 'transparent'
    }
})

