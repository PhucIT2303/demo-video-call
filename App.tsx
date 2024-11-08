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
  Switch,
} from 'react-native';
import {PermissionsAndroid, Platform} from 'react-native';
import {
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
  ConnectionStateType,
  BackgroundSourceType,
  IRtcEngineEventHandler,
} from 'react-native-agora';
import RNFS from 'react-native-fs';
import protoRoot from './src/protobuf/SttMessage_es6.js';

const appId = '2cc6aa6239b24592ba07383541cfad5d';
// const channelName = 'demo';
// const token =
//   '007eJxTYMhbydOyckXsyTcO8ZXPhf+p7dIxOpcpdeuX75o7LJ+VbJcrMKQYmKaYmVimJloapJgkWqQlmVoaWRibmlkaJSaZGpmk3T6qkdoQyMgQtPQQIyMDBIL4LAwFGaXJDAwAjxIgcA==';
// const uid = 0;

const mode = 'mix';

// const userID = '1697272366';

const {height} = Dimensions.get('screen');

const App = () => {
  const agoraEngineRef = useRef<IRtcEngine>(); // Agora engine instance
  const eventHandler = useRef<IRtcEngineEventHandler>();
  const [isJoined, setIsJoined] = useState(false); // Indicates if the local user has joined the channel
  const [remoteUid, setRemoteUid] = useState(0); // Uid of the remote user
  const [message, setMessage] = useState(''); // Message to the user
  const [userID, setUserID] = useState('0'); // Uid of the remote user
  const [channelName, setChannelName] = useState(''); // Uid of the remote user
  const [rtcToken, setRtcToken] = useState('');
  const [localUID, setLocalUID] = useState(0);
  const [startObject, setStartObject] = useState({
    resource_id: '',
    sid: '',
  });
  const [isRecording, setIsRecording] = useState(false);
  const [patienID, setPatienID] = useState('');
  const [doctorID, setDoctorID] = useState('');
  const [isHost, setIsHost] = useState(true);
  const [transcriptionText, setTranscriptionText] = useState('');

  // const onStreamMessage = (uid: any, stream: any) => {
  //   // Use Protobuf to decode the received data stream
  //   let textstream = protoRoot.Agora.SpeechToText.lookup('Text').decode(stream);
  //   console.log('**** test textstream', textstream);
  // };

  useEffect(() => {
    // Initialize Agora engine when the app starts
    console.log('**** test setupVideoSDKEngine Initialize');
    setupVideoSDKEngine();

    return () => {
      agoraEngineRef.current?.unregisterEventHandler(eventHandler.current!);
      agoraEngineRef.current?.release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (eventHandler.current) {
      // eventHandler.current.onUserJoined = (connection, uid) => {
      //   console.log('**** test onUserJoined callback@@@@: ', uid);
      //   if (remoteUid === 0) {
      //     setRemoteUid(uid);
      //   }
      // };
    }
  }, [remoteUid]);

  const setupVideoSDKEngine = async () => {
    try {
      // use the helper function to get permissions
      if (Platform.OS === 'android') {
        await getPermission();
      }
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;
      eventHandler.current = {
        onJoinChannelSuccess: () => {
          console.log('onJoinChannelSuccess');
          showMessage('Successfully joined the channel ' + channelName);
          setIsJoined(true);
        },
        onUserJoined: (_connection, Uid) => {
          console.log('Remote user joined with _connection: ', _connection);
          console.log('Remote user joined with uid Uid: ', Uid);
          showMessage('Remote user joined with uid ' + Uid);
          if (Uid !== 1 && Uid !== 2) {
            setRemoteUid(Uid);
          }
        },
        onUserOffline: (_connection, Uid) => {
          console.log('@@Remote user left the channel. uid: ', Uid);
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
        onStreamMessage(connection, remoteUid, streamId, data) {
          console.log('**** test onStreamMessage', data);
          let textstream =
            protoRoot.Agora.SpeechToText.lookup('Text').decode(data);
          console.log('---text stream: ', textstream.words);
          setTranscriptionText(textstream.words[0]?.text);
        },
      };
      agoraEngine.registerEventHandler(eventHandler.current);
      agoraEngine.initialize({
        appId: appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });
      agoraEngine.enableVideo();
    } catch (e) {
      console.log(e);
    }
  };

  const setImageBackground = async () => {
    const backgroundSourceType = BackgroundSourceType.BackgroundImg;

    const url =
      'https://skooc-dev-static.s3.ap-south-1.amazonaws.com/common/background.jpg';

    const filePath = `${RNFS.DocumentDirectoryPath}/background.jpg`;

    RNFS.downloadFile({
      fromUrl: url,
      toFile: filePath,
      background: true, // Enable downloading in the background (iOS only)
      discretionary: true, // Allow the OS to control the timing and speed (iOS only)
      progress: res => {
        // Handle download progress updates if needed
        const progress = (res.bytesWritten / res.contentLength) * 100;
        console.log(`Progress: ${progress.toFixed(2)}%`);
      },
    })
      .promise.then(async response => {
        console.log('File downloaded!', response);
      })
      .catch(err => {
        console.log('Download error:', err);
      });

    const code = agoraEngineRef.current?.enableVirtualBackground(
      true,
      {
        background_source_type: backgroundSourceType,
        source: filePath,
      },
      {},
    );
    console.log('**** test result', code);
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

      // setImageBackground();

      // agoraEngineRef.current?.joinChannelWithUserAccount(
      //   token,
      //   channelName,
      //   userID,
      //   {
      //     clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      //   },
      // );
      agoraEngineRef.current?.startPreview();
      if (isHost) {
        agoraEngineRef.current?.joinChannelWithUserAccount(
          token,
          channelName,
          userID,
          {
            clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          },
        );
      } else {
        agoraEngineRef.current?.joinChannelWithUserAccount(
          token,
          channelName,
          userID,
          {
            clientRoleType: ClientRoleType.ClientRoleAudience,
          },
        );
      }
    } catch (e) {
      console.log(e);
    }
  };

  const onStartTranscription = async () => {
    const newParams = {
      instance_id: channelName,
    };

    const transcriptionRes = await axios.post(
      'https://dev-api.sevenrone.online/api/v1/recording_transcriptions/acquire_resource',
      newParams,
    );

    console.log('**** test transcriptionRes', transcriptionRes);
    const tokenName = transcriptionRes?.data?.token_name;

    const params = {
      channel_name: channelName,
      user_id: userID,
      mode: mode,
      token_name: tokenName,
      doctor_id: doctorID,
      patient_id: patienID,
    };
    axios
      .post(
        'https://dev-api.sevenrone.online/api/v1/recording_transcriptions/start',
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
  };

  const leave = () => {
    const params = {
      channel_name: channelName,
      user_id: userID,
      mode: mode,
      resource_id: startObject?.resource_id || '',
      sid: startObject?.sid,
      doctor_id: doctorID,
      patient_id: patienID,
    };
    try {
      agoraEngineRef.current?.leaveChannel();
      axios
        .post(
          'https://dev-api.sevenrone.online/api/v1/recording_transcriptions/stop',
          params,
        )
        .then(res => {
          console.log('STOP response: ', res.data);
          setIsRecording(false);
        })
        .catch(err => {
          console.log(err?.response?.data);
        });
      setRemoteUid(0);
      setIsJoined(false);
      setTranscriptionText('');
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

  const onChangePatienID = (text: string) => {
    setPatienID(text);
  };

  const onChangeDoctorID = (text: string) => {
    setDoctorID(text);
  };
  console.log('**** test remoteUid', remoteUid);
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
          <View style={styles.textInfoContainer}>
            <Text style={styles.textInfo}>{transcriptionText}</Text>
          </View>
          <View style={styles.btnContainer}>
            <Text onPress={join} style={styles.button}>
              Join
            </Text>
            <Text onPress={onStartTranscription} style={styles.button}>
              Transcription
            </Text>
            <Text onPress={leave} style={styles.button}>
              Leave
            </Text>
          </View>

          {isJoined ? (
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
              <View style={styles.switchContainer}>
                <View style={styles.switchItem}>
                  <Text style={{color: 'black'}}>Audience</Text>
                  <Switch
                    onValueChange={switchValue => {
                      setIsHost(switchValue);
                      if (isJoined) {
                        leave();
                      }
                    }}
                    value={isHost}
                  />
                  <Text style={{color: 'black'}}>Host</Text>
                </View>
              </View>
              <Text style={styles.textCenter}>
                Waiting for a remote user to join
              </Text>
              <View>
                <Text>User</Text>
                <TextInput
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
                  onChangeText={onChangeChannelName}
                  style={{
                    padding: 10,
                    backgroundColor: 'white',
                    color: 'black',
                  }}
                />
              </View>

              <View>
                <Text>Doctor ID</Text>
                <TextInput
                  onChangeText={onChangeDoctorID}
                  style={{
                    padding: 10,
                    backgroundColor: 'white',
                    color: 'black',
                  }}
                />
              </View>

              <View>
                <Text>Patient ID</Text>
                <TextInput
                  onChangeText={onChangePatienID}
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
  textInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  head: {fontSize: 20},
  info: {backgroundColor: '#ffffe0', color: '#0000ff'},
  infoContent: {position: 'absolute', top: 100, zIndex: 9},
  textInfo: {
    fontWeight: 'bold',
    margin: 1,
    color: '#0055cc',
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
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
