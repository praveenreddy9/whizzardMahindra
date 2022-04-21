import React, {Component} from 'react';
import Utils from "./Utils";
import {default as navigate, withNavigation} from 'react-navigation';

 class ErrorHandling extends React.Component {

     static navigationOptions = {
         header:null
     }

    constructor(properties) {
        super(properties);
        this.state = {};
        const {navigate} = this.props.navigation;

    }

    componentDidMount(): void {
        const {navigate} = this.props.navigation;
    }

    static errorHandling(error) {
        const self = this;
        console.log("Error", error);
        if (error.response) {
            if (error.response.status === 403) {
                Utils.dialogBox("Token Expired,Please Login Again", '');
                self.props.navigation.navigate('Login');
            } else if (error.response.status === 500) {
                Utils.dialogBox(error.response.data.message, '');
                self.props.navigation.navigate('Login');
            } else if (error.response.status === 400) {
                Utils.dialogBox(error.response.data.message, '');
            } else {
                Utils.dialogBox("Something went wrong! Please try again", '');
                self.removeToken();
            }
        } else {
            Utils.dialogBox(error.message, '');
            navigate.navigate('Login');
        }
    }

    render(): React.ReactElement<any> | string | number | {} | React.ReactNodeArray | React.ReactPortal | boolean | null | undefined {
        const { navigate } = this.props.navigation;
    }

 }

export default withNavigation(ErrorHandling);


