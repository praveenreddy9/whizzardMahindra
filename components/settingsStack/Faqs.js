import * as React from "react";
import {View, Text, StyleSheet, BackHandler} from "react-native";
import { Appbar, DefaultTheme, Provider as PaperProvider } from "react-native-paper";
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";

const theme = {
  ...DefaultTheme,
  fonts: {
      medium: 'Muli-Regular'
  }
};


export default class Faqs extends React.Component {

  constructor(props) {
    super(props);
    this.props.navigation.addListener(
        'willBlur',() => {
          OneSignal.removeEventListener('received', HomeScreen.prototype.onReceived);
          OneSignal.removeEventListener('opened',HomeScreen.prototype.onOpened.bind(this));
        }
    );
    this.props.navigation.addListener(
        'didFocus',() => {
          OneSignal.addEventListener('received', HomeScreen.prototype.onReceived);
          OneSignal.addEventListener('opened',HomeScreen.prototype.onOpened.bind(this));
        }
    );
  }

  render() {
    return (
      <View>
        <Appbar.Header  theme={theme} style={styles.appbar}>
          <Appbar.BackAction onPress={() => this.props.navigation.goBack()} />
          <Appbar.Content title="FAQs" />
        </Appbar.Header>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: "white"
  }
});
