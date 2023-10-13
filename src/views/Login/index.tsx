import {Button, Input, Stack} from 'native-base';
import React, {useContext, useState} from 'react';
import {SafeAreaView, ScrollView, StatusBar} from 'react-native';

import {Colors, Header} from 'react-native/Libraries/NewAppScreen';
import AppContext from '../../Context';

function Login(): JSX.Element {
  const backgroundStyle = {
    backgroundColor: Colors.lighter,
  };

  const [loginInfo, setLoginInfo] = useState({userName: '', password: ''});

  const {signIn} = useContext(AppContext);

  const handleChangeUserName = (e: any) => {
    setLoginInfo({...loginInfo, userName: e});
  };

  const handleChangePassword = (e: any) => {
    setLoginInfo({...loginInfo, password: e});
  };

  const handleLogin = () => {
    signIn({userName: loginInfo?.userName, password: loginInfo?.password});
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <Stack space={4} w="75%" maxW="300px" mx="auto">
          <Input
            placeholder="User name"
            w="100%"
            onChangeText={handleChangeUserName}
          />
          <Input
            placeholder="Password"
            w="100%"
            onChangeText={handleChangePassword}
            type="password"
          />
          <Button w="100%" onPress={handleLogin}>
            Login
          </Button>
        </Stack>
      </ScrollView>
    </SafeAreaView>
  );
}

export default Login;
