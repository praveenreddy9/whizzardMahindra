import React from 'react';
import {View, Modal, StyleSheet, TouchableOpacity, Dimensions, ScrollView, FlatList, Linking} from 'react-native';
import {Styles} from "./Styles";
import {Avatar, Card, Title} from "react-native-paper";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import _ from "lodash";
import FastImage from "react-native-fast-image";
import {CDismissButton} from "./CDismissButton";
import Services from "./Services";


const SupervisorsModal = ({children, visible, closeModal, siteName, title, buttonVisible, buttonClick, buttonText, closeButton}) => {

    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={closeModal}>
            <View style={[Styles.modalfrontPosition]}>
                <TouchableOpacity onPress={closeModal} style={[Styles.modalbgPosition]}>
                </TouchableOpacity>

                <View
                    style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, {width: Dimensions.get('window').width - 20}]}>
                    <Card.Content style={[Styles.aslCenter, Styles.p5, Styles.pBtm18]}>
                        <FontAwesome name='phone' size={70} color="orange"
                                     style={[Styles.aslCenter, Styles.p10]}/>
                        {
                            siteName
                                ?
                                <Title
                                    style={[Styles.cBlk, Styles.f18, Styles.ffMbold, Styles.aslCenter]}>{siteName} Site</Title>
                                :
                                null
                        }
                        <Title
                            style={[Styles.cBlk, Styles.f18, Styles.ffMbold, Styles.aslCenter]}>Site Supervisor(s)</Title>
                    </Card.Content>
                    {
                        children ?
                            children.length === 0
                                ?
                                <Card.Title
                                    style={[Styles.marV5, Styles.bgWhite, Styles.ffMbold]}
                                    // subtitle="site supervisor"
                                    title="No Supervisor assigned"
                                    left={() => <Avatar.Icon icon="contact-phone" size={40}
                                                             style={[Styles.aslCenter, Styles.p5]}/>}
                                />
                                :
                                <ScrollView
                                    persistentScrollbar={true}
                                    showsHorizontalScrollIndicator={true}
                                    style={[{height: children.length === 1 ? 80 : children.length === 2 ? 165 : Dimensions.get('window').height / 2.5}]}>
                                    <FlatList
                                        data={children}
                                        renderItem={({item}) => Services.getSupervisorList(item)}
                                        extraData={this.state}
                                        keyExtractor={(item, index) => index.toString()}/>
                                </ScrollView>
                            : <Card.Title
                                style={[Styles.marV5, Styles.bgWhite, Styles.ffMbold]}
                                // subtitle="site supervisor"
                                title="No Supervisor assigned"
                                left={() => <Avatar.Icon icon="contact-phone" size={40}
                                                         style={[Styles.aslCenter, Styles.p5]}/>}
                            />
                    }
                    <CDismissButton onPress={closeModal} showButton={'dismiss'}/>
                </View>
            </View>
        </Modal>
    );
};


const styles = StyleSheet.create({})

export {SupervisorsModal};