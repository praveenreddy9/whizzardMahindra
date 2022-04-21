import React, {Component} from 'react';
import {
    BackHandler,
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    Appbar, Button,
    DefaultTheme,
} from "react-native-paper";
import {Styles} from "./Styles";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import AsyncStorage from "@react-native-community/async-storage";

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular',
        regular: 'Muli-Bold'
    }
};

export default class ErrorScreen extends React.Component {

    constructor(props) {
        super(props);
        // this.didFocus = props.navigation.addListener('didFocus', payload =>
        //     BackHandler.addEventListener('hardwareBackPress', this.onBack)
        // );

    }

    state = {
        ErrorMessage: ''
    };


    // componentWillUnmount() {
    //     this.didFocus.remove();
    //     this.willBlur.remove();
    //     BackHandler.removeEventListener('hardwareBackPress', this.onBack);
    // }


    // onBack = () => {
    //     console.log('onBack function')
    //     return this.props.navigation.navigate('authNavigator')
    // };

    componentDidMount() {
        // this.willBlur = this.props.navigation.addListener('willBlur', payload =>
        //     BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        // );
        this.ErrorHandler();
    }
    ErrorHandler(){
        this.getErrorMessage().then((Error_Message) => {
            console.log('Error_Message====', Error_Message)
            this.setState({ErrorMessage: Error_Message});
        })
    }

    async getErrorMessage() {
        return await AsyncStorage.getItem('Whizzard:Error_Message');
    }

    async removeToken() {
        try {
            await AsyncStorage.removeItem("Whizzard:Error_Message");
            this.props.navigation.navigate('authNavigator');
            return true;
        } catch (exception) {
            return false;
        }
    }

    render() {
        return (
            <View style={[Styles.flex1, Styles.bgDWhite]}>
                <View style={[Styles.flex1, {justifyContent: 'center', alignSelf: 'center'}]}>
                    <MaterialIcons
                        style={[Styles.aslCenter, Styles.m10, {fontFamily: "Muli-Bold"}]}
                        name="error-outline" size={100} color="#000"/>
                    <View style={Styles.alignCenter}>
                        {this.state.ErrorMessage
                            ?
                            <Text style={[{fontFamily: 'Muli-Bold', paddingHorizontal: 10, fontSize: 18}]}>
                                {this.state.ErrorMessage}
                            </Text>
                            : <Text style={[{fontFamily: 'Muli-Bold', paddingHorizontal: 10, fontSize: 18}]}>
                                "Something went wrong! Please try again"
                            </Text>
                             }

                    </View>
                    <View style={[Styles.alignCenter]}>
                        <Button style={[Styles.aslCenter, Styles.bgOrangeYellow, Styles.marV15, {padding: 5}]}
                            // icon="camera"
                                mode="contained" onPress={() => {
                            this.removeToken()  }}>
                            Reload
                        </Button>
                    </View>
                </View>
            </View>
        )
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

});


