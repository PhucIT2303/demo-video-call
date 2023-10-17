import axios from 'axios';
import React, {useRef, useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import {PermissionsAndroid, Platform} from 'react-native';
import {
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
  ConnectionStateType,
  ConnectionChangedReasonType,
} from 'react-native-agora';

const appId = 'd05d649ea90d4a8fb592835692ab524f';
// const channelName = 'demo';
const token =
  '007eJxTYMhbydOyckXsyTcO8ZXPhf+p7dIxOpcpdeuX75o7LJ+VbJcrMKQYmKaYmVimJloapJgkWqQlmVoaWRibmlkaJSaZGpmk3T6qkdoQyMgQtPQQIyMDBIL4LAwFGaXJDAwAjxIgcA==';
const uid = 0;

// const userID = '1697272366';

const {height} = Dimensions.get('screen');

const App = () => {
  const agoraEngineRef = useRef<IRtcEngine>(); // Agora engine instance
  const [isJoined, setIsJoined] = useState(false); // Indicates if the local user has joined the channel
  const [remoteUid, setRemoteUid] = useState(0); // Uid of the remote user
  const [message, setMessage] = useState(''); // Message to the user
  const [userID, setUserID] = useState(''); // Uid of the remote user
  const [channelName, setChannelName] = useState(''); // Uid of the remote user
  const [rtcToken, setRtcToken] = useState('');
  const [localUID, setLocalUID] = useState(0);
  const [startObject, setStartObject] = useState({
    resource_id: '',
    sid: '',
  });
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Initialize Agora engine when the app starts
    console.log('**** test setupVideoSDKEngine Initialize');
    setupVideoSDKEngine();
  }, []);

  // useEffect(() => {
  //   const params = {channel_name: channelName, user_id: userID};
  //   console.log('**** test params token', params);
  //   axios
  //     .post(
  //       'https://dev-api.sevenrone.online/api/v1/recordings/rtc_token',
  //       params,
  //     )
  //     .then(res => {
  //       console.log('get rtcToken: ', res.data.rtc_token);
  //       setRtcToken(res?.data?.rtc_token);
  //     })
  //     .catch(err => {
  //       console.log(err);
  //     });
  //   // axios
  //   //   .get('https://dev-api.sevenrone.online/api/v1/platforms')
  //   //   .then(res => {
  //   //     console.log('rtcToken: ', res.data.records[0].token);
  //   //     setRtcToken(res.data.records[0].token);
  //   //   })
  //   //   .catch(err => {
  //   //     console.log(err);
  //   //   });
  // }, [userID]);

  const setupVideoSDKEngine = async () => {
    try {
      // use the helper function to get permissions
      if (Platform.OS === 'android') {
        await getPermission();
      }
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;
      agoraEngine.registerEventHandler({
        onJoinChannelSuccess: () => {
          console.log('onJoinChannelSuccess');
          showMessage('Successfully joined the channel ' + channelName);
          setIsJoined(true);
        },
        onUserJoined: (_connection, Uid) => {
          console.log('Remote user joined with _connection: ', _connection);
          console.log('Remote user joined with uid Uid: ', Uid);
          showMessage('Remote user joined with uid ' + Uid);
          setRemoteUid(Uid);
        },
        onUserOffline: (_connection, Uid) => {
          showMessage('Remote user left the channel. uid: ' + Uid);
          setRemoteUid(0);
        },
        onConnectionStateChanged(connection, state, reason) {
          setLocalUID(connection?.localUid || 0);
          console.log('connection: ', connection);
          console.log('state: ', state);
          console.log('reason: ', reason);
          switch (state) {
            case ConnectionStateType.ConnectionStateDisconnected:
              console.log('status connection: ', 'ConnectionStateDisconnected');
              break;
            case ConnectionStateType.ConnectionStateConnecting:
              console.log('status connection: ', 'ConnectionStateConnecting');
              break;
            case ConnectionStateType.ConnectionStateConnected:
              console.log('status connection: ', 'ConnectionStateConnected');
              break;
            case ConnectionStateType.ConnectionStateReconnecting:
              console.log('status connection: ', 'ConnectionStateReconnecting');
              break;
            case ConnectionStateType.ConnectionStateFailed:
              console.log('status connection: ', 'ConnectionStateFailed');
              break;
            default:
              console.log('status connection: ', state);
              break;
          }
        },
        onRtcStats(connection, stats) {
          // console.log('onRtcStats connection: ', connection);
          // console.log('onRtcStats state: ', stats);
        },
      });
      agoraEngine.initialize({
        appId: appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });
      agoraEngine.enableVideo();
    } catch (e) {
      console.log(e);
    }
  };

  const join = async () => {
    if (isJoined) {
      return;
    }
    try {
      const paramsToken = {channel_name: channelName, user_id: userID};
      console.log('**** test params', paramsToken);
      const res = await axios.post(
        'https://dev-api.sevenrone.online/api/v1/recordings/rtc_token',
        paramsToken,
      );
      // .then(res => {
      //   console.log('get rtcToken: ', res.data.rtc_token);
      //   setRtcToken(res?.data?.rtc_token);
      // })
      // .catch(err => {
      //   console.log(err);
      // });

      if (!res?.data?.rtc_token || res?.data?.rtc_token === '') {
        console.log('*** test error', res?.data);

        throw showMessage('ERROR');
      }

      showMessage('');

      const token = res?.data?.rtc_token;

      setRtcToken(res?.data?.rtc_token);

      console.log('***** test rtcToken userID', userID, token);
      agoraEngineRef.current?.setChannelProfile(
        ChannelProfileType.ChannelProfileCommunication,
      );

      agoraEngineRef.current?.startPreview();
      agoraEngineRef.current?.joinChannelWithUserAccount(
        token,
        channelName,
        userID,
        {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        },
      );
      const params = {
        channel_name: channelName,
        user_id: userID,
        mode: 'individual',
        rtc_token: token,
      };
      console.log('**** test params start', params);

      // agoraEngineRef.current?.joinChannel(
      //   rtcToken,
      //   channelName,
      //   parseInt(userID),
      //   {
      //     clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      //   },
      // );
      axios
        .post(
          'https://dev-api.sevenrone.online/api/v1/recordings/start',
          params,
        )
        .then(res => {
          console.log('START setStartObject: ', res.data);
          setStartObject({...res?.data});
          setIsRecording(true);
        })
        .catch(err => {
          console.log('err.message start:  ', err?.response);
          throw showMessage('ERROR');
        });
    } catch (e) {
      console.log(e);
    }
  };

  const leave = () => {
    const params = {
      channel_name: channelName,
      user_id: userID,
      mode: 'individual',
      resource_id: startObject?.resource_id || '',
      sid: startObject?.sid,
    };

    console.log('**** test params stop', params);
    try {
      agoraEngineRef.current?.leaveChannel();
      axios
        .post('https://dev-api.sevenrone.online/api/v1/recordings/stop', params)
        .then(res => {
          console.log('STOP setStartObject: ', res.data);
          // setStartObject({...res?.data});
          setIsRecording(false);
        })
        .catch(err => {
          console.log(err?.response?.data);
        });
      setRemoteUid(0);
      setIsJoined(false);
      showMessage('You left the channel');
    } catch (e) {
      console.log(e);
      throw showMessage('ERROR');
    }
  };

  const onChangeUser = (text: string) => {
    setUserID(text);
  };

  const onChangeChannelName = (text: string) => {
    setChannelName(text);
  };

  return (
    <SafeAreaView style={styles.main}>
      <TouchableOpacity
        activeOpacity={1}
        style={{flex: 1}}
        onPress={Keyboard.dismiss}>
        {remoteUid !== 0 && (
          <View style={styles.infoContent}>
            <Text style={styles.textInfo}>Local user uid: {userID}</Text>
            <Text style={styles.textInfo}>Remote user uid: {remoteUid}</Text>
            <Text style={styles.textInfo}>
              {isRecording ? 'Recording' : 'record Stoped'}
            </Text>
          </View>
        )}
        <View style={styles.scroll}>
          <View style={styles.btnContainer}>
            <Text onPress={join} style={styles.button}>
              Join
            </Text>
            <Text onPress={leave} style={styles.button}>
              Leave
            </Text>
          </View>
          {/* {isJoined && remoteUid === 0 ? (
            <React.Fragment key={0}>
              <RtcSurfaceView
                canvas={{uid: 0}}
                style={styles.videoViewMini}
                zOrderMediaOverlay
                zOrderOnTop
              />
            </React.Fragment>
          ) : (
            !isJoined && (
              <>
                <Text style={styles.textCenter}>Join a channel</Text>
              </>
            )
          )} */}
          {!isJoined && (
            <>
              <Text style={styles.textCenter}>Join a channel</Text>
            </>
          )}
          {isJoined && remoteUid !== 0 ? (
            <React.Fragment key={remoteUid}>
              <RtcSurfaceView
                canvas={{uid: remoteUid}}
                style={styles.videoView}
              />
            </React.Fragment>
          ) : (
            <>
              <Text style={styles.textCenter}>
                Waiting for a remote user to join
              </Text>
              <View>
                <Text>User</Text>
                <TextInput
                  editable
                  multiline
                  numberOfLines={4}
                  maxLength={40}
                  onChangeText={onChangeUser}
                  style={{
                    padding: 10,
                    backgroundColor: 'white',
                    color: 'black',
                  }}
                />
              </View>

              <View>
                <Text>Channel</Text>
                <TextInput
                  editable
                  multiline
                  numberOfLines={4}
                  maxLength={40}
                  onChangeText={onChangeChannelName}
                  style={{
                    padding: 10,
                    backgroundColor: 'white',
                    color: 'black',
                  }}
                />
              </View>
            </>
          )}
          {remoteUid === 0 && !!message && (
            <Text style={[styles.info, styles.textCenter]}>{message}</Text>
          )}
          {
            <Text style={[styles.info, styles.textCenter]}>
              {isRecording ? 'Recording' : 'Stoped record'}
            </Text>
          }
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );

  function showMessage(msg: string) {
    setMessage(msg);
  }
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 25,
    paddingVertical: 4,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#0055cc',
    margin: 5,
  },
  main: {flex: 1},
  scroll: {
    flex: 1,
    backgroundColor: '#ddeeff',
    width: '100%',
  },
  scrollContainer: {alignItems: 'center'},
  videoView: {flex: 1},
  videoViewMini: {
    width: 150,
    height: height / 4,
    top: 50,
    right: 10,
    position: 'absolute',
    zIndex: 10,
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  head: {fontSize: 20},
  info: {backgroundColor: '#ffffe0', color: '#0000ff'},
  infoContent: {position: 'absolute', top: 100, zIndex: 9},
  textInfo: {
    fontWeight: 'bold',
    margin: 1,
  },
  textCenter: {
    textAlign: 'center',
  },
  input: {
    height: 40,
    width: '100%',
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});

const getPermission = async () => {
  if (Platform.OS === 'android') {
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]);
  }
};

export default App;
